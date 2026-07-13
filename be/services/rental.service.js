const Rental = require('../models/rental.model');
const Costume = require('../models/costume.model');
const User = require('../models/user.model');
const Issue = require('../models/issue.model');
const Cart = require('../models/cart.model');
const HttpError = require('../models/http-error.model');
const sendEmail = require('./email.service');
const ghnService = require('./ghn.service');
const mongoose = require('mongoose');
const { getRentalPriceFactor } = require('../utils/pricing.util');

const autoUpdateDeliveredStatus = async () => {
  const fiveHoursAgo = new Date(Date.now() - 5 * 60 * 60 * 1000);
  const expiredRentals = await Rental.find({
    status: 'delivered',
    deliveredAt: { $lte: fiveHoursAgo },
  });
  for (const rental of expiredRentals) {
    rental.status = 'renting';
    await rental.save();
  }
};

const getRentalHistory = async (userId) => {
  await autoUpdateDeliveredStatus();

  const orders = await Rental.find({ customerId: userId })
    .populate('items.costume', 'name images pricePerDay price')
    .sort({ createdAt: -1 });

  return orders.map((order) => ({
    id: order._id,
    costumeName: order.items[0]?.costume?.name || 'Đơn hàng thuê',
    costumeImage: order.items[0]?.costume?.images?.[0] || '',
    rentalPeriod: `${Math.ceil((order.endDate - order.startDate) / (1000 * 60 * 60 * 24))} ngày`,
    startDate: new Date(order.startDate).toLocaleDateString('vi-VN'),
    endDate: new Date(order.endDate).toLocaleDateString('vi-VN'),
    status: order.status,
    totalPrice: order.totalAmount,
    address: order.shippingAddress.addressDetail,
    items: order.items.map((item) => ({
      costumeName: item.costume?.name || 'Sản phẩm',
      image: item.costume?.images?.[0] || '',
      size: item.size,
      quantity: item.quantity,
      rentalPerDay: item.rentalPricePerDay || item.costume?.pricePerDay || 0,
    })),
    createdAt: order.createdAt,
  }));
};

const getOrderDetail = async (orderId, customerId) => {
  await autoUpdateDeliveredStatus();

  const order = await Rental.findOne({ _id: orderId, customerId })
    .populate('customerId', 'fullName phone email')
    .populate('items.costume', 'name images price pricePerDay');

  if (!order) throw new HttpError('Orders not found.', 404);

  const issue = await Issue.findOne({ rentalId: orderId });

  return {
    orderId,
    status: order.status,
    hasIssue: !!issue,
    issueStatus: issue?.status || null,
    deliveredAt: order.deliveredAt,
    startDate: order.startDate,
    endDate: order.endDate,
    customer: {
      name: order.customerId.fullName,
      phone: order.customerId.phone,
      email: order.customerId.email,
    },
    payment: {
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      rental: order.totalRentalPrice,
      deposit: order.totalDeposit,
      shipping: order.shippingFee,
      total: order.totalAmount,
    },
    shippingAddress: order.shippingAddress,
    orderDate: order.createdAt,
    rentalPeriod: Math.ceil((order.endDate - order.startDate) / (1000 * 60 * 60 * 24)) + 1,
    items: order.items.map((item) => ({
      costumeName: item.costume.name,
      image: item.costume.images[0],
      size: item.size,
      quantity: item.quantity,
      price: item.costume.price,
      rentalPerDay: item.rentalPricePerDay || item.costume?.pricePerDay || item.costume?.price || 0,
    })),
  };
};

