const express = require("express");
const {
  getAllCostumes,
  getCostumeById,
  createCostume,
  updateCostume,
  deleteCostume,
} = require("../controllers/costume.controller");
const { checkAuth, isOwner } = require("../middlewares/check-auth.middleware");
const validate = require('../middlewares/validate.middleware');
const { getCostumeByIdValidator, createCostumeValidator, updateCostumeValidator, deleteCostumeValidator } = require('../validators/costume.validator');

const router = express.Router();

router.get("/", getAllCostumes);
router.get("/:id", getCostumeByIdValidator, validate, getCostumeById);

router.use(checkAuth);

router.post("/", isOwner, createCostumeValidator, validate, createCostume);
router.put("/:id", isOwner, updateCostumeValidator, validate, updateCostume);
router.delete("/:id", isOwner, deleteCostumeValidator, validate, deleteCostume);

module.exports = router;