import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('Missing JWT_SECRET environment variable in production.');
}
const JWT_SECRET_FALLBACK = JWT_SECRET || 'fallback-secret-for-dev-only-change-this';

/**
 * Generates an HTTP-Only cookie with a JWT token
 */
export async function createSession(user) {
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET_FALLBACK,
    { expiresIn: '1d' }
  );

  // Use next/headers to set the cookie
  cookies().set('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24, // 1 day
    path: '/',
  });
}

/**
 * Decodes the current session token from cookies
 */
export async function getSession() {
  const token = cookies().get('token')?.value;
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET_FALLBACK);
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Removes the session cookie
 */
export async function clearSession() {
  cookies().delete('token');
}
