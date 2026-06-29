const fs = require("fs");
const Issue = require("../models/issue.model");
const Rental = require("../models/rental.model");
const HttpError = require("../models/http-error.model");
const { uploadIssueMedia } = require("../services/cloudinary.service");

const createIssue = async (req, res, next) => {
  const files = req.files || [];

  const cleanupFiles = () => {
    for (const file of files) {
      if (fs.existsSync(file.path)) {
        try {
          fs.unlinkSync(file.path);
        } catch (err) {
          console.error("Lỗi khi xóa tệp tạm:", err.message);
        }
      }
    }
  };

  try {
    const { rentalId, reason, resolution, note } = req.body;

    if (!rentalId) {
      cleanupFiles();
      return next(new HttpError("Mã đơn hàng thuê là bắt buộc.", 400));
    }
    if (!reason) {
      cleanupFiles();
      return next(new HttpError("Lý do khiếu nại là bắt buộc.", 400));
    }
    if (!resolution) {
      cleanupFiles();
      return next(new HttpError("Phương thức giải quyết là bắt buộc.", 400));
    }

    let imageCount = 0;
    let videoCount = 0;

    for (const file of files) {
      if (file.mimetype.startsWith("image/")) {
        imageCount++;
      } else if (file.mimetype.startsWith("video/")) {
        videoCount++;
      }
    }

    if (imageCount > 4) {
      cleanupFiles();
      return next(new HttpError("Bạn chỉ được tải lên tối đa 4 ảnh.", 400));
    }
    if (videoCount > 1) {
      cleanupFiles();
      return next(new HttpError("Bạn chỉ được tải lên tối đa 1 video.", 400));
    }

    const rental = await Rental.findById(rentalId);
    if (!rental) {
      cleanupFiles();
      return next(new HttpError("Không tìm thấy đơn hàng thuê tương ứng.", 404));
    }

    const existingIssue = await Issue.findOne({ rentalId });
    if (existingIssue) {
      cleanupFiles();
      return next(new HttpError("Đơn hàng thuê này đã có khiếu nại.", 400));
    }

    const isCustomerOwner = rental.customerId.toString() === req.userData.id;
    const isStaffOrOwner = ["staff", "owner"].includes(req.userData.role);
    if (!isCustomerOwner && !isStaffOrOwner) {
      cleanupFiles();
      return next(new HttpError("Bạn không có quyền thực hiện khiếu nại cho đơn hàng này.", 403));
    }

    const evidenceUrls = [];
    for (const file of files) {
      try {
        const url = await uploadIssueMedia(file.path);
        evidenceUrls.push(url);
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      } catch (uploadError) {
        console.error("Lỗi khi tải lên Cloudinary:", uploadError);
        cleanupFiles();
        return next(new HttpError("Có lỗi xảy ra khi tải ảnh/video lên đám mây.", 500));
      }
    }

    const newIssue = new Issue({
      rentalId,
      reason,
      resolution,
      evidence: evidenceUrls,
      note: note || "",
    });

    await newIssue.save();

    res.status(201).json({
      success: true,
      message: "Gửi khiếu nại thành công.",
      issue: newIssue,
    });
  } catch (err) {
    cleanupFiles();
    return next(new HttpError(err.message || "Tạo yêu cầu khiếu nại thất bại.", 500));
  }
};

const getIssueByRentalId = async (req, res, next) => {
  try {
    const { rentalId } = req.params;
    const issue = await Issue.findOne({ rentalId });
    if (!issue) {
      return res.status(200).json({ success: true, issue: null });
    }

    const rental = await Rental.findById(rentalId);
    if (!rental) {
      return next(new HttpError("Không tìm thấy đơn hàng thuê tương ứng.", 404));
    }

    const isCustomerOwner = rental.customerId.toString() === req.userData.id;
    const isStaffOrOwner = ["staff", "owner"].includes(req.userData.role);
    if (!isCustomerOwner && !isStaffOrOwner) {
      return next(new HttpError("Bạn không có quyền xem khiếu nại cho đơn hàng này.", 403));
    }

    res.status(200).json({
      success: true,
      issue,
    });
  } catch (err) {
    return next(new HttpError(err.message || "Lấy thông tin khiếu nại thất bại.", 500));
  }
};

const cancelIssue = async (req, res, next) => {
  try {
    const { id } = req.params;
    const issue = await Issue.findById(id);
    if (!issue) {
      return next(new HttpError("Không tìm thấy khiếu nại.", 404));
    }

    if (issue.status !== "pending") {
      return next(new HttpError("Chỉ có thể hủy khiếu nại khi ở trạng thái đang chờ xử lý (pending).", 400));
    }

    const rental = await Rental.findById(issue.rentalId);
    if (!rental) {
      return next(new HttpError("Không tìm thấy đơn hàng thuê tương ứng.", 404));
    }

    const isCustomerOwner = rental.customerId.toString() === req.userData.id;
    if (!isCustomerOwner) {
      return next(new HttpError("Bạn không có quyền hủy khiếu nại này.", 403));
    }
    // chuyển trạng thái sang cancelled
    issue.status = "cancelled";
    await issue.save();

    res.status(200).json({
      success: true,
      message: "Hủy khiếu nại thành công.",
      issue
    });
  } catch (err) {
    return next(new HttpError(err.message || "Hủy khiếu nại thất bại.", 500));
  }
};

module.exports = {
  createIssue,
  getIssueByRentalId,
  cancelIssue,
};
