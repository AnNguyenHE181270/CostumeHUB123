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
    evidence: {
      type: String,
      default: "",
    },
    note: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Issue", issueSchema);