import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AlertCircle, ArrowRight, Clock, Gift, Loader2, ShieldCheck, Trophy, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import AuthModal from "@/components/auth/AuthModal";
import WeeklyCountdown from "@/components/quiz/WeeklyCountdown";
import RealtimeWins from "@/components/quiz/RealtimeWins";
import QuizTimer from "@/components/quiz/QuizTimer";
import QuizQuestion from "@/components/quiz/QuizQuestion";
import QuizPreForm from "@/components/quiz/QuizPreForm";
import QuizWinnerPremium from "@/components/quiz/QuizWinnerPremium";
import QuizLoser from "@/components/quiz/QuizLoser";
import { useAuth } from "@/hooks/useAuth";
import { useQuizSession } from "@/hooks/useQuizSession";
import { useUserMemory } from "@/hooks/useUserMemory";
import { useWeeklyStock } from "@/hooks/useWeeklyStock";
import { supabase } from "@/integrations/supabase/client";
import { getWeeklyCode, hasWonThisWeek, markWonThisWeek } from "@/features/quiz/services/localCodes";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const QUESTION_TIME_LIMIT = 30;
const TOTAL_QUESTIONS = 10;
const RESULT_DISPLAY_DELAY_MS = 1200;

type QuizPhase = "intro" | "playing" | "form" | "processing" | "winner" | "loser";
type QuizSubmitPayload = {
  error?: string;
  message?: string;
  stock?: { formule_complete_remaining: number; galette_remaining: number; crepe_remaining: number };
  prizeWon?: string | null;
  prizeCode?: string | null;
  firstName?: string;
};

const PRIZE_TIERS = [
  { icon: "🏆", title: "Formule complète", rule: "10/10", stockKey: "formule_complete_remaining" as const },
  { icon: "🥈", title: "Une galette", rule: "9/10", stockKey: "galette_remaining" as const },
  { icon: "🥉", title: "Une crêpe", rule: "8/10", stockKey: "crepe_remaining" as const },
];

