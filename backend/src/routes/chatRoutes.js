import express from 'express';
import { requireAuth } from '@clerk/express';
import syncUser from '../middleware/syncUser.js';
import { getMyChats, connectChat, sendMessage } from '../controllers/chatController.js';

const router = express.Router();

// All chat routes require authentication & synced user
router.use(requireAuth(), syncUser);

router.get('/', getMyChats);
router.post('/connect', connectChat);
router.post('/:chatId/messages', sendMessage);

export default router;
