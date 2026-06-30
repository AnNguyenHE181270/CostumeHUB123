const userService = require('../services/user.service');
const HttpError = require('../models/http-error.model');

const register = async (req, res, next) => {
  try {
    const result = await userService.register(req.body);
    res.status(201).json({ message: 'Register successfully. Check your email for OTP.', ...result });
  } catch (err) {
    next(err instanceof HttpError ? err : new HttpError(err.message || 'Register failed.', 500));
  }
};

const verifyOtp = async (req, res, next) => {
  try {
    const user = await userService.verifyOtp(req.params.email, req.body.otp);
    res.status(200).json({ message: 'Email verified successfully.', user });
  } catch (err) {
    next(err instanceof HttpError ? err : new HttpError(err.message || 'Email verification failed.', 500));
  }
};

const resendOtp = async (req, res, next) => {
  try {
    await userService.resendOtp(req.params.email);
    res.status(200).json({ message: 'OTP resent successfully.' });
  } catch (err) {
    next(err instanceof HttpError ? err : new HttpError(err.message || 'Failed to resend OTP.', 500));
  }
};

const login = async (req, res, next) => {
  try {
    const result = await userService.login(req.body.email, req.body.password);
    if (result.isPending) {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản của bạn chưa được xác thực email. Một mã OTP mới đã được gửi.',
        isPending: true,
        email: result.email,
      });
    }
    res.status(200).json({ message: 'Login successful.', token: result.token });
  } catch (err) {
    next(err instanceof HttpError ? err : new HttpError(err.message || 'Login failed.', 500));
  }
};

const getMyProfile = async (req, res, next) => {
  try {
    const user = await userService.getMyProfile(req.userData.email);
    res.status(200).json({ user });
  } catch (err) {
    next(err instanceof HttpError ? err : new HttpError(err.message || 'Fetch profile failed.', 500));
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    await userService.forgotPassword(req.body.email);
    res.status(200).json({ message: 'If an account with this email exists, password reset instructions have been sent.' });
  } catch (err) {
    next(err instanceof HttpError ? err : new HttpError(err.message || 'Error system.', 500));
  }
};

const resetPassword = async (req, res, next) => {
  try {
    await userService.resetPassword(req.params.token, req.body.password);
    res.status(200).json({ message: 'Password reset successful.' });
  } catch (err) {
    next(err instanceof HttpError ? err : new HttpError(err.message || 'Password reset failed.', 500));
  }
};

const getAllUsers = async (req, res, next) => {
  try {
    const users = await userService.getAllUsers();
    res.status(200).json({ users });
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
    next(err instanceof HttpError ? err : new HttpError(err.message || 'Update profile failed', 500));
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
    res.status(200).json({ message: 'Address deleted successfully' });
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
