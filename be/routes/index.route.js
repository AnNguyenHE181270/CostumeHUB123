const express = require("express");
const router = express.Router();
const userRoute = require("./user.route");
const costumeRoute = require("./costume.route");
const categoryRoute = require("./category.route");
const rentalRoute = require("./rental.route");
const roleRoute = require("./role.route")
const messageRoute = require("./message.route")
const chatRoomRoute = require("./chat-room.route")
const cartRoute = require('./cart.route')
const staffRoute = require('./staff.route')
const ghnRoute = require('./ghn.route');
const vnpayRoute = require('./vnpay.route')
router.use("/users", userRoute);
router.use("/costumes", costumeRoute);
router.use("/categories", categoryRoute);
router.use("/rentals", rentalRoute)
router.use("/roles", roleRoute)
router.use("/carts", cartRoute)
router.use("/messages",messageRoute)
router.use("/chat-rooms",chatRoomRoute)
router.use("/staff", staffRoute)
router.use("/vnpays", vnpayRoute)
router.use("/ghn", ghnRoute);

module.exports = router;