const express = require("express");
const router = express.Router();
const payosController = require("../controllers/payos.controller");
const { checkAuth, isOnlineCustomer, isStaffOrOwner } = require("../middlewares/check-auth.middleware");

// Validation middleware if needed
// const validate = require('../middlewares/validate.middleware');
// const { createPaymentUrlValidator } = require('../validators/payos.validator');

router.post("/create-payment-link", checkAuth, isOnlineCustomer, payosController.createPaymentUrl);

// PayOS webhook uses POST
router.post("/payos-webhook", payosController.payosWebhook);

router.post("/sync-transaction", checkAuth, isOnlineCustomer, payosController.syncTransaction);

router.post("/withdraw/send-otp", checkAuth, isOnlineCustomer, payosController.sendWithdrawOtp);

router.post("/withdraw", checkAuth, isOnlineCustomer, payosController.requestWithdraw);

router.get("/transaction-history", checkAuth, payosController.getTransactionHistory);

router.get("/admin/transactions", checkAuth, isStaffOrOwner, payosController.getAllTransactions);

router.put("/admin/withdraw/:transactionId/status", checkAuth, isStaffOrOwner, payosController.updateWithdrawStatus);

module.exports = router;
