import { randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';
import { getPool, getSupabaseAdmin, getServerBackend } from './db';

export interface ServerUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
  status: string;
}

const SESSION_DAYS = 30;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/** Crea una sesión en PostgreSQL y devuelve el token. */
export async function createSession(userId: string): Promise<string> {
  const token = randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await getPool().query(
    'INSERT INTO sessions (token, user_id, expires_at) VALUES ($1, $2, $3)',
    [token, userId, expires.toISOString()]
  );
  return token;
}

export async function destroySession(token: string): Promise<void> {
  await getPool().query('DELETE FROM sessions WHERE token = $1', [token]);
}

function bearerToken(req: Request): string | null {
  const header = req.headers.get('authorization') || '';
  if (!header.toLowerCase().startsWith('bearer ')) return null;
  return header.slice(7).trim() || null;
}

/**
 * Identifica al usuario que hace la petición.
 *  - postgres: token de la tabla sessions
 *  - supabase: access_token de Supabase Auth, verificado con el service role
 */
export async function getUserFromRequest(req: Request): Promise<ServerUser | null> {
  const token = bearerToken(req);
  if (!token) return null;

  const backend = getServerBackend();

  if (backend === 'postgres') {
    const { rows } = await getPool().query(
      `SELECT p.id, p.email, p.full_name, p.role, p.status
         FROM sessions s JOIN profiles p ON p.id = s.user_id
        WHERE s.token = $1 AND s.expires_at > NOW()`,
      [token]
    );
    return rows[0] || null;
  }

  if (backend === 'supabase') {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin.auth.getUser(token);
    if (error || !data.user) return null;
    const { data: profile } = await admin
      .from('profiles')
      .select('id, email, full_name, role, status')
      .eq('id', data.user.id)
      .single();
    return (profile as ServerUser) || null;
  }

  return null;
}

/** Devuelve el usuario si es admin; si no, null. */
export async function requireAdmin(req: Request): Promise<ServerUser | null> {
  const user = await getUserFromRequest(req);
  if (!user || user.role !== 'admin') return null;
  return user;
}
