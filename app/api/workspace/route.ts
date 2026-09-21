import {getChatGPTUser} from '@/app/chatgpt-auth';
import {workspaceDb} from '@/lib/workspace-db';
import {emptyRecords,recordsSchema,kindNames,type Kind,type Activity,type Records} from '@/lib/model';
import {rest,supabaseUser,useSupabaseBackend} from '@/lib/supabase-server';
export const dynamic='force-dynamic';
const reply=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
const bearer=(request?:Request)=>request?.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1]||'';

function buildData(prev:{records:Records;activity:Activity[]},records:Records){
 const now=new Date().toISOString();const changes:Activity[]=[];
 for(const k of Object.keys(kindNames) as Kind[]){const before=new Map(prev.records[k].map(r=>[r.id,JSON.stringify(r)]));const after=new Map(records[k].map(r=>[r.id,JSON.stringify(r)]));const added=records[k].filter(r=>!before.has(r.id)).length;const changed=records[k].filter(r=>before.has(r.id)&&before.get(r.id)!==JSON.stringify(r)).length;const removed=prev.records[k].filter(r=>!after.has(r.id)).length;if(added||changed||removed)changes.push({at:now,text:`${kindNames[k]}: ${added} criados, ${changed} alterados, ${removed} eliminados`});}
 return {records,activity:[...changes,...prev.activity].slice(0,80)};
}

async function getSupabase(request:Request){
 const token=bearer(request);if(!token)return reply({error:'Inicia sessão no Vigia Cloud.'},401);
 const user=await supabaseUser(token);if(!user)return reply({error:'Sessão terminada. Volta a iniciar sessão.'},401);
 const r=await rest(token,`workspace_snapshots?select=records,activity,revision&user_id=eq.${encodeURIComponent(user.id)}&limit=1`,{headers:{Accept:'application/json'}});
 if(!r.ok){console.error('supabase workspace read failed',await r.text());return reply({error:'Não foi possível carregar os registos. Tenta novamente.'},503)}
 const rows=await r.json() as {records:unknown;activity:Activity[];revision:number}[];
 if(!rows.length)return reply({records:emptyRecords,revision:0,activity:[]});
 try{return reply({records:recordsSchema.parse(rows[0].records),activity:Array.isArray(rows[0].activity)?rows[0].activity:[],revision:rows[0].revision})}catch(e){console.error('invalid supabase workspace',e);return reply({error:'Os dados guardados não são compatíveis com esta versão.'},500)}
}

