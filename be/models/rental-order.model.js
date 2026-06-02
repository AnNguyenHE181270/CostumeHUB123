const mongoose = require('mongoose');

const rentalOrderSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    costume: { type: mongoose.Schema.Types.ObjectId, ref: 'Costume', required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    quantity: { type: Number, required: true, default: 1 },
    rentalFee: { type: Number, required: true },
    depositFee: { type: Number, required: true }, // Tiền cọc rủi ro
    status: { 
        type: String, 
        enum: ['pending', 'confirmed', 'picked_up', 'returned', 'completed'], 
        default: 'pending' 
    }
}, { timestamps: true });

module.exports = mongoose.model('RentalOrder', rentalOrderSchema);