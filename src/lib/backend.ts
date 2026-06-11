'use client';

import { supabase, isSupabaseConfigured } from '@/lib/supabase';

/**
 * Backend de datos visto desde el cliente:
 *  - 'postgres' : NEXT_PUBLIC_DATA_BACKEND=postgres → todo pasa por /api (servidor con DATABASE_URL)
 *  - 'supabase' : credenciales públicas de Supabase configuradas
 *  - 'demo'     : sin configuración → datos mock en localStorage
 */
export type DataBackend = 'demo' | 'supabase' | 'postgres';

const TOKEN_KEY = 'vitarahealth_api_token';

export function getDataBackend(): DataBackend {
  const forced = process.env.NEXT_PUBLIC_DATA_BACKEND;
  if (forced === 'postgres') return 'postgres';
  if (forced === 'demo') return 'demo';
  return isSupabaseConfigured() ? 'supabase' : 'demo';
}

export function getApiToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setApiToken(token: string | null) {
  if (typeof window === 'undefined') return;
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

/**
 * fetch con autenticación automática:
 *  - postgres → token de sesión propio (localStorage)
 *  - supabase → access_token de la sesión de Supabase Auth
 */
export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json');
  }

  const backend = getDataBackend();
  if (backend === 'postgres') {
    const token = getApiToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
  } else if (backend === 'supabase') {
    const { data } = await supabase.auth.getSession();
    if (data.session?.access_token) {
      headers.set('Authorization', `Bearer ${data.session.access_token}`);
    }
  }

  return fetch(path, { ...init, headers });
}

/** Lanza un Error con el mensaje del cuerpo JSON si la respuesta no es OK. */
export async function apiJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await apiFetch(path, init);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((body as { error?: string }).error || `Error ${res.status}`);
  }
  return body as T;
}
