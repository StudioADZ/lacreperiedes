import { edgePost } from "./edgeClient";

export interface QuizQuestion {
  id: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
}

export interface QuizSession {
  id: string;
  question_ids: string[];
  current_question: number;
  answers: Array<{ questionIndex: number; answer: string; isCorrect: boolean }>;
  expires_at: string;
}

export type QuizStartResponse = {
  session: QuizSession;
  questions: QuizQuestion[];
  message?: string;
  error?: string;
};

export type QuizAnswerResponse = {
  isCorrect: boolean;
  correctAnswer: string;
  message?: string;
  error?: string;
};

export function quizStart(deviceFingerprint: string) {
  return edgePost<QuizStartResponse>("quiz-session", {
    action: "start",
    deviceFingerprint,
  });
}

export function quizAnswer(params: {
  deviceFingerprint: string;
  sessionId: string;
  answer: string;
  questionIndex: number;
}) {
  return edgePost<QuizAnswerResponse>("quiz-session", {
    action: "answer",
    deviceFingerprint: params.deviceFingerprint,
    sessionId: params.sessionId,
    answer: params.answer,
    questionIndex: params.questionIndex,
  });
}

export function quizReset(deviceFingerprint: string) {
  return edgePost<unknown>("quiz-session", {
    action: "reset",
    deviceFingerprint,
  });
}
