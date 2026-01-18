import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  corsHeaders,
  // if you added it in _shared/validation.ts (recommended)
  // corsHeadersWithMethods,
  errorResponse,
  successResponse,
  serverErrorResponse,
  // Optional (if present)
  // sanitizeForLog,
} from "../_shared/validation.ts";

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    // SAFE: keep existing corsHeaders, but add methods locally (non-breaking)
    return new Response(null, {
      status: 204,
      headers: {
        ...corsHeaders,
        "Access-Control-Allow-Methods": "POST,OPTIONS",
      },
    });
  }

  // Only allow POST (safe hardening)
  if (req.method !== "POST") {
    return errorResponse("method_not_allowed", "Méthode non autorisée", 405);
  }

  try {
    const ADMIN_PASSWORD = Deno.env.get("ADMIN_PASSWORD");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!ADMIN_PASSWORD || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Missing env config for admin-messages function", {
        hasAdminPassword: Boolean(ADMIN_PASSWORD),
        hasSupabaseUrl: Boolean(SUPABASE_URL),
        hasServiceRoleKey: Boolean(SUPABASE_SERVICE_ROLE_KEY),
      });
      return serverErrorResponse();
    }

    // Parse JSON safely
    let body: any;
    try {
      body = await req.json();
    } catch {
      return errorResponse("bad_request", "JSON invalide", 400);
    }

    const { adminPassword, action, messageId } = body ?? {};

    // Authenticate admin (keep same UX/message)
    if (!adminPassword || adminPassword !== ADMIN_PASSWORD) {
      return errorResponse("unauthorized", "Mot de passe incorrect", 401);
    }

    // Create service role client for bypassing RLS
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Handle actions (keep response shape)
    if (action === "list") {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        console.error("Error fetching messages:", error);
        return serverErrorResponse();
      }

      return successResponse({ messages: data || [] });
    }

    if (action === "mark_read") {
      // Light validation (non-destructive)
      if (!messageId || typeof messageId !== "string") {
        return errorResponse("bad_request", "messageId manquant", 400);
      }

      const { error } = await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("id", messageId);

      if (error) {
        console.error("Error marking as read:", error);
        return serverErrorResponse();
      }

      return successResponse({ success: true });
    }

    return errorResponse("invalid_action", "Action non reconnue", 400);
  } catch (error) {
    console.error("Admin messages error:", error);
    return serverErrorResponse();
  }
});
