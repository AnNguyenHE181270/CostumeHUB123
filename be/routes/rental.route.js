const express = require('express');
const { 
    checkAvailability, createOrder, getAllOrders, updateOrderStatus, confirmPreparation,
    getRentalHistory, orderDetail, cancellOrrder,
    getTotalRevenue, getActiveRentals, getInventoryUtilization
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

// Dashboard APIs
router.get('/dashboard/revenue', checkAuth, isOwner, getTotalRevenue);
router.get('/dashboard/active-rentals', checkAuth, isOwner, getActiveRentals);
router.get('/dashboard/inventory-utilization', checkAuth, isOwner, getInventoryUtilization);

module.exports = router;