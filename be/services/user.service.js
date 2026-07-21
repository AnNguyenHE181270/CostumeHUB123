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
    subject: 'CostumeHUB — Xác thực tài khoản của bạn',
    text: `Mã xác thực của bạn là: ${otp}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <h2>Xin chào ${fullName || 'bạn'},</h2>
        <p>Cảm ơn bạn đã đăng ký tài khoản tại CostumeHUB.</p>
        <p>Mã xác thực (OTP) của bạn là:</p>
        <div style="background:#f4f4f4;padding:15px;text-align:center;font-size:24px;font-weight:bold;letter-spacing:5px;margin:20px 0">${otp}</div>
        <p>Hoặc bạn có thể <a href="http://localhost:3000/verify-otp/${encodeURIComponent(email)}?otp=${otp}" style="color: #007bff; font-weight: bold; text-decoration: none;">nhấn vào đây để xác thực tự động</a>.</p>
        <p>Mã này sẽ hết hạn sau 10 phút.</p>
        <p>Trân trọng,<br/>Đội ngũ CostumeHUB</p>
      </div>`,
  });
};

const sendResetPasswordEmail = async (email, resetUrl, fullName) => {
  const htmlContent = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="background-color: #f5f5f5; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333333; margin: 0; padding: 0; -webkit-font-smoothing: antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); max-width: 600px;">
          
          <!-- Header (Logo/Brand Name) -->
          <tr>
            <td align="center" style="padding: 40px 0; background-color: #111111;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 300; letter-spacing: 4px; text-transform: uppercase;">CostumeHUB</h1>
            </td>
          </tr>
          
          <!-- Body Content -->
          <tr>
            <td style="padding: 40px 40px;">
              <h2 style="margin-top: 0; font-size: 20px; font-weight: 600; color: #111111;">Xin chào ${fullName || 'bạn'},</h2>
              <p style="font-size: 16px; line-height: 1.6; color: #555555; margin-bottom: 24px;">
                Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản CostumeHUB của bạn.
              </p>
              <p style="font-size: 16px; line-height: 1.6; color: #555555; margin-bottom: 32px;">
                Vui lòng nhấn vào nút bên dưới để thiết lập lại mật khẩu mới. Xin lưu ý rằng đường dẫn này chỉ có hiệu lực trong vòng <strong style="color: #111111;">15 phút</strong>.
              </p>
              
              <!-- Call To Action Button -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center">
                    <a href="${resetUrl}" style="display: inline-block; padding: 14px 40px; background-color: #111111; color: #ffffff; text-decoration: none; border-radius: 4px; font-size: 16px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase;">Đặt Lại Mật Khẩu</a>
                  </td>
                </tr>
              </table>

              <!-- Additional Information -->
              <p style="font-size: 14px; line-height: 1.6; color: #888888; margin-top: 40px; border-top: 1px solid #eeeeee; padding-top: 24px;">
                Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này. Mật khẩu và tài khoản của bạn vẫn an toàn.
              </p>
              
              <!-- Fallback Link -->
              <p style="font-size: 14px; line-height: 1.6; color: #888888; margin-top: 20px; word-break: break-all;">
                Hoặc bạn có thể sao chép và dán đường dẫn sau vào trình duyệt:<br>
                <a href="${resetUrl}" style="color: #666666; text-decoration: underline;">${resetUrl}</a>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td align="center" style="padding: 30px 40px; background-color: #fafafa; border-top: 1px solid #eaeaea;">
              <p style="font-size: 14px; color: #888888; margin: 0; margin-bottom: 8px;">Trân trọng,</p>
              <p style="font-size: 16px; font-weight: 600; color: #111111; margin: 0; text-transform: uppercase; letter-spacing: 1px;">Đội ngũ CostumeHUB</p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  await sendEmail({
    to: email,
    subject: 'CostumeHUB — Đặt lại mật khẩu',
    text: `Xin chào ${fullName || 'bạn'},\n\nBạn yêu cầu đặt lại mật khẩu cho tài khoản CostumeHUB. Nhấn vào link sau (hiệu lực 15 phút): ${resetUrl}\n\nNếu bạn không yêu cầu, vui lòng bỏ qua email này.\n\nTrân trọng,\nĐội ngũ CostumeHUB`,
    html: htmlContent,
  });
};

