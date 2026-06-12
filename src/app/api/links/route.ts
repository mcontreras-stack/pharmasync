import { getPool, getServerBackend } from '@/lib/server/db';
import { getUserFromRequest } from '@/lib/server/auth';

/**
 * Vínculos madre ↔ médico (modo PostgreSQL).
 * Estados en BD: pending | accepted | rejected | revoked
 */

/** Listar vínculos: /api/links?motherId=... | /api/links?doctorId=...[&status=pending] */
export async function GET(request: Request) {
  if (getServerBackend() !== 'postgres') {
    return Response.json({ error: 'Esta API solo aplica al backend PostgreSQL.' }, { status: 400 });
  }
  const user = await getUserFromRequest(request);
  if (!user) return Response.json({ error: 'No autorizado.' }, { status: 401 });

  const url = new URL(request.url);
  const motherId = url.searchParams.get('motherId');
  const doctorId = url.searchParams.get('doctorId');
  const status = url.searchParams.get('status');

  if (motherId) {
    if (user.id !== motherId && user.role === 'mother') {
      return Response.json({ error: 'Sin permiso.' }, { status: 403 });
    }
    const { rows } = await getPool().query(
      `SELECT l.*, p.full_name AS doctor_name, pr.specialty, pr.exequatur AS license_number
         FROM doctor_patient_links l
         JOIN profiles p ON p.id = l.doctor_id
         JOIN professionals pr ON pr.id = l.doctor_id
        WHERE l.mother_id = $1
        ORDER BY l.created_at DESC`,
      [motherId]
    );
    return Response.json({ links: rows });
  }

  if (doctorId) {
    if (user.id !== doctorId && user.role !== 'admin') {
      return Response.json({ error: 'Sin permiso.' }, { status: 403 });
    }
    const params: unknown[] = [doctorId];
    let where = 'l.doctor_id = $1';
    if (status) {
      params.push(status);
      where += ' AND l.status = $2';
    }
    const { rows } = await getPool().query(
      `SELECT l.*, p.full_name AS mother_name, p.email AS mother_email
         FROM doctor_patient_links l
         JOIN profiles p ON p.id = l.mother_id
        WHERE ${where}
        ORDER BY l.created_at DESC`,
      params
    );
    return Response.json({ links: rows });
  }

  return Response.json({ error: 'Se requiere motherId o doctorId.' }, { status: 400 });
}

/** Solicitar vínculo por código de invitación: POST { code } */
export async function POST(request: Request) {
  if (getServerBackend() !== 'postgres') {
    return Response.json({ error: 'Esta API solo aplica al backend PostgreSQL.' }, { status: 400 });
  }
  const user = await getUserFromRequest(request);
  if (!user) return Response.json({ error: 'No autorizado.' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const code = String(body.code || '').toUpperCase().trim();
  const motherId = body.mother_id || user.id;
  if (!code) return Response.json({ error: 'Código de invitación requerido.' }, { status: 400 });
  if (user.id !== motherId && user.role === 'mother') {
    return Response.json({ error: 'Sin permiso.' }, { status: 403 });
  }

  const pool = getPool();
  const { rows: docs } = await pool.query(
    `SELECT pr.id, pr.specialty, p.full_name
       FROM professionals pr JOIN profiles p ON p.id = pr.id
      WHERE UPPER(pr.invite_code) = $1`,
    [code]
  );
  const doctor = docs[0];
  if (!doctor) {
    return Response.json({ error: 'Código de invitación no encontrado.' }, { status: 404 });
  }

  const existing = await pool.query(
    `SELECT 1 FROM doctor_patient_links
      WHERE doctor_id = $1 AND mother_id = $2 AND status IN ('pending', 'accepted')`,
    [doctor.id, motherId]
  );
  if (existing.rowCount && existing.rowCount > 0) {
    return Response.json({ error: 'Ya tienes una vinculación activa con este especialista.' }, { status: 409 });
  }

  await pool.query('INSERT INTO mothers (id) VALUES ($1) ON CONFLICT (id) DO NOTHING', [motherId]);
  const { rows } = await pool.query(
    `INSERT INTO doctor_patient_links (doctor_id, mother_id, link_code, status)
     VALUES ($1, $2, $3, 'pending') RETURNING *`,
    [doctor.id, motherId, code]
  );
  return Response.json({ link: rows[0], doctor_name: doctor.full_name }, { status: 201 });
}

/** Aprobar / rechazar / revocar: PATCH { id, action: 'approve' | 'reject' | 'revoke' } */
export async function PATCH(request: Request) {
  if (getServerBackend() !== 'postgres') {
    return Response.json({ error: 'Esta API solo aplica al backend PostgreSQL.' }, { status: 400 });
  }
  const user = await getUserFromRequest(request);
  if (!user) return Response.json({ error: 'No autorizado.' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const { id, action } = body;
  if (!id || !['approve', 'reject', 'revoke'].includes(action)) {
    return Response.json({ error: 'Se requiere id y una acción válida.' }, { status: 400 });
  }

  const pool = getPool();
  const { rows: links } = await pool.query('SELECT * FROM doctor_patient_links WHERE id = $1', [id]);
  const link = links[0];
  if (!link) return Response.json({ error: 'Vínculo no encontrado.' }, { status: 404 });

  // Aprobar/rechazar: el médico. Revocar: la madre (o admin).
  const isDoctor = user.id === link.doctor_id;
  const isMother = user.id === link.mother_id;
  if (action !== 'revoke' && !isDoctor && user.role !== 'admin') {
    return Response.json({ error: 'Solo el médico puede aprobar o rechazar.' }, { status: 403 });
  }
  if (action === 'revoke' && !isMother && !isDoctor && user.role !== 'admin') {
    return Response.json({ error: 'Sin permiso.' }, { status: 403 });
  }

  const newStatus = action === 'approve' ? 'accepted' : action === 'reject' ? 'rejected' : 'revoked';
  await pool.query(
    'UPDATE doctor_patient_links SET status = $2, updated_at = NOW() WHERE id = $1',
    [id, newStatus]
  );

  const { rows: specRows } = await pool.query('SELECT specialty FROM professionals WHERE id = $1', [link.doctor_id]);
  const specialty = specRows[0]?.specialty;

  if (action === 'approve') {
    if (specialty === 'obstetrician') {
      await pool.query(
        `UPDATE pregnancies SET obstetrician_id = $1, updated_at = NOW()
          WHERE mother_id = $2 AND status = 'active'`,
        [link.doctor_id, link.mother_id]
      );
    } else if (specialty === 'pediatrician') {
      await pool.query(
        'UPDATE babies SET pediatrician_id = $1 WHERE mother_id = $2',
        [link.doctor_id, link.mother_id]
      );
    }
  } else {
    if (specialty === 'obstetrician') {
      await pool.query(
        'UPDATE pregnancies SET obstetrician_id = NULL WHERE mother_id = $1 AND obstetrician_id = $2',
        [link.mother_id, link.doctor_id]
      );
    } else if (specialty === 'pediatrician') {
      await pool.query(
        'UPDATE babies SET pediatrician_id = NULL WHERE mother_id = $1 AND pediatrician_id = $2',
        [link.mother_id, link.doctor_id]
      );
    }
  }

  return Response.json({ ok: true, status: newStatus });
}
