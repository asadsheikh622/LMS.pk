import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserSession } from '../../types.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'lms-secure-jwt-salt-secret-key-2026';
const SALT_ROUNDS = 10;

export async function hashPassword(plainText: string): Promise<string> {
  return await bcrypt.hash(plainText, SALT_ROUNDS);
}

export async function comparePassword(plainText: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(plainText, hash);
}

export function signSessionToken(session: UserSession): string {
  return jwt.sign(session, JWT_SECRET, {
    expiresIn: '7d',
  });
}

export function verifySessionToken(token: string): UserSession | null {
  try {
    return jwt.verify(token, JWT_SECRET) as UserSession;
  } catch (err) {
    return null;
  }
}
