import type { NextFunction, Request, Response } from 'express';
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { config } from '../config/env.js';
import { findUserByCognitoSub } from '../features/users/user.service.js';
import type { AppUser, UserProfile } from '../features/users/user.types.js';

export interface AuthenticatedRequest extends Request { user?: AppUser }

const verifier = CognitoJwtVerifier.create({
  userPoolId: config.cognitoUserPoolId, clientId: config.cognitoClientId, tokenUse: 'access',
});

export function createRequireAuth(
  verify: (token: string) => Promise<{ sub: string }> = (token) => verifier.verify(token),
  lookup: (sub: string) => Promise<UserProfile | null> = findUserByCognitoSub,
) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) { res.status(401).json({ message: 'Authentication required.' }); return; }
    let sub: string;
    try { sub = (await verify(header.slice(7))).sub; }
    catch { res.status(401).json({ message: 'Invalid or expired token.' }); return; }
    try {
      const profile = await lookup(sub);
      if (!profile || !['patient', 'clinician', 'admin'].includes(profile.role)) {
        res.status(403).json({ message: 'Your Cognito account has not been linked to an EHR profile. Contact the administrator.' }); return;
      }
      if (profile.role === 'patient' && !profile.patientId) {
        res.status(403).json({ message: 'Your patient profile has not been linked to a chart.' }); return;
      }
      req.user = {
        sub, id: profile.id, email: profile.email, firstName: profile.firstName,
        lastName: profile.lastName, role: profile.role, patientId: profile.patientId,
      };
    } catch {
      res.status(503).json({ message: 'Account lookup unavailable. Check the database and authentication migration.' }); return;
    }
    next();
  };
}

export const requireAuth = createRequireAuth();
