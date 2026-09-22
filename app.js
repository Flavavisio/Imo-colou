(() => {
'use strict';

const C={
 url:'https://tegwpmtylwivktuuktpo.supabase.co',
 key:'sb_publishable_MSOYCL_soqmg4TGzRi3VVw_3lTtBcxo',
 admin:'flavio.rosa87@icloud.com',
 store:'vigia_session_v2'
};
const EMPTY={cameraPlans:[],plans:[],resellers:[],clients:[],locations:[],cameras:[]};
const S={session:null,user:null,access:null,ws:{records:structuredClone(EMPTY),revision:0,activity:[]},hasSnapshot:false,page:'Visão geral',search:'',filter:'all',side:false};
const NAV=[['Visão geral','▦'],['Revendedores','▣'],['Clientes','◉'],['Utilizadores','◎'],['Instalações','⌖'],['Câmaras','◉'],['Ligações','↔'],['Planos','◇'],['Planos por câmara','◇'],['Carteiras e preços','▤'],['Licenças','□'],['Alertas','!'],['Eventos','▶'],['Marca própria','●'],['Armazenamento','▥']];
const KIND={'Revendedores':'resellers','Clientes':'clients','Instalações':'locations','Câmaras':'cameras','Planos':'plans','Planos por câmara':'cameraPlans'};
const LABEL={resellers:'revendedor',clients:'cliente',locations:'instalação',cameras:'câmara',plans:'plano',cameraPlans:'plano por câmara'};
const $=q=>document.querySelector(q), $$=q=>[...document.querySelectorAll(q)];
const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const id=()=>crypto.randomUUID();
const euro=v=>new Intl.NumberFormat('pt-PT',{style:'currency',currency:'EUR'}).format(Number(v||0));
const nowDate=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Lisbon',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const dt=v=>new Intl.DateTimeFormat('pt-PT',{dateStyle:'short',timeStyle:'short'}).format(new Date(v));
const icon=n=>({shield:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 13c0 5-3.5 7.5-8 9-4.5-1.5-8-4-8-9V5l8-3 8 3v8Z"/><path d="m9 12 2 2 4-4"/></svg>',search:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>',plus:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>',edit:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>',trash:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v5M14 11v5"/></svg>',cloud:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.5 19H9a7 7 0 1 1 6.7-9h1.8a4.5 4.5 0 1 1 0 9Z"/></svg>',refresh:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 7h-5V2M4 17h5v5"/><path d="M6 8A8 8 0 0 1 20 7l-5-5M18 16A8 8 0 0 1 4 17l5 5"/></svg>',menu:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg>',download:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></svg>',upload:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21V9M7 14l5-5 5 5M5 3h14"/></svg>',x:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m18 6-12 12M6 6l12 12"/></svg>',camera:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.5 4 16 6h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3l1.5-2h5Z"/><circle cx="12" cy="13" r="3"/></svg>',db:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.7 4 3 9 3s9-1.3 9-3V5M3 12c0 1.7 4 3 9 3s9-1.3 9-3"/></svg>'}[n]||'');

function toast(text,type=''){let box=$('.toasts');if(!box){box=document.createElement('div');box.className='toasts';document.body.appendChild(box)}const t=document.createElement('div');t.className='toast '+type;t.textContent=text;box.appendChild(t);setTimeout(()=>t.remove(),3500)}
function storeSession(x){S.session=x;localStorage.setItem(C.store,JSON.stringify(x))}
function clearSession(){S.session=null;S.user=null;localStorage.removeItem(C.store)}
function getStored(){try{return JSON.parse(localStorage.getItem(C.store)||'null')}catch{return null}}

async function auth(path,opt={}){
 const r=await fetch(C.url+'/auth/v1'+path,{...opt,headers:{apikey:C.key,'Content-Type':'application/json',...(opt.headers||{})}});
 const j=await r.json().catch(()=>({})); if(!r.ok) throw Error(j.msg||j.message||j.error_description||'Erro de autenticação.'); return j;
}
async function login(email,password){const s=await auth('/token?grant_type=password',{method:'POST',body:JSON.stringify({email,password})});s.expires_at=Math.floor(Date.now()/1000)+(s.expires_in||3600);storeSession(s)}
async function refresh(){const old=S.session||getStored();if(!old?.refresh_token)throw Error('Sessão terminada.');const s=await auth('/token?grant_type=refresh_token',{method:'POST',body:JSON.stringify({refresh_token:old.refresh_token})});s.expires_at=Math.floor(Date.now()/1000)+(s.expires_in||3600);storeSession(s)}
async function session(){
 let s=getStored();if(!s)return false;S.session=s;if(s.expires_at&&s.expires_at-Date.now()/1000<90)try{await refresh();s=S.session}catch{clearSession();return false}
 let r=await fetch(C.url+'/auth/v1/user',{headers:{apikey:C.key,Authorization:'Bearer '+s.access_token}});
 if(r.status===401){try{await refresh();s=S.session;r=await fetch(C.url+'/auth/v1/user',{headers:{apikey:C.key,Authorization:'Bearer '+s.access_token}})}catch{clearSession();return false}}
 if(!r.ok){clearSession();return false}S.user=await r.json();return true;
}
async function rest(path,opt={}){
 if(!S.session)throw Error('Sessão terminada.');
 let headers={apikey:C.key,Authorization:'Bearer '+S.session.access_token,'Content-Type':'application/json',...(opt.headers||{})};
 let r=await fetch(C.url+'/rest/v1/'+path,{...opt,headers});
 if(r.status===401){await refresh();headers.Authorization='Bearer '+S.session.access_token;r=await fetch(C.url+'/rest/v1/'+path,{...opt,headers})}
 return r;
}
async function invokeFunction(name,body){
 if(!S.session)throw Error('Sessão terminada.');
 let headers={apikey:C.key,Authorization:'Bearer '+S.session.access_token,'Content-Type':'application/json'};
 let r=await fetch(C.url+'/functions/v1/'+name,{method:'POST',headers,body:JSON.stringify(body)});
 if(r.status===401){
  await refresh();
  headers.Authorization='Bearer '+S.session.access_token;
  r=await fetch(C.url+'/functions/v1/'+name,{method:'POST',headers,body:JSON.stringify(body)});
 }
 const j=await r.json().catch(()=>({}));
 if(!r.ok)throw Error(j.error||j.message||'Erro na função Supabase.');
 return j;
}
async function readAccess(path){
 const r=await rest(path),j=await r.json().catch(()=>[]);
 if(!r.ok)throw Error(j.message||j.hint||'Não foi possível validar as permissões.');
 return j;
}
async function resolveAccess(){
 const uid=encodeURIComponent(S.user.id);
 const pa=await readAccess('platform_admins?user_id=eq.'+uid+'&select=user_id');
 if(pa.length){S.access={type:'platform',role:'super_admin'};return S.access}
 const rm=await readAccess('reseller_members?user_id=eq.'+uid+'&select=reseller_id,role,created_at&order=created_at.asc');
 if(rm.length){
  const rank={owner:0,admin:1,operator:2,viewer:3};rm.sort((a,b)=>(rank[a.role]??9)-(rank[b.role]??9));
  S.access={type:'reseller',role:rm[0].role,resellerId:rm[0].reseller_id};return S.access;
 }
 const cm=await readAccess('client_members?user_id=eq.'+uid+'&select=client_id,reseller_id,role,created_at&order=created_at.asc');
 if(cm.length){
  const rank={owner:0,admin:1,viewer:2};cm.sort((a,b)=>(rank[a.role]??9)-(rank[b.role]??9));
  S.access={type:'client',role:cm[0].role,clientId:cm[0].client_id,resellerId:cm[0].reseller_id};return S.access;
 }
 throw Error('A conta está ativa, mas ainda não foi associada a um Revendedor ou Cliente.');
}
function accessLabel(){
 if(S.access?.type==='platform')return 'SUPER ADMIN';
 if(S.access?.type==='reseller')return 'REVENDEDOR · '+String(S.access.role||'').toUpperCase();
 if(S.access?.type==='client')return 'CLIENTE';
 return 'UTILIZADOR';
}
function navForAccess(){
 if(S.access?.type==='platform')return NAV;
 const allowed=S.access?.type==='reseller'
  ? new Set(['Visão geral','Clientes','Instalações','Câmaras','Ligações','Carteiras e preços','Licenças','Alertas','Eventos','Marca própria','Armazenamento'])
  : new Set(['Visão geral','Instalações','Câmaras','Alertas','Eventos','Armazenamento']);
 if(canManageUsers())allowed.add('Utilizadores');
 return NAV.filter(([name])=>allowed.has(name));
}
function canMutate(kind){
 if(S.access?.type==='platform')return true;
 if(S.access?.type==='reseller'){
  if(['owner','admin'].includes(S.access.role))return ['resellers','clients','locations','cameras'].includes(kind);
  if(S.access.role==='operator')return ['locations','cameras'].includes(kind);
 }
 return false;
}
function canManageUsers(){return S.access?.type==='platform'||(S.access?.type==='reseller'&&['owner','admin'].includes(S.access.role));}
const n=v=>v===null||v===undefined||v===''?null:Number(v);
const slugify=v=>String(v||'revendedor').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,42)||'revendedor';
async function table(path){
 const r=await rest(path),j=await r.json().catch(()=>[]);
 if(!r.ok)throw Error(j.message||j.hint||'Erro ao carregar dados do Supabase.');
 return j;
}
async function load(){
 const [plans,cameraPlans,resellers,prices,clients,locations,cameras,activity]=await Promise.all([
  table('plans?select=*&order=created_at.asc'),
  table('camera_plans?select=*&order=created_at.asc'),
  table('resellers?select=*&order=created_at.asc'),
  table('reseller_sale_prices?select=*&order=created_at.asc'),
  table('clients?select=*&order=created_at.asc'),
  table('installations?select=*&order=created_at.asc'),
  table('cameras?select=*&order=created_at.asc'),
  table('activity_log?select=id,reseller_id,entity_type,entity_id,action,detail,created_at&order=created_at.desc&limit=80')
 ]);
 const saleByReseller={};
 for(const p of prices)(saleByReseller[p.reseller_id]??={})[p.camera_plan_id]=Number(p.price||0);
 const records={
  plans:plans.map(x=>({id:x.id,name:x.name,status:x.status,retention:Number(x.retention),cameraLimit:Number(x.camera_limit),price:Number(x.price),original:Boolean(x.original)})),
  cameraPlans:cameraPlans.map(x=>({id:x.id,name:x.name,status:x.status,retention:Number(x.retention),price:Number(x.price),maxResolution:x.max_resolution,maxClipSeconds:Number(x.max_clip_seconds),monthlyGB:Number(x.monthly_gb),original:Boolean(x.original)})),
  resellers:resellers.map(x=>({id:x.id,name:x.name,status:x.status,email:x.email||'',phone:x.phone||'',planId:x.plan_id||'',brand:x.brand||x.name,color:x.color||x.primary_color||'#2563eb',support:x.support||'',logoId:x.logo_id||'',walletLimit:x.wallet_limit===null?null:Number(x.wallet_limit),licenseMode:x.license_mode||'paid',validUntil:x.valid_until||'',trialCameraLimit:Number(x.trial_camera_limit||2),salePrices:saleByReseller[x.id]||{},slug:x.slug||'',logoUrl:x.logo_url||''})),
  clients:clients.map(x=>({id:x.id,name:x.name,status:x.status,email:x.email||'',phone:x.phone||'',resellerId:x.reseller_id,code:x.code||''})),
  locations:locations.map(x=>({id:x.id,name:x.name,status:x.status,clientId:x.client_id,address:x.address||'',postalCode:x.postal_code||'',city:x.city||'',country:x.country||'PT'})),
  cameras:cameras.map(x=>({id:x.id,name:x.name,status:x.status,locationId:x.installation_id,manufacturer:x.manufacturer||'',model:x.model||'',codec:x.codec||'auto',eventType:x.event_type||'motion',notes:x.notes||'',cameraPlanId:x.camera_plan_id||'',salePrice:x.sale_price===null?null:Number(x.sale_price),imouDeviceId:x.external_device_id||'',imouChannelId:x.external_channel_id||'0',connectionMode:x.connection_mode||'imou',localHost:x.local_host||'',rtspPort:Number(x.rtsp_port||554),rtspPath:x.rtsp_path||'',localTest:x.local_test||null}))
 };
 S.hasSnapshot=false;
 S.ws={records,revision:0,activity:activity.map(a=>({at:a.created_at,text:a.detail||((a.entity_type||'registo')+': '+(a.action||'alterado'))}))};
}
function diff(before,after){
 const names={cameraPlans:'planos por câmara',plans:'planos',resellers:'revendedores',clients:'clientes',locations:'instalações',cameras:'câmaras'},out=[];
 for(const k of Object.keys(names)){
  const b=new Map(before[k].map(x=>[x.id,JSON.stringify(x)])),a=new Map(after[k].map(x=>[x.id,JSON.stringify(x)]));
  for(const x of after[k])if(!b.has(x.id))out.push({kind:k,id:x.id,action:'created',detail:names[k]+': '+x.name+' criado'});
  else if(b.get(x.id)!==JSON.stringify(x))out.push({kind:k,id:x.id,action:'updated',detail:names[k]+': '+x.name+' alterado'});
  for(const x of before[k])if(!a.has(x.id))out.push({kind:k,id:x.id,action:'deleted',detail:names[k]+': '+x.name+' eliminado'});
 }
 return out;
}
function validate(d){
 for(const k of Object.keys(EMPTY))if(!Array.isArray(d[k]))throw Error('Estrutura de dados inválida.');
 for(const k of Object.keys(EMPTY))if(new Set(d[k].map(x=>x.id)).size!==d[k].length)throw Error('Existem identificadores duplicados.');
 for(const r of d.resellers){if(r.planId&&!d.plans.some(p=>p.id===r.planId))throw Error('Plano de revendedor inválido.');if(r.licenseMode==='trial'&&!r.validUntil)throw Error('Define a data de fim do trial.')}
 for(const c of d.clients)if(!d.resellers.some(r=>r.id===c.resellerId))throw Error('Cada cliente precisa de um revendedor.');
 for(const l of d.locations)if(!d.clients.some(c=>c.id===l.clientId))throw Error('Cada instalação precisa de um cliente.');
 for(const c of d.cameras){if(!d.locations.some(l=>l.id===c.locationId))throw Error('Cada câmara precisa de uma instalação.');if(c.connectionMode==='local'&&(!c.localHost||!c.rtspPath))throw Error('Para rede local indica IP e caminho RTSP.');if(c.cameraPlanId&&!d.cameraPlans.some(p=>p.id===c.cameraPlanId))throw Error('Plano de câmara inválido.')}
 const keys=d.cameras.filter(c=>c.connectionMode==='imou'&&c.imouDeviceId).map(c=>c.imouDeviceId+':'+c.imouChannelId);if(new Set(keys).size!==keys.length)throw Error('Device ID + canal Imou já associado.');
 for(const r of d.resellers){
  const p=d.plans.find(p=>p.id===r.planId),limit=r.licenseMode==='trial'?Number(r.trialCameraLimit||2):(r.walletLimit??p?.cameraLimit);
  if(limit===null||limit===undefined)continue;
  const cs=new Set(d.clients.filter(c=>c.resellerId===r.id).map(c=>c.id)),ls=new Set(d.locations.filter(l=>cs.has(l.clientId)).map(l=>l.id));
  if(d.cameras.filter(c=>ls.has(c.locationId)).length>Number(limit))throw Error('O revendedor '+r.name+' ultrapassa o limite de '+limit+' câmaras.');
 }
}
function resellerOf(kind,row,records){
 if(kind==='resellers')return row.id;
 if(kind==='clients')return row.resellerId;
 if(kind==='locations')return records.clients.find(c=>c.id===row.clientId)?.resellerId||null;
 if(kind==='cameras'){const l=records.locations.find(l=>l.id===row.locationId);return records.clients.find(c=>c.id===l?.clientId)?.resellerId||null}
 return null;
}
function toDb(kind,x,records){
 const stamp=new Date().toISOString();
 if(kind==='plans')return {id:x.id,name:x.name,status:x.status,retention:Number(x.retention),camera_limit:Number(x.cameraLimit),price:Number(x.price||0),original:Boolean(x.original),updated_at:stamp};
 if(kind==='cameraPlans')return {id:x.id,name:x.name,status:x.status,retention:Number(x.retention),price:Number(x.price||0),max_resolution:x.maxResolution,max_clip_seconds:Number(x.maxClipSeconds),monthly_gb:Number(x.monthlyGB),original:Boolean(x.original),updated_at:stamp};
 if(kind==='resellers')return {id:x.id,name:x.name,slug:x.slug||slugify(x.name)+'-'+x.id.slice(0,8),email:x.email||null,phone:x.phone||'',plan_id:x.planId||null,brand:x.brand||x.name,color:x.color||'#2563eb',primary_color:x.color||'#2563eb',secondary_color:null,support:x.support||'',logo_id:x.logoId||null,logo_url:x.logoUrl||null,wallet_limit:x.walletLimit===null||x.walletLimit===''?null:Number(x.walletLimit),license_mode:x.licenseMode||'paid',valid_until:x.validUntil||null,trial_camera_limit:Number(x.trialCameraLimit||2),status:x.status,active:x.status==='active',updated_at:stamp};
 if(kind==='clients')return {id:x.id,reseller_id:x.resellerId,name:x.name,code:x.code||null,email:x.email||null,phone:x.phone||'',status:x.status,active:x.status==='active',updated_at:stamp};
 if(kind==='locations'){const cl=records.clients.find(c=>c.id===x.clientId);if(!cl)throw Error('Cliente da instalação não encontrado.');return {id:x.id,reseller_id:cl.resellerId,client_id:x.clientId,name:x.name,address:x.address||null,postal_code:x.postalCode||null,city:x.city||null,country:x.country||'PT',status:x.status,active:x.status==='active',updated_at:stamp}}
 if(kind==='cameras'){const loc=records.locations.find(l=>l.id===x.locationId),cl=records.clients.find(c=>c.id===loc?.clientId);if(!loc||!cl)throw Error('Hierarquia da câmara inválida.');return {id:x.id,reseller_id:cl.resellerId,client_id:cl.id,installation_id:loc.id,name:x.name,provider:x.connectionMode==='local'?'rtsp':'imou',external_device_id:x.imouDeviceId||null,external_channel_id:x.imouChannelId||null,model:x.model||null,serial_number:x.imouDeviceId||null,status:x.status,active:x.status==='active',manufacturer:x.manufacturer||'',codec:x.codec||'auto',event_type:x.eventType||'motion',notes:x.notes||'',camera_plan_id:x.cameraPlanId||null,sale_price:x.salePrice===null||x.salePrice===''?null:Number(x.salePrice),connection_mode:x.connectionMode||'imou',local_host:x.localHost||'',rtsp_port:Number(x.rtspPort||554),rtsp_path:x.rtspPath||'',local_test:x.localTest||null,updated_at:stamp}}
 throw Error('Tipo de registo desconhecido.');
}
const tableFor={plans:'plans',cameraPlans:'camera_plans',resellers:'resellers',clients:'clients',locations:'installations',cameras:'cameras'};
async function upsertRows(kind,rows,records){
 if(!rows.length)return;
 const body=rows.map(x=>toDb(kind,x,records));
 const r=await rest(tableFor[kind]+'?on_conflict=id',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify(body)});
 if(!r.ok){const j=await r.json().catch(()=>({}));throw Error(j.message||j.hint||'Erro ao guardar '+LABEL[kind]+'.')}
}
async function deleteIds(kind,ids){
 if(!ids.length)return;
 const r=await rest(tableFor[kind]+'?id=in.('+ids.join(',')+')',{method:'DELETE'});
 if(!r.ok){const j=await r.json().catch(()=>({}));throw Error(j.message||j.hint||'Erro ao eliminar '+LABEL[kind]+'.')}
}
function priceRows(records){
 const out=[];
 for(const r of records.resellers)for(const [cameraPlanId,price] of Object.entries(r.salePrices||{}))out.push({reseller_id:r.id,camera_plan_id:cameraPlanId,price:Number(price||0),updated_at:new Date().toISOString()});
 return out;
}
async function syncPrices(before,after){
 const b=new Map(priceRows(before).map(x=>[x.reseller_id+'|'+x.camera_plan_id,x])),a=new Map(priceRows(after).map(x=>[x.reseller_id+'|'+x.camera_plan_id,x]));
 const changed=[...a.entries()].filter(([k,v])=>!b.has(k)||Number(b.get(k).price)!==Number(v.price)).map(([,v])=>v);
 if(changed.length){const r=await rest('reseller_sale_prices?on_conflict=reseller_id,camera_plan_id',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify(changed)});if(!r.ok){const j=await r.json().catch(()=>({}));throw Error(j.message||j.hint||'Erro nos preços de revenda.')}}
 for(const [k,v] of b)if(!a.has(k)){const r=await rest('reseller_sale_prices?reseller_id=eq.'+v.reseller_id+'&camera_plan_id=eq.'+v.camera_plan_id,{method:'DELETE'});if(!r.ok)throw Error('Erro ao eliminar preço de revenda.')}
}
async function writeActivity(changes,before,after){
 if(!changes.length)return;
 const rows=changes.map(ch=>{
  const src=(after[ch.kind]||[]).find(x=>x.id===ch.id)||(before[ch.kind]||[]).find(x=>x.id===ch.id)||{};
  return {actor_user_id:S.user.id,reseller_id:resellerOf(ch.kind,src,ch.action==='deleted'?before:after),entity_type:ch.kind,entity_id:ch.id,action:ch.action,detail:ch.detail};
 });
 const r=await rest('activity_log',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify(rows)});
 if(!r.ok){const j=await r.json().catch(()=>({}));throw Error(j.message||j.hint||'Dados guardados, mas o histórico não foi registado.')}
}
async function save(records,msg='Alterações guardadas.'){
 validate(records);
 const before=S.ws.records,changes=diff(before,records),forbidden=changes.find(ch=>!canMutate(ch.kind));
 if(forbidden)throw Error('O teu perfil não tem permissão para alterar '+LABEL[forbidden.kind]+'.');
 const changedByKind={};
 for(const k of Object.keys(EMPTY)){const b=new Map(before[k].map(x=>[x.id,JSON.stringify(x)]));changedByKind[k]=records[k].filter(x=>!b.has(x.id)||b.get(x.id)!==JSON.stringify(x))}
 const removed={};for(const k of Object.keys(EMPTY)){const a=new Set(records[k].map(x=>x.id));removed[k]=before[k].filter(x=>!a.has(x.id)).map(x=>x.id)}
 try{
  await upsertRows('plans',changedByKind.plans,records);
  await upsertRows('cameraPlans',changedByKind.cameraPlans,records);
  await upsertRows('resellers',changedByKind.resellers,records);
  await upsertRows('clients',changedByKind.clients,records);
  await upsertRows('locations',changedByKind.locations,records);
  await upsertRows('cameras',changedByKind.cameras,records);
  await syncPrices(before,records);
  await deleteIds('cameras',removed.cameras);
  await deleteIds('locations',removed.locations);
  await deleteIds('clients',removed.clients);
  await deleteIds('resellers',removed.resellers);
  await deleteIds('cameraPlans',removed.cameraPlans);
  await deleteIds('plans',removed.plans);
  await writeActivity(changes,before,records);
  await load();
  toast(msg,'success');render();
 }catch(e){toast(e instanceof Error?e.message:'Não foi possível guardar.','error');throw e}
}

