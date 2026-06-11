import { getPool, getServerBackend } from '@/lib/server/db';
import { hashPassword, createSession } from '@/lib/server/auth';

const VALID_ROLES = ['mother', 'obstetrician', 'pediatrician'];

export async function POST(request: Request) {
  if (getServerBackend() !== 'postgres') {
    return Response.json(
      { error: 'El registro por API solo aplica al backend PostgreSQL (DATABASE_URL).' },
      { status: 400 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const { email, password, full_name, role, phone } = body;
  if (!email || !password || !full_name || !VALID_ROLES.includes(role)) {
    return Response.json({ error: 'Datos de registro incompletos.' }, { status: 400 });
  }

  const pool = getPool();
  const existing = await pool.query('SELECT 1 FROM profiles WHERE LOWER(email) = LOWER($1)', [email]);
  if (existing.rowCount && existing.rowCount > 0) {
    return Response.json({ error: 'Un usuario con este correo ya existe.' }, { status: 409 });
  }

  const password_hash = await hashPassword(password);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `INSERT INTO profiles (email, full_name, role, status, phone, password_hash)
       VALUES ($1, $2, $3, 'under_review', $4, $5)
       RETURNING id, email, full_name, role, status, phone`,
      [email, full_name, role, phone || null, password_hash]
    );
    const profile = rows[0];

    if (role === 'mother') {
      await client.query('INSERT INTO mothers (id, phone) VALUES ($1, $2)', [profile.id, phone || null]);
    } else {
      await client.query(
        `INSERT INTO professionals (id, specialty, exequatur) VALUES ($1, $2, $3)`,
        [profile.id, role, `PENDIENTE-${profile.id.slice(0, 8)}`]
      );
    }
    await client.query('COMMIT');

    const token = await createSession(profile.id);
    return Response.json({ profile, token }, { status: 201 });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
