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
        "dry_cleaning",
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

    variants: [{
      status: {
        type: String,
        enum: [
          "available",
          "rented",
          "maintenance",
          "dry_cleaning",
          "hidden",
          "out_of_stock",
        ],
        default: "available",
      },
      size: String,
      sku: {
        type: String,
      },
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