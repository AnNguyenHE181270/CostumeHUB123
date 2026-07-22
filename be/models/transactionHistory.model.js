const mongoose = require("mongoose");

const transactionHistorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    orderCode: {
      type: Number,
      required: true,
      unique: true,
    },
    // Khôi phục lại trường orderCode để tránh lỗi E11000 duplicate key từ index cũ của MongoDB
    orderCode: {
      type: Number,
      default: () => Math.floor(Math.random() * 10000) + Date.now(),
    },
    amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "success", "failed"],
      default: "pending",
    },
    payosInfo: {
      type: String,
      default: "",
      select: false,
    },
    type: {
      type: String,
      enum: ["TOPUP", "WITHDRAW"],
      default: "TOPUP",
    },
    bankName: {
      type: String,
      trim: true,
    },
    accountNumber: {
      type: String,
      trim: true,
    },
    accountName: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("TransactionHistory", transactionHistorySchema);
