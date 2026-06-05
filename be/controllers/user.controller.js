const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const HttpError = require("../models/http-error.model");
const User = require("../models/user.model");
const Role = require("../models/role.model");
const sendEmail = require("../services/email.service");
const crypto = require("crypto");
const { uploadImage } = require("../services/cloudinary.service");
const fs = require("fs");
const OTP_TTL_MS = 1 * 60 * 1000;
const { ObjectId } = require('mongodb');

const register = async (req, res, next) => {
  let newUser = null;

  try {
    const { fullName, email, phone, password, gender, dateOfBirth } = req.body;
    const now = new Date();

    const existUser = await User.findOne({ email });

    if (existUser && existUser.status === "active") {
      return next(new HttpError("An account with this email already exists. Please log in instead.", 422));
    }

    if (phone) {
      const existPhone = await User.findOne({ phone });
      if (existPhone && existPhone.status === "active" && (!existUser || existPhone._id.toString() !== existUser._id.toString())) {
        return next(new HttpError("An account with this phone number already exists.", 422));
      }
    }

    if (existUser && existUser.status == "blocked" && existUser.isEmailVerified == true) {
      return next(new HttpError("This account cannot be registered again.", 403));
    }

    const roleUser = await Role.findOne({ name: "online-customer" });

    if (!roleUser) {
      return next(new HttpError("Online customer role not found", 404));
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const otp = generateOTP();
    const otpHash = await bcrypt.hash(otp, salt);

    const otpExpires = new Date(now.getTime() + 10 * 60 * 1000);
    const otpCooldownUntil = new Date(now.getTime() + 60 * 1000);

    if (existUser && existUser.status === "pending" && existUser.isEmailVerified == false) {
      const updatedUser = await User.findByIdAndUpdate(
        existUser._id,
        {
          fullName,
          phone,
          password: passwordHash,
          role: roleUser._id,
          gender: gender || null,
          dateOfBirth: dateOfBirth || null,
          otpCode: otpHash,
          otpExpires,
          otpCooldownUntil,
          status: "pending",
        },
        { new: true },
      );

      await sendEmailVerification(email, otp, fullName);

      return res.status(200).json({
        message: "Registration successful. Please check your email for the OTP.",
        type: "new",
        user: {
          id: updatedUser._id,
          fullName: updatedUser.fullName,
          email: updatedUser.email,
          phone: updatedUser.phone,
        },
        remainingTime: 10 * 60 * 1000,
        nextResendIn: 60 * 1000,
      });
    }

    newUser = await User.create({
      fullName,
      email,
      phone,
      password: passwordHash,
      role: roleUser._id,
      gender: gender || null,
      dateOfBirth: dateOfBirth || null,
      otpCode: otpHash,
      otpExpires,
      otpCooldownUntil,
      status: "pending",
    });

    await sendEmailVerification(email, otp, fullName);

    return res.status(201).json({
      message: "Register successfully. Check your email for OTP.",
      type: "new",
      user: {
        id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        phone: newUser.phone,
      },
      remainingTime: 10 * 60 * 1000,
      nextResendIn: 60 * 1000,
    });
  } catch (err) {
    return next(new HttpError(err.message || "Register failed.", 500));
  }
};

const generateOTP = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let otp = "";
  for (let i = 0; i < 6; i++) {
    otp += chars[Math.floor(Math.random() * chars.length)];
  }
  return otp;
};

const sendEmailVerification = async (email, otp, fullName) => {
  await sendEmail({
    to: email,
    subject: "Vogue Rental — Xác thực tài khoản của bạn",
    text: `Mã xác thực của bạn là: ${otp}`,
    html: `...`,
  });
};

const verifyOtp = async (req, res, next) => {
  try {
    const { email } = req.params;
    const { otp } = req.body;

    const existUser = await User.findOne({ email }).select("+otpCode +otpExpires +otpCooldownUntil");

    if (!existUser) {
      return next(new HttpError("User not found.", 404));
    }

    if (existUser.status === "active" && existUser.isEmailVerified) {
      return next(new HttpError("User is already verified.", 400));
    }

    if (existUser.status === "blocked") {
      return next(new HttpError("This account is blocked.", 403));
    }

    if (!existUser.otpCode || !existUser.otpExpires) {
      return next(new HttpError("OTP not found. Please register again.", 400));
    }

    const nowDate = new Date();

    if (existUser.otpExpires < nowDate) {
      return next(new HttpError("OTP has expired. Please register again.", 400));
    }

    const isValidOtp = await bcrypt.compare(otp, existUser.otpCode);

    if (!isValidOtp) {
      return next(new HttpError("Invalid OTP.", 400));
    }
    existUser.status = "active";
    existUser.isEmailVerified = true;
    existUser.otpCode = null;
    existUser.otpExpires = null;
    existUser.otpCooldownUntil = null;

    await existUser.save();

    return res.status(200).json({
      message: "Email verified successfully.",
      user: {
        id: existUser._id,
        fullName: existUser.fullName,
        email: existUser.email,
        phone: existUser.phone,
        status: existUser.status,
      },
    });
  } catch (err) {
    return next(new HttpError(err.message || "Email verification failed.", 500));
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const existUser = await User.findOne({ email }).select("+password").populate("role");

    if (!existUser) {
      return next(new HttpError("User not found.", 404));
    }

    if (existUser.status === "blocked") {
      return next(new HttpError("User is blocked", 400));
    }

    if(existUser.status == "pending"){
      return next(new HttpError("User is not verify, please register again",400))
    }

    const checkPassword = await bcrypt.compare(password, existUser.password);

    if (!checkPassword) {
      return next(new HttpError("Incorrect password.", 401));
    }

    const token = jwt.sign(
      {
        id: existUser._id,
        email: existUser.email,
        role: existUser.role.name,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      message: "Login successful.",
      token,
    });
  } catch (err) {
    return next(new HttpError(err.message || "Login failed.", 500));
  }
};

