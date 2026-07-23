const mongoose = require("mongoose");

const issueSchema = new mongoose.Schema(
  {
    rentalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Rental",
      required: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    resolution: {
      type: String,
      enum: ["return_refund", "exchange"],
      required: true,
    },
    evidence: {
      type: [String],
      default: [],
    },
    note: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["pending", "rejected", "accepted", "cancelled", "escalated"],
      default: "pending",
    },
    rejectReason: {
      type: String,
      default: "",
    },
    rejectEvidence: {
      type: [String],
      default: [],
    },
    // Đánh dấu khiếu nại đã TỪNG được staff đẩy lên chủ shop — giữ lại vĩnh viễn dù status sau đó
    // chuyển tiếp (accepted/rejected), để lọc đúng danh sách khiếu nại hiển thị cho owner (chỉ thấy
    // những khiếu nại staff đã đẩy lên, không thấy khiếu nại staff tự xử lý trực tiếp).
    escalatedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Issue", issueSchema);