import {test} from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import vm from 'node:vm';import ts from 'typescript';
test('Private logo upload, format and size limits, cross-owner isolation',async()=>{
 let user=null;const objects=new Map();const bucket={async put(key,bytes,opts){objects.set(key,{body:bytes,httpMetadata:opts.httpMetadata})},async get(key){return objects.get(key)||null}};
 const context=vm.createContext({Response,Request,File,FormData,crypto,TextEncoder,Uint8Array,Array,console,URL,Number,String});
 const source=ts.transpileModule(readFileSync('app/api/logo/route.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
 const route=new vm.SourceTextModule(source,{context});await route.link(async spec=>{const e=spec==='cloudflare:workers'?{env:{BUCKET:bucket}}:{getChatGPTUser:async()=>user};return new vm.SyntheticModule(Object.keys(e),function(){for(const[k,v]of Object.entries(e))this.setExport(k,v)},{context})});await route.evaluate();const{POST,GET}=route.namespace;
 const send=(bytes,type='image/png',origin='https://vigia.test')=>{const f=new FormData();f.set('logo',new File([bytes],'logo.png',{type}));return POST(new Request('https://vigia.test/api/logo',{method:'POST',headers:{origin},body:f}))};
 const png=new Uint8Array([137,80,78,71,13,10,26,10,0,0,0,0]);assert.equal((await send(png)).status,401);
 user={userId:'owner-a'};let response=await send(png);assert.equal(response.status,200);const{id}=await response.json();let req=new Request('https://vigia.test/api/logo?id='+id);assert.equal((await GET(req)).status,200);
 user={userId:'owner-b'};assert.equal((await GET(req)).status,404);assert.equal((await send(new TextEncoder().encode('<svg onload="alert(1)"></svg>'),'image/svg+xml')).status,400);assert.equal((await send(new Uint8Array(262145))).status,400);assert.equal((await send(png,'image/png','https://evil.test')).status,403);
});