function logo(){return '<span class="brand-mark">'+icon('shield')+'</span><div class="brand-copy"><strong>vigia<span>cloud</span></strong><small>VIDEOVIGILÂNCIA POR EVENTOS</small></div>'}
function badge(status){return '<span class="badge '+(status==='active'?'green':'amber')+'">'+(status==='active'?'Ativo':'Suspenso')+'</span>'}
function heading(title,sub,actions=''){return '<div class="heading"><div><p class="eyebrow">'+esc(accessLabel())+'</p><h1>'+esc(title)+'</h1><p>'+esc(sub)+'</p></div><div class="heading-actions">'+actions+'</div></div>'}

function renderAuth(){
 document.getElementById('app').innerHTML='<div class="auth"><section class="auth-hero"><div class="brand">'+logo()+'</div><div class="auth-main"><div class="kicker">PLATAFORMA WHITE LABEL</div><h1>Videovigilância cloud, organizada por eventos.</h1><p>Revendedores, clientes, instalações, câmaras, licenças e preços numa interface simples e profissional.</p><div class="auth-points"><div class="auth-point"><strong>Multi-tenant</strong><small>Operação organizada por empresa</small></div><div class="auth-point"><strong>White label</strong><small>Marca e preços personalizados</small></div><div class="auth-point"><strong>Supabase</strong><small>Login e isolamento RLS</small></div></div></div><small>Vigia Cloud · HTML + CSS + JavaScript</small></section><section class="auth-side"><div class="auth-card"><h2>Iniciar sessão</h2><p>Acede ao teu espaço privado.</p><form id="login" class="auth-form"><div class="field"><label>Email</label><input id="email" class="input" type="email" value="'+esc(C.admin)+'" autocomplete="email" required></div><div class="field"><label>Palavra-passe</label><input id="pass" class="input" type="password" autocomplete="current-password" required></div><div id="authmsg"></div><div class="auth-actions"><button class="btn btn-primary">Entrar no Vigia Cloud</button><button id="recover" type="button" class="link-btn">Recuperar palavra-passe</button></div></form></div></section></div>';
 $('#login').onsubmit=async e=>{e.preventDefault();const b=e.submitter,m=$('#authmsg');b.disabled=true;b.textContent='A validar…';m.innerHTML='';try{await login($('#email').value.trim(),$('#pass').value);await session();await resolveAccess();await load();render()}catch(x){clearSession();m.className='auth-status error';m.textContent=x.message;b.disabled=false;b.textContent='Entrar no Vigia Cloud'}};
 $('#recover').onclick=async()=>{const m=$('#authmsg');try{await auth('/recover',{method:'POST',body:JSON.stringify({email:$('#email').value.trim()})});m.className='auth-status ok';m.textContent='Email de recuperação enviado.'}catch(x){m.className='auth-status error';m.textContent=x.message}};
}
function sidebar(){return '<aside class="sidebar '+(S.side?'open':'')+'"><div class="brand">'+logo()+'</div><div class="nav-label">'+esc(S.access?.type==='platform'?'PLATAFORMA':S.access?.type==='reseller'?'PORTAL REVENDEDOR':'PORTAL CLIENTE')+'</div><nav class="nav">'+navForAccess().map(([n,i])=>'<button class="nav-btn '+(S.page===n?'active':'')+'" data-page="'+esc(n)+'"><span>'+esc(i)+'</span><span>'+esc(n)+'</span></button>').join('')+'</nav><div class="sidebar-foot"><div class="user"><span class="avatar">'+esc((S.user?.email||'V')[0].toUpperCase())+'</span><div><strong>'+esc(S.user?.email||'')+'</strong><small>'+esc(accessLabel())+'</small></div></div><button class="logout" id="logout">Terminar sessão</button></div></aside>'}
function topbar(){return '<header class="topbar"><div class="crumbs"><button id="menu" class="icon-btn mobile-menu">'+icon('menu')+'</button><span>Vigia Cloud</span><span>/</span><strong>'+esc(S.page)+'</strong></div><div class="top-actions"><span class="sync">Supabase ligado</span><button id="reload" class="btn btn-ghost">'+icon('refresh')+'<span>Atualizar</span></button></div></header>'}

