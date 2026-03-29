import express from 'express';
import { getJobs, getJobById, createJob, closeJob } from '../controllers/jobs';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

router.get('/', getJobs);
router.get('/:id', getJobById);
router.post('/', authenticateToken, createJob);
router.patch('/:id/close', authenticateToken, closeJob);

export default router;
