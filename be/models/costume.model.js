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

    status: {
      type: String,
      enum: ["available", "out_of_stock", "maintenance", "dry_cleaning", "hidden"],
      default: "available",
    },

    variants: [{
      size: String,

      stock: {
        type: Number,
        min: 0,
        default: 0
      },
      price: {
        type: Number,
        min: 0,
        default: 0
      },
      items: [{
        status: {
          type: String,
          enum: [
            "available",
            "rented",
            "maintenance",
            "dry_cleaning",
            "hidden",
          ],
          default: "available",
        },
        condition: String
      }]
    }],


    specifications: {
      material: String,
      includedAccessories: [String],
      bustSize: String,
      waistSize: String,
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

module.exports = mongoose.model(
  "Costume",
  costumeSchema
);