const fs = require('fs');
const Issue = require('../models/issue.model');
const Rental = require('../models/rental.model');
const HttpError = require('../models/http-error.model');
const { uploadIssueMedia } = require('./cloudinary.service');

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

module.exports = { createIssue, getIssueByRentalId, cancelIssue };
