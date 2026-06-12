import { getPool, getServerBackend } from '@/lib/server/db';
import { getUserFromRequest } from '@/lib/server/auth';

/** Listar síntomas: /api/symptoms?motherId=... */
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
    'SELECT * FROM symptoms WHERE mother_id = $1 ORDER BY created_at DESC',
    [motherId]
  );
  return Response.json({ symptoms: rows });
}

/** Registrar un síntoma. */
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
  const { symptom_name, intensity } = body;
  if (!symptom_name || !intensity) {
    return Response.json({ error: 'Se requiere nombre del síntoma e intensidad.' }, { status: 400 });
  }

  const pool = getPool();
  await pool.query('INSERT INTO mothers (id) VALUES ($1) ON CONFLICT (id) DO NOTHING', [motherId]);
  const { rows } = await pool.query(
    `INSERT INTO symptoms (mother_id, pregnancy_id, symptom_name, intensity, notes, logged_date)
     VALUES ($1, $2, $3, $4, $5, CURRENT_DATE) RETURNING *`,
    [motherId, body.pregnancy_id || null, symptom_name, intensity, body.notes || null]
  );
  return Response.json({ symptom: rows[0] }, { status: 201 });
}
