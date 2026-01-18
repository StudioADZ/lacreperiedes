import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  corsHeaders,
  isValidPrizeCode,
  isValidName,
  errorResponse,
  successResponse,
  serverErrorResponse,
  sanitizeForLog,
} from "../_shared/validation.ts";

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

  // Only POST (hardening that shouldn't break normal usage)
  if (req.method !== "POST") {
    return errorResponse("method_not_allowed", "Méthode non autorisée", 405);
  }

  try {
    // Env checks (SAFE)
    const ADMIN_PASSWORD = Deno.env.get("ADMIN_PASSWORD");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!ADMIN_PASSWORD || !supabaseUrl || !supabaseServiceKey) {
      console.error("Missing env config for admin-scan function", {
        hasAdminPassword: Boolean(ADMIN_PASSWORD),
        hasSupabaseUrl: Boolean(supabaseUrl),
        hasServiceRoleKey: Boolean(supabaseServiceKey),
      });
      return serverErrorResponse();
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse JSON safely
    let body: any;
    try {
      body = await req.json();
    } catch {
      return errorResponse("bad_request", "JSON invalide", 400);
    }

    const { action, code, adminPassword, menuId, menuData, participationId } = body ?? {};

    // Log sanitized request (no passwords/codes)
    console.log("Admin request:", sanitizeForLog({ action, menuId, participationId }));

    // Verify admin password (keep exact error message)
    if (!adminPassword || adminPassword !== ADMIN_PASSWORD) {
      return errorResponse("unauthorized", "Mot de passe incorrect", 401);
    }

    // --- Actions ---

    if (action === "verify") {
      if (!code) return errorResponse("missing_code", "Code requis");
      if (!isValidPrizeCode(code)) return errorResponse("invalid_code", "Format de code invalide");

      const normalized = code.toUpperCase();

      const { data: participation, error } = await supabase
        .from("quiz_participations")
        .select(
          "id, first_name, prize_won, week_start, prize_claimed, claimed_at, created_at, status, security_token, token_generated_at",
        )
        .eq("prize_code", normalized)
        .maybeSingle();

      if (error) {
        console.error("Admin verify error:", error);
        return serverErrorResponse();
      }

      if (!participation) {
        return successResponse({ valid: false, message: "Code non trouvé" });
      }

      if (participation.status === "invalidated") {
        return successResponse({
          valid: false,
          message: "Ce coupon a été invalidé pour fraude",
          invalidated: true,
        });
      }

      // Week number (keep your logic)
      const weekDate = new Date(participation.week_start);
      const startOfYear = new Date(weekDate.getFullYear(), 0, 1);
      const weekNumber = Math.ceil(
        ((weekDate.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7,
      );

      const currentToken = generateSecurityToken();

      return successResponse({
        valid: true,
        id: participation.id,
        firstName: participation.first_name,
        prize: participation.prize_won,
        weekNumber,
        weekStart: participation.week_start,
        claimed: participation.prize_claimed,
        claimedAt: participation.claimed_at,
        createdAt: participation.created_at,
        expectedToken: currentToken,
        status: participation.status,
      });
    }

    if (action === "claim") {
      if (!code) return errorResponse("missing_code", "Code requis");
      if (!isValidPrizeCode(code)) return errorResponse("invalid_code", "Format de code invalide");

      const normalized = code.toUpperCase();

      const { data: existing, error: existingError } = await supabase
        .from("quiz_participations")
        .select("status, prize_claimed")
        .eq("prize_code", normalized)
        .maybeSingle();

      if (existingError) {
        console.error("Claim precheck error:", existingError);
        return serverErrorResponse();
      }

      if (existing?.status === "invalidated") {
        return successResponse({ success: false, message: "Ce coupon a été invalidé" });
      }

      if (existing?.prize_claimed) {
        return successResponse({ success: false, message: "Ce lot a déjà été réclamé" });
      }

      const { data, error } = await supabase
        .from("quiz_participations")
        .update({
          prize_claimed: true,
          claimed_at: new Date().toISOString(),
          status: "claimed",
        })
        .eq("prize_code", normalized)
        .eq("prize_claimed", false)
        .select("id, first_name, prize_won")
        .single();

      if (error) {
        console.error("Admin claim error:", error);
        return serverErrorResponse();
      }

      return successResponse({
        success: true,
        message: "Lot marqué comme utilisé",
        firstName: data.first_name,
        prize: data.prize_won,
      });
    }

    if (action === "invalidate") {
      if (!participationId || typeof participationId !== "string") {
        return errorResponse("missing_id", "ID participation requis");
      }

      const { data, error } = await supabase
        .from("quiz_participations")
        .update({
          status: "invalidated",
          prize_claimed: true,
          claimed_at: new Date().toISOString(),
        })
        .eq("id", participationId)
        .select("id, first_name")
        .single();

      if (error) {
        console.error("Invalidate error:", error);
        return serverErrorResponse();
      }

      return successResponse({
        success: true,
        message: "Participation invalidée",
        firstName: data.first_name,
      });
    }

    if (action === "list_participations") {
      const { data: participations, error } = await supabase
        .from("quiz_participations")
        .select(
          "id, created_at, first_name, email, phone, score, total_questions, prize_won, prize_code, prize_claimed, claimed_at, status",
        )
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) {
        console.error("List participations error:", error);
        return serverErrorResponse();
      }

      return successResponse({ participations });
    }

    if (action === "stats") {
      const { data: weekStart, error: weekErr } = await supabase.rpc("get_current_week_start");
      if (weekErr) {
        console.error("get_current_week_start error:", weekErr);
        return serverErrorResponse();
      }

      const { data: stock } = await supabase.from("weekly_stock").select("*").eq("week_start", weekStart).maybeSingle();

      const { count: totalParticipations } = await supabase
        .from("quiz_participations")
        .select("id", { count: "exact", head: true })
        .eq("week_start", weekStart);

      const { count: totalWinners } = await supabase
        .from("quiz_participations")
        .select("id", { count: "exact", head: true })
        .eq("week_start", weekStart)
        .not("prize_won", "is", null);

      const { count: totalClaimed } = await supabase
        .from("quiz_participations")
        .select("id", { count: "exact", head: true })
        .eq("week_start", weekStart)
        .eq("prize_claimed", true);

      return successResponse({
        weekStart,
        stock,
        totalParticipations: totalParticipations || 0,
        totalWinners: totalWinners || 0,
        totalClaimed: totalClaimed || 0,
      });
    }

    if (action === "update_secret_menu") {
      if (!menuId || !menuData) return errorResponse("missing_data", "Données requises");

      // Soft validation
      if (menuData.menu_name && !isValidName(menuData.menu_name)) {
        return errorResponse("invalid_menu_name", "Nom de menu invalide");
      }

      const secretCode =
        typeof menuData.secret_code === "string" ? menuData.secret_code.trim().toUpperCase().slice(0, 20) : undefined;

      const { data, error } = await supabase
        .from("secret_menu")
        .update({
          menu_name: typeof menuData.menu_name === "string" ? menuData.menu_name.slice(0, 100) : undefined,
          secret_code: secretCode, // keeps same field behavior, but cleaner
          galette_special: typeof menuData.galette_special === "string" ? menuData.galette_special.slice(0, 100) : null,
          galette_special_description:
            typeof menuData.galette_special_description === "string"
              ? menuData.galette_special_description.slice(0, 500)
              : null,
          crepe_special: typeof menuData.crepe_special === "string" ? menuData.crepe_special.slice(0, 100) : null,
          crepe_special_description:
            typeof menuData.crepe_special_description === "string" ? menuData.crepe_special_description.slice(0, 500) : null,
          galette_items: menuData.galette_items ?? [],
          crepe_items: menuData.crepe_items ?? [],
          valid_from: menuData.valid_from ? new Date(menuData.valid_from).toISOString() : null,
          valid_to: menuData.valid_to ? new Date(menuData.valid_to).toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", menuId)
        .select()
        .single();

      if (error) {
        console.error("Menu update error:", error);
        return serverErrorResponse();
      }

      return successResponse({ success: true, menu: data });
    }

    if (action === "get_security_token") {
      return successResponse({
        token: generateSecurityToken(),
        validFor: 10 - (Math.floor(Date.now() / 1000) % 10),
      });
    }

    return errorResponse("invalid_action", "Action non reconnue");
  } catch (error: unknown) {
    console.error("Admin scan error:", error instanceof Error ? error.message : "Unknown");
    return serverErrorResponse();
  }
});

// Generate a 4-digit security token that changes every 10 seconds
// SAFE upgrade: optional secret makes it less predictable, fallback keeps compatibility.
function generateSecurityToken(): string {
  const secret = Deno.env.get("SECURITY_TOKEN_SECRET") || ""; // optional
  const now = Math.floor(Date.now() / 10000); // changes every 10 seconds

  // If a secret exists, mix it in (still returns 4 digits)
  const input = secret ? `${now}|${secret}` : `${now}`;

  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) - hash) + input.charCodeAt(i);
    hash |= 0;
  }

  const token = Math.abs(hash).toString();
  return token.padStart(4, "0").slice(-4);
}
