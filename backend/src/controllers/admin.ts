import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { getAuditLogs } from '../models/activityLog';

export const getAdminAuditLogs = async (req: AuthRequest, res: Response) => {
  try {
    const { userId, action, fromDate, toDate, limit, offset } = req.query;

    const result = await getAuditLogs({
      userId: userId as string | undefined,
      action: action as string | undefined,
      fromDate: fromDate as string | undefined,
      toDate: toDate as string | undefined,
      limit: limit ? parseInt(limit as string, 10) : 50,
      offset: offset ? parseInt(offset as string, 10) : 0,
    });

    res.json(result);
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
