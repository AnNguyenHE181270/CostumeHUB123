const express = require("express");
const {
  getAllCostumes,
  getCostumeById,
  createCostume,
  updateCostume,
  deleteCostume,
} = require("../controllers/costume.controller");
const { checkAuth, requirePermission } = require("../middlewares/check-auth.middleware");
const router = express.Router();

router.get("/", getAllCostumes);
router.get("/:id", getCostumeById);

// Require authentication and permission for write operations
router.use(checkAuth);

// Using 'manage_inventory' as a placeholder permission for products
router.post("/", requirePermission("manage_inventory"), createCostume);
router.put("/:id", requirePermission("manage_inventory"), updateCostume);
router.delete("/:id", requirePermission("manage_inventory"), deleteCostume);

module.exports = router;
