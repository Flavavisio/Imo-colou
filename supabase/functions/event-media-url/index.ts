import { createClient } from "npm:@supabase/supabase-js@2.95.0";

const cors={
  "Access-Control-Allow-Origin":"*",
  "Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods":"POST, OPTIONS",
  "Content-Type":"application/json",
  "Cache-Control":"no-store",
};

function keyFromEnv(group:string,legacy:string){
  const raw=Deno.env.get(group);
  if(raw){
    try{
      const parsed=JSON.parse(raw),value=parsed?.default;
      if(typeof value==="string"&&value)return value.startsWith("sb_")?value:(Deno.env.get(value)||value);
    }catch{}
  }
  return Deno.env.get(legacy)||"";
}
function json(body:unknown,status=200){return new Response(JSON.stringify(body),{status,headers:cors});}

Deno.serve(async(req)=>{
  if(req.method==="OPTIONS")return new Response("ok",{headers:cors});
  if(req.method!=="POST")return json({error:"Método não permitido."},405);
  try{
    const url=Deno.env.get("SUPABASE_URL")||"";
    const publishableKey=keyFromEnv("SUPABASE_PUBLISHABLE_KEYS","SUPABASE_ANON_KEY");
    const secretKey=keyFromEnv("SUPABASE_SECRET_KEYS","SUPABASE_SERVICE_ROLE_KEY");
    const authHeader=req.headers.get("Authorization")||"";
    const token=authHeader.replace(/^Bearer\s+/i,"");
    if(!url||!publishableKey||!secretKey||!token)return json({error:"Sessão em falta."},401);

    const userClient=createClient(url,publishableKey,{
      global:{headers:{Authorization:authHeader}},
      auth:{persistSession:false,autoRefreshToken:false},
    });
    const admin=createClient(url,secretKey,{auth:{persistSession:false,autoRefreshToken:false}});

    const {data:userData,error:userError}=await userClient.auth.getUser(token);
    if(userError||!userData?.user)return json({error:"Sessão inválida."},401);

    const body=await req.json().catch(()=>({}));
    const eventId=String(body?.eventId||"");
    if(!/^[0-9a-f-]{36}$/i.test(eventId))return json({error:"Evento inválido."},400);

    const {data:events,error:eventError}=await userClient.from("events")
      .select("id,clip_path,status,camera_id")
      .eq("id",eventId)
      .limit(1);
    if(eventError)return json({error:eventError.message},400);
    if(!events?.length)return json({error:"Evento não disponível para esta conta."},404);

    const event=events[0];
    if(event.status!=="clip_ready"||!event.clip_path)return json({error:"O clip ainda não está disponível."},409);

    const filename=`vigia-event-${event.id}.mp4`;
    const {data:play,error:playError}=await admin.storage.from("event-clips").createSignedUrl(event.clip_path,900);
    if(playError||!play?.signedUrl)return json({error:"Não foi possível abrir o clip."},500);
    const {data:download,error:downloadError}=await admin.storage.from("event-clips").createSignedUrl(event.clip_path,900,{download:filename});
    if(downloadError||!download?.signedUrl)return json({error:"Não foi possível preparar o download."},500);

    return json({playUrl:play.signedUrl,downloadUrl:download.signedUrl,expiresIn:900});
  }catch(error){
    return json({error:error instanceof Error?error.message:"Não foi possível abrir o clip."},500);
  }
});