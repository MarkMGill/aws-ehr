import type { NextFunction, RequestHandler, Response } from 'express';
import type { AuthenticatedRequest } from './require-auth.js';

export function asyncHandler(handler: (req: AuthenticatedRequest, res: Response, next: NextFunction) => unknown): RequestHandler {
  return (req, res, next) => { Promise.resolve().then(() => handler(req, res, next)).catch(next); };
}
