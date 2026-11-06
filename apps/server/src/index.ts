import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { z } from 'zod';
import { hashPassword, signToken, verifyPassword } from './auth.js';
import { config } from './config.js';
import { query } from './db.js';
import { mockBilling, mockClinicalNotes, mockDocuments, mockPatients, mockPrescriptions, mockUsers } from './mockData.js';
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

const authSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  role: z.enum(['patient', 'clinician', 'admin']).optional(),
});

const normalizeUser = (row: any) => ({
  id: row.id,
  email: row.email,
  passwordHash: row.password_hash ?? row.passwordHash,
  firstName: row.first_name ?? row.firstName,
  lastName: row.last_name ?? row.lastName,
  role: row.role,
  createdAt: row.created_at ?? row.createdAt,
});

const getDbUser = async (email: string) => {
  try {
    const result = await query('SELECT * FROM users WHERE email = $1 LIMIT 1', [email]);
    return result.rows[0] ? normalizeUser(result.rows[0]) : null;
  } catch (error) {
    return null;
  }
};

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'aws-ehr-api' });
});

app.post('/api/auth/login', async (req, res) => {
  const parsed = authSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  const { email, password } = parsed.data;

  try {
    const userRow = await getDbUser(email);
    if (userRow) {
      const valid = await verifyPassword(password, userRow.passwordHash ?? '');
      if (!valid) {
        return res.status(401).json({ message: 'Incorrect email or password.' });
      }

      const token = signToken({ sub: userRow.id, email: userRow.email, role: userRow.role });
      return res.json({
        token,
        user: {
          id: userRow.id,
          email: userRow.email,
          firstName: userRow.firstName,
          lastName: userRow.lastName,
          role: userRow.role,
        },
      });
    }
  } catch (error) {
    // fall through to mock-user logic below
  }

  const fallbackUser = mockUsers.find((user) => user.email === email);
  if (!fallbackUser) {
    return res.status(401).json({ message: 'Incorrect email or password.' });
  }

  const valid = await verifyPassword(password, fallbackUser.passwordHash);
  if (!valid) {
    return res.status(401).json({ message: 'Incorrect email or password.' });
  }

  const token = signToken({ sub: fallbackUser.id, email: fallbackUser.email, role: fallbackUser.role });

  return res.json({
    token,
    user: {
      id: fallbackUser.id,
      email: fallbackUser.email,
      firstName: fallbackUser.firstName,
      lastName: fallbackUser.lastName,
      role: fallbackUser.role,
    },
  });
});

app.post('/api/auth/register', async (req, res) => {
  const parsed = authSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Valid user details are required.' });
  }

  const { email, password, firstName = 'New', lastName = 'User', role = 'patient' } = parsed.data;

  try {
    const existing = await getDbUser(email);
    if (existing) {
      return res.status(409).json({ message: 'A user already exists with that email.' });
    }

    const userId = `u-${Date.now()}`;
    const passwordHash = await hashPassword(password);
    await query(
      `INSERT INTO users (id, email, password_hash, first_name, last_name, role) VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, email, passwordHash, firstName, lastName, role],
    );

    const token = signToken({ sub: userId, email, role });
    return res.status(201).json({
      token,
      user: { id: userId, email, firstName, lastName, role },
    });
  } catch (error) {
    const mockEntry = {
      id: `u-${Date.now()}`,
      email,
      passwordHash: await hashPassword(password),
      firstName,
      lastName,
      role,
      createdAt: new Date().toISOString(),
    };
    mockUsers.push(mockEntry);
    const token = signToken({ sub: mockEntry.id, email, role });
    return res.status(201).json({
      token,
      user: { id: mockEntry.id, email, firstName, lastName, role },
    });
  }
});

app.get('/api/me', requireAuth, async (req: AuthenticatedRequest, res) => {
  const user = mockUsers.find((entry) => entry.id === req.user?.sub);
  if (user) {
    return res.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    });
  }

  try {
    const result = await query('SELECT * FROM users WHERE id = $1 LIMIT 1', [req.user?.sub]);
    const row: any = result.rows[0];
    return res.json(
      row
        ? {
            id: row.id,
            email: row.email,
            firstName: row.first_name,
            lastName: row.last_name,
            role: row.role,
          }
        : { message: 'User not found' },
    );
  } catch {
    return res.status(404).json({ message: 'User not found' });
  }
});

app.get('/api/dashboard', requireAuth, async (_req, res) => {
  const summary = {
    totalPatients: mockPatients.length,
    activePrescriptions: mockPrescriptions.filter((item) => item.status === 'active').length,
    pendingBills: mockBilling.filter((item) => item.status === 'pending').length,
    recentNotes: mockClinicalNotes.length,
    recentPatients: mockPatients.slice(0, 3),
  };

  res.json(summary);
});

app.get('/api/patients', requireAuth, requireRole(['clinician', 'admin', 'patient']), async (_req, res) => {
  try {
    const result = await query('SELECT * FROM patients ORDER BY last_name ASC');
    if (result.rows.length > 0) {
      return res.json(
        result.rows.map((row: any) => ({ ...row, id: row.id, firstName: row.first_name, lastName: row.last_name })),
      );
    }
  } catch (error) {
    // Ignore DB errors and return seed data.
  }

  res.json(mockPatients);
});

app.get('/api/clinical-notes', requireAuth, requireRole(['clinician', 'admin', 'patient']), async (_req, res) => {
  try {
    const result = await query('SELECT * FROM clinical_notes ORDER BY created_at DESC');
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

  res.json(mockClinicalNotes);
});

app.get('/api/prescriptions', requireAuth, requireRole(['clinician', 'admin', 'patient']), async (_req, res) => {
  try {
    const result = await query('SELECT * FROM prescriptions ORDER BY created_at DESC');
    if (result.rows.length > 0) {
      return res.json(result.rows.map((row: any) => ({ ...row, patientId: row.patient_id, prescriber: row.prescriber_name })));
    }
  } catch (error) {
    // Ignore DB errors and return seed data.
  }

  res.json(mockPrescriptions);
});

app.get('/api/billing', requireAuth, requireRole(['clinician', 'admin', 'patient']), async (_req, res) => {
  try {
    const result = await query('SELECT * FROM billing_records ORDER BY due_date ASC');
    if (result.rows.length > 0) {
      return res.json(result.rows.map((row: any) => ({ ...row, patientId: row.patient_id, dueDate: row.due_date })));
    }
  } catch (error) {
    // Ignore DB errors and return seed data.
  }

  res.json(mockBilling);
});

app.get('/api/documents', requireAuth, requireRole(['clinician', 'admin', 'patient']), async (_req, res) => {
  try {
    const result = await query('SELECT * FROM documents ORDER BY uploaded_at DESC');
    if (result.rows.length > 0) {
      return res.json(result.rows.map((row: any) => ({ ...row, patientId: row.patient_id, uploadedAt: row.uploaded_at })));
    }
  } catch (error) {
    // Ignore DB errors and return seed data.
  }

  res.json(mockDocuments);
});

app.get('/api/portal', requireAuth, requireRole(['patient', 'clinician', 'admin']), (_req, res) => {
  res.json({
    patientName: 'Olivia Patel',
    lastVisit: '2025-04-02',
    upcomingAppointments: [
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
