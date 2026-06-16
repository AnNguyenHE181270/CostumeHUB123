const express = require('express');
const router = express.Router();
const ghnController = require('../controllers/ghn.controller');

router.get('/provinces', ghnController.getProvinces);
router.get('/districts', ghnController.getDistricts);
router.get('/wards', ghnController.getWards);

// Webhook để test giao hàng thành công (dùng Postman bắn payload vào)
router.post('/webhook', ghnController.handleWebhook);

module.exports = router;
