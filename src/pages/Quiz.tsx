import { useState, useEffect, useCallback } from "react";
import { ArrowRight, Trophy, Gift, Loader2, AlertCircle, Star, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuizSession } from "@/hooks/useQuizSession";
import { useWeeklyStock } from "@/hooks/useWeeklyStock";
import { useUserMemory } from "@/hooks/useUserMemory";
import { useRGPDConsent } from "@/hooks/useRGPDConsent";
import QuizQuestion from "@/components/quiz/QuizQuestion";
import QuizPreForm from "@/components/quiz/QuizPreForm";
import QuizWinnerPremium from "@/components/quiz/QuizWinnerPremium";
import QuizLoser from "@/components/quiz/QuizLoser";
import StockIndicator from "@/components/quiz/StockIndicator";
import QuizTimer from "@/components/quiz/QuizTimer";
import WinnersHero from "@/components/quiz/WinnersHero";
import RealtimeWins from "@/components/quiz/RealtimeWins";
import WeeklyCountdown from "@/components/quiz/WeeklyCountdown";
import RGPDConsentBanner from "@/components/RGPDConsentBanner";
import { motion, AnimatePresence } from "framer-motion";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const QUESTION_TIME_LIMIT = 30;

type QuizPhase = 'intro' | 'playing' | 'form' | 'processing' | 'winner' | 'loser';

