const express = require("express");
const router = express.Router();
const userRoute = require("./user.route");
const costumeRoute = require("./costume.route");
const categoryRoute = require("./category.route");
const rentalRoute = require("./rental.route");
const roleRoute  = require("./role.route")
router.use("/users", userRoute);
router.use("/costumes", costumeRoute);
router.use("/categories", categoryRoute);
router.use("/rentals", rentalRoute)
router.use("/roles", roleRoute)
module.exports = router;