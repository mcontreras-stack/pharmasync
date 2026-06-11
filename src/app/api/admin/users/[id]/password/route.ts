import { getPool, getSupabaseAdmin, getServerBackend } from '@/lib/server/db';
import { requireAdmin, hashPassword } from '@/lib/server/auth';

/** Resetear la contraseña de un usuario (solo admin). */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const backend = getServerBackend();
  if (backend === 'none') {
    return Response.json({ error: 'No hay backend configurado.' }, { status: 503 });
  }
  const admin = await requireAdmin(request);
  if (!admin) return Response.json({ error: 'No autorizado.' }, { status: 401 });

  const { id } = await params;
  const { password } = await request.json().catch(() => ({}));
  if (!password || String(password).length < 6) {
    return Response.json({ error: 'La contraseña debe tener al menos 6 caracteres.' }, { status: 400 });
  }

  if (backend === 'postgres') {
    const password_hash = await hashPassword(password);
    const result = await getPool().query(
      'UPDATE profiles SET password_hash = $2 WHERE id = $1',
      [id, password_hash]
    );
    if (result.rowCount === 0) {
      return Response.json({ error: 'Usuario no encontrado.' }, { status: 404 });
    }
    // Invalidar sesiones existentes del usuario
    await getPool().query('DELETE FROM sessions WHERE user_id = $1', [id]);
    return Response.json({ ok: true });
  }

  const { error } = await getSupabaseAdmin().auth.admin.updateUserById(id, { password });
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
