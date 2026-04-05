import express from 'express';
import { getJobs, getJobById, createJob, closeJob, applyToJob, getJobApplications, getMyApplications } from '../controllers/jobs';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

router.get('/', getJobs);
router.get('/my-applications', authenticateToken, getMyApplications);
router.get('/:id', getJobById);
router.post('/', authenticateToken, createJob);
router.post('/:id/apply', authenticateToken, applyToJob);
router.get('/:id/applications', authenticateToken, getJobApplications);
router.patch('/:id/close', authenticateToken, closeJob);

export default router;
