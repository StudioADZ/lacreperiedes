import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  corsHeaders as baseCorsHeaders,
  isValidFingerprint,
  errorResponse,
  successResponse,
  serverErrorResponse,
} from "../_shared/validation.ts";

// Add methods for better browser compatibility (non-destructive)
const corsHeaders = {
  ...baseCorsHeaders,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SESSION_TTL_MINUTES = 10; // initial TTL
const ANSWER_EXTEND_MINUTES = 5; // extend on each valid answer

function nowIso() {
  return new Date().toISOString();
}

function addMinutesIso(minutes: number) {
  return new Date(Date.now() + minutes * 60 * 1000).toISOString();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // This function is action-based; keep it POST-only
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

    // Safe JSON parse
    let body: any;
    try {
      body = await req.json();
    } catch {
      return errorResponse("invalid_json", "Requête invalide");
    }

    const { action, deviceFingerprint, sessionId, answer, questionIndex } = body ?? {};

    // Validate device fingerprint for all actions
    if (!isValidFingerprint(deviceFingerprint)) {
      return errorResponse("invalid_fingerprint", "Session invalide");
    }

    if (action === "start") {
      // Check if device already has a winning participation this week
      const { data: weekStart, error: weekErr } = await supabase.rpc("get_current_week_start");
      if (weekErr || !weekStart) {
        console.error("get_current_week_start error");
        return serverErrorResponse();
      }

      const { data: existingWin, error: winErr } = await supabase
        .from("quiz_participations")
        .select("id")
        .eq("device_fingerprint", deviceFingerprint)
        .eq("week_start", weekStart)
        .not("prize_won", "is", null)
        .maybeSingle();

      if (winErr) {
        console.error("existingWin lookup error");
        return serverErrorResponse();
      }

      if (existingWin) {
        return errorResponse("already_won", "Vous avez déjà gagné cette semaine !");
      }

      // Check for existing active session
      const { data: existingSession, error: sessErr } = await supabase
        .from("quiz_sessions")
        .select("*")
        .eq("device_fingerprint", deviceFingerprint)
        .eq("completed", false)
        .gt("expires_at", nowIso())
        .maybeSingle();

      if (sessErr) {
        console.error("existingSession lookup error");
        return serverErrorResponse();
      }

      if (existingSession) {
        // Get questions for existing session (without correct_answer)
        const { data: questions, error: qErr } = await supabase
          .from("quiz_questions")
          .select("id, question, option_a, option_b, option_c, option_d")
          .in("id", existingSession.question_ids);

        if (qErr) {
          console.error("questions fetch error");
          return serverErrorResponse();
        }

        // IMPORTANT: preserve session order
        const orderedQuestions = (existingSession.question_ids || [])
          .map((id: string) => questions?.find((q) => q.id === id))
          .filter(Boolean);

        return successResponse({ session: existingSession, questions: orderedQuestions });
      }

      // Get candidate questions
      const { data: localQuestions, error: localErr } = await supabase
        .from("quiz_questions")
        .select("id")
        .eq("is_active", true)
        .eq("category", "local")
        .limit(200);

      if (localErr) {
        console.error("localQuestions error");
        return serverErrorResponse();
      }

      const { data: foodQuestions, error: foodErr } = await supabase
        .from("quiz_questions")
        .select("id")
        .eq("is_active", true)
        .eq("category", "food")
        .limit(200);

      if (foodErr) {
        console.error("foodQuestions error");
        return serverErrorResponse();
      }

      const shuffledLocal = (localQuestions || []).sort(() => Math.random() - 0.5).slice(0, 8);
      const shuffledFood = (foodQuestions || []).sort(() => Math.random() - 0.5).slice(0, 2);

      const selectedIds = [...shuffledLocal, ...shuffledFood]
        .sort(() => Math.random() - 0.5)
        .map((q) => q.id);

      if (selectedIds.length < 10) {
        return errorResponse("not_enough_questions", "Pas assez de questions disponibles");
      }

      // Create session with explicit defaults (SAFE)
      const { data: session, error: sessionError } = await supabase
        .from("quiz_sessions")
        .insert({
          device_fingerprint: deviceFingerprint,
          question_ids: selectedIds,
          answers: [],
          current_question: 0,
          completed: false,
          started_at: nowIso(),
          last_activity: nowIso(),
          expires_at: addMinutesIso(SESSION_TTL_MINUTES),
        })
        .select()
        .single();

      if (sessionError) {
        console.error("Session creation error");
        return serverErrorResponse();
      }

      // Get full questions (without correct_answer)
      const { data: questions, error: questionsError } = await supabase
        .from("quiz_questions")
        .select("id, question, option_a, option_b, option_c, option_d")
        .in("id", selectedIds);

      if (questionsError) {
        console.error("Questions fetch error");
        return serverErrorResponse();
      }

      const orderedQuestions = selectedIds
        .map((id) => questions?.find((q) => q.id === id))
        .filter(Boolean);

      return successResponse({ session, questions: orderedQuestions });
    }

    if (action === "answer") {
      // Validate session ID format
      if (!sessionId || typeof sessionId !== "string") {
        return errorResponse("invalid_session", "Session invalide");
      }

      // Validate answer
      const normalizedAnswer = typeof answer === "string" ? answer.toUpperCase().trim() : "";
      if (!normalizedAnswer || !["A", "B", "C", "D"].includes(normalizedAnswer)) {
        return errorResponse("invalid_answer", "Réponse invalide");
      }

      // Validate question index
      if (typeof questionIndex !== "number" || questionIndex < 0 || questionIndex > 9) {
        return errorResponse("invalid_question", "Question invalide");
      }

      // Get session
      const { data: session, error: sessionError } = await supabase
        .from("quiz_sessions")
        .select("*")
        .eq("id", sessionId)
        .eq("device_fingerprint", deviceFingerprint)
        .single();

      if (sessionError || !session) {
        return errorResponse("invalid_session", "Session invalide");
      }

      // Check if session expired
      if (new Date(session.expires_at) < new Date()) {
        return errorResponse("session_expired", "Session expirée, veuillez recommencer");
      }

      // SAFE: enforce sequential answering
      if (typeof session.current_question === "number" && questionIndex !== session.current_question) {
        return errorResponse("out_of_order", "Réponse hors séquence");
      }

      const existingAnswers = Array.isArray(session.answers) ? session.answers : [];
      const alreadyAnswered = existingAnswers.some((a: any) => a?.questionIndex === questionIndex);
      if (alreadyAnswered) {
        return errorResponse("already_answered", "Réponse déjà enregistrée");
      }

      const questionId = session.question_ids?.[questionIndex];
      if (!questionId) {
        return errorResponse("invalid_question", "Question invalide");
      }

      // Get correct answer
      const { data: question, error: qErr } = await supabase
        .from("quiz_questions")
        .select("correct_answer")
        .eq("id", questionId)
        .single();

      if (qErr || !question?.correct_answer) {
        console.error("Question lookup error");
        return serverErrorResponse();
      }

      const isCorrect = question.correct_answer === normalizedAnswer;

      // Update session (append answer)
      const newAnswers = [...existingAnswers, { questionIndex, answer: normalizedAnswer, isCorrect }];

      const { error: updateError } = await supabase
        .from("quiz_sessions")
        .update({
          answers: newAnswers,
          current_question: questionIndex + 1,
          last_activity: nowIso(),
          expires_at: addMinutesIso(ANSWER_EXTEND_MINUTES),
        })
        .eq("id", sessionId);

      if (updateError) {
        console.error("Session update error");
        return serverErrorResponse();
      }

      return successResponse({ isCorrect, correctAnswer: question.correct_answer });
    }

    if (action === "reset") {
      await supabase
        .from("quiz_sessions")
        .update({ completed: true })
        .eq("device_fingerprint", deviceFingerprint)
        .eq("completed", false);

      return successResponse({ success: true });
    }

    return errorResponse("invalid_action", "Action non reconnue");
  } catch (error: unknown) {
    console.error("Quiz session error:", error instanceof Error ? error.message : "Unknown");
    return serverErrorResponse();
  }
});
