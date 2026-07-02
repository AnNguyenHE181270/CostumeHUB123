const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const fs = require('fs');
const { ObjectId } = require('mongodb');
const HttpError = require('../models/http-error.model');
const User = require('../models/user.model');
const Role = require('../models/role.model');
const sendEmail = require('./email.service');
const { uploadImage } = require('./cloudinary.service');

const generateOTP = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let otp = '';
  for (let i = 0; i < 6; i++) otp += chars[Math.floor(Math.random() * chars.length)];
  return otp;
};

const sendEmailVerification = async (email, otp, fullName) => {
  await sendEmail({
    to: email,
    subject: 'Vogue Rental — Xác thực tài khoản của bạn',
    text: `Mã xác thực của bạn là: ${otp}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <h2>Xin chào ${fullName || 'bạn'},</h2>
        <p>Cảm ơn bạn đã đăng ký tài khoản tại Vogue Rental.</p>
        <p>Mã xác thực (OTP) của bạn là:</p>
        <div style="background:#f4f4f4;padding:15px;text-align:center;font-size:24px;font-weight:bold;letter-spacing:5px;margin:20px 0">${otp}</div>
        <p>Mã này sẽ hết hạn sau 10 phút.</p>
        <p>Trân trọng,<br/>Đội ngũ Vogue Rental</p>
      </div>`,
  });
};

const sendResetPasswordEmail = async (email, resetUrl, fullName) => {
  await sendEmail({
    to: email,
    subject: 'Vogue Rental — Đặt lại mật khẩu',
    text: `Bạn yêu cầu đặt lại mật khẩu. Nhấn vào link sau (hiệu lực 15 phút): ${resetUrl}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <h2>Xin chào ${fullName || 'bạn'},</h2>
        <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản Vogue Rental của bạn.</p>
        <p>Vui lòng nhấn vào nút bên dưới để đặt lại mật khẩu mới. Link này chỉ có hiệu lực trong 15 phút.</p>
        <div style="margin:30px 0">
          <a href="${resetUrl}" style="background:#1a1a1a;color:white;padding:12px 24px;text-decoration:none;border-radius:4px;font-weight:bold">Đặt Lại Mật Khẩu</a>
        </div>
        <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
        <p>Trân trọng,<br/>Đội ngũ Vogue Rental</p>
      </div>`,
  });
};

const register = async ({ fullName, email, phone, password, gender, dateOfBirth }) => {
  const now = new Date();
  const existUser = await User.findOne({ email });

  if (existUser && existUser.status === 'active') {
    throw new HttpError('An account with this email already exists. Please log in instead.', 422);
  }
  if (phone) {
    const existPhone = await User.findOne({ phone });
    if (existPhone && existPhone.status === 'active' && (!existUser || existPhone._id.toString() !== existUser._id.toString())) {
      throw new HttpError('An account with this phone number already exists.', 422);
    }
  }
  if (existUser && existUser.status === 'blocked' && existUser.isEmailVerified) {
    throw new HttpError('This account cannot be registered again.', 403);
  }

  const roleUser = await Role.findOne({ name: 'online-customer' });
  if (!roleUser) throw new HttpError('Online customer role not found', 404);

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);
  const otp = generateOTP();
  const otpHash = await bcrypt.hash(otp, salt);
  const otpExpires = new Date(now.getTime() + 10 * 60 * 1000);
  const otpCooldownUntil = new Date(now.getTime() + 60 * 1000);

  if (existUser && existUser.status === 'pending' && !existUser.isEmailVerified) {
    const updatedUser = await User.findByIdAndUpdate(
      existUser._id,
      { fullName, phone, password: passwordHash, role: roleUser._id, gender: gender || null, dateOfBirth: dateOfBirth || null, otpCode: otpHash, otpExpires, otpCooldownUntil, status: 'pending' },
      { new: true }
    );
    await sendEmailVerification(email, otp, fullName);
    return {
      type: 'new',
      user: { id: updatedUser._id, fullName: updatedUser.fullName, email: updatedUser.email, phone: updatedUser.phone },
      remainingTime: 10 * 60 * 1000,
      nextResendIn: 60 * 1000,
    };
  }

  const newUser = await User.create({
    fullName, email, phone, password: passwordHash, role: roleUser._id,
    gender: gender || null, dateOfBirth: dateOfBirth || null,
    otpCode: otpHash, otpExpires, otpCooldownUntil, status: 'pending',
  });
  await sendEmailVerification(email, otp, fullName);

  return {
    type: 'new',
    user: { id: newUser._id, fullName: newUser.fullName, email: newUser.email, phone: newUser.phone },
    remainingTime: 10 * 60 * 1000,
    nextResendIn: 60 * 1000,
  };
};

