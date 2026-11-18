import type { Response } from 'express';
import type { AuthenticatedRequest } from '../../middleware/require-auth.js';
import { getDashboard } from './dashboard.service.js';

export async function show(req: AuthenticatedRequest, res: Response) {
  res.json(await getDashboard(req.user!));
}