function overview(){
 const d=S.ws.records,alerts=makeAlerts(d),platform=S.access?.type==='platform';
 const actions=platform?'<button id="import" class="btn btn-ghost">'+icon('upload')+'Importar</button><button id="export" class="btn btn-ghost">'+icon('download')+'Exportar</button>':'';
 const metrics=platform?[['Revendedores',d.resellers.length],['Clientes',d.clients.length],['Câmaras',d.cameras.length],['Alertas',alerts.length]]:[['Clientes',d.clients.length],['Instalações',d.locations.length],['Câmaras',d.cameras.length],['Alertas',alerts.length]];
 return heading('A tua operação, num só lugar.',platform?'Configura o serviço do revendedor à câmara.':'Consulta e gere apenas o teu espaço.',actions)+
 '<section class="metrics">'+metrics.map(([a,b])=>'<div class="metric"><div class="metric-head"><span>'+a+'</span><span class="metric-icon">'+(a==='Câmaras'?icon('camera'):icon('db'))+'</span></div><strong>'+b+'</strong><small>Registos na plataforma</small></div>').join('')+'</section>'+
 '<div class="grid-2"><section class="card"><div class="card-head"><div><h2>'+(platform?'Configurar a operação':'Acesso rápido')+'</h2><p>Fluxo recomendado.</p></div></div><div class="steps">'+(platform?[['01','Definir planos','Retenção, capacidade e preço.','Planos'],['02','Criar revendedores','Marca, licença e carteira.','Revendedores'],['03','Organizar instalações','Clientes, locais e câmaras.','Instalações']]:S.access?.type==='reseller'?[['01','Gerir clientes','Clientes associados ao teu espaço.','Clientes'],['02','Gerir instalações','Locais e câmaras do revendedor.','Instalações'],['03','Gerir câmaras','Equipamentos e ligações.','Câmaras']]:[['01','Ver instalações','Locais associados à tua conta.','Instalações'],['02','Ver câmaras','Equipamentos disponíveis.','Câmaras'],['03','Consultar eventos','Eventos do teu espaço.','Eventos']]).map(x=>'<button class="step" data-page="'+x[3]+'"><span class="step-num">'+x[0]+'</span><span class="step-copy"><strong>'+x[1]+'</strong><span>'+x[2]+'</span></span><span>→</span></button>').join('')+'</div></section><section class="dark-card"><span class="metric-icon">'+icon('cloud')+'</span><h2>Estrutura pronta para gravação por eventos.</h2><p>A gestão está em HTML, CSS e JavaScript puro. A receção automática de eventos e clips entra na próxima fase.</p><button class="btn" data-page="Câmaras">Gerir câmaras →</button></section></div>'+
 '<section class="card" style="margin-top:20px"><div class="card-head"><div><h2>Atividade recente</h2><p>Alterações guardadas no Supabase.</p></div></div>'+(S.ws.activity.length?S.ws.activity.slice(0,8).map(a=>'<div class="activity-row"><span>'+esc(a.text)+'</span><time>'+esc(dt(a.at))+'</time></div>').join(''):'<div class="empty"><p>Ainda não existem alterações registadas.</p></div>')+'</section>';
}
function parent(k,r,d){if(k==='clients')return d.resellers.find(x=>x.id===r.resellerId)?.name||'—';if(k==='locations')return d.clients.find(x=>x.id===r.clientId)?.name||'—';if(k==='cameras')return d.locations.find(x=>x.id===r.locationId)?.name||'—';if(k==='resellers')return d.plans.find(x=>x.id===r.planId)?.name||'Sem plano';if(k==='plans')return r.retention+' dias · '+r.cameraLimit+' câmaras';if(k==='cameraPlans')return r.retention+' dias · '+r.maxResolution;return ''}
function directory(k,title){
 const d=S.ws.records,can=canMutate(k),rows=d[k].filter(r=>(S.filter==='all'||r.status===S.filter)&&(r.name+' '+parent(k,r,d)+' '+(r.email||'')).toLowerCase().includes(S.search.toLowerCase()));
 const desktop=rows.map(r=>{
  const actions=can?'<div class="actions"><button class="icon-btn edit" data-id="'+r.id+'">'+icon('edit')+'</button><button class="icon-btn del" data-id="'+r.id+'">'+icon('trash')+'</button></div>':'<span class="sub">Só leitura</span>';
  return '<tr><td><strong>'+esc(r.name)+'</strong><span class="sub">'+esc(r.id.slice(0,8))+'</span></td><td>'+esc(parent(k,r,d))+'</td><td>'+badge(r.status)+'</td><td>'+esc(r.email||'—')+'<span class="sub">'+esc(r.phone||'')+'</span></td><td>'+actions+'</td></tr>';
 }).join('');
 const mobile=rows.map(r=>{
  const actions=can?'<div class="actions"><button class="btn btn-ghost edit" data-id="'+r.id+'">Editar</button><button class="btn btn-danger del" data-id="'+r.id+'">Eliminar</button></div>':'';
  return '<div class="mobile-row"><div class="mobile-row-head"><div><h3>'+esc(r.name)+'</h3><p>'+esc(parent(k,r,d))+'</p></div>'+badge(r.status)+'</div>'+actions+'</div>';
 }).join('');
 const body=rows.length
  ? '<div class="table-wrap"><table class="table"><thead><tr><th>Nome</th><th>Associação / detalhe</th><th>Estado</th><th>Contacto</th><th></th></tr></thead><tbody>'+desktop+'</tbody></table></div><div class="mobile-cards">'+mobile+'</div>'
  : '<div class="empty"><div class="empty-icon">'+icon('db')+'</div><h3>Sem registos</h3><p>'+(can?'Cria o primeiro '+LABEL[k]+' para começar.':'Ainda não existem registos disponíveis.')+'</p>'+(can?'<button id="emptyadd" class="btn btn-primary">'+icon('plus')+'Criar agora</button>':'')+'</div>';
 const action=can?'<button id="add" class="btn btn-primary">'+icon('plus')+'Novo '+LABEL[k]+'</button>':'';
 return heading(title,can?'Organiza e mantém os registos da plataforma.':'Consulta os registos disponíveis para a tua conta.',action)+'<section class="card"><div class="toolbar"><div class="toolbar-left"><div class="search">'+icon('search')+'<input id="search" class="input" value="'+esc(S.search)+'" placeholder="Pesquisar…"></div><select id="filter" class="select filter"><option value="all">Todos</option><option value="active" '+(S.filter==='active'?'selected':'')+'>Ativos</option><option value="paused" '+(S.filter==='paused'?'selected':'')+'>Suspensos</option></select></div><span class="badge">'+rows.length+' registos</span></div>'+body+'</section>';
}

