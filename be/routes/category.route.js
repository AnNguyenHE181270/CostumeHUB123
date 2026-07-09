const express = require("express");
const { getAllCategories, createCategory, updateCategory, toggleCategoryStatus } = require("../controllers/category.controller");
const { checkAuth } = require("../middlewares/check-auth.middleware");
const router = express.Router();

// 1. Middleware bảo vệ API lấy "toàn bộ" danh mục (Giải quyết Issue 5)
const restrictAllCategoriesToOwner = (req, res, next) => {
  // Nếu request có truyền query ?all=true (từ giao diện Dashboard của Owner)
  if (req.query.all === 'true') {
    // Ép chạy checkAuth để xác thực token
    return checkAuth(req, res, () => {
      // Xác thực xong, kiểm tra tiếp xem có đúng là Chủ cửa hàng không
      if (req.user && req.user.role === 'owner') {
        return next();
      }
      return res.status(403).json({ message: "Access denied. Only StoreOwner can access all categories." });
    });
  }
  // Nếu gọi API bình thường (từ giao diện Khách hàng), cho phép đi qua
  next();
};

// Áp dụng bảo vệ cho route GET
router.get("/", restrictAllCategoriesToOwner, getAllCategories);

// ==========================================
// CÁC ROUTE THAO TÁC DỮ LIỆU BÊN DƯỚI
// ==========================================

// Bắt buộc phải có token hợp lệ
router.use(checkAuth);

// 2. Middleware gia cố thêm: Chỉ Owner mới được Thêm/Sửa/Ẩn danh mục
const checkOwner = (req, res, next) => {
  if (req.user && req.user.role === 'owner') {
    next();
  } else {
    return res.status(403).json({ message: "Access denied. Only StoreOwner can perform this action." });
  }
};

// Áp dụng bảo vệ cho các route chỉnh sửa
router.post("/", checkOwner, createCategory);
router.put("/:id", checkOwner, updateCategory);
router.put("/:id/toggle", checkOwner, toggleCategoryStatus);

module.exports = router;