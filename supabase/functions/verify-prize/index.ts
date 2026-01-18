import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  corsHeaders as baseCorsHeaders,
  isValidPrizeCode,
  errorResponse,
  successResponse,
  serverErrorResponse,
} from "../_shared/validation.ts";

const corsHeaders = {
  ...baseCorsHeaders,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function computeWeekNumberSimple(dateIso: string): number {
  // Keep your current behavior (non-destructive)
  const weekDate = new Date(dateIso);
  const startOfYear = new Date(weekDate.getFullYear(), 0, 1);
  return Math.ceil(
    ((weekDate.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7,
  );
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed", message: "Méthode non autorisée" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing");
      return serverErrorResponse();
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let body: any;
    try {
      body = await req.json();
    } catch {
      return errorResponse("invalid_json", "Requête invalide");
    }

    const rawCode = body?.code;
    if (!rawCode || typeof rawCode !== "string") {
      return errorResponse("missing_code", "Code requis");
    }

    const normalizedCode = rawCode.trim().toUpperCase();

    if (!isValidPrizeCode(normalizedCode)) {
      return errorResponse("invalid_code", "Format de code invalide");
    }

    // Add status to prevent returning valid for invalidated coupons
    const { data: participation, error } = await supabase
      .from("quiz_participations")
      .select("first_name, prize_won, week_start, prize_claimed, claimed_at, status")
      .eq("prize_code", normalizedCode)
      .maybeSingle();

    if (error) {
      console.error("Prize lookup error");
      return serverErrorResponse();
    }

    if (!participation) {
      return successResponse({
        valid: false,
        message: "Code non trouvé",
      });
    }

    if (participation.status === "invalidated") {
      return successResponse({
        valid: false,
        message: "Ce coupon a été invalidé",
        invalidated: true,
      });
    }

    const weekNumber = computeWeekNumberSimple(participation.week_start);

    return successResponse({
      valid: true,
      firstName: participation.first_name,
      prize: participation.prize_won,
      weekNumber,
      claimed: participation.prize_claimed,
      claimedAt: participation.claimed_at,
      // NOTE: email, phone, device_fingerprint, internal IDs are NOT returned
    });
  } catch (error: unknown) {
    console.error("Verify prize error:", error instanceof Error ? error.message : "Unknown");
    return serverErrorResponse();
  }
});
