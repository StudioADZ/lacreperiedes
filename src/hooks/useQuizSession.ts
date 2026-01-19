import { useState, useCallback, useEffect } from 'react';
import { useDeviceFingerprint } from './useDeviceFingerprint';

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
    const handleVisibilityChange = () => {
      if (document.hidden && state.session && !state.session.answers?.length) {
        // Only reset if quiz just started (prevent accidental resets)
        // resetSession();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [state.session]);

  const startSession = useCallback(async () => {
    if (!deviceFingerprint) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/quiz-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start',
          deviceFingerprint,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: data.message || 'Erreur lors du démarrage',
        }));
        return { success: false, error: data.error };
      }

      setState(prev => ({
        ...prev,
        isLoading: false,
        session: data.session,
        questions: data.questions,
        currentQuestionIndex: data.session.current_question || 0,
        answers: data.session.answers?.map((a: any) => ({
          answer: a.answer,
          isCorrect: a.isCorrect,
          correctAnswer: '', // We don't have this from the session
        })) || [],
      }));

      return { success: true };
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Erreur de connexion',
      }));
      return { success: false, error: 'connection_error' };
    }
  }, [deviceFingerprint]);

  const submitAnswer = useCallback(async (answer: string) => {
    if (!state.session || !deviceFingerprint) return;

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/quiz-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'answer',
          deviceFingerprint,
          sessionId: state.session.id,
          answer,
          questionIndex: state.currentQuestionIndex,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: data.message || 'Erreur lors de la soumission',
        }));
        return { success: false, error: data.error };
      }

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
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Erreur de connexion',
      }));
      return { success: false, error: 'connection_error' };
    }
  }, [state.session, state.currentQuestionIndex, deviceFingerprint]);

  const resetSession = useCallback(async () => {
    if (!deviceFingerprint) return;

    try {
      await fetch(`${SUPABASE_URL}/functions/v1/quiz-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reset',
          deviceFingerprint,
        }),
      });
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