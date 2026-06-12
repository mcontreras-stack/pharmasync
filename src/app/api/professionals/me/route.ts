import { getPool, getServerBackend } from '@/lib/server/db';
import { getUserFromRequest } from '@/lib/server/auth';

/** Ficha profesional del médico autenticado (incluye invite_code). */
export async function GET(request: Request) {
  if (getServerBackend() !== 'postgres') {
    return Response.json({ error: 'Esta API solo aplica al backend PostgreSQL.' }, { status: 400 });
  }
  const user = await getUserFromRequest(request);
  if (!user) return Response.json({ error: 'No autorizado.' }, { status: 401 });

  const pool = getPool();
  const { rows } = await pool.query('SELECT * FROM professionals WHERE id = $1', [user.id]);
  let professional = rows[0] || null;

  // Generar código de invitación si aún no tiene
  if (professional && !professional.invite_code) {
    const code = `DR-${user.full_name.split(' ')[0].toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4) || 'DOC'}-${Math.floor(1000 + Math.random() * 9000)}`;
    const { rows: updated } = await pool.query(
      'UPDATE professionals SET invite_code = $2 WHERE id = $1 RETURNING *',
      [user.id, code]
    );
    professional = updated[0];
  }

  return Response.json({ professional });
}
