import { getPool, getServerBackend } from '@/lib/server/db';
import { verifyPassword, createSession } from '@/lib/server/auth';

export async function POST(request: Request) {
  if (getServerBackend() !== 'postgres') {
    return Response.json(
      { error: 'El login por API solo aplica al backend PostgreSQL (DATABASE_URL).' },
      { status: 400 }
    );
  }

  const { email, password } = await request.json().catch(() => ({}));
  if (!email || !password) {
    return Response.json({ error: 'Correo y contraseña son requeridos.' }, { status: 400 });
  }

  const { rows } = await getPool().query(
    `SELECT id, email, full_name, role, status, phone, password_hash
       FROM profiles WHERE LOWER(email) = LOWER($1)`,
    [email]
  );
  const profile = rows[0];
  if (!profile || !profile.password_hash || !(await verifyPassword(password, profile.password_hash))) {
    return Response.json({ error: 'Credenciales incorrectas.' }, { status: 401 });
  }
  if (profile.status === 'suspended') {
    return Response.json({ error: 'Esta cuenta está suspendida.' }, { status: 403 });
  }

  const token = await createSession(profile.id);
  delete profile.password_hash;
  return Response.json({ profile, token });
}