const createOrder = async (customerId, body) => {
  const { startDate, endDate, items, shippingFee, shippingAddress, paymentMethod } = body;

  const start = new Date(startDate);
  const end = new Date(endDate);

  // Kiểm tra ngày bắt đầu thuê không ở trong quá khứ
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (start < today) {
    throw new HttpError('Ngày bắt đầu thuê không được ở trong quá khứ.', 400);
  }

  const rentalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  if (rentalDays <= 0) {
    throw new HttpError('Ngày kết thúc thuê phải sau ngày bắt đầu thuê.', 400);
  }

  let totalRentalPrice = 0;
  let totalDeposit = 0;
  const formattedItems = [];
  const costumesToUpdate = [];

  for (const item of items) {
    const costume = await Costume.findById(item.costume);
    if (!costume) throw new HttpError('Costume not found.', 404);

    const minDays = costume.minRentalDays || 1;
    if (rentalDays < minDays) {
      throw new HttpError(
        `Phải thuê tối thiểu ${minDays} ngày.`,
        400
      );
    }

    const existingOrder = await Rental.findOne({
      'items.costume': item.costume,
      'items.size': item.size,
      status: { $in: ['pending', 'delivering', 'delivered', 'renting', 'returning', 'overdue'] },
      startDate: { $lte: new Date(endDate) },
      endDate: { $gte: new Date(startDate) },
    });
    if (existingOrder) {
      throw new HttpError('Sản phẩm đã được đặt trong vài giờ qua. Vui lòng kiểm tra đơn hàng.', 400);
    }

    const variant = costume.variants.find((v) => v.size === item.size);
    if (!variant) throw new HttpError(`Sản phẩm ${costume.name} không có size ${item.size}.`, 404);
    if (item.quantity > variant.availableStock) {
      throw new HttpError(
        `Sản phẩm ${costume.name} (Size ${item.size}) không đủ số lượng. Kho chỉ còn ${variant.availableStock}.`,
        400
      );
    }

    const depositPrice = costume.deposit || costume.price || 0;
    const priceFactor = getRentalPriceFactor(rentalDays);
    totalRentalPrice += (costume.pricePerDay * priceFactor) * item.quantity;
    totalDeposit += depositPrice * item.quantity;

    formattedItems.push({
      costume: costume._id,
      size: item.size,
      quantity: item.quantity,
      rentalPricePerDay: costume.pricePerDay,
      depositPrice,
    });
    costumesToUpdate.push({ costume, variant, quantityToDeduct: item.quantity });
  }

  for (const update of costumesToUpdate) {
    update.variant.availableStock -= update.quantityToDeduct;
    await update.costume.save();
  }

  const totalAmount = totalRentalPrice + totalDeposit + shippingFee;

  const user = await User.findById(customerId);
  if (!user) throw new HttpError('Người dùng không tồn tại', 404);
  if (user.balance < totalAmount) throw new HttpError('Số dư ví không đủ. Vui lòng nạp thêm tiền.', 400);

  user.balance -= totalAmount;
  await user.save();

  const newOrder = new Rental({
    customerId,
    items: formattedItems,
    startDate,
    endDate,
    shippingFee,
    paymentMethod: 'WALLET',
    paymentStatus: 'paid',
    shippingAddress,
    totalRentalPrice,
    totalDeposit,
    totalAmount,
    status: 'pending',
  });
  await newOrder.save();

  try {
    const cart = await Cart.findOne({ customerId });
    if (cart) {
      const orderStart = new Date(startDate).getTime();
      const orderEnd = new Date(endDate).getTime();
      cart.items = cart.items.filter(
        (cartItem) =>
          !items.some(
            (orderItem) =>
              orderItem.costume.toString() === cartItem.costume.toString() &&
              orderItem.size === cartItem.size &&
              new Date(cartItem.startDate).getTime() === orderStart &&
              new Date(cartItem.endDate).getTime() === orderEnd
          )
      );
      if (cart.items.length === 0) await Cart.findOneAndDelete({ customerId });
      else await cart.save();
    }
  } catch (cartError) {
    console.error('[Cart Cleanup Error]', cartError);
  }

  return newOrder;
};

