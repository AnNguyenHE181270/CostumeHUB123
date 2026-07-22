const fs = require('fs');
const Issue = require('../models/issue.model');
const Rental = require('../models/rental.model');
const HttpError = require('../models/http-error.model');
const { uploadIssueMedia } = require('./cloudinary.service');
const User = require('../models/user.model');
const Costume = require('../models/costume.model');
const sendEmail = require('./email.service');
const notificationService = require('./notification.service');
const { syncVariantFromInstances, backfillInstancesFromCounts } = require('./costume.service');

const createIssue = async ({ rentalId, reason, resolution, note }, files, userId, userRole) => {
  const cleanupFiles = () => {
    for (const file of files) {
      if (fs.existsSync(file.path)) {
        try { fs.unlinkSync(file.path); } catch (err) { console.error('Lỗi khi xóa tệp tạm:', err.message); }
      }
    }
  };

  if (!rentalId) { cleanupFiles(); throw new HttpError('Mã đơn hàng thuê là bắt buộc.', 400); }
  if (!reason) { cleanupFiles(); throw new HttpError('Lý do khiếu nại là bắt buộc.', 400); }
  if (!resolution) { cleanupFiles(); throw new HttpError('Phương thức giải quyết là bắt buộc.', 400); }

  let imageCount = 0;
  let videoCount = 0;
  for (const file of files) {
    if (file.mimetype.startsWith('image/')) imageCount++;
    else if (file.mimetype.startsWith('video/')) videoCount++;
  }
  if (imageCount > 4) { cleanupFiles(); throw new HttpError('Bạn chỉ được tải lên tối đa 4 ảnh.', 400); }
  if (videoCount > 1) { cleanupFiles(); throw new HttpError('Bạn chỉ được tải lên tối đa 1 video.', 400); }

  const rental = await Rental.findById(rentalId);
  if (!rental) { cleanupFiles(); throw new HttpError('Không tìm thấy đơn hàng thuê tương ứng.', 404); }

  const existingIssue = await Issue.findOne({ rentalId });
  if (existingIssue) { cleanupFiles(); throw new HttpError('Đơn hàng thuê này đã có khiếu nại.', 400); }

  if (rental.status !== 'renting') {
    cleanupFiles();
    throw new HttpError('Đơn hàng chỉ có thể khiếu nại ở trạng thái đang thuê.', 400);
  }

  if (rental.shippingAddress?.addressDetail === 'Nhận tại cửa hàng') {
    cleanupFiles();
    throw new HttpError('Đơn hàng nhận tại cửa hàng không hỗ trợ trả hàng hoàn tiền.', 400);
  }

  if (rental.rentingAt) {
    const threeHoursMs = 3 * 60 * 60 * 1000;
    // Dùng ">" vì chúng ta muốn NÉM LỖI (chặn) khi thời gian đã vượt quá 3 tiếng
    if (Date.now() - new Date(rental.rentingAt).getTime() > threeHoursMs) {
      cleanupFiles();
      throw new HttpError('Đơn hàng đã quá hạn hoàn trả (tối đa 3 tiếng kể từ khi bắt đầu thuê).', 400);
    }
  }

  const isCustomerOwner = rental.customerId.toString() === userId;
  const isStaffOrOwner = ['staff', 'owner'].includes(userRole);
  if (!isCustomerOwner && !isStaffOrOwner) {
    cleanupFiles();
    throw new HttpError('Bạn không có quyền thực hiện khiếu nại cho đơn hàng này.', 403);
  }

  const evidenceUrls = [];
  for (const file of files) {
    try {
      const url = await uploadIssueMedia(file.path);
      evidenceUrls.push(url);
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
    } catch (uploadError) {
      console.error('Lỗi khi tải lên Cloudinary:', uploadError);
      cleanupFiles();
      throw new HttpError('Có lỗi xảy ra khi tải ảnh/video lên đám mây.', 500);
    }
  }

  const newIssue = new Issue({ rentalId, reason, resolution, evidence: evidenceUrls, note: note || '' });
  await newIssue.save();
  return newIssue;
};

const getIssueByRentalId = async (rentalId, userId, userRole) => {
  const issue = await Issue.findOne({ rentalId });
  if (!issue) return null;

  const rental = await Rental.findById(rentalId);
  if (!rental) throw new HttpError('Không tìm thấy đơn hàng thuê tương ứng.', 404);

  const isCustomerOwner = rental.customerId.toString() === userId;
  const isStaffOrOwner = ['staff', 'owner'].includes(userRole);
  if (!isCustomerOwner && !isStaffOrOwner) {
    throw new HttpError('Bạn không có quyền xem khiếu nại cho đơn hàng này.', 403);
  }

  return issue;
};

