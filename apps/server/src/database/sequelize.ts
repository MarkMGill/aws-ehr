import { Sequelize } from 'sequelize';
import { config } from '../config/env.js';

export const sequelize = new Sequelize(config.databaseUrl, {
  dialect: 'postgres',
  logging: false,
  pool: { max: 5, min: 0, acquire: 10_000, idle: 10_000 },
  // Uses the driver's normal TLS certificate verification when enabled.
  dialectOptions: config.databaseSsl ? { ssl: { rejectUnauthorized: true } } : {},
  define: { timestamps: false, freezeTableName: true },
});
