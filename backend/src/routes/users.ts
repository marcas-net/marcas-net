import express from 'express';
import { getProfile, updateProfile, changePassword } from '../controllers/users';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

router.get('/me', authenticateToken, getProfile);
router.get('/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, updateProfile);
router.put('/password', authenticateToken, changePassword);

export default router;