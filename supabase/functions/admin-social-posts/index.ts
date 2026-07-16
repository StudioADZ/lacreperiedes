import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (payload: unknown, status = 200) => new Response(JSON.stringify(payload), {
  status,
  headers: { ...corsHeaders, "Content-Type": "application/json" },
});

const isValidUrl = (url: unknown): url is string => {
  if (typeof url !== "string" || url.length > 2000) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

type SocialNetwork = "instagram" | "facebook" | "tiktok" | "youtube" | "google";

const SOCIAL_NETWORKS = new Set<SocialNetwork>([
  "instagram",
  "facebook",
  "tiktok",
  "youtube",
  "google",
]);

const isValidNetwork = (network: unknown): network is SocialNetwork =>
  typeof network === "string" && SOCIAL_NETWORKS.has(network as SocialNetwork);

const isValidUUID = (id: unknown): id is string =>
  typeof id === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceKey) return json({ error: "Server configuration error" }, 500);

    const body = await req.json();
    const { action, password, ...data } = body || {};
    const headerToken = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "").trim();
    const token = headerToken || (typeof password === "string" ? password.trim() : "");
    if (!token) return json({ error: "Admin session required" }, 401);

    const supabase = createClient(supabaseUrl, serviceKey);
    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    const user = authData.user;
    if (authError || !user?.id) return json({ error: "Invalid admin session" }, 401);

    const { data: hasAdminRole, error: roleError } = await supabase.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });
    if (roleError || hasAdminRole !== true) return json({ error: "Admin role required" }, 403);

    const audit = async (auditAction: string, targetId?: string) => {
      const { error } = await supabase.from("admin_audit_logs").insert({
        admin_user_id: user.id,
        admin_email: user.email || null,
        action: auditAction,
        target_type: "social_post",
        target_id: targetId || null,
      });
      if (error) console.error("Social audit log failed:", error.message);
    };

    if (action === "list") {
      const { data: posts, error } = await supabase.from("social_posts").select("*").order("created_at", { ascending: false });
      if (error) return json({ error: "Failed to fetch posts" }, 500);
      return json({ posts });
    }

    if (action === "create") {
      if (!isValidUrl(data.url)) return json({ error: "Invalid URL" }, 400);
      if (!isValidNetwork(data.network)) return json({ error: "Invalid network" }, 400);

      const { data: created, error } = await supabase.from("social_posts").insert({
        url: data.url.trim(),
        network: data.network,
        is_visible: true,
      }).select("id").single();
      if (error) return json({ error: "Failed to create post" }, 500);
      await audit("social_post.create", created.id);
      return json({ success: true, id: created.id }, 201);
    }

    if (action === "update") {
      if (!isValidUUID(data.id)) return json({ error: "Invalid post ID" }, 400);
      if (typeof data.is_visible !== "boolean") return json({ error: "Invalid visibility value" }, 400);

      const { error } = await supabase.from("social_posts").update({ is_visible: data.is_visible }).eq("id", data.id);
      if (error) return json({ error: "Failed to update post" }, 500);
      await audit("social_post.visibility", data.id);
      return json({ success: true });
    }

    if (action === "delete") {
      if (!isValidUUID(data.id)) return json({ error: "Invalid post ID" }, 400);
      const { error } = await supabase.from("social_posts").delete().eq("id", data.id);
      if (error) return json({ error: "Failed to delete post" }, 500);
      await audit("social_post.delete", data.id);
      return json({ success: true });
    }

    return json({ error: "Invalid action" }, 400);
  } catch (error) {
    console.error("Server error:", error instanceof Error ? error.message : "Unknown error");
    return json({ error: "Internal server error" }, 500);
  }
});
