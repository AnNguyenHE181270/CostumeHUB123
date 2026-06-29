const mongoose = require("mongoose");

const chatRoomSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // trạng thái room
    status: {
      type: String,
      enum: ["active", "closed"],
      default: "active",
    },

    // tin nhắn cuối để hiển thị list chat
    lastMessage: {
      type: String,
      default: "",
    },

    lastMessageAt: {
      type: Date,
      default: null,
    },

    // ai đang active trong room
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

chatRoomSchema.index({ userId: 1, staffId: 1 }, { unique: true });

module.exports = mongoose.model("ChatRoom", chatRoomSchema);