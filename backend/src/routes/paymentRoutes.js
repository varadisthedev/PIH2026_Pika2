import express from 'express';
import { requireAuth } from '@clerk/express';
import syncUser from '../middleware/syncUser.js';
import { createOrder, verifyPayment } from '../controllers/paymentController.js';

const router = express.Router();

router.post('/create-order', requireAuth(), syncUser, createOrder);
router.post('/verify', requireAuth(), syncUser, verifyPayment);

export default router;
