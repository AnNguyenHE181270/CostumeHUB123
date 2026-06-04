const express = require('express')
const router = express.Router();

const { registerValidator, verifyOtpValidator, loginValidator, forgotPasswordValidator, resetPasswordValidator} = require("../validators/user.validator");
const validate = require("../middlewares/validate.middleware");
const upload = require("../middlewares/upload.middleware");
const { register, verifyOtp, login, getProfile, forgotPassword, resetPassword, getAllUsers, updateUsers, findUserById, getAllRoles } = require("../controllers/user.controller");
const {checkAuth, requirePermission} = require("../middlewares/check-auth.middleware")
router.post("/register", registerValidator, validate, register);
router.post("/verify-otp/:email", verifyOtpValidator, validate, verifyOtp)
router.post("/login", loginValidator, validate, login)
router.post("/forgot-password", forgotPasswordValidator, validate, forgotPassword)
router.post("/reset-password/:token", resetPasswordValidator, validate, resetPassword)
router.use(checkAuth);
router.get("/my-profile", getProfile)
router.get("/get-users",requirePermission("view_all_users"),getAllUsers)
router.put("/update-user/:id",requirePermission("manage_users"), upload.single("avatar"), updateUsers)
router.get("/user/:id",requirePermission("view_user"),findUserById)
router.get("/roles", requirePermission("view_all_roles"), getAllRoles)
module.exports = router

