const rentalService = require('../services/rental.service');
const HttpError = require('../models/http-error.model');

const getRentalHistory = async (req, res, next) => {
  try {
    const result = await rentalService.getRentalHistory(req.userData.id);
    res.status(200).json(result);
  } catch (err) {
    next(err instanceof HttpError ? err : new HttpError(err.message || 'Fetching orders failed', 500));
  }
};

const orderDetail = async (req, res, next) => {
  try {
    const result = await rentalService.getOrderDetail(req.params.orderId, req.userData.id);
    res.status(200).json(result);
  } catch (err) {
    next(err instanceof HttpError ? err : new HttpError(err.message || 'Fetching order detail failed', 500));
  }
};

const createOrder = async (req, res, next) => {
  try {
    const order = await rentalService.createOrder(req.userData.id, req.body);
    res.status(201).json({ message: 'Đặt hàng và thanh toán thành công', order });
  } catch (err) {
    next(err instanceof HttpError ? err : new HttpError(err.message || 'Creating order failed', 500));
  }
};

const estimateDelivery = async (req, res, next) => {
  try {
    const { districtId, wardCode } = req.body;
    const result = await rentalService.getDeliveryEstimate(districtId, wardCode);
    res.status(200).json(result);
  } catch (err) {
    next(err instanceof HttpError ? err : new HttpError(err.message || 'Estimating delivery date failed', 500));
  }
};

const cancellOrrder = async (req, res, next) => {
  try {
    const { cancelReason, refundData } = req.body;
    const order = await rentalService.cancelOrder(req.params.id, req.userData.id, cancelReason, refundData);
    res.status(200).json({ message: 'Hủy đơn hàng thành công', order });
  } catch (err) {
    next(err instanceof HttpError ? err : new HttpError(err.message || 'Cancel order failed', 500));
  }
};

const sendCancelOtp = async (req, res, next) => {
  try {
      const { password, orderId } = req.body;
      const userId = req.userData.id;
      
      if (!password || !orderId) {
          return res.status(400).json({ success: false, message: "Vui lòng cung cấp mật khẩu và đơn hàng" });
      }

      const User = require('../models/user.model');
      const Rental = require('../models/rental.model');
      const bcrypt = require('bcryptjs');
      const sendEmail = require('../services/email.service');
      
      const user = await User.findById(userId).select("+password");
      if (!user) {
          return res.status(404).json({ success: false, message: "Không tìm thấy người dùng" });
      }

      const order = await Rental.findOne({ _id: orderId, customerId: userId }).select("+cancelOtpCooldownUntil +cancelOtpExpires +cancelOtpCode");
      if (!order) {
          return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng" });
      }

      if (order.cancelOtpCooldownUntil && order.cancelOtpCooldownUntil > Date.now()) {
          const remainingSeconds = Math.ceil((order.cancelOtpCooldownUntil - Date.now()) / 1000);
          return res.status(429).json({ success: false, message: `Vui lòng đợi ${remainingSeconds} giây trước khi gửi lại OTP.` });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
          return res.status(401).json({ success: false, message: "Mật khẩu không chính xác" });
      }

      // Generate OTP
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      order.cancelOtpCode = otpCode;
      order.cancelOtpExpires = Date.now() + 5 * 60 * 1000; // 5 minutes
      order.cancelOtpCooldownUntil = Date.now() + 60 * 1000; // 1 minute cooldown
      await order.save();

      // Send email
      await sendEmail({
          to: user.email,
          subject: "Mã OTP Xác Nhận Hủy Đơn & Hoàn Tiền - CostumeHUB",
          html: `
              <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                  <h2>Xác Nhận Hủy Đơn & Hoàn Tiền</h2>
                  <p>Chào ${user.fullName},</p>
                  <p>Bạn đã yêu cầu hủy đơn hàng và hoàn tiền tại CostumeHUB. Vui lòng sử dụng mã OTP dưới đây để xác nhận:</p>
                  <h1 style="color: #4CAF50; font-size: 32px; letter-spacing: 5px;">${otpCode}</h1>
                  <p>Mã này có hiệu lực trong 5 phút.</p>
                  <p>Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này hoặc liên hệ hỗ trợ ngay lập tức.</p>
                  <p>Trân trọng,<br/>Đội ngũ CostumeHUB</p>
              </div>
          `
      });

      return res.status(200).json({ success: true, message: "Mã OTP đã được gửi đến email của bạn" });
  } catch (error) {
      console.error("sendCancelOtp error:", error);
      return res.status(500).json({ success: false, message: "Có lỗi xảy ra khi gửi OTP" });
  }
};

const confirmReceipt = async (req, res, next) => {
  try {
    const order = await rentalService.confirmReceipt(req.params.id, req.userData.id);
    res.status(200).json({ message: 'Xác nhận nhận hàng thành công', order });
  } catch (err) {
    next(err instanceof HttpError ? err : new HttpError(err.message || 'Xác nhận nhận hàng thất bại', 500));
  }
};

