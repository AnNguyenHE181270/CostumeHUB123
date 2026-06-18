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
            rentalPricePerDay: { type: Number, required: true },
            depositPrice: { type: Number, required: true },
        }, { _id: false }],

        // ===== THỜI GIAN THUÊ =====
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true },
        actualReturnDate: { type: Date },

        // ===== TÀI CHÍNH =====
        totalRentalPrice: { type: Number, required: true },
        totalDeposit: { type: Number, required: true },
        totalAmount: { type: Number, required: true },

        lateFee: { type: Number, default: 0 },
        damageFee: { type: Number, default: 0 },
        refundAmount: { type: Number, default: 0 },

        // ===== ORDER STATUS =====
        status: {
            type: String,
            enum: [
                "pending",          // Đơn mới tạo
                "awaitingPayment",  // Chờ khách thanh toán/chuyển tiền
                "preparing",        // Staff xác nhận tiền (paymentStatus=paid) -> Đang chuẩn bị đồ
                "delivering",       // Staff chuẩn bị xong ấn Confirm -> Bắn API tạo đơn GHN -> GHN đang giao
                "renting",          // GHN báo giao thành công (Webhook) -> Khách đang thuê
                "returning",        // Khách yêu cầu trả đồ, đang chờ store nhận lại
                "completed",        // Nhận lại đồ, kiểm tra OK, hoàn cọc
                "cancelled",        // Hủy đơn
                "overdue"           // Quá hạn
            ],
            default: "pending",
        },

        // ===== PAYMENT =====
        paymentMethod: {
            type: String,
            enum: ["VNPAY", "Cash", "WALLET"],
            default: "WALLET",
        },

        paymentStatus: {
            type: String,
            enum: [
                "pending",
                "paid",
                "failed",
                "refunded"
            ],
            default: "pending"
        },

        // ===== SHIPPING =====
        shippingAddress: {
            receiverName: { type: String, required: true },
            receiverPhone: { type: String, required: true },
            provinceId: { type: Number },
            districtId: { type: Number },
            wardCode: { type: String },
            province: { type: String },
            district: { type: String },
            ward: { type: String },
            addressDetail: { type: String },
            note: { type: String },
        },

        trackingCode: {
            type: String,
            default: ""
        },

        cancelReason: {
            type: String,
            default: ""
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Rental", rentalSchema);