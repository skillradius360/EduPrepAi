import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies, headers } from 'next/headers';
import { db } from './db';

const JWT_SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || 'eduprep-secret-key-capstone-2026-secure-jwt'
);

export const ACCESS_TOKEN_NAME = 'eduprep_access_token';
export const ACCESS_TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24 * 10;

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

export async function createAccessToken(payload: { userId: string; role: string; email: string }) {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('10d')
    .sign(JWT_SECRET);
  return token;
}

export async function verifyAccessToken(token: string) {
  try {
    const verified = await jwtVerify(token, JWT_SECRET);
    return verified.payload as { userId: string; role: string; email: string };
  } catch {
    return null;
  }
}

function getBearerAccessToken() {
  try {
    const authorization = headers().get('authorization') || '';
    if (!authorization.toLowerCase().startsWith('bearer ')) return null;
    return authorization.slice(7).trim() || null;
  } catch {
    return null;
  }
}

export async function getAccessTokenPayload() {
  const cookieStore = cookies();
  const token = getBearerAccessToken() || cookieStore.get(ACCESS_TOKEN_NAME)?.value;
  if (!token) return null;
  return await verifyAccessToken(token);
}

export async function getCurrentUser() {
  const tokenPayload = await getAccessTokenPayload();
  if (!tokenPayload?.userId) return null;

  const user = await db.user.findUnique({
    where: { id: tokenPayload.userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      institutionType: true,
      class: true,
      board: true,
      degreeMajor: true,
      universityName: true,
      semester: true,
      createdAt: true,
    },
  });

  return user;
}
