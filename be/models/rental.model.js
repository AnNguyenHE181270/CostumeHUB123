const mongoose = require("mongoose");

const rentalSchema = new mongoose.Schema(
    {
        customerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        items: [{
            costume: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Costume",
                required: true,
            },
            size: { type: String, required: true },
            quantity: { type: Number, required: true, min: 1 },
            rentalPricePerDay: { type: Number, required: true }, // Giá thuê 1 ngày tại thời điểm đặt
            depositPrice: { type: Number, required: true }, // Giá cọc 1 bộ tại thời điểm đặt
        },
        { _id: false }],

        // ===== THỜI GIAN THUÊ =====
        startDate: { type: Date, required: true }, // Ngày bắt đầu tính giờ thuê
        endDate: { type: Date, required: true }, // Ngày dự kiến phải trả đồ
        actualReturnDate: { type: Date }, // Ngày thực tế khách trả (dùng để tính phí trễ)

        // ===== TÀI CHÍNH =====
        totalRentalPrice: { type: Number, required: true }, // Tiền thuê (items * qty * days)
        totalDeposit: { type: Number, required: true }, // Tiền cọc (items * qty)
        shippingFee: { type: Number, default: 0 },
        totalAmount: { type: Number, required: true }, // Tổng khách phải trả (Rental + Deposit + Ship)

        lateFee: { type: Number, default: 0 }, // Phí phạt trả muộn (Tính khi trả đồ)
        damageFee: { type: Number, default: 0 }, // Phí đền bù hư hỏng (Nếu có)
        refundAmount: { type: Number, default: 0 }, // Số tiền shop đã hoàn cọc lại cho khách

        // ===== TRẠNG THÁI ĐƠN HÀNG =====
        status: {
            type: String,
            enum: [
                "pending",       // Chờ duyệt / Chờ thanh toán
                "confirmed",     // Đã xác nhận, chuẩn bị đồ
                "awaitingPayment",
                "delivering",    // Đang giao cho khách
                "renting",       // Khách đang giữ đồ (Đã nhận hàng)
                "returning",     // Đang gửi trả lại shop
                "completed",     // Hoàn tất (Đã nhận lại đồ, đã hoàn cọc)
                "cancelled",     // Đã hủy
                "overdue"        // Quá hạn chưa trả (Được trigger bởi cronjob hoặc check thủ công)
            ],
            default: "pending",
        },

        // ===== TRẠNG THÁI THANH TOÁN =====
        paymentMethod: {
            type: String,
            enum: ["VNPAY", "VietQR"],
            default: "VietQR",
        },
        shippingAddress: {
            receiverName: { type: String, required: true },
            receiverPhone: { type: String, required: true },
            addressDetail: { type: String },
            note: { type: String },
        },

        // Mã theo dõi đơn hàng giao vận (GHTK, GHN...)
        trackingCode: { type: String, default: "" },

        cancelReason: { type: String, default: "" }, // Lý do hủy đơn
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Rental", rentalSchema);