const cancelOrder = async (orderId, customerId, cancelReason) => {
  const order = await Rental.findOne({ _id: orderId, customerId });
  if (!order) throw new HttpError('Không tìm thấy đơn hàng.', 404);
  if (!['pending'].includes(order.status)) throw new HttpError('Không thể hủy đơn hàng ở trạng thái này.', 400);

  order.status = 'cancelled';
  order.cancelReason = cancelReason || 'Người dùng hủy đơn';
  order.paymentStatus = 'refunded';
  await order.save();

  const user = await User.findById(customerId);
  if (user) {
    user.balance = (user.balance || 0) + order.totalAmount;
    await user.save();
  }

  for (const item of order.items) {
    const costume = await Costume.findById(item.costume);
    if (costume) {
      const variant = costume.variants.find((v) => v.size === item.size);
      if (variant) {
        variant.availableStock += item.quantity;
        await costume.save();
      }
    }
  }

  try {
    const emailUser = await User.findById(customerId);
    if (emailUser?.email) {
      await sendEmail({
        to: emailUser.email,
        subject: 'CostumeHUB — Thông báo hủy đơn hàng',
        text: `Chào ${emailUser.fullName},\n\nĐơn hàng ${order._id} của bạn đã bị hủy.\nLý do: ${order.cancelReason}`,
        html: `<p>Chào <b>${emailUser.fullName}</b>,</p><p>Đơn hàng <b>${order._id}</b> của bạn đã bị hủy.</p><p>Lý do: <span style="color:red">${order.cancelReason}</span></p>`,
      });
    }
  } catch (mailError) {
    console.error('Lỗi khi gửi email hủy đơn:', mailError);
  }

  return order;
};

const confirmReceipt = async (orderId, customerId) => {
  const order = await Rental.findOne({ _id: orderId, customerId });
  if (!order) throw new HttpError('Không tìm thấy đơn hàng.', 404);
  if (order.status !== 'delivered') throw new HttpError('Đơn hàng không ở trạng thái đang giao tới.', 400);
  order.status = 'renting';
  await order.save();
  return order;
};

const checkAvailability = async ({ costumeId, startDate, endDate, quantity, size }) => {
  const costume = await Costume.findById(costumeId);
  if (!costume) throw new HttpError('Costume not found', 404);

  const paddingMs = 24 * 60 * 60 * 1000;
  const paddedStart = new Date(new Date(startDate).getTime() - paddingMs);
  const paddedEnd = new Date(new Date(endDate).getTime() + paddingMs);

  // Query rentals có items chứa costume này, trong khoảng thời gian overlap
  const overlaps = await Rental.find({
    'items.costume': costumeId,
    status: { $in: ['pending', 'delivering', 'delivered', 'renting'] },
    startDate: { $lte: paddedEnd },
    endDate: { $gte: paddedStart },
  });

  // Tính tổng quantity từ items array
  let rentedQty = 0;
  overlaps.forEach(rental => {
    rental.items.forEach(item => {
      if (item.costume.toString() === costumeId) {
        // Nếu có size, chỉ count quantity của size đó
        if (size ? item.size === size : true) {
          rentedQty += item.quantity;
        }
      }
    });
  });

  // Tính total stock từ variants
  let totalStock = 0;
  if (size) {
    // Nếu có size, chỉ count stock của size đó
    const variant = costume.variants.find(v => v.size === size);
    totalStock = variant?.totalStock || 0;
  } else {
    // Nếu không có size, count tất cả
    totalStock = costume.variants.reduce((sum, v) => sum + (v.totalStock || 0), 0);
  }

  const availableQty = totalStock - rentedQty;

  return { isAvailable: availableQty >= quantity, availableQty };
};

const getAllOrders = async () => {
  return Rental.find()
    .populate('customerId', 'fullName email phone')
    .populate('items.costume', 'name images')
    .sort({ createdAt: -1 });
};

