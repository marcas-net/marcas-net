import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { getProfile, updateProfile, changePassword, getUserById, listUsers, getUserPosts, uploadAvatar, uploadCoverImage } from '../controllers/users';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Avatar upload config
const mediaDir = path.join(__dirname, '../../uploads/media');
if (!fs.existsSync(mediaDir)) fs.mkdirSync(mediaDir, { recursive: true });

const avatarStorage = multer.diskStorage({
  destination: mediaDir,
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `avatar-${unique}${ext}`);
  },
});

const avatarUpload = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|gif|webp)$/i;
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowed.test(path.extname(file.originalname)) || allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (jpg, png, gif, webp) are allowed'));
    }
  },
});

router.get('/', listUsers);
router.get('/me', authenticateToken, getProfile);
router.get('/profile', authenticateToken, getProfile);
router.get('/list', listUsers);
router.get('/:id', getUserById);
router.get('/:id/posts', getUserPosts);
router.put('/profile', authenticateToken, updateProfile);
router.put('/password', authenticateToken, changePassword);
router.post('/avatar', authenticateToken, avatarUpload.single('avatar'), uploadAvatar);
router.post('/cover', authenticateToken, avatarUpload.single('cover'), uploadCoverImage);

export default router;