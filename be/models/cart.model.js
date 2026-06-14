const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    items: [{
        costume: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Costume",
            required: true,
        },
        size: String,
        quantity: {
            type: Number,
            min: 0,
            default: 1,
        },
        status: {
            type: String,
            enum: [
                "active",
                "expired",
                "pending"
            ],
            default: "active",
        },
        startDate: {
            type: Date
        },
        endDate: {
            type: Date
        },
        rentalDays: {
            type: Number
        },
    }],
}, { timestamps: true });

module.exports = mongoose.model('Cart', cartSchema);