const F={
 plans:[['name','Nome','text'],['status','Estado','status'],['retention','Retenção (dias)','number'],['cameraLimit','Limite de câmaras','number'],['price','Mensalidade base (€)','number'],['original','Preservar original','bool']],
 cameraPlans:[['name','Nome','text'],['status','Estado','status'],['retention','Retenção (dias)','number'],['price','Custo por câmara (€)','number'],['maxResolution','Resolução máxima','resolution'],['maxClipSeconds','Clip máximo (s)','number'],['monthlyGB','GB/mês','number'],['original','Preservar original','bool']],
 resellers:[['name','Nome','text'],['status','Estado','status'],['email','Email','email'],['phone','Telefone','text'],['planId','Plano','plan'],['brand','Nome comercial','text'],['color','Cor principal','color'],['support','Email suporte','email'],['walletLimit','Carteira câmaras','nullable'],['licenseMode','Modalidade','license'],['validUntil','Válido até','date'],['trialCameraLimit','Limite trial','number']],
 clients:[['name','Nome','text'],['status','Estado','status'],['resellerId','Revendedor','reseller'],['email','Email','email'],['phone','Telefone','text']],
 locations:[['name','Nome','text'],['status','Estado','status'],['clientId','Cliente','client'],['address','Morada','text']],
 cameras:[['name','Nome','text'],['status','Estado','status'],['locationId','Instalação','location'],['connectionMode','Ligação','connection'],['imouDeviceId','Device ID Imou','text'],['imouChannelId','Canal','text'],['localHost','IP privado','text'],['rtspPort','Porta RTSP','number'],['rtspPath','Caminho RTSP','text'],['manufacturer','Marca','text'],['model','Modelo','text'],['codec','Codec','codec'],['eventType','Evento','event'],['cameraPlanId','Plano câmara','cameraPlan'],['salePrice','Preço específico (€)','nullable'],['notes','Observações','area']]
};
function defaults(k){const b={id:id(),name:'',status:'active'};return {plans:{...b,retention:7,cameraLimit:10,price:0,original:true},cameraPlans:{...b,retention:7,price:0,maxResolution:'1080p',maxClipSeconds:30,monthlyGB:10,original:true},resellers:{...b,email:'',phone:'',planId:'',brand:'',color:'#2563eb',support:'',logoData:'',walletLimit:null,licenseMode:'paid',validUntil:'',trialCameraLimit:2,salePrices:{}},clients:{...b,resellerId:'',email:'',phone:''},locations:{...b,clientId:'',address:''},cameras:{...b,locationId:'',connectionMode:'imou',imouDeviceId:'',imouChannelId:'0',localHost:'',rtspPort:554,rtspPath:'',manufacturer:'Imou',model:'IPC-C22E',codec:'auto',eventType:'motion',cameraPlanId:'',salePrice:null,notes:'',localTest:null}}[k]}
function options(t,d){if(t==='status')return [['active','Ativo'],['paused','Suspenso']];if(t==='bool')return [['true','Sim'],['false','Não']];if(t==='resolution')return [['1080p','1080p'],['2K','2K'],['4K','4K']];if(t==='license')return [['paid','Contrato'],['trial','Trial']];if(t==='connection')return [['imou','Imou Cloud'],['local','Rede local / RTSP']];if(t==='codec')return [['auto','Por identificar'],['H.264','H.264'],['H.265','H.265']];if(t==='event')return [['motion','Movimento'],['person','Pessoa'],['vehicle','Veículo']];return ({plan:d.plans,reseller:d.resellers,client:d.clients,location:d.locations,cameraPlan:d.cameraPlans}[t]||[]).map(x=>[x.id,x.name])}
function input(f,row,d){const [k,l,t]=f,v=row[k]??'';if(['status','bool','resolution','license','connection','codec','event','plan','reseller','client','location','cameraPlan'].includes(t))return '<div class="field"><label>'+l+'</label><select class="select" name="'+k+'">'+(['plan','reseller','client','location','cameraPlan'].includes(t)?'<option value="">Selecionar</option>':'')+options(t,d).map(x=>'<option value="'+esc(x[0])+'" '+(String(v)===String(x[0])?'selected':'')+'>'+esc(x[1])+'</option>').join('')+'</select></div>';if(t==='area')return '<div class="field span-2"><label>'+l+'</label><textarea class="textarea" name="'+k+'">'+esc(v)+'</textarea></div>';return '<div class="field"><label>'+l+'</label><input class="input" name="'+k+'" type="'+(t==='number'||t==='nullable'?'number':t)+'" '+(t==='number'||t==='nullable'?'step="any"':'')+' value="'+esc(v)+'"></div>'}
function editor(k,rid=''){
 const d=S.ws.records,row=rid?structuredClone(d[k].find(x=>x.id===rid)):defaults(k),m=document.createElement('div');m.className='modal-backdrop';
 m.innerHTML='<div class="modal"><div class="modal-head"><h2>'+(rid?'Editar ':'Novo ')+LABEL[k]+'</h2><button class="icon-btn close">'+icon('x')+'</button></div><form id="form" class="modal-body"><div class="form-grid">'+F[k].map(f=>input(f,row,d)).join('')+'</div><div class="modal-actions"><button type="button" class="btn btn-ghost close">Cancelar</button><button class="btn btn-primary">Guardar</button></div></form></div>';document.body.appendChild(m);$$('.close').forEach(b=>b.onclick=()=>m.remove());
 $('#form').onsubmit=async e=>{e.preventDefault();const fd=new FormData(e.target),o={...row};F[k].forEach(([key,,t])=>{const v=fd.get(key);o[key]=t==='number'?Number(v||0):t==='nullable'?(v===''?null:Number(v)):t==='bool'?v==='true':String(v??'')});if(k==='resellers'&&!o.brand)o.brand=o.name;if(k==='cameras'&&o.connectionMode==='imou'){o.localHost='';o.rtspPath='';o.rtspPort=554}if(k==='cameras'&&o.connectionMode==='local'){o.imouDeviceId='';o.imouChannelId='0'}if(!o.name.trim()){toast('Indica um nome.','error');return}const n=structuredClone(d);n[k]=rid?n[k].map(x=>x.id===rid?o:x):[...n[k],o];try{await save(n);m.remove()}catch(x){toast(x.message,'error')}};
}
async function remove(k,rid){const d=S.ws.records,r=d[k].find(x=>x.id===rid);if(!r||!confirm('Eliminar '+LABEL[k]+' “'+r.name+'”?'))return;const n=structuredClone(d);n[k]=n[k].filter(x=>x.id!==rid);try{await save(n,'Registo eliminado.')}catch(x){toast(x.message,'error')}}

