import express from 'express';
import { getPosts, getPostById, createPost, deletePost } from '../controllers/feed';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

router.get('/', getPosts);
router.get('/:id', getPostById);
router.post('/', authenticateToken, createPost);
router.delete('/:id', authenticateToken, deletePost);

export default router;
