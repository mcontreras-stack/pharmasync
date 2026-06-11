import { getPool, getSupabaseAdmin, getServerBackend } from '@/lib/server/db';
import { requireAdmin } from '@/lib/server/auth';

const EDITABLE_FIELDS = ['full_name', 'email', 'role', 'status', 'phone', 'suspension_reason'] as const;

/** Actualizar perfil de un usuario (solo admin). */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const backend = getServerBackend();
  if (backend === 'none') {
    return Response.json({ error: 'No hay backend configurado.' }, { status: 503 });
  }
  const admin = await requireAdmin(request);
  if (!admin) return Response.json({ error: 'No autorizado.' }, { status: 401 });

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const updates: Record<string, unknown> = {};
  for (const field of EDITABLE_FIELDS) {
    if (field in body) updates[field] = body[field];
  }
  if (Object.keys(updates).length === 0) {
    return Response.json({ error: 'Nada que actualizar.' }, { status: 400 });
  }

  if (backend === 'postgres') {
    const cols = Object.keys(updates);
    const sets = cols.map((c, i) => `${c} = $${i + 2}`).join(', ');
    const { rows } = await getPool().query(
      `UPDATE profiles SET ${sets} WHERE id = $1
       RETURNING id, email, full_name, role, status, phone`,
      [id, ...cols.map(c => updates[c])]
    );
    if (!rows[0]) return Response.json({ error: 'Usuario no encontrado.' }, { status: 404 });
    return Response.json({ user: rows[0] });
  }

  const { data, error } = await getSupabaseAdmin()
    .from('profiles')
    .update(updates)
    .eq('id', id)
    .select('id, email, full_name, role, status, phone')
    .single();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ user: data });
}

/** Eliminar un usuario (solo admin). */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const backend = getServerBackend();
  if (backend === 'none') {
    return Response.json({ error: 'No hay backend configurado.' }, { status: 503 });
  }
  const admin = await requireAdmin(request);
  if (!admin) return Response.json({ error: 'No autorizado.' }, { status: 401 });

  const { id } = await params;
  if (id === admin.id) {
    return Response.json({ error: 'No puedes eliminar tu propia cuenta.' }, { status: 400 });
  }

  if (backend === 'postgres') {
    await getPool().query('DELETE FROM profiles WHERE id = $1', [id]);
    return Response.json({ ok: true });
  }

  const supa = getSupabaseAdmin();
  // Borrar el usuario de Auth elimina el perfil en cascada (FK auth.users)
  const { error } = await supa.auth.admin.deleteUser(id);
  if (error && !error.message.includes('not found')) {
    return Response.json({ error: error.message }, { status: 500 });
  }
  await supa.from('profiles').delete().eq('id', id);
  return Response.json({ ok: true });
}