function license(r){if(r.status==='paused')return ['Suspenso','amber'];if(r.validUntil&&r.validUntil<nowDate())return ['Expirado','red'];const days=r.validUntil?Math.round((Date.parse(r.validUntil)-Date.parse(nowDate()))/86400000):null;if(days!==null&&days<=5)return [days===0?'Expira hoje':'Expira em '+days+' dias','amber'];return [r.licenseMode==='trial'?'Trial':'Ativo',r.licenseMode==='trial'?'blue':'green']}
function resellerCams(d,rid){const cs=new Set(d.clients.filter(c=>c.resellerId===rid).map(c=>c.id)),ls=new Set(d.locations.filter(l=>cs.has(l.clientId)).map(l=>l.id));return d.cameras.filter(c=>ls.has(c.locationId))}
function commercial(d,r){const cams=resellerCams(d,r.id),limit=r.licenseMode==='trial'?Number(r.trialCameraLimit||2):(r.walletLimit??d.plans.find(p=>p.id===r.planId)?.cameraLimit??null),base=Number(d.plans.find(p=>p.id===r.planId)?.price||0);let cost=base,revenue=0,missing=0;cams.filter(c=>c.status==='active').forEach(c=>{const p=d.cameraPlans.find(p=>p.id===c.cameraPlanId),sale=c.salePrice??r.salePrices?.[c.cameraPlanId];if(!p||sale==null)missing++;cost+=Number(p?.price||0);revenue+=Number(sale||0)});const profit=revenue-cost;return {cams,limit,cost,revenue,profit,margin:revenue?profit/revenue*100:null,missing}}
function makeAlerts(d){const a=[];d.resellers.forEach(r=>{const add=(level,title,detail,target)=>a.push({level,title,detail,target,name:r.name});if(r.status==='paused'){add('info','Cadastro suspenso','Revê a licença antes de reativar.','Licenças');return}if(!r.validUntil)add('info','Validade por definir','A licença não tem data de fim.','Licenças');else{const days=Math.round((Date.parse(r.validUntil)-Date.parse(nowDate()))/86400000);if(days<0)add('urgent','Licença expirada','Terminou em '+r.validUntil+'.','Licenças');else if(days<=5)add('warning',days===0?'Expira hoje':'Expira em '+days+' dias','Prepara a renovação.','Licenças')}const m=commercial(d,r);if(m.limit===null)add('info','Carteira sem limite','Define capacidade ou plano.','Carteiras e preços');else if(m.cams.length>=m.limit)add('warning','Carteira completa',m.cams.length+' de '+m.limit+' câmaras.','Carteiras e preços');else if(m.cams.length/m.limit>=.8)add('warning','Carteira acima de 80%',m.limit-m.cams.length+' câmaras disponíveis.','Carteiras e preços');if(m.missing)add('warning','Previsão incompleta',m.missing+' câmaras sem plano/preço.','Carteiras e preços');else if(m.profit<0)add('warning','Margem negativa','A venda prevista não cobre o custo.','Carteiras e preços')});return a}

