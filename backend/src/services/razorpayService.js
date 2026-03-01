import Razorpay from 'razorpay';
import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

// ── Lazy initializer ──────────────────────────────────────────────────────
// Do NOT instantiate at module level — env vars may not be loaded yet when
// this module is first imported. Create the client on demand instead.
let _razorpay = null;

function getRazorpay() {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
        throw new Error(
            'Razorpay credentials missing in environment. ' +
            'Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your .env file.'
        );
    }

    // Re-create only if keys have changed (e.g. hot-reload scenarios)
    if (!_razorpay || _razorpay.key_id !== keyId) {
        console.log(`[RazorpayService] Initializing client with key: ${keyId.slice(0, 14)}…`);
        _razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
        _razorpay.key_id = keyId; // store for comparison
    }

    return _razorpay;
}

export const createRazorpayOrder = async (amount, receipt) => {
    const rzp = getRazorpay();

    if (!amount || amount <= 0) {
        throw new Error(`Invalid order amount: ${amount}. Amount must be > 0.`);
    }

    const options = {
        amount: Math.round(amount * 100), // convert to paise
        currency: 'INR',
        receipt: String(receipt).slice(0, 40), // Razorpay max 40 chars
    };

    console.log(`[RazorpayService] Creating order — ₹${amount} (${options.amount} paise), receipt: ${options.receipt}`);

    try {
        const order = await rzp.orders.create(options);
        console.log(`[RazorpayService] Order created: ${order.id}`);
        return order;
    } catch (error) {
        // Surface the real Razorpay error message (e.g. "Invalid key_id")
        const detail = error?.error?.description || error?.message || JSON.stringify(error);
        console.error('[RazorpayService] Razorpay API error:', detail);
        throw new Error('Failed to create Razorpay order: ' + detail);
    }
};

export const verifyRazorpaySignature = (orderId, paymentId, signature) => {
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) throw new Error('RAZORPAY_KEY_SECRET not set');

    const generatedSignature = crypto
        .createHmac('sha256', secret)
        .update(orderId + '|' + paymentId)
        .digest('hex');

    return generatedSignature === signature;
};
