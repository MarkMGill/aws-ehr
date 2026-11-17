import { pool } from './db.js';

// Explicit administrator action: never link identities by email during login.
const [email, sub, patientId] = process.argv.slice(2);
try {
  if (!email || !sub) throw new Error('Usage: npm run auth:link -- <local-profile-email> <cognito-sub> [patient-id]');
  if (/^(YOUR_|REPLACE_|<)/i.test(sub) || sub.endsWith('>')) {
    throw new Error('Replace the example placeholder with the actual sub attribute from Cognito > Users > your user.');
  }
  const result = await pool.query(
    `UPDATE users SET cognito_sub = $2, patient_id = $3
     WHERE email = $1 AND (cognito_sub IS NULL OR cognito_sub = $2) RETURNING id, role`,
    [email, sub, patientId ?? null],
  );
  if (result.rowCount !== 1) throw new Error('Profile not found or already linked to another identity.');
  console.log(`Linked profile ${result.rows[0].id} (${result.rows[0].role}).`);
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Link failed.');
  process.exitCode = 1;
} finally {
  await pool.end();
}
