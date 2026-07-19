const express = require("express");
const {
  createStockTransaction,
  getStockHistory,
  getStockSummary,
} = require("../controllers/stockTransaction.controller");
const { checkAuth, isOwner } = require("../middlewares/check-auth.middleware");

const router = express.Router();

router.use(checkAuth);
router.use(isOwner);

router.post("/", createStockTransaction);
router.get("/", getStockHistory);
router.get("/summary", getStockSummary);

module.exports = router;
