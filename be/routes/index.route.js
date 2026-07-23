const express = require("express");
const router = express.Router();
const userRoute = require("./user.route");
const costumeRoute = require("./costume.route");
const categoryRoute = require("./category.route");
const rentalRoute = require("./rental.route");
const roleRoute = require("./role.route")
const cartRoute = require('./cart.route')
const staffRoute = require('./staff.route')
const ghnRoute = require('./ghn.route');
const vnpayRoute = require('./vnpay.route');
const issueRoute = require('./issue.route');
const notificationRoute = require('./notification.route');
const chatRoute = require('./chat.route');
const reportRoute = require('./report.route');
const stockTransactionRoute = require('./stockTransaction.route');

router.use("/users", userRoute);
router.use("/costumes", costumeRoute);
router.use("/categories", categoryRoute);
router.use("/rentals", rentalRoute)
router.use("/roles", roleRoute)
router.use("/carts", cartRoute)
router.use("/staff", staffRoute)
router.use("/vnpay", vnpayRoute);
router.use("/ghn", ghnRoute);
router.use("/issues", issueRoute);
router.use("/notifications", notificationRoute);
router.use("/chat", chatRoute);
router.use("/reports", reportRoute);
router.use("/stock-transactions", stockTransactionRoute);

module.exports = router;