import express from 'express';
import { requireAuth } from '@clerk/express';
import syncUser from '../middleware/syncUser.js';
import { getMyNotifications, markOneRead, markAllRead, deleteNotification } from '../controllers/notificationController.js';

const router = express.Router();

router.use(requireAuth(), syncUser);

router.get('/', getMyNotifications);
router.patch('/read-all', markAllRead);
router.patch('/:id/read', markOneRead);
router.delete('/:id', deleteNotification);

export default router;