const verifyOtp = async (email, otp) => {
  const existUser = await User.findOne({ email }).select('+otpCode +otpExpires +otpCooldownUntil');
  if (!existUser) throw new HttpError('User not found.', 404);
  if (existUser.status === 'active' && existUser.isEmailVerified) throw new HttpError('User is already verified.', 400);
  if (existUser.status === 'blocked') throw new HttpError('This account is blocked.', 403);
  if (!existUser.otpCode || !existUser.otpExpires) throw new HttpError('OTP not found. Please register again.', 400);
  if (existUser.otpExpires < new Date()) throw new HttpError('OTP has expired. Please register again.', 400);

  const isValidOtp = await bcrypt.compare(otp, existUser.otpCode);
  if (!isValidOtp) throw new HttpError('Invalid OTP.', 400);

  existUser.status = 'active';
  existUser.isEmailVerified = true;
  existUser.otpCode = null;
  existUser.otpExpires = null;
  existUser.otpCooldownUntil = null;
  await existUser.save();

  return { id: existUser._id, fullName: existUser.fullName, email: existUser.email, phone: existUser.phone, status: existUser.status };
};

const resendOtp = async (email) => {
  const existUser = await User.findOne({ email }).select('+otpCooldownUntil');
  if (!existUser) throw new HttpError('User not found.', 404);
  if (existUser.status === 'active' && existUser.isEmailVerified) throw new HttpError('User is already verified.', 400);
  if (existUser.status === 'blocked') throw new HttpError('This account is blocked.', 403);

  const now = new Date();
  if (existUser.otpCooldownUntil && existUser.otpCooldownUntil > now) {
    throw new HttpError('Please wait before requesting a new OTP.', 429);
  }

  const otp = generateOTP();
  const salt = await bcrypt.genSalt(10);
  existUser.otpCode = await bcrypt.hash(otp, salt);
  existUser.otpExpires = new Date(now.getTime() + 10 * 60 * 1000);
  existUser.otpCooldownUntil = new Date(now.getTime() + 60 * 1000);
  await existUser.save();

  await sendEmailVerification(email, otp, existUser.fullName);
};

