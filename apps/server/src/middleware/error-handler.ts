import type { ErrorRequestHandler } from 'express';
import { BaseError } from 'sequelize';

export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export const errorHandler: ErrorRequestHandler = (error: unknown, _req, res, _next) => {
  if (error instanceof HttpError) { res.status(error.status).json({ message: error.message }); return; }
  if (error instanceof BaseError) { res.status(503).json({ message: 'Database unavailable. Please try again later.' }); return; }
  const status = error && typeof error === 'object' && 'status' in error ? error.status : undefined;
  if (status === 400 || status === 413) {
    res.status(status).json({ message: status === 413 ? 'Request body too large.' : 'Invalid request body.' }); return;
  }
  // Error objects can contain SQL, passwords, or patient data.
  console.error('Unexpected API error.');
  res.status(500).json({ message: 'Unexpected server error.' });
};
