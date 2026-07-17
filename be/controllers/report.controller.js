const reportService = require('../services/report.service');
const HttpError = require('../models/http-error.model');
// Đảm bảo các model được register trước khi populate
require('../models/category.model');
require('../models/user.model');
require('../models/costume.model');

const getFullReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const data = await reportService.getFullReport(startDate, endDate);
    res.status(200).json(data);
  } catch (err) {
    next(err instanceof HttpError ? err : new HttpError(err.message || 'Lỗi tạo báo cáo tổng hợp', 500));
  }
};

module.exports = { getFullReport };
