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
      required: true,
    },

    slug: {
      type: String,
      trim: true,
    },

    sku: {
      type: String,
      trim: true,
    },

    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    gender: {
      type: String,
      enum: ["male", "female", "unisex", "kids"],
      default: "unisex",
    },

    images: [
      {
        type: String,
      },
    ],

    rentalPricePerDay: {
      type: Number,
      required: true,
      min: 0,
    },

    depositPrice: {
      type: Number,
      default: 0,
    },

    brand: {
      type: String,
      default: "",
    },

    color: [{
      type: String,
    }],

    size: {
      type: String,
    },

    material: {
      type: String,
    },

    specifications: {
      material: String,
      includedAccessories: [String],
      bustSize: String,
      waistSize: String,
    },

    status: {
      type: String,
      enum: [
        "available",
        "rented",
        "maintenance",
        "dry_cleaning",
        "hidden",
        "discontinued"
      ],
      default: "active",
    },

    ratingAverage: {
      type: Number,
      default: 0,
    },

    reviewCount: {
      type: Number,
      default: 0,
    },

    totalRentals: {
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

module.exports = mongoose.model(
  "Costume",
  costumeSchema
);