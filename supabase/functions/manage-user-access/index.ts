import { createClient } from "npm:@supabase/supabase-js@2.95.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

function keyFromEnv(group: string, legacy: string) {
  const raw = Deno.env.get(group);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      const value = parsed?.default;
      if (typeof value === "string" && value) {
        return value.startsWith("sb_") ? value : (Deno.env.get(value) || value);
      }
    } catch {
      // Fall through to legacy env.
    }
  }
  return Deno.env.get(legacy) || "";
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: cors });
}

function normEmail(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Método não permitido." }, 405);

  try {
    const url = Deno.env.get("SUPABASE_URL") || "";
    const publishableKey = keyFromEnv("SUPABASE_PUBLISHABLE_KEYS", "SUPABASE_ANON_KEY");
    const secretKey = keyFromEnv("SUPABASE_SECRET_KEYS", "SUPABASE_SERVICE_ROLE_KEY");
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "");

    if (!url || !publishableKey || !secretKey) return json({ error: "Configuração Supabase incompleta." }, 500);
    if (!token) return json({ error: "Sessão em falta." }, 401);

    const userClient = createClient(url, publishableKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const admin = createClient(url, secretKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: userData, error: userError } = await userClient.auth.getUser(token);
    const actor = userData?.user;
    if (userError || !actor) return json({ error: "Sessão inválida." }, 401);

    const body = await req.json().catch(() => ({}));
    const action = String(body?.action || "invite");

    const { data: platformRows } = await admin.from("platform_admins").select("user_id").eq("user_id", actor.id).limit(1);
    const isPlatformAdmin = Boolean(platformRows?.length);

    async function canManageReseller(resellerId: string) {
      if (isPlatformAdmin) return true;
      const { data } = await admin
        .from("reseller_members")
        .select("role")
        .eq("reseller_id", resellerId)
        .eq("user_id", actor.id)
        .in("role", ["owner", "admin"])
        .limit(1);
      return Boolean(data?.length);
    }

    if (action === "invite") {
      const email = normEmail(body?.email);
      const name = String(body?.name || "").trim();
      const targetType = String(body?.targetType || "");
      const resellerId = String(body?.resellerId || "");
      const clientId = String(body?.clientId || "");
      const role = String(body?.role || "");

      if (!email || !email.includes("@")) return json({ error: "Email inválido." }, 400);
      if (!resellerId) return json({ error: "Revendedor em falta." }, 400);
      if (!(await canManageReseller(resellerId))) return json({ error: "Sem permissão para gerir este revendedor." }, 403);

      if (targetType === "reseller") {
        if (!["owner", "admin", "operator", "viewer"].includes(role)) return json({ error: "Perfil de revendedor inválido." }, 400);
      } else if (targetType === "client") {
        if (!clientId) return json({ error: "Cliente em falta." }, 400);
        if (!["owner", "admin", "viewer"].includes(role)) return json({ error: "Perfil de cliente inválido." }, 400);
        const { data: clientRows } = await admin.from("clients").select("id,reseller_id").eq("id", clientId).eq("reseller_id", resellerId).limit(1);
        if (!clientRows?.length) return json({ error: "O cliente não pertence ao revendedor indicado." }, 400);
      } else {
        return json({ error: "Tipo de acesso inválido." }, 400);
      }

      let userId = "";
      let invited = false;
      const { data: existingProfiles } = await admin.from("profiles").select("id,email").eq("email", email).limit(1);
      if (existingProfiles?.length) {
        userId = existingProfiles[0].id;
      } else {
        const { data: inviteData, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
          data: name ? { full_name: name } : undefined,
        });
        if (inviteError) {
          const { data: retryProfiles } = await admin.from("profiles").select("id,email").eq("email", email).limit(1);
          if (!retryProfiles?.length) return json({ error: inviteError.message }, 400);
          userId = retryProfiles[0].id;
        } else {
          userId = inviteData.user?.id || "";
          invited = true;
        }
      }

      if (!userId) return json({ error: "Não foi possível resolver o utilizador." }, 500);

      if (targetType === "reseller") {
        const { error } = await admin.from("reseller_members").upsert(
          { reseller_id: resellerId, user_id: userId, role },
          { onConflict: "reseller_id,user_id" },
        );
        if (error) return json({ error: error.message }, 400);
      } else {
        const { error } = await admin.from("client_members").upsert(
          { client_id: clientId, reseller_id: resellerId, user_id: userId, role },
          { onConflict: "client_id,user_id" },
        );
        if (error) return json({ error: error.message }, 400);
      }

      return json({ ok: true, userId, email, invited, targetType, role });
    }

    if (action === "list") {
      const resellerId = String(body?.resellerId || "");
      if (!resellerId) return json({ error: "Revendedor em falta." }, 400);
      if (!(await canManageReseller(resellerId))) return json({ error: "Sem permissão para gerir este revendedor." }, 403);

      const { data: resellerMembers, error: rmError } = await admin
        .from("reseller_members")
        .select("user_id,role,created_at")
        .eq("reseller_id", resellerId)
        .order("created_at", { ascending: true });
      if (rmError) return json({ error: rmError.message }, 400);

      const { data: clientMembers, error: cmError } = await admin
        .from("client_members")
        .select("user_id,client_id,role,created_at")
        .eq("reseller_id", resellerId)
        .order("created_at", { ascending: true });
      if (cmError) return json({ error: cmError.message }, 400);

      const ids = [...new Set([...(resellerMembers || []).map(x => x.user_id), ...(clientMembers || []).map(x => x.user_id)])];
      let profiles: Record<string, { email: string; display_name: string | null }> = {};
      if (ids.length) {
        const { data: pRows } = await admin.from("profiles").select("id,email,display_name").in("id", ids);
        profiles = Object.fromEntries((pRows || []).map(p => [p.id, { email: p.email, display_name: p.display_name }]));
      }

      return json({
        resellerMembers: (resellerMembers || []).map(m => ({ ...m, ...profiles[m.user_id] })),
        clientMembers: (clientMembers || []).map(m => ({ ...m, ...profiles[m.user_id] })),
      });
    }

    return json({ error: "Ação inválida." }, 400);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Erro inesperado." }, 500);
  }
});