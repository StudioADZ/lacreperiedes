import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Trophy, ArrowRight, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getWeeklyCode, hasWonThisWeek, markWonThisWeek } from "@/features/quiz/services/localCodes";
import { useWeeklyStock } from "@/hooks/useWeeklyStock";
import { useUserMemory } from "@/hooks/useUserMemory";
import { useRGPDConsent } from "@/hooks/useRGPDConsent";
import { useQuizSession } from "@/hooks/useQuizSession";
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

type QuizPhase = "intro" | "playing" | "form" | "processing" | "winner" | "loser";

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

  useEffect(() => {
    if (phase === "intro") {
      setAlreadyWon(hasWonThisWeek());
      setWeeklyCode(getWeeklyCode());
    }
  }, [phase]);

  const handleStart = async () => {
    setSubmitError(null);
    const result = await startSession();
    if (result?.success) {
      setPhase("playing");
      setTimerKey((prev) => prev + 1);
      setTimerActive(true);
    }
  };

  const handleTimeUp = useCallback(() => {
    if (showResult || isLoading) return;
    void handleAnswer("TIMEOUT");
  }, [showResult, isLoading]);

  const handleAnswer = async (answer: string) => {
    if (showResult || isLoading) return;

    setTimerActive(false);
    setSelectedAnswer(answer === "TIMEOUT" ? null : answer);
    const result = await submitAnswer(answer);

    if (result?.success) {
      setLastResult({ isCorrect: result.isCorrect, correctAnswer: result.correctAnswer });
      setShowResult(true);

      setTimeout(() => {
        setSelectedAnswer(null);
        setShowResult(false);
        setLastResult(null);

        if (currentQuestionIndex + 1 >= 10) {
          setPhase("form");
        } else {
          setTimerKey((prev) => prev + 1);
          setTimerActive(true);
        }
      }, 1500);
    }
  };

  const handleFormSubmit = async (data: { firstName: string; email: string; phone: string; rgpdConsent: boolean }) => {
    if (!session || !deviceFingerprint) return;

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
      const response = await fetch(`${SUPABASE_URL}/functions/v1/quiz-submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: session.id,
          deviceFingerprint,
          ...data,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.error === "phone_already_won" || result.error === "email_already_won") {
          setSubmitError("Tu as déjà gagné cette semaine 😊 Reviens la semaine prochaine !");
          setPhase("form");
        } else {
          setSubmitError(result.message || "Erreur lors de la soumission");
          setPhase("form");
        }
        setSubmitLoading(false);
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

      if (result.secretCode) {
        setResultSecretCode(result.secretCode);
      }

      if (result.prizeWon && result.prizeCode) {
        markWonThisWeek(result.prizeCode);
        setAlreadyWon(true);
        setWeeklyCode(result.prizeCode);

        setWinnerData({
          firstName: result.firstName,
          email: data.email,
          phone: data.phone,
          prize: result.prizeWon,
          prizeCode: result.prizeCode,
          secretCode: result.secretCode,
        });
        setPhase("winner");
      } else {
        setCurrentFirstName(result.firstName);
        setPhase("loser");
      }
    } catch (err) {
      setSubmitError("Erreur de connexion");
      setPhase("form");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handlePlayAgain = () => {
    void resetSession();
    setPhase("intro");
    setWinnerData(null);
    setSubmitError(null);
    setTimerActive(false);
    setStockData(null);
  };

  const HeaderBlock = ({ consent = false }: { consent?: boolean }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center mb-8"
    >
      <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
        🎯 Quiz Hebdomadaire
      </span>
      <h1 className="font-display text-3xl font-bold mb-3">
        Quiz gourmand de la semaine
      </h1>
      <p className="text-muted-foreground">
        10 questions, 30 secondes chacune, et un code gagnant à présenter à la caisse.
      </p>
      {!consent && (
        <p className="text-xs text-muted-foreground mt-2">
          1 gain maximum par personne et par semaine.
        </p>
      )}
    </motion.div>
  );

  if (!consentLoading && !hasConsented && phase === "intro") {
    return (
      <div className="min-h-screen pt-20 pb-24 px-4">
        <div className="max-w-lg mx-auto">
          <HeaderBlock consent />
          <RGPDConsentBanner onAccept={acceptConsent} context="quiz" />
        </div>
      </div>
    );
  }

  if (phase === "intro") {
    return (
      <div className="min-h-screen pt-20 pb-24 px-4">
        <div className="max-w-lg mx-auto">
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
            className="card-warm mb-6 bg-gradient-to-br from-butter/50 to-caramel/10 border-caramel/30"
          >
            <h2 className="font-display text-xl font-bold mb-4 text-center">
              🎁 Lots de la semaine
            </h2>
            {stockLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : stock ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-caramel/20 to-caramel/10 border border-caramel/30">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">🏆</span>
                    <div>
                      <p className="font-display font-bold text-lg">10 Formules complètes</p>
                      <p className="text-xs text-muted-foreground">100% de bonnes réponses</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-2xl font-bold ${stock.formule_complete_remaining > 0 ? "text-herb" : "text-destructive"}`}>
                      {stock.formule_complete_remaining}
                    </span>
                    <p className="text-xs text-muted-foreground">restant{stock.formule_complete_remaining !== 1 ? "s" : ""}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50 border border-border/50">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">🥈</span>
                    <div>
                      <p className="font-display font-bold text-lg">20 Galettes</p>
                      <p className="text-xs text-muted-foreground">90-99% de bonnes réponses</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-2xl font-bold ${stock.galette_remaining > 0 ? "text-herb" : "text-destructive"}`}>
                      {stock.galette_remaining}
                    </span>
                    <p className="text-xs text-muted-foreground">restant{stock.galette_remaining !== 1 ? "s" : ""}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 border border-border/50">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">🥉</span>
                    <div>
                      <p className="font-display font-bold text-lg">30 Crêpes</p>
                      <p className="text-xs text-muted-foreground">80-89% de bonnes réponses</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-2xl font-bold ${stock.crepe_remaining > 0 ? "text-herb" : "text-destructive"}`}>
                      {stock.crepe_remaining}
                    </span>
                    <p className="text-xs text-muted-foreground">restant{stock.crepe_remaining !== 1 ? "s" : ""}</p>
                  </div>
                </div>
              </div>
            ) : null}
            <p className="text-xs text-muted-foreground text-center mt-4">
              Nouvelle semaine chaque dimanche à minuit
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16 }}
            className="card-warm mb-6"
          >
            <h2 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-caramel" />
              Comment ça marche ?
            </h2>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-sm">
                <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium flex-shrink-0">1</span>
                <span>Répondez à <strong>10 questions</strong> sur la Sarthe, Mamers, les crêpes et la gourmandise</span>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium flex-shrink-0">2</span>
                <span><strong>30 secondes</strong> par question — le décompte reste affiché pendant le jeu</span>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium flex-shrink-0">3</span>
                <span>Si vous gagnez, recevez votre code par <strong>email</strong> ou <strong>WhatsApp</strong>, puis indiquez-le à la caisse</span>
              </li>
            </ul>
          </motion.div>

          {alreadyWon && weeklyCode && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-4 p-4 rounded-xl bg-secondary/40 border border-border/60"
            >
              <p className="text-sm text-muted-foreground text-center">✅ Tu as déjà gagné cette semaine</p>
              <p className="text-center mt-2 font-mono text-2xl font-bold tracking-wider">{weeklyCode}</p>
              <p className="text-xs text-muted-foreground text-center mt-2">Code à présenter à la caisse</p>
            </motion.div>
          )}

          {(error || submitError) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-4 p-4 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center gap-3"
            >
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
              <p className="text-sm text-destructive">{error || submitError}</p>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22 }}
          >
            <Button
              className="w-full btn-hero text-lg py-6 group"
              onClick={handleStart}
              disabled={isLoading || !deviceFingerprint}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Chargement...
                </>
              ) : alreadyWon ? (
                <>
                  <span>Rejouer pour le fun</span>
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              ) : (
                <>
                  <span>Commencer le Quiz</span>
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28 }}
            className="card-warm mt-6 bg-gradient-to-br from-herb/5 to-butter/30 border-herb/20"
          >
            <RealtimeWins />
          </motion.div>
        </div>
      </div>
    );
  }

  if (phase === "playing" && currentQuestion) {
    return (
      <div className="min-h-screen pt-20 pb-8 px-4">
        <div className="max-w-lg mx-auto">
          <div className="mb-4">
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
            className="mb-4 p-3 rounded-xl bg-gradient-to-r from-herb/10 to-butter/20 border border-herb/30 flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-herb" />
              <span className="font-medium text-sm">Votre score</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-2xl font-bold text-herb">{score}</span>
              <span className="text-muted-foreground">/10</span>
            </div>
          </motion.div>

          <AnimatePresence mode="wait">
            <QuizQuestion
              key={currentQuestionIndex}
              question={currentQuestion}
              questionNumber={currentQuestionIndex + 1}
              totalQuestions={10}
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
      <div className="min-h-screen pt-20 pb-8 px-4">
        <div className="max-w-lg mx-auto">
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
      <div className="min-h-screen pt-20 pb-8 px-4 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card-warm text-center py-12 max-w-sm"
        >
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <h2 className="font-display text-xl font-bold mb-2">
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
      <div className="min-h-screen pt-20 pb-8 px-4">
        <div className="max-w-lg mx-auto">
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
      <div className="min-h-screen pt-20 pb-8 px-4">
        <div className="max-w-lg mx-auto">
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
    <div className="min-h-screen pt-20 pb-8 px-4 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
};

export default Quiz;
