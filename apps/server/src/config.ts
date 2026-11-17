import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: Number(process.env.PORT ?? 4000),
  databaseUrl:
    process.env.DATABASE_URL ?? 'postgresql://ehr:ehrpass@localhost:5432/ehr',
  apiBaseUrl: process.env.API_BASE_URL ?? 'http://localhost:4000/api',
  cognitoUserPoolId: process.env.COGNITO_USER_POOL_ID ?? 'us-east-2_mFzgDiirM',
  cognitoClientId: process.env.COGNITO_CLIENT_ID ?? '6k2due58lgrstqapb93q2rpcsf',
};
