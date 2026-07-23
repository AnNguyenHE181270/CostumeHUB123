const Rental = require('../models/rental.model');
const Costume = require('../models/costume.model');
const User = require('../models/user.model');
const Issue = require('../models/issue.model');
const Cart = require('../models/cart.model');
const HttpError = require('../models/http-error.model');
const sendEmail = require('./email.service');
const ghnService = require('./ghn.service');
const mongoose = require('mongoose');
const fs = require('fs');
const { getRentalPriceFactor } = require('../utils/pricing.util');
const notificationService = require('./notification.service');
const { uploadReturnEvidence } = require('./cloudinary.service');
const TransactionHistory = require('../models/transactionHistory.model');
const StockTransaction = require('../models/stockTransaction.model');
// instances[] là nguồn sự thật duy nhất của tồn kho — luồng thuê phải đánh dấu/nhả từng unit
// qua các helper này, không được cộng/trừ thẳng availableStock (sẽ lệch với luồng kho/bảo trì).
const {
  markInstancesRented,
  releaseRentedInstances,
  syncCostumeStatusFromVariants,
} = require('./costume.service');

// Bảng đền bù hư hỏng (khớp nội dung công khai ở trang "Về Chúng Tôi") — staff chọn mức, không tự nhập số tiền
const DAMAGE_TIER_RANGES = {
  none: { min: 0, max: 0 },
  heavy_stain: { min: 20, max: 20 },
  minor_damage: { min: 30, max: 50 },
  major_damage: { min: 70, max: 100 },
  total_loss: { min: 100, max: 100 },
};

const ORDER_STATUS_MESSAGES = {
  pending: 'Đơn hàng của bạn đã được tạo và đang chờ xử lý.',
  delivering: 'Đơn hàng của bạn đang được giao đến bạn.',
  delivered: 'Đơn hàng của bạn đã được giao thành công.',
  renting: 'Đơn hàng đã được xác nhận, bạn đang trong thời gian thuê.',
  returning: 'Yêu cầu trả đồ của bạn đang được cửa hàng xử lý.',
  completed: 'Đơn hàng đã hoàn tất. Cảm ơn bạn đã sử dụng dịch vụ của CostumeHUB!',
  cancelled: 'Đơn hàng của bạn đã bị hủy.',
  overdue: 'Đơn hàng của bạn đã quá hạn trả. Vui lòng liên hệ cửa hàng để xử lý.',
};

// Tạo thông báo in-app khi đơn hàng chuyển trạng thái. Không để lỗi thông báo làm hỏng luồng nghiệp vụ chính.
async function notifyOrderStatus(rental, status) {
  try {
    await notificationService.createNotification({
      userId: rental.customerId,
      type: 'order_status',
      title: `Đơn hàng #${rental._id.toString().slice(-6).toUpperCase()}`,
      message: ORDER_STATUS_MESSAGES[status] || `Đơn hàng của bạn đã chuyển sang trạng thái ${status}.`,
      link: '/rental-history',
      relatedId: rental._id,
    });
  } catch (err) {
    console.error('[Notification Error]', err);
  }
}

const autoUpdateDeliveredStatus = async () => {
  const fiveHoursAgo = new Date(Date.now() - 5 * 60 * 60 * 1000);
  const expiredRentals = await Rental.find({
    status: 'delivered',
    deliveredAt: { $lte: fiveHoursAgo },
  });
  for (const rental of expiredRentals) {
    rental.status = 'renting';
    rental.rentingAt = new Date(rental.deliveredAt.getTime() + 5 * 60 * 60 * 1000);
    await rental.save();
    await notifyOrderStatus(rental, 'renting');
  }
};

const sendAutoConfirmReminders = async () => {
  const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);
  const fourHoursAndFifteenMinsAgo = new Date(Date.now() - 4.25 * 60 * 60 * 1000);

  const rentals = await Rental.find({
    status: 'delivered',
    deliveredAt: { $lte: fourHoursAgo, $gt: fourHoursAndFifteenMinsAgo },
  });

  for (const rental of rentals) {
    try {
      await notificationService.createNotification({
        userId: rental.customerId,
        type: 'order_status',
        title: `Nhắc nhở đơn hàng #${rental._id.toString().slice(-6).toUpperCase()}`,
        message: 'Hệ thống sẽ tự động xác nhận đã nhận hàng trong vòng 1 tiếng nữa nếu bạn không có khiếu nại gì.',
        link: '/rental-history',
        relatedId: rental._id,
      });
    } catch (err) {
      console.error('[Notification Error]', err);
    }
  }
};

