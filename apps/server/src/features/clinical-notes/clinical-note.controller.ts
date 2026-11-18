import type { Response } from 'express';
import type { AuthenticatedRequest } from '../../middleware/require-auth.js';
import { listClinicalNotes } from './clinical-note.service.js';

export async function list(req: AuthenticatedRequest, res: Response) {
  res.json(await listClinicalNotes(req.user!));
}