const getProfile = async (req, res, next) => {
  try {
    const email = req.userData.email;

    const user = await User.findOne({ email }).populate("role");
    if (!user) {
      return next(new HttpError("User not found.", 404));
    }

    return res.status(200).json({
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        gender: user.gender,
        dateOfBirth: user.dateOfBirth,
        provider: user.provider,
        role: user.role.name,
      },
    });
  } catch (err) {
    return next(new HttpError(err.message || "Fetch profile failed.", 500));
  }
};

const sendResetPasswordEmail = async (email, resetUrl, fullName) => {
  await sendEmail({
    to: email,
    subject: "Vogue Rental — Đặt lại mật khẩu",
    text: `Bạn yêu cầu đặt lại mật khẩu. Nhấn vào link sau (hiệu lực 15 phút): ${resetUrl}`,
    html: `...`,
  });
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return next(new HttpError("If an account with this email exists, password reset instructions have been sent.", 200));
    }

    if (!user.isEmailVerified) {
      return next(new HttpError("Email is not verified. Please verify your email before resetting your password.", 403));
    }

    if (user.status === "blocked") {
      return next(new HttpError("Your account has been blocked. Please contact support for assistance.", 403));
    }
    const resetToken = crypto.randomBytes(32).toString("hex");

    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

    await user.save();

    const resetUrl = `http://localhost:3000/reset-password/${resetToken}`;
    await sendResetPasswordEmail(user.email, resetUrl, user.fullName);
    res.status(200).json({
      message: "If an account with this email exists, password reset instructions have been sent.",
    });
  } catch (err) {
    return next(new HttpError(err.message || "Error system.", 500));
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const token = req.params.token;
    const password = req.body.password;

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return next(new HttpError("Invalid or expired token.", 400));
    }
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    user.resetPasswordToken = null;
    user.resetPasswordExpire = null;

    await user.save();

    res.status(200).json({ message: "Password reset successful." });
  } catch (err) {
    return next(new HttpError(err.message || "Password reset failed.", 500));
  }
};

const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().populate("role");
    return res.status(200).json({
      users: users.map((u) => ({
        fullName: u.fullName,
        email: u.email,
        phone: u.phone,
        avatar: u.avatar,
        status: u.status,
        role: u.role.name,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
        id: u._id
      })),
    });
  } catch (err) {
    return next(new HttpError(err.message, 500));
  }
};

const findUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return next(new HttpError("Invalid id", 400));
    }

    const user = await User.findById(id).populate("role");

    if (!user) {
      return next(new HttpError("Not found user", 404));
    }

    return res.status(200).json({
      success: true,
      user,
    });

  } catch (err) {
    return next(new HttpError(err.message, 500));
  }
};

const updateUsers = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { email, phone, fullName, gender, dateOfBirth, age, avatar, role, status } = req.body;

    if (!ObjectId.isValid(id)) {
      return next(new HttpError("Invalid id", 400));
    }

    if (req.userData && id === req.userData.id) {
       return next(new HttpError("You cannot change your own role or status", 403));
    }

    const findRole = await Role.findOne({ name: role });
    if (!findRole) {
      return next(new HttpError("Not found role", 404));
    }
    
    if (findRole.name === "owner") {
      return next(new HttpError("You cannot assign the owner role to a user.", 403));
    }

    if (email) {
      const emailExists = await User.findOne({ email, _id: { $ne: id } });
      if (emailExists) {
        return next(new HttpError("Email already in use", 400));
      }
    }

    if (phone) {
      const phoneExists = await User.findOne({ phone, _id: { $ne: id } });
      if (phoneExists) {
        return next(new HttpError("Phone number already in use", 400));
      }
    }

    let newAvatar = avatar;
    if (req.file) {
      newAvatar = await uploadImage(req.file.path);
      fs.unlinkSync(req.file.path);
    }

    let user = await User.findByIdAndUpdate(id, {
      email,
      phone,
      fullName,
      gender,
      dateOfBirth: dateOfBirth,
      status,
      avatar: newAvatar,
      role: findRole._id
    }, { new: true });

    if (!user) {
      return next(new HttpError("User not found", 404));
    }

    return res.status(200).json({
      success: true,
      user
    });
  } catch (err) {
    return next(new HttpError(err.message, 500));
  }
};


const updateMyProfile = async (req, res, next) => {
  try {
    const { fullName, gender, dateOfBirth, avatar } = req.body;
    const myEmail = req.userData.email;

    const user = await User.findOne({ email: myEmail });

    if (!user) {
      return next(new HttpError("User not found", 404));
    }

    let newAvatar = avatar;

    if (req.file) {
      newAvatar = await uploadImage(req.file.path);
      fs.unlinkSync(req.file.path);
    }

    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      {
        fullName,
        gender,
        dateOfBirth,
        avatar: newAvatar,
      },
      { new: true }
    );

    return res.status(200).json({
      user: updatedUser,
    });
  } catch (err) {
    return next(new HttpError(err.message || "Update profile failed", 500));
  }
};

module.exports = {
  register,
  verifyOtp,
  login,
  getProfile,
  forgotPassword,
  resetPassword,
  getAllUsers,
  updateUsers,
  findUserById,
  updateMyProfile
};