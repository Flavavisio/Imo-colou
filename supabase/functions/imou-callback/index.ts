import { createClient } from "npm:@supabase/supabase-js@2.95.0";

function keyFromEnv(group:string, legacy:string){
  const raw=Deno.env.get(group);
  if(raw){
    try{
      const parsed=JSON.parse(raw),value=parsed?.default;
      if(typeof value==="string"&&value)return value.startsWith("sb_")?value:(Deno.env.get(value)||value);
    }catch{}
  }
  return Deno.env.get(legacy)||"";
}
function json(body:unknown,status=200){
  return new Response(JSON.stringify(body),{status,headers:{"Content-Type":"application/json","Cache-Control":"no-store"}});
}
async function sha256Hex(value:string){
  const digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,"0")).join("");
}
function ident(v:unknown){
  const s=String(v??"");
  return /^[A-Za-z0-9_-]{1,100}$/.test(s)?s:"";
}
function short(v:unknown,max=250){
  if(typeof v!=="string")return "";
  return v.slice(0,max);
}
function occurred(value:unknown){
  if(typeof value==="number"&&Number.isFinite(value)){
    const ms=value>10_000_000_000?value:value*1000;
    const d=new Date(ms);if(!Number.isNaN(d.getTime()))return d.toISOString();
  }
  const s=String(value??"");
  if(/^\d{10,13}$/.test(s)){
    const n=Number(s),d=new Date(s.length===13?n:n*1000);
    if(!Number.isNaN(d.getTime()))return d.toISOString();
  }
  const m=/^(\d{4})(\d{2})(\d{2})T?(\d{2})(\d{2})(\d{2})Z?$/.exec(s);
  if(m){
    const d=new Date(Date.UTC(+m[1],+m[2]-1,+m[3],+m[4],+m[5],+m[6]));
    if(!Number.isNaN(d.getTime()))return d.toISOString();
  }
  return new Date().toISOString();
}
function eventType(msgType:string){
  const s=msgType.toLowerCase();
  if(s.includes("veh"))return "vehicle";
  if(s.includes("human")||s.includes("person")||s.includes("perarea")||s.includes("perline")||s.includes("crossline"))return "person";
  if(s.includes("motion")||s.includes("mobile")||s.includes("pir"))return "motion";
  return "other";
}

