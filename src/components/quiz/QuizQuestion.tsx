import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface QuizQuestionProps {
  question: {
    question: string;
    option_a: string;
    option_b: string;
    option_c: string;
    option_d: string;
  };
  questionNumber: number;
  totalQuestions: number;
  onAnswer: (answer: string) => void;
  isLoading: boolean;
  selectedAnswer?: string;
  showResult?: boolean;
  isCorrect?: boolean;
  correctAnswer?: string;
}

const QuizQuestion = ({
  question,
  questionNumber,
  totalQuestions,
  onAnswer,
  isLoading,
  selectedAnswer,
  showResult,
  isCorrect,
  correctAnswer,
}: QuizQuestionProps) => {
  const options = [
    { key: "A", value: question.option_a },
    { key: "B", value: question.option_b },
    { key: "C", value: question.option_c },
    { key: "D", value: question.option_d },
  ];

  const getOptionStyle = (key: string) => {
    if (!showResult) {
      return selectedAnswer === key
        ? "border-primary bg-primary/10"
        : "border-border hover:border-primary/50 hover:bg-secondary/50";
    }

    if (key === correctAnswer) {
      return "border-herb bg-herb/10 text-herb";
    }
    if (selectedAnswer === key && !isCorrect) {
      return "border-destructive bg-destructive/10 text-destructive";
    }
    return "border-border opacity-50";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-4 pb-28 [touch-action:pan-y] sm:space-y-6 sm:pb-8"
    >
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Question {questionNumber}/{totalQuestions}
          </span>
          <span className="font-medium text-primary">
            {Math.round((questionNumber / totalQuestions) * 100)}%
          </span>
        </div>
        <div className="quiz-progress">
          <motion.div
            className="quiz-progress-bar"
            initial={{ width: `${((questionNumber - 1) / totalQuestions) * 100}%` }}
            animate={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="card-warm px-4 py-5 text-center sm:py-8">
        <h2 className="font-display text-lg font-semibold leading-relaxed sm:text-xl">
          {question.question}
        </h2>
      </div>

      {/* Options */}
      <div className="space-y-2.5 [touch-action:pan-y] sm:space-y-3">
        {options.map((option) => (
          <motion.button
            key={option.key}
            whileHover={!showResult && !isLoading ? { scale: 1.01 } : {}}
            whileTap={!showResult && !isLoading ? { scale: 0.99 } : {}}
            disabled={isLoading || showResult}
            onClick={() => onAnswer(option.key)}
            className={`flex w-full items-center gap-3 rounded-xl border-2 p-3 text-left transition-all duration-200 [touch-action:manipulation] sm:gap-4 sm:p-4 ${getOptionStyle(option.key)}`}
          >
            <span className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-base font-bold sm:h-10 sm:w-10 sm:text-lg ${
              showResult && option.key === correctAnswer
                ? "bg-herb text-white"
                : showResult && selectedAnswer === option.key && !isCorrect
                  ? "bg-destructive text-white"
                  : selectedAnswer === option.key
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground"
            }`}>
              {option.key}
            </span>
            <span className="flex-1 text-sm font-medium leading-relaxed sm:text-base">{option.value}</span>
            {showResult && option.key === correctAnswer && (
              <span className="text-xl">✓</span>
            )}
            {showResult && selectedAnswer === option.key && !isCorrect && (
              <span className="text-xl">✗</span>
            )}
          </motion.button>
        ))}
      </div>

      {/* Result feedback */}
      <AnimatePresence>
        {showResult && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`rounded-xl py-3 text-center font-medium ${
              isCorrect
                ? "bg-herb/10 text-herb"
                : "bg-destructive/10 text-destructive"
            }`}
          >
            {isCorrect ? "🎉 Bonne réponse !" : "❌ Mauvaise réponse"}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default QuizQuestion;
