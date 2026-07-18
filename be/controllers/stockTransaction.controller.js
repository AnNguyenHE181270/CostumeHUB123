const stockTransactionService = require('../services/stockTransaction.service');
const HttpError = require('../models/http-error.model');

const createStockTransaction = async (req, res, next) => {
  try {
    const { transaction, costume } = await stockTransactionService.createStockTransaction(req.body, req.userData.id);
    const message = req.body.type === 'in' ? 'Nhập kho thành công.' : 'Xuất kho thành công.';
    res.status(201).json({ success: true, message, transaction, costume });
  } catch (err) {
    next(err instanceof HttpError ? err : new HttpError(err.message || 'Giao dịch kho thất bại.', 500));
  }
};

const getStockHistory = async (req, res, next) => {
  try {
    const data = await stockTransactionService.getStockHistory(req.query);
    res.status(200).json({ success: true, ...data });
  } catch (err) {
    next(err instanceof HttpError ? err : new HttpError(err.message || 'Lấy lịch sử kho thất bại.', 500));
  }
};

const getStockSummary = async (req, res, next) => {
  try {
    const summary = await stockTransactionService.getStockSummary();
    res.status(200).json({ success: true, summary });
  } catch (err) {
    next(err instanceof HttpError ? err : new HttpError(err.message || 'Lấy tổng hợp kho thất bại.', 500));
  }
};

module.exports = { createStockTransaction, getStockHistory, getStockSummary };
