import Razorpay from 'razorpay';
import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export const createRazorpayOrder = async (amount, receipt) => {
    const options = {
        amount: Math.round(amount * 100), // convert to paise
        currency: 'INR',
        receipt: receipt.toString(),
    };
    try {
        const order = await razorpay.orders.create(options);
        return order;
    } catch (error) {
        throw new Error('Failed to create Razorpay order: ' + error.message);
    }
};

export const verifyRazorpaySignature = (orderId, paymentId, signature) => {
    const secret = process.env.RAZORPAY_KEY_SECRET;
    const generatedSignature = crypto
        .createHmac('sha256', secret)
        .update(orderId + '|' + paymentId)
        .digest('hex');

    return generatedSignature === signature;
};
