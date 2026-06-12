import { getPool, getServerBackend } from '@/lib/server/db';
import { getUserFromRequest } from '@/lib/server/auth';

/**
 * Roster del médico autenticado (modo PostgreSQL).
 *  - Obstetra: madres con embarazo activo asignado a él
 *  - Pediatra: bebés asignados a él (con datos de la madre)
 */
export async function GET(request: Request) {
  if (getServerBackend() !== 'postgres') {
    return Response.json({ error: 'Esta API solo aplica al backend PostgreSQL.' }, { status: 400 });
  }
  const user = await getUserFromRequest(request);
  if (!user) return Response.json({ error: 'No autorizado.' }, { status: 401 });
  if (!['obstetrician', 'pediatrician', 'admin'].includes(user.role)) {
    return Response.json({ error: 'Sin permiso.' }, { status: 403 });
  }

  const pool = getPool();
  const { rows: specRows } = await pool.query('SELECT specialty FROM professionals WHERE id = $1', [user.id]);
  const specialty = specRows[0]?.specialty || (user.role === 'pediatrician' ? 'pediatrician' : 'obstetrician');

  if (specialty === 'obstetrician') {
    const { rows } = await pool.query(
      `SELECT m.*, p.full_name, p.email, p.avatar_url,
              pr.id AS pregnancy_id, pr.last_menstrual_period, pr.estimated_due_date, pr.status AS pregnancy_status
         FROM pregnancies pr
         JOIN mothers m ON m.id = pr.mother_id
         JOIN profiles p ON p.id = m.id
        WHERE pr.obstetrician_id = $1 AND pr.status = 'active'
        ORDER BY p.full_name`,
      [user.id]
    );
    return Response.json({ specialty, patients: rows });
  }

  const { rows } = await pool.query(
    `SELECT b.*, p.full_name AS mother_name, p.email AS mother_email
       FROM babies b
       JOIN profiles p ON p.id = b.mother_id
      WHERE b.pediatrician_id = $1
      ORDER BY b.birth_date DESC`,
    [user.id]
  );
  return Response.json({ specialty, patients: rows });
}
