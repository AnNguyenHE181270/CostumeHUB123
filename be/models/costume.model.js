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
    price: {
      type: Number,
      min: 0,
      default: 0
    },

    rentalRates: {
      pricePerDay: { type: Number, default: 0 },
      pricePer3Days: { type: Number },
      pricePerWeek: { type: Number },
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


      variants: [{
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
      }],
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