-- Additive migration: safe to run against an existing seeded database.
ALTER TABLE users ADD COLUMN IF NOT EXISTS cognito_sub TEXT UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS patient_id TEXT REFERENCES patients(id);

-- Only opaque random IDs reach cookies. Token payloads are encrypted by Next.js.
CREATE TABLE IF NOT EXISTS web_sessions (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL CHECK (kind IN ('login', 'session')),
  payload TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS web_sessions_expiry ON web_sessions (expires_at);