Deno.serve(async(req)=>{
  if(req.method!=="POST")return json({ok:false},405);
  try{
    const url=Deno.env.get("SUPABASE_URL")||"";
    const secretKey=keyFromEnv("SUPABASE_SECRET_KEYS","SUPABASE_SERVICE_ROLE_KEY");
    if(!url||!secretKey)return json({ok:false},503);

    const callbackToken=new URL(req.url).searchParams.get("token")||"";
    if(!/^[A-Za-z0-9_-]{40,80}$/.test(callbackToken))return json({ok:false},401);
    const tokenHash=await sha256Hex(callbackToken);

    const admin=createClient(url,secretKey,{auth:{persistSession:false,autoRefreshToken:false}});
    const {data:configs,error:configError}=await admin.from("imou_callback_configs")
      .select("reseller_id,app_id,region,active").eq("token_hash",tokenHash).eq("active",true).limit(1);
    if(configError||!configs?.length)return json({ok:false},401);
    const config=configs[0];

    const contentLength=Number(req.headers.get("content-length")||0);
    if(contentLength>65536)return json({ok:true,ignored:"payload_too_large"});
    const raw=await req.text();
    if(raw.length>65536)return json({ok:true,ignored:"payload_too_large"});
    let body:any;try{body=JSON.parse(raw)}catch{return json({ok:true,ignored:"invalid_json"});}
    if(!body||typeof body!=="object"||Array.isArray(body))return json({ok:true,ignored:"invalid_payload"});

    const payloadApp=short(body.appId,200);
    if(payloadApp&&payloadApp!==config.app_id)return json({ok:true,ignored:"app_mismatch"});

    const deviceId=ident(body.did??body.deviceId??body.msgDeviceId);
    const channelId=ident(body.cid??body.channelId??body.msgChannelId??"0");
    const msgType=short(body.msgType,100);
    const at=occurred(body.time??body.localTime);
    if(!deviceId||!msgType)return json({ok:true,ignored:"missing_identity"});

    const statusMessage=["online","offline","close","changeDevName"].includes(msgType);
    if(statusMessage){
      let query=admin.from("cameras").update({
        online_status:msgType==="online"?"online":msgType==="changeDevName"?"unknown":"offline",
        provider_status_at:at,
      }).eq("reseller_id",config.reseller_id).eq("external_device_id",deviceId);
      if(channelId&&channelId!=="-1")query=query.eq("external_channel_id",channelId);
      await query;
      return json({ok:true,type:"deviceStatus"});
    }

    let {data:cameras}=await admin.from("cameras")
      .select("id,reseller_id,client_id,installation_id,camera_plan_id")
      .eq("reseller_id",config.reseller_id)
      .eq("external_device_id",deviceId)
      .eq("external_channel_id",channelId||"0")
      .limit(2);
    if(!cameras?.length){
      const fallback=await admin.from("cameras")
        .select("id,reseller_id,client_id,installation_id,camera_plan_id")
        .eq("reseller_id",config.reseller_id)
        .eq("external_device_id",deviceId)
        .limit(2);
      if(fallback.data?.length===1)cameras=fallback.data;
    }
    if(!cameras?.length)return json({ok:true,matched:false});
    const camera=cameras[0];

    const rawEventId=String(body.id??"");
    const stable=rawEventId&&rawEventId!=="-1"
      ? config.app_id+":"+rawEventId
      : config.app_id+":"+deviceId+":"+(channelId||"0")+":"+msgType+":"+String(body.time??at);
    const providerEventId=stable.slice(0,500);

    const {data:existing}=await admin.from("events").select("id").eq("provider","imou").eq("provider_event_id",providerEventId).limit(1);
    if(existing?.length)return json({ok:true,duplicate:true});

    const eventId=crypto.randomUUID();
    const metadata={
      msgType,
      channelName:short(body.cname,150),
      remark:short(body.remark,500),
      providerTime:String(body.time??"").slice(0,40),
      appId:config.app_id,
    };
    const {error:eventError}=await admin.from("events").insert({
      id:eventId,
      reseller_id:camera.reseller_id,
      client_id:camera.client_id,
      installation_id:camera.installation_id,
      camera_id:camera.id,
      event_type:eventType(msgType),
      provider:"imou",
      provider_event_id:providerEventId,
      occurred_at:at,
      status:"clip_pending",
      metadata,
    });
    if(eventError)return json({ok:false},500);

    const recordToken=short(body.token,4096);
    if(recordToken){
      await admin.from("imou_event_tokens").insert({event_id:eventId,record_token:recordToken});
    }

    let clipSeconds=30;
    if(camera.camera_plan_id){
      const {data:planRows}=await admin.from("camera_plans").select("max_clip_seconds").eq("id",camera.camera_plan_id).limit(1);
      if(planRows?.length)clipSeconds=Math.max(5,Math.min(120,Number(planRows[0].max_clip_seconds||30)));
    }
    const {error:jobError}=await admin.from("clip_jobs").insert({
      event_id:eventId,
      reseller_id:camera.reseller_id,
      camera_id:camera.id,
      clip_seconds:clipSeconds,
      status:"pending",
    });
    if(jobError){
      await admin.from("events").update({status:"metadata_only"}).eq("id",eventId);
    }

    await admin.from("cameras").update({last_event_at:at,online_status:"online",provider_status_at:new Date().toISOString()}).eq("id",camera.id);
    return json({ok:true,matched:true,clipQueued:!jobError});
  }catch{
    return json({ok:false},500);
  }
});