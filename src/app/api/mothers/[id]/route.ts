import { getPool, getServerBackend } from '@/lib/server/db';
import { getUserFromRequest } from '@/lib/server/auth';

const MOTHER_FIELDS = [
  'phone', 'birth_date', 'emergency_contact_name', 'emergency_contact_phone',
  'blood_type', 'allergies',
] as const;

function canAccess(userId: string, role: string, motherId: string): boolean {
  return userId === motherId || role === 'admin' || role === 'obstetrician' || role === 'pediatrician';
}

/** Obtener los datos de una madre. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (getServerBackend() !== 'postgres') {
    return Response.json({ error: 'Esta API solo aplica al backend PostgreSQL.' }, { status: 400 });
  }
  const user = await getUserFromRequest(request);
  if (!user) return Response.json({ error: 'No autorizado.' }, { status: 401 });

  const { id } = await params;
  if (!canAccess(user.id, user.role, id)) {
    return Response.json({ error: 'Sin permiso.' }, { status: 403 });
  }

  const { rows } = await getPool().query('SELECT * FROM mothers WHERE id = $1', [id]);
  return Response.json({ mother: rows[0] || null });
}

/** Actualizar (o crear) los datos de una madre. */
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (getServerBackend() !== 'postgres') {
    return Response.json({ error: 'Esta API solo aplica al backend PostgreSQL.' }, { status: 400 });
  }
  const user = await getUserFromRequest(request);
  if (!user) return Response.json({ error: 'No autorizado.' }, { status: 401 });

  const { id } = await params;
  if (user.id !== id && user.role !== 'admin') {
    return Response.json({ error: 'Sin permiso.' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const cols = MOTHER_FIELDS.filter(f => f in body);
  if (cols.length === 0) return Response.json({ error: 'Nada que actualizar.' }, { status: 400 });

  const insertCols = ['id', ...cols].join(', ');
  const insertVals = ['$1', ...cols.map((_, i) => `$${i + 2}`)].join(', ');
  const updateSets = cols.map((c, i) => `${c} = $${i + 2}`).join(', ');

  const { rows } = await getPool().query(
    `INSERT INTO mothers (${insertCols}) VALUES (${insertVals})
     ON CONFLICT (id) DO UPDATE SET ${updateSets}
     RETURNING *`,
    [id, ...cols.map(c => body[c] === '' ? null : body[c])]
  );
  return Response.json({ mother: rows[0] });
}
