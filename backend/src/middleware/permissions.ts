import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

// Role hierarchy: ADMIN > ORG_ADMIN > LAB > REGULATOR > USER
const roleHierarchy: Record<string, number> = {
  ADMIN: 50,
  ORG_ADMIN: 40,
  LAB: 30,
  REGULATOR: 20,
  USER: 10,
};

export const requireRole = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (req.user.role === 'ADMIN') return next(); // ADMIN always passes

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

export const requireOrgMembership = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (req.user.role === 'ADMIN') return next();

  const orgId = req.params['id'] || req.params['orgId'] || req.body.organizationId;

  if (!orgId || req.user.organizationId !== orgId) {
    return res.status(403).json({ error: 'You must be a member of this organization' });
  }

  next();
};

export const requireOrgRole = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (req.user.role === 'ADMIN') return next();

    const orgId = req.params['id'] || req.params['orgId'] || req.body.organizationId;
    if (!orgId || req.user.organizationId !== orgId) {
      return res.status(403).json({ error: 'You must be a member of this organization' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient organization permissions' });
    }

    next();
  };
};
