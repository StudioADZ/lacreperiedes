import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, errorResponse, successResponse, serverErrorResponse } from "../_shared/validation.ts";

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        ...corsHeaders,
        "Access-Control-Allow-Methods": "POST,OPTIONS",
      },
    });
  }

  // Only POST
  if (req.method !== "POST") {
    return errorResponse("method_not_allowed", "Méthode non autorisée", 405);
  }

  try {
    const ADMIN_PASSWORD = Deno.env.get("ADMIN_PASSWORD");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!ADMIN_PASSWORD || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Admin settings env not configured", {
        hasAdminPassword: Boolean(ADMIN_PASSWORD),
        hasUrl: Boolean(SUPABASE_URL),
        hasServiceKey: Boolean(SUPABASE_SERVICE_ROLE_KEY),
      });
      return serverErrorResponse();
    }

    // Safe JSON parse
    let body: any;
    try {
      body = await req.json();
    } catch {
      return errorResponse("bad_request", "JSON invalide", 400);
    }

    const { adminPassword, action, settingKey, isActive, settingValue } = body ?? {};

    // Authenticate admin
    if (!adminPassword || adminPassword !== ADMIN_PASSWORD) {
      return errorResponse("unauthorized", "Mot de passe incorrect", 401);
    }

    // Validate action
    if (action !== "get" && action !== "update") {
      return errorResponse("invalid_action", "Action non reconnue", 400);
    }

    // Validate settingKey (required for both actions)
    if (!settingKey || typeof settingKey !== "string" || settingKey.length > 50) {
      return errorResponse("invalid_input", "Clé de paramètre invalide", 400);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    if (action === "get") {
      const { data, error } = await supabase
        .from("admin_settings")
        .select("*")
        .eq("setting_key", settingKey)
        .maybeSingle();

      if (error) {
        console.error("Error fetching setting:", error);
        return serverErrorResponse();
      }

      // Keep same response shape
      return successResponse({ setting: data });
    }

    if (action === "update") {
      // IMPORTANT: avoid "|| {}" which overwrites false/0/"" with {}
      const safeValue = settingValue ?? {};

      // Run update
      const { data, error } = await supabase
        .from("admin_settings")
        .update({
          is_active: Boolean(isActive),
          setting_value: safeValue,
          updated_at: new Date().toISOString(),
        })
        .eq("setting_key", settingKey)
        // Non-destructive check: see if a row was affected
        .select("id")
        .maybeSingle();

      if (error) {
        console.error("Error updating setting:", error);
        return serverErrorResponse();
      }

      // If key didn't exist, data will be null (no rows updated)
      // We keep successResponse contract, but you can optionally warn:
      // if (!data) return successResponse({ success: true, warning: "setting_not_found" })

      return successResponse({ success: true });
    }

    // Should be unreachable due to action check
    return errorResponse("invalid_action", "Action non reconnue", 400);
  } catch (error) {
    console.error("Admin settings error:", error);
    return serverErrorResponse();
  }
});
