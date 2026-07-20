const mongoose = require("mongoose");

const costumeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
    },

    slug: {
      type: String,
      trim: true,
    },

    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    images: [
      {
        type: String,
      },
    ],

    lateFeePerDay: {
      type: Number,
      default: 0,
    },

    brand: {
      type: String,
      default: "",
    },

    price: {
      type: Number,
      min: 0,
      default: 0
    },

    status: {
      type: String,
      enum: [
        "available",
        "rented",
        "maintenance",
        "hidden",
        "out_of_stock",
      ],
      default: "available",
    },

    pricePerDay: {
      type: Number,
      min: 0,
      default: 0
    },

    deposit: {
      type: Number,
      min: 0,
      default: 0
    },

    minRentalDays: {
      type: Number,
      default: 1
    },

    maxRentalDays: {
      type: Number,
      default: 7
    },

    variants: [{
      status: {
        type: String,
        enum: [
          "available",
          "rented",
          "maintenance",
          "hidden",
          "out_of_stock",
        ],
        default: "available",
      },
      size: String,
      sku: {
        type: String,
      },
      // totalStock/availableStock/status ở trên là giá trị DẪN XUẤT từ instances[] bên dưới
      // (đồng bộ qua costumeService.syncVariantFromInstances) — giữ lại để mọi chỗ đang đọc
      // 2 field này (giỏ hàng, checkout, dashboard, danh sách sản phẩm) không cần sửa gì.
      availableStock: {
        type: Number,
        min: 0,
        default: 0
      },
      totalStock: {
        type: Number,
        min: 0,
        default: 0
      },
      bustSize: String,
      waistSize: String,
      // Từng cái vật lý cụ thể của size này — cho phép đánh dấu bảo trì/xuất kho đúng 1 cái,
      // không chặn nhầm cả lô khi chỉ có 1 trong N cái cần bảo trì.
      instances: [{
        unitCode: { type: String, required: true },
        status: {
          type: String,
          enum: ["available", "rented", "maintenance", "retired"],
          default: "available",
        },
        note: { type: String, default: "" },
        createdAt: { type: Date, default: Date.now },
      }],
    }],
    specifications: {
      material: String,
      includedAccessories: [String],
    },

    reviewCount: {
      type: Number,
      default: 0,
    },

    isFeatured: {
      type: Boolean,
      default: false,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

costumeSchema.index({ status: 1 });
costumeSchema.index({ categoryId: 1 });
costumeSchema.index({ createdAt: -1 });

module.exports = mongoose.model(
  "Costume",
  costumeSchema
);