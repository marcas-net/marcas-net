import express from 'express';
import {
  getPosts, getPostById, createPost, deletePost,
  addComment, deleteComment,
  toggleLike,
  followUser, followOrg, getFollowStatus, getFollowCounts,
} from '../controllers/feed';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Posts
router.get('/', authenticateToken, getPosts);
router.get('/:id', authenticateToken, getPostById);
router.post('/', authenticateToken, createPost);
router.delete('/:id', authenticateToken, deletePost);

// Comments
router.post('/:id/comments', authenticateToken, addComment);
router.delete('/:id/comments/:commentId', authenticateToken, deleteComment);

// Likes
router.post('/:id/like', authenticateToken, toggleLike);

// Follows
router.get('/social/follow-status', authenticateToken, getFollowStatus);
router.get('/social/follow-counts', getFollowCounts);
router.post('/social/follow/user/:userId', authenticateToken, followUser);
router.post('/social/follow/org/:orgId', authenticateToken, followOrg);

export default router;
