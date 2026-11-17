import type { NextFunction, Request, Response } from 'express';
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { config } from './config.js';
import { query } from './db.js';
import type { UserRole } from './types.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    sub: string;
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    patientId: string | null;
  };
}

const verifier = CognitoJwtVerifier.create({
  userPoolId: config.cognitoUserPoolId,
  clientId: config.cognitoClientId,
  tokenUse: 'access',
});

export function createRequireAuth(
  verify: (token: string) => Promise<{ sub: string }> = (token) => verifier.verify(token),
  lookup: (sub: string) => Promise<Record<string, any> | undefined> = async (sub) =>
    (await query('SELECT * FROM users WHERE cognito_sub = $1', [sub])).rows[0],
) {
  return async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      res.status(401).json({ message: 'Authentication required.' });
      return;
    }
    let sub: string;
    try {
      sub = (await verify(header.slice(7))).sub;
    } catch {
      res.status(401).json({ message: 'Invalid or expired token.' });
      return;
    }
    try {
      const row = await lookup(sub);
      if (!row || !['patient', 'clinician', 'admin'].includes(row.role)) {
        res.status(403).json({ message: 'Your Cognito account has not been linked to an EHR profile. Contact the administrator.' });
        return;
      }
      if (row.role === 'patient' && !row.patient_id) {
        res.status(403).json({ message: 'Your patient profile has not been linked to a chart.' });
        return;
      }
      req.user = {
        sub, id: row.id, email: row.email, firstName: row.first_name,
        lastName: row.last_name, role: row.role, patientId: row.patient_id,
      };
      next();
    } catch {
      res.status(503).json({ message: 'Account lookup unavailable. Check the database and authentication migration.' });
    }
  };
}

export const requireAuth = createRequireAuth();

export function requireRole(role: UserRole | UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const allowed = Array.isArray(role) ? role : [role];
    if (!req.user || !allowed.includes(req.user.role)) {
      res.status(403).json({ message: 'Insufficient permissions.' });
      return;
    }
    next();
  };
}
