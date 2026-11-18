import { Umzug, SequelizeStorage } from 'umzug';
import { sequelize } from './sequelize.js';
import * as initial from './migrations/001-initial-schema.js';
import * as cognito from './migrations/002-cognito-sessions.js';

export const migrator = new Umzug({
  migrations: [
    { name: '001-initial-schema', ...initial },
    { name: '002-cognito-sessions', ...cognito },
  ],
  context: sequelize.getQueryInterface(),
  storage: new SequelizeStorage({ sequelize }),
  logger: undefined,
});

export async function migrate() {
  await sequelize.authenticate();
  return migrator.up();
}
