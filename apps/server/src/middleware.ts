import type { NextFunction, Request, Response } from 'express';
import { verifyToken } from './auth.js';
import type { UserRole } from './types.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    sub: string;
    email: string;
    role: UserRole;
  };
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  try {
    const token = authHeader.replace('Bearer ', '');
    const payload = verifyToken(token);
    req.user = {
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
    };
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
}

export function requireRole(role: UserRole | UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const allowedRoles = Array.isArray(role) ? role : [role];
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions.' });
    }
    next();
  };
}
