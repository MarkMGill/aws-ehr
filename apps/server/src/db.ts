import pg from 'pg';
import { config } from './config.js';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: config.databaseUrl,
  ssl: config.databaseUrl.includes('aws') ? { rejectUnauthorized: false } : undefined,
});

export async function query(text: string, params: unknown[] = []) {
  return pool.query(text, params);
}
