import { z } from 'zod';
const id=z.string().uuid('Seleciona uma associação válida.');
const name=z.string().trim().min(2,'O nome deve ter pelo menos 2 caracteres.').max(100);
const short=z.string().trim().max(150);
const status=z.enum(['active','paused']);
const base={id,name,status};
const optionalId=z.union([id,z.literal('')]);
const money=z.number().min(0).max(100000);
const date=z.union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v=>{const d=new Date(v);return !isNaN(d.getTime())&&d.toISOString().slice(0,10)===v},'Data inválida.'),z.literal('')]);
const privateIPv4=z.string().refine(v=>{const a=v.split('.');if(a.length!==4||a.some(n=>!/^\d{1,3}$/.test(n)||Number(n)>255||String(Number(n))!==n))return false;const n=a.map(Number);return n[0]===10||(n[0]===172&&n[1]>=16&&n[1]<=31)||(n[0]===192&&n[1]===168)},'Indica um IPv4 privado válido, por exemplo 192.168.1.50.');
const localPath=z.string().max(300).refine(v=>v===''||(v.startsWith('/')&&!/[\s@\\]|:\/\/|(?:[?&])(?:user(?:name)?|pass(?:word)?|pwd|token|auth)=/i.test(v)),'Usa apenas o caminho RTSP, sem credenciais.');
export const localReportSchema=z.object({format:z.literal('vigia-local-report-v1'),cameraId:id,host:privateIPv4,port:z.number().int().min(1).max(65535),path:localPath,checkedAt:z.string().datetime().refine(v=>Date.parse(v)<=Date.now()+300000,'A data do teste está no futuro.'),status:z.enum(['stream_found','failed','tool_missing']),reason:z.enum(['connection_failed','ffprobe_missing','ffprobe_update_required','stream_detected','timeout','probe_failed']),codec:z.enum(['H.264','H.265','other','unknown']),width:z.number().int().min(0).max(32768),height:z.number().int().min(0).max(32768)}).strict().superRefine((r,ctx)=>{if(r.status==='stream_found'&&(r.reason!=='stream_detected'||!r.width||!r.height||r.codec==='unknown'))ctx.addIssue({code:z.ZodIssueCode.custom,message:'Relatório de vídeo incompleto.'})});
export const schemas={
 cameraPlans:z.object({...base,retention:z.number().int().min(1).max(365),price:money,maxResolution:z.enum(['1080p','2K','4K']),maxClipSeconds:z.number().int().min(5).max(600),monthlyGB:z.number().min(0.1).max(10000),original:z.boolean()}),
 plans:z.object({...base,retention:z.number().int().min(1).max(365),cameraLimit:z.number().int().min(1).max(100000),price:z.number().min(0).max(100000),original:z.boolean()}),
 resellers:z.object({...base,email:z.string().trim().email('Email inválido.').max(200),phone:short,planId:z.union([id,z.literal('')]),brand:name,color:z.string().regex(/^#[0-9a-fA-F]{6}$/),support:z.union([z.string().email().max(200),z.literal('')]),logoId:optionalId.default(''),walletLimit:z.number().int().min(1).max(100000).nullable().default(null),licenseMode:z.enum(['paid','trial']).default('paid'),validUntil:date.default(''),trialCameraLimit:z.number().int().min(1).max(1000).default(2),salePrices:z.record(id,money).default({})}),
 clients:z.object({...base,resellerId:id,email:z.string().trim().email('Email inválido.').max(200),phone:short}),
 locations:z.object({...base,clientId:id,address:z.string().trim().max(300)}),
 cameras:z.object({...base,locationId:id,manufacturer:short,model:short,codec:z.enum(['auto','H.264','H.265']),eventType:z.enum(['motion','person','vehicle']),notes:z.string().trim().max(500),cameraPlanId:optionalId.default(''),salePrice:money.nullable().default(null),imouDeviceId:z.string().trim().regex(/^[a-zA-Z0-9_-]{0,100}$/).default(''),imouChannelId:z.string().trim().regex(/^[a-zA-Z0-9_-]{1,100}$/).default('0'),connectionMode:z.enum(['imou','local']).default('imou'),localHost:z.union([privateIPv4,z.literal('')]).default(''),rtspPort:z.number().int().min(1).max(65535).default(554),rtspPath:localPath.default(''),localTest:localReportSchema.nullable().default(null)})
};
export type Kind=keyof typeof schemas;
export type Plan=z.infer<typeof schemas.plans>;export type Reseller=z.infer<typeof schemas.resellers>;export type Client=z.infer<typeof schemas.clients>;export type Location=z.infer<typeof schemas.locations>;export type CameraRecord=z.infer<typeof schemas.cameras>;
export type CameraPlan=z.infer<typeof schemas.cameraPlans>;
export type Records={cameraPlans:CameraPlan[];plans:Plan[];resellers:Reseller[];clients:Client[];locations:Location[];cameras:CameraRecord[]};
export const emptyRecords:Records={cameraPlans:[],plans:[],resellers:[],clients:[],locations:[],cameras:[]};
export const recordsSchema=z.object({cameraPlans:z.array(schemas.cameraPlans).max(100).default([]),plans:z.array(schemas.plans).max(100),resellers:z.array(schemas.resellers).max(500),clients:z.array(schemas.clients).max(2000),locations:z.array(schemas.locations).max(4000),cameras:z.array(schemas.cameras).max(10000)}).strict().superRefine((d,ctx)=>{
 const fail=(message:string)=>ctx.addIssue({code:z.ZodIssueCode.custom,message});
 for(const k of Object.keys(d) as Kind[]){if(new Set(d[k].map(v=>v.id)).size!==d[k].length)fail('Existem identificadores duplicados.');}
 for(const r of d.resellers)if(r.planId&&!d.plans.some(p=>p.id===r.planId))fail('O plano está associado a um revendedor e não pode ser eliminado.');
 for(const c of d.clients)if(!d.resellers.some(r=>r.id===c.resellerId))fail('Cada cliente precisa de um revendedor existente.');
 for(const l of d.locations)if(!d.clients.some(c=>c.id===l.clientId))fail('Cada instalação precisa de um cliente existente.');
 for(const c of d.cameras)if(!d.locations.some(l=>l.id===c.locationId))fail('Cada câmara precisa de uma instalação existente.');
 const imouKeys=d.cameras.filter(c=>c.connectionMode==='imou'&&c.imouDeviceId).map(c=>c.imouDeviceId+':'+c.imouChannelId);if(new Set(imouKeys).size!==imouKeys.length)fail('Este equipamento e canal Imou já estão associados a outra câmara.');
 for(const c of d.cameras){if(c.connectionMode==='local'&&(!c.localHost||!c.rtspPath))fail('Para rede local, indica o IP e o caminho RTSP.');if(c.localTest&&(c.connectionMode!=='local'||c.localTest.cameraId!==c.id||c.localTest.host!==c.localHost||c.localTest.port!==c.rtspPort||c.localTest.path!==c.rtspPath))fail('O relatório não corresponde à configuração atual da câmara.');}
 for(const c of d.cameras)if(c.cameraPlanId&&!d.cameraPlans.some(p=>p.id===c.cameraPlanId))fail('O plano de câmara está associado a um equipamento e não pode ser eliminado.');
 for(const r of d.resellers){
 if(r.licenseMode==='trial'&&!r.validUntil)fail('Define a data de fim do trial.');
 if(Object.keys(r.salePrices).some(id=>!d.cameraPlans.some(p=>p.id===id)))fail('Existe um preço de revenda associado a um plano inexistente. Remove primeiro esse preço.');
 const p=d.plans.find(p=>p.id===r.planId);const limit=r.licenseMode==='trial'?r.trialCameraLimit:r.walletLimit??p?.cameraLimit;
 if(limit===undefined)continue;
 const cs=new Set(d.clients.filter(c=>c.resellerId===r.id).map(c=>c.id));const ls=new Set(d.locations.filter(l=>cs.has(l.clientId)).map(l=>l.id));
 if(d.cameras.filter(c=>ls.has(c.locationId)).length>limit)fail(`O revendedor ${r.name} ultrapassa o limite de ${limit} câmaras da carteira.`);
 }

});
export type Activity={at:string;text:string};
export type Workspace={records:Records;revision:number;activity:Activity[]};
export const kindNames:Record<Kind,string>={cameraPlans:'planos por câmara',plans:'planos',resellers:'revendedores',clients:'clientes',locations:'instalações',cameras:'câmaras'};