const getRentalHistory = async (userId) => {
  await autoUpdateDeliveredStatus();

  const orders = await Rental.find({ customerId: userId })
    .populate('items.costume', 'name images pricePerDay price minRentalDays maxRentalDays')
    .sort({ createdAt: -1 });

  return orders.map((order) => ({
    id: order._id,
    costumeName: order.items[0]?.costume?.name || 'Đơn hàng thuê',
    costumeImage: order.items[0]?.costume?.images?.[0] || '',
    rentalPeriod: `${Math.ceil((order.endDate - order.startDate) / (1000 * 60 * 60 * 24)) + 1} ngày`,
    startDate: new Date(order.startDate).toLocaleDateString('vi-VN'),
    endDate: new Date(order.endDate).toLocaleDateString('vi-VN'),
    rawStartDate: order.startDate,
    rawEndDate: order.endDate,
    status: order.status,
    rentingAt: order.rentingAt,
    totalPrice: order.totalAmount,
    refundAmount: order.refundAmount,
    replacementFee: order.replacementFee,
    address: order.shippingAddress.addressDetail,
    items: order.items.map((item) => ({
      costumeId: item.costume?._id,
      costumeName: item.costume?.name || 'Sản phẩm',
      image: item.costume?.images?.[0] || '',
      size: item.size,
      quantity: item.quantity,
      rentalPerDay: item.rentalPricePerDay || item.costume?.pricePerDay || 0,
      minRentalDays: item.costume?.minRentalDays || 1,
      maxRentalDays: item.costume?.maxRentalDays || 7,
    })),
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  }));
};

const getOrderDetail = async (orderId, customerId) => {
  await autoUpdateDeliveredStatus();

  const order = await Rental.findOne({ _id: orderId, customerId })
    .populate('customerId', 'fullName phone email')
    .populate('items.costume', 'name images price pricePerDay minRentalDays maxRentalDays');

  if (!order) throw new HttpError('Orders not found.', 404);

  const issue = await Issue.findOne({ rentalId: orderId });

  return {
    orderId,
    status: order.status,
    hasIssue: !!issue,
    issueStatus: issue?.status || null,
    deliveredAt: order.deliveredAt,
    rentingAt: order.rentingAt,
    cancelReason: order.cancelReason,
    refundAmount: order.refundAmount,
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
      costumeId: item.costume?._id,
      costumeName: item.costume?.name || 'Sản phẩm',
      image: item.costume?.images?.[0] || '',
      size: item.size,
      quantity: item.quantity,
      price: item.costume?.price || 0,
      rentalPerDay: item.rentalPricePerDay || item.costume?.pricePerDay || item.costume?.price || 0,
      minRentalDays: item.costume?.minRentalDays || 1,
      maxRentalDays: item.costume?.maxRentalDays || 7,
    })),
  };
};

// Lấy ngày giao hàng dự kiến (GHN leadtime) tới một quận/phường cụ thể
const getDeliveryEstimate = async (districtId, wardCode) => {
  if (!districtId || !wardCode) {
    throw new HttpError('Thiếu thông tin địa chỉ giao hàng.', 400);
  }

  const services = await ghnService.getAvailableServices(ghnService.SHOP_ORIGIN.district_id, districtId);
  const serviceId = services[0]?.service_id;
  if (!serviceId) throw new HttpError('Không tìm thấy dịch vụ vận chuyển phù hợp tới địa chỉ này.', 400);

  const leadtimeData = await ghnService.getLeadTime({
    fromDistrictId: ghnService.SHOP_ORIGIN.district_id,
    fromWardCode: ghnService.SHOP_ORIGIN.ward_code,
    toDistrictId: districtId,
    toWardCode: wardCode,
    serviceId,
  });

  return { estimatedDeliveryDate: new Date(leadtimeData.leadtime * 1000) };
};

