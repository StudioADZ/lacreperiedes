import { useState, useCallback, useEffect } from "react";
import { useDeviceFingerprint } from "../../../hooks/useDeviceFingerprint";
import { quizStart, quizAnswer, quizReset } from "../services/quizSession";
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

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && state.session && !state.session.answers?.length) {
        // volontairement désactivé (comportement actuel)
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [state.session]);

  const startSession = useCallback(async () => {
    if (!deviceFingerprint) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    const res = await quizStart(deviceFingerprint);

    if (!res.ok) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: res.error || 'Erreur lors du démarrage',
      }));
      return { success: false, error: 'connection_error' };
    }

    const data: any = res.data;

    setState(prev => ({
      ...prev,
      isLoading: false,
      session: data.session,
      questions: data.questions,
      currentQuestionIndex: data.session.current_question || 0,
      answers: data.session.answers?.map((a: any) => ({
        answer: a.answer,
        isCorrect: a.isCorrect,
        correctAnswer: '',
      })) || [],
    }));

    return { success: true };
  }, [deviceFingerprint]);

  const submitAnswer = useCallback(async (answer: string) => {
    if (!state.session || !deviceFingerprint) return;

    setState(prev => ({ ...prev, isLoading: true }));

    const res = await quizAnswer({
      deviceFingerprint,
      sessionId: state.session.id,
      answer,
      questionIndex: state.currentQuestionIndex,
    });

    if (!res.ok) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: res.error || 'Erreur lors de la soumission',
      }));
      return { success: false, error: 'connection_error' };
    }

    const data: any = res.data;

    setState(prev => ({
      ...prev,
      isLoading: false,
      currentQuestionIndex: prev.currentQuestionIndex + 1,
      answers: [...prev.answers, {
        answer,
        isCorrect: data.isCorrect,
        correctAnswer: data.correctAnswer,
      }],
    }));

    return { success: true, isCorrect: data.isCorrect, correctAnswer: data.correctAnswer };
  }, [state.session, state.currentQuestionIndex, deviceFingerprint]);

  const resetSession = useCallback(async () => {
    if (!deviceFingerprint) return;

    try {
      await quizReset(deviceFingerprint);
    } catch (error) {
      console.error('Reset error:', error);
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

  const isComplete = state.currentQuestionIndex >= 10;
  const score = state.answers.filter(a => a.isCorrect).length;

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
