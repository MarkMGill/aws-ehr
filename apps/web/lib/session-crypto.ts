import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

function key() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error('Set SESSION_SECRET to at least 32 random characters.');
  return createHash('sha256').update(secret).digest();
}

export function seal(value: unknown) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key(), iv);
  const data = Buffer.concat([cipher.update(JSON.stringify(value), 'utf8'), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), data]).toString('base64url');
}

export function unseal<T>(value: string): T {
  const data = Buffer.from(value, 'base64url');
  const decipher = createDecipheriv('aes-256-gcm', key(), data.subarray(0, 12));
  decipher.setAuthTag(data.subarray(12, 28));
  return JSON.parse(Buffer.concat([decipher.update(data.subarray(28)), decipher.final()]).toString('utf8'));
}

export function sessionId() { return randomBytes(32).toString('base64url'); }
export function hashId(id: string) { return createHash('sha256').update(id).digest('hex'); }
