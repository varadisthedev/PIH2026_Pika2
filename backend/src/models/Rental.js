import mongoose from 'mongoose';

const rentalSchema = new mongoose.Schema(
    {
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true,
        },
        renter: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        startDate: {
            type: Date,
            required: true,
        },
        endDate: {
            type: Date,
            required: true,
        },
        totalPrice: {
            type: Number,
            required: true,
            min: 0,
        },
        status: {
            type: String,
            enum: ['pending', 'approved', 'confirmed', 'rejected', 'completed', 'cancelled'],
            default: 'pending',
        },
        paymentId: {
            type: String,
        },
        orderId: {
            type: String,
        },
        amount: {
            type: Number,
        },
        paymentStatus: {
            type: String,
            enum: ['pending', 'paid', 'failed'],
            default: 'pending',
        },
    },
    { timestamps: true }
);

const Rental = mongoose.model('Rental', rentalSchema);
export default Rental;
