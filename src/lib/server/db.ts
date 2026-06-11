import { Pool } from 'pg';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Backend del lado del servidor, decidido por variables de entorno:
 *  - DATABASE_URL                → PostgreSQL directo (servidor propio)
 *  - SUPABASE_SERVICE_ROLE_KEY  → Supabase con privilegios de administrador
 *  - ninguna                     → 'none' (la app queda en modo demo)
 */
export type ServerBackend = 'postgres' | 'supabase' | 'none';

export function getServerBackend(): ServerBackend {
  if (process.env.DATABASE_URL) return 'postgres';
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  if (url && !url.includes('placeholder') && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return 'supabase';
  }
  return 'none';
}

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL no está definida');
    }
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      // DATABASE_SSL=true para servidores que exigen TLS (ej. proveedores cloud)
      ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
      max: 10,
    });
  }
  return pool;
}

let adminClient: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (!adminClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
    }
    adminClient = createClient(url, key, { auth: { persistSession: false } });
  }
  return adminClient;
}
