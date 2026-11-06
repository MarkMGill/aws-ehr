import dotenv from 'dotenv';

dotenv.config({ path: process.cwd() + '\\.env' });

export const config = {
  port: Number(process.env.PORT ?? 4000),
  databaseUrl:
    process.env.DATABASE_URL ?? 'postgresql://ehr:ehrpass@localhost:5432/ehr',
  jwtSecret: process.env.JWT_SECRET ?? 'local-development-secret',
  apiBaseUrl: process.env.API_BASE_URL ?? 'http://localhost:4000/api',
};
