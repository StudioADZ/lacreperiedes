import { motion } from 'framer-motion';

interface StockIndicatorProps {
  label: string;
  remaining: number;
  total: number;
  emoji: string;
}

const StockIndicator = ({ label, remaining, total, emoji }: StockIndicatorProps) => {
  const percentage = (remaining / total) * 100;
  const isLow = remaining <= 3;
  const isOut = remaining === 0;

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50">
      <span className="text-2xl">{emoji}</span>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium">{label}</span>
          {isOut ? (
            <span className="text-xs px-2 py-0.5 bg-muted text-muted-foreground rounded-full">
              Épuisé
            </span>
          ) : isLow ? (
            <span className="text-xs px-2 py-0.5 bg-destructive/10 text-destructive rounded-full">
              🔥 Populaire
            </span>
          ) : null}
        </div>
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {remaining > 0 ? `${remaining} restant${remaining > 1 ? 's' : ''}` : 'Plus disponible'}
        </p>
      </div>
    </div>
  );
};

export default StockIndicator;