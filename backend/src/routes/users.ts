import express from 'express';
import { getProfile } from '../controllers/users';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

router.get('/me', authenticateToken, getProfile);
router.get('/profile', authenticateToken, getProfile); // alias

export default router;