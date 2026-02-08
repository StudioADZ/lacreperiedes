import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { RefreshCw, Gift, Clock, Sparkles, Lock, ExternalLink } from 'lucide-react';
import { useSecretAccess } from '@/hooks/useSecretAccess';

interface QuizLoserProps {
  firstName: string;
  email: string;
  phone: string;
  score?: number;
  secretCode?: string | null;
  stockRemaining: {
    formule_complete_remaining: number;
    galette_remaining: number;
    crepe_remaining: number;
  };
  onPlayAgain: () => void;
}

const QuizLoser = ({ firstName, email, phone, score, secretCode, stockRemaining, onPlayAgain }: QuizLoserProps) => {
  const [accessGranted, setAccessGranted] = useState(false);
  const { grantAccessFromQuiz } = useSecretAccess();

  const totalRemaining = 
    stockRemaining.formule_complete_remaining + 
    stockRemaining.galette_remaining + 
    stockRemaining.crepe_remaining;

  const hasStockLeft = totalRemaining > 0;

  const handleUnlockMenu = async () => {
    if (!secretCode) return;
    
    const token = await grantAccessFromQuiz(email, phone, firstName, secretCode);
    if (token) {
      setAccessGranted(true);
    }
  };

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

        {/* Score display */}
        {score !== undefined && (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/10 to-butter/20 border border-primary/30 mb-4">
            <span className="font-medium text-sm">Ton score :</span>
            <span className="text-2xl font-bold text-primary">{score}</span>
            <span className="text-muted-foreground">/10</span>
          </div>
        )}

        <p className="text-muted-foreground mb-4">
          {hasStockLeft 
            ? "Pas de chance cette fois-ci, mais tu as quand même un cadeau !"
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
      </motion.div>

      {/* Secret Menu Unlock - BONUS for participants */}
      {secretCode && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="card-glow border-2 border-dashed border-caramel/40 text-center"
        >
          <div className="flex items-center justify-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-caramel" />
            <span className="font-display font-bold">Cadeau de consolation</span>
          </div>
          
          <p className="text-sm text-muted-foreground mb-4">
            Même sans gagner, tu débloques l'accès au Menu Secret de la semaine !
          </p>

          {!accessGranted ? (
            <>
              <div className="p-4 rounded-xl bg-caramel/10 mb-4">
                <p className="text-xs text-muted-foreground mb-1">Ton code secret</p>
                <p className="font-mono text-2xl font-bold text-caramel tracking-wider">
                  {secretCode}
                </p>
              </div>

              <Button 
                onClick={handleUnlockMenu}
                className="w-full btn-hero"
              >
                <Lock className="w-5 h-5 mr-2" />
                Débloquer le Menu Secret
              </Button>
            </>
          ) : (
            <>
              <div className="p-4 rounded-xl bg-herb/10 border border-herb/30 mb-4">
                <p className="text-herb font-semibold">✓ Accès débloqué !</p>
              </div>

              <a href="/carte" className="block">
                <Button className="w-full btn-hero">
                  <Sparkles className="w-5 h-5 mr-2" />
                  Découvrir le Menu Secret
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
              </a>
            </>
          )}
        </motion.div>
      )}

      {/* Replay button */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <Button 
          onClick={onPlayAgain} 
          variant="outline"
          className="w-full py-6"
          disabled={!hasStockLeft}
        >
          <RefreshCw className="w-5 h-5 mr-2" />
          {hasStockLeft ? 'Rejouer pour tenter de gagner' : 'Lots épuisés'}
        </Button>
      </motion.div>

      {/* Google Review CTA */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.85 }}
        className="card-warm text-center"
      >
        <p className="text-sm text-muted-foreground mb-3">Votre avis compte pour nous !</p>
        <a
          href="https://g.page/r/CVTqauGmET0TEAE/preview"
          target="_blank"
          rel="noopener noreferrer"
        >
          <button className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-50 border border-yellow-200 text-sm font-medium hover:bg-yellow-100 transition-colors">
            ⭐ Laisser un avis Google
          </button>
        </a>
        <p className="text-xs text-muted-foreground mt-2">
          Merci, ça aide énormément une petite crêperie locale. 💛
        </p>
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
