import express from 'express';
import { getConversations, getMessages, sendMessage, getUnreadCount } from '../controllers/messaging';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

router.get('/conversations', authenticateToken, getConversations);
router.get('/conversations/:conversationId', authenticateToken, getMessages);
router.post('/send', authenticateToken, sendMessage);
router.get('/unread', authenticateToken, getUnreadCount);

export default router;
