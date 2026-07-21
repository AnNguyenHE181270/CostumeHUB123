const userService = require('../services/user.service');
const HttpError = require('../models/http-error.model');

const register = async (req, res, next) => {
  try {
    const result = await userService.register(req.body);
    res.status(201).json({ message: 'Đăng ký thành công. Vui lòng kiểm tra email để nhận mã OTP.', ...result });
  } catch (err) {
    next(err instanceof HttpError ? err : new HttpError(err.message || 'Đăng ký thất bại.', 500));
  }
};

const verifyOtp = async (req, res, next) => {
  try {
    const user = await userService.verifyOtp(req.params.email, req.body.otp);
    res.status(200).json({ message: 'Xác thực email thành công.', user });
  } catch (err) {
    next(err instanceof HttpError ? err : new HttpError(err.message || 'Xác thực email thất bại.', 500));
  }
};

const resendOtp = async (req, res, next) => {
  try {
    await userService.resendOtp(req.params.email);
    res.status(200).json({ message: 'Đã gửi lại mã OTP thành công.' });
  } catch (err) {
    next(err instanceof HttpError ? err : new HttpError(err.message || 'Gửi lại mã OTP thất bại.', 500));
  }
};

const login = async (req, res, next) => {
  try {
    const result = await userService.login(req.body.email, req.body.password);
    if (result.isPending) {
      return res.status(200).json({
        success: false,
        message: 'Tài khoản của bạn chưa được xác thực email. Vui lòng xác thực để tiếp tục.',
        isPending: true,
        email: result.email,
      });
    }
    res.status(200).json({ message: 'Đăng nhập thành công.', token: result.token });
  } catch (err) {
    next(err instanceof HttpError ? err : new HttpError(err.message || 'Đăng nhập thất bại.', 500));
  }
};

const getMyProfile = async (req, res, next) => {
  try {
    const user = await userService.getMyProfile(req.userData.email);
    res.status(200).json({ user });
  } catch (err) {
    next(err instanceof HttpError ? err : new HttpError(err.message || 'Lấy thông tin tài khoản thất bại.', 500));
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    await userService.forgotPassword(req.body.email);
    res.status(200).json({ message: 'Nếu tài khoản với email này tồn tại, hướng dẫn đặt lại mật khẩu đã được gửi.' });
  } catch (err) {
    next(err instanceof HttpError ? err : new HttpError(err.message || 'Lỗi hệ thống.', 500));
  }
};

const resetPassword = async (req, res, next) => {
  try {
    await userService.resetPassword(req.params.token, req.body.password);
    res.status(200).json({ message: 'Đặt lại mật khẩu thành công.' });
  } catch (err) {
    next(err instanceof HttpError ? err : new HttpError(err.message || 'Đặt lại mật khẩu thất bại.', 500));
  }
};

const getAllUsers = async (req, res, next) => {
  try {
    const { search, role, status, page, limit } = req.query;
    const result = await userService.getAllUsers({ search, role, status, page, limit });
    res.status(200).json(result);
  } catch (err) {
    next(err instanceof HttpError ? err : new HttpError(err.message, 500));
  }
};

const findUserById = async (req, res, next) => {
  try {
    const user = await userService.findUserById(req.params.id);
    res.status(200).json({ success: true, user });
  } catch (err) {
    next(err instanceof HttpError ? err : new HttpError(err.message, 500));
  }
};

const updateUsers = async (req, res, next) => {
  try {
    const user = await userService.updateUsers(req.params.id, { ...req.body, file: req.file }, req.userData?.id);
    res.status(200).json({ success: true, user });
  } catch (err) {
    next(err instanceof HttpError ? err : new HttpError(err.message, 500));
  }
};

const updateMyProfile = async (req, res, next) => {
  try {
    const user = await userService.updateMyProfile(req.userData.email, { ...req.body, file: req.file });
    res.status(200).json({ user });
  } catch (err) {
    next(err instanceof HttpError ? err : new HttpError(err.message || 'Cập nhật thông tin thất bại.', 500));
  }
};

const createAddress = async (req, res, next) => {
  try {
    const address = await userService.createAddress(req.userData.email, req.body);
    res.status(200).json(address);
  } catch (err) {
    next(err instanceof HttpError ? err : new HttpError(err.message, 500));
  }
};

const getAllAddresses = async (req, res, next) => {
  try {
    const addresses = await userService.getAllAddresses(req.userData.email);
    res.status(200).json({ addresses });
  } catch (err) {
    next(err instanceof HttpError ? err : new HttpError(err.message, 500));
  }
};

const updateAddress = async (req, res, next) => {
  try {
    const address = await userService.updateAddress(req.userData.email, req.params.id, req.body);
    res.status(200).json({ address });
  } catch (err) {
    next(err instanceof HttpError ? err : new HttpError(err.message, 500));
  }
};

const deleteAddress = async (req, res, next) => {
  try {
    await userService.deleteAddress(req.userData.email, req.params.id);
    res.status(200).json({ message: 'Xóa địa chỉ thành công.' });
  } catch (err) {
    next(err instanceof HttpError ? err : new HttpError(err.message, 500));
  }
};

const findAddressById = async (req, res, next) => {
  try {
    const address = await userService.findAddressById(req.userData.email, req.params.id);
    res.status(200).json({ address });
  } catch (err) {
    next(err instanceof HttpError ? err : new HttpError(err.message, 500));
  }
};

module.exports = {
  register, verifyOtp, resendOtp, login, getMyProfile,
  forgotPassword, resetPassword, getAllUsers, updateUsers,
  findUserById, updateMyProfile, createAddress, getAllAddresses,
  updateAddress, deleteAddress, findAddressById,
};
