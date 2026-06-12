const mongoose = require("mongoose");


const addressSchema = new mongoose.Schema(
  {
    receiverName: { type: String, required: true, trim: true },
    receiverPhone: { type: String, required: true, trim: true },
    province: { type: String, required: true },
    district: { type: String, required: true },
    ward: { type: String, required: true },
    addressDetail: { type: String, required: true, trim: true },
    note: { type: String, default: "" },
    isDefault: { type: Boolean, default: false },
  },
  { _id: true },
);

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "Vui lòng nhập họ tên"],
      trim: true,
      minlength: 2,
      maxlength: 50,
    },

    email: {
      type: String,
      required: [true, "Vui lòng nhập email"],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    password: {
      type: String,
      required: [true, "Vui lòng nhập mật khẩu"],
      minlength: 6,
      select: false,
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

    role: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
      required: true,
    },

    status: {
      type: String,
      enum: ["active", "blocked", "pending"],
      default: "active",
    },

    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    otpCode: { type: String, select: false },
    otpExpires: { type: Date, select: false },
    otpCooldownUntil: { type: Date, select: false },

    resetPasswordToken: { type: String, select: false },
    resetPasswordExpire: { type: Date, select: false },

    addresses: {
      type: [addressSchema],
      default: [],
      validate: {
        validator: function (addresses) {
          return addresses.length <= 5;
        },
        message: "A user can have a maximum of 5 addresses",
      },
    },

    wishlist: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Costume",
      },
    ],
  },
  {
    timestamps: true,
  },
);



module.exports = mongoose.model("User", userSchema);
