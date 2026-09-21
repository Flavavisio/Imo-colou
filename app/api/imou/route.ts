import {getChatGPTUser} from '@/app/chatgpt-auth';
import {imouRequestSchema,listImouDevices,ImouError} from '@/lib/imou';
export const dynamic='force-dynamic';
const reply=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
export async function POST(request:Request){
 if(!await getChatGPTUser())return reply({error:'Inicia sessão para consultar a Imou.'},401);
 if(request.headers.get('sec-fetch-site')==='cross-site'||request.headers.get('origin')!==new URL(request.url).origin)return reply({error:'Origem não permitida.'},403);
 let body;try{const raw=await request.text();if(raw.length>4096)return reply({error:'Pedido demasiado grande.'},413);body=JSON.parse(raw);}catch{return reply({error:'Pedido inválido.'},400);}
 const parsed=imouRequestSchema.safeParse(body);if(!parsed.success)return reply({error:'Preenche o App ID, App Secret e região válidos.'},400);
 try{return reply(await listImouDevices(parsed.data));}
 catch(e){return reply({error:e instanceof ImouError?e.message:'Não foi possível consultar a Imou.'},502);}
}
