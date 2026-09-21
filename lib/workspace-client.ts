'use client';
import {accessToken,supabaseMode} from '@/lib/supabase-browser';

export {supabaseMode};

export async function workspaceFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  if (!supabaseMode) return fetch(input, init);
  const token = await accessToken();
  if (!token) return new Response(JSON.stringify({error:'Inicia sessão no Vigia Cloud.'}), {status:401, headers:{'Content-Type':'application/json'}});
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${token}`);
  return fetch(input, {...init, headers});
}
