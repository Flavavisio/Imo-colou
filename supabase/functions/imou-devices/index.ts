import { createClient } from "npm:@supabase/supabase-js@2.95.0";
import md5 from "npm:blueimp-md5@2.19.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};

const hosts: Record<string, string> = {
  eu: "openapi-fk.easy4ip.com",
  us: "openapi-or.easy4ip.com",
  sg: "openapi-sg.easy4ip.com",
};
const allowedHosts = new Set(Object.values(hosts));

function keyFromEnv(group: string, legacy: string) {
  const raw = Deno.env.get(group);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      const value = parsed?.default;
      if (typeof value === "string" && value) {
        return value.startsWith("sb_") ? value : (Deno.env.get(value) || value);
      }
    } catch {}
  }
  return Deno.env.get(legacy) || "";
}
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: cors });
}
function textValue(v: unknown, max: number) {
  if (typeof v !== "string") return "";
  const s = v.trim();
  return s.length <= max ? s : "";
}
function identifier(v: unknown) {
  const s = String(v ?? "");
  return /^[A-Za-z0-9_-]{1,100}$/.test(s) ? s : "";
}
function safeError(code: string) {
  if (["SN1001", "SN1004"].includes(code)) return "App ID ou App Secret recusados. Confirma os dados da aplicação Imou.";
  if (code === "OP1013") return "A quota da API Imou foi atingida. Aguarda ou verifica os recursos da aplicação.";
  return "Pedido recusado pela Imou. Verifica permissões, região e quota.";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Método não permitido." }, 405);

  try {
    const url = Deno.env.get("SUPABASE_URL") || "";
    const publishableKey = keyFromEnv("SUPABASE_PUBLISHABLE_KEYS", "SUPABASE_ANON_KEY");
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!url || !publishableKey || !token) return json({ error: "Sessão em falta." }, 401);

    const supabase = createClient(url, publishableKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    const actor = userData?.user;
    if (userError || !actor) return json({ error: "Sessão inválida." }, 401);

    const { data: platformRows } = await supabase.from("platform_admins").select("user_id").eq("user_id", actor.id).limit(1);
    let allowed = Boolean(platformRows?.length);
    if (!allowed) {
      const { data: memberships } = await supabase
        .from("reseller_members")
        .select("role")
        .eq("user_id", actor.id)
        .in("role", ["owner", "admin", "operator"])
        .limit(1);
      allowed = Boolean(memberships?.length);
    }
    if (!allowed) return json({ error: "Sem permissão para consultar ligações Imou." }, 403);

    const body = await req.json().catch(() => ({}));
    const appId = textValue(body?.appId, 200);
    const appSecret = textValue(body?.appSecret, 300);
    const region = String(body?.region || "");
    const page = Number(body?.page || 1);
    if (!appId || !appSecret || !hosts[region] || !Number.isInteger(page) || page < 1 || page > 1000) {
      return json({ error: "Preenche App ID, App Secret, região e página válidos." }, 400);
    }

    let host = hosts[region];
    async function call(endpoint: string, params: Record<string, unknown>) {
      const timestamp = Math.round(Date.now() / 1000);
      const nonce = crypto.randomUUID().replaceAll("-", "");
      const sign = md5(`time:${timestamp},nonce:${nonce},appSecret:${appSecret}`);
      const payload = {
        system: { ver: "1.0", sign, appId, time: timestamp, nonce },
        params,
        id: crypto.randomUUID(),
      };

      let response: Response;
      try {
        response = await fetch(`https://${host}/openapi/${endpoint}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Client-Type": "VigiaCloud" },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(20000),
          redirect: "error",
        });
      } catch {
        throw new Error("Não foi possível contactar a Imou.");
      }
      if (!response.ok) throw new Error("A Imou não aceitou o pedido HTTP.");
      const raw = await response.text();
      if (raw.length > 1_000_000) throw new Error("Resposta Imou demasiado grande.");
      let parsed: any;
      try { parsed = JSON.parse(raw); } catch { throw new Error("Resposta Imou inválida."); }
      const result = parsed?.result;
      const code = String(result?.code ?? "");
      if (code !== "0") throw new Error(safeError(code));
      if (!result?.data || typeof result.data !== "object") throw new Error("Resposta Imou incompleta.");
      return result.data as Record<string, any>;
    }

    const auth = await call("accessToken", {});
    const accessToken = textValue(auth.accessToken, 4096);
    if (!accessToken) return json({ error: "A Imou não devolveu um token válido." }, 502);

    if (auth.currentDomain) {
      try {
        const candidate = new URL(String(auth.currentDomain).includes("://") ? String(auth.currentDomain) : "https://" + String(auth.currentDomain));
        if (candidate.protocol !== "https:" || candidate.username || candidate.password || !allowedHosts.has(candidate.hostname) || (candidate.port && candidate.port !== "443")) {
          return json({ error: "A região devolvida pela Imou não é suportada." }, 502);
        }
        host = candidate.hostname;
      } catch {
        return json({ error: "A região devolvida pela Imou é inválida." }, 502);
      }
    }

    const data = await call("listDeviceDetailsByPage", { token: accessToken, page, pageSize: 20 });
    const list = Array.isArray(data.deviceList) ? data.deviceList.slice(0, 20) : [];
    const devices = list.map((d: any) => {
      const deviceId = identifier(d?.deviceId);
      if (!deviceId) return null;
      const channels = Array.isArray(d?.channelList)
        ? d.channelList.slice(0, 256).map((ch: any) => {
            const channelId = identifier(ch?.channelId);
            if (!channelId) return null;
            return { id: channelId, name: textValue(ch?.channelName, 150) || `Canal ${channelId}` };
          }).filter(Boolean)
        : [];
      return {
        id: deviceId,
        name: textValue(d?.deviceName, 150) || deviceId,
        model: textValue(d?.deviceModel, 150),
        status: String(d?.deviceStatus) === "1" ? "online" : String(d?.deviceStatus) === "0" ? "offline" : "unknown",
        channels,
      };
    }).filter(Boolean);

    return json({
      devices,
      page,
      hasMore: Number(data.count || list.length) >= 20,
      checkedAt: new Date().toISOString(),
    });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Não foi possível consultar a Imou." }, 502);
  }
});