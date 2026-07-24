const fs = require('fs');
const Issue = require('../models/issue.model');
const Rental = require('../models/rental.model');
const HttpError = require('../models/http-error.model');
const { uploadIssueMedia } = require('./cloudinary.service');
const User = require('../models/user.model');
const sendEmail = require('./email.service');
const notificationService = require('./notification.service');
const { buildOrderLink, notifyOrderStatus, inspectReturn } = require('./rental.service');

// Thời hạn khách được phép gửi khiếu nại kể từ lúc đơn bắt đầu 'renting' — CỐ Ý tách riêng khỏi
// hằng số 5 tiếng dùng cho auto-confirm-đã-nhận-hàng (autoUpdateDeliveredStatus trong rental.service.js),
// vì đây là 2 chính sách hoàn toàn khác nhau (1 cái xác nhận đã giao hàng, 1 cái là hạn khiếu nại/đổi trả).
// TODO xác nhận lại với chủ shop: 3 tiếng là rất ngắn so với chính sách đổi trả thông thường (thường
// tính bằng ngày) — cân nhắc tăng lên nếu chủ shop muốn khách có nhiều thời gian phát hiện lỗi hơn.
const ISSUE_REPORT_WINDOW_MS = 3 * 60 * 60 * 1000;

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
    // Dùng ">" vì chúng ta muốn NÉM LỖI (chặn) khi thời gian đã vượt quá hạn khiếu nại
    if (Date.now() - new Date(rental.rentingAt).getTime() > ISSUE_REPORT_WINDOW_MS) {
      cleanupFiles();
      throw new HttpError(`Đơn hàng đã quá hạn khiếu nại (tối đa ${ISSUE_REPORT_WINDOW_MS / 3600000} tiếng kể từ khi bắt đầu thuê).`, 400);
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

  // Khách bấm gửi khiếu nại (trả hàng/hoàn tiền) -> đơn vào 'returning' NGAY, không đợi shop duyệt.
  // 'returning' chỉ là cờ vật lý "đơn đang cần xử lý trả hàng" — giống hệt khi khách bấm "Yêu cầu
  // trả hàng" bình thường (requestReturn). Nếu sau đó shop từ chối khiếu nại, handleIssue() sẽ trả
  // đơn về 'renting'. Không ảnh hưởng tồn kho — instances[] chỉ được thu hồi ở inspectReturn.
  rental.status = 'returning';
  await rental.save();
  const { notifyOrderStatus } = require('./rental.service');
  await notifyOrderStatus(rental, 'returning');

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

const getAllIssues = async (query, userRole) => {
  const { status } = query || {};
  const filter = {};
  if (status && status !== 'all') {
    filter.status = status;
  }
  // Owner chỉ thấy khiếu nại staff đã đẩy lên (escalatedAt có giá trị, dù status hiện tại đã
  // accepted/rejected sau khi owner xử lý) — khiếu nại staff tự xử lý trực tiếp (không escalate)
  // không hiển thị ở owner, tránh làm phiền owner với những việc staff đã tự lo được.
  if (userRole === 'owner') {
    filter.escalatedAt = { $ne: null };
  }
  return Issue.find(filter)
    .populate({
      path: 'rentalId',
      populate: [
        { path: 'customerId', select: 'fullName email phone' },
        { path: 'items.costume', select: 'name' }
      ]
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

  if (action === 'escalate') {
    if (userRole !== 'staff') {
      throw new HttpError('Chỉ nhân viên mới có quyền đẩy khiếu nại lên chủ cửa hàng.', 403);
    }
    // Tải bằng chứng nhân viên chụp lúc nhận lại đồ (nếu có) — CHỈ escalate/reject mới cần bằng
    // chứng ngay lúc này; accept không thu thập ảnh ở bước này nữa (xem comment ở nhánh accept).
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
    issue.status = 'escalated';
    issue.rejectEvidence = evidenceUrls;
    issue.escalatedAt = new Date();
    await issue.save();
    return issue;
  }

  if (action === 'accept') {
    if (['completed', 'cancelled'].includes(rental.status)) {
      cleanupFiles();
      throw new HttpError('Đơn hàng đã kết thúc, không thể xử lý khiếu nại này.', 400);
    }
    // "Đồng ý" nghĩa là cửa hàng CHẤP NHẬN khiếu nại và coi như đã nhận lại hàng để hoàn tiền luôn —
    // KHÔNG còn park ở 'returning' chờ 1 bước "Kiểm tra đồ trả" riêng nữa (thiết kế cũ khiến đơn có
    // thể bị kẹt vĩnh viễn ở 'returning' nếu không ai nhớ vào kiểm tra tay). Gọi thẳng inspectReturn()
    // với damageTier mặc định 'none' (không trừ hư hỏng) — nó tự nhận diện đơn có khiếu nại 'accepted'
    // để áp đúng chính sách "hoàn cả tiền thuê + tiền cọc, không tính phí trễ hạn", và lo luôn việc
    // nhả instance kho + đổi rental.status thẳng sang 'completed'.
    cleanupFiles();

    issue.status = 'accepted';
    await issue.save();

    rental.status = 'returning';
    await rental.save();
    await inspectReturn(rental._id, { damageTier: 'none', damagePercent: 0, actualReturnDate: new Date() }, [], userId);

    const user = await User.findById(rental.customerId);
    try {
      await notificationService.createNotification({
        userId: rental.customerId,
        type: 'issue_accepted_awaiting_return',
        title: `Khiếu nại đơn hàng #${rental._id.toString().slice(-6).toUpperCase()}`,
        message: 'Cửa hàng đã chấp nhận khiếu nại của bạn và xử lý hoàn tất. Tiền thuê và tiền cọc sẽ được hoàn qua chuyển khoản trong thời gian sớm nhất.',
        link: '/rental-history',
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
          subject: `CostumeHUB — Khiếu nại đơn hàng #${rental._id.toString().slice(-6).toUpperCase()} đã được chấp nhận`,
          text: `Chào ${user.fullName}, khiếu nại cho đơn hàng #${rental._id.toString().slice(-6).toUpperCase()} của bạn đã được chấp nhận và xử lý hoàn tất. Chúng tôi sẽ hoàn trả đầy đủ tiền thuê và tiền cọc qua tài khoản ngân hàng của bạn trong thời gian sớm nhất.`,
          html: sendEmail.renderEmailHtml({
            heading: 'Khiếu nại của bạn đã được chấp nhận và xử lý hoàn tất',
            badgeText: 'Đã chấp nhận',
            badgeColor: 'success',
            bodyHtml: `
              <p>Khiếu nại cho đơn hàng <b>#${rental._id.toString().slice(-6).toUpperCase()}</b> của bạn đã được cửa hàng chấp nhận và xử lý hoàn tất.</p>
              <p>Chúng tôi sẽ hoàn trả đầy đủ <b>tiền thuê và tiền cọc</b> qua tài khoản ngân hàng của bạn trong thời gian sớm nhất.</p>
            `,
            ctaText: 'Xem đơn hàng',
            ctaUrl: buildOrderLink(rental._id, 'return_refund'),
          }),
        });
      }
    } catch (mailError) {
      console.error('Lỗi khi gửi email đồng ý khiếu nại:', mailError);
    }

    return issue;
  }

  // Tải bằng chứng chụp bởi nhân viên / chủ cửa hàng (nhánh reject)
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
        const mediaList = evidenceUrls.map(url => `<li><a href="${url}" style="color:#111111;">${url.endsWith('.mp4') ? 'Xem Video' : 'Xem Ảnh'}</a></li>`).join('');
        await sendEmail({
          to: user.email,
          subject: `CostumeHUB — Khiếu nại đơn hàng #${rental._id.toString().slice(-6).toUpperCase()} bị từ chối`,
          text: `Chào ${user.fullName}, khiếu nại cho đơn hàng #${rental._id.toString().slice(-6).toUpperCase()} của bạn đã bị từ chối. Lý do: ${rejectReason}. Bằng chứng đính kèm: ${evidenceUrls.join(', ')}`,
          html: sendEmail.renderEmailHtml({
            heading: 'Khiếu nại của bạn đã bị từ chối',
            badgeText: 'Bị từ chối',
            badgeColor: 'danger',
            bodyHtml: `
              <p>Khiếu nại cho đơn hàng <b>#${rental._id.toString().slice(-6).toUpperCase()}</b> của bạn đã bị từ chối.</p>
              <p>Lý do từ chối: <b>${rejectReason}</b></p>
              ${mediaList ? `<p>Bằng chứng đính kèm từ cửa hàng:</p><ul style="padding-left:20px;">${mediaList}</ul>` : ''}
            `,
            ctaText: 'Xem đơn hàng',
            ctaUrl: buildOrderLink(rental._id, 'renting'),
          }),
        });
      }
    } catch (mailError) {
      console.error('Lỗi khi gửi email từ chối khiếu nại:', mailError);
    }

    return issue;
  }
};

module.exports = { createIssue, getIssueByRentalId, cancelIssue, getAllIssues, handleIssue };
