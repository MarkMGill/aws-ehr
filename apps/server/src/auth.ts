import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from './config.js';
import type { AuthTokenPayload, UserRole } from './types.js';

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

export function signToken(payload: AuthTokenPayload) {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: '8h' });
}

export function verifyToken(token: string) {
  return jwt.verify(token, config.jwtSecret) as AuthTokenPayload;
}

export function isAllowedRole(role: string): role is UserRole {
  return role === 'patient' || role === 'clinician' || role === 'admin';
}
