import { SignJWT, jwtVerify, type JWTPayload } from 'jose';

export const SESSION_COOKIE_NAME = 'session';
export const SESSION_DURATION = '7d';
export const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 7;

export interface SessionPayload extends JWTPayload {
  username: string;
}

function getSecretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error('SESSION_SECRET nao definido em .env.local');
  }
  return new TextEncoder().encode(secret);
}

export async function encryptSession(username: string) {
  return new SignJWT({ username })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(SESSION_DURATION)
    .sign(getSecretKey());
}

export async function decryptSession(token: string | undefined) {
  if (!token) return null;

  try {
    const { payload } = await jwtVerify<SessionPayload>(token, getSecretKey(), {
      algorithms: ['HS256'],
    });
    return payload;
  } catch {
    return null;
  }
}