function prices(){const d=S.ws.records;return heading('Carteiras e preços','Capacidade, custos, venda e margem prevista.')+'<div class="pricing">'+(d.resellers.length?d.resellers.map(r=>{const m=commercial(d,r),st=license(r),pct=m.limit?Math.min(100,m.cams.length/m.limit*100):0;return '<article class="price-card"><div style="display:flex;justify-content:space-between;gap:8px"><div><h3>'+esc(r.name)+'</h3><span class="sub">'+esc(d.plans.find(p=>p.id===r.planId)?.name||'Sem plano')+'</span></div><span class="badge '+st[1]+'">'+st[0]+'</span></div><div style="margin-top:18px"><span class="sub">Carteira</span><span class="money">'+m.cams.length+(m.limit?' / '+m.limit:'')+'</span><div class="progress"><span style="width:'+pct+'%"></span></div></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:18px"><div><span class="sub">Custo</span><strong>'+euro(m.cost)+'</strong></div><div><span class="sub">Venda</span><strong>'+euro(m.revenue)+'</strong></div><div><span class="sub">Resultado</span><strong style="color:'+(m.profit<0?'var(--danger)':'var(--success)')+'">'+euro(m.profit)+'</strong></div><div><span class="sub">Margem</span><strong>'+(m.margin==null?'—':m.margin.toFixed(1)+'%')+'</strong></div></div><button class="btn btn-ghost price-edit" data-id="'+r.id+'" style="margin-top:16px">Editar revendedor</button></article>'}).join(''):'<section class="card"><div class="empty"><p>Cria revendedores e planos para veres a previsão comercial.</p></div></section>')+'</div>'}
function licenses(){const d=S.ws.records;return heading('Licenças','Trials, contratos, validade e capacidade.')+'<section class="card">'+(d.resellers.length?'<div class="table-wrap"><table class="table"><thead><tr><th>Revendedor</th><th>Modalidade</th><th>Válido até</th><th>Carteira</th><th>Estado</th><th></th></tr></thead><tbody>'+d.resellers.map(r=>{const st=license(r),m=commercial(d,r);return '<tr><td><strong>'+esc(r.name)+'</strong></td><td>'+(r.licenseMode==='trial'?'Trial':'Contrato')+'</td><td>'+esc(r.validUntil||'Sem data')+'</td><td>'+m.cams.length+(m.limit?' / '+m.limit:'')+'</td><td><span class="badge '+st[1]+'">'+st[0]+'</span></td><td><button class="btn btn-ghost lic-edit" data-id="'+r.id+'">Editar</button></td></tr>'}).join('')+'</tbody></table></div>':'<div class="empty"><p>Sem revendedores.</p></div>')+'</section>'}
function alerts(){const a=makeAlerts(S.ws.records);return heading('Alertas','Pontos de atenção da operação.')+'<section class="card">'+(a.length?a.map(n=>'<div class="notice-row"><span class="notice-dot '+n.level+'"></span><div class="notice-copy"><strong>'+esc(n.name)+' · '+esc(n.title)+'</strong><span>'+esc(n.detail)+'</span></div><button class="btn btn-ghost jump" data-page="'+n.target+'">Abrir</button></div>').join(''):'<div class="empty"><h3>Sem alertas</h3><p>A operação não tem avisos pendentes.</p></div>')+'</section>'}
function connections(){return heading('Ligações','Imou e rede local sem expor credenciais no browser.')+'<div class="connection-grid"><article class="connection-card"><span class="metric-icon">'+icon('cloud')+'</span><h3>Imou Cloud</h3><p>App ID e App Secret ficam obrigatoriamente numa Edge Function/server-side.</p><div class="code">POST /functions/v1/imou</div><span class="badge amber" style="margin-top:13px">Edge Function por ligar</span></article><article class="connection-card"><span class="metric-icon">'+icon('camera')+'</span><h3>Rede local / RTSP</h3><p>O cadastro guarda IP, porta e path. Utilizador e palavra-passe não entram no frontend.</p><div class="code">rtsp://192.168.1.50:554/path</div><span class="badge green" style="margin-top:13px">Modelo preparado</span></article><article class="connection-card"><span class="metric-icon">'+icon('shield')+'</span><h3>Segurança</h3><p>Publishable key no cliente e RLS no Supabase. Segredos apenas no servidor.</p><span class="badge blue">Arquitetura segura</span></article></div>'}
function events(){return heading('Eventos','Biblioteca e gravação por eventos.')+'<section class="card"><div class="event-placeholder">'+icon('camera')+'<h2>Integração de eventos é a próxima fase.</h2><p>A base Supabase já tem a estrutura de eventos. Falta receber eventos Imou/local, gerar clips, thumbnails, player, download e retenção.</p></div></section>'}
function branding(){const d=S.ws.records;return heading('Marca própria','Nome, cor, suporte e logótipo por revendedor.')+'<div class="brand-grid"><section class="card"><div class="card-head"><div><h2>Identidade</h2><p>Seleciona um revendedor.</p></div></div><div style="padding:21px"><div class="field"><label>Revendedor</label><select id="brand-reseller" class="select"><option value="">Selecionar</option>'+d.resellers.map(r=>'<option value="'+r.id+'">'+esc(r.name)+'</option>').join('')+'</select></div><div id="brand-form" style="display:grid;gap:14px;margin-top:16px"></div></div></section><section id="brand-preview" class="brand-preview"><div class="empty"><p>Seleciona um revendedor para pré-visualizar.</p></div></section></div>'}
function storage(){return heading('Armazenamento','Estimativa de capacidade para gravação por eventos.')+'<section class="card"><div class="card-head"><div><h2>Calculadora</h2><p>Estimativa técnica.</p></div></div><div style="padding:21px"><div class="calc"><div class="field"><label>Câmaras</label><input id="ca" class="input c" type="number" value="10"></div><div class="field"><label>Eventos/dia</label><input id="ev" class="input c" type="number" value="30"></div><div class="field"><label>Segundos/evento</label><input id="se" class="input c" type="number" value="30"></div><div class="field"><label>Dias</label><input id="da" class="input c" type="number" value="30"></div><div class="field"><label>Bitrate Mbps</label><input id="bi" class="input c" type="number" step=".1" value="2"></div></div><div class="estimate"><span>Estimativa total</span><strong id="est">—</strong></div><p class="sub">Fórmula: câmaras × eventos × segundos × dias × bitrate ÷ 8.</p></div></section>'}


