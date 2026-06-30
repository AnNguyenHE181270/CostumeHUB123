const cartService = require('../services/cart.service');
const HttpError = require('../models/http-error.model');

const getAllCarts = async (req, res, next) => {
  try {
    const result = await cartService.getAllCarts(req.userData.id);
    res.status(200).json(result);
  } catch (err) {
    next(err instanceof HttpError ? err : new HttpError(err.message || 'Get cart failed', 500));
  }
};

const addCart = async (req, res, next) => {
  try {
    const cart = await cartService.addCart(req.userData.id, req.body);
    res.status(200).json({ message: 'Add to cart successfully', cart });
  } catch (err) {
    next(err instanceof HttpError ? err : new HttpError(err.message || 'Creating cart failed', 500));
  }
};

const updateCart = async (req, res, next) => {
  try {
    const cart = await cartService.updateCart(req.userData.id, req.params.costumeId, req.body);
    res.status(200).json({ message: 'Cập nhật giỏ hàng thành công', cart });
  } catch (err) {
    next(err instanceof HttpError ? err : new HttpError(err.message || 'Cập nhật giỏ hàng thất bại', 500));
  }
};

const removeAllCartByCustomer = async (req, res, next) => {
  try {
    await cartService.removeAllCartByCustomer(req.userData.id);
    res.status(200).json({ message: 'Đã xóa toàn bộ giỏ hàng thành công' });
  } catch (err) {
    next(err instanceof HttpError ? err : new HttpError(err.message || 'Xóa giỏ hàng thất bại', 500));
  }
};

const removeCartItem = async (req, res, next) => {
  try {
    const cart = await cartService.removeCartItem(req.userData.id, req.body);
    res.status(200).json({ message: 'Đã xóa sản phẩm khỏi giỏ hàng', cart });
  } catch (err) {
    next(err instanceof HttpError ? err : new HttpError(err.message || 'Xóa sản phẩm thất bại', 500));
  }
};

module.exports = { getAllCarts, addCart, updateCart, removeAllCartByCustomer, removeCartItem };
