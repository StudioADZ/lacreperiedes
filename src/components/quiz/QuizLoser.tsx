import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { RefreshCw, Gift, Clock } from 'lucide-react';

interface QuizLoserProps {
  firstName: string;
  stockRemaining: {
    formule_complete_remaining: number;
    galette_remaining: number;
    crepe_remaining: number;
  };
  onPlayAgain: () => void;
}

const QuizLoser = ({ firstName, stockRemaining, onPlayAgain }: QuizLoserProps) => {
  const totalRemaining = 
    stockRemaining.formule_complete_remaining + 
    stockRemaining.galette_remaining + 
    stockRemaining.crepe_remaining;

  const hasStockLeft = totalRemaining > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Main Card */}
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2 }}
        className="card-warm text-center py-8"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
          className="text-6xl mb-4"
        >
          {hasStockLeft ? '😊' : '😔'}
        </motion.div>

        <h2 className="font-display text-2xl font-bold mb-2">
          Bien joué {firstName} !
        </h2>

        <p className="text-muted-foreground mb-4">
          {hasStockLeft 
            ? "Pas de chance cette fois-ci, mais tu peux rejouer !"
            : "Les lots de cette semaine sont épuisés. Reviens dimanche prochain !"
          }
        </p>

        {/* Stock remaining */}
        {hasStockLeft && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="p-4 rounded-xl bg-gradient-to-r from-caramel/10 to-caramel/5 border border-caramel/20 mb-4"
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <Gift className="w-5 h-5 text-caramel" />
              <span className="font-semibold">Lots encore disponibles</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className="text-center">
                <span className="text-xl font-bold text-herb">{stockRemaining.formule_complete_remaining}</span>
                <p className="text-xs text-muted-foreground">Formules</p>
              </div>
              <div className="text-center">
                <span className="text-xl font-bold text-herb">{stockRemaining.galette_remaining}</span>
                <p className="text-xs text-muted-foreground">Galettes</p>
              </div>
              <div className="text-center">
                <span className="text-xl font-bold text-herb">{stockRemaining.crepe_remaining}</span>
                <p className="text-xs text-muted-foreground">Crêpes</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Replay button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Button 
            onClick={onPlayAgain} 
            className="w-full btn-hero text-lg py-6"
            disabled={!hasStockLeft}
          >
            <RefreshCw className="w-5 h-5 mr-2" />
            {hasStockLeft ? 'Rejouer maintenant' : 'Lots épuisés'}
          </Button>
        </motion.div>
      </motion.div>

      {/* Info */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
        className="card-warm text-center"
      >
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span className="text-sm">1 gain maximum par personne et par semaine</span>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default QuizLoser;
