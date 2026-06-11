import { getServerBackend } from '@/lib/server/db';
import { destroySession } from '@/lib/server/auth';

export async function POST(request: Request) {
  if (getServerBackend() !== 'postgres') {
    return Response.json({ ok: true });
  }
  const header = request.headers.get('authorization') || '';
  const token = header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : '';
  if (token) await destroySession(token);
  return Response.json({ ok: true });
}
