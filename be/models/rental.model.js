const mongoose = require("mongoose");


const shippingAddressSchema = new mongoose.Schema({
    receiverName: { type: String, required: true },
    receiverPhone: { type: String, required: true },
    provinceId: { type: String },
    districtId: { type: String },
    wardCode: { type: String },
    province: { type: String },
    district: { type: String },
    ward: { type: String },
    addressDetail: { type: String },
    note: { type: String },
}, { _id: false });


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
            // Mã các unit vật lý cụ thể được gán cho dòng đơn này (độ dài = quantity) —
            // dùng để chỉ đánh dấu bảo trì đúng những cái đã trả, không phải cả size.
            instanceCodes: { type: [String], default: [] },
        }, { _id: false }],

        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true },
        actualReturnDate: { type: Date },
        deliveredAt: { type: Date },

        totalRentalPrice: { type: Number, required: true },
        totalDeposit: { type: Number, required: true },
        shippingFee: { type: Number, default: 0 },
        totalAmount: { type: Number, required: true },

        lateFee: { type: Number, default: 0 },
        damageFee: { type: Number, default: 0 },
        replacementFee: { type: Number, default: 0 },
        refundAmount: { type: Number, default: 0 },

        // Mức độ hư hỏng khi nhận lại đồ, đối chiếu bảng đền bù ở trang "Về Chúng Tôi"
        damageTier: {
            type: String,
            enum: ["none", "heavy_stain", "minor_damage", "major_damage", "total_loss"],
            default: "none",
        },
        damagePercent: { type: Number, default: 0 },
        returnEvidence: [{ type: String }],

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
            enum: ["VNPAY", "Cash"],
            default: "VNPAY",
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
            type: shippingAddressSchema,
            required: true
        },

        trackingCode: {
            type: String,
            default: ""
        },

        cancelReason: {
            type: String,
            default: ""
        },
        
        refundDetails: {
            bankName: { type: String },
            accountNumber: { type: String },
            accountName: { type: String },
            status: { type: String, enum: ["pending", "completed"], default: "pending" }
        },

        cancelOtpCode: { type: String, select: false },
        cancelOtpExpires: { type: Date, select: false },
        cancelOtpCooldownUntil: { type: Date, select: false },

        rentingAt: {
            type: Date
        },

        // Đánh dấu đã gửi thông báo nhắc khách trước khi hệ thống tự động xác nhận đã nhận hàng,
        // tránh cron job gửi lặp lại nhắc nhở nhiều lần trong cùng 1 khung giờ chờ.
        autoConfirmReminderSent: {
            type: Boolean,
            default: false,
        },

        // Đánh dấu đã gửi email nhắc trước 12 tiếng khi sắp quá hạn — reset về false mỗi khi
        // endDate thay đổi (gia hạn) để đơn được nhắc lại đúng theo hạn mới.
        upcomingOverdueReminderSent: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

rentalSchema.index({ status: 1 });
rentalSchema.index({ createdAt: -1 });
rentalSchema.index({ customerId: 1 });
module.exports = mongoose.model("Rental", rentalSchema);