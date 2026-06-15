const express = require('express');
const { 
    checkAvailability, createOrder, getAllOrders, updateOrderStatus, 
    getRentalHistory, orderDetail, cancellOrrder,
    getTotalRevenue, getActiveRentals, getInventoryUtilization
} = require('../controllers/rental.controller');
const { checkAuth, isOwner } = require('../middlewares/check-auth.middleware');

const router = express.Router();

router.post('/check', checkAvailability);
router.post('/create', checkAuth, createOrder); // Khách phải login mới được đặt
router.get('/', checkAuth, getAllOrders); // Staff/Owner lấy danh sách
router.patch('/:id/status', checkAuth, updateOrderStatus); // Đổi trạng thái
router.get('/rental-history', checkAuth, getRentalHistory); // Đã thêm checkAuth
router.get('/order-detail/:orderId', checkAuth, orderDetail);
router.patch('/:id/cancel', checkAuth, cancellOrrder);
router.patch('/:id/return', rentalController.handleReturn);

// Dashboard APIs
router.get('/dashboard/revenue', checkAuth, isOwner, getTotalRevenue);
router.get('/dashboard/active-rentals', checkAuth, isOwner, getActiveRentals);
router.get('/dashboard/inventory-utilization', checkAuth, isOwner, getInventoryUtilization);

module.exports = router;