function usersPage(){
 if(!canManageUsers())return heading('Utilizadores','Gestão de acessos.')+'<section class="card"><div class="empty"><p>O teu perfil não pode gerir utilizadores.</p></div></section>';
 const d=S.ws.records,resellers=S.access?.type==='platform'?d.resellers:d.resellers.filter(r=>r.id===S.access?.resellerId);
 if(!resellers.length)return heading('Utilizadores','Convites e permissões.')+'<section class="card"><div class="empty"><p>Cria primeiro um revendedor.</p></div></section>';
 return heading('Utilizadores','Convida utilizadores e atribui acesso ao Revendedor ou Cliente.')+
 '<div class="grid-2">'+
 '<section class="card"><div class="card-head"><div><h2>Novo acesso</h2><p>O utilizador recebe um convite do Supabase.</p></div></div><div style="padding:21px"><div class="form-grid">'+
 '<div class="field"><label>Revendedor</label><select id="ua-reseller" class="select">'+resellers.map(r=>'<option value="'+r.id+'">'+esc(r.name)+'</option>').join('')+'</select></div>'+
 '<div class="field"><label>Tipo de acesso</label><select id="ua-target" class="select"><option value="reseller">Revendedor</option><option value="client">Cliente</option></select></div>'+
 '<div class="field" id="ua-client-wrap" style="display:none"><label>Cliente</label><select id="ua-client" class="select"></select></div>'+
 '<div class="field"><label>Perfil</label><select id="ua-role" class="select"></select></div>'+
 '<div class="field"><label>Nome</label><input id="ua-name" class="input" placeholder="Nome do utilizador"></div>'+
 '<div class="field"><label>Email</label><input id="ua-email" class="input" type="email" placeholder="email@empresa.pt"></div>'+
 '</div><div style="margin-top:18px"><button id="ua-invite" class="btn btn-primary">Enviar convite</button></div></div></section>'+
 '<section class="card"><div class="card-head"><div><h2>Acessos atuais</h2><p>Perfis associados ao revendedor selecionado.</p></div></div><div id="ua-list"><div class="empty"><p>A carregar acessos…</p></div></div></section>'+
 '</div>';
}
async function loadUserAccessList(){
 const reseller=$('#ua-reseller');const host=$('#ua-list');if(!reseller||!host)return;
 host.innerHTML='<div class="empty"><p>A carregar acessos…</p></div>';
 try{
  const data=await invokeFunction('manage-user-access',{action:'list',resellerId:reseller.value});
  const clientName=id=>S.ws.records.clients.find(c=>c.id===id)?.name||'Cliente';
  const rows=[
   ...(data.resellerMembers||[]).map(x=>({email:x.email||'—',name:x.display_name||'',scope:'Revendedor',role:x.role})),
   ...(data.clientMembers||[]).map(x=>({email:x.email||'—',name:x.display_name||'',scope:clientName(x.client_id),role:x.role}))
  ];
  host.innerHTML=rows.length?'<div class="table-wrap"><table class="table"><thead><tr><th>Utilizador</th><th>Acesso</th><th>Perfil</th></tr></thead><tbody>'+rows.map(x=>'<tr><td><strong>'+esc(x.name||x.email)+'</strong><span class="sub">'+esc(x.email)+'</span></td><td>'+esc(x.scope)+'</td><td><span class="badge">'+esc(x.role)+'</span></td></tr>').join('')+'</tbody></table></div>':'<div class="empty"><p>Ainda não existem utilizadores associados.</p></div>';
 }catch(e){host.innerHTML='<div class="empty"><p>'+esc(e.message)+'</p></div>'}
}
function bindUsers(){
 const reseller=$('#ua-reseller');if(!reseller)return;
 const target=$('#ua-target'),client=$('#ua-client'),clientWrap=$('#ua-client-wrap'),role=$('#ua-role');
 const refreshClients=()=>{const rows=S.ws.records.clients.filter(c=>c.resellerId===reseller.value);client.innerHTML=rows.map(c=>'<option value="'+c.id+'">'+esc(c.name)+'</option>').join('')};
 const refreshRoles=()=>{const isClient=target.value==='client';clientWrap.style.display=isClient?'block':'none';role.innerHTML=(isClient?[['owner','Owner'],['admin','Admin'],['viewer','Viewer']]:[['owner','Owner'],['admin','Admin'],['operator','Operador'],['viewer','Viewer']]).map(x=>'<option value="'+x[0]+'">'+x[1]+'</option>').join('');refreshClients()};
 reseller.onchange=()=>{refreshClients();void loadUserAccessList()};
 target.onchange=refreshRoles;
 refreshRoles();void loadUserAccessList();
 $('#ua-invite').onclick=async()=>{const btn=$('#ua-invite'),email=$('#ua-email').value.trim(),name=$('#ua-name').value.trim();if(!email){toast('Indica o email.','error');return}if(target.value==='client'&&!client.value){toast('Seleciona um cliente.','error');return}btn.disabled=true;btn.textContent='A enviar…';try{const data=await invokeFunction('manage-user-access',{action:'invite',email,name,targetType:target.value,resellerId:reseller.value,clientId:target.value==='client'?client.value:'',role:role.value});toast(data.invited?'Convite enviado.':'Acesso atualizado.','success');$('#ua-email').value='';$('#ua-name').value='';await loadUserAccessList()}catch(e){toast(e.message,'error')}finally{btn.disabled=false;btn.textContent='Enviar convite'}};
}
function renderMain(){
 const host=$('#content'),k=KIND[S.page];let html=overview();if(k)html=directory(k,S.page);else if(S.page==='Utilizadores')html=usersPage();else if(S.page==='Carteiras e preços')html=prices();else if(S.page==='Licenças')html=licenses();else if(S.page==='Alertas')html=alerts();else if(S.page==='Ligações')html=connections();else if(S.page==='Eventos')html=events();else if(S.page==='Marca própria')html=branding();else if(S.page==='Armazenamento')html=storage();
 host.innerHTML='<div class="banner">'+icon('cloud')+'<span><strong>Frontend estático ativo.</strong> HTML + CSS + JavaScript puro com Supabase.</span></div>'+html;bindPage(k);
}
function bindPage(k){
 $$('[data-page]').forEach(b=>b.onclick=()=>go(b.dataset.page));
 if(k){$('#search')?.addEventListener('input',e=>{S.search=e.target.value;renderMain()});$('#filter')?.addEventListener('change',e=>{S.filter=e.target.value;renderMain()});$('#add')?.addEventListener('click',()=>editor(k));$('#emptyadd')?.addEventListener('click',()=>editor(k));$$('.edit').forEach(b=>b.onclick=()=>editor(k,b.dataset.id));$$('.del').forEach(b=>b.onclick=()=>remove(k,b.dataset.id))}
 $('#export')?.addEventListener('click',exportData);$('#import')?.addEventListener('click',importData);$$('.price-edit,.lic-edit').forEach(b=>b.onclick=()=>editor('resellers',b.dataset.id));$('.jump').forEach(b=>b.onclick=()=>go(b.dataset.page));bindBrand();bindCalc();bindUsers();
}
function bindBrand(){const s=$('#brand-reseller');if(!s)return;s.onchange=()=>{const r=S.ws.records.resellers.find(x=>x.id===s.value),f=$('#brand-form'),p=$('#brand-preview');if(!r){f.innerHTML='';p.innerHTML='<div class="empty"><p>Seleciona um revendedor.</p></div>';return}let logoData=r.logoData||'';f.innerHTML='<div class="field"><label>Nome comercial</label><input id="bn" class="input" value="'+esc(r.brand||r.name)+'"></div><div class="field"><label>Cor</label><input id="bc" class="input" type="color" value="'+esc(r.color||'#2563eb')+'"></div><div class="field"><label>Email suporte</label><input id="bs" class="input" type="email" value="'+esc(r.support||'')+'"></div><div class="field"><label>Logótipo</label><input id="bl" class="input" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml"><span class="sub">Máximo 180 KB.</span></div><button id="brand-save" class="btn btn-primary">Guardar identidade</button>';const preview=()=>{p.innerHTML='<div class="brand-preview-head" style="background:'+$('#bc').value+'">'+(logoData?'<img src="'+logoData+'" style="width:46px;height:46px;object-fit:contain;background:#fff;border-radius:9px;padding:4px">':'<span class="brand-mark">'+icon('shield')+'</span>')+'<strong>'+esc($('#bn').value||r.name)+'</strong></div><div class="brand-preview-body"><h2>Portal do cliente</h2><p class="sub">A mesma aplicação com a identidade do revendedor.</p><div class="camera-placeholder">'+icon('camera')+'<span>Área de câmaras</span></div></div>'};preview();$('#bn').oninput=preview;$('#bc').oninput=preview;$('#bl').onchange=e=>{const file=e.target.files[0];if(!file)return;if(file.size>180000){toast('Logótipo demasiado grande.','error');return}const fr=new FileReader();fr.onload=()=>{logoData=fr.result;preview()};fr.readAsDataURL(file)};$('#brand-save').onclick=async()=>{const n=structuredClone(S.ws.records),x=n.resellers.find(x=>x.id===r.id);x.brand=$('#bn').value.trim()||x.name;x.color=$('#bc').value;x.support=$('#bs').value.trim();x.logoData=logoData;try{await save(n,'Identidade atualizada.')}catch(e){toast(e.message,'error')}}}}
function bindCalc(){if(!$('#ca'))return;const f=()=>{const gb=Number($('#ca').value)*Number($('#ev').value)*Number($('#se').value)*Number($('#da').value)*Number($('#bi').value)/8000;$('#est').textContent=gb>=1000?(gb/1000).toFixed(2)+' TB':gb.toFixed(1)+' GB'};$$('.c').forEach(x=>x.oninput=f);f()}
function exportData(){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify({format:'vigia-cloud-html-v1',exportedAt:new Date().toISOString(),...S.ws},null,2)],{type:'application/json'}));a.download='vigia-cloud-dados.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),700)}
function importData(){const i=document.createElement('input');i.type='file';i.accept='.json,application/json';i.onchange=()=>{const f=i.files[0];if(!f)return;const r=new FileReader();r.onload=async()=>{try{const j=JSON.parse(r.result),records=j.records||j;validate(records);if(!confirm('Substituir o workspace atual por estes dados?'))return;await save(records,'Dados importados.')}catch(e){toast(e.message,'error')}};r.readAsText(f)};i.click()}

