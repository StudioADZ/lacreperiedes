import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Trophy, ArrowRight, AlertCircle, Clock, Gift, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getWeeklyCode, hasWonThisWeek, markWonThisWeek } from "@/features/quiz/services/localCodes";
import { useWeeklyStock } from "@/hooks/useWeeklyStock";
import { useUserMemory } from "@/hooks/useUserMemory";
import { useRGPDConsent } from "@/hooks/useRGPDConsent";
import { useQuizSession } from "@/hooks/useQuizSession";
import { supabase } from "@/integrations/supabase/client";
import RGPDConsentBanner from "@/components/RGPDConsentBanner";
import WeeklyCountdown from "@/components/quiz/WeeklyCountdown";
import RealtimeWins from "@/components/quiz/RealtimeWins";
import QuizTimer from "@/components/quiz/QuizTimer";
import QuizQuestion from "@/components/quiz/QuizQuestion";
import QuizPreForm from "@/components/quiz/QuizPreForm";
import QuizWinnerPremium from "@/components/quiz/QuizWinnerPremium";
import QuizLoser from "@/components/quiz/QuizLoser";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const QUESTION_TIME_LIMIT = 30;
const TOTAL_QUESTIONS = 10;
const RESULT_DISPLAY_DELAY_MS = 1500;

type QuizPhase = "intro" | "playing" | "form" | "processing" | "winner" | "loser";

type QuizSubmitPayload = {
  error?: string;
  message?: string;
  stock?: {
    formule_complete_remaining: number;
    galette_remaining: number;
    crepe_remaining: number;
  };
  secretCode?: string | null;
  prizeWon?: string | null;
  prizeCode?: string | null;
  firstName?: string;
  attachedToProfile?: boolean;
};

const PRIZE_TIERS = [
  {
    icon: "🏆",
    title: "10 Formules complètes",
    rule: "100% de bonnes réponses",
    stockKey: "formule_complete_remaining" as const,
    cardClass: "bg-gradient-to-r from-caramel/20 to-caramel/10 border-caramel/30",
  },
  {
    icon: "🥈",
    title: "20 Galettes",
    rule: "90-99% de bonnes réponses",
    stockKey: "galette_remaining" as const,
    cardClass: "bg-secondary/50 border-border/50",
  },
  {
    icon: "🥉",
    title: "30 Crêpes",
    rule: "80-89% de bonnes réponses",
    stockKey: "crepe_remaining" as const,
    cardClass: "bg-secondary/30 border-border/50",
  },
];

function getSubmitErrorMessage(result: QuizSubmitPayload) {
  if (result.error === "phone_already_won" || result.error === "email_already_won" || result.error === "already_won_this_week") {
    return "Tu as déjà gagné cette semaine 😊 Reviens la semaine prochaine !";
  }

  return result.message || "Erreur lors de la soumission";
}

async function readSubmitPayload(response: Response): Promise<QuizSubmitPayload> {
  try {
    return (await response.json()) as QuizSubmitPayload;
  } catch {
    return {};
  }
}

