import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import logo from '@/assets/logo.png';
import { useEffect } from 'react';

interface Winner {
  id: string;
  first_name: string;
  score: number;
  total_questions: number;
  prize_won: string;
  created_at: string;
}

const getPrizeLabel = (prize: string) => {
  switch (prize) {
    case 'formule_complete':
      return '🏆 1 Formule Complète';
    case 'galette':
      return '🥇 1 Galette offerte';
    case 'crepe':
      return '🥈 1 Crêpe offerte';
    default:
      return prize;
  }
};

const WinnersHero = () => {
  const queryClient = useQueryClient();

  const { data: winners, isLoading } = useQuery({
    queryKey: ['quiz-winners-hero'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quiz_participations')
        .select('id, first_name, score, total_questions, prize_won, created_at')
        .not('prize_won', 'is', null)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data as Winner[];
    },
    staleTime: 10000, // 10 seconds
  });

  // Realtime subscription for instant updates
  useEffect(() => {
    const channel = supabase
      .channel('winners-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'quiz_participations',
          filter: 'prize_won=neq.null'
        },
        () => {
          // Invalidate and refetch winners when new winner is added
          queryClient.invalidateQueries({ queryKey: ['quiz-winners-hero'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  if (!winners || winners.length === 0) {
    return (
      <div className="rounded-xl bg-secondary/30 border border-border/50 p-4 text-center">
        <div className="flex justify-center mb-2">
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-caramel/50">
            <img src={logo} alt="La Crêperie des Saveurs" className="w-full h-full object-cover" />
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          🎉 Les gagnants s'affichent ici dès les premières participations
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-display font-semibold flex items-center gap-2">
        🎉 Derniers gagnants
      </h2>

      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {winners.map((winner, index) => (
            <motion.div
              key={winner.id}
              initial={{ opacity: 0, x: -20, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.95 }}
              transition={{ delay: index * 0.05, type: "spring", stiffness: 200 }}
              layout
              className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-butter/20 to-caramel/10 border border-caramel/20"
            >
              {/* Shiny Logo */}
              <div className="relative flex-shrink-0">
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-caramel/50 shiny-logo">
                  <img 
                    src={logo} 
                    alt="La Crêperie des Saveurs" 
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* Shine overlay */}
                <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
                  <div className="shine-effect" />
                </div>
              </div>

              {/* Winner Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-display font-semibold truncate">
                    {winner.first_name}
                  </span>
                  <span className="text-xs font-mono bg-primary/10 text-primary px-2 py-0.5 rounded-full flex-shrink-0">
                    {winner.score}/{winner.total_questions}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  {getPrizeLabel(winner.prize_won)}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* CSS for shiny effect */}
      <style>{`
        .shiny-logo {
          position: relative;
          box-shadow: 0 0 15px rgba(218, 165, 32, 0.3);
        }
        
        .shine-effect {
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: linear-gradient(
            45deg,
            transparent 40%,
            rgba(255, 255, 255, 0.4) 50%,
            transparent 60%
          );
          animation: shine 3s ease-in-out infinite;
        }
        
        @keyframes shine {
          0%, 100% {
            transform: translateX(-100%) translateY(-100%) rotate(45deg);
          }
          50% {
            transform: translateX(100%) translateY(100%) rotate(45deg);
          }
        }
      `}</style>
    </div>
  );
};

export default WinnersHero;