async function putSupabase(request:Request,body:{records:unknown;revision:number}){
 const token=bearer(request);if(!token)return reply({error:'Inicia sessão no Vigia Cloud.'},401);
 const user=await supabaseUser(token);if(!user)return reply({error:'Sessão terminada. Volta a iniciar sessão.'},401);
 const parsed=recordsSchema.safeParse(body.records);if(!parsed.success)return reply({error:parsed.error.issues[0].message},400);
 const read=await rest(token,`workspace_snapshots?select=records,activity,revision&user_id=eq.${encodeURIComponent(user.id)}&limit=1`,{headers:{Accept:'application/json'}});
 if(!read.ok)return reply({error:'Não foi possível validar a versão guardada.'},503);
 const rows=await read.json() as {records:Records;activity:Activity[];revision:number}[];
 const current=rows[0];
 if((current?.revision??0)!==body.revision)return reply({error:'Os dados foram alterados noutra janela. Atualiza a lista antes de guardar novamente.'},409);
 const prev=current?{records:recordsSchema.parse(current.records),activity:Array.isArray(current.activity)?current.activity:[]}:{records:emptyRecords,activity:[]};
 const data=buildData(prev,parsed.data);const nextRevision=body.revision+1;
 if(current){
   const r=await rest(token,`workspace_snapshots?user_id=eq.${encodeURIComponent(user.id)}&revision=eq.${body.revision}`,{method:'PATCH',headers:{'Content-Type':'application/json',Prefer:'return=representation'},body:JSON.stringify({...data,revision:nextRevision,updated_at:new Date().toISOString()})});
   const changed=await r.json().catch(()=>[]) as unknown[];if(!r.ok||!changed.length)return reply({error:'Outro pedido alterou os dados. Atualiza antes de voltar a guardar.'},409);
 }else{
   const r=await rest(token,'workspace_snapshots',{method:'POST',headers:{'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify({user_id:user.id,...data,revision:nextRevision})});
   if(!r.ok){if(r.status===409)return reply({error:'Outro pedido criou os dados. Atualiza antes de voltar a guardar.'},409);console.error('supabase workspace insert failed',await r.text());return reply({error:'Não foi possível guardar. Os campos foram mantidos para tentares novamente.'},503)}
 }
 return reply({...data,revision:nextRevision});
}

export async function GET(request:Request){
 if(useSupabaseBackend())return getSupabase(request);
 const user=await getChatGPTUser();if(!user)return reply({error:'Inicia sessão para abrir o teu espaço privado.'},401);
 try{const row=await workspaceDb().prepare('SELECT data, revision FROM workspaces WHERE owner_id = ?').bind(user.userId).first<{data:string;revision:number}>();return reply(row?{...JSON.parse(row.data),records:recordsSchema.parse(JSON.parse(row.data).records),revision:row.revision}:{records:emptyRecords,revision:0,activity:[]});}catch(e){console.error('workspace read failed',e);return reply({error:'Não foi possível carregar os registos. Tenta novamente.'},503)}
}

export async function PUT(request:Request){
 if(request.headers.get('sec-fetch-site')==='cross-site')return reply({error:'Origem não permitida.'},403);
 const origin=request.headers.get('origin');if(origin&&origin!==new URL(request.url).origin)return reply({error:'Origem não permitida.'},403);
 let body:{records:unknown;revision:number};try{const raw=await request.text();if(raw.length>1500000)return reply({error:'O espaço excede o limite desta versão.'},413);body=JSON.parse(raw)}catch{return reply({error:'Pedido inválido.'},400)}
 if(!Number.isSafeInteger(body?.revision)||body.revision<0)return reply({error:'Versão inválida.'},400);
 if(useSupabaseBackend())return putSupabase(request,body);
 const user=await getChatGPTUser();if(!user)return reply({error:'Sessão terminada. Volta a iniciar sessão.'},401);
 const parsed=recordsSchema.safeParse(body.records);if(!parsed.success)return reply({error:parsed.error.issues[0].message},400);
 try{const db=workspaceDb();const row=await db.prepare('SELECT data, revision FROM workspaces WHERE owner_id = ?').bind(user.userId).first<{data:string;revision:number}>();if((row?.revision??0)!==body.revision)return reply({error:'Os dados foram alterados noutra janela. Atualiza a lista antes de guardar novamente.'},409);const prev:{records:Records;activity:Activity[]}=row?JSON.parse(row.data):{records:emptyRecords,activity:[]};prev.records=recordsSchema.parse(prev.records);const data=buildData(prev,parsed.data);const now=new Date().toISOString();const result=row?await db.prepare('UPDATE workspaces SET data = ?, revision = revision + 1, updated_at = ? WHERE owner_id = ? AND revision = ?').bind(JSON.stringify(data),now,user.userId,body.revision).run():await db.prepare('INSERT INTO workspaces (owner_id,data,revision,updated_at) VALUES (?,?,1,?) ON CONFLICT(owner_id) DO NOTHING').bind(user.userId,JSON.stringify(data),now).run();if(result.meta.changes!==1)return reply({error:'Outro pedido alterou os dados. Atualiza antes de voltar a guardar.'},409);return reply({...data,revision:body.revision+1})}catch(e){console.error('workspace write failed',e);return reply({error:'Não foi possível guardar. Os campos foram mantidos para tentares novamente.'},503)}
}
