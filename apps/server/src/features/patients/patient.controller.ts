import type { Response } from 'express';
import type { AuthenticatedRequest } from '../../middleware/require-auth.js';
import { listPatients } from './patient.service.js';

export async function list(req: AuthenticatedRequest, res: Response) {
  res.json(await listPatients(req.user!));
}
