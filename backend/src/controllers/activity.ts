import { Request, Response } from 'express';
import { getRecentActivity } from '../models/activityLog';

export const getActivity = async (_req: Request, res: Response) => {
  try {
    const activity = await getRecentActivity(20);
    res.json({ activity });
  } catch (error) {
    console.error('Get activity error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
