import Rental from '../models/Rental.js';
import { createRazorpayOrder, verifyRazorpaySignature } from '../services/razorpayService.js';

export const createOrder = async (req, res) => {
    try {
        const { rentalId } = req.body;
        console.log(`[PaymentController] Creating order for rental: ${rentalId}`);

        if (!rentalId) {
            return res.status(400).json({ error: 'rentalId is required' });
        }

        const rental = await Rental.findById(rentalId).populate('product');
        if (!rental) {
            return res.status(404).json({ error: 'Rental not found' });
        }

        // Validate ownership - renter must be the user making the request
        if (rental.renter.toString() !== req.dbUser._id.toString()) {
            return res.status(403).json({ error: 'Unauthorized to pay for this rental' });
        }

        const amount = rental.totalPrice;
        if (!amount || amount <= 0) {
            return res.status(400).json({ error: `Invalid rental amount: ₹${amount}. Cannot create payment order.` });
        }

        console.log(`[PaymentController] Amount to pay: INR ${amount}`);

        // Create order via Razorpay service
        const order = await createRazorpayOrder(amount, rentalId);

        console.log(`[PaymentController] Order created successfully: ${order.id}`);

        // Save order ID to rental record
        rental.orderId = order.id;
        rental.amount = amount;
        await rental.save();

        res.status(200).json({
            orderId: order.id,
            amount: amount,
            keyId: process.env.RAZORPAY_KEY_ID
        });

    } catch (error) {
        console.error('[PaymentController] Error creating order:', error.message);
        res.status(500).json({ error: error.message || 'Internal server error while creating payment order.' });
    }
};


export const verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        console.log(`[PaymentController] Verifying payment for order: ${razorpay_order_id}`);

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ error: 'Missing Razorpay properties' });
        }

        const isValid = verifyRazorpaySignature(
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        );

        const rental = await Rental.findOne({ orderId: razorpay_order_id });
        if (!rental) {
            console.error(`[PaymentController] No rental found associated with order ID: ${razorpay_order_id}`);
            return res.status(404).json({ error: 'Rental not found' });
        }

        if (isValid) {
            console.log(`[PaymentController] Signature Verified. Payment ID: ${razorpay_payment_id}`);
            rental.paymentStatus = 'paid';
            rental.paymentId = razorpay_payment_id;
            rental.status = 'approved';
            await rental.save();

            return res.status(200).json({ message: 'Payment verified successfully and rental approved.' });
        } else {
            console.error(`[PaymentController] Signature Verification Failed for Payment ID: ${razorpay_payment_id}`);
            rental.paymentStatus = 'failed';
            await rental.save();

            return res.status(400).json({ error: 'Invalid payment signature' });
        }
    } catch (error) {
        console.error('[PaymentController] Error verifying payment:', error);
        res.status(500).json({ error: 'Internal server error while verifying payment.' });
    }
};
