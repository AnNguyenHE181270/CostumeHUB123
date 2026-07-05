const Cart = require('../models/cart.model');
const Costume = require('../models/costume.model');
const HttpError = require('../models/http-error.model');

const getAllCarts = async (userId) => {
  const carts = await Cart.find({ customerId: userId })
    .populate({
      path: 'items.costume',
      populate: { path: 'categoryId', select: 'name' },
    })
    .lean();

  if (carts.length === 0) throw new HttpError('Cart is empty.', 404);

  return carts.flatMap((cart) =>
    cart.items.map((item) => ({
      _id: item._id,
      costumeId: item.costume?._id,
      costumeName: item.costume.name,
      image: item.costume?.images?.[0] || null,
      category: item.costume.categoryId.name,
      size: item.size,
      quantity: item.quantity,
      status: item.status,
      startDate: item.startDate,
      endDate: item.endDate,
      deposit: item.costume.deposit,
      rentalDays: item.rentalDays,
      rentalPerDay: item.costume.pricePerDay,
      variants: item.costume?.variants || [],
      variant: item.costume?.variants?.find((v) => v.size === item.size) || { size: item.size },
    }))
  );
};

const addCart = async (userId, { costumeId, size, quantity, startDate, endDate }) => {
  const costume = await Costume.findById(costumeId);
  if (!costume) throw new HttpError('Costume not found', 404);

  const numQuantity = Number(quantity);
  if (!size || !numQuantity || !startDate || !endDate) {
    throw new HttpError('Vui lòng cung cấp đủ thông tin: size, quantity, startDate, endDate', 400);
  }

  const variant = costume.variants.find((v) => v.size === size);
  if (!variant) throw new HttpError(`Sản phẩm không có size ${size}`, 404);
  if (numQuantity > variant.availableStock) {
    throw new HttpError(`Số lượng yêu cầu vượt quá tồn kho. Kho chỉ còn ${variant.availableStock}`, 400);
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) throw new HttpError('Ngày tháng không hợp lệ', 400);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today.getTime());
  tomorrow.setDate(tomorrow.getDate() + 1);

  const startNorm = new Date(start); startNorm.setHours(0, 0, 0, 0);
  const endNorm = new Date(end); endNorm.setHours(0, 0, 0, 0);

  if (startNorm < tomorrow) throw new HttpError('Vui lòng đặt thuê đồ trước ít nhất 1 ngày', 400);
  if (endNorm < startNorm) throw new HttpError('Vui lòng đặt thuê đồ trước ít nhất 1 ngày', 400);

  const rentalDays = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
  const newItem = { costume: costumeId, size, quantity: numQuantity, startDate: start, endDate: end, rentalDays };

  let cart = await Cart.findOne({ customerId: userId });

  if (!cart) {
    cart = await Cart.create({ customerId: userId, items: [newItem] });
  } else {
    const overlappingItem = cart.items.find(
      (item) =>
        item.costume.toString() === costumeId &&
        item.size === size &&
        !(new Date(item.startDate).getTime() === start.getTime() && new Date(item.endDate).getTime() === end.getTime()) &&
        // Điều kiện trùng lấn ngày: Start1 <= End2 và End1 >= Start2
        new Date(item.startDate).getTime() <= end.getTime() &&
        new Date(item.endDate).getTime() >= start.getTime()
    );

    if (overlappingItem) {
      throw new HttpError('Trùng ngày thuê. Vui lòng kiểm tra lại giỏ hàng.', 400);
    }

    const itemIndex = cart.items.findIndex(
      (item) =>
        item.costume.toString() === costumeId &&
        item.size === size &&
        new Date(item.startDate).getTime() === start.getTime() &&
        new Date(item.endDate).getTime() === end.getTime()
    );

    if (itemIndex > -1) {
      const existingQty = cart.items[itemIndex].quantity;
      const newQuantity = existingQty + numQuantity;
      if (newQuantity > variant.availableStock) {
        throw new HttpError(`Số lượng tổng trong giỏ vượt quá tồn kho. Kho chỉ còn ${variant.availableStock}`, 400);
      }
      cart = await Cart.findOneAndUpdate(
        { customerId: userId },
        { $inc: { [`items.${itemIndex}.quantity`]: numQuantity } },
        { new: true }
      );
    } else {
      cart = await Cart.findOneAndUpdate({ customerId: userId }, { $push: { items: newItem } }, { new: true });
    }
  }

  if (cart) {
    await cart.populate({
      path: 'items.costume',
      select: 'name categoryId images',
      populate: { path: 'categoryId', select: 'name' },
    });
  }

  return cart;
};

