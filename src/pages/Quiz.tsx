import { useState, useEffect, useCallback } from "react";
import { ArrowRight, Trophy, Gift, Clock, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuizSession } from "@/hooks/useQuizSession";
import { useWeeklyStock } from "@/hooks/useWeeklyStock";
import QuizQuestion from "@/components/quiz/QuizQuestion";
import QuizForm from "@/components/quiz/QuizForm";
import QuizWinner from "@/components/quiz/QuizWinner";
import StockIndicator from "@/components/quiz/StockIndicator";
import QuizTimer from "@/components/quiz/QuizTimer";
import SocialFooter from "@/components/SocialFooter";
import { motion, AnimatePresence } from "framer-motion";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const QUESTION_TIME_LIMIT = 30; // 30 seconds per question

type QuizPhase = 'intro' | 'playing' | 'form' | 'result';

const Quiz = () => {
  const [phase, setPhase] = useState<QuizPhase>('intro');
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [lastResult, setLastResult] = useState<{ isCorrect: boolean; correctAnswer: string } | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [winnerData, setWinnerData] = useState<{
    firstName: string;
    prize: string;
    prizeCode: string;
  } | null>(null);
  const [timerKey, setTimerKey] = useState(0);
  const [timerActive, setTimerActive] = useState(false);

  const { data: stock, isLoading: stockLoading } = useWeeklyStock();
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
      setSubmitError('Vous avez déjà gagné cette semaine ! Revenez dimanche prochain.');
    }
  };

  // Handle time up - auto submit wrong answer
  const handleTimeUp = useCallback(() => {
    if (showResult || isLoading) return;
    // Submit empty answer which will be wrong
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

      // Auto-advance after showing result
      setTimeout(() => {
        setSelectedAnswer(null);
        setShowResult(false);
        setLastResult(null);

        // Check if quiz is complete
        if (currentQuestionIndex + 1 >= 10) {
          setPhase('form');
        } else {
          // Reset timer for next question
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
        setSubmitError(result.message || 'Erreur lors de la soumission');
        setSubmitLoading(false);
        return;
      }

      if (result.prizeWon && result.prizeCode) {
        setWinnerData({
          firstName: result.firstName,
          prize: result.prizeWon,
          prizeCode: result.prizeCode,
        });
      }

      setPhase('result');
    } catch (err) {
      setSubmitError('Erreur de connexion');
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
  };

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

          {/* Prizes of the week - NEW SECTION */}
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

          <SocialFooter />
        </div>
      </div>
    );
  }

  // Playing phase
  if (phase === 'playing' && currentQuestion) {
    return (
      <div className="min-h-screen pt-20 pb-24 px-4">
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
      <div className="min-h-screen pt-20 pb-24 px-4">
        <div className="max-w-lg mx-auto">
          <QuizForm
            score={score}
            totalQuestions={10}
            onSubmit={handleFormSubmit}
            isLoading={submitLoading}
            error={submitError || undefined}
          />
        </div>
      </div>
    );
  }

  // Result phase
  if (phase === 'result') {
    if (winnerData) {
      return (
        <div className="min-h-screen pt-20 pb-24 px-4">
          <div className="max-w-lg mx-auto">
            <QuizWinner
              firstName={winnerData.firstName}
              prize={winnerData.prize}
              prizeCode={winnerData.prizeCode}
              onPlayAgain={handlePlayAgain}
            />
            <SocialFooter />
          </div>
        </div>
      );
    }

    // No prize won
    return (
      <div className="min-h-screen pt-20 pb-24 px-4">
        <div className="max-w-lg mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-warm text-center py-12"
          >
            <div className="text-5xl mb-4">😊</div>
            <h2 className="font-display text-2xl font-bold mb-3">
              Merci d'avoir participé !
            </h2>
            <p className="text-muted-foreground mb-2">
              Votre score : <strong>{score}/10</strong>
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Il faut au moins 80% pour gagner un lot.
              <br />Revenez la semaine prochaine !
            </p>

            <div className="space-y-3">
              <a
                href="https://wa.me/message/QVZO5N4ZDR64M1"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" className="w-full">
                  💬 Rejoindre notre WhatsApp
                </Button>
              </a>
              <Button onClick={handlePlayAgain} className="w-full btn-hero">
                Retour à l'accueil
              </Button>
            </div>
          </motion.div>
          <SocialFooter />
        </div>
      </div>
    );
  }

  // Loading state
  return (
    <div className="min-h-screen pt-20 pb-24 px-4 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
};

export default Quiz;
