const express = require('express')
const router = express.Router();

const { registerValidator, verifyOtpValidator, loginValidator, forgotPasswordValidator, resetPasswordValidator} = require("../validators/user.validator");
const validate = require("../middlewares/validate.middleware");
const { register, verifyOtp, login, getProfile, forgotPassword, resetPassword, getAllUser } = require("../controllers/user.controller");
const {checkAuth, requirePermission} = require("../middlewares/check-auth.middleware")
router.post("/register", registerValidator, validate, register);
router.post("/verify-otp/:email", verifyOtpValidator, validate, verifyOtp)
router.post("/login", loginValidator, validate, login)
router.post("/forgot-password", forgotPasswordValidator, validate, forgotPassword)
router.post("/reset-password/:token", resetPasswordValidator, validate, resetPassword)
router.use(checkAuth);
router.get("/my-profile", getProfile)
router.get("/get-users",requirePermission("view_all_accounts"),getAllUser)

module.exports = router

