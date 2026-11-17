import * as oidc from 'openid-client';

export function authConfig() {
  const origin = process.env.APP_URL ?? 'http://localhost:3000';
  const issuer = process.env.COGNITO_ISSUER ?? 'https://cognito-idp.us-east-2.amazonaws.com/us-east-2_mFzgDiirM';
  const clientId = process.env.COGNITO_CLIENT_ID ?? '6k2due58lgrstqapb93q2rpcsf';
  const secret = process.env.COGNITO_CLIENT_SECRET;
  if (!secret || secret.startsWith('<')) throw new Error('Set COGNITO_CLIENT_SECRET in apps/web/.env.local.');
  const domain = process.env.COGNITO_DOMAIN;
  if (!domain || !domain.startsWith('https://')) throw new Error('Set COGNITO_DOMAIN to your HTTPS Cognito login domain.');
  if (process.env.NODE_ENV === 'production' && !origin.startsWith('https://')) {
    throw new Error('APP_URL must use HTTPS in production.');
  }
  return { origin: new URL(origin).origin, issuer, clientId, secret, domain: new URL(domain).origin,
    callback: new URL('/api/auth/callback/cognito', origin).href };
}

let discovery: Promise<oidc.Configuration> | undefined;
export function cognitoClient() {
  const config = authConfig();
  discovery ??= oidc.discovery(new URL(config.issuer), config.clientId, {
    client_secret: config.secret,
  }, oidc.ClientSecretBasic(config.secret)).catch((error) => {
    discovery = undefined;
    throw error;
  });
  return discovery;
}
