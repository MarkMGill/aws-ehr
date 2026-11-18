import type { Response } from 'express';
import type { AuthenticatedRequest } from '../../middleware/require-auth.js';

export function me(req: AuthenticatedRequest, res: Response) {
  const { patientId, ...profile } = req.user!;
  res.json(profile);
}
