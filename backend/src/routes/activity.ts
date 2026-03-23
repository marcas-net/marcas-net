import express from 'express';
import { getActivity } from '../controllers/activity';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

router.get('/', authenticateToken, getActivity);

export default router;
