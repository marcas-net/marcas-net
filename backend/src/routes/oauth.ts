import express from 'express';
import {
  googleRedirect,
  googleCallback,
  githubRedirect,
  githubCallback,
  getOAuthProviders,
} from '../controllers/oauth';

const router = express.Router();

// Which providers are enabled
router.get('/providers', getOAuthProviders);

// Google OAuth
router.get('/google', googleRedirect);
router.get('/google/callback', googleCallback);

// GitHub OAuth
router.get('/github', githubRedirect);
router.get('/github/callback', githubCallback);

export default router;
