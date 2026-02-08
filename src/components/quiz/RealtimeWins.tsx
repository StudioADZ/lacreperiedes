import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import logo from '@/assets/logo.png';

interface RecentWin {
  id: string;
  first_name: string;
  prize_won: string;
  created_at: string;
}

const getPrizeEmoji = (prize: string): string => {
  switch (prize) {
    case 'formule_complete':
      return '🏆';
    case 'galette':
      return '🥞';
    case 'crepe':
      return '🥞';
    default:
      return '🎁';
  }
};

const getPrizeLabel = (prize: string): string => {
  switch (prize) {
    case 'formule_complete':
      return 'Formule Complète';
    case 'galette':
      return 'Galette offerte';
    case 'crepe':
      return 'Crêpe offerte';
    default:
      return prize;
  }
};

const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('fr-FR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

// RGPD compliant - only show first name or "Client"
const getDisplayName = (firstName: string | null): string => {
  if (!firstName || firstName.trim().length === 0) {
    return 'Client';
  }
  // Only show first name, capitalize first letter
  const name = firstName.trim().split(' ')[0];
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
};

const RealtimeWins = () => {
  const [recentWins, setRecentWins] = useState<RecentWin[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch initial data
  useEffect(() => {
    const fetchRecentWins = async () => {
      try {
        const { data, error } = await supabase
          .from('quiz_winners_public')
          .select('id, first_name, prize_won, created_at')
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(3);

        if (error) throw error;
        setRecentWins(data || []);
      } catch (err) {
        console.error('Error fetching recent wins:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecentWins();
  }, []);

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel('realtime-wins')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'quiz_participations',
          filter: 'prize_won=neq.null'
        },
        (payload) => {
          const newWin = payload.new as RecentWin;
          if (newWin.prize_won) {
            setRecentWins(prev => [newWin, ...prev.slice(0, 2)]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="py-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground animate-pulse">
          <div className="w-2 h-2 bg-herb rounded-full animate-ping" />
          <span>Chargement des gains...</span>
        </div>
      </div>
    );
  }

  if (recentWins.length === 0) {
    return (
      <div className="py-3 text-center">
        <p className="text-sm text-muted-foreground">
          🎯 Soyez le premier gagnant de la semaine !
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Live indicator */}
      <div className="flex items-center gap-2 mb-3">
        <div className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-herb opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-herb" />
        </div>
        <span className="text-xs font-medium text-herb uppercase tracking-wide">
          Gains en direct
        </span>
      </div>

      {/* Recent wins list */}
      <AnimatePresence mode="popLayout">
        {recentWins.map((win, index) => (
          <motion.div
            key={win.id}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ 
              delay: index * 0.1,
              type: 'spring',
              stiffness: 300,
              damping: 25
            }}
            className="flex items-center gap-3 p-2.5 rounded-xl bg-gradient-to-r from-butter/40 to-butter/20 border border-caramel/20"
          >
            {/* Logo */}
            <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-caramel/40 flex-shrink-0 shadow-sm">
              <img 
                src={logo} 
                alt="La Crêperie des Saveurs" 
                className="w-full h-full object-cover"
              />
            </div>

            {/* Prize emoji */}
            <span className="text-xl flex-shrink-0">
              {getPrizeEmoji(win.prize_won)}
            </span>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-display font-semibold text-sm truncate">
                  {getDisplayName(win.first_name)}
                </span>
                <span className="text-muted-foreground text-sm">—</span>
                <span className="text-sm text-foreground truncate">
                  {getPrizeLabel(win.prize_won)}
                </span>
              </div>
            </div>

            {/* Time */}
            <span className="text-xs font-mono text-muted-foreground flex-shrink-0">
              {formatTime(win.created_at)}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default RealtimeWins;
