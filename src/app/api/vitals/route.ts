import { getPool, getServerBackend } from '@/lib/server/db';
import { getUserFromRequest } from '@/lib/server/auth';

/** Listar signos vitales: /api/vitals?motherId=... */
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
    'SELECT * FROM vital_signs WHERE mother_id = $1 ORDER BY created_at DESC',
    [motherId]
  );
  return Response.json({ vitals: rows });
}

/** Registrar signos vitales. */
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

  const pool = getPool();
  await pool.query('INSERT INTO mothers (id) VALUES ($1) ON CONFLICT (id) DO NOTHING', [motherId]);
  const { rows } = await pool.query(
    `INSERT INTO vital_signs (mother_id, logged_date, weight_kg, systolic_bp, diastolic_bp, heart_rate_bpm, temperature_c)
     VALUES ($1, CURRENT_DATE, $2, $3, $4, $5, $6) RETURNING *`,
    [motherId, body.weight_kg || null, body.systolic_bp || null, body.diastolic_bp || null,
     body.heart_rate_bpm || null, body.temperature_c || null]
  );
  return Response.json({ vital: rows[0] }, { status: 201 });
}
