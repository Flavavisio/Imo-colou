import {getChatGPTUser} from '@/app/chatgpt-auth';
import {workspaceDb} from '@/lib/workspace-db';
import {emptyRecords,recordsSchema,kindNames,type Kind,type Activity,type Records} from '@/lib/model';
export const dynamic='force-dynamic';
const reply=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
export async function GET(){
 const user=await getChatGPTUser();if(!user)return reply({error:'Inicia sessão para abrir o teu espaço privado.'},401);
 try{const row=await workspaceDb().prepare('SELECT data, revision FROM workspaces WHERE owner_id = ?').bind(user.userId).first<{data:string;revision:number}>();
 return reply(row?{...JSON.parse(row.data),records:recordsSchema.parse(JSON.parse(row.data).records),revision:row.revision}:{records:emptyRecords,revision:0,activity:[]});
 }catch(e){console.error('workspace read failed',e);return reply({error:'Não foi possível carregar os registos. Tenta novamente.'},503);}
}
export async function PUT(request:Request){
 const user=await getChatGPTUser();if(!user)return reply({error:'Sessão terminada. Volta a iniciar sessão.'},401);
 if(request.headers.get('sec-fetch-site')==='cross-site')return reply({error:'Origem não permitida.'},403);
 const origin=request.headers.get('origin');if(origin&&origin!==new URL(request.url).origin)return reply({error:'Origem não permitida.'},403);
 let body;try{const raw=await request.text();if(raw.length>1500000)return reply({error:'O espaço excede o limite desta versão.'},413);body=JSON.parse(raw);}catch{return reply({error:'Pedido inválido.'},400);}
 if(!Number.isSafeInteger(body?.revision)||body.revision<0)return reply({error:'Versão inválida.'},400);
 const parsed=recordsSchema.safeParse(body.records);if(!parsed.success)return reply({error:parsed.error.issues[0].message},400);
 try{const db=workspaceDb();const row=await db.prepare('SELECT data, revision FROM workspaces WHERE owner_id = ?').bind(user.userId).first<{data:string;revision:number}>();
 if((row?.revision??0)!==body.revision)return reply({error:'Os dados foram alterados noutra janela. Atualiza a lista antes de guardar novamente.'},409);
 const prev: {records:Records;activity:Activity[]}=row?JSON.parse(row.data):{records:emptyRecords,activity:[]};
 prev.records=recordsSchema.parse(prev.records);
 const now=new Date().toISOString();const changes:Activity[]=[];
 for(const k of Object.keys(kindNames) as Kind[]){const before=new Map(prev.records[k].map(r=>[r.id,JSON.stringify(r)]));const after=new Map(parsed.data[k].map(r=>[r.id,JSON.stringify(r)]));const added=parsed.data[k].filter(r=>!before.has(r.id)).length;const changed=parsed.data[k].filter(r=>before.has(r.id)&&before.get(r.id)!==JSON.stringify(r)).length;const removed=prev.records[k].filter(r=>!after.has(r.id)).length;if(added||changed||removed)changes.push({at:now,text:`${kindNames[k]}: ${added} criados, ${changed} alterados, ${removed} eliminados`});}
 const data={records:parsed.data,activity:[...changes,...prev.activity].slice(0,80)};
 const result=row?await db.prepare('UPDATE workspaces SET data = ?, revision = revision + 1, updated_at = ? WHERE owner_id = ? AND revision = ?').bind(JSON.stringify(data),now,user.userId,body.revision).run():await db.prepare('INSERT INTO workspaces (owner_id,data,revision,updated_at) VALUES (?,?,1,?) ON CONFLICT(owner_id) DO NOTHING').bind(user.userId,JSON.stringify(data),now).run();
 if(result.meta.changes!==1)return reply({error:'Outro pedido alterou os dados. Atualiza antes de voltar a guardar.'},409);
 return reply({...data,revision:body.revision+1});
 }catch(e){console.error('workspace write failed',e);return reply({error:'Não foi possível guardar. Os campos foram mantidos para tentares novamente.'},503);}
}
