const express = require('express');
const { checkAvailability, createOrder, getAllOrders, updateOrderStatus, getRentalHistory } = require('../controllers/rental.controller');
const { checkAuth } = require('../middlewares/check-auth.middleware');

const router = express.Router();

router.post('/check', checkAvailability);
router.post('/create', checkAuth, createOrder); // Khách phải login mới được đặt
router.get('/', checkAuth, getAllOrders); // Staff/Owner lấy danh sách
router.patch('/:id/status', checkAuth, updateOrderStatus); // Đổi trạng thái
router.get('/rental-history', checkAuth, getRentalHistory); // Đã thêm checkAuth
module.exports = router;