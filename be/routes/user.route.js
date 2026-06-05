const express = require('express');
const router = express.Router();

const { 
  registerValidator, verifyOtpValidator, loginValidator, 
  forgotPasswordValidator, resetPasswordValidator, updateUserValidator, 
  findUserByIdValidator, updateMyProfileValidator 
} = require("../validators/user.validator");

const validate = require("../middlewares/validate.middleware");
const upload = require("../middlewares/upload.middleware");

const { 
  register, verifyOtp, login, getProfile, forgotPassword, 
  resetPassword, getAllUsers, updateUsers, findUserById, 
  updateMyProfile 
} = require("../controllers/user.controller");

// Import middleware checkAuth và các role middleware cụ thể (ở đây dùng isOwner)
const { checkAuth, isOwner } = require("../middlewares/check-auth.middleware");

// ==========================================
// PUBLIC ROUTES (Không cần đăng nhập)
// ==========================================
router.post("/register", registerValidator, validate, register);
router.post("/verify-otp/:email", verifyOtpValidator, validate, verifyOtp);
router.post("/login", loginValidator, validate, login);
router.post("/forgot-password", forgotPasswordValidator, validate, forgotPassword);
router.post("/reset-password/:token", resetPasswordValidator, validate, resetPassword);


router.use(checkAuth);


router.get("/my-profile", getProfile);
router.put("/update-my-profile", upload.single("avatar"), updateMyProfileValidator, validate, updateMyProfile);


router.get("/get-users", isOwner, getAllUsers);
router.get("/user/:id", isOwner, findUserByIdValidator, validate, findUserById);
router.put("/update-user/:id", isOwner, upload.single("avatar"), updateUserValidator, validate, updateUsers);

module.exports = router;