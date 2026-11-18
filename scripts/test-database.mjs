// Real PostgreSQL tests, isolated from the developer's EHR database.
import { Client } from 'pg';
import dotenv from 'dotenv';
import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
dotenv.config({ path: join(root, 'apps/server/.env') });
const url = new URL(process.env.TEST_DATABASE_ADMIN_URL ?? process.env.DATABASE_URL ?? 'postgresql://ehr:ehrpass@localhost:5432/ehr');
if (!['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) {
  throw new Error('Integration tests require local PostgreSQL; refusing to create databases on a remote host.');
}
const admin = new Client({ connectionString: url.href, connectionTimeoutMillis:3000 });
try {
  await admin.connect();
  for (const scenario of ['fresh', 'legacy']) {
    const name = `ehr_test_${process.pid}_${randomBytes(4).toString('hex')}`;
    await admin.query(`CREATE DATABASE "${name}"`);
    const testUrl = new URL(url);
    testUrl.pathname = `/${name}`;
    try {
      const status = await new Promise((resolve, reject) => {
        const child = spawn(process.execPath, ['--import', 'tsx', '--test', 'apps/server/tests/database.integration.test.ts'], {
          cwd: root, stdio: 'inherit', env: { ...process.env, NODE_ENV: 'test', TEST_SCENARIO: scenario, DATABASE_URL: testUrl.href },
        });
        child.once('error', reject);
        child.once('exit', resolve);
      });
      if (status !== 0) throw new Error(`Database integration tests failed (${scenario}).`);
    } finally {
      // The name is generated here, never sourced from DATABASE_URL or user input.
      await admin.query(`DROP DATABASE "${name}" WITH (FORCE)`);
    }
  }
} catch (error) {
  console.error(error?.code ? `Local database test setup failed (${error.code}). Start PostgreSQL and retry.` : error.message);
  process.exitCode = 1;
} finally { await admin.end(); }
