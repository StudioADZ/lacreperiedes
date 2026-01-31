import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

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
    { key: 'A', value: question.option_a },
    { key: 'B', value: question.option_b },
    { key: 'C', value: question.option_c },
    { key: 'D', value: question.option_d },
  ];

  const getOptionStyle = (key: string) => {
    if (!showResult) {
      return selectedAnswer === key
        ? 'bg-primary text-primary-foreground border-primary'
        : 'bg-background border-border hover:border-primary/50';
    }

    if (key === correctAnswer) {
      return 'bg-green-500 text-white border-green-500';
    }

    if (selectedAnswer === key && !isCorrect) {
      return 'bg-red-500 text-white border-red-500';
    }

    return 'bg-background border-border opacity-60';
  };

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Question {questionNumber}/{totalQuestions}
        </p>
      </div>

      {/* Question */}
      <div className="bg-card p-6 rounded-2xl border">
        <h2 className="text-xl font-semibold leading-relaxed">
          {question.question}
        </h2>
      </div>

      {/* Options */}
      <div className="space-y-3">
        {options.map((option) => (
          <motion.button
            key={option.key}
            whileHover={!showResult && !isLoading ? { scale: 1.02 } : {}}
            whileTap={!showResult && !isLoading ? { scale: 0.98 } : {}}
            disabled={isLoading || showResult}
            onClick={() => onAnswer(option.key)}
            className={`w-full p-4 rounded-xl border-2 transition-all duration-200 text-left flex items-center gap-4 ${getOptionStyle(option.key)}`}
          >
            <span className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center font-bold">
              {option.key}
            </span>
            <span className="flex-1">
              {/* Non destructif : si option vide, on affiche un placeholder lisible */}
              <p className="font-medium">
                {option.value && String(option.value).trim().length > 0 ? option.value : '— (option manquante)'}
              </p>
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default QuizQuestion;
