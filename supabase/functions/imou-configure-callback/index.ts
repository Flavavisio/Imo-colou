import { createClient } from "npm:@supabase/supabase-js@2.95.0";
import md5 from "npm:blueimp-md5@2.19.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};
const hosts: Record<string,string> = {
  eu:"openapi-fk.easy4ip.com",
  us:"openapi-or.easy4ip.com",
  sg:"openapi-sg.easy4ip.com",
};
const allowedHosts = new Set(Object.values(hosts));

function keyFromEnv(group:string, legacy:string){
  const raw=Deno.env.get(group);
  if(raw){
    try{
      const parsed=JSON.parse(raw), value=parsed?.default;
      if(typeof value==="string"&&value)return value.startsWith("sb_")?value:(Deno.env.get(value)||value);
    }catch{}
  }
  return Deno.env.get(legacy)||"";
}
function json(body:unknown,status=200){return new Response(JSON.stringify(body),{status,headers:cors});}
function textValue(v:unknown,max:number){if(typeof v!=="string")return "";const s=v.trim();return s.length<=max?s:"";}
async function sha256Hex(value:string){
  const data=new TextEncoder().encode(value);
  const digest=await crypto.subtle.digest("SHA-256",data);
  return Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,"0")).join("");
}
function randomToken(){
  const bytes=crypto.getRandomValues(new Uint8Array(32));
  let s="";for(const b of bytes)s+=String.fromCharCode(b);
  return btoa(s).replaceAll("+","-").replaceAll("/","_").replaceAll("=","");
}
function safeError(code:string){
  if(["SN1001","SN1004"].includes(code))return "App ID ou App Secret recusados.";
  if(code==="OP1013")return "A quota da API Imou foi atingida.";
  return "Pedido recusado pela Imou. Verifica permissões, região e quota.";
}