const updateCart = async (userId, costumeId, { size, quantity, startDate, endDate, oldSize, oldStartDate, oldEndDate }) => {
  const costume = await Costume.findById(costumeId);
  if (!costume) throw new HttpError('Costume not found', 404);
  if (costume.status === 'hidden') throw new HttpError('Sản phẩm không tồn tại.', 404);

  const numQuantity = Number(quantity);
  if (!size || !numQuantity || !startDate || !endDate) {
    throw new HttpError('Vui lòng cung cấp đủ thông tin: size, quantity, startDate, endDate', 400);
  }

  const variant = costume.variants.find((v) => v.size === size);
  if (!variant) throw new HttpError(`Sản phẩm không có size ${size}`, 404);
  if (variant.availableStock === 0) throw new HttpError('Hết hàng.', 400);
  if (numQuantity > variant.availableStock) {
    throw new HttpError(`Số lượng yêu cầu vượt quá tồn kho. Kho chỉ còn ${variant.availableStock}`, 400);
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) throw new HttpError('Ngày tháng không hợp lệ', 400);

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today.getTime()); tomorrow.setDate(tomorrow.getDate() + 1);
  const startNorm = new Date(start); startNorm.setHours(0, 0, 0, 0);
  const endNorm = new Date(end); endNorm.setHours(0, 0, 0, 0);

  if (startNorm <= tomorrow) throw new HttpError('Ngày nhận đồ phải sau ngày mai', 400);
  if (endNorm < startNorm) throw new HttpError('Vui lòng đặt thuê đồ trước ít nhất 1 ngày', 400);

  const rentalDays = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24))) + 1;
  const rentalPrice = costume.pricePerDay || costume.price || 0;
  const depositPrice = costume.deposit || 0;

  const resolvedOldSize = oldSize || size;
  const resolvedOldStart = oldStartDate ? new Date(oldStartDate) : start;
  const resolvedOldEnd = oldEndDate ? new Date(oldEndDate) : end;

  let cart = await Cart.findOne({ customerId: userId });
  if (!cart) throw new HttpError('Cart not found', 404);

  const itemIndex = cart.items.findIndex(
    (item) =>
      item.costume.toString() === costumeId &&
      item.size === resolvedOldSize &&
      new Date(item.startDate).getTime() === resolvedOldStart.getTime() &&
      new Date(item.endDate).getTime() === resolvedOldEnd.getTime()
  );
  if (itemIndex === -1) throw new HttpError('Không tìm thấy sản phẩm trong giỏ hàng để cập nhật', 404);

  const isIdentityChanged =
    size !== resolvedOldSize ||
    start.getTime() !== resolvedOldStart.getTime() ||
    end.getTime() !== resolvedOldEnd.getTime();

  if (isIdentityChanged) {
    const existingItemIndex = cart.items.findIndex(
      (item, idx) =>
        idx !== itemIndex &&
        item.costume.toString() === costumeId &&
        item.size === size &&
        new Date(item.startDate).getTime() === start.getTime() &&
        new Date(item.endDate).getTime() === end.getTime()
    );

    if (existingItemIndex > -1) {
      const newTotalQty = cart.items[existingItemIndex].quantity + numQuantity;
      if (newTotalQty > variant.availableStock) {
        throw new HttpError(`Số lượng tổng trong giỏ vượt quá tồn kho. Kho chỉ còn ${variant.availableStock}`, 400);
      }
      cart.items[existingItemIndex].quantity = newTotalQty;
      cart.items[existingItemIndex].rentalDays = rentalDays;
      cart.items[existingItemIndex].rentalPrice = rentalPrice;
      cart.items[existingItemIndex].depositPrice = depositPrice;
      cart.items.splice(itemIndex, 1);
    } else {
      cart.items[itemIndex].size = size;
      cart.items[itemIndex].quantity = numQuantity;
      cart.items[itemIndex].startDate = start;
      cart.items[itemIndex].endDate = end;
      cart.items[itemIndex].rentalDays = rentalDays;
      cart.items[itemIndex].rentalPrice = rentalPrice;
      cart.items[itemIndex].depositPrice = depositPrice;
    }
  } else {
    cart.items[itemIndex].quantity = numQuantity;
  }

  await cart.save();
  await cart.populate({
    path: 'items.costume',
    select: 'name categoryId images',
    populate: { path: 'categoryId', select: 'name' },
  });

  return cart;
};

const removeAllCartByCustomer = async (userId) => {
  await Cart.findOneAndDelete({ customerId: userId });
};

const removeCartItem = async (userId, { costumeId, size, startDate, endDate }) => {
  if (!costumeId) throw new HttpError('Vui lòng cung cấp costumeId', 400);

  let cart = await Cart.findOne({ customerId: userId });
  if (!cart) return null;

  if (size && startDate && endDate) {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    cart.items = cart.items.filter(
      (item) =>
        !(
          item.costume.toString() === costumeId &&
          item.size === size &&
          new Date(item.startDate).getTime() === start &&
          new Date(item.endDate).getTime() === end
        )
    );
  } else {
    cart.items = cart.items.filter((item) => item.costume.toString() !== costumeId);
  }

  await cart.save();
  return cart;
};

module.exports = { getAllCarts, addCart, updateCart, removeAllCartByCustomer, removeCartItem };