const Quiz = () => {
  const [phase, setPhase] = useState<QuizPhase>('intro');
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
  } | null>(null);
  const [stockData, setStockData] = useState<{
    formule_complete_remaining: number;
    galette_remaining: number;
    crepe_remaining: number;
  } | null>(null);
  const [currentFirstName, setCurrentFirstName] = useState<string>('');
  const [timerKey, setTimerKey] = useState(0);
  const [timerActive, setTimerActive] = useState(false);

  const { data: stock, isLoading: stockLoading } = useWeeklyStock();
  const { userData, saveUserData, hasPlayedBefore } = useUserMemory();
  const { hasConsented, isLoading: consentLoading, acceptConsent } = useRGPDConsent();
  const {
    isLoading,
    error,
    session,
    currentQuestion,
    currentQuestionIndex,
    score,
    isComplete,
    deviceFingerprint,
    startSession,
    submitAnswer,
    resetSession,
  } = useQuizSession();

  // Handle starting the quiz
  const handleStart = async () => {
    const result = await startSession();
    if (result?.success) {
      setPhase('playing');
      setTimerKey(prev => prev + 1);
      setTimerActive(true);
    } else if (result?.error === 'already_won') {
      setSubmitError('Tu as déjà gagné cette semaine ! Reviens dimanche prochain 😊');
    }
  };

  // Handle time up
  const handleTimeUp = useCallback(() => {
    if (showResult || isLoading) return;
    handleAnswer('TIMEOUT');
  }, [showResult, isLoading]);

  // Handle answering a question
  const handleAnswer = async (answer: string) => {
    if (showResult || isLoading) return;

    setTimerActive(false);
    setSelectedAnswer(answer === 'TIMEOUT' ? null : answer);
    const result = await submitAnswer(answer);

    if (result?.success) {
      setLastResult({ isCorrect: result.isCorrect, correctAnswer: result.correctAnswer });
      setShowResult(true);

      setTimeout(() => {
        setSelectedAnswer(null);
        setShowResult(false);
        setLastResult(null);

        if (currentQuestionIndex + 1 >= 10) {
          // Quiz complete -> show form (or skip if already known)
          setPhase('form');
        } else {
          setTimerKey(prev => prev + 1);
          setTimerActive(true);
        }
      }, 1500);
    }
  };

  // Handle form submission
  const handleFormSubmit = async (data: { firstName: string; email: string; phone: string; rgpdConsent: boolean }) => {
    if (!session || !deviceFingerprint) return;

    setSubmitLoading(true);
    setSubmitError(null);
    setCurrentFirstName(data.firstName);
    setPhase('processing');

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/quiz-submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.id,
          deviceFingerprint,
          ...data,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.error === 'phone_already_won' || result.error === 'email_already_won') {
          setSubmitError('Tu as déjà gagné cette semaine 😊 Reviens la semaine prochaine !');
          setPhase('form');
        } else {
          setSubmitError(result.message || 'Erreur lors de la soumission');
          setPhase('form');
        }
        setSubmitLoading(false);
        return;
      }

      // Save user data for future plays
      saveUserData({
        firstName: data.firstName,
        email: data.email,
        phone: data.phone,
      });

      // Store stock info
      if (result.stock) {
        setStockData({
          formule_complete_remaining: result.stock.formule_complete_remaining,
          galette_remaining: result.stock.galette_remaining,
          crepe_remaining: result.stock.crepe_remaining,
        });
      }

      if (result.prizeWon && result.prizeCode) {
        setWinnerData({
          firstName: result.firstName,
          email: data.email,
          phone: data.phone,
          prize: result.prizeWon,
          prizeCode: result.prizeCode,
        });
        setPhase('winner');
      } else {
        setCurrentFirstName(result.firstName);
        setPhase('loser');
      }
    } catch (err) {
      setSubmitError('Erreur de connexion');
      setPhase('form');
    } finally {
      setSubmitLoading(false);
    }
  };

  // Handle play again
  const handlePlayAgain = () => {
    resetSession();
    setPhase('intro');
    setWinnerData(null);
    setSubmitError(null);
    setTimerActive(false);
    setStockData(null);
  };

  // RGPD Consent Screen - Show before intro if not consented
  if (!consentLoading && !hasConsented && phase === 'intro') {
    return (
      <div className="min-h-screen pt-20 pb-24 px-4">
        <div className="max-w-lg mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
              🎯 Quiz Hebdomadaire
            </span>
            <h1 className="font-display text-3xl font-bold mb-3">
              Testez vos connaissances !
            </h1>
            <p className="text-muted-foreground">
              Répondez à 10 questions et gagnez des crêpes gratuites
            </p>
          </motion.div>

          {/* RGPD Consent Banner */}
          <RGPDConsentBanner onAccept={acceptConsent} context="quiz" />
        </div>
      </div>
    );
  }

  // Intro Screen
  if (phase === 'intro') {
    return (
      <div className="min-h-screen pt-20 pb-24 px-4">
        <div className="max-w-lg mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
              🎯 Quiz Hebdomadaire
            </span>
            <h1 className="font-display text-3xl font-bold mb-3">
              Testez vos connaissances !
            </h1>
            <p className="text-muted-foreground">
              Répondez à 10 questions et gagnez des crêpes gratuites
            </p>
          </motion.div>

          {/* Weekly Countdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6"
          >
            <WeeklyCountdown />
          </motion.div>

          {/* Realtime Wins - Preuve sociale en temps réel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="card-warm mb-6 bg-gradient-to-br from-herb/5 to-butter/30 border-herb/20"
          >
            <RealtimeWins />
          </motion.div>

          {/* Winners Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="card-warm mb-6"
          >
            <WinnersHero />
          </motion.div>

          {/* Stock */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
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
                    <span className={`text-2xl font-bold ${stock.formule_complete_remaining > 0 ? 'text-herb' : 'text-destructive'}`}>
                      {stock.formule_complete_remaining}
                    </span>
                    <p className="text-xs text-muted-foreground">restant{stock.formule_complete_remaining !== 1 ? 's' : ''}</p>
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
                    <span className={`text-2xl font-bold ${stock.galette_remaining > 0 ? 'text-herb' : 'text-destructive'}`}>
                      {stock.galette_remaining}
                    </span>
                    <p className="text-xs text-muted-foreground">restant{stock.galette_remaining !== 1 ? 's' : ''}</p>
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
                    <span className={`text-2xl font-bold ${stock.crepe_remaining > 0 ? 'text-herb' : 'text-destructive'}`}>
                      {stock.crepe_remaining}
                    </span>
                    <p className="text-xs text-muted-foreground">restant{stock.crepe_remaining !== 1 ? 's' : ''}</p>
                  </div>
                </div>
              </div>
            ) : null}
            <p className="text-xs text-muted-foreground text-center mt-4">
              Nouvelle semaine chaque dimanche à minuit
            </p>

            {/* Google Reviews Buttons */}
            <div className="flex gap-3 mt-4 pt-4 border-t border-border/50">
              <a
                href="https://g.page/r/CfHqAKfL6g4XEAE"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1"
              >
                <Button variant="outline" size="sm" className="w-full gap-2 h-10">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span className="text-xs">Voir les avis</span>
                </Button>
              </a>
              <a
                href="https://g.page/r/CfHqAKfL6g4XEAE/review"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1"
              >
                <Button variant="default" size="sm" className="w-full gap-2 h-10">
                  <MessageSquare className="w-4 h-4" />
                  <span className="text-xs">Laisser un avis</span>
                </Button>
              </a>
            </div>
          </motion.div>

          {/* Rules */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card-warm mb-6"
          >
            <h2 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-caramel" />
              Comment ça marche ?
            </h2>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-sm">
                <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium flex-shrink-0">1</span>
                <span>Répondez à <strong>10 questions</strong> sur la culture sarthoise et les crêpes</span>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium flex-shrink-0">2</span>
                <span><strong>30 secondes</strong> par question – soyez rapide !</span>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium flex-shrink-0">3</span>
                <span>Présentez votre QR code au restaurant pour récupérer votre gain</span>
              </li>
            </ul>
          </motion.div>

          {/* Error */}
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

          {/* Start Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
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
              ) : (
                <>
                  <span>Commencer le Quiz</span>
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </motion.div>

          <p className="text-xs text-center text-muted-foreground mt-4">
            1 participation gagnante max par semaine et par personne
          </p>
        </div>
      </div>
    );
  }

  // Playing phase
  if (phase === 'playing' && currentQuestion) {
    return (
      <div className="min-h-screen pt-20 pb-8 px-4">
        <div className="max-w-lg mx-auto">
          {/* Timer */}
          <div className="mb-4">
            <QuizTimer
              duration={QUESTION_TIME_LIMIT}
              onTimeUp={handleTimeUp}
              isActive={timerActive}
              resetKey={timerKey}
            />
          </div>

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

  // Form phase
  if (phase === 'form') {
    return (
      <div className="min-h-screen pt-20 pb-8 px-4">
        <div className="max-w-lg mx-auto">
          <QuizPreForm
            onSubmit={handleFormSubmit}
            isLoading={submitLoading}
            error={submitError || undefined}
            savedData={userData}
          />
        </div>
      </div>
    );
  }

  // Processing phase
  if (phase === 'processing') {
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

  // Winner phase
  if (phase === 'winner' && winnerData) {
    return (
      <div className="min-h-screen pt-20 pb-8 px-4">
        <div className="max-w-lg mx-auto">
          <QuizWinnerPremium
            firstName={winnerData.firstName}
            email={winnerData.email}
            phone={winnerData.phone}
            prize={winnerData.prize}
            prizeCode={winnerData.prizeCode}
            onPlayAgain={handlePlayAgain}
          />
        </div>
      </div>
    );
  }

  // Loser phase
  if (phase === 'loser') {
    return (
      <div className="min-h-screen pt-20 pb-8 px-4">
        <div className="max-w-lg mx-auto">
          <QuizLoser
            firstName={currentFirstName}
            email={userData?.email || ''}
            phone={userData?.phone || ''}
            stockRemaining={stockData || { formule_complete_remaining: 0, galette_remaining: 0, crepe_remaining: 0 }}
            onPlayAgain={handlePlayAgain}
          />
        </div>
      </div>
    );
  }

  // Loading state
  return (
    <div className="min-h-screen pt-20 pb-8 px-4 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
};

export default Quiz;
