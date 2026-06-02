const mongoose = require("mongoose");

// Sub-schema lưu thông tin sản phẩm trong đơn thuê (Snapshot)
const rentalItemSchema = new mongoose.Schema(
    {
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
    { _id: false }
);

// Sub-schema lưu địa chỉ giao hàng (Tránh bị đổi khi user cập nhật profile)
const shippingAddressSchema = new mongoose.Schema(
    {
        receiverName: { type: String, required: true },
        receiverPhone: { type: String, required: true },
        province: { type: String, required: true },
        district: { type: String, required: true },
        ward: { type: String, required: true },
        addressDetail: { type: String, required: true },
        note: { type: String, default: "" },
    },
    { _id: false }
);

const rentalSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        items: [rentalItemSchema],

        // ===== THỜI GIAN THUÊ =====
        rentalDays: { type: Number, required: true, min: 1 }, // Số ngày thuê
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
            enum: ["cod", "bank_transfer", "vnpay", "momo"],
            default: "cod",
        },
        paymentStatus: {
            type: String,
            enum: ["unpaid", "deposit_paid", "paid", "refunded"],
            default: "unpaid",
        },

        shippingAddress: {
            type: shippingAddressSchema,
            required: true,
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