import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { getAppDb } from '@/lib/db/app';
import { RowDataPacket } from 'mysql2/promise';

const SESSION_COOKIE = 'db_manager_session';
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

function getSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error('SESSION_SECRET is not set');
  }
  return new TextEncoder().encode(secret);
}

export async function createSession(userId: number): Promise<string> {
  const secret = getSecret();
  const expiresAt = new Date(Date.now() + SESSION_DURATION);

  const token = await new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret);

  // Store in database
  const db = await getAppDb();
  await db.execute(
    'INSERT INTO sessions (user_id, token, expires_at) VALUES (?, ?, ?)',
    [userId, token, expiresAt]
  );

  // Set cookie
  const cookieStore = cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION / 1000,
    path: '/',
  });

  return token;
}

export async function validateSession(): Promise<{ userId: number } | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) return null;

  try {
    const secret = getSecret();
    const { payload } = await jwtVerify(token, secret, {
      clockTolerance: 60,
    });

    const userId = payload.userId as number;
    if (!userId) return null;

    // Verify session exists in database and is not expired
    const db = await getAppDb();
    const [rows] = await db.execute<RowDataPacket[]>(
      'SELECT id FROM sessions WHERE token = ? AND expires_at > NOW()',
      [token]
    );

    if (rows.length === 0) {
      // Clean up expired session cookie
      cookieStore.delete(SESSION_COOKIE);
      return null;
    }

    return { userId };
  } catch {
    return null;
  }
}

export async function destroySession(): Promise<void> {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    const db = await getAppDb();
    await db.execute('DELETE FROM sessions WHERE token = ?', [token]);
  }

  cookieStore.delete(SESSION_COOKIE);
}

export async function getCurrentUser() {
  const session = await validateSession();
  if (!session) return null;

  const db = await getAppDb();
  const [rows] = await db.execute<RowDataPacket[]>(
    'SELECT id, name, email, created_at, updated_at FROM users WHERE id = ?',
    [session.userId]
  );

  if (rows.length === 0) return null;
  return rows[0] as { id: number; name: string; email: string; created_at: string; updated_at: string };
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}
