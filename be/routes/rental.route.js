const express = require('express');
const {
    checkAvailability, createOrder, getAllOrders, updateOrderStatus, confirmPreparation,
    getRentalHistory, orderDetail, cancellOrrder,
    getTotalRevenue, getActiveRentals, getInventoryUtilization,
    requestReturn, inspectReturn, confirmReceipt
} = require('../controllers/rental.controller');
const { checkAuth, isOwner } = require('../middlewares/check-auth.middleware');

const router = express.Router();

router.post('/check', checkAvailability);
router.post('/create', checkAuth, createOrder); // Khách phải login mới được đặt
router.get('/', checkAuth, getAllOrders); // Staff/Owner lấy danh sách
router.put('/:id/status', checkAuth, updateOrderStatus); // Đổi trạng thái
router.put('/:id/confirm', checkAuth, confirmPreparation); // Staff xác nhận chuẩn bị đồ xong -> Đang giao
router.get('/rental-history', checkAuth, getRentalHistory); // Đã thêm checkAuth
router.get('/order-detail/:orderId', checkAuth, orderDetail);
router.put('/:id/cancel', checkAuth, cancellOrrder);
router.put('/:id/request-return', checkAuth, requestReturn); // KAN-124: Khách yêu cầu trả đồ
router.put('/:id/inspect-return', checkAuth, inspectReturn); // KAN-125: Staff kiểm tra đồ trả và chốt đơn
router.put('/:id/confirm-receipt', checkAuth, confirmReceipt); // Khách hàng xác nhận nhận hàng

// Dashboard APIs
router.get('/dashboard/revenue', checkAuth, isOwner, getTotalRevenue);
router.get('/dashboard/active-rentals', checkAuth, isOwner, getActiveRentals);
router.get('/dashboard/inventory-utilization', checkAuth, isOwner, getInventoryUtilization);

module.exports = router;