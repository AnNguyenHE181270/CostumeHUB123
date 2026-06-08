const express = require('express');
const router = express.Router();

const { 
  registerValidator, verifyOtpValidator, loginValidator, 
  forgotPasswordValidator, resetPasswordValidator, updateUserValidator, 
  findUserByIdValidator, updateMyProfileValidator, createAddressValidator 
} = require("../validators/user.validator");

const validate = require("../middlewares/validate.middleware");
const upload = require("../middlewares/upload.middleware");

const { 
  register, verifyOtp, resendOtp, login, getMyProfile, forgotPassword, 
  resetPassword, getAllUsers, updateUsers, findUserById, 
  updateMyProfile, createAddress, 
  getAllAddresses
} = require("../controllers/user.controller");

const { checkAuth, isOwner, isOnlineCustomer, isStaff } = require("../middlewares/check-auth.middleware");


router.post("/register", registerValidator, validate, register);
router.post("/resend-otp/:email", resendOtp);
router.post("/verify-otp/:email", verifyOtpValidator, validate, verifyOtp);
router.post("/login", loginValidator, validate, login);
router.post("/forgot-password", forgotPasswordValidator, validate, forgotPassword);
router.post("/reset-password/:token", resetPasswordValidator, validate, resetPassword);


router.use(checkAuth);


router.get("/my-profile", getMyProfile);
router.put("/update-my-profile", upload.single("avatar"), updateMyProfileValidator, validate, updateMyProfile);


router.get("/get-users", isOwner, getAllUsers);
router.get("/user/:id", isOwner, findUserByIdValidator, validate, findUserById);
router.put("/update-user/:id", isOwner, upload.single("avatar"), updateUserValidator, validate, updateUsers);
router.post("/create-address", isOnlineCustomer, createAddressValidator, validate, createAddress)
router.get("/addresses", isOnlineCustomer,  getAllAddresses)
module.exports = router;