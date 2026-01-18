import { useState, useCallback, useEffect } from "react";
import { useDeviceFingerprint } from "./useDeviceFingerprint";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

interface Question {
  id: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
}

interface Session {
  id: string;
  question_ids: string[];
  current_question: number;
  answers: Array<{ questionIndex: number; answer: string; isCorrect: boolean }>;
  expires_at: string;
}

interface QuizState {
  isLoading: boolean;
  error: string | null;
  session: Session | null;
  questions: Question[];
  currentQuestionIndex: number;
  answers: Array<{ answer: string; isCorrect: boolean; correctAnswer: string | null }>;
}

type ApiResult =
  | { success: true; isCorrect?: boolean; correctAnswer?: string }
  | { success: false; error: string; message?: string };

async function safeJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export const useQuizSession = () => {
  const deviceFingerprint = useDeviceFingerprint();
  const [state, setState] = useState<QuizState>({
    isLoading: false,
    error: null,
    session: null,
    questions: [],
    currentQuestionIndex: 0,
    answers: [],
  });

  // Handle visibility change (tab switch detection)
  useEffect(() => {
    const sessionId = state.session?.id;
    const hasAnswers = (state.session?.answers?.length ?? 0) > 0;

    const handleVisibilityChange = () => {
      if (document.hidden && sessionId && !hasAnswers) {
        // Intentionally disabled to avoid accidental resets.
        // If you want to re-enable, do it behind a feature flag.
        // resetSession();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [state.session?.id, state.session?.answers?.length]);

  const startSession = useCallback(async (): Promise<ApiResult> => {
    if (!SUPABASE_URL) {
      setState((prev) => ({ ...prev, error: "Config Supabase manquante (VITE_SUPABASE_URL)", isLoading: false }));
      return { success: false, error: "missing_supabase_url" };
    }
    if (!deviceFingerprint) return { success: false, error: "missing_fingerprint" };

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/quiz-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "start",
          deviceFingerprint,
        }),
      });

      const data = await safeJson(response);

      if (!response.ok) {
        const message = data?.message || "Erreur lors du démarrage";
        setState((prev) => ({ ...prev, isLoading: false, error: message }));
        return { success: false, error: data?.error || "start_failed", message };
      }

      const session: Session | null = data?.session ?? null;
      const questions: Question[] = data?.questions ?? [];

      setState((prev) => ({
        ...prev,
        isLoading: false,
        session,
        questions,
        currentQuestionIndex: session?.current_question ?? 0,
        answers:
          session?.answers?.map((a: any) => ({
            answer: a.answer,
            isCorrect: !!a.isCorrect,
            correctAnswer: null, // not available from session payload
          })) ?? [],
      }));

      return { success: true };
    } catch {
      setState((prev) => ({ ...prev, isLoading: false, error: "Erreur de connexion" }));
      return { success: false, error: "connection_error" };
    }
  }, [deviceFingerprint]);

  const submitAnswer = useCallback(
    async (answer: string): Promise<ApiResult> => {
      if (!SUPABASE_URL) {
        setState((prev) => ({ ...prev, error: "Config Supabase manquante (VITE_SUPABASE_URL)" }));
        return { success: false, error: "missing_supabase_url" };
      }
      if (!deviceFingerprint) return { success: false, error: "missing_fingerprint" };

      // Prevent double-submit
      if (state.isLoading) return { success: false, error: "busy" };
      if (!state.session) return { success: false, error: "no_session" };

      // Prevent answering past the end
      const total = state.questions.length || state.session.question_ids?.length || 0;
      if (total > 0 && state.currentQuestionIndex >= total) {
        return { success: false, error: "quiz_complete" };
      }

      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/quiz-session`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "answer",
            deviceFingerprint,
            sessionId: state.session.id,
            answer,
            questionIndex: state.currentQuestionIndex,
          }),
        });

        const data = await safeJson(response);

        if (!response.ok) {
          const message = data?.message || "Erreur lors de la soumission";
          setState((prev) => ({ ...prev, isLoading: false, error: message }));
          return { success: false, error: data?.error || "answer_failed", message };
        }

        setState((prev) => ({
          ...prev,
          isLoading: false,
          currentQuestionIndex: prev.currentQuestionIndex + 1,
          answers: [
            ...prev.answers,
            {
              answer,
              isCorrect: !!data?.isCorrect,
              correctAnswer: typeof data?.correctAnswer === "string" ? data.correctAnswer : null,
            },
          ],
        }));

        return {
          success: true,
          isCorrect: !!data?.isCorrect,
          correctAnswer: data?.correctAnswer,
        };
      } catch {
        setState((prev) => ({ ...prev, isLoading: false, error: "Erreur de connexion" }));
        return { success: false, error: "connection_error" };
      }
    },
    [state.session, state.currentQuestionIndex, state.questions.length, state.isLoading, deviceFingerprint],
  );

  const resetSession = useCallback(async () => {
    if (!SUPABASE_URL || !deviceFingerprint) {
      setState({
        isLoading: false,
        error: null,
        session: null,
        questions: [],
        currentQuestionIndex: 0,
        answers: [],
      });
      return;
    }

    try {
      await fetch(`${SUPABASE_URL}/functions/v1/quiz-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reset",
          deviceFingerprint,
        }),
      });
    } catch (error) {
      console.error("Reset error:", error);
    }

    setState({
      isLoading: false,
      error: null,
      session: null,
      questions: [],
      currentQuestionIndex: 0,
      answers: [],
    });
  }, [deviceFingerprint]);

  const totalQuestions = state.questions.length || state.session?.question_ids?.length || 10; // fallback
  const isComplete = state.currentQuestionIndex >= totalQuestions;
  const score = state.answers.filter((a) => a.isCorrect).length;

  return {
    ...state,
    deviceFingerprint,
    startSession,
    submitAnswer,
    resetSession,
    isComplete,
    score,
    currentQuestion: state.questions[state.currentQuestionIndex] || null,
    totalQuestions,
  };
};
