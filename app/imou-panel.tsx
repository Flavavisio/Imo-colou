'use client';
import {useState} from 'react';
import {Cloud,RefreshCw,Unplug} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Select,SelectContent,SelectItem,SelectTrigger,SelectValue} from '@/components/ui/select';
import type {Records} from '@/lib/model';
import type {ImouDevice} from '@/lib/imou';
type Result={devices:ImouDevice[];page:number;hasMore:boolean;checkedAt:string};
export default function ImouPanel({data,save,saving}:{data:Records;save:(d:Records)=>Promise<boolean>;saving:boolean}){
 const [appId,setAppId]=useState(''),[secret,setSecret]=useState(''),[region,setRegion]=useState('eu'),[busy,setBusy]=useState(false),[result,setResult]=useState<Result|null>(null),[error,setError]=useState(''),[message,setMessage]=useState(''),[selected,setSelected]=useState(''),[target,setTarget]=useState(''),[channel,setChannel]=useState('0');
 const cameras=data.cameras.filter(c=>c.connectionMode==='imou');
 const device=result?.devices.find(d=>d.id===selected);
 const camera=cameras.find(c=>c.id===target);
 async function consult(page=1){
  setBusy(true);setError('');setMessage('');setSelected('');setResult(null);
  try{const r=await fetch('/api/imou',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({appId,appSecret:secret,region,page})});const body=await r.json() as Result&{error?:string};if(!r.ok)throw new Error(body.error||'Não foi possível consultar a Imou.');setResult(body);}
  catch(e){setError(e instanceof Error?e.message:'Não foi possível consultar a Imou.');}finally{setBusy(false);}
 }
 function disconnect(){setSecret('');setAppId('');setResult(null);setSelected('');setTarget('');setError('');setMessage('Dados de acesso removidos desta sessão. As associações guardadas foram mantidas.');}
 async function associate(){
  if(!device||!camera)return;setError('');setMessage('');
  if(data.cameras.some(c=>c.id!==camera.id&&c.connectionMode==='imou'&&c.imouDeviceId===device.id&&c.imouChannelId===channel)){setError('Este equipamento e canal já estão associados a outra câmara.');return;}
  if(await save({...data,cameras:data.cameras.map(c=>c.id===camera.id?{...c,imouDeviceId:device.id,imouChannelId:channel}:c)}))setMessage('Associação guardada na Vigia Cloud. Eventos e gravação continuam por ativar.');else setError('Não foi possível guardar. Consulta a mensagem da aplicação.');
 }
 return <section className="panel activity"><div className="panel-title"><div><h2>Imou · conta e equipamentos</h2><p>Consulta a conta e associa os equipamentos às câmaras dos teus clientes.</p></div><Cloud/></div><div className="form-panel"><div className="connection-steps"><div><span>1</span><h3>Criar a aplicação Imou</h3><p>Regista a conta de programador, cria a aplicação e obtém o App ID e App Secret.</p><a href="https://open.imoulife.com/" target="_blank" rel="noreferrer">Abrir Imou Open Platform</a></div><div><span>2</span><h3>Preparar os equipamentos</h3><p>Os equipamentos têm de estar disponíveis na conta Imou consultada. Esta área não transfere câmaras de outras contas.</p></div><div><span>3</span><h3>Associar ao cliente</h3><p>Cria a câmara na instalação do cliente e escolhe «Integração Imou». Depois associa o equipamento e o canal abaixo.</p></div></div>
 <form className="imou-credentials" onSubmit={e=>{e.preventDefault();void consult()}}>
 <div><Label htmlFor="imou-app">App ID</Label><Input id="imou-app" autoComplete="off" value={appId} maxLength={200} required disabled={busy} onChange={e=>{setAppId(e.target.value);setResult(null);setSelected('')}}/></div>
 <div><Label htmlFor="imou-secret">App Secret</Label><Input id="imou-secret" type="password" autoComplete="new-password" value={secret} maxLength={300} required disabled={busy} onChange={e=>{setSecret(e.target.value);setResult(null);setSelected('')}}/></div>
 <div><Label>Região da conta</Label><Select value={region} disabled={busy} onValueChange={v=>{setRegion(v);setResult(null);setSelected('')}}><SelectTrigger aria-label="Região Imou"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="eu">Europa · Frankfurt</SelectItem><SelectItem value="us">América · Oregon</SelectItem><SelectItem value="sg">Ásia · Singapura</SelectItem></SelectContent></Select></div>
 <Button type="submit" disabled={busy||saving||!appId.trim()||!secret}><RefreshCw size={16}/>{busy?'A consultar…':'Consultar equipamentos'}</Button>
 </form><p>Os dados de acesso são enviados ao servidor para consultar a Imou por HTTPS. Não são guardados na base de dados nem no armazenamento do navegador; ficam apenas nesta sessão enquanto esta área estiver aberta.</p>
 <div className="flex gap-3 items-center flex-wrap"><Button variant="outline" disabled={busy} onClick={disconnect}><Unplug size={16}/>Limpar dados de acesso</Button><span className="pill amber">{result?'Consulta concluída':'Ligação ainda não validada'}</span></div>
 {error&&<p role="alert" className="form-error">{error}</p>}{message&&<p role="status" className="success-box">{message}</p>}
 {result&&<><div className="panel-title"><div><h3>Equipamentos da conta · página {result.page}</h3><p>Consulta de {new Date(result.checkedAt).toLocaleString('pt-PT')}. O estado não é atualizado automaticamente.</p></div><div className="flex gap-2"><Button variant="outline" disabled={busy||result.page<=1} onClick={()=>void consult(result.page-1)}>Anterior</Button><Button variant="outline" disabled={busy||!result.hasMore} onClick={()=>void consult(result.page+1)}>Seguinte</Button></div></div>
 {!result.devices.length?<p>Nenhum equipamento nesta página. Confirma a conta e a região no portal Imou.</p>:<><Label>Equipamento Imou</Label><Select value={selected||'none'} onValueChange={v=>{setSelected(v);setChannel(result.devices.find(d=>d.id===v)?.channels[0]?.id||'0');setMessage('')}}><SelectTrigger aria-label="Equipamento Imou"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="none">Selecionar equipamento</SelectItem>{result.devices.map(d=><SelectItem key={d.id} value={d.id}>{d.name} · {d.id}</SelectItem>)}</SelectContent></Select>
 {device&&<><p><strong>{device.model||'Modelo não indicado'}</strong> · {device.status==='online'?'Online na consulta':device.status==='offline'?'Offline na consulta':'Estado desconhecido'}</p><Label>Canal</Label>{device.channels.length?<Select value={channel} onValueChange={setChannel}><SelectTrigger aria-label="Canal Imou"><SelectValue/></SelectTrigger><SelectContent>{device.channels.map(c=><SelectItem key={c.id} value={c.id}>{c.name} · {c.id}</SelectItem>)}</SelectContent></Select>:<><Input aria-label="Canal Imou" value={channel} maxLength={100} onChange={e=>setChannel(e.target.value)}/><small>A Imou não devolveu canais. Confirma o número no equipamento; 0 é apenas o valor inicial.</small></>}
 <Label>Câmara na Vigia Cloud</Label><Select value={target||'none'} onValueChange={setTarget}><SelectTrigger aria-label="Câmara a associar"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="none">Selecionar câmara</SelectItem>{cameras.map(c=><SelectItem key={c.id} value={c.id}>{c.name} · {data.locations.find(l=>l.id===c.locationId)?.name}</SelectItem>)}</SelectContent></Select>{!cameras.length&&<p>Adiciona primeiro uma câmara com método de ligação Imou.</p>}
 {camera&&<p>Associação atual: {camera.imouDeviceId?`${camera.imouDeviceId} · canal ${camera.imouChannelId}`:'nenhuma'}. Ao guardar, passa a {device.id} · canal {channel}.</p>}
 <Button disabled={saving||busy||!camera||!/^[a-zA-Z0-9_-]{1,100}$/.test(channel)} onClick={()=>void associate()}>Guardar associação na Vigia Cloud</Button></>}</>}
 </>}
 <div className="local-result"><div className="storage-row">Câmaras Imou com identificador guardado<span>{cameras.filter(c=>c.imouDeviceId).length} / {cameras.length}</span></div><div className="storage-row">Eventos automáticos<span>Por integrar</span></div><div className="storage-row">Clips e gravação cloud<span>Por integrar</span></div><p>A associação guarda o ID e o canal. Não confirma a compatibilidade da C22E com eventos ou acesso a clips.</p></div>
 </div></section>
}
