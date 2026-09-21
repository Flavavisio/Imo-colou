import {z} from 'zod';
export const imouRequestSchema=z.object({appId:z.string().trim().min(1).max(200),appSecret:z.string().min(1).max(300),region:z.enum(['eu','us','sg']),page:z.number().int().min(1).max(1000).default(1)}).strict();
export const hosts={eu:'openapi-fk.easy4ip.com',us:'openapi-or.easy4ip.com',sg:'openapi-sg.easy4ip.com'};
export type ImouDevice={id:string;name:string;model:string;status:'online'|'offline'|'unknown';channels:{id:string;name:string}[]};
export async function imouSign(secret:string,time:number,nonce:string){
 const enc=new TextEncoder();
 const digest=await crypto.subtle.digest('SHA-256',enc.encode(secret));
 const password=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
 const key=await crypto.subtle.importKey('raw',enc.encode(password),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 const signature=await crypto.subtle.sign('HMAC',key,enc.encode(`time:${time},nonce:${nonce},appSecret:${secret}`));
 return btoa(String.fromCharCode(...new Uint8Array(signature)));
}
export class ImouError extends Error {}
const identifier=z.union([z.string(),z.number()]).transform(String).pipe(z.string().regex(/^[a-zA-Z0-9_-]{1,100}$/));
const deviceSchema=z.object({deviceId:identifier,deviceName:z.string().max(150).optional(),deviceModel:z.string().max(150).optional(),deviceStatus:z.union([z.string(),z.number()]).optional(),channelList:z.array(z.object({channelId:identifier,channelName:z.string().max(150).optional()})).max(256).optional()});
export async function listImouDevices(input:z.infer<typeof imouRequestSchema>,fetcher:typeof fetch=fetch){
 let host:string=hosts[input.region];
 async function call(method:string,params:Record<string,unknown>){
  const time=Math.floor(Date.now()/1000),nonce=crypto.randomUUID();
  const body={system:{ver:'1.0',appId:input.appId,time,nonce,sign:await imouSign(input.appSecret,time,nonce)},id:crypto.randomUUID(),params};
  let response:Response;
  try{response=await fetcher(`https://${host}/openapi/${method}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),redirect:'error',signal:AbortSignal.timeout(15000)});}
  catch{throw new ImouError('Não foi possível contactar a Imou. Tenta novamente.');}
  if(!response.ok)throw new ImouError('A Imou não aceitou o pedido. Confirma a região e a disponibilidade do serviço.');
  const raw=await response.text();if(raw.length>1000000)throw new ImouError('Resposta Imou demasiado grande.');
  let result;try{result=JSON.parse(raw)?.result;}catch{throw new ImouError('Resposta Imou inválida.');}
  if(String(result?.code)!=='0'){
   if(['SN1001','SN1004'].includes(String(result?.code)))throw new ImouError('App ID ou App Secret recusados. Confirma os dados da aplicação Imou.');
   throw new ImouError('Pedido recusado pela Imou. Verifica as permissões e a quota no portal.');
  }
  if(!result.data||typeof result.data!=='object')throw new ImouError('Resposta Imou incompleta.');
  return result.data;
 }
 const auth=await call('accessToken',{});
 if(typeof auth.accessToken!=='string'||!auth.accessToken||auth.accessToken.length>4096)throw new ImouError('A Imou não devolveu um token válido.');
 if(auth.currentDomain){
  let url;try{url=new URL(auth.currentDomain.includes('://')?auth.currentDomain:`https://${auth.currentDomain}`);}catch{throw new ImouError('Região devolvida pela Imou inválida.');}
  if(url.protocol!=='https:'||url.username||url.password||!Object.values(hosts).includes(url.hostname)||url.port&&url.port!=='443')throw new ImouError('Região devolvida pela Imou não suportada.');
  host=url.hostname;
 }
 const data=await call('listDeviceDetailsByPage',{token:auth.accessToken,page:input.page,pageSize:20});
 const parsed=z.array(deviceSchema).max(20).safeParse(data.deviceList??[]);
 if(!parsed.success)throw new ImouError('A lista de equipamentos tem um formato não suportado.');
 const devices:ImouDevice[]=parsed.data.map(d=>({id:d.deviceId,name:d.deviceName||d.deviceId,model:d.deviceModel||'',status:String(d.deviceStatus)==='1'?'online':String(d.deviceStatus)==='0'?'offline':'unknown',channels:(d.channelList??[]).map(c=>({id:c.channelId,name:c.channelName||`Canal ${c.channelId}`}))}));
 return {devices,page:input.page,hasMore:devices.length===20,checkedAt:new Date().toISOString()};
}
