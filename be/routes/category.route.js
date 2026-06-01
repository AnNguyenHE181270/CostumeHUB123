const express = require("express");
const { getAllCategories, createCategory, updateCategory, toggleCategoryStatus } = require("../controllers/category.controller");
const { checkAuth } = require("../middlewares/check-auth.middleware");
const router = express.Router();

router.get("/", getAllCategories);

router.use(checkAuth);
router.post("/", createCategory);
router.put("/:id", updateCategory);
router.put("/:id/toggle", toggleCategoryStatus);

module.exports = router;
