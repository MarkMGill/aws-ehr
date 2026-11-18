import cors from 'cors';
import express, { Router, type RequestHandler } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { requireAuth } from './middleware/require-auth.js';
import { requireRole } from './middleware/require-role.js';
import { errorHandler } from './middleware/error-handler.js';
import { router as users } from './features/users/user.routes.js';
import { router as patients } from './features/patients/patient.routes.js';
import { router as notes } from './features/clinical-notes/clinical-note.routes.js';
import { router as prescriptions } from './features/prescriptions/prescription.routes.js';
import { router as billing } from './features/billing/billing.routes.js';
import { router as documents } from './features/documents/document.routes.js';
import { router as dashboard } from './features/dashboard/dashboard.routes.js';
import { router as portal } from './features/portal/portal.routes.js';

export function createApp({ authenticate = requireAuth }: { authenticate?: RequestHandler } = {}) {
  const app = express();
  app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 200, standardHeaders: true, legacyHeaders: false }));
  app.get('/health', (_req, res) => { res.json({ status: 'ok', service: 'aws-ehr-api' }); });
  app.post(['/api/auth/login', '/api/auth/register'], (_req, res) => {
    res.status(410).json({ message: 'Use Cognito sign-in at http://localhost:3000/login.' });
  });

  // All feature routes share the same verified-identity boundary. There is no
  // request header, environment flag, or production route that bypasses it.
  const api = Router();
  api.use(authenticate, requireRole(['patient', 'clinician', 'admin']));
  api.use(users);
  api.use('/patients', patients);
  api.use('/clinical-notes', notes);
  api.use('/prescriptions', prescriptions);
  api.use('/billing', billing);
  api.use('/documents', documents);
  api.use('/dashboard', dashboard);
  api.use('/portal', portal);
  app.use('/api', api);
  app.use((_req, res) => { res.status(404).json({ message: 'Not found.' }); });
  app.use(errorHandler);
  return app;
}
