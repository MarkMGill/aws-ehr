import { migrate } from './migrator.js';
import { sequelize } from './sequelize.js';
import { seedDemoData } from './seeders/demo.js';

try {
  await migrate();
  await seedDemoData();
  console.log('Database seed complete.');
} catch {
  console.error('Database seed failed. Check database connectivity and schema compatibility.');
  process.exitCode = 1;
} finally {
  await sequelize.close();
}
