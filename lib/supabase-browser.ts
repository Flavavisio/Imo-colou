'use client';

export type VigiaSupabaseSession = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at?: number;
  token_type: string;
  user?: { id: string; email?: string };
};

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';
const backend = process.env.NEXT_PUBLIC_VIGIA_DATA_BACKEND || 'd1';
const storageKey = 'vigia-cloud.supabase-session';

export const supabaseMode = backend === 'supabase';
export const supabaseConfigured = supabaseMode && Boolean(url && key);

function normalizeSession(value: VigiaSupabaseSession): VigiaSupabaseSession {
  const expiresAt = value.expires_at || Math.floor(Date.now() / 1000) + (value.expires_in || 3600);
  return { ...value, expires_at: expiresAt };
}

function saveSession(value: VigiaSupabaseSession | null) {
  if (typeof window === 'undefined') return;
  if (!value) localStorage.removeItem(storageKey);
  else localStorage.setItem(storageKey, JSON.stringify(normalizeSession(value)));
}

export function storedSession(): VigiaSupabaseSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? normalizeSession(JSON.parse(raw) as VigiaSupabaseSession) : null;
  } catch {
    localStorage.removeItem(storageKey);
    return null;
  }
}

async function authRequest(path: string, body?: unknown, accessToken?: string) {
  if (!supabaseConfigured) throw new Error('Supabase não está configurado neste ambiente.');
  const r = await fetch(`${url}/auth/v1/${path}`, {
    method: 'POST',
    headers: {
      apikey: key,
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await r.json().catch(() => ({})) as Record<string, unknown>;
  if (!r.ok) throw new Error(String(data.msg || data.message || data.error_description || 'Falha de autenticação.'));
  return data;
}

export async function signIn(email: string, password: string) {
  const data = await authRequest('token?grant_type=password', { email, password }) as unknown as VigiaSupabaseSession;
  const session = normalizeSession(data);
  saveSession(session);
  return session;
}

export async function signUp(email: string, password: string) {
  if (password.length < 10) throw new Error('Usa uma palavra-passe com pelo menos 10 caracteres.');
  const data = await authRequest('signup', { email, password }) as Record<string, unknown>;
  const access = data.access_token;
  if (typeof access === 'string' && access) saveSession(normalizeSession(data as unknown as VigiaSupabaseSession));
  return data;
}

export async function signOut() {
  const session = storedSession();
  try {
    if (session?.access_token) await authRequest('logout', undefined, session.access_token);
  } finally {
    saveSession(null);
  }
}

export async function activeSession(): Promise<VigiaSupabaseSession | null> {
  const current = storedSession();
  if (!current) return null;
  const expiresAt = current.expires_at || 0;
  if (expiresAt > Math.floor(Date.now() / 1000) + 60) return current;
  if (!current.refresh_token) {
    saveSession(null);
    return null;
  }
  try {
    const data = await authRequest('token?grant_type=refresh_token', { refresh_token: current.refresh_token }) as unknown as VigiaSupabaseSession;
    const next = normalizeSession(data);
    saveSession(next);
    return next;
  } catch {
    saveSession(null);
    return null;
  }
}

export async function accessToken() {
  return (await activeSession())?.access_token || '';
}
