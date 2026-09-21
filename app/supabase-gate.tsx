'use client';
import {useEffect,useState,type ReactNode} from 'react';
import {Shield,Loader2} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {activeSession,signIn,signUp,supabaseConfigured,supabaseMode,type VigiaSupabaseSession} from '@/lib/supabase-browser';

export default function SupabaseGate({children}:{children:ReactNode}) {
  const [session,setSession]=useState<VigiaSupabaseSession|null>(null);
  const [checking,setChecking]=useState(supabaseMode);
  const bootstrapEmail=process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL||'';
  const [email,setEmail]=useState(bootstrapEmail);
  const [password,setPassword]=useState('');
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [info,setInfo]=useState('');

  useEffect(()=>{
    if(!supabaseMode){setChecking(false);return;}
    void activeSession().then(s=>{setSession(s);setChecking(false)});
  },[]);

  if(!supabaseMode)return <>{children}</>;
  if(checking)return <div className="auth-screen"><Loader2 className="animate-spin"/><p>A validar sessão…</p></div>;
  if(!supabaseConfigured)return <div className="auth-screen"><div className="auth-card"><h1>Vigia Cloud</h1><p>O modo Supabase está ativo, mas faltam as variáveis públicas de ligação.</p></div></div>;
  if(session)return <>{children}</>;

  async function login(){
    setBusy(true);setError('');setInfo('');
    try{const s=await signIn(email.trim(),password);setSession(s)}catch(e){setError(e instanceof Error?e.message:'Não foi possível iniciar sessão.')}finally{setBusy(false)}
  }
  async function activate(){
    setBusy(true);setError('');setInfo('');
    try{
      if(bootstrapEmail&&email.trim().toLowerCase()!==bootstrapEmail.toLowerCase())throw new Error('A ativação inicial está reservada ao Super Admin.');
      const data=await signUp(email.trim(),password);
      if(typeof data.access_token==='string'&&data.access_token){setSession(data as unknown as VigiaSupabaseSession);return;}
      setInfo('Conta criada. Confirma o email recebido e depois inicia sessão.');
    }catch(e){setError(e instanceof Error?e.message:'Não foi possível ativar a conta.')}finally{setBusy(false)}
  }

  return <div className="auth-screen"><div className="auth-card">
    <div className="auth-brand"><span className="brand-icon"><Shield size={23}/></span><div><strong>Vigia Cloud</strong><small>VIDEOVIGILÂNCIA POR EVENTOS</small></div></div>
    <div><Label htmlFor="auth-email">Email</Label><Input id="auth-email" type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)}/></div>
    <div><Label htmlFor="auth-password">Palavra-passe</Label><Input id="auth-password" type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)}/></div>
    {error&&<p className="form-error" role="alert">{error}</p>}
    {info&&<div className="info-box">{info}</div>}
    <Button disabled={busy||!email||!password} onClick={()=>void login()}>{busy?<><Loader2 className="animate-spin" size={16}/>A validar…</>:'Iniciar sessão'}</Button>
    <Button variant="outline" disabled={busy||!email||password.length<10} onClick={()=>void activate()}>Ativar conta</Button>
    <p className="helper">Na ativação defines a tua própria palavra-passe. A confirmação do email é feita pelo Supabase.</p>
  </div></div>;
}
