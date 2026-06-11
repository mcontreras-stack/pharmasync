import { getPool, getServerBackend } from '@/lib/server/db';
import { getUserFromRequest } from '@/lib/server/auth';

/** Listar bebés de una madre: /api/babies?motherId=... */
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
    'SELECT * FROM babies WHERE mother_id = $1 ORDER BY birth_date DESC',
    [motherId]
  );
  return Response.json({ babies: rows });
}

/** Registrar el nacimiento de un bebé. */
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
  const { name, birth_date, gender } = body;
  if (!name || !birth_date) {
    return Response.json({ error: 'Se requiere nombre y fecha de nacimiento.' }, { status: 400 });
  }

  const pool = getPool();
  await pool.query('INSERT INTO mothers (id) VALUES ($1) ON CONFLICT (id) DO NOTHING', [motherId]);

  const { rows } = await pool.query(
    `INSERT INTO babies (mother_id, pregnancy_id, name, birth_date, gender, birth_weight_grams, birth_height_cm)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [motherId, body.pregnancy_id || null, name, birth_date, gender || null,
     body.birth_weight_grams || null, body.birth_height_cm || null]
  );

  // Si el bebé proviene de un embarazo activo, marcarlo como completado
  if (body.pregnancy_id) {
    await pool.query(
      `UPDATE pregnancies SET status = 'completed', updated_at = NOW() WHERE id = $1 AND mother_id = $2`,
      [body.pregnancy_id, motherId]
    );
  }

  return Response.json({ baby: rows[0] }, { status: 201 });
}