const login = async (email, password) => {
  const existUser = await User.findOne({ email }).select('+password').populate('role');
  if (!existUser) throw new HttpError('User not found.', 404);
  if (existUser.status === 'blocked') throw new HttpError('User is blocked.', 403);

  const checkPassword = await bcrypt.compare(password, existUser.password);
  if (!checkPassword) throw new HttpError('Incorrect password.', 401);

  if (existUser.status === 'pending' && !existUser.isEmailVerified) {
    const otp = generateOTP();
    const salt = await bcrypt.genSalt(10);
    const now = new Date();
    existUser.otpCode = await bcrypt.hash(otp, salt);
    existUser.otpExpires = new Date(now.getTime() + 10 * 60 * 1000);
    existUser.otpCooldownUntil = new Date(now.getTime() + 60 * 1000);
    await existUser.save();
    await sendEmailVerification(email, otp, existUser.fullName);
    return { isPending: true, email: existUser.email };
  }

  const token = jwt.sign(
    { id: existUser._id, email: existUser.email, role: existUser.role.name },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
  return { token };
};

const getMyProfile = async (email) => {
  const user = await User.findOne({ email }).populate('role');
  if (!user) throw new HttpError('User not found.', 404);
  return {
    id: user._id, fullName: user.fullName, email: user.email, phone: user.phone,
    gender: user.gender, dateOfBirth: user.dateOfBirth, provider: user.provider,
    role: user.role.name, avatar: user.avatar, addresses: user.addresses, balance: user.balance,
  };
};

const forgotPassword = async (email) => {
  const user = await User.findOne({ email });
  if (!user) throw new HttpError('If an account with this email exists, password reset instructions have been sent.', 200);
  if (!user.isEmailVerified) throw new HttpError('Email is not verified. Please verify your email before resetting your password.', 403);
  if (user.status === 'blocked') throw new HttpError('Your account has been blocked. Please contact support for assistance.', 403);

  const resetToken = crypto.randomBytes(32).toString('hex');
  user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  user.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
  await user.save();

  const resetUrl = `http://localhost:3000/reset-password/${resetToken}`;
  await sendResetPasswordEmail(email, resetUrl, user.fullName);
};

const resetPassword = async (token, password) => {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({ resetPasswordToken: hashedToken, resetPasswordExpire: { $gt: Date.now() } });
  if (!user) throw new HttpError('Invalid or expired token.', 400);

  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(password, salt);
  user.resetPasswordToken = null;
  user.resetPasswordExpire = null;
  await user.save();
};

const getAllUsers = async () => {
  const users = await User.find().populate('role');
  return users.map((u) => ({
    fullName: u.fullName, email: u.email, phone: u.phone, avatar: u.avatar,
    status: u.status, role: u.role.name, createdAt: u.createdAt, updatedAt: u.updatedAt, id: u._id,
  }));
};

const findUserById = async (id) => {
  if (!ObjectId.isValid(id)) throw new HttpError('Invalid id', 400);
  const user = await User.findById(id).populate('role');
  if (!user) throw new HttpError('Not found user', 404);
  return user;
};

const updateUsers = async (id, data, currentUserId) => {
  const { email, phone, fullName, gender, dateOfBirth, avatar, role, status } = data;

  if (!ObjectId.isValid(id)) throw new HttpError('Invalid id', 400);
  if (currentUserId && id === currentUserId) throw new HttpError('You cannot change your own role or status', 403);

  const findRole = await Role.findOne({ name: role });
  if (!findRole) throw new HttpError('Not found role', 404);
  if (findRole.name === 'owner') throw new HttpError('You cannot assign the owner role to a user.', 403);

  if (email) {
    const emailExists = await User.findOne({ email, _id: { $ne: id } });
    if (emailExists) throw new HttpError('Email already in use', 400);
  }
  if (phone) {
    const phoneExists = await User.findOne({ phone, _id: { $ne: id } });
    if (phoneExists) throw new HttpError('Phone number already in use', 400);
  }

  let newAvatar = avatar;
  if (data.file) {
    newAvatar = await uploadImage(data.file.path);
    fs.unlinkSync(data.file.path);
  }

  const user = await User.findByIdAndUpdate(
    id,
    { email, phone, fullName, gender, dateOfBirth, status, avatar: newAvatar, role: findRole._id },
    { new: true }
  );
  if (!user) throw new HttpError('User not found', 404);
  return user;
};

const updateMyProfile = async (email, data) => {
  const { fullName, gender, dateOfBirth, avatar } = data;
  const user = await User.findOne({ email });
  if (!user) throw new HttpError('User not found', 404);

  let newAvatar = avatar;
  if (data.file) {
    newAvatar = await uploadImage(data.file.path);
    fs.unlinkSync(data.file.path);
  }

  return User.findByIdAndUpdate(user._id, { fullName, gender, dateOfBirth, avatar: newAvatar }, { new: true });
};

const createAddress = async (email, addressData) => {
  const { receiverName, receiverPhone, province, provinceId, district, districtId, ward, wardCode, addressDetail, note, isDefault } = addressData;
  const user = await User.findOne({ email });
  if (!user) throw new HttpError('User not found', 404);

  if (isDefault) user.addresses.forEach((addr) => { addr.isDefault = false; });

  user.addresses.push({
    receiverName, receiverPhone, province, provinceId, district, districtId, ward, wardCode,
    addressDetail, note, isDefault: isDefault || user.addresses.length === 0,
  });
  await user.save();
  return user.addresses[user.addresses.length - 1];
};

const getAllAddresses = async (email) => {
  const user = await User.findOne({ email });
  if (!user) throw new HttpError('User not found', 404);
  return user.addresses;
};

const updateAddress = async (email, id, addressData) => {
  const user = await User.findOne({ email });
  if (!user) throw new HttpError('User not found', 404);

  const address = user.addresses.find((ua) => ua._id.toString() === id);
  if (!address) throw new HttpError('Address not found', 404);

  if (addressData.isDefault) user.addresses.forEach((addr) => { addr.isDefault = false; });

  const fields = ['receiverName', 'receiverPhone', 'province', 'district', 'ward', 'addressDetail', 'note'];
  fields.forEach((f) => { if (addressData[f]) address[f] = addressData[f]; });
  if (addressData.provinceId !== undefined) address.provinceId = addressData.provinceId;
  if (addressData.districtId !== undefined) address.districtId = addressData.districtId;
  if (addressData.wardCode !== undefined) address.wardCode = addressData.wardCode;
  if (addressData.isDefault !== undefined) address.isDefault = addressData.isDefault;

  await user.save();
  return address;
};

const deleteAddress = async (email, id) => {
  const user = await User.findOne({ email });
  if (!user) throw new HttpError('User not found', 404);

  const address = user.addresses.find((addr) => addr._id.toString() === id);
  if (!address) throw new HttpError('Address not found', 404);
  if (user.addresses.length === 1) throw new HttpError('Cannot delete the last address', 400);

  user.addresses = user.addresses.filter((addr) => addr._id.toString() !== id);
  if (!user.addresses.some((addr) => addr.isDefault) && user.addresses.length > 0) {
    user.addresses[0].isDefault = true;
  }
  await user.save();
};

const findAddressById = async (email, id) => {
  const user = await User.findOne({ email });
  if (!user) throw new HttpError('User not found', 404);
  const address = user.addresses.find((ua) => ua._id.toString() === id);
  if (!address) throw new HttpError('Address not found', 404);
  return address;
};

module.exports = {
  register, verifyOtp, resendOtp, login, getMyProfile,
  forgotPassword, resetPassword, getAllUsers, findUserById,
  updateUsers, updateMyProfile, createAddress, getAllAddresses,
  updateAddress, deleteAddress, findAddressById,
};
