import type {Records,Reseller,CameraRecord} from './model';
export function resellerCameras(d:Records,id:string){const cs=new Set(d.clients.filter(c=>c.resellerId===id).map(c=>c.id));const ls=new Set(d.locations.filter(l=>cs.has(l.clientId)).map(l=>l.id));return d.cameras.filter(c=>ls.has(c.locationId));}
export function cameraReseller(d:Records,c:CameraRecord){const l=d.locations.find(l=>l.id===c.locationId);const customer=d.clients.find(x=>x.id===l?.clientId);return d.resellers.find(r=>r.id===customer?.resellerId);}
export function walletLimit(d:Records,r:Reseller){if(r.licenseMode==='trial')return r.trialCameraLimit;return r.walletLimit??d.plans.find(p=>p.id===r.planId)?.cameraLimit??null;}
export function licenseStatus(r:Reseller,today=new Date().toISOString().slice(0,10)){
 if(r.status==='paused')return {label:'Suspenso',tone:'amber'};
 if(r.validUntil&&r.validUntil<today)return {label:'Expirado',tone:'red'};
 const days=r.validUntil?Math.round((Date.parse(r.validUntil)-Date.parse(today))/86400000):null;
 if(days!==null&&days<=5)return {label:days===0?'Expira hoje':`Expira em ${days} dias`,tone:'amber'};
 return {label:r.licenseMode==='trial'?'Trial':'Ativo',tone:r.licenseMode==='trial'?'blue':'green'};
}
export function commercialSummary(d:Records,r:Reseller){
 const all=resellerCameras(d,r.id);const active=all.filter(c=>c.status==='active'&&d.locations.some(l=>l.id===c.locationId&&l.status==='active'&&d.clients.some(x=>x.id===l.clientId&&x.status==='active')));
 const base=d.plans.find(p=>p.id===r.planId)?.price??0;
 let cost=base,revenue=0,missing=0;
 for(const c of active){const p=d.cameraPlans.find(p=>p.id===c.cameraPlanId);const sale=c.salePrice??r.salePrices[c.cameraPlanId];if(!p||sale===undefined)missing++;cost+=p?.price??0;revenue+=sale??0;}
 cost=Math.round(cost*100)/100;revenue=Math.round(revenue*100)/100;
 const profit=Math.round((revenue-cost)*100)/100;
 return {all,active,cost,revenue,profit,margin:revenue>0?profit/revenue*100:null,missing,limit:walletLimit(d,r),base};
}
