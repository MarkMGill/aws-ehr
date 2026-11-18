import { migrate } from './migrator.js';
import { sequelize } from './sequelize.js';

try {
  const migrations = await migrate();
  console.log(migrations.length ? `Applied: ${migrations.map((migration) => migration.name).join(', ')}` : 'Database migrations are up to date.');
} catch {
  // Sequelize errors can include SQL values. Do not log credentials or record data.
  console.error('Database migration failed. Check database connectivity and schema compatibility.');
  process.exitCode = 1;
} finally {
  await sequelize.close();
}