const Quiz = () => {
  const [alreadyWon, setAlreadyWon] = useState<boolean>(hasWonThisWeek());
  const [weeklyCode, setWeeklyCode] = useState<string | null>(getWeeklyCode());

  const [phase, setPhase] = useState<QuizPhase>("intro");
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [lastResult, setLastResult] = useState<{ isCorrect: boolean; correctAnswer: string } | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [winnerData, setWinnerData] = useState<{
    firstName: string;
    email: string;
    phone: string;
    prize: string;
    prizeCode: string;
    secretCode?: string | null;
  } | null>(null);
  const [resultSecretCode, setResultSecretCode] = useState<string | null>(null);
  const [stockData, setStockData] = useState<{
    formule_complete_remaining: number;
    galette_remaining: number;
    crepe_remaining: number;
  } | null>(null);
  const [currentFirstName, setCurrentFirstName] = useState<string>("");
  const [timerKey, setTimerKey] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const resultTimeoutRef = useRef<number | null>(null);

  const { data: stock, isLoading: stockLoading } = useWeeklyStock();
  const { userData, saveUserData } = useUserMemory();
  const { hasConsented, isLoading: consentLoading, acceptConsent } = useRGPDConsent();
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

  const clearResultTimeout = useCallback(() => {
    if (resultTimeoutRef.current !== null) {
      window.clearTimeout(resultTimeoutRef.current);
      resultTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (phase === "intro") {
      setAlreadyWon(hasWonThisWeek());
      setWeeklyCode(getWeeklyCode());
    }
  }, [phase]);

  useEffect(() => clearResultTimeout, [clearResultTimeout]);

  const handleStart = async () => {
    setSubmitError(null);
    clearResultTimeout();
    const result = await startSession();
    if (result?.success) {
      setPhase("playing");
      setSelectedAnswer(null);
      setShowResult(false);
      setLastResult(null);
      setTimerKey((prev) => prev + 1);
      setTimerActive(true);
    }
  };

  const handleAnswer = useCallback(async (answer: string) => {
    if (showResult || isLoading) return;

    clearResultTimeout();
    setTimerActive(false);
    setSelectedAnswer(answer === "TIMEOUT" ? null : answer);

    const result = await submitAnswer(answer);

    if (result?.success) {
      setLastResult({ isCorrect: result.isCorrect, correctAnswer: result.correctAnswer });
      setShowResult(true);

      resultTimeoutRef.current = window.setTimeout(() => {
        setSelectedAnswer(null);
        setShowResult(false);
        setLastResult(null);

        if (currentQuestionIndex + 1 >= TOTAL_QUESTIONS) {
          setPhase("form");
        } else {
          setTimerKey((prev) => prev + 1);
          setTimerActive(true);
        }
      }, RESULT_DISPLAY_DELAY_MS);
    }
  }, [clearResultTimeout, currentQuestionIndex, isLoading, showResult, submitAnswer]);

  const handleTimeUp = useCallback(() => {
    if (showResult || isLoading) return;
    void handleAnswer("TIMEOUT");
  }, [handleAnswer, showResult, isLoading]);

  const handleFormSubmit = async (data: { firstName: string; email: string; phone: string; rgpdConsent: boolean }) => {
    if (!session || !deviceFingerprint) return;

    if (!SUPABASE_URL) {
      setSubmitError("Configuration du quiz indisponible. Merci de réessayer plus tard.");
      return;
    }

    if (alreadyWon) {
      setCurrentFirstName(data.firstName);
      setPhase("loser");
      return;
    }

    setSubmitLoading(true);
    setSubmitError(null);
    setCurrentFirstName(data.firstName);
    setPhase("processing");

    try {
      const { data: authData } = await supabase.auth.getSession();
      const requestHeaders = new Headers({ "Content-Type": "application/json" });
      const accessToken = authData.session?.access_token;
      if (accessToken) requestHeaders.set("Authorization", ["Bearer", accessToken].join(" "));

      const response = await fetch(`${SUPABASE_URL}/functions/v1/quiz-submit`, {
        method: "POST",
        headers: requestHeaders,
        body: JSON.stringify({
          sessionId: session.id,
          deviceFingerprint,
          ...data,
        }),
      });

      const result = await readSubmitPayload(response);

      if (!response.ok) {
        setSubmitError(getSubmitErrorMessage(result));
        setPhase("form");
        return;
      }

      saveUserData({
        firstName: data.firstName,
        email: data.email,
        phone: data.phone,
      });

      if (result.stock) {
        setStockData({
          formule_complete_remaining: result.stock.formule_complete_remaining,
          galette_remaining: result.stock.galette_remaining,
          crepe_remaining: result.stock.crepe_remaining,
        });
      }

      setResultSecretCode(result.secretCode ?? null);

      if (result.prizeWon && result.prizeCode) {
        markWonThisWeek(result.prizeCode);
        setAlreadyWon(true);
        setWeeklyCode(result.prizeCode);

        setWinnerData({
          firstName: result.firstName || data.firstName,
          email: data.email,
          phone: data.phone,
          prize: result.prizeWon,
          prizeCode: result.prizeCode,
          secretCode: result.secretCode,
        });
        setPhase("winner");
      } else {
        setCurrentFirstName(result.firstName || data.firstName);
        setPhase("loser");
      }
    } catch (err) {
      console.error("[Quiz] submit failed", err);
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
    setStockData(null);
    setResultSecretCode(null);
    setSelectedAnswer(null);
    setShowResult(false);
    setLastResult(null);
  };

  const HeaderBlock = ({ consent = false }: { consent?: boolean }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8 text-center"
    >
      <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
        <Trophy className="h-4 w-4" />
        Quiz Hebdomadaire
      </span>
      <h1 className="mb-3 font-display text-3xl font-bold">
        Quiz gourmand de la semaine
      </h1>
      <p className="text-muted-foreground">
        10 questions, 30 secondes chacune, et un code gagnant à présenter à la caisse.
      </p>
      {!consent && (
        <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-muted-foreground">
          <div className="rounded-xl border border-border/60 bg-card/70 px-2 py-2">
            <Clock className="mx-auto mb-1 h-4 w-4 text-caramel" />
            30 sec/question
          </div>
          <div className="rounded-xl border border-border/60 bg-card/70 px-2 py-2">
            <Gift className="mx-auto mb-1 h-4 w-4 text-caramel" />
            Lots selon score
          </div>
          <div className="rounded-xl border border-border/60 bg-card/70 px-2 py-2">
            <ShieldCheck className="mx-auto mb-1 h-4 w-4 text-caramel" />
            1 gain/semaine
          </div>
        </div>
      )}
    </motion.div>
  );

  if (!consentLoading && !hasConsented && phase === "intro") {
    return (
      <div className="min-h-screen px-4 pb-24 pt-20">
        <div className="mx-auto max-w-lg">
          <HeaderBlock consent />
          <RGPDConsentBanner onAccept={acceptConsent} context="quiz" />
        </div>
      </div>
    );
  }

  if (phase === "intro") {
    return (
      <div className="min-h-screen px-4 pb-24 pt-20">
        <div className="mx-auto max-w-lg">
          <HeaderBlock />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6"
          >
            <WeeklyCountdown />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="card-warm mb-6 border-caramel/30 bg-gradient-to-br from-butter/50 to-caramel/10"
          >
            <h2 className="mb-4 text-center font-display text-xl font-bold">
              Lots de la semaine
            </h2>
            {stockLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : stock ? (
              <div className="space-y-4">
                {PRIZE_TIERS.map((tier) => {
                  const remaining = stock[tier.stockKey];
                  return (
                    <div key={tier.title} className={`flex items-center justify-between rounded-xl border p-4 ${tier.cardClass}`}>
                      <div className="flex items-center gap-3">
                        <span className="text-3xl" aria-hidden="true">{tier.icon}</span>
                        <div>
                          <p className="font-display text-lg font-bold">{tier.title}</p>
                          <p className="text-xs text-muted-foreground">{tier.rule}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`text-2xl font-bold ${remaining > 0 ? "text-herb" : "text-destructive"}`}>
                          {remaining}
                        </span>
                        <p className="text-xs text-muted-foreground">restant{remaining !== 1 ? "s" : ""}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="rounded-xl border border-border/60 bg-card/60 p-4 text-center text-sm text-muted-foreground">
                Les lots de la semaine seront affichés dans quelques instants.
              </p>
            )}
            <p className="mt-4 text-center text-xs text-muted-foreground">
              Nouvelle semaine chaque dimanche à minuit
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16 }}
            className="card-warm mb-6"
          >
            <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold">
              <Trophy className="h-5 w-5 text-caramel" />
              Comment ça marche ?
            </h2>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-sm">
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 font-medium text-primary">1</span>
                <span>Répondez à <strong>{TOTAL_QUESTIONS} questions</strong> sur la Sarthe, Mamers, les crêpes et la gourmandise</span>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 font-medium text-primary">2</span>
                <span><strong>{QUESTION_TIME_LIMIT} secondes</strong> par question — le décompte reste affiché pendant le jeu</span>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 font-medium text-primary">3</span>
                <span>Si vous gagnez, recevez votre code par <strong>email</strong> ou <strong>WhatsApp</strong>, puis indiquez-le à la caisse</span>
              </li>
            </ul>
          </motion.div>

          {alreadyWon && weeklyCode && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-4 rounded-xl border border-border/60 bg-secondary/40 p-4"
            >
              <p className="text-center text-sm text-muted-foreground">✅ Tu as déjà gagné cette semaine</p>
              <p className="mt-2 text-center font-mono text-2xl font-bold tracking-wider">{weeklyCode}</p>
              <p className="mt-2 text-center text-xs text-muted-foreground">Code à présenter à la caisse</p>
            </motion.div>
          )}

          {(error || submitError) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-4 flex items-center gap-3 rounded-xl border border-destructive/20 bg-destructive/10 p-4"
            >
              <AlertCircle className="h-5 w-5 flex-shrink-0 text-destructive" />
              <p className="text-sm text-destructive">{error || submitError}</p>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22 }}
          >
            <Button
              className="btn-hero group w-full py-6 text-lg"
              onClick={handleStart}
              disabled={isLoading || !deviceFingerprint}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Chargement...
                </>
              ) : alreadyWon ? (
                <>
                  <span>Rejouer pour le fun</span>
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </>
              ) : (
                <>
                  <span>Commencer le Quiz</span>
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28 }}
            className="card-warm mt-6 border-herb/20 bg-gradient-to-br from-herb/5 to-butter/30"
          >
            <RealtimeWins />
          </motion.div>
        </div>
      </div>
    );
  }

  if (phase === "playing" && currentQuestion) {
    return (
      <div className="min-h-dvh overflow-y-auto px-4 pb-[calc(env(safe-area-inset-bottom)+8rem)] pt-20 [touch-action:pan-y]">
        <div className="mx-auto max-w-lg">
          <div className="sticky top-16 z-10 mb-4 rounded-2xl bg-background/90 pb-2 backdrop-blur supports-[backdrop-filter]:bg-background/70">
            <QuizTimer
              duration={QUESTION_TIME_LIMIT}
              onTimeUp={handleTimeUp}
              isActive={timerActive}
              resetKey={timerKey}
            />
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-4 flex items-center justify-between rounded-xl border border-herb/30 bg-gradient-to-r from-herb/10 to-butter/20 p-3"
          >
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-herb" />
              <span className="text-sm font-medium">Votre score</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-2xl font-bold text-herb">{score}</span>
              <span className="text-muted-foreground">/{TOTAL_QUESTIONS}</span>
            </div>
          </motion.div>

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
      </div>
    );
  }

  if (phase === "form") {
    return (
      <div className="min-h-screen px-4 pb-8 pt-20">
        <div className="mx-auto max-w-lg">
          <QuizPreForm
            onSubmit={handleFormSubmit}
            isLoading={submitLoading}
            error={submitError || undefined}
            savedData={userData}
            score={score}
          />
        </div>
      </div>
    );
  }

  if (phase === "processing") {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 pb-8 pt-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card-warm max-w-sm py-12 text-center"
        >
          <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-primary" />
          <h2 className="mb-2 font-display text-xl font-bold">
            Calcul de ton résultat...
          </h2>
          <p className="text-muted-foreground">
            Un instant {currentFirstName} ! 🎯
          </p>
        </motion.div>
      </div>
    );
  }

  if (phase === "winner" && winnerData) {
    return (
      <div className="min-h-screen px-4 pb-8 pt-20">
        <div className="mx-auto max-w-lg">
          <QuizWinnerPremium
            firstName={winnerData.firstName}
            email={winnerData.email}
            phone={winnerData.phone}
            prize={winnerData.prize}
            prizeCode={winnerData.prizeCode}
            secretCode={winnerData.secretCode || null}
            onPlayAgain={handlePlayAgain}
          />
        </div>
      </div>
    );
  }

  if (phase === "loser") {
    return (
      <div className="min-h-screen px-4 pb-8 pt-20">
        <div className="mx-auto max-w-lg">
          <QuizLoser
            firstName={currentFirstName}
            email={userData?.email || ""}
            phone={userData?.phone || ""}
            score={score}
            secretCode={resultSecretCode}
            stockRemaining={stockData || { formule_complete_remaining: 0, galette_remaining: 0, crepe_remaining: 0 }}
            onPlayAgain={handlePlayAgain}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 pb-8 pt-20">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
};

export default Quiz;
