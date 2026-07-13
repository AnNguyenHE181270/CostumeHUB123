const express = require("express");
const { getAllCategories, createCategory, updateCategory, toggleCategoryStatus } = require("../controllers/category.controller");
const { checkAuth, isOwner } = require("../middlewares/check-auth.middleware"); // Đã import thêm isOwner có sẵn của team
const router = express.Router();

// 1. Middleware bảo vệ API lấy "toàn bộ" danh mục
const restrictAllCategoriesToOwner = (req, res, next) => {
  if (req.query.all === 'true') {
    return checkAuth(req, res, () => {
      // Đã đổi thành req.userData khớp với check-auth.middleware.js
      if (req.userData && req.userData.role === 'owner') {
        return next();
      }
      return res.status(403).json({ message: "Access denied. Only StoreOwner can access all categories." });
    });
  }
  next();
};

router.get("/", restrictAllCategoriesToOwner, getAllCategories);

// ==========================================
// 2. CÁC ROUTE THAO TÁC CẦN QUYỀN CAO NHẤT
// ==========================================

// Bắt buộc phải đăng nhập
router.use(checkAuth);

// Bắt buộc phải là Chủ cửa hàng (Sử dụng luôn middleware có sẵn của team)
router.use(isOwner); 

router.post("/", createCategory);
router.put("/:id", updateCategory);
router.put("/:id/toggle", toggleCategoryStatus);

module.exports = router;