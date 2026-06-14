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
        shippingFee: { type: Number, default: 0 },
        totalAmount: { type: Number, required: true },

        lateFee: { type: Number, default: 0 },
        damageFee: { type: Number, default: 0 },
        refundAmount: { type: Number, default: 0 },

        // ===== ORDER STATUS =====
        status: {
            type: String,
            enum: [
                "pending",
                "confirmed",
                "awaitingPayment",
                "delivering",
                "renting",
                "returning",
                "completed",
                "cancelled",
                "overdue"
            ],
            default: "pending",
        },

        // ===== PAYMENT =====
        paymentMethod: {
            type: String,
            enum: ["VNPAY", "VietQR", "Cash"],
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

        // ===== VNPAY INFO =====
        vnpayInfo: {
            txnRef: {
                type: String,
                default: ""
            }, // mã đơn gửi sang VNPAY

            transactionNo: {
                type: String,
                default: ""
            }, // vnp_TransactionNo

            bankCode: {
                type: String,
                default: ""
            }, // NCB, VCB,...

            responseCode: {
                type: String,
                default: ""
            }, // 00 success

            payDate: {
                type: String,
                default: ""
            }
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