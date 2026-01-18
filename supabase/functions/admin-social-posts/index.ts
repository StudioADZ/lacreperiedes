import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  // SAFE: align with actual behavior (action-based API)
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(status: number, payload: Record<string, unknown>) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Validate URL format
function isValidUrl(url: string): boolean {
  if (typeof url !== "string" || url.length > 2000) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

// SAFE: align with your UI needs; add networks you actually use.
type AllowedNetwork =
  | "google"
  | "facebook"
  | "instagram"
  | "tiktok"
  | "youtube"
  | "whatsapp";

function isValidNetwork(network: string): network is AllowedNetwork {
  return (
    network === "google" ||
    network === "facebook" ||
    network === "instagram" ||
    network === "tiktok" ||
    network === "youtube" ||
    network === "whatsapp"
  );
}

// Validate UUID
function isValidUUID(id: string): boolean {
  if (typeof id !== "string") return false;
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // This endpoint is action-based; keep it POST-only to avoid JSON parse crashes.
  if (req.method !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const adminPassword = Deno.env.get("ADMIN_PASSWORD");

    if (!adminPassword || !supabaseUrl || !supabaseServiceKey) {
      console.error("Missing server env config", {
        hasAdminPassword: Boolean(adminPassword),
        hasUrl: Boolean(supabaseUrl),
        hasServiceKey: Boolean(supabaseServiceKey),
      });
      return json(500, { error: "Server configuration error" });
    }

    // Safe JSON parse
    let body: any;
    try {
      body = await req.json();
    } catch {
      return json(400, { error: "Invalid JSON body" });
    }

    const { action, password, ...data } = body ?? {};

    // Validate admin password
    if (!password || password !== adminPassword) {
      return json(401, { error: "Invalid admin password" });
    }

    // Create service role client to bypass RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    switch (action) {
      case "list": {
        const { data: posts, error } = await supabase
          .from("social_posts")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(200); // SAFE limit

        if (error) {
          console.error("List error:", error.message);
          return json(500, { error: "Failed to fetch posts" });
        }

        return json(200, { posts: posts ?? [] });
      }

      case "create": {
        const urlRaw = data?.url;
        const networkRaw = data?.network;

        const url = typeof urlRaw === "string" ? urlRaw.trim() : "";
        const network = typeof networkRaw === "string" ? networkRaw.trim().toLowerCase() : "";

        if (!url || !isValidUrl(url)) {
          return json(400, { error: "Invalid URL" });
        }

        if (!network || !isValidNetwork(network)) {
          return json(400, { error: "Invalid network" });
        }

        const { error } = await supabase.from("social_posts").insert({
          url,
          network,
          is_visible: true,
        });

        if (error) {
          console.error("Create error:", error.message);
          return json(500, { error: "Failed to create post" });
        }

        return json(201, { success: true });
      }

      case "update": {
        const { id, is_visible } = data ?? {};

        if (!id || !isValidUUID(id)) {
          return json(400, { error: "Invalid post ID" });
        }

        if (typeof is_visible !== "boolean") {
          return json(400, { error: "Invalid visibility value" });
        }

        // SAFE: detect "no rows updated"
        const { data: updated, error } = await supabase
          .from("social_posts")
          .update({ is_visible })
          .eq("id", id)
          .select("id")
          .maybeSingle();

        if (error) {
          console.error("Update error:", error.message);
          return json(500, { error: "Failed to update post" });
        }

        // Keep success contract; optional warning if you want:
        // if (!updated) return json(200, { success: true, warning: "not_found" });

        return json(200, { success: true });
      }

      case "delete": {
        const { id } = data ?? {};

        if (!id || !isValidUUID(id)) {
          return json(400, { error: "Invalid post ID" });
        }

        // SAFE: detect "no rows deleted"
        const { data: deleted, error } = await supabase
          .from("social_posts")
          .delete()
          .eq("id", id)
          .select("id")
          .maybeSingle();

        if (error) {
          console.error("Delete error:", error.message);
          return json(500, { error: "Failed to delete post" });
        }

        // Optional warning:
        // if (!deleted) return json(200, { success: true, warning: "not_found" });

        return json(200, { success: true });
      }

      default:
        return json(400, { error: "Invalid action" });
    }
  } catch (error) {
    console.error("Server error:", error instanceof Error ? error.message : "Unknown error");
    return json(500, { error: "Internal server error" });
  }
});
