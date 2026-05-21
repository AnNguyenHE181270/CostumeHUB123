const express = require('express')
const router = express.Router();

const { registerValidator, verifyOtpValidator, loginValidator, completeWithGoogleValidator, forgotPasswordValidator, resetPasswordValidator} = require("../validators/user.validator");
const validate = require("../middlewares/validate.middleware");
const { register, verifyOtp, login, getProfile, googleLogin, completeWithGoogle, forgotPassword, resetPassword } = require("../controllers/user.controller");
// const checkAuth = require("../middlewares/check-auth")
router.post("/register", registerValidator, validate, register);
router.post("/verify-otp/:email", verifyOtpValidator, validate, verifyOtp)
router.post("/google-login", googleLogin);
router.put("/complete-profile/:email", completeWithGoogleValidator, validate,completeWithGoogle )
router.post("/login", loginValidator, validate, login)
router.post("/forgot-password", forgotPasswordValidator, validate, forgotPassword)
router.post("/reset-password/:token", resetPasswordValidator, validate, resetPassword)
// router.use(checkAuth);
// router.get("/my-profile", getProfile)
module.exports = router

