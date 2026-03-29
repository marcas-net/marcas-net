import express from 'express';
import { getProfile, updateProfile, changePassword, getUserById, listUsers } from '../controllers/users';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

router.get('/me', authenticateToken, getProfile);
router.get('/profile', authenticateToken, getProfile);
router.get('/list', listUsers);
router.get('/:id', getUserById);
router.put('/profile', authenticateToken, updateProfile);
router.put('/password', authenticateToken, changePassword);

export default router;