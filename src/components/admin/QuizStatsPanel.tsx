import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { BarChart3, Gift, Scan, Loader2 } from 'lucide-react';
import QuizStatsHero from './QuizStatsHero';
import QuizParticipationsPanel from './QuizParticipationsPanel';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

interface Stats {
  weekStart: string;
  stock: {
    formule_complete_remaining: number;
    formule_complete_total: number;
    galette_remaining: number;
    galette_total: number;
    crepe_remaining: number;
    crepe_total: number;
  };
  totalParticipations: number;
  totalWinners: number;
  totalClaimed: number;
}

interface QuizStatsPanelProps {
  adminPassword: string;
}

const QuizStatsPanel = ({ adminPassword }: QuizStatsPanelProps) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'participations'>('overview');
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/admin-scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stats', adminPassword }),
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Stats fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [adminPassword]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'overview' | 'participations')}>
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="overview" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            Vue d'ensemble
          </TabsTrigger>
          <TabsTrigger value="participations" className="gap-2">
            <Gift className="w-4 h-4" />
            Participations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <QuizStatsHero 
            stats={stats} 
            onRefresh={fetchStats}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="participations" className="mt-4">
          <QuizParticipationsPanel adminPassword={adminPassword} />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};

export default QuizStatsPanel;
