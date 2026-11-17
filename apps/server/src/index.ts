import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { config } from './config.js';
import { query } from './db.js';
import { mockBilling, mockClinicalNotes, mockDocuments, mockPatients, mockPrescriptions } from './mockData.js';
import { scopeRecords } from './permissions.js';
import { requireAuth, requireRole, type AuthenticatedRequest } from './middleware.js';

const app = express();

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }),
);
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'aws-ehr-api' });
});

// Passwords and registration are handled by Cognito, never by demo fallback.
app.post(['/api/auth/login', '/api/auth/register'], (_req, res) => {
  res.status(410).json({ message: 'Use Cognito sign-in at http://localhost:3000/login.' });
});

app.get('/api/me', requireAuth, (req: AuthenticatedRequest, res) => {
  const { patientId, ...user } = req.user!;
  res.json(user);
});

app.get('/api/dashboard', requireAuth, async (req: AuthenticatedRequest, res) => {
  const summary = {
    totalPatients: scopeRecords(req.user!, mockPatients, (item) => item.id).length,
    activePrescriptions: scopeRecords(req.user!, mockPrescriptions, (item) => item.patientId).filter((item) => item.status === 'active').length,
    pendingBills: scopeRecords(req.user!, mockBilling, (item) => item.patientId).filter((item) => item.status === 'pending').length,
    recentNotes: scopeRecords(req.user!, mockClinicalNotes, (item) => item.patientId).length,
    recentPatients: scopeRecords(req.user!, mockPatients, (item) => item.id).slice(0, 3),
  };

  res.json(summary);
});

app.get('/api/patients', requireAuth, requireRole(['clinician', 'admin', 'patient']), async (req: AuthenticatedRequest, res) => {
  try {
    const result = await query('SELECT * FROM patients WHERE ($1::text IS NULL OR id = $1) ORDER BY last_name ASC', [req.user!.role === 'patient' ? req.user!.patientId : null]);
    if (result.rows.length > 0) {
      return res.json(
        result.rows.map((row: any) => ({ ...row, id: row.id, firstName: row.first_name, lastName: row.last_name })),
      );
    }
  } catch (error) {
    // Ignore DB errors and return seed data.
  }

  res.json(scopeRecords(req.user!, mockPatients, (item) => item.id));
});

app.get('/api/clinical-notes', requireAuth, requireRole(['clinician', 'admin', 'patient']), async (req: AuthenticatedRequest, res) => {
  try {
    const result = await query('SELECT * FROM clinical_notes WHERE ($1::text IS NULL OR patient_id = $1) ORDER BY created_at DESC', [req.user!.role === 'patient' ? req.user!.patientId : null]);
    if (result.rows.length > 0) {
      return res.json(
        result.rows.map((row: any) => ({
          id: row.id,
          patientId: row.patient_id,
          authorId: row.author_id,
          title: row.title,
          body: row.body,
          createdAt: row.created_at,
        })),
      );
    }
  } catch (error) {
    // Ignore DB errors and return seed data.
  }

  res.json(scopeRecords(req.user!, mockClinicalNotes, (item) => item.patientId));
});

app.get('/api/prescriptions', requireAuth, requireRole(['clinician', 'admin', 'patient']), async (req: AuthenticatedRequest, res) => {
  try {
    const result = await query('SELECT * FROM prescriptions WHERE ($1::text IS NULL OR patient_id = $1) ORDER BY created_at DESC', [req.user!.role === 'patient' ? req.user!.patientId : null]);
    if (result.rows.length > 0) {
      return res.json(result.rows.map((row: any) => ({ ...row, patientId: row.patient_id, prescriber: row.prescriber_name })));
    }
  } catch (error) {
    // Ignore DB errors and return seed data.
  }

  res.json(scopeRecords(req.user!, mockPrescriptions, (item) => item.patientId));
});

app.get('/api/billing', requireAuth, requireRole(['clinician', 'admin', 'patient']), async (req: AuthenticatedRequest, res) => {
  try {
    const result = await query('SELECT * FROM billing_records WHERE ($1::text IS NULL OR patient_id = $1) ORDER BY due_date ASC', [req.user!.role === 'patient' ? req.user!.patientId : null]);
    if (result.rows.length > 0) {
      return res.json(result.rows.map((row: any) => ({ ...row, patientId: row.patient_id, dueDate: row.due_date })));
    }
  } catch (error) {
    // Ignore DB errors and return seed data.
  }

  res.json(scopeRecords(req.user!, mockBilling, (item) => item.patientId));
});

app.get('/api/documents', requireAuth, requireRole(['clinician', 'admin', 'patient']), async (req: AuthenticatedRequest, res) => {
  try {
    const result = await query('SELECT * FROM documents WHERE ($1::text IS NULL OR patient_id = $1) ORDER BY uploaded_at DESC', [req.user!.role === 'patient' ? req.user!.patientId : null]);
    if (result.rows.length > 0) {
      return res.json(result.rows.map((row: any) => ({ ...row, patientId: row.patient_id, uploadedAt: row.uploaded_at })));
    }
  } catch (error) {
    // Ignore DB errors and return seed data.
  }

  res.json(scopeRecords(req.user!, mockDocuments, (item) => item.patientId));
});

app.get('/api/portal', requireAuth, requireRole(['patient', 'clinician', 'admin']), (req: AuthenticatedRequest, res) => {
  const patient = mockPatients.find((item) => item.id === (req.user?.patientId ?? 'p-001'));
  res.json({
    patientName: patient ? `${patient.firstName} ${patient.lastName}` : 'Patient',
    lastVisit: patient?.id === 'p-001' ? '2025-04-02' : 'Not available',
    upcomingAppointments: patient?.id !== 'p-001' ? [] : [
      { time: '2025-04-18 09:30', provider: 'Dr. Singh', type: 'Follow-up visit' },
      { time: '2025-04-23 14:15', provider: 'Pharmacist', type: 'Medication review' },
    ],
  });
});

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ message: 'Unexpected server error.' });
});

app.listen(config.port, () => {
  console.log(`AWS EHR API running on http://localhost:${config.port}`);
});