const cancelIssue = async (id, userId) => {
  const issue = await Issue.findById(id);
  if (!issue) throw new HttpError('Không tìm thấy khiếu nại.', 404);
  if (issue.status !== 'pending') throw new HttpError('Chỉ có thể hủy khiếu nại khi ở trạng thái đang chờ xử lý (pending).', 400);

  const rental = await Rental.findById(issue.rentalId);
  if (!rental) throw new HttpError('Không tìm thấy đơn hàng thuê tương ứng.', 404);
  if (rental.customerId.toString() !== userId) throw new HttpError('Bạn không có quyền hủy khiếu nại này.', 403);

  issue.status = 'cancelled';
  await issue.save();
  return issue;
};

const getAllIssues = async (query) => {
  const { status } = query || {};
  const filter = {};
  if (status && status !== 'all') {
    filter.status = status;
  }
  return Issue.find(filter)
    .populate({
      path: 'rentalId',
      populate: { path: 'customerId', select: 'fullName email phone' }
    })
    .sort({ createdAt: -1 });
};

const handleIssue = async (id, { action, rejectReason }, files, userId, userRole) => {
  const cleanupFiles = () => {
    for (const file of files) {
      if (fs.existsSync(file.path)) {
        try { fs.unlinkSync(file.path); } catch (err) { console.error('Lỗi khi xóa tệp tạm:', err.message); }
      }
    }
  };

  const issue = await Issue.findById(id);
  if (!issue) { cleanupFiles(); throw new HttpError('Không tìm thấy khiếu nại.', 404); }
  if (!['pending', 'escalated'].includes(issue.status)) {
    cleanupFiles();
    throw new HttpError('Khiếu nại đã được xử lý hoặc đã hủy.', 400);
  }

  const rental = await Rental.findById(issue.rentalId);
  if (!rental) { cleanupFiles(); throw new HttpError('Không tìm thấy đơn hàng thuê tương ứng.', 404); }

  // Ràng buộc 1: Nếu đơn hàng > 1tr VNĐ và vai trò là staff:
  // Staff chỉ được phép đẩy lên owner (escalate), không được đồng ý/từ chối!
  if (rental.totalAmount >= 1000000 && userRole === 'staff') {
    if (action !== 'escalate') {
      cleanupFiles();
      throw new HttpError('Đơn hàng có giá trị cao (từ 1 triệu VNĐ), nhân viên phải đẩy lên cho chủ cửa hàng xử lý.', 403);
    }
  }

  // Tải bằng chứng chụp bởi nhân viên / chủ cửa hàng
  const evidenceUrls = [];
  for (const file of files) {
    try {
      const url = await uploadIssueMedia(file.path);
      evidenceUrls.push(url);
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
    } catch (uploadError) {
      console.error('Lỗi khi tải lên Cloudinary:', uploadError);
      cleanupFiles();
      throw new HttpError('Có lỗi xảy ra khi tải ảnh/video lên đám mây.', 500);
    }
  }

  const { notifyOrderStatus } = require('./rental.service');

  if (action === 'escalate') {
    if (userRole !== 'staff') {
      throw new HttpError('Chỉ nhân viên mới có quyền đẩy khiếu nại lên chủ cửa hàng.', 403);
    }
    issue.status = 'escalated';
    issue.rejectEvidence = evidenceUrls; // Lưu hình ảnh/video khi nhận lại đồ từ khách hàng
    await issue.save();
    return issue;
  }

  if (action === 'accept') {
    // 1. Hoàn tiền cọc và tiền thuê vào ví
    const user = await User.findByIdAndUpdate(rental.customerId, { $inc: { balance: rental.totalAmount } }, { new: true });
    if (user) {
    }

    // 2. Thu hồi unit vật lý đã gán cho đơn này — khiếu nại đã được chấp nhận nghĩa là sản phẩm
    // có vấn đề (hư hỏng/khiếu nại), nên đưa vào 'maintenance' để staff kiểm tra trước khi cho thuê lại,
    // không trả thẳng về 'available' như luồng trả hàng bình thường không có khiếu nại.
    for (const item of rental.items) {
      const costume = await Costume.findById(item.costume);
      if (costume) {
        const variant = costume.variants.find((v) => v.size === item.size);
        if (variant) {
          backfillInstancesFromCounts(variant);
          if (item.instanceCodes && item.instanceCodes.length > 0) {
            variant.instances.forEach((inst) => {
              if (item.instanceCodes.includes(inst.unitCode) && inst.status === 'rented') {
                inst.status = 'maintenance';
              }
            });
          } else {
            variant.instances
              .filter((i) => i.status === 'rented')
              .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
              .slice(0, item.quantity)
              .forEach((inst) => { inst.status = 'maintenance'; });
          }
          syncVariantFromInstances(variant);
        }

        // Cập nhật lại status costume tổng thể: còn ít nhất 1 biến thể sẵn sàng -> available;
        // nếu không, còn biến thể đang bảo trì -> maintenance; ngược lại -> out_of_stock.
        const hasAvailableVariant = costume.variants.some(
          (v) => (v.status === 'available' || !v.status) && (v.availableStock || 0) > 0
        );
        const hasMaintenanceVariant = costume.variants.some((v) => v.status === 'maintenance');
        if (hasAvailableVariant) {
          costume.status = 'available';
        } else if (hasMaintenanceVariant) {
          costume.status = 'maintenance';
        } else {
          costume.status = 'out_of_stock';
        }

        await costume.save();
      }
    }

    issue.status = 'accepted';
    await issue.save();

    rental.status = 'completed';
    rental.paymentStatus = 'refunded';
    rental.refundAmount = rental.totalAmount;
    await rental.save();
    await notifyOrderStatus(rental, 'completed');

    try {
      await notificationService.createNotification({
        userId: rental.customerId,
        type: 'issue_refund_accepted',
        title: `Khiếu nại đơn hàng #${rental._id.toString().slice(-6).toUpperCase()}`,
        message: `Đơn của bạn đã được chấp nhận hoàn tiền. Số tiền ${rental.totalAmount.toLocaleString('vi-VN')}đ đã được hoàn vào ví của bạn.`,
        link: '/user/transactions',
        relatedId: rental._id,
      });
    } catch (notifyError) {
      console.error('[Notification Error]', notifyError);
    }

    // Gửi email thông báo cho khách hàng
    try {
      if (user?.email) {
        await sendEmail({
          to: user.email,
          subject: 'CostumeHUB — Khiếu nại đơn hàng đã được chấp nhận',
          text: `Chào ${user.fullName},\n\nKhiếu nại cho đơn hàng ${rental._id} của bạn đã được chấp nhận. Hệ thống đã hoàn trả đầy đủ ${rental.totalAmount.toLocaleString('vi-VN')} đ (bao gồm cả tiền cọc và tiền thuê) vào tài khoản ví của bạn.`,
          html: `<p>Chào <b>${user.fullName}</b>,</p><p>Khiếu nại cho đơn hàng <b>${rental._id}</b> của bạn đã được chấp nhận.</p><p>Hệ thống đã hoàn trả đầy đủ <b>${rental.totalAmount.toLocaleString('vi-VN')} đ</b> (bao gồm tiền cọc và tiền thuê) vào tài khoản ví của bạn.</p>`,
        });
      }
    } catch (mailError) {
      console.error('Lỗi khi gửi email đồng ý khiếu nại:', mailError);
    }

    return issue;
  }

  if (action === 'reject') {
    if (!rejectReason) {
      throw new HttpError('Lý do từ chối khiếu nại là bắt buộc.', 400);
    }
    issue.status = 'rejected';
    issue.rejectReason = rejectReason;
    if (evidenceUrls.length > 0) {
      issue.rejectEvidence = evidenceUrls;
    }
    await issue.save();

    // Giữ đơn hàng ở trạng thái renting
    rental.status = 'renting';
    await rental.save();
    await notifyOrderStatus(rental, 'renting');

    // Gửi email từ chối kèm lý do + ảnh/video
    const user = await User.findById(rental.customerId);
    try {
      if (user?.email) {
        const mediaList = evidenceUrls.map(url => `<li><a href="${url}">${url.endsWith('.mp4') ? 'Xem Video' : 'Xem Ảnh'}</a></li>`).join('');
        await sendEmail({
          to: user.email,
          subject: 'CostumeHUB — Khiếu nại đơn hàng bị từ chối',
          text: `Chào ${user.fullName},\n\nKhiếu nại cho đơn hàng ${rental._id} của bạn đã bị từ chối.\nLý do từ chối: ${rejectReason}\nBằng chứng đính kèm: ${evidenceUrls.join(', ')}`,
          html: `<p>Chào <b>${user.fullName}</b>,</p><p>Khiếu nại cho đơn hàng <b>${rental._id}</b> của bạn đã bị từ chối.</p><p>Lý do từ chối: <span style="color:red">${rejectReason}</span></p><p>Bằng chứng đính kèm từ cửa hàng:</p><ul>${mediaList}</ul>`,
        });
      }
    } catch (mailError) {
      console.error('Lỗi khi gửi email từ chối khiếu nại:', mailError);
    }

    return issue;
  }
};

module.exports = { createIssue, getIssueByRentalId, cancelIssue, getAllIssues, handleIssue };
