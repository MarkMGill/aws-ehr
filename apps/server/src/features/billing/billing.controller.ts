import type { Response } from 'express';
import type { AuthenticatedRequest } from '../../middleware/require-auth.js';
import { listBillingRecords } from './billing.service.js';

export async function list(req: AuthenticatedRequest, res: Response) {
  res.json(await listBillingRecords(req.user!));
}