const Quiz = () => {
  const prefersReducedMotion = useReducedMotion();
  const { user, session: authSession, isAuthenticated, isLoading: authLoading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("signup");
  const [phase, setPhase] = useState<QuizPhase>("intro");
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [lastResult, setLastResult] = useState<{ isCorrect: boolean; correctAnswer: string } | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [currentFirstName, setCurrentFirstName] = useState("");
  const [timerKey, setTimerKey] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [alreadyWon, setAlreadyWon] = useState(hasWonThisWeek());
  const [weeklyCode, setWeeklyCode] = useState<string | null>(getWeeklyCode());
  const [winnerData, setWinnerData] = useState<{
    firstName: string; email: string; phone: string; prize: string; prizeCode: string;
  } | null>(null);
  const [stockData, setStockData] = useState({
    formule_complete_remaining: 0,
    galette_remaining: 0,
    crepe_remaining: 0,
  });
  const resultTimeoutRef = useRef<number | null>(null);

  const { data: stock, isLoading: stockLoading } = useWeeklyStock();
  const { userData, saveUserData } = useUserMemory();
  const {
    isLoading,
    error,
    session,
    currentQuestion,
    currentQuestionIndex,
    score,
    deviceFingerprint,
    startSession,
    submitAnswer,
    resetSession,
  } = useQuizSession();

  const verifiedAccount = Boolean(isAuthenticated && user?.email && user.email_confirmed_at);

  const clearResultTimeout = useCallback(() => {
    if (resultTimeoutRef.current !== null) {
      window.clearTimeout(resultTimeoutRef.current);
      resultTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => clearResultTimeout, [clearResultTimeout]);
  useEffect(() => {
    if (phase === "intro") {
      setAlreadyWon(hasWonThisWeek());
      setWeeklyCode(getWeeklyCode());
    }
  }, [phase]);

  const openAuth = (mode: "login" | "signup") => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  const handleStart = async () => {
    if (!verifiedAccount) {
      openAuth(isAuthenticated ? "login" : "signup");
      return;
    }
    setSubmitError(null);
    clearResultTimeout();
    const result = await startSession();
    if (result?.success) {
      setPhase("playing");
      setSelectedAnswer(null);
      setShowResult(false);
      setLastResult(null);
      setTimerKey((value) => value + 1);
      setTimerActive(true);
    }
  };

  const handleAnswer = useCallback(async (answer: string) => {
    if (showResult || isLoading) return;
    clearResultTimeout();
    setTimerActive(false);
    setSelectedAnswer(answer === "TIMEOUT" ? null : answer);
    const result = await submitAnswer(answer);
    if (!result?.success) return;

    setLastResult({ isCorrect: result.isCorrect, correctAnswer: result.correctAnswer });
    setShowResult(true);
    resultTimeoutRef.current = window.setTimeout(() => {
      setSelectedAnswer(null);
      setShowResult(false);
      setLastResult(null);
      if (currentQuestionIndex + 1 >= TOTAL_QUESTIONS) setPhase("form");
      else {
        setTimerKey((value) => value + 1);
        setTimerActive(true);
      }
    }, RESULT_DISPLAY_DELAY_MS);
  }, [clearResultTimeout, currentQuestionIndex, isLoading, showResult, submitAnswer]);

  const handleFormSubmit = async (data: { firstName: string; email: string; phone: string; rgpdConsent: boolean }) => {
    if (!session || !deviceFingerprint || !SUPABASE_URL || !authSession?.access_token || !verifiedAccount) {
      setSubmitError("Reconnectez-vous avec votre email vérifié pour afficher le résultat.");
      setPhase("form");
      return;
    }

    setSubmitLoading(true);
    setSubmitError(null);
    setCurrentFirstName(data.firstName);
    setPhase("processing");

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/quiz-submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authSession.access_token}`,
        },
        body: JSON.stringify({
          sessionId: session.id,
          deviceFingerprint,
          firstName: data.firstName,
          phone: data.phone,
          rgpdConsent: data.rgpdConsent,
        }),
      });
      const result = (await response.json()) as QuizSubmitPayload;
      if (!response.ok) {
        setSubmitError(result.message || "Impossible de valider le résultat.");
        setPhase("form");
        return;
      }

      saveUserData({ firstName: data.firstName, email: user?.email || data.email, phone: data.phone });
      if (result.stock) setStockData(result.stock);

      if (result.prizeWon && result.prizeCode) {
        markWonThisWeek(result.prizeCode);
        setAlreadyWon(true);
        setWeeklyCode(result.prizeCode);
        setWinnerData({
          firstName: result.firstName || data.firstName,
          email: user?.email || data.email,
          phone: data.phone,
          prize: result.prizeWon,
          prizeCode: result.prizeCode,
        });
        setPhase("winner");
      } else {
        setCurrentFirstName(result.firstName || data.firstName);
        setPhase("loser");
      }
    } catch {
      setSubmitError("Erreur de connexion. Vérifiez votre réseau puis réessayez.");
      setPhase("form");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handlePlayAgain = () => {
    clearResultTimeout();
    void resetSession();
    setPhase("intro");
    setWinnerData(null);
    setSubmitError(null);
    setTimerActive(false);
    setSelectedAnswer(null);
    setShowResult(false);
    setLastResult(null);
  };

  if (phase === "playing" && currentQuestion) {
    return (
      <main className="min-h-dvh overflow-y-auto px-4 pb-32 pt-20">
        <div className="mx-auto max-w-lg">
          <div className="sticky top-16 z-10 mb-4 rounded-2xl bg-background/90 pb-2 backdrop-blur">
            <QuizTimer duration={QUESTION_TIME_LIMIT} onTimeUp={() => void handleAnswer("TIMEOUT")} isActive={timerActive} resetKey={timerKey} />
          </div>
          <div className="mb-4 flex items-center justify-between rounded-xl border border-herb/30 bg-herb/10 p-3">
            <span className="font-medium">Score actuel</span>
            <strong className="text-xl text-herb">{score}/{TOTAL_QUESTIONS}</strong>
          </div>
          <AnimatePresence mode="wait">
            <QuizQuestion
              key={currentQuestionIndex}
              question={currentQuestion}
              questionNumber={currentQuestionIndex + 1}
              totalQuestions={TOTAL_QUESTIONS}
              onAnswer={handleAnswer}
              isLoading={isLoading}
              selectedAnswer={selectedAnswer || undefined}
              showResult={showResult}
              isCorrect={lastResult?.isCorrect}
              correctAnswer={lastResult?.correctAnswer}
            />
          </AnimatePresence>
        </div>
      </main>
    );
  }

  if (phase === "form") {
    return (
      <main className="min-h-screen px-4 pb-24 pt-20">
        <div className="mx-auto max-w-lg">
          <div className="mb-5 rounded-2xl border border-herb/25 bg-herb/10 p-4 text-sm">
            <p className="font-bold text-espresso">Résultat sécurisé</p>
            <p className="mt-1 text-muted-foreground">Vos coordonnées sont enregistrées avant l’affichage du résultat. Un éventuel code gagnant sera conservé dans votre compte.</p>
          </div>
          <QuizPreForm
            onSubmit={handleFormSubmit}
            isLoading={submitLoading}
            error={submitError || undefined}
            savedData={{ ...userData, email: user?.email || userData?.email || "" }}
            score={score}
          />
        </div>
      </main>
    );
  }

  if (phase === "processing") {
    return <main className="flex min-h-screen items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></main>;
  }

  if (phase === "winner" && winnerData) {
    return (
      <main className="min-h-screen px-4 pb-24 pt-20"><div className="mx-auto max-w-lg">
        <QuizWinnerPremium {...winnerData} secretCode={null} onPlayAgain={handlePlayAgain} />
      </div></main>
    );
  }

  if (phase === "loser") {
    return (
      <main className="min-h-screen px-4 pb-24 pt-20"><div className="mx-auto max-w-lg">
        <QuizLoser firstName={currentFirstName} email={user?.email || ""} phone={userData?.phone || ""} score={score} secretCode={null} stockRemaining={stockData} onPlayAgain={handlePlayAgain} />
      </div></main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-butter/35 via-background to-background px-4 pb-24 pt-20">
      <div className="mx-auto max-w-lg">
        <motion.header initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-7 text-center">
          <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-bold text-primary">
            <Trophy className="h-4 w-4" /> Quiz premium
          </span>
          <h1 className="font-display text-3xl font-black text-espresso">Le grand quiz des Saveurs</h1>
          <p className="mt-3 text-muted-foreground">10 questions tirées au hasard parmi plus de 600 questions sur Mamers, la Bretagne et la gourmandise.</p>
          <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-muted-foreground">
            <div className="rounded-xl border bg-white/70 p-2"><Clock className="mx-auto mb-1 h-4 w-4 text-caramel" />30 sec</div>
            <div className="rounded-xl border bg-white/70 p-2"><Gift className="mx-auto mb-1 h-4 w-4 text-caramel" />Lots réels</div>
            <div className="rounded-xl border bg-white/70 p-2"><ShieldCheck className="mx-auto mb-1 h-4 w-4 text-caramel" />Code conservé</div>
          </div>
        </motion.header>

        <WeeklyCountdown />

        <section className="card-warm my-6">
          <h2 className="mb-4 font-display text-xl font-bold">Lots de la semaine</h2>
          {stockLoading ? <Loader2 className="mx-auto h-6 w-6 animate-spin" /> : (
            <div className="space-y-3">
              {PRIZE_TIERS.map((tier) => (
                <div key={tier.title} className="flex items-center justify-between rounded-xl border bg-white/60 p-3">
                  <div><span className="mr-2 text-xl">{tier.icon}</span><strong>{tier.title}</strong><p className="text-xs text-muted-foreground">Score requis : {tier.rule}</p></div>
                  <strong className="text-herb">{stock?.[tier.stockKey] ?? 0}</strong>
                </div>
              ))}
            </div>
          )}
        </section>

        {!authLoading && !verifiedAccount ? (
          <section className="rounded-3xl border border-caramel/25 bg-white/80 p-5 shadow-warm">
            <div className="mb-4 flex items-start gap-3">
              <div className="rounded-2xl bg-caramel/15 p-3"><UserCheck className="h-6 w-6 text-caramel" /></div>
              <div><h2 className="font-display text-xl font-bold">Un compte vérifié pour jouer</h2><p className="mt-1 text-sm text-muted-foreground">Votre email est vérifié avant le quiz. Ainsi, votre résultat et votre code gagnant restent disponibles dans votre espace client.</p></div>
            </div>
            <div className="grid gap-3">
              <Button className="h-12 rounded-2xl" onClick={() => openAuth("signup")}>Créer mon compte</Button>
              <Button variant="outline" className="h-12 rounded-2xl" onClick={() => openAuth("login")}>J’ai déjà un compte</Button>
            </div>
            <p className="mt-3 text-center text-xs text-muted-foreground">Après inscription, cliquez sur le lien reçu par email puis revenez sur cette page.</p>
          </section>
        ) : (
          <Button className="btn-hero mt-6 w-full py-6 text-lg" onClick={handleStart} disabled={isLoading || !deviceFingerprint}>
            {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <ArrowRight className="mr-2 h-5 w-5" />}
            {alreadyWon ? "Rejouer pour le plaisir" : "Commencer le quiz"}
          </Button>
        )}

        {alreadyWon && weeklyCode && <div className="mt-4 rounded-2xl border bg-white/70 p-4 text-center"><p className="text-sm">Votre code de la semaine</p><strong className="font-mono text-2xl">{weeklyCode}</strong></div>}
        {(error || submitError) && <div className="mt-4 flex gap-2 rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-destructive"><AlertCircle className="h-5 w-5" /><p className="text-sm">{error || submitError}</p></div>}
        <div className="card-warm mt-6"><RealtimeWins /></div>
      </div>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} defaultMode={authMode} />
    </main>
  );
};

export default Quiz;
