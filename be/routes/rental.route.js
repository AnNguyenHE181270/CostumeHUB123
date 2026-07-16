const express = require('express');
const {
    checkAvailability, createOrder, getAllOrders, updateOrderStatus, confirmPreparation,
    getRentalHistory, orderDetail, cancellOrrder,
    getTotalRevenue, getActiveRentals, getInventoryUtilization,
    requestReturn, inspectReturn, confirmReceipt, extendRental
} = require('../controllers/rental.controller');
const { checkAuth, isOwner } = require('../middlewares/check-auth.middleware');
const upload = require('../middlewares/upload.middleware');
const validate = require('../middlewares/validate.middleware');
const { 
  checkAvailabilityValidator, createOrderValidator, updateOrderStatusValidator, 
  confirmPreparationValidator, getOrderDetailValidator, cancelOrderValidator, 
  requestReturnValidator, inspectReturnValidator, confirmReceiptValidator, 
  extendRentalValidator 
} = require('../validators/rental.validator');

const router = express.Router();

router.post('/check', checkAvailabilityValidator, validate, checkAvailability);
router.post('/create', checkAuth, createOrderValidator, validate, createOrder); // Khách phải login mới được đặt
router.get('/', checkAuth, getAllOrders); // Staff/Owner lấy danh sách
router.put('/:id/status', checkAuth, updateOrderStatusValidator, validate, updateOrderStatus); // Đổi trạng thái
router.put('/:id/confirm', checkAuth, confirmPreparationValidator, validate, confirmPreparation); // Staff xác nhận chuẩn bị đồ xong -> Đang giao
router.get('/rental-history', checkAuth, getRentalHistory); // Đã thêm checkAuth
router.get('/order-detail/:orderId', checkAuth, getOrderDetailValidator, validate, orderDetail);
router.put('/:id/cancel', checkAuth, cancelOrderValidator, validate, cancellOrrder);
router.put('/:id/request-return', checkAuth, requestReturnValidator, validate, requestReturn); // KAN-124: Khách yêu cầu trả đồ
router.put('/:id/inspect-return', checkAuth, upload.uploadReturnEvidence, inspectReturnValidator, validate, inspectReturn); // KAN-125: Staff kiểm tra đồ trả và chốt đơn
router.put('/:id/confirm-receipt', checkAuth, confirmReceiptValidator, validate, confirmReceipt); // Khách hàng xác nhận nhận hàng
router.put('/:id/extend', checkAuth, extendRentalValidator, validate, extendRental); // Khách hàng yêu cầu gia hạn thuê và thanh toán ví

// Dashboard APIs
router.get('/dashboard/revenue', checkAuth, isOwner, getTotalRevenue);
router.get('/dashboard/active-rentals', checkAuth, isOwner, getActiveRentals);
router.get('/dashboard/inventory-utilization', checkAuth, isOwner, getInventoryUtilization);

module.exports = router;