const register = async ({ fullName, email, phone, password, gender, dateOfBirth }) => {
  const now = new Date();

  if (!phone) throw new HttpError('Số điện thoại không được để trống.', 400);
  if (!gender) throw new HttpError('Giới tính không được để trống.', 400);
  if (!dateOfBirth) throw new HttpError('Ngày sinh không được để trống.', 400);
  if (new Date(dateOfBirth) > now) throw new HttpError('Ngày sinh không thể ở trong tương lai.', 400);

  const existUser = await User.findOne({ email });

  if (existUser && existUser.status === 'active') {
    throw new HttpError('Tài khoản với email này đã tồn tại. Vui lòng đăng nhập.', 422);
  }
  if (phone) {
    const existPhone = await User.findOne({ phone });
    if (existPhone && existPhone.status === 'active' && (!existUser || existPhone._id.toString() !== existUser._id.toString())) {
      throw new HttpError('Tài khoản với số điện thoại này đã tồn tại.', 422);
    }
  }
  if (existUser && existUser.status === 'blocked' && existUser.isEmailVerified) {
    throw new HttpError('Tài khoản này không thể đăng ký lại.', 403);
  }

  const roleUser = await Role.findOne({ name: 'online-customer' });
  if (!roleUser) throw new HttpError('Không tìm thấy vai trò khách hàng trực tuyến', 404);

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
  if (!existUser) throw new HttpError('Không tìm thấy người dùng.', 404);
  if (existUser.status === 'active' && existUser.isEmailVerified) throw new HttpError('Người dùng đã được xác thực.', 400);
  if (existUser.status === 'blocked') throw new HttpError('Tài khoản này đã bị khóa.', 403);
  if (!existUser.otpCode || !existUser.otpExpires) throw new HttpError('Không tìm thấy OTP. Vui lòng đăng ký lại.', 400);
  if (existUser.otpExpires < new Date()) throw new HttpError('OTP đã hết hạn. Vui lòng đăng ký lại.', 400);

  const isValidOtp = await bcrypt.compare(otp, existUser.otpCode);
  if (!isValidOtp) throw new HttpError('OTP không hợp lệ.', 400);

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
  if (!existUser) throw new HttpError('Không tìm thấy người dùng.', 404);
  if (existUser.status === 'active' && existUser.isEmailVerified) throw new HttpError('Người dùng đã được xác thực.', 400);
  if (existUser.status === 'blocked') throw new HttpError('Tài khoản này đã bị khóa.', 403);

  const now = new Date();
  if (existUser.otpCooldownUntil && existUser.otpCooldownUntil > now) {
    throw new HttpError('Vui lòng chờ trước khi yêu cầu OTP mới.', 429);
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
  if (!existUser) throw new HttpError('Không tìm thấy người dùng.', 404);
  if (existUser.status === 'blocked') throw new HttpError('Người dùng đã bị khóa.', 403);

  const checkPassword = await bcrypt.compare(password, existUser.password);
  if (!checkPassword) throw new HttpError('Mật khẩu không chính xác.', 401);

  if (existUser.status === 'pending') {
    const now = new Date();
    if (!existUser.otpCooldownUntil || existUser.otpCooldownUntil <= now) {
      const otp = generateOTP();
      const salt = await bcrypt.genSalt(10);
      existUser.otpCode = await bcrypt.hash(otp, salt);
      existUser.otpExpires = new Date(now.getTime() + 10 * 60 * 1000);
      existUser.otpCooldownUntil = new Date(now.getTime() + 60 * 1000);
      await existUser.save();
      await sendEmailVerification(email, otp, existUser.fullName);
    }
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
  if (!user) throw new HttpError('Không tìm thấy người dùng.', 404);
  return {
    id: user._id, fullName: user.fullName, email: user.email, phone: user.phone,
    gender: user.gender, dateOfBirth: user.dateOfBirth, provider: user.provider,
    role: user.role.name, avatar: user.avatar, addresses: user.addresses, balance: user.balance,
  };
};

const forgotPassword = async (email) => {
  const user = await User.findOne({ email }).select('+resetPasswordCooldownUntil');
  if (!user) throw new HttpError('Nếu tài khoản với email này tồn tại, hướng dẫn đặt lại mật khẩu đã được gửi.', 200);
  if (!user.isEmailVerified) throw new HttpError('Email chưa được xác thực. Vui lòng xác thực email trước khi đặt lại mật khẩu.', 403);
  if (user.status === 'blocked') throw new HttpError('Tài khoản của bạn đã bị khóa. Vui lòng liên hệ hỗ trợ để được trợ giúp.', 403);

  const now = new Date();
  if (user.resetPasswordCooldownUntil && user.resetPasswordCooldownUntil > now) {
    throw new HttpError('Vui lòng chờ trước khi yêu cầu gửi lại email đặt lại mật khẩu.', 429);
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  user.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
  user.resetPasswordCooldownUntil = new Date(now.getTime() + 60 * 1000);
  await user.save();

  const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
  const resetUrl = `${clientUrl}/reset-password/${resetToken}`;
  await sendResetPasswordEmail(email, resetUrl, user.fullName);
};

const resetPassword = async (token, password) => {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({ resetPasswordToken: hashedToken, resetPasswordExpire: { $gt: Date.now() } });
  if (!user) throw new HttpError('Token không hợp lệ hoặc đã hết hạn.', 400);

  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(password, salt);
  user.resetPasswordToken = null;
  user.resetPasswordExpire = null;
  user.resetPasswordCooldownUntil = null;
  await user.save();
};

const getAllUsers = async (search = '') => {
  const query = search ? {
    $or: [
      { fullName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ]
  } : {};
  const users = await User.find(query).populate('role');
  return users.map((u) => ({
    fullName: u.fullName, email: u.email, phone: u.phone, avatar: u.avatar,
    status: u.status, role: u.role.name, createdAt: u.createdAt, updatedAt: u.updatedAt, id: u._id,
  }));
};

const findUserById = async (id) => {
  if (!ObjectId.isValid(id)) throw new HttpError('ID không hợp lệ', 400);
  const user = await User.findById(id).populate('role');
  if (!user) throw new HttpError('Không tìm thấy người dùng', 404);
  return user;
};

const updateUsers = async (id, data, currentUserId) => {
  const { email, phone, fullName, gender, dateOfBirth, avatar, role, status } = data;

  if (!ObjectId.isValid(id)) throw new HttpError('ID không hợp lệ', 400);
  if (currentUserId && id === currentUserId) throw new HttpError('Bạn không thể thay đổi vai trò hoặc trạng thái của chính mình', 403);

  const targetUser = await User.findById(id);
  if (!targetUser) throw new HttpError('Không tìm thấy người dùng', 404);

  if (targetUser.status !== 'pending' && status === 'pending') {
    throw new HttpError('Không thể chuyển trạng thái người dùng về pending.', 400);
  }

  const findRole = await Role.findOne({ name: role });
  if (!findRole) throw new HttpError('Không tìm thấy vai trò', 404);
  if (findRole.name === 'owner') throw new HttpError('Bạn không thể gán vai trò chủ sở hữu cho người dùng.', 403);

  if (email) {
    const emailExists = await User.findOne({ email, _id: { $ne: id } });
    if (emailExists) throw new HttpError('Email đã được sử dụng', 400);
  }
  if (phone) {
    const phoneExists = await User.findOne({ phone, _id: { $ne: id } });
    if (phoneExists) throw new HttpError('Số điện thoại đã được sử dụng', 400);
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
  if (!user) throw new HttpError('Không tìm thấy người dùng', 404);
  return user;
};

const updateMyProfile = async (email, data) => {
  const { fullName, gender, dateOfBirth, avatar } = data;
  const user = await User.findOne({ email });
  if (!user) throw new HttpError('Không tìm thấy người dùng', 404);

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
  if (!user) throw new HttpError('Không tìm thấy người dùng', 404);

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
  if (!user) throw new HttpError('Không tìm thấy người dùng', 404);
  return user.addresses;
};

const updateAddress = async (email, id, addressData) => {
  const user = await User.findOne({ email });
  if (!user) throw new HttpError('Không tìm thấy người dùng', 404);

  const address = user.addresses.find((ua) => ua._id.toString() === id);
  if (!address) throw new HttpError('Không tìm thấy địa chỉ', 404);

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
  if (!user) throw new HttpError('Không tìm thấy người dùng', 404);

  const address = user.addresses.find((addr) => addr._id.toString() === id);
  if (!address) throw new HttpError('Không tìm thấy địa chỉ', 404);
  if (user.addresses.length === 1) throw new HttpError('Không thể xóa địa chỉ cuối cùng', 400);

  user.addresses = user.addresses.filter((addr) => addr._id.toString() !== id);
  if (!user.addresses.some((addr) => addr.isDefault) && user.addresses.length > 0) {
    user.addresses[0].isDefault = true;
  }
  await user.save();
};

const findAddressById = async (email, id) => {
  const user = await User.findOne({ email });
  if (!user) throw new HttpError('Không tìm thấy người dùng', 404);
  const address = user.addresses.find((ua) => ua._id.toString() === id);
  if (!address) throw new HttpError('Không tìm thấy địa chỉ', 404);
  return address;
};

module.exports = {
  register, verifyOtp, resendOtp, login, getMyProfile,
  forgotPassword, resetPassword, getAllUsers, findUserById,
  updateUsers, updateMyProfile, createAddress, getAllAddresses,
  updateAddress, deleteAddress, findAddressById,
};
