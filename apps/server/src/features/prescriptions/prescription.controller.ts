import type { Response } from 'express';
import type { AuthenticatedRequest } from '../../middleware/require-auth.js';
import { listPrescriptions } from './prescription.service.js';

export async function list(req: AuthenticatedRequest, res: Response) {
  res.json(await listPrescriptions(req.user!));
}
