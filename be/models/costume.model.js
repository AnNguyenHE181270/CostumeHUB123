const mongoose = require("mongoose");

const sizeSchema = new mongoose.Schema(
  {
    size: {
      type: String,
      enum: ["XS", "S", "M", "L", "XL", "XXL"],
    },

    quantity: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

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

    category: {
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

    overdueFee: {
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

    material: {
      type: String,
    },

    sizes: [sizeSchema],

    status: {
      type: String,
      enum: [
        "active",
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