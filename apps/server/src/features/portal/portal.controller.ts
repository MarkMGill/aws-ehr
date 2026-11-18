import type { Response } from 'express';
import type { AuthenticatedRequest } from '../../middleware/require-auth.js';
import { getPortal } from './portal.service.js';

export async function show(req: AuthenticatedRequest, res: Response) { res.json(await getPortal(req.user!)); }
