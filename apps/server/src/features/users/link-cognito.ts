import { sequelize } from '../../database/sequelize.js';
import { linkCognitoUser } from './user.service.js';

const [email, sub, patientId] = process.argv.slice(2);
try {
  if (!email || !sub) throw new Error('Usage: npm run auth:link -- <local-profile-email> <cognito-sub> [patient-id]');
  const user = await linkCognitoUser(email, sub, patientId);
  console.log(`Linked profile ${user.id} (${user.role}).`);
} catch (error) {
  const safeMessages = ['Usage:', 'Provide ', 'Replace the example', 'Profile not found', 'Patient chart not found.'];
  const message = error instanceof Error ? error.message : '';
  console.error(safeMessages.some((prefix) => message.startsWith(prefix)) ? message : 'Account linking failed. Check database connectivity and whether this identity is already linked.');
  process.exitCode = 1;
} finally { await sequelize.close(); }
