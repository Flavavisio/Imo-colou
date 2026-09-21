import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import * as model from '../lib/model.ts';
const fixture=()=>{
 const [p,r,c,l,k]=Array.from({length:5},()=>crypto.randomUUID());
 return {plans:[{id:p,name:'Eventos 7',status:'active',retention:7,cameraLimit:1,price:9.99,original:true}],resellers:[{id:r,name:'Revenda Teste',status:'active',email:'teste@example.invalid',phone:'',planId:p,brand:'Marca Teste',color:'#123456',support:''}],clients:[{id:c,name:'Cliente Teste',status:'active',resellerId:r,email:'cliente@example.invalid',phone:''}],locations:[{id:l,name:'Loja Teste',status:'active',clientId:c,address:''}],cameras:[{id:k,name:'Entrada Teste',status:'active',locationId:l,manufacturer:'Imou',model:'IPC-C22E',codec:'H.264',eventType:'motion',notes:''}]};
};
test('Validate associations, camera quota and input',()=>{const f=fixture();assert(model.recordsSchema.safeParse(f).success);for(const kind of ['plans','resellers','clients','locations'])assert.equal(model.recordsSchema.safeParse({...f,[kind]:[]}).success,false);assert.equal(model.recordsSchema.safeParse({...f,cameras:[...f.cameras,{...f.cameras[0],id:crypto.randomUUID()}]}).success,false);assert.equal(model.recordsSchema.safeParse({...f,resellers:[{...f.resellers[0],color:'javascript:bad'}]}).success,false);});
test('Authenticated storage, durable round trip, owner isolation, conflict and CSRF',async()=>{
 const sqlite=new DatabaseSync(':memory:');sqlite.exec(readFileSync('drizzle/0000_giant_puck.sql','utf8'));
 const d1 = {
  prepare(sql) {
   return {
    bind(...params) {
     return {
      async first() { return sqlite.prepare(sql).get(...params) || null; },
      async run() { const v=sqlite.prepare(sql).run(...params); return {meta:{changes:Number(v.changes)}}; }
     };
    }
   };
  }
 };
 let user=null;const context=vm.createContext({Response,Request,console,Date,JSON,Number,URL});
 const source=ts.transpileModule(readFileSync('app/api/workspace/route.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
 const route=new vm.SourceTextModule(source,{context});
 await route.link(async spec=>{const exports=spec.includes('chatgpt-auth')?{getChatGPTUser:async()=>user}:spec.includes('workspace-db')?{workspaceDb:()=>d1}:model;return new vm.SyntheticModule(Object.keys(exports),function(){for(const [k,v]of Object.entries(exports))this.setExport(k,v)},{context})});await route.evaluate();
 const {GET,PUT}=route.namespace;
 assert.equal((await GET()).status,401);
 user={userId:'owner-a',email:'a@example.invalid'};let response=await GET();assert.equal((await response.json()).revision,0);
 const f=fixture();const put=(revision,records,origin='https://vigia.test')=>PUT(new Request('https://vigia.test/api/workspace',{method:'PUT',headers:{origin,'content-type':'application/json'},body:JSON.stringify({revision,records})}));
 response=await put(0,f);assert.equal(response.status,200,await response.clone().text());assert.equal((await response.json()).revision,1);
 assert.deepEqual((await (await GET()).json()).records,model.recordsSchema.parse(f));
 assert.equal((await put(0,f)).status,409);
 assert.equal((await put(1,{...f,clients:[]})).status,400);
 assert.equal((await put(1,f,'https://evil.test')).status,403);
 user={userId:'owner-b',email:'b@example.invalid'};assert.equal((await (await GET()).json()).records.clients.length,0);
 user={userId:'owner-a',email:'a@example.invalid'};
 const edited=structuredClone(f);edited.cameras[0].name='Entrada revista';assert.equal((await put(1,edited)).status,200);
 const withoutCamera={...edited,cameras:[]};assert.equal((await put(2,withoutCamera)).status,200);assert.equal((await (await GET()).json()).records.cameras.length,0);
 assert.equal((await put(3,model.emptyRecords)).status,200);
 sqlite.close();
});
test('Imou identifiers default safely and one device channel cannot serve two clients',()=>{
 const f=fixture();f.plans[0].cameraLimit=10;
 assert.equal(model.recordsSchema.parse(f).cameras[0].imouDeviceId,'');
 f.cameras[0].imouDeviceId='C22E123';f.cameras[0].imouChannelId='0';
 f.cameras.push({...f.cameras[0],id:crypto.randomUUID()});
 assert.equal(model.recordsSchema.safeParse(f).success,false);
 f.cameras[1].imouChannelId='1';assert.equal(model.recordsSchema.safeParse(f).success,true);
});
