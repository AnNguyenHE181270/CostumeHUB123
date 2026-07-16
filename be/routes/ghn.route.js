const express = require('express');
const router = express.Router();
const ghnController = require('../controllers/ghn.controller');
const validate = require('../middlewares/validate.middleware');
const { handleWebhookValidator } = require('../validators/ghn.validator');

router.get('/provinces', ghnController.getProvinces);
router.get('/districts', ghnController.getDistricts);
router.get('/wards', ghnController.getWards);

// Webhook để test giao hàng thành công (dùng Postman bắn payload vào)
router.post('/webhook', handleWebhookValidator, validate, ghnController.handleWebhook);

module.exports = router;
