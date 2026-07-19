const mongoose = require("mongoose");

const stockTransactionSchema = new mongoose.Schema(
  {
    costumeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Costume",
      required: true,
    },
    size: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["in", "out"],
      required: true,
    },
    reason: {
      type: String,
      enum: [
        "purchase_new",         // Nhập mới mua về
        "stock_correction_in",  // Điều chỉnh kiểm kê (tăng)
        "damaged_writeoff",     // Thanh lý do hư hỏng
        "lost",                 // Mất hàng
        "stock_correction_out", // Điều chỉnh kiểm kê (giảm)
      ],
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    note: {
      type: String,
      default: "",
    },
    beforeStock: { type: Number, required: true },
    afterStock: { type: Number, required: true },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

stockTransactionSchema.index({ costumeId: 1, createdAt: -1 });
stockTransactionSchema.index({ createdAt: -1 });

module.exports = mongoose.model("StockTransaction", stockTransactionSchema);
