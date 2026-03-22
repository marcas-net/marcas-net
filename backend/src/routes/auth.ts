import express from 'express';
import { register, login, getMe } from '../controllers/auth';
import { authenticateToken } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { registerSchema, loginSchema } from '../schemas/auth';

const router = express.Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.get('/me', authenticateToken, getMe);

export default router;