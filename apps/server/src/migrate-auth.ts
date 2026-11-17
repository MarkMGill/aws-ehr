import { readFile } from 'node:fs/promises';
import { pool } from './db.js';

try {
  const sql = await readFile(new URL('../sql/cognito.sql', import.meta.url), 'utf8');
  await pool.query(sql);
  console.log('Cognito database migration complete.');
} catch (error) {
  console.error('Migration failed:', error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
