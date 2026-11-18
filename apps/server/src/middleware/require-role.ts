import type { NextFunction, Response } from 'express';
import type { UserRole } from '../features/users/user.types.js';
import type { AuthenticatedRequest } from './require-auth.js';

export function requireRole(roles: UserRole | UserRole[]) {
  const allowed = Array.isArray(roles) ? roles : [roles];
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !allowed.includes(req.user.role)) { res.status(403).json({ message: 'Insufficient permissions.' }); return; }
    next();
  };
}