function go(p){S.page=p;S.search='';S.filter='all';S.side=false;render();scrollTo({top:0,behavior:'smooth'})}
function render(){
 document.getElementById('app').innerHTML='<div class="shell">'+sidebar()+'<section class="main">'+topbar()+'<main id="content" class="workspace"></main></section></div>';renderMain();
 $$('.nav-btn').forEach(b=>b.onclick=()=>go(b.dataset.page));$('#menu').onclick=()=>{$('.sidebar').classList.toggle('open')};$('#reload').onclick=async()=>{try{await load();toast('Dados atualizados.','success');render()}catch(e){toast(e.message,'error')}};$('#logout').onclick=async()=>{try{await fetch(C.url+'/auth/v1/logout',{method:'POST',headers:{apikey:C.key,Authorization:'Bearer '+S.session.access_token}})}catch{}clearSession();renderAuth()};
}
async function boot(){document.getElementById('app').innerHTML='<div class="loading"><div><div class="spinner"></div><p>A abrir o Vigia Cloud…</p></div></div>';if(!await session()){renderAuth();return}try{await resolveAccess();await load();render()}catch(e){clearSession();renderAuth();setTimeout(()=>{const m=$('#authmsg');if(m){m.className='auth-status error';m.textContent=e.message}},0)}}
boot();
})();