import { getPool, getServerBackend } from '@/lib/server/db';
import { getUserFromRequest } from '@/lib/server/auth';

/** Listar embarazos de una madre: /api/pregnancies?motherId=... */
export async function GET(request: Request) {
  if (getServerBackend() !== 'postgres') {
    return Response.json({ error: 'Esta API solo aplica al backend PostgreSQL.' }, { status: 400 });
  }
  const user = await getUserFromRequest(request);
  if (!user) return Response.json({ error: 'No autorizado.' }, { status: 401 });

  const motherId = new URL(request.url).searchParams.get('motherId') || user.id;
  if (user.id !== motherId && user.role === 'mother') {
    return Response.json({ error: 'Sin permiso.' }, { status: 403 });
  }

  const { rows } = await getPool().query(
    'SELECT * FROM pregnancies WHERE mother_id = $1 ORDER BY created_at DESC',
    [motherId]
  );
  return Response.json({ pregnancies: rows });
}

/** Registrar un embarazo nuevo. */
export async function POST(request: Request) {
  if (getServerBackend() !== 'postgres') {
    return Response.json({ error: 'Esta API solo aplica al backend PostgreSQL.' }, { status: 400 });
  }
  const user = await getUserFromRequest(request);
  if (!user) return Response.json({ error: 'No autorizado.' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const motherId = body.mother_id || user.id;
  if (user.id !== motherId && user.role === 'mother') {
    return Response.json({ error: 'Sin permiso.' }, { status: 403 });
  }
  const { last_menstrual_period, estimated_due_date } = body;
  if (!last_menstrual_period || !estimated_due_date) {
    return Response.json({ error: 'Se requiere la fecha de última menstruación y la fecha probable de parto.' }, { status: 400 });
  }

  const pool = getPool();
  const active = await pool.query(
    `SELECT 1 FROM pregnancies WHERE mother_id = $1 AND status = 'active'`,
    [motherId]
  );
  if (active.rowCount && active.rowCount > 0) {
    return Response.json({ error: 'Ya existe un embarazo activo registrado.' }, { status: 409 });
  }

  // Asegurar que exista el registro de madre (FK)
  await pool.query('INSERT INTO mothers (id) VALUES ($1) ON CONFLICT (id) DO NOTHING', [motherId]);

  const { rows } = await pool.query(
    `INSERT INTO pregnancies (mother_id, status, last_menstrual_period, estimated_due_date, notes)
     VALUES ($1, 'active', $2, $3, $4)
     RETURNING *`,
    [motherId, last_menstrual_period, estimated_due_date, body.notes || null]
  );
  return Response.json({ pregnancy: rows[0] }, { status: 201 });
}

/** Actualizar el estado de un embarazo (ej. completado). */
export async function PATCH(request: Request) {
  if (getServerBackend() !== 'postgres') {
    return Response.json({ error: 'Esta API solo aplica al backend PostgreSQL.' }, { status: 400 });
  }
  const user = await getUserFromRequest(request);
  if (!user) return Response.json({ error: 'No autorizado.' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const { id, status } = body;
  if (!id || !['active', 'completed', 'terminated'].includes(status)) {
    return Response.json({ error: 'Se requiere id y un estado válido.' }, { status: 400 });
  }

  const { rows } = await getPool().query(
    `UPDATE pregnancies SET status = $2, updated_at = NOW()
      WHERE id = $1 AND (mother_id = $3 OR $4 <> 'mother')
      RETURNING *`,
    [id, status, user.id, user.role]
  );
  if (!rows[0]) return Response.json({ error: 'Embarazo no encontrado o sin permiso.' }, { status: 404 });
  return Response.json({ pregnancy: rows[0] });
}