const updateOrderStatus = async (id, status) => {
  const order = await Rental.findById(id);
  if (!order) throw new HttpError('Order not found', 404);

  if (status === 'delivering' && !order.trackingCode && order.shippingAddress?.districtId) {
    try {
      const ghnRes = await ghnService.createOrder({
        payment_type_id: 1,
        note: 'Cho xem hàng, không thử',
        required_note: 'CHOXEMHANGKHONGTHU',
        to_name: order.shippingAddress.receiverName,
        to_phone: order.shippingAddress.receiverPhone,
        to_address: order.shippingAddress.addressDetail || 'Không có địa chỉ chi tiết',
        to_ward_code: order.shippingAddress.wardCode,
        to_district_id: order.shippingAddress.districtId,
        weight: 500,
        length: 20, width: 20, height: 10,
        service_type_id: 2,
        items: [{ name: 'Trang phục thuê', quantity: 1, weight: 500 }],
      });
      order.trackingCode = ghnRes.order_code;
    } catch (ghnError) {
      console.error('Failed to push to GHN:', ghnError);
    }
  }

  order.status = status;
  await order.save();
  return order;
};

const confirmPreparation = async (id) => {
  const order = await Rental.findById(id);
  if (!order) throw new HttpError('Không tìm thấy đơn hàng', 404);
  if (order.status !== 'pending') {
    throw new HttpError('Đơn hàng chưa ở trạng thái Chờ xử lý', 400);
  }

  if (!order.trackingCode && order.shippingAddress?.districtId) {
    try {
      const ghnRes = await ghnService.createOrder({
        payment_type_id: 1,
        note: 'Cho xem hàng, không thử',
        required_note: 'CHOXEMHANGKHONGTHU',
        to_name: order.shippingAddress.receiverName,
        to_phone: order.shippingAddress.receiverPhone,
        to_address: order.shippingAddress.addressDetail || 'Không có địa chỉ chi tiết',
        to_ward_code: order.shippingAddress.wardCode,
        to_district_id: order.shippingAddress.districtId,
        weight: 500,
        length: 20, width: 20, height: 10,
        service_type_id: 2,
        items: [{ name: 'Trang phục thuê', quantity: 1, weight: 500 }],
      });
      order.trackingCode = ghnRes.order_code;
      order.status = 'delivering';
      await order.save();
      return { message: 'Xác nhận thành công. Đã tạo đơn trên GHN.', order };
    } catch (ghnError) {
      order.status = 'delivering';
      await order.save();
      return { message: 'Đã chuyển sang đang giao (Lỗi kết nối GHN nên không tạo được vận đơn).', order };
    }
  } else {
    order.status = 'delivering';
    await order.save();
    return { message: 'Đã chuyển trạng thái sang đang giao (Không tạo đơn GHN).', order };
  }
};

const getTotalRevenue = async () => {
  const validStatuses = ['delivering', 'delivered', 'renting', 'returning', 'completed', 'overdue'];
  const orders = await Rental.find({ status: { $in: validStatuses } });
  const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);

  // Tính thêm dữ liệu vẽ biểu đồ (Chart): Gom nhóm doanh thu theo tháng/ngày
  // (Giữ cho đơn giản: trả về danh sách để FE tự vẽ)

  return {
    totalRevenue,
    orderCount: orders.length
  };
};

const getActiveRentals = async () => {
  const activeStatuses = ['delivering', 'delivered', 'renting', 'overdue'];
  const activeOrders = await Rental.find({ status: { $in: activeStatuses } });
  let totalActiveCostumes = 0;
  activeOrders.forEach((o) => o.items.forEach((i) => { totalActiveCostumes += i.quantity; }));

  return {
    activeOrdersCount: activeOrders.length,
    totalActiveCostumes
  };
};

