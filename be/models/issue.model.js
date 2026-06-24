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
      enum: ["pending", "resolved", "rejected", "cancelled"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Issue", issueSchema);