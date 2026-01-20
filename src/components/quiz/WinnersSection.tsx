import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import logo from '@/assets/logo.png';

interface Winner {
  id: string;
  first_name: string;
  prize_won: string;
  created_at: string;
}

const getPrizeLabel = (prize: string) => {
  switch (prize) {
    case 'formule_complete':
      return 'Formule Complète';
    case 'galette':
      return 'Une Galette';
    case 'crepe':
      return 'Une Crêpe';
    default:
      return prize;
  }
};

const getPrizeEmoji = (prize: string) => {
  switch (prize) {
    case 'formule_complete':
      return '🏆';
    case 'galette':
      return '🥈';
    case 'crepe':
      return '🥉';
    default:
      return '🎁';
  }
};

const WinnersSection = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  const { data: winners, isLoading } = useQuery({
    queryKey: ['quiz-winners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quiz_participations')
        .select('id, first_name, prize_won, created_at')
        .not('prize_won', 'is', null)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data as Winner[];
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  if (!winners || winners.length === 0) {
    return null;
  }

  // Top winner (most recent formule_complete, or just most recent)
  const topWinner = winners.find(w => w.prize_won === 'formule_complete') || winners[0];
  const otherWinners = winners.filter(w => w.id !== topWinner.id);

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-display font-semibold flex items-center gap-2">
        🎉 Derniers gagnants
      </h2>

      {/* Top Winner - Always visible */}
      <div className="rounded-xl bg-gradient-to-r from-caramel/20 to-butter/20 border border-caramel/30 p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-caramel/50 flex-shrink-0">
            <img src={logo} alt="CDS" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-display font-semibold truncate">
                {topWinner.first_name}
              </span>
              {topWinner.prize_won === 'formule_complete' && (
                <span className="text-lg">🎉</span>
              )}
            </div>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
              <span>{getPrizeEmoji(topWinner.prize_won)}</span>
              <span>{getPrizeLabel(topWinner.prize_won)}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Other Winners - Collapsible */}
      {otherWinners.length > 0 && (
        <div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-secondary/50 border border-border/50 text-sm font-medium hover:bg-secondary/70 transition-colors"
          >
            <span>Voir les autres gagnants ({otherWinners.length})</span>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="mt-2 space-y-2">
                  {otherWinners.map((winner) => (
                    <div
                      key={winner.id}
                      className="rounded-xl bg-white/5 border border-border/50 p-3 flex items-center gap-3"
                    >
                      <div className="w-8 h-8 rounded-full overflow-hidden border border-border/50 flex-shrink-0">
                        <img src={logo} alt="CDS" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate text-sm">
                            {winner.first_name}
                          </span>
                          {winner.prize_won === 'formule_complete' && (
                            <span>🎉</span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <span>{getPrizeEmoji(winner.prize_won)}</span>
                          <span>{getPrizeLabel(winner.prize_won)}</span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default WinnersSection;