// YÊU CẦU: Thống kê sức chứa kho hàng (View Inventory Report)
const getInventoryUtilization = async (startDate, endDate) => {
  // FIX: Đã xóa .populate('category') để tránh lỗi sập Server
  const costumes = await Costume.find();

  let totalStock = 0;
  costumes.forEach((c) => c.variants.forEach((v) => { totalStock += v.totalStock || 0; }));

  if (totalStock === 0) return { utilizationPercentage: 0, totalStock: 0, currentlyRented: 0, categoryBreakdown: [] };

  const activeStatuses = ['delivering', 'delivered', 'renting', 'overdue'];
  const activeOrders = await Rental.find({ status: { $in: activeStatuses } });
  let currentlyRented = 0;

  const categoryStats = {};

  activeOrders.forEach((o) => {
    o.items.forEach((i) => {
      currentlyRented += i.quantity;

      if (i.costume && i.costume.category) {
        const catId = i.costume.category.toString();
        if (!categoryStats[catId]) {
          categoryStats[catId] = { count: 0 };
        }
        categoryStats[catId].count += i.quantity;
      }
    });
  });

  const utilizationPercentage = ((currentlyRented / totalStock) * 100).toFixed(2);

  return {
    utilizationPercentage: parseFloat(utilizationPercentage),
    totalStock,
    currentlyRented,
    categoryBreakdown: Object.values(categoryStats)
  };
};

const requestReturn = async (id) => {
  const rental = await Rental.findById(id);
  if (!rental) throw new HttpError('Không tìm thấy đơn thuê', 404);
  if (!['delivering', 'delivered', 'renting', 'overdue'].includes(rental.status)) {
    throw new HttpError('Đơn hàng phải ở trạng thái Đang giao, Đã giao, Đang thuê hoặc Quá hạn', 400);
  }
  rental.status = 'returning';
  await rental.save();
  return rental;
};

const inspectReturn = async (id, { damageFee, missingNotes, actualReturnDate }) => {
  const rental = await Rental.findById(id).populate('items.costume');
  if (!rental) throw new HttpError('Không tìm thấy đơn thuê', 404);
  if (rental.status !== 'returning') throw new HttpError('Đơn chưa ở trạng thái Đang trả hàng (returning)', 400);

  const scheduledReturn = new Date(rental.endDate);
  const actualReturn = actualReturnDate ? new Date(actualReturnDate) : new Date();
  let daysLate = 0;
  let totalLateFee = 0;

  if (actualReturn > scheduledReturn) {
    const timeDiff = actualReturn.getTime() - scheduledReturn.getTime();
    daysLate = Math.ceil(timeDiff / (1000 * 3600 * 24));
    rental.items.forEach((item) => {
      totalLateFee += daysLate * (item.costume?.lateFeePerDay || 0) * item.quantity;
    });
  }

  const finalDamageFee = Number(damageFee) || 0;
  const totalFine = totalLateFee + finalDamageFee;
  const originalDeposit = rental.totalDeposit || 0;
  const refundAmount = Math.max(0, originalDeposit - totalFine);

  rental.status = 'completed';
  rental.actualReturnDate = actualReturn;
  rental.lateFee = totalLateFee;
  rental.damageFee = finalDamageFee;
  rental.refundAmount = refundAmount;
  if (missingNotes) rental.cancelReason = missingNotes;
  await rental.save();

  if (refundAmount > 0) {
    const user = await User.findById(rental.customerId);
    if (user) {
      user.balance = (user.balance || 0) + refundAmount;
      await user.save();
    }
  }

  const CostumeModel = mongoose.model('Costume');
  for (const item of rental.items) {
    if (item.costume) {
      await CostumeModel.findByIdAndUpdate(item.costume._id, { status: 'dry_cleaning' });
      const costumeToUpdate = await CostumeModel.findById(item.costume._id || item.costume);
      if (costumeToUpdate) {
        const variant = costumeToUpdate.variants.find((v) => v.size === item.size);
        if (variant) {
          variant.availableStock += item.quantity;
          await costumeToUpdate.save();
        }
      }
    }
  }

  return { totalFine, refundAmount };
};

