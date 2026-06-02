const express = require('express');
const { checkAvailability, createOrder, getAllOrders, updateOrderStatus } = require('../controllers/rental.controller');
const checkAuth = require('../middlewares/check-auth.middleware');

const router = express.Router();

router.post('/check', checkAvailability);
router.post('/create', checkAuth, createOrder); // Khách phải login mới được đặt
router.get('/', checkAuth, getAllOrders); // Staff/Owner lấy danh sách
router.patch('/:id/status', checkAuth, updateOrderStatus); // Đổi trạng thái

module.exports = router;