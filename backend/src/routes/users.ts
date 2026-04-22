import express from 'express';
import multer from 'multer';
import path from 'path';
import { getProfile, updateProfile, changePassword, getUserById, listUsers, getUserPosts, uploadAvatar, uploadCoverImage } from '../controllers/users';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Memory storage — images are uploaded to Cloudinary in the controller
const imageUpload = multer({
  storage: multer.memoryStorage(),
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
router.post('/avatar', authenticateToken, imageUpload.single('avatar'), uploadAvatar);
router.post('/cover', authenticateToken, imageUpload.single('cover'), uploadCoverImage);

export default router;
