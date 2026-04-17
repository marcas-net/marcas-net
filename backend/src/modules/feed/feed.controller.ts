import { Request, Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { getPersonalizedFeed, logFeedEvent, invalidateFeedCache } from './feed.service';
import { FEED_CONFIG } from './feed.types';

function getBaseUrl(req: Request) {
  const proto = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:5000';
  return `${proto}://${host}`;
}

// GET /api/feed/ranked
export const getRankedFeed = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.id as string;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(
      FEED_CONFIG.MAX_PAGE_SIZE,
      Math.max(1, parseInt(req.query.limit as string) || FEED_CONFIG.DEFAULT_PAGE_SIZE)
    );

    const sessionSignals: { recentSearches?: string[] } = {};
    if (req.query.searches) {
      sessionSignals.recentSearches = (req.query.searches as string).split(',').slice(0, 10);
    }

    const baseUrl = getBaseUrl(req);
    const result = await getPersonalizedFeed(userId, page, limit, baseUrl, sessionSignals);

    res.json(result);
  } catch (error) {
    console.error('Ranked feed error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/feed/event
export const logEvent = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.id as string;
    const { postId, action } = req.body;

    if (!postId || !action) {
      return res.status(400).json({ error: 'postId and action are required' });
    }

    const validActions = ['VIEW', 'CLICK', 'LIKE', 'COMMENT', 'HIDE', 'SHARE'];
    if (!validActions.includes(action)) {
      return res.status(400).json({ error: 'Invalid action' });
    }

    await logFeedEvent(userId, postId, action);
    res.json({ success: true });
  } catch (error) {
    console.error('Log feed event error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Utility: Call after creating post, liking, following, etc.
export { invalidateFeedCache };