const checkAvailability = async (req, res, next) => {
  try {
    const result = await rentalService.checkAvailability(req.body);
    res.status(200).json(result);
  } catch (err) {
    next(err instanceof HttpError ? err : new HttpError('Checking availability failed', 500));
  }
};

const getAllOrders = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const orders = await rentalService.getAllOrders(startDate, endDate);
    res.status(200).json(orders);
  } catch (err) {
    next(err instanceof HttpError ? err : new HttpError('Fetching orders failed', 500));
  }
};

const updateOrderStatus = async (req, res, next) => {
  try {
    const order = await rentalService.updateOrderStatus(req.params.id, req.body.status);
    res.status(200).json({ message: 'Status updated', order });
  } catch (err) {
    next(err instanceof HttpError ? err : new HttpError('Updating status failed', 500));
  }
};

const confirmPreparation = async (req, res, next) => {
  try {
    const result = await rentalService.confirmPreparation(req.params.id);
    res.status(200).json(result);
  } catch (err) {
    next(err instanceof HttpError ? err : new HttpError('Lỗi server khi xác nhận chuẩn bị đồ', 500));
  }
};

const getTotalRevenue = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const result = await rentalService.getTotalRevenue(startDate, endDate);
    res.status(200).json(result);
  } catch (err) {
    next(err instanceof HttpError ? err : new HttpError('Fetching total revenue failed', 500));
  }
};

const getActiveRentals = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const result = await rentalService.getActiveRentals(startDate, endDate);
    res.status(200).json(result);
  } catch (err) {
    next(err instanceof HttpError ? err : new HttpError('Fetching active rentals failed', 500));
  }
};

const getInventoryUtilization = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const result = await rentalService.getInventoryUtilization(startDate, endDate);
    res.status(200).json(result);
  } catch (err) {
    next(err instanceof HttpError ? err : new HttpError('Fetching inventory utilization failed', 500));
  }
};

const requestReturn = async (req, res, next) => {
  try {
    const rental = await rentalService.requestReturn(req.params.id);
    res.status(200).json({ message: 'Đã gửi yêu cầu trả hàng. Vui lòng chờ cửa hàng xác nhận.', data: rental });
  } catch (err) {
    next(err instanceof HttpError ? err : new HttpError('Lỗi hệ thống khi yêu cầu trả đồ', 500));
  }
};

const inspectReturn = async (req, res, next) => {
  try {
    const result = await rentalService.inspectReturn(req.params.id, req.body, req.files || [], req.userData.id);
    res.status(200).json({ message: 'Kiểm tra và khấu trừ cọc thành công', data: result });
  } catch (err) {
    next(err instanceof HttpError ? err : new HttpError('Lỗi hệ thống khi kiểm tra đồ', 500));
  }
};

const extendRental = async (req, res, next) => {
  try {
    const result = await rentalService.extendRental(req.params.id, req.userData.id, req.body.newEndDate);
    res.status(200).json(result);
  } catch (err) {
    next(err instanceof HttpError ? err : new HttpError(err.message || 'Gia hạn đơn hàng thất bại.', 500));
  }
};

const getTopRentedCostumes = async (req, res, next) => {
  try {
    const result = await rentalService.getTopRentedCostumes(req.query.limit);
    res.status(200).json({ success: true, items: result });
  } catch (err) {
    next(err instanceof HttpError ? err : new HttpError('Fetching top rented costumes failed', 500));
  }
};

const updateRentalDates = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.body;
    const updatedRental = await rentalService.updateRentalDates(id, { startDate, endDate });
    res.status(200).json({ message: 'Cập nhật ngày thuê thành công.', order: updatedRental });
  } catch (err) {
    next(err instanceof HttpError ? err : new HttpError(err.message || 'Cập nhật ngày thuê thất bại.', 500));
  }
};

const createOfflineOrder = async (req, res, next) => {
  try {
    const order = await rentalService.createOfflineOrder(req.userData.id, req.body);
    res.status(201).json({ message: 'Tạo đơn hàng offline thành công', order });
  } catch (err) {
    next(err instanceof HttpError ? err : new HttpError(err.message || 'Creating offline order failed', 500));
  }
};

const confirmRefund = async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await rentalService.confirmRefund(id);
    res.status(200).json({ message: 'Xác nhận hoàn tiền thành công.', order });
  } catch (err) {
    next(err instanceof HttpError ? err : new HttpError(err.message || 'Xác nhận hoàn tiền thất bại.', 500));
  }
};

module.exports = {
  confirmReceipt, checkAvailability, createOrder, getAllOrders, updateOrderStatus,
  confirmPreparation, getRentalHistory, orderDetail, cancellOrrder,
  getTotalRevenue, getActiveRentals, getInventoryUtilization,
  requestReturn, inspectReturn, extendRental, getTopRentedCostumes, updateRentalDates,
  createOfflineOrder, estimateDelivery, sendCancelOtp, confirmRefund,
};
