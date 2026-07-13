const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },

  filename: (req, file, cb) => {
    cb(
      null,
      Date.now() + path.extname(file.originalname)
    );
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/jpg",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error("Only image files are allowed"),
      false
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
});

const issueFileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/jpg",
    "video/mp4",
    "video/quicktime",
    "video/x-matroska",
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Chỉ chấp nhận các tệp ảnh (jpg, png, webp) và video (mp4, mov, mkv)"), false);
  }
};

const uploadIssue = multer({
  storage,
  fileFilter: issueFileFilter,
});

const uploadIssueMiddleware = (req, res, next) => {
  const uploader = uploadIssue.array("evidence", 5);

  uploader(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_UNEXPECTED_FILE") {
        return res.status(400).json({
          success: false,
          message: "Vượt quá số lượng tệp cho phép. Tối đa 5 tệp (4 ảnh và 1 video)."
        });
      }
      return res.status(400).json({ success: false, message: err.message });
    } else if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
};

upload.uploadIssue = uploadIssueMiddleware;

// Ảnh/video bằng chứng khi staff kiểm tra đồ trả — dùng chung cấu hình với uploadIssue (ảnh + video, tối đa 5 tệp)
const uploadReturnEvidenceMiddleware = (req, res, next) => {
  const uploader = uploadIssue.array("evidence", 5);

  uploader(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_UNEXPECTED_FILE") {
        return res.status(400).json({
          success: false,
          message: "Vượt quá số lượng tệp cho phép. Tối đa 5 tệp (4 ảnh và 1 video)."
        });
      }
      return res.status(400).json({ success: false, message: err.message });
    } else if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
};

upload.uploadReturnEvidence = uploadReturnEvidenceMiddleware;

module.exports = upload;