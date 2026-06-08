const express = require("express");
const {
  getAllCostumes,
  getCostumeById,
  createCostume,
  updateCostume,
  deleteCostume,
} = require("../controllers/costume.controller");
const { checkAuth, isOwner } = require("../middlewares/check-auth.middleware");

const router = express.Router();

router.get("/", getAllCostumes);
router.get("/:id", getCostumeById);

router.use(checkAuth);

router.post("/", isOwner, createCostume);
router.put("/:id", isOwner, updateCostume);
router.delete("/:id", isOwner, deleteCostume);

module.exports = router;