import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import {
  getPosts, getPostById, createPost, deletePost, editPost,
  addComment, deleteComment,
  toggleLike, repostPost, votePoll, getMyNetwork,
  followUser, followOrg, getFollowStatus, getFollowCounts,
} from '../controllers/feed';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// ─── Media upload config ─────────────────────────────────
const mediaDir = path.join(__dirname, '../../uploads/media');
if (!fs.existsSync(mediaDir)) fs.mkdirSync(mediaDir, { recursive: true });

const storage = multer.diskStorage({
  destination: mediaDir,
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB for videos
  fileFilter: (_req, file, cb) => {
    const allowedImage = /\.(jpg|jpeg|png|gif|webp)$/i;
    const allowedVideo = /\.(mp4|webm|mov)$/i;
    const ext = path.extname(file.originalname);
    if (allowedImage.test(ext) || allowedVideo.test(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only images (jpg, png, gif, webp) and videos (mp4, webm, mov) are allowed'));
    }
  },
});

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
