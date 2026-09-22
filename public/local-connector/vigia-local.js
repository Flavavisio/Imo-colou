#!/usr/bin/env node
/**
 * Vigia Cloud — diagnóstico RTSP local.
 * Não grava, não recebe eventos e não envia vídeo ou passwords para a cloud.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';

const privateIpv4 = host => {
  const p=String(host||'').split('.');
  if(p.length!==4||p.some(x=>!/^(0|[1-9]\d{0,2})$/.test(x)||Number(x)>255)) return false;
  const n=p.map(Number);
  return n[0]===10 || (n[0]===172&&n[1]>=16&&n[1]<=31) || (n[0]===192&&n[1]===168);
};
const uuid = v => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(v||''));
const safePath = v => typeof v==='string' && v.startsWith('/') && v.length<=300 &&
  !/[\s@\\]|:\/\/|(?:[?&])(?:user(?:name)?|pass(?:word)?|pwd|token|auth)=/i.test(v);

function validate(c){
  if(c?.format!=='vigia-local-config-v1') throw Error('Formato de configuração inválido.');
  if(!uuid(c.cameraId)) throw Error('cameraId inválido.');
  if(!privateIpv4(c.host)) throw Error('Usa um IPv4 privado da rede local.');
  if(!Number.isInteger(c.port)||c.port<1||c.port>65535) throw Error('Porta inválida.');
  if(!safePath(c.path)) throw Error('Indica apenas o caminho RTSP, sem credenciais.');
  return c;
}
function parseArgs(){
  const args=process.argv.slice(2);let config='',output='vigia-relatorio.json';
  for(let i=0;i<args.length;i++){
    if(args[i]==='--config') config=args[++i]||'';
    else if(args[i]==='--output') output=args[++i]||output;
  }
  if(!config) throw Error('Usa: node vigia-local.js --config vigia-local-config.json');
  return {config,output};
}
function ask(label,{secret=false}={}){
  return new Promise(resolve=>{
    if(!process.stdin.isTTY||!secret){
      process.stdout.write(label);
      process.stdin.resume();process.stdin.setEncoding('utf8');
      process.stdin.once('data',d=>{process.stdin.pause();resolve(String(d).trim())});
      return;
    }
    process.stdout.write(label);
    const chars=[];process.stdin.setRawMode(true);process.stdin.resume();process.stdin.setEncoding('utf8');
    const onData=ch=>{
      if(ch==='\r'||ch==='\n'){process.stdin.setRawMode(false);process.stdin.pause();process.stdin.off('data',onData);process.stdout.write('\n');resolve(chars.join(''));return}
      if(ch==='\u0003') process.exit(130);
      if(ch==='\u007f'){if(chars.length){chars.pop();process.stdout.write('\b \b')}return}
      chars.push(ch);process.stdout.write('*');
    };
    process.stdin.on('data',onData);
  });
}
function probe(config,username,password){
  const result={format:'vigia-local-report-v1',cameraId:config.cameraId,host:config.host,port:config.port,path:config.path,
    checkedAt:new Date().toISOString(),status:'failed',reason:'connection_failed',codec:'unknown',width:0,height:0};
  const check=spawnSync('ffprobe',['-version'],{encoding:'utf8'});
  if(check.error?.code==='ENOENT'){result.status='tool_missing';result.reason='ffprobe_missing';return result}
  const auth=username?encodeURIComponent(username)+':'+encodeURIComponent(password)+'@':'';
  const uri='rtsp://'+auth+config.host+':'+config.port+config.path;
  const temp=path.join(os.tmpdir(),'vigia-'+process.pid+'-'+Date.now()+'.txt');
  try{
    fs.writeFileSync(temp,uri,{encoding:'utf8',mode:0o600,flag:'wx'});
    const p=spawnSync('ffprobe',['-v','error','-rtsp_transport','tcp','-/i',temp,'-select_streams','v:0','-show_entries','stream=codec_name,width,height','-of','json'],
      {encoding:'utf8',timeout:20000,maxBuffer:1024*1024});
    if(p.error?.code==='ETIMEDOUT'){result.reason='timeout';return result}
    if(p.status!==0){
      if(/Option not found|Unrecognized option/i.test(p.stderr||'')) result.reason='ffprobe_update_required';
      return result;
    }
    const streams=JSON.parse(p.stdout||'{}').streams||[];
    if(!streams.length) return result;
    const s=streams[0],w=Number(s.width||0),h=Number(s.height||0);
    if(!(w>0&&w<=32768&&h>0&&h<=32768)) return result;
    result.status='stream_found';result.reason='stream_detected';
    result.codec=s.codec_name==='h264'?'H.264':s.codec_name==='hevc'?'H.265':'other';
    result.width=w;result.height=h;return result;
  }catch{result.reason='probe_failed';return result}
  finally{try{fs.unlinkSync(temp)}catch{}}
}
async function main(){
  try{
    const a=parseArgs();
    const st=fs.statSync(a.config);if(st.size>8192) throw Error('Configuração demasiado grande.');
    const config=validate(JSON.parse(fs.readFileSync(a.config,'utf8').replace(/^\uFEFF/,'')));
    if(fs.existsSync(a.output)) throw Error('O ficheiro de saída já existe. Usa outro nome com --output.');
    console.log('Diagnóstico local. As credenciais não são enviadas para a aplicação.');
    const username=await ask('Utilizador da câmara (Enter se não houver): ');
    const password=username?await ask('Password da câmara: ',{secret:true}):'';
    const result=probe(config,username,password);
    fs.writeFileSync(a.output,JSON.stringify(result,null,2),{encoding:'utf8',flag:'wx'});
    console.log('Resultado:',result.status,'/',result.reason);
    console.log('Importa o relatório JSON na área Ligações do Vigia Cloud.');
    console.log('Este teste não valida eventos ONVIF nem gravação cloud.');
  }catch(e){console.error(e?.message||'Erro de configuração.');process.exit(1)}
}
main();
