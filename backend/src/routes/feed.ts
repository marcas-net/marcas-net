import express from 'express';
import multer from 'multer';
import path from 'path';
import {
  getPosts, getPostById, createPost, deletePost, editPost,
  addComment, deleteComment,
  toggleLike, repostPost, votePoll, getMyNetwork,
  followUser, followOrg, getFollowStatus, getFollowCounts,
  getFollowingFeed,
} from '../controllers/feed';
import { getRankedFeed, logEvent } from '../modules/feed/feed.controller';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Memory storage — files are uploaded to Cloudinary in the controller
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB for videos
  fileFilter: (_req, file, cb) => {
    const allowedExt = /\.(jpg|jpeg|png|gif|webp|mp4|webm|mov)$/i;
    const allowedMime = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/webm', 'video/quicktime', 'video/x-m4v', 'video/3gpp',
    ];
    if (allowedExt.test(path.extname(file.originalname)) || allowedMime.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only images (jpg, png, gif, webp) and videos (mp4, webm, mov) are allowed'));
    }
  },
});

// Ranked feed, following feed, event logging
router.get('/ranked', authenticateToken, getRankedFeed);
router.get('/following', authenticateToken, getFollowingFeed);
router.post('/event', authenticateToken, logEvent);

// Posts
router.get('/', authenticateToken, getPosts);
router.get('/:id', authenticateToken, getPostById);
router.post('/', authenticateToken, upload.array('media', 10), createPost);
router.delete('/:id', authenticateToken, deletePost);
router.put('/:id', authenticateToken, editPost);
router.post('/:id/repost', authenticateToken, repostPost);

// Polls
router.post('/poll/:optionId/vote', authenticateToken, votePoll);

// Comments
router.post('/:id/comments', authenticateToken, addComment);
router.delete('/:id/comments/:commentId', authenticateToken, deleteComment);

// Likes
router.post('/:id/like', authenticateToken, toggleLike);

// Follows
router.get('/social/follow-status', authenticateToken, getFollowStatus);
router.get('/social/follow-counts', getFollowCounts);
router.get('/social/network', authenticateToken, getMyNetwork);
router.post('/social/follow/user/:userId', authenticateToken, followUser);
router.post('/social/follow/org/:orgId', authenticateToken, followOrg);

export default router;
