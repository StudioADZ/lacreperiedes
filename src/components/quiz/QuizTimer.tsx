import { useState, useEffect, useCallback } from "react";
import { Timer } from "lucide-react";
import { motion } from "framer-motion";

interface QuizTimerProps {
  duration: number; // seconds
  onTimeUp: () => void;
  isActive: boolean;
  resetKey: number; // Change this to reset the timer
}

const QuizTimer = ({ duration, onTimeUp, isActive, resetKey }: QuizTimerProps) => {
  const [timeLeft, setTimeLeft] = useState(duration);

  const handleTimeUp = useCallback(() => {
    onTimeUp();
  }, [onTimeUp]);

  useEffect(() => {
    setTimeLeft(duration);
  }, [resetKey, duration]);

  useEffect(() => {
    if (!isActive) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, handleTimeUp, resetKey]);

  const percentage = (timeLeft / duration) * 100;
  const isLow = timeLeft <= 10;
  const isCritical = timeLeft <= 5;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center justify-center gap-2 py-2 px-4 rounded-full ${
        isCritical
          ? "bg-destructive/20 text-destructive"
          : isLow
            ? "bg-orange-100 text-orange-600"
            : "bg-secondary text-muted-foreground"
      }`}
    >
      <Timer className={`w-4 h-4 ${isCritical ? "animate-pulse" : ""}`} />
      <span className="font-medium text-sm">
        ⏱ Temps restant : {timeLeft} seconde{timeLeft !== 1 ? "s" : ""}
      </span>
      <div className="w-16 h-2 bg-muted rounded-full overflow-hidden ml-2">
        <motion.div
          className={`h-full rounded-full ${
            isCritical
              ? "bg-destructive"
              : isLow
                ? "bg-orange-500"
                : "bg-primary"
          }`}
          initial={{ width: "100%" }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </motion.div>
  );
};

export default QuizTimer;
