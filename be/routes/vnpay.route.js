const express = require("express");
const router = express.Router();
const vnpayController = require("../controllers/vnpay.controller");
const { checkAuth, isOnlineCustomer } = require("../middlewares/check-auth.middleware");
const validate = require('../middlewares/validate.middleware');
const { createPaymentUrlValidator } = require('../validators/vnpay.validator');

router.post("/create-payment-url", checkAuth, isOnlineCustomer, createPaymentUrlValidator, validate, vnpayController.createPaymentUrl);

router.get("/vnpay-ipn", vnpayController.vnpayIpn);

router.get("/vnpay-return", vnpayController.vnpayReturn);

router.get("/topup-history", checkAuth, vnpayController.getTopUpHistory);

module.exports = router;