const extendRental = async (id, customerId, newEndDate) => {
  if (!newEndDate) throw new HttpError('Vui lòng cung cấp ngày gia hạn mới.', 400);

  const rental = await Rental.findOne({ _id: id, customerId }).populate('items.costume');
  if (!rental) throw new HttpError('Không tìm thấy đơn hàng.', 404);
  if (rental.status !== 'renting') throw new HttpError('Đơn hàng phải ở trạng thái Đang thuê mới có thể gia hạn.', 400);

  const oldEnd = new Date(rental.endDate);
  const newEnd = new Date(newEndDate);
  const oldEndDay = new Date(oldEnd.getFullYear(), oldEnd.getMonth(), oldEnd.getDate());
  const newEndDay = new Date(newEnd.getFullYear(), newEnd.getMonth(), newEnd.getDate());
  const extendDays = Math.ceil((newEndDay.getTime() - oldEndDay.getTime()) / (1000 * 60 * 60 * 24));

  if (extendDays <= 0) throw new HttpError('Ngày gia hạn mới phải sau ngày trả hiện tại.', 400);

  for (const item of rental.items) {
    const costume = item.costume;
    if (!costume) throw new HttpError('Sản phẩm trong đơn hàng không tồn tại.', 404);

    const overlap = await Rental.findOne({
      _id: { $ne: rental._id },
      'items.costume': costume._id,
      'items.size': item.size,
      status: { $in: ['pending', 'delivering', 'delivered', 'renting', 'returning', 'overdue'] },
      startDate: { $lte: newEnd },
      endDate: { $gte: oldEnd },
    });
    if (overlap) {
      throw new HttpError(`Sản phẩm ${costume.name} (Size ${item.size}) đã được khách hàng khác đặt trước trong khoảng thời gian gia hạn.`, 400);
    }
  }

  const oldRentalDays = Math.ceil((oldEndDay.getTime() - new Date(rental.startDate).setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24));
  const totalDaysAfterExtend = oldRentalDays + extendDays;
  // Giá thuê là mức phí trọn gói cho 1-3 ngày đầu; gia hạn chỉ tính thêm phần phụ phí phát sinh
  // khi tổng số ngày vượt qua mốc đã tính trước đó (chênh lệch hệ số giá).
  const oldPriceFactor = getRentalPriceFactor(oldRentalDays);
  const newPriceFactor = getRentalPriceFactor(totalDaysAfterExtend);

  let totalExtendCost = 0;
  for (const item of rental.items) {
    const costume = item.costume;
    const pricePerDay = item.rentalPricePerDay || (costume ? (costume.pricePerDay || costume.price) : 0) || 0;
    totalExtendCost += pricePerDay * (newPriceFactor - oldPriceFactor) * item.quantity;
  }

  const user = await User.findById(customerId);
  if (!user) throw new HttpError('Không tìm thấy thông tin khách hàng.', 404);

  if (user.balance < totalExtendCost) {
    return {
      success: false,
      insufficientBalance: true,
      requiredAmount: totalExtendCost,
      currentBalance: user.balance,
      message: 'Số dư ví không đủ. Vui lòng nạp thêm tiền.',
    };
  }

  user.balance -= totalExtendCost;
  await user.save();

  rental.endDate = newEnd;
  rental.totalRentalPrice += totalExtendCost;
  rental.totalAmount += totalExtendCost;
  await rental.save();

  return { success: true, message: 'Gia hạn thuê và thanh toán thành công.', order: rental };
};

module.exports = {
  getRentalHistory,
  getOrderDetail,
  createOrder,
  cancelOrder,
  confirmReceipt,
  checkAvailability,
  getAllOrders,
  updateOrderStatus,
  confirmPreparation,
  getTotalRevenue,
  getActiveRentals,
  getInventoryUtilization,
  requestReturn,
  inspectReturn,
  extendRental,
};
