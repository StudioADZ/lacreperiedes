import { useState, useCallback } from "react";
import { useDeviceFingerprint } from "./useDeviceFingerprint";
import { supabase } from "@/integrations/supabase/client";

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
  answers: Array<{ answer: string; isCorrect: boolean; correctAnswer: string }>;
}

const getErrorMessage = (data: unknown, fallback: string) => {
  if (data && typeof data === "object" && "message" in data && typeof data.message === "string") {
    return data.message;
  }
  return fallback;
};

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

  const callQuizSession = useCallback(async (payload: Record<string, unknown>) => {
    if (!SUPABASE_URL) throw new Error("Configuration du quiz indisponible");

    const { data: authData, error: authError } = await supabase.auth.getSession();
    const accessToken = authData.session?.access_token;
    if (authError || !accessToken) throw new Error("Reconnectez-vous pour jouer au quiz");

    const response = await fetch(`${SUPABASE_URL}/functions/v1/quiz-session`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    });

    let data: any = null;
    try {
      data = await response.json();
    } catch {
      // The generic error below is clearer than a JSON parsing exception.
    }

    if (!response.ok) {
      throw new Error(getErrorMessage(data, "Le quiz est momentanément indisponible"));
    }

    return data;
  }, []);

  const startSession = useCallback(async () => {
    if (!deviceFingerprint) return { success: false, error: "missing_fingerprint" };

    setState((previous) => ({ ...previous, isLoading: true, error: null }));

    try {
      const data = await callQuizSession({ action: "start", deviceFingerprint });
      setState((previous) => ({
        ...previous,
        isLoading: false,
        session: data.session,
        questions: data.questions,
        currentQuestionIndex: data.session.current_question || 0,
        answers:
          data.session.answers?.map((answer: any) => ({
            answer: answer.answer,
            isCorrect: answer.isCorrect,
            correctAnswer: "",
          })) || [],
      }));
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur de connexion";
      setState((previous) => ({ ...previous, isLoading: false, error: message }));
      return { success: false, error: message };
    }
  }, [callQuizSession, deviceFingerprint]);

  const submitAnswer = useCallback(async (answer: string) => {
    if (!state.session || !deviceFingerprint) return { success: false, error: "invalid_session" };

    setState((previous) => ({ ...previous, isLoading: true, error: null }));

    try {
      const data = await callQuizSession({
        action: "answer",
        deviceFingerprint,
        sessionId: state.session.id,
        answer,
        questionIndex: state.currentQuestionIndex,
      });

      setState((previous) => ({
        ...previous,
        isLoading: false,
        currentQuestionIndex: previous.currentQuestionIndex + 1,
        answers: [...previous.answers, { answer, isCorrect: data.isCorrect, correctAnswer: data.correctAnswer }],
      }));

      return { success: true, isCorrect: data.isCorrect, correctAnswer: data.correctAnswer };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur de connexion";
      setState((previous) => ({ ...previous, isLoading: false, error: message }));
      return { success: false, error: message };
    }
  }, [callQuizSession, deviceFingerprint, state.currentQuestionIndex, state.session]);

  const resetSession = useCallback(async () => {
    if (deviceFingerprint) {
      try {
        await callQuizSession({ action: "reset", deviceFingerprint });
      } catch (error) {
        console.warn("[useQuizSession] reset failed", error);
      }
    }

    setState({
      isLoading: false,
      error: null,
      session: null,
      questions: [],
      currentQuestionIndex: 0,
      answers: [],
    });
  }, [callQuizSession, deviceFingerprint]);

  const isComplete = state.currentQuestionIndex >= 10;
  const score = state.answers.filter((answer) => answer.isCorrect).length;

  return {
    ...state,
    deviceFingerprint,
    startSession,
    submitAnswer,
    resetSession,
    isComplete,
    score,
    currentQuestion: state.questions[state.currentQuestionIndex] || null,
  };
};
