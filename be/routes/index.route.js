const express = require("express");
const router = express.Router();
const userRoute = require("./user.route");
const costumeRoute = require("./costume.route");
const categoryRoute = require("./category.route");

router.use("/users", userRoute);
router.use("/costumes", costumeRoute);
router.use("/categories", categoryRoute);

module.exports = router;