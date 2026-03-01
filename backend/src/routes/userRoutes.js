import express from 'express';
import { requireAuth } from '@clerk/express';
import syncUser from '../middleware/syncUser.js';
import requireRole from '../middleware/roleMiddleware.js';
import { getMe, updateUserRole, updateWelcome } from '../controllers/userController.js';

const router = express.Router();

// GET /api/users/me – any authenticated user
router.get('/me', requireAuth(), syncUser, getMe);

// POST /api/users/welcome - marks welcome message as seen
router.post('/welcome', requireAuth(), syncUser, updateWelcome);

// PATCH /api/users/role – admin only
router.patch('/role', requireAuth(), syncUser, requireRole('admin'), updateUserRole);

export default router;