// Kiểm tra ngày nhận hàng khách chọn có khả thi so với thời gian giao hàng dự kiến GHN không.
// Nếu GHN dự kiến giao trễ hơn ngày khách muốn nhận, chặn lại và trả kèm estimatedDeliveryDate
// để FE hiện modal xác nhận (khách có thể chọn đặt tiếp bằng confirmLateDelivery).
const checkDeliveryFeasibility = async (shippingAddress, startDate) => {
  if (!shippingAddress?.districtId || !shippingAddress?.wardCode) return; // Nhận tại showroom, không cần check GHN

  let estimate;
  try {
    estimate = await getDeliveryEstimate(shippingAddress.districtId, shippingAddress.wardCode);
  } catch (err) {
    console.error('[GHN Feasibility Check Error]', err);
    return; // GHN lỗi tạm thời thì không chặn đơn hàng
  }

  if (estimate.estimatedDeliveryDate > new Date(startDate)) {
    throw new HttpError(
      'Đơn hàng có thể được giao trễ hơn ngày nhận bạn đã chọn.',
      400,
      { estimatedDeliveryDate: estimate.estimatedDeliveryDate }
    );
  }
};

const createOrder = async (customerId, body) => {
  const { startDate, endDate, items, shippingFee, shippingAddress, paymentMethod, confirmLateDelivery } = body;

  const start = new Date(startDate);
  const end = new Date(endDate);

  // Kiểm tra ngày bắt đầu thuê không ở trong quá khứ
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (start < today) {
    throw new HttpError('Ngày bắt đầu thuê không được ở trong quá khứ.', 400);
  }

  const rentalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
  if (rentalDays < 1) {
    throw new HttpError('Ngày kết thúc thuê không được trước ngày bắt đầu thuê.', 400);
  }

  if (!confirmLateDelivery) {
    await checkDeliveryFeasibility(shippingAddress, startDate);
  }
  let totalRentalPrice = 0;
  let totalDeposit = 0;
  const formattedItems = [];
  const costumesToUpdate = [];

  for (const item of items) {
    const costume = await Costume.findById(item.costume);
    if (!costume) throw new HttpError('Costume not found.', 404);
    const maxDays = costume.maxRentalDays || 7;
    if (rentalDays > maxDays) {
      throw new HttpError(
        `Chỉ được thuê tối đa ${maxDays} ngày đối với sản phẩm ${costume.name}.`,
        400
      );
    }

    const variant = costume.variants.find((v) => v.size === item.size);
    if (!variant) throw new HttpError(`Sản phẩm ${costume.name} không có size ${item.size}.`, 404);

    if (item.quantity > variant.availableStock) {
      throw new HttpError(
        `Sản phẩm ${costume.name} (Size ${item.size}) không đủ số lượng để thuê lúc này. Chỉ còn sẵn ${variant.availableStock} bộ.`,
        400
      );
    }

    const depositPrice = costume.deposit || costume.price || 0;
    const priceFactor = getRentalPriceFactor(rentalDays);
    totalRentalPrice += (costume.pricePerDay * priceFactor) * item.quantity;
    totalDeposit += depositPrice * item.quantity;

    const formattedItem = {
      costume: costume._id,
      size: item.size,
      quantity: item.quantity,
      rentalPricePerDay: costume.pricePerDay,
      depositPrice,
      instanceCodes: [],
    };
    formattedItems.push(formattedItem);
    costumesToUpdate.push({ costume, variant, quantityToDeduct: item.quantity, formattedItem });
  }

  for (const update of costumesToUpdate) {
    // Đánh dấu đúng N unit vật lý là 'rented' và lưu unitCode vào đơn — khi hủy/trả/khiếu nại
    // sẽ nhả ra đúng các unit này, giữ instances[] và availableStock luôn khớp nhau.
    const codes = markInstancesRented(update.variant, update.quantityToDeduct);
    if (!codes) {
      throw new HttpError(
        `Sản phẩm ${update.costume.name} (Size ${update.variant.size}) không đủ số lượng để thuê lúc này. Chỉ còn sẵn ${update.variant.availableStock} bộ.`,
        400
      );
    }
    update.formattedItem.instanceCodes = codes;
    syncCostumeStatusFromVariants(update.costume);
    await update.costume.save();
  }

  const totalAmount = totalRentalPrice + totalDeposit + shippingFee;

  const user = await User.findById(customerId);
  if (!user) throw new HttpError('Người dùng không tồn tại', 404);
  if (user.balance < totalAmount) throw new HttpError('Số dư ví không đủ. Vui lòng nạp thêm tiền.', 400);

  await User.updateOne({ _id: customerId }, { $inc: { balance: -totalAmount } });

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
    await notificationService.createNotification({
      userId: customerId,
      type: 'order_created',
      title: `Đơn hàng #${newOrder._id.toString().slice(-6).toUpperCase()}`,
      message: `Đặt đơn thành công! Tổng thanh toán ${totalAmount.toLocaleString('vi-VN')}đ đã được trừ từ ví.`,
      link: '/rental-history',
      relatedId: newOrder._id,
    });
  } catch (notifyError) {
    console.error('[Notification Error]', notifyError);
  }

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
  await notifyOrderStatus(order, 'cancelled');

  await User.updateOne({ _id: customerId }, { $inc: { balance: order.totalAmount } });

  for (const item of order.items) {
    const costume = await Costume.findById(item.costume);
    if (costume) {
      const variant = costume.variants.find((v) => v.size === item.size);
      if (variant) {
        // Đơn chưa giao mà hủy -> unit chưa rời kho, trả thẳng về 'available'
        releaseRentedInstances(variant, item.instanceCodes, item.quantity, 'available');
        syncCostumeStatusFromVariants(costume);
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
  order.rentingAt = new Date();
  await order.save();
  await notifyOrderStatus(order, 'renting');
  return order;
};

const checkAvailability = async ({ costumeId, startDate, endDate, quantity, size }) => {
  const costume = await Costume.findById(costumeId);
  if (!costume) throw new HttpError('Costume not found', 404);

  let availableQty = 0;
  if (size) {
    const variant = costume.variants.find(v => v.size === size);
    availableQty = variant?.availableStock || 0;
  } else {
    availableQty = costume.variants.reduce((sum, v) => sum + (v.availableStock || 0), 0);
  }

  return { isAvailable: availableQty >= quantity, availableQty };
};

const getAllOrders = async (startDate, endDate) => {
  return Rental.find(buildDateRangeFilter(startDate, endDate))
    .populate('customerId', 'fullName email phone')
    .populate('items.costume', 'name images')
    .sort({ createdAt: -1 });
};

const updateOrderStatus = async (id, status) => {
  const order = await Rental.findById(id);
  if (!order) throw new HttpError('Order not found', 404);

  if (status === 'cancelled' && order.status !== 'cancelled') {
    if (!['pending'].includes(order.status)) {
      throw new HttpError('Không thể hủy đơn hàng ở trạng thái này.', 400);
    }

    // 1. Hoàn tiền ví
    await User.updateOne({ _id: order.customerId }, { $inc: { balance: order.totalAmount } });

    // 2. Hoàn trả tồn kho trang phục — nhả đúng các unit đã gán cho đơn về 'available'
    for (const item of order.items) {
      const costume = await Costume.findById(item.costume);
      if (costume) {
        const variant = costume.variants.find((v) => v.size === item.size);
        if (variant) {
          releaseRentedInstances(variant, item.instanceCodes, item.quantity, 'available');
          syncCostumeStatusFromVariants(costume);
          await costume.save();
        }
      }
    }

    // 3. Cập nhật trạng thái đơn hàng
    order.status = 'cancelled';
    order.cancelReason = 'Cửa hàng hủy đơn';
    order.paymentStatus = 'refunded';
    await order.save();

    // 4. Gửi email thông báo cho khách hàng
    const user = await User.findById(order.customerId);
    try {
      if (user?.email) {
        await sendEmail({
          to: user.email,
          subject: 'CostumeHUB — Thông báo hủy đơn hàng',
          text: `Chào ${user.fullName},\n\nĐơn hàng ${order._id} của bạn đã bị hủy bởi cửa hàng.\nLý do: Cửa hàng hủy đơn`,
          html: `<p>Chào <b>${user.fullName}</b>,</p><p>Đơn hàng <b>${order._id}</b> của bạn đã bị hủy bởi cửa hàng.</p><p>Lý do: <span style="color:red">Cửa hàng hủy đơn</span></p>`,
        });
      }
    } catch (mailError) {
      console.error('Lỗi khi gửi email hủy đơn:', mailError);
    }

    await notifyOrderStatus(order, 'cancelled');
    return order;
  }

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
  await notifyOrderStatus(order, status);
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
      await notifyOrderStatus(order, 'delivering');
      return { message: 'Xác nhận thành công. Đã tạo đơn trên GHN.', order };
    } catch (ghnError) {
      order.status = 'delivering';
      await order.save();
      await notifyOrderStatus(order, 'delivering');
      return { message: 'Đã chuyển sang đang giao (Lỗi kết nối GHN nên không tạo được vận đơn).', order };
    }
  } else {
    if (order.shippingAddress?.addressDetail === "Nhận tại cửa hàng") {
      order.status = 'renting';
      order.rentingAt = new Date();
      await order.save();
      await notifyOrderStatus(order, 'renting');
      return { message: 'Đã chuyển sang đang thuê (Nhận tại cửa hàng).', order };
    } else {
      order.status = 'delivering';
      await order.save();
      await notifyOrderStatus(order, 'delivering');
      return { message: 'Đã chuyển trạng thái sang đang giao (Không tạo đơn GHN).', order };
    }
  }
};

