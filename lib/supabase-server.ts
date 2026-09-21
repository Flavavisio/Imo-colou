import {env} from 'cloudflare:workers';

type RuntimeEnv=Record<string,string|undefined>;
function runtimeEnv():RuntimeEnv{return env as unknown as RuntimeEnv}
function value(name:string, fallback?:string){return runtimeEnv()[name] || process.env[name] || fallback || ''}

export const useSupabaseBackend=()=>value('VIGIA_DATA_BACKEND','d1')==='supabase';
export const supabaseUrl=()=>value('SUPABASE_URL',process.env.NEXT_PUBLIC_SUPABASE_URL);
export const supabaseKey=()=>value('SUPABASE_PUBLISHABLE_KEY',process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

function headers(token:string, extra:HeadersInit={}):Headers{
 const h=new Headers(extra);h.set('apikey',supabaseKey());h.set('Authorization',`Bearer ${token}`);return h;
}
export async function supabaseUser(token:string){
 const r=await fetch(`${supabaseUrl()}/auth/v1/user`,{headers:headers(token)});
 if(!r.ok)return null;
 const u=await r.json() as {id?:string;email?:string};
 return u.id?u:null;
}
export async function rest(token:string,path:string,init:RequestInit={}){
 return fetch(`${supabaseUrl()}/rest/v1/${path}`,{...init,headers:headers(token,init.headers)});
}
