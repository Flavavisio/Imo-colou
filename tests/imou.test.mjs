import {test} from 'node:test';
import assert from 'node:assert/strict';
import {imouSign,listImouDevices,ImouError} from '../lib/imou.ts';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import * as imou from '../lib/imou.ts';
const input={appId:'test-app',appSecret:'private-secret',region:'eu',page:2};
const ok=data=>Response.json({result:{code:'0',data}});
test('Imou signature matches official HMAC-SHA256 reference vector',async()=>{
 assert.equal(await imouSign('test123456789test123456789',1706511734,'f5a1ae2d-c09c-4d39-a744-83a5c2c653c2'),'xjhCQBoJ9hRDsCjyDcHjtDNzRZ3ZJezcawsfWeiaoxU=');
});
test('Imou signs calls, paginates and returns only device fields',async()=>{
 const calls=[];
 const result=await listImouDevices(input,async(url,options)=>{
  const body=JSON.parse(options.body);calls.push({url,body});
  assert.equal(options.redirect,'error');
  assert.equal(body.system.sign,await imouSign(input.appSecret,body.system.time,body.system.nonce));
  if(calls.length===1)return ok({accessToken:'private-token',currentDomain:'https://openapi-fk.easy4ip.com'});
  return ok({deviceList:[{deviceId:'C22E123',deviceName:'Entrada',deviceModel:'C22E',deviceStatus:'1',password:'hidden',channelList:[{channelId:0,channelName:'Entrada'}]}]});
 });
 assert.equal(calls[1].body.params.token,'private-token');
 assert.equal(calls[1].body.params.page,2);
 assert.equal(calls[1].body.params.pageSize,20);
 assert.equal(result.devices[0].status,'online');
 assert.equal(result.devices[0].channels[0].id,'0');
 assert.equal(JSON.stringify(result).includes('private-'),false);
 assert.equal(JSON.stringify(result).includes('hidden'),false);
});
test('Imou refuses untrusted region redirects and redacts provider errors',async()=>{
 let n=0;
 await assert.rejects(()=>listImouDevices(input,async()=>{n++;return ok({accessToken:'private-token',currentDomain:'https://evil.test'});}),ImouError);
 assert.equal(n,1);
 await assert.rejects(()=>listImouDevices(input,async()=>Response.json({result:{code:'SN1001',msg:'private-secret'}})),e=>e instanceof ImouError&&!e.message.includes('private-secret'));
});
test('Imou route requires identity, origin and valid fields before network',async()=>{
 let user=null,calls=0;
 const context=vm.createContext({Response,Request,URL,JSON});
 const source=ts.transpileModule(readFileSync('app/api/imou/route.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
 const route=new vm.SourceTextModule(source,{context});
 await route.link(async spec=>{const exports=spec.includes('chatgpt-auth')?{getChatGPTUser:async()=>user}:{...imou,listImouDevices:async()=>{calls++;return {devices:[]}}};return new vm.SyntheticModule(Object.keys(exports),function(){for(const[k,v]of Object.entries(exports))this.setExport(k,v)},{context})});
 await route.evaluate();const post=(body=input,origin='https://vigia.test')=>route.namespace.POST(new Request('https://vigia.test/api/imou',{method:'POST',headers:{origin},body:JSON.stringify(body)}));
 assert.equal((await post()).status,401);user={userId:'owner'};
 assert.equal((await post(input,'https://evil.test')).status,403);
 assert.equal((await post({...input,appSecret:''})).status,400);assert.equal(calls,0);
 const result=await post();assert.equal(result.status,200);assert.equal(result.headers.get('cache-control'),'no-store');assert.equal(calls,1);
});