// Xây filter theo khoảng ngày (áp dụng lên createdAt của đơn hàng)
function buildDateRangeFilter(startDate, endDate) {
  if (!startDate && !endDate) return {};
  const createdAt = {};
  if (startDate) createdAt.$gte = new Date(startDate);
  if (endDate) createdAt.$lte = new Date(endDate);
  return { createdAt };
}

const getTotalRevenue = async (startDate, endDate) => {
  const validStatuses = ['delivering', 'delivered', 'renting', 'returning', 'completed', 'overdue'];
  const orders = await Rental.find({
    status: { $in: validStatuses },
    ...buildDateRangeFilter(startDate, endDate),
  }, 'totalAmount createdAt');
  const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);

  // Gom nhóm doanh thu theo tháng (dựa trên ngày tạo đơn) để vẽ biểu đồ xu hướng
  const monthlyMap = {};
  orders.forEach((o) => {
    const d = new Date(o.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthlyMap[key] = (monthlyMap[key] || 0) + o.totalAmount;
  });
  const revenueByMonth = Object.entries(monthlyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, total]) => ({ month, total }));

  return {
    totalRevenue,
    orderCount: orders.length,
    revenueByMonth,
  };
};

const getActiveRentals = async (startDate, endDate) => {
  const activeStatuses = ['delivering', 'delivered', 'renting', 'overdue'];
  const activeOrders = await Rental.find({
    status: { $in: activeStatuses },
    ...buildDateRangeFilter(startDate, endDate),
  }, 'items');
  let totalActiveCostumes = 0;
  activeOrders.forEach((o) => o.items.forEach((i) => { totalActiveCostumes += i.quantity; }));

  return {
    activeOrdersCount: activeOrders.length,
    totalActiveCostumes
  };
};

