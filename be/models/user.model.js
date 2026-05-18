const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema(
  {
    receiverName: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    city: {
      type: String,
      required: true,
    },

    district: {
      type: String,
      required: true,
    },

    ward: {
      type: String,
      required: true,
    },

    detailAddress: {
      type: String,
      required: true,
      trim: true,
    },

    note: {
      type: String,
      default: "",
    },

    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  { _id: true },
);

// ================= USER SCHEMA =================
const userSchema = new mongoose.Schema(
  {
    // Basic Info
    fullName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    password: {
      type: String,
      minlength: 6,
      select: false,
      required: function () {
        return this.provider === "local";
      },
    },

    phone: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },

    avatar: {
      type: String,
      default: "https://cdn-icons-png.flaticon.com/512/149/149071.png",
    },

    dateOfBirth: Date,

    gender: {
      type: String,
      enum: ["male", "female", "other"],
    },

    // ================= ROLE (MỚI) =================
    roles: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Role",
      },
    ],

    // OAuth
    provider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },

    providerId: {
      type: String,
      default: null,
    },

    // Email verification
    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    otpCode: {
      type: String,
      select: false,
    },

    otpExpires: {
      type: Date,
      select: false,
    },

    otpCooldownUntil: {
      type: Date,
      select: false,
    },

    // Reset password
    resetPasswordToken: {
      type: String,
      select: false,
    },

    resetPasswordExpire: {
      type: Date,
      select: false,
    },

    // Addresses
    addresses: {
      type: [addressSchema],
      default: [],
    },

    // Account status
    status: {
      type: String,
      enum: ["active", "blocked", "pending"],
      default: "active",
    },

    // Wishlist
    wishlist: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Costume",
      },
    ],

    // Orders
    rentalOrders: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "RentalOrder",
      },
    ],

    lastLogin: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("User", userSchema);
