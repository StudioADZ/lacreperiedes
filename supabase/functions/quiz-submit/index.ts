import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  corsHeaders,
  isValidEmail,
  isValidPhone,
  isValidName,
  isValidFingerprint,
  errorResponse,
  successResponse,
  serverErrorResponse,
  sanitizeForLog,
} from "../_shared/validation.ts";

function isValidUUID(id: string): boolean {
  if (typeof id !== "string") return false;
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        ...corsHeaders,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
    });
  }

  // Method guard (avoid req.json() throw on GET, etc.)
  if (req.method !== "POST") {
    return errorResponse("method_not_allowed", "Méthode non autorisée", 405);
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
      return serverErrorResponse();
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // JSON guard
    let body: any;
    try {
      body = await req.json();
    } catch {
      return errorResponse("invalid_json", "Requête invalide", 400);
    }

    const { sessionId, deviceFingerprint, firstName, email, phone, rgpdConsent } = body;

    // Log sanitized input (no PII)
    console.log("Quiz submit request:", sanitizeForLog(body));

    // Validate required fields
    if (!sessionId || !deviceFingerprint || !firstName || !email || !phone) {
      return errorResponse("missing_fields", "Tous les champs sont requis");
    }

    // Strict RGPD consent
    if (rgpdConsent !== true) {
      return errorResponse("rgpd_required", "Le consentement RGPD est requis");
    }

    // Validate sessionId format (prevents weird probing)
    if (!isValidUUID(sessionId)) {
      return errorResponse("invalid_session", "Session invalide");
    }

    // Validate input formats
    if (!isValidFingerprint(deviceFingerprint)) {
      return errorResponse("invalid_fingerprint", "Session invalide");
    }

    if (!isValidName(firstName)) {
      return errorResponse("invalid_name", "Prénom invalide (lettres uniquement, max 50 caractères)");
    }

    if (!isValidEmail(email)) {
      return errorResponse("invalid_email", "Format d'email invalide");
    }

    if (!isValidPhone(phone)) {
      return errorResponse("invalid_phone", "Format de téléphone invalide (10 chiffres)");
    }

    // Sanitize inputs
    const cleanFirstName = String(firstName).trim().slice(0, 50);
    const cleanEmail = String(email).trim().toLowerCase().slice(0, 100);
    const cleanPhone = String(phone).replace(/[\s.-]/g, "").slice(0, 15);

    // Get session (must belong to fingerprint)
    const { data: session, error: sessionError } = await supabase
      .from("quiz_sessions")
      .select("*")
      .eq("id", sessionId)
      .eq("device_fingerprint", deviceFingerprint)
      .single();

    if (sessionError || !session) {
      return errorResponse("invalid_session", "Session invalide");
    }

    // Expiry guard (prevents submitting old sessions)
    if (session.expires_at && new Date(session.expires_at) < new Date()) {
      return errorResponse("session_expired", "Session expirée, veuillez recommencer");
    }

    // Already completed
    if (session.completed) {
      return errorResponse("already_submitted", "Ce quiz a déjà été soumis");
    }

    // Require quiz completion: exactly 10 answers
    const answersArray = Array.isArray(session.answers) ? session.answers : [];
    if (answersArray.length < 10 && (typeof session.current_question !== "number" || session.current_question < 10)) {
      return errorResponse("quiz_not_complete", "Veuillez terminer le quiz avant de valider");
    }

    // Calculate score
    const correctAnswers = answersArray.filter((a: { isCorrect: boolean }) => a?.isCorrect).length;
    const totalQuestions = 10;
    const percentage = (correctAnswers / totalQuestions) * 100;

    // Determine prize
    let prizeType: string | null = null;
    let prizeLabel: string | null = null;

    if (percentage === 100) {
      prizeType = "formule_complete";
      prizeLabel = "Formule Complète";
    } else if (percentage >= 90) {
      prizeType = "galette";
      prizeLabel = "Une Galette";
    } else if (percentage >= 80) {
      prizeType = "crepe";
      prizeLabel = "Une Crêpe";
    }

    // Get current week
    const { data: weekStart, error: weekErr } = await supabase.rpc("get_current_week_start");
    if (weekErr || !weekStart) {
      console.error("get_current_week_start error");
      return serverErrorResponse();
    }

    // Check for existing win this week with same phone
    const { data: existingPhoneWin, error: phoneWinErr } = await supabase
      .from("quiz_participations")
      .select("id")
      .eq("phone", cleanPhone)
      .eq("week_start", weekStart)
      .not("prize_won", "is", null)
      .maybeSingle();

    if (phoneWinErr) {
      console.error("existingPhoneWin query error");
      return serverErrorResponse();
    }

    if (existingPhoneWin) {
      return errorResponse("phone_already_won", "Ce numéro de téléphone a déjà gagné cette semaine");
    }

    // Try to "lock" the session completion early to avoid double submit
    // If someone retries, this prevents duplicate inserts most of the time
    const { data: completedRows, error: completeErr } = await supabase
      .from("quiz_sessions")
      .update({ completed: true })
      .eq("id", sessionId)
      .eq("completed", false)
      .select("id")
      .maybeSingle();

    if (completeErr) {
      console.error("Session completion update error");
      return serverErrorResponse();
    }

    if (!completedRows) {
      // Another request already completed it
      return errorResponse("already_submitted", "Ce quiz a déjà été soumis");
    }

    // Check stock and claim prize if won
    let prizeCode: string | null = null;
    let stockClaimed = false;

    if (prizeType) {
      // Ensure weekly stock exists
      await supabase.rpc("ensure_weekly_stock");

      // Try to claim prize
      const { data: claimed, error: claimErr } = await supabase.rpc("claim_prize", {
        p_prize_type: prizeType,
        p_week_start: weekStart,
      });

      if (claimErr) {
        console.error("claim_prize error");
        // If claim fails, we treat as no prize (don’t block participation)
        prizeType = null;
        prizeLabel = null;
      } else if (claimed) {
        stockClaimed = true;
        // Generate unique prize code
        const { data: code, error: codeErr } = await supabase.rpc("generate_prize_code");
        if (codeErr || !code) {
          console.error("generate_prize_code error");
          // No code => no prize (avoid issuing a “prize without code”)
          prizeType = null;
          prizeLabel = null;
          prizeCode = null;
          stockClaimed = false; // NOTE: stock may already be claimed; see log below
        } else {
          prizeCode = code;
        }
      } else {
        // Stock exhausted
        prizeType = null;
        prizeLabel = null;
      }
    }

    // Create participation record
    const { error: partError } = await supabase.from("quiz_participations").insert({
      first_name: cleanFirstName,
      email: cleanEmail,
      phone: cleanPhone,
      device_fingerprint: deviceFingerprint,
      score: correctAnswers,
      total_questions: totalQuestions,
      prize_won: prizeLabel,
      prize_code: prizeCode,
      week_start: weekStart,
      rgpd_consent: true,
      status: prizeLabel ? "won" : "completed",
    });

    if (partError) {
      console.error("Participation insert error");

      // IMPORTANT: if stock was claimed but insert failed, we cannot rollback here safely.
      if (stockClaimed) {
        console.error("WARNING: stock claimed but participation insert failed (needs manual review).");
      }

      return serverErrorResponse();
    }

    // Get updated stock (public info). If table missing, don’t fail.
    const { data: stock } = await supabase
      .from("weekly_stock")
      .select("galette_remaining, crepe_remaining, formule_complete_remaining")
      .eq("week_start", weekStart)
      .maybeSingle();

    return successResponse({
      success: true,
      score: correctAnswers,
      totalQuestions,
      percentage,
      prizeWon: prizeLabel,
      prizeCode,
      firstName: cleanFirstName,
      stock: stock || null,
    });
  } catch (error: unknown) {
    console.error("Quiz submit error:", error instanceof Error ? error.message : "Unknown");
    return serverErrorResponse();
  }
});