// YÊU CẦU: Thống kê sức chứa kho hàng (View Inventory Report)
const getInventoryUtilization = async (startDate, endDate) => {
  const costumes = await Costume.find({}, 'categoryId variants').populate({
    path: 'categoryId',
    select: 'name parentId',
    populate: { path: 'parentId', select: 'name' }
  });

  let totalStock = 0;
  const categoryStockMap = {}; // catId -> { name, parentId, parentName, totalStock, rentedCount }
  costumes.forEach((c) => {
    const catId = c.categoryId?._id?.toString() || 'unknown';
    const catName = c.categoryId?.name || 'Chưa phân loại';
    const parentId = c.categoryId?.parentId?._id?.toString() || null;
    const parentName = c.categoryId?.parentId?.name || null;
    if (!categoryStockMap[catId]) categoryStockMap[catId] = { name: catName, parentId, parentName, totalStock: 0, rentedCount: 0 };
    c.variants.forEach((v) => {
      const stock = v.totalStock || 0;
      totalStock += stock;
      categoryStockMap[catId].totalStock += stock;
    });
  });

  if (totalStock === 0) return { utilizationPercentage: 0, totalStock: 0, currentlyRented: 0, categoryBreakdown: [] };

  // Khớp đúng danh sách trạng thái "đang giữ hàng" dùng ở createOrder/extendRental — trước đây thiếu
  // 'pending' và 'returning' khiến "đang thuê" ở dashboard thấp hơn thực tế (đơn pending đã giữ instance
  // ngay từ lúc tạo; đơn returning vẫn giữ instance tới khi staff kiểm tra đồ trả xong).
  const activeStatuses = ['pending', 'delivering', 'delivered', 'renting', 'returning', 'overdue'];
  const activeOrders = await Rental.find({
    status: { $in: activeStatuses },
    ...buildDateRangeFilter(startDate, endDate),
  }, 'items').populate('items.costume', 'categoryId');
  let currentlyRented = 0;

  activeOrders.forEach((o) => {
    o.items.forEach((i) => {
      currentlyRented += i.quantity;

      const catId = i.costume?.categoryId?.toString() || 'unknown';
      if (categoryStockMap[catId]) {
        categoryStockMap[catId].rentedCount += i.quantity;
      }
    });
  });

  const utilizationPercentage = ((currentlyRented / totalStock) * 100).toFixed(2);

  return {
    utilizationPercentage: parseFloat(utilizationPercentage),
    totalStock,
    currentlyRented,
    categoryBreakdown: Object.entries(categoryStockMap).map(([categoryId, v]) => ({
      categoryId,
      name: v.name,
      parentId: v.parentId,
      parentName: v.parentName,
      totalStock: v.totalStock,
      rentedCount: v.rentedCount,
    })),
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
  await notifyOrderStatus(rental, 'returning');
  return rental;
};

const inspectReturn = async (id, { damageTier, damagePercent, missingNotes, actualReturnDate }, files = [], performedBy = null) => {
  const cleanupFiles = () => {
    for (const file of files) {
      if (fs.existsSync(file.path)) {
        try { fs.unlinkSync(file.path); } catch (err) { console.error('Lỗi khi xóa tệp tạm:', err.message); }
      }
    }
  };

  const rental = await Rental.findById(id).populate('items.costume');
  if (!rental) { cleanupFiles(); throw new HttpError('Không tìm thấy đơn thuê', 404); }
  if (rental.status !== 'returning') { cleanupFiles(); throw new HttpError('Đơn chưa ở trạng thái Đang trả hàng (returning)', 400); }

  const tier = damageTier || 'none';
  const tierRange = DAMAGE_TIER_RANGES[tier];
  if (!tierRange) { cleanupFiles(); throw new HttpError('Mức độ hư hỏng không hợp lệ.', 400); }

  // Với 2 mức có khoảng dao động (hư nhẹ 30-50%, hư nặng 70-100%), staff chọn % cụ thể trong khoảng;
  // các mức còn lại (0%, 20%, 100%) là cố định theo chính sách, không cho tuỳ chỉnh.
  let finalPercent = tierRange.min;
  if (tierRange.min !== tierRange.max) {
    const requestedPercent = Number(damagePercent);
    if (Number.isNaN(requestedPercent) || requestedPercent < tierRange.min || requestedPercent > tierRange.max) {
      cleanupFiles();
      throw new HttpError(`Mức đền bù phải trong khoảng ${tierRange.min}% - ${tierRange.max}% cho mức độ hư hỏng này.`, 400);
    }
    finalPercent = requestedPercent;
  }

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

  const originalDeposit = rental.totalDeposit || 0;
  const finalDamageFee = originalDeposit * (finalPercent / 100);

  // Mất/hư hỏng toàn bộ: khấu trừ hết cọc + bồi thường phần giá trị sản phẩm vượt quá tiền cọc đã đóng
  let replacementFee = 0;
  if (tier === 'total_loss') {
    rental.items.forEach((item) => {
      const replacementValue = item.costume?.price || 0;
      replacementFee += Math.max(0, replacementValue - (item.depositPrice || 0)) * item.quantity;
    });
  }

  const totalFine = totalLateFee + finalDamageFee;
  const refundAmount = Math.max(0, originalDeposit - totalFine);

  // Tải ảnh/video bằng chứng lên Cloudinary làm bằng chứng đơn hàng đã được kiểm tra đúng hiện trạng
  const evidenceUrls = [];
  for (const file of files) {
    try {
      const url = await uploadReturnEvidence(file.path);
      evidenceUrls.push(url);
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
    } catch (uploadError) {
      console.error('Lỗi khi tải ảnh/video bằng chứng lên Cloudinary:', uploadError);
      cleanupFiles();
      throw new HttpError('Có lỗi xảy ra khi tải ảnh/video bằng chứng lên đám mây.', 500);
    }
  }

  rental.status = 'completed';
  rental.actualReturnDate = actualReturn;
  rental.lateFee = totalLateFee;
  rental.damageFee = finalDamageFee;
  rental.replacementFee = replacementFee;
  rental.damageTier = tier;
  rental.damagePercent = finalPercent;
  rental.returnEvidence = evidenceUrls;
  rental.refundAmount = refundAmount;
  if (missingNotes) rental.cancelReason = missingNotes;
  await rental.save();
  await notifyOrderStatus(rental, 'completed');

  await User.updateOne({ _id: rental.customerId }, { $inc: { balance: refundAmount - replacementFee } });

  // Nhả đúng các unit đã cho thuê của đơn này:
  // - Trả hàng bình thường/hư hỏng nhẹ -> 'maintenance' (giặt là/kiểm tra xong staff bấm
  //   "Hoàn tất bảo trì" mới quay lại 'available' — khớp luồng MaintenancePage).
  // - Mất/hỏng toàn bộ (total_loss) -> 'retired' (loại vĩnh viễn) + ghi lịch sử xuất kho 'lost'
  //   để số liệu kho và lịch sử Nhập/Xuất luôn khớp với thực tế.
  const returnedStatus = tier === 'total_loss' ? 'retired' : 'maintenance';
  const CostumeModel = mongoose.model('Costume');
  for (const item of rental.items) {
    if (item.costume) {
      const costumeToUpdate = await CostumeModel.findById(item.costume._id || item.costume);
      if (costumeToUpdate) {
        const variant = costumeToUpdate.variants.find((v) => v.size === item.size);
        if (variant) {
          const beforeStock = variant.totalStock || 0;
          releaseRentedInstances(variant, item.instanceCodes, item.quantity, returnedStatus);
          if (tier === 'total_loss' && performedBy) {
            await StockTransaction.create({
              costumeId: costumeToUpdate._id,
              size: item.size,
              type: 'out',
              reason: 'lost',
              quantity: item.quantity,
              note: `Khách làm mất/hỏng toàn bộ — đơn #${rental._id.toString().slice(-6).toUpperCase()}`,
              beforeStock,
              afterStock: variant.totalStock || 0,
              performedBy,
            });
          }
        }
        syncCostumeStatusFromVariants(costumeToUpdate);
        await costumeToUpdate.save();
      }
    }
  }

  return { totalFine, refundAmount, damageFee: finalDamageFee, replacementFee };
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

  const startDay = new Date(rental.startDate);
  const startDayZero = new Date(startDay.getFullYear(), startDay.getMonth(), startDay.getDate());
  const totalDaysAfterExtend = Math.ceil((newEndDay.getTime() - startDayZero.getTime()) / (1000 * 60 * 60 * 24));

  for (const item of rental.items) {
    const costume = item.costume;
    if (!costume) throw new HttpError('Sản phẩm trong đơn hàng không tồn tại.', 404);

    const maxDaysAllowed = costume.maxRentalDays || 7;
    if (totalDaysAfterExtend > maxDaysAllowed) {
      throw new HttpError(
        `Sản phẩm "${costume.name}" giới hạn tối đa ${maxDaysAllowed} ngày thuê. Tổng số ngày sau gia hạn (${totalDaysAfterExtend} ngày) vượt quá hạn mức cho phép.`,
        400
      );
    }
  }

  const oldRentalDays = Math.ceil((oldEndDay.getTime() - startDayZero.getTime()) / (1000 * 60 * 60 * 24));
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

  await User.updateOne({ _id: customerId }, { $inc: { balance: -totalExtendCost } });

  // Ghi lại lịch sử giao dịch trừ tiền
  if (totalExtendCost > 0) {
    await TransactionHistory.create({
      user: customerId,
      txnRef: `EXTEND_${rental._id}_${Date.now()}`,
      amount: -totalExtendCost,
      status: "success",
    });

    // Tạo thông báo
    await notificationService.createNotification({
      userId: customerId,
      type: "order_status",
      title: "Gia hạn thuê thành công",
      message: `Tài khoản của bạn đã bị trừ ${totalExtendCost.toLocaleString("vi-VN")}đ cho phí gia hạn đơn hàng #${rental._id.toString().slice(-6).toUpperCase()}.`,
      link: "/rental-history",
      relatedId: rental._id,
    });
  }

  rental.endDate = newEnd;
  rental.totalRentalPrice += totalExtendCost;
  rental.totalAmount += totalExtendCost;
  await rental.save();

  return { success: true, message: 'Gia hạn thuê và thanh toán thành công.', order: rental };
};

// Top N sản phẩm được thuê nhiều nhất, tính từ số liệu đơn thuê thực tế (không tính đơn đã hủy)
// — dùng cho mục "Khoảnh Khắc Tỏa Sáng" ở trang chủ.
const getTopRentedCostumes = async (limit = 3) => {
  const limitNum = Math.max(1, Math.min(10, parseInt(limit) || 3));

  const rows = await Rental.aggregate([
    { $match: { status: { $ne: 'cancelled' } } },
    { $unwind: '$items' },
    { $group: { _id: '$items.costume', rentalCount: { $sum: '$items.quantity' } } },
    { $sort: { rentalCount: -1 } },
    { $limit: limitNum },
  ]);

  const costumes = await Costume.find({ _id: { $in: rows.map((r) => r._id) }, status: { $ne: 'hidden' } })
    .populate('categoryId', 'name');

  const costumeMap = new Map(costumes.map((c) => [c._id.toString(), c]));
  return rows
    .map((r) => {
      const costume = costumeMap.get(r._id.toString());
      return costume ? { costume, rentalCount: r.rentalCount } : null;
    })
    .filter(Boolean);
};

const updateRentalDates = async (id, { startDate, endDate }) => {
  const rental = await Rental.findById(id).populate('items.costume');
  if (!rental) throw new HttpError('Không tìm thấy đơn hàng.', 404);

  const start = new Date(startDate);
  const end = new Date(endDate);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  const rentalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  if (rentalDays < 1) throw new HttpError('Ngày kết thúc phải sau ngày bắt đầu.', 400);

  for (const item of rental.items) {
    const costume = item.costume;
    if (!costume) continue;

    const maxDays = costume.maxRentalDays || 7;
    if (rentalDays > maxDays) throw new HttpError(`Sản phẩm ${costume.name} chỉ được thuê tối đa ${maxDays} ngày.`, 400);
  }

  const priceFactor = getRentalPriceFactor(rentalDays);
  let newTotalRentalPrice = 0;

  for (const item of rental.items) {
    const costume = item.costume;
    const rentalPrice = item.rentalPricePerDay || (costume ? costume.pricePerDay : 0);
    newTotalRentalPrice += rentalPrice * priceFactor * item.quantity;
  }

  const difference = newTotalRentalPrice - rental.totalRentalPrice;

  if (difference < 0) {
    const user = await User.findById(rental.customerId);
    if (user) {
      const refundAmt = Math.abs(difference);
      user.balance += refundAmt;
      await user.save();

      // Ghi lại lịch sử giao dịch hoàn tiền
      await TransactionHistory.create({
        user: rental.customerId,
        txnRef: `REFUND_DATE_${rental._id}_${Date.now()}`,
        amount: refundAmt,
        status: "success",
      });

      // Tạo thông báo
      await notificationService.createNotification({
        userId: rental.customerId,
        type: "order_status",
        title: "Hoàn tiền cập nhật ngày thuê",
        message: `Tài khoản của bạn đã được cộng ${refundAmt.toLocaleString("vi-VN")}đ do thay đổi ngày thuê của đơn hàng #${rental._id.toString().slice(-6).toUpperCase()}.`,
        link: "/rental-history",
        relatedId: rental._id,
      });
    }
  }

  rental.startDate = start;
  rental.endDate = end;
  rental.totalRentalPrice = newTotalRentalPrice;
  rental.totalAmount += difference;

  await rental.save();
  return rental;
};

module.exports = {
  getRentalHistory,
  getOrderDetail,
  getDeliveryEstimate,
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
  updateRentalDates,
  notifyOrderStatus,
  getTopRentedCostumes,
  autoUpdateDeliveredStatus,
  sendAutoConfirmReminders,
};
