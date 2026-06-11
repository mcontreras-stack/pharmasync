import { getPool, getSupabaseAdmin, getServerBackend } from '@/lib/server/db';
import { requireAdmin, hashPassword } from '@/lib/server/auth';

const VALID_ROLES = ['mother', 'obstetrician', 'pediatrician', 'admin'];

/** Listar todos los usuarios (solo admin). */
export async function GET(request: Request) {
  const backend = getServerBackend();
  if (backend === 'none') {
    return Response.json({ error: 'No hay backend configurado (DATABASE_URL o SUPABASE_SERVICE_ROLE_KEY).' }, { status: 503 });
  }
  const admin = await requireAdmin(request);
  if (!admin) return Response.json({ error: 'No autorizado.' }, { status: 401 });

  if (backend === 'postgres') {
    const { rows } = await getPool().query(
      `SELECT id, email, full_name, role, status, avatar_url, created_at
         FROM profiles ORDER BY created_at DESC`
    );
    return Response.json({ users: rows });
  }

  const { data, error } = await getSupabaseAdmin()
    .from('profiles')
    .select('id, email, full_name, role, status, avatar_url, created_at')
    .order('created_at', { ascending: false });
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ users: data });
}

/** Crear un usuario nuevo (solo admin). */
export async function POST(request: Request) {
  const backend = getServerBackend();
  if (backend === 'none') {
    return Response.json({ error: 'No hay backend configurado (DATABASE_URL o SUPABASE_SERVICE_ROLE_KEY).' }, { status: 503 });
  }
  const admin = await requireAdmin(request);
  if (!admin) return Response.json({ error: 'No autorizado.' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const { email, password, full_name, role, status, phone } = body;
  if (!email || !password || !full_name || !VALID_ROLES.includes(role)) {
    return Response.json({ error: 'Datos incompletos: se requiere email, contraseña, nombre y rol.' }, { status: 400 });
  }
  const userStatus = status || 'approved';

  if (backend === 'postgres') {
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
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, email, full_name, role, status, phone, created_at`,
        [email, full_name, role, userStatus, phone || null, password_hash]
      );
      const profile = rows[0];
      if (role === 'mother') {
        await client.query('INSERT INTO mothers (id, phone) VALUES ($1, $2)', [profile.id, phone || null]);
      } else if (role === 'obstetrician' || role === 'pediatrician') {
        await client.query(
          `INSERT INTO professionals (id, specialty, exequatur) VALUES ($1, $2, $3)`,
          [profile.id, role, `PENDIENTE-${profile.id.slice(0, 8)}`]
        );
      }
      await client.query('COMMIT');
      return Response.json({ user: profile }, { status: 201 });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // Supabase: crear en Auth con email confirmado y luego asegurar el perfil
  const supa = getSupabaseAdmin();
  const { data: created, error: createErr } = await supa.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name, role, phone },
  });
  if (createErr) return Response.json({ error: createErr.message }, { status: 400 });

  const profile = {
    id: created.user.id,
    email,
    full_name,
    role,
    status: userStatus,
    phone: phone || null,
  };
  const { error: upsertErr } = await supa.from('profiles').upsert(profile);
  if (upsertErr) return Response.json({ error: upsertErr.message }, { status: 500 });

  if (role === 'mother') {
    await supa.from('mothers').upsert({ id: created.user.id, phone: phone || null });
  } else if (role === 'obstetrician' || role === 'pediatrician') {
    await supa.from('professionals').upsert({
      id: created.user.id,
      specialty: role,
      exequatur: `PENDIENTE-${created.user.id.slice(0, 8)}`,
    });
  }

  return Response.json({ user: profile }, { status: 201 });
}
