import { getPool, getServerBackend } from '@/lib/server/db';
import { getUserFromRequest } from '@/lib/server/auth';

const VALID_STATUSES = ['pending', 'confirmed', 'scheduled', 'completed', 'cancelled'];

/** Listar citas del usuario autenticado (madre o médico). */
export async function GET(request: Request) {
  if (getServerBackend() !== 'postgres') {
    return Response.json({ error: 'Esta API solo aplica al backend PostgreSQL.' }, { status: 400 });
  }
  const user = await getUserFromRequest(request);
  if (!user) return Response.json({ error: 'No autorizado.' }, { status: 401 });

  const field = user.role === 'mother' ? 'mother_id' : 'doctor_id';
  const { rows } = await getPool().query(
    `SELECT a.*, dp.full_name AS doctor_name, mp.full_name AS mother_name
       FROM appointments a
       JOIN profiles dp ON dp.id = a.doctor_id
       JOIN profiles mp ON mp.id = a.mother_id
      WHERE a.${field} = $1
      ORDER BY a.appointment_date ASC`,
    [user.id]
  );
  return Response.json({ appointments: rows });
}

/** Programar una cita (madre). */
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
  const { doctor_id, appointment_date, reason } = body;
  if (!doctor_id || !appointment_date || !reason) {
    return Response.json({ error: 'Se requiere médico, fecha y motivo.' }, { status: 400 });
  }

  const pool = getPool();
  await pool.query('INSERT INTO mothers (id) VALUES ($1) ON CONFLICT (id) DO NOTHING', [motherId]);
  const { rows } = await pool.query(
    `INSERT INTO appointments (doctor_id, mother_id, baby_id, appointment_date, status, reason, notes)
     VALUES ($1, $2, $3, $4, 'pending', $5, $6) RETURNING *`,
    [doctor_id, motherId, body.baby_id || null, appointment_date, reason, body.notes || null]
  );
  return Response.json({ appointment: rows[0] }, { status: 201 });
}

/** Cambiar el estado de una cita: PATCH { id, status }. */
export async function PATCH(request: Request) {
  if (getServerBackend() !== 'postgres') {
    return Response.json({ error: 'Esta API solo aplica al backend PostgreSQL.' }, { status: 400 });
  }
  const user = await getUserFromRequest(request);
  if (!user) return Response.json({ error: 'No autorizado.' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const { id, status } = body;
  if (!id || !VALID_STATUSES.includes(status)) {
    return Response.json({ error: 'Se requiere id y un estado válido.' }, { status: 400 });
  }

  const { rows } = await getPool().query(
    `UPDATE appointments SET status = $2
      WHERE id = $1 AND (mother_id = $3 OR doctor_id = $3 OR $4 = 'admin')
      RETURNING *`,
    [id, status, user.id, user.role]
  );
  if (!rows[0]) return Response.json({ error: 'Cita no encontrada o sin permiso.' }, { status: 404 });
  return Response.json({ appointment: rows[0] });
}