Deno.serve(async(req)=>{
  if(req.method==="OPTIONS")return new Response("ok",{headers:cors});
  if(req.method!=="POST")return json({error:"Método não permitido."},405);
  try{
    const url=Deno.env.get("SUPABASE_URL")||"";
    const publishableKey=keyFromEnv("SUPABASE_PUBLISHABLE_KEYS","SUPABASE_ANON_KEY");
    const secretKey=keyFromEnv("SUPABASE_SECRET_KEYS","SUPABASE_SERVICE_ROLE_KEY");
    const authHeader=req.headers.get("Authorization")||"";
    const token=authHeader.replace(/^Bearer\s+/i,"");
    if(!url||!publishableKey||!secretKey||!token)return json({error:"Configuração ou sessão em falta."},401);

    const userClient=createClient(url,publishableKey,{
      global:{headers:{Authorization:authHeader}},
      auth:{persistSession:false,autoRefreshToken:false},
    });
    const admin=createClient(url,secretKey,{auth:{persistSession:false,autoRefreshToken:false}});
    const {data:userData,error:userError}=await userClient.auth.getUser(token);
    const actor=userData?.user;
    if(userError||!actor)return json({error:"Sessão inválida."},401);

    const body=await req.json().catch(()=>({}));
    const action=String(body?.action||"status");
    const resellerId=String(body?.resellerId||"");
    if(!/^[0-9a-f-]{36}$/i.test(resellerId))return json({error:"Revendedor inválido."},400);

    const {data:platformRows}=await admin.from("platform_admins").select("user_id").eq("user_id",actor.id).limit(1);
    let allowed=Boolean(platformRows?.length);
    if(!allowed){
      const {data:rows}=await admin.from("reseller_members")
        .select("role").eq("reseller_id",resellerId).eq("user_id",actor.id)
        .in("role",["owner","admin"]).limit(1);
      allowed=Boolean(rows?.length);
    }
    if(!allowed)return json({error:"Sem permissão para configurar callbacks deste revendedor."},403);

    const {data:current}=await admin.from("imou_callback_configs")
      .select("reseller_id,app_id,region,active,updated_at")
      .eq("reseller_id",resellerId).limit(1);
    if(action==="status")return json({configured:Boolean(current?.[0]?.active),config:current?.[0]||null});

    const appId=textValue(body?.appId,200),appSecret=textValue(body?.appSecret,300),region=String(body?.region||"");
    if(!appId||!appSecret||!hosts[region])return json({error:"App ID, App Secret ou região inválidos."},400);

    const {data:conflicts}=await admin.from("imou_callback_configs")
      .select("reseller_id").eq("app_id",appId).neq("reseller_id",resellerId).limit(1);
    if(conflicts?.length)return json({error:"Esta App ID Imou já está associada a outro revendedor."},409);

    let host=hosts[region];
    async function call(endpoint:string,params:Record<string,unknown>){
      const timestamp=Math.round(Date.now()/1000),nonce=crypto.randomUUID();
      const sign=md5(`time:${timestamp},nonce:${nonce},appSecret:${appSecret}`);
      const payload={system:{ver:"1.0",appId,sign,time:timestamp,nonce},params,id:crypto.randomUUID()};
      let response:Response;
      try{
        response=await fetch(`https://${host}/openapi/${endpoint}`,{
          method:"POST",headers:{"Content-Type":"application/json","Client-Type":"VigiaCloud"},
          body:JSON.stringify(payload),signal:AbortSignal.timeout(20000),redirect:"error",
        });
      }catch{throw new Error("Não foi possível contactar a Imou.");}
      if(!response.ok)throw new Error("A Imou não aceitou o pedido HTTP.");
      const raw=await response.text();if(raw.length>500000)throw new Error("Resposta Imou demasiado grande.");
      let parsed:any;try{parsed=JSON.parse(raw)}catch{throw new Error("Resposta Imou inválida.");}
      const result=parsed?.result,code=String(result?.code??"");
      if(code!=="0")throw new Error(safeError(code));
      return result?.data&&typeof result.data==="object"?result.data:{};
    }

    const auth=await call("accessToken",{});
    const accessToken=textValue(auth.accessToken,4096);
    if(!accessToken)return json({error:"A Imou não devolveu um token válido."},502);
    if(auth.currentDomain){
      try{
        const candidate=new URL(String(auth.currentDomain).includes("://")?String(auth.currentDomain):"https://"+String(auth.currentDomain));
        if(candidate.protocol!=="https:"||candidate.username||candidate.password||!allowedHosts.has(candidate.hostname)||(candidate.port&&candidate.port!=="443"))
          return json({error:"Região devolvida pela Imou não suportada."},502);
        host=candidate.hostname;
      }catch{return json({error:"Região devolvida pela Imou inválida."},502);}
    }

    if(action==="disable"){
      await call("setMessageCallback",{token:accessToken,status:"off",callbackFlag:"",callbackUrl:"",basePush:"2"});
      await admin.from("imou_callback_configs").update({active:false,updated_at:new Date().toISOString()}).eq("reseller_id",resellerId);
      return json({configured:false});
    }
    if(action!=="enable")return json({error:"Ação inválida."},400);

    const callbackToken=randomToken();
    const callbackUrl=`${url}/functions/v1/imou-callback?token=${encodeURIComponent(callbackToken)}`;
    await call("setMessageCallback",{
      token:accessToken,status:"on",callbackFlag:"alarm,deviceStatus",basePush:"2",callbackUrl,
    });

    const tokenHash=await sha256Hex(callbackToken);
    const {error:saveError}=await admin.from("imou_callback_configs").upsert({
      reseller_id:resellerId,token_hash:tokenHash,app_id:appId,region,active:true,updated_at:new Date().toISOString(),
    },{onConflict:"reseller_id"});
    if(saveError)return json({error:"Callback registado na Imou, mas não foi possível guardar a configuração. Repete a ativação."},500);
    return json({configured:true});
  }catch(error){
    return json({error:error instanceof Error?error.message:"Não foi possível configurar o callback Imou."},502);
  }
});