const rentalService = require('../services/rental.service');
const HttpError = require('../models/http-error.model');

const getRentalHistory = async (req, res, next) => {
  try {
    const result = await rentalService.getRentalHistory(req.userData.id);
    res.status(200).json(result);
  } catch (err) {
    next(err instanceof HttpError ? err : new HttpError(err.message || 'Fetching orders failed', 500));
  }
};

const orderDetail = async (req, res, next) => {
  try {
    const result = await rentalService.getOrderDetail(req.params.orderId, req.userData.id);
    res.status(200).json(result);
  } catch (err) {
    next(err instanceof HttpError ? err : new HttpError(err.message || 'Fetching order detail failed', 500));
  }
};

const createOrder = async (req, res, next) => {
  try {
    const order = await rentalService.createOrder(req.userData.id, req.body);
    res.status(201).json({ message: 'Đặt hàng và thanh toán thành công', order });
  } catch (err) {
    next(err instanceof HttpError ? err : new HttpError(err.message || 'Creating order failed', 500));
  }
};

const cancellOrrder = async (req, res, next) => {
  try {
    const order = await rentalService.cancelOrder(req.params.id, req.userData.id, req.body.cancelReason);
    res.status(200).json({ message: 'Hủy đơn hàng thành công', order });
  } catch (err) {
    next(err instanceof HttpError ? err : new HttpError(err.message || 'Cancel order failed', 500));
  }
};

const confirmReceipt = async (req, res, next) => {
  try {
    const order = await rentalService.confirmReceipt(req.params.id, req.userData.id);
    res.status(200).json({ message: 'Xác nhận nhận hàng thành công', order });
  } catch (err) {
    next(err instanceof HttpError ? err : new HttpError(err.message || 'Xác nhận nhận hàng thất bại', 500));
  }
};

const checkAvailability = async (req, res, next) => {
  try {
    const result = await rentalService.checkAvailability(req.body);
    res.status(200).json(result);
  } catch (err) {
    next(err instanceof HttpError ? err : new HttpError('Checking availability failed', 500));
  }
};

const getAllOrders = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const orders = await rentalService.getAllOrders(startDate, endDate);
    res.status(200).json(orders);
  } catch (err) {
    next(err instanceof HttpError ? err : new HttpError('Fetching orders failed', 500));
  }
};

const updateOrderStatus = async (req, res, next) => {
  try {
    const order = await rentalService.updateOrderStatus(req.params.id, req.body.status);
    res.status(200).json({ message: 'Status updated', order });
  } catch (err) {
    next(err instanceof HttpError ? err : new HttpError('Updating status failed', 500));
  }
};

const confirmPreparation = async (req, res, next) => {
  try {
    const result = await rentalService.confirmPreparation(req.params.id);
    res.status(200).json(result);
  } catch (err) {
    next(err instanceof HttpError ? err : new HttpError('Lỗi server khi xác nhận chuẩn bị đồ', 500));
  }
};

const getTotalRevenue = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const result = await rentalService.getTotalRevenue(startDate, endDate);
    res.status(200).json(result);
  } catch (err) {
    next(err instanceof HttpError ? err : new HttpError('Fetching total revenue failed', 500));
  }
};

const getActiveRentals = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const result = await rentalService.getActiveRentals(startDate, endDate);
    res.status(200).json(result);
  } catch (err) {
    next(err instanceof HttpError ? err : new HttpError('Fetching active rentals failed', 500));
  }
};

const getInventoryUtilization = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const result = await rentalService.getInventoryUtilization(startDate, endDate);
    res.status(200).json(result);
  } catch (err) {
    next(err instanceof HttpError ? err : new HttpError('Fetching inventory utilization failed', 500));
  }
};

const requestReturn = async (req, res, next) => {
  try {
    const rental = await rentalService.requestReturn(req.params.id);
    res.status(200).json({ message: 'Đã gửi yêu cầu trả hàng. Vui lòng chờ cửa hàng xác nhận.', data: rental });
  } catch (err) {
    next(err instanceof HttpError ? err : new HttpError('Lỗi hệ thống khi yêu cầu trả đồ', 500));
  }
};

const inspectReturn = async (req, res, next) => {
  try {
    const result = await rentalService.inspectReturn(req.params.id, req.body, req.files || []);
    res.status(200).json({ message: 'Kiểm tra và khấu trừ cọc thành công', data: result });
  } catch (err) {
    next(err instanceof HttpError ? err : new HttpError('Lỗi hệ thống khi kiểm tra đồ', 500));
  }
};

const extendRental = async (req, res, next) => {
  try {
    const result = await rentalService.extendRental(req.params.id, req.userData.id, req.body.newEndDate);
    res.status(200).json(result);
  } catch (err) {
    next(err instanceof HttpError ? err : new HttpError(err.message || 'Gia hạn đơn hàng thất bại.', 500));
  }
};

const getTopRentedCostumes = async (req, res, next) => {
  try {
    const result = await rentalService.getTopRentedCostumes(req.query.limit);
    res.status(200).json({ success: true, items: result });
  } catch (err) {
    next(err instanceof HttpError ? err : new HttpError('Fetching top rented costumes failed', 500));
  }
};

const estimateDelivery = async (req, res, next) => {
  try {
    const { districtId, wardCode } = req.body;
    const result = await rentalService.getDeliveryEstimate(districtId, wardCode);
    res.status(200).json(result);
  } catch (err) {
    next(err instanceof HttpError ? err : new HttpError('Lỗi lấy ngày dự kiến giao hàng', 500));
  }
};

module.exports = {
  confirmReceipt, checkAvailability, createOrder, getAllOrders, updateOrderStatus,
  confirmPreparation, getRentalHistory, orderDetail, cancellOrrder,
  getTotalRevenue, getActiveRentals, getInventoryUtilization,
  requestReturn, inspectReturn, extendRental, getTopRentedCostumes,
  estimateDelivery,
};
