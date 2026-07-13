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

        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true },
        actualReturnDate: { type: Date },
        deliveredAt: { type: Date },

        totalRentalPrice: { type: Number, required: true },
        totalDeposit: { type: Number, required: true },
        totalAmount: { type: Number, required: true },

        lateFee: { type: Number, default: 0 },
        damageFee: { type: Number, default: 0 },
        refundAmount: { type: Number, default: 0 },

        status: {
            type: String,
            enum: [
                "pending",          // Đơn mới tạo
                "delivering",       // Staff chuẩn bị xong ấn Confirm -> Bắn API tạo đơn GHN -> GHN đang giao
                "delivered",        // GHN báo giao thành công (Webhook) -> Chờ khách xác nhận đã nhận hàng (hoặc tự động sau 5 tiếng)
                "renting",          // Khách đã xác nhận nhận hàng, hoặc quá 5 tiếng kể từ lúc giao -> Đang thuê
                "returning",        // Khách yêu cầu trả đồ, đang chờ store nhận lại
                "completed",        // Nhận lại đồ, kiểm tra OK, hoàn cọc
                "cancelled",        // Hủy đơn
                "overdue"           // Quá hạn
            ],
            default: "pending",
        },

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