import type { Response } from 'express';
import type { AuthenticatedRequest } from '../../middleware/require-auth.js';
import { listDocuments } from './document.service.js';

export async function list(req: AuthenticatedRequest, res: Response) {
  res.json(await listDocuments(req.user!));
}
