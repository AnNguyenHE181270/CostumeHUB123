const issueService = require('../services/issue.service');
const HttpError = require('../models/http-error.model');

const createIssue = async (req, res, next) => {
  try {
    const issue = await issueService.createIssue(req.body, req.files || [], req.userData.id, req.userData.role);
    res.status(201).json({ success: true, message: 'Gửi khiếu nại thành công.', issue });
  } catch (err) {
    next(err instanceof HttpError ? err : new HttpError(err.message || 'Tạo yêu cầu khiếu nại thất bại.', 500));
  }
};

const getIssueByRentalId = async (req, res, next) => {
  try {
    const issue = await issueService.getIssueByRentalId(req.params.rentalId, req.userData.id, req.userData.role);
    res.status(200).json({ success: true, issue });
  } catch (err) {
    next(err instanceof HttpError ? err : new HttpError(err.message || 'Lấy thông tin khiếu nại thất bại.', 500));
  }
};

const cancelIssue = async (req, res, next) => {
  try {
    const issue = await issueService.cancelIssue(req.params.id, req.userData.id);
    res.status(200).json({ success: true, message: 'Hủy khiếu nại thành công.', issue });
  } catch (err) {
    next(err instanceof HttpError ? err : new HttpError(err.message || 'Hủy khiếu nại thất bại.', 500));
  }
};

const getAllIssues = async (req, res, next) => {
  try {
    if (!['staff', 'owner'].includes(req.userData.role)) {
      throw new HttpError('Bạn không có quyền thực hiện hành động này.', 403);
    }
    const issues = await issueService.getAllIssues(req.query);
    res.status(200).json({ success: true, issues });
  } catch (err) {
    next(err instanceof HttpError ? err : new HttpError(err.message || 'Lấy danh sách khiếu nại thất bại.', 500));
  }
};

const handleIssue = async (req, res, next) => {
  try {
    if (!['staff', 'owner'].includes(req.userData.role)) {
      throw new HttpError('Bạn không có quyền thực hiện hành động này.', 403);
    }
    const issue = await issueService.handleIssue(req.params.id, req.body, req.files || [], req.userData.id, req.userData.role);
    res.status(200).json({ success: true, message: 'Xử lý khiếu nại thành công.', issue });
  } catch (err) {
    next(err instanceof HttpError ? err : new HttpError(err.message || 'Xử lý khiếu nại thất bại.', 500));
  }
};

module.exports = { createIssue, getIssueByRentalId, cancelIssue, getAllIssues, handleIssue };
