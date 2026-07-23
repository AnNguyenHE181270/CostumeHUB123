const express = require("express");
const {
  getAllCostumes,
  getInventoryCostumes,
  getCostumeById,
  createCostume,
  updateCostume,
  deleteCostume,
  getMaintenanceCostumes,
  completeMaintenance,
} = require("../controllers/costume.controller");
const { checkAuth, isOwner } = require("../middlewares/check-auth.middleware");
const validate = require('../middlewares/validate.middleware');
const { getCostumeByIdValidator, createCostumeValidator, updateCostumeValidator, deleteCostumeValidator } = require('../validators/costume.validator');

const router = express.Router();

router.get("/", getAllCostumes);
router.get("/:id", getCostumeByIdValidator, validate, getCostumeById);

router.use(checkAuth);

router.get("/maintenance/list", getMaintenanceCostumes);
router.put("/:id/complete-maintenance", completeMaintenance);

// Kho hàng cho trang quản trị: thấy đủ mọi sản phẩm (kể cả hidden), không giới hạn 50 bản ghi
router.get("/inventory/list", isOwner, getInventoryCostumes);

router.post("/", isOwner, createCostumeValidator, validate, createCostume);
router.put("/:id", isOwner, updateCostumeValidator, validate, updateCostume);
router.delete("/:id", isOwner, deleteCostumeValidator, validate, deleteCostume);

module.exports = router;