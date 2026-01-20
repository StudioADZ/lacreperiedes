import { motion } from 'framer-motion';
import { Calendar, Trophy, Gift, CheckCircle, TrendingUp, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

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

interface QuizStatsHeroProps {
  stats: Stats | null;
  onRefresh: () => void;
  isLoading?: boolean;
}

const QuizStatsHero = ({ stats, onRefresh, isLoading }: QuizStatsHeroProps) => {
  if (!stats) {
    return (
      <div className="card-warm text-center py-8">
        <p className="text-muted-foreground">Chargement des stats...</p>
      </div>
    );
  }

  const claimRate = stats.totalWinners > 0 
    ? Math.round((stats.totalClaimed / stats.totalWinners) * 100) 
    : 0;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Week Header */}
      <div className="card-warm bg-gradient-to-br from-primary/5 to-caramel/10 border-primary/20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            <span className="font-display font-bold text-lg">Semaine en cours</span>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onRefresh}
            disabled={isLoading}
            className="gap-1"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="text-xs">Actualiser</span>
          </Button>
        </div>
        
        <p className="text-center text-lg font-medium mb-4">
          {new Date(stats.weekStart).toLocaleDateString('fr-FR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          })}
        </p>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center p-3 rounded-xl bg-background/50">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp className="w-4 h-4 text-primary" />
            </div>
            <p className="text-2xl font-bold text-primary">{stats.totalParticipations}</p>
            <p className="text-[10px] text-muted-foreground">Participations</p>
          </div>
          
          <div className="text-center p-3 rounded-xl bg-background/50">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Trophy className="w-4 h-4 text-caramel" />
            </div>
            <p className="text-2xl font-bold text-caramel">{stats.totalWinners}</p>
            <p className="text-[10px] text-muted-foreground">Gagnants</p>
          </div>
          
          <div className="text-center p-3 rounded-xl bg-background/50">
            <div className="flex items-center justify-center gap-1 mb-1">
              <CheckCircle className="w-4 h-4 text-herb" />
            </div>
            <p className="text-2xl font-bold text-herb">{stats.totalClaimed}</p>
            <p className="text-[10px] text-muted-foreground">Réclamés</p>
          </div>
          
          <div className="text-center p-3 rounded-xl bg-background/50">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Gift className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold">{claimRate}%</p>
            <p className="text-[10px] text-muted-foreground">Taux claim</p>
          </div>
        </div>
      </div>

      {/* Stock Table */}
      {stats.stock && (
        <div className="card-warm">
          <h3 className="font-display font-semibold mb-3 flex items-center gap-2">
            <Gift className="w-4 h-4 text-caramel" />
            Stocks restants
          </h3>
          
          <div className="overflow-hidden rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left py-2 px-3 font-medium">Lot</th>
                  <th className="text-center py-2 px-3 font-medium">Restant</th>
                  <th className="text-center py-2 px-3 font-medium">Total</th>
                  <th className="text-right py-2 px-3 font-medium">%</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-border">
                  <td className="py-2 px-3">🏆 Formules</td>
                  <td className="text-center py-2 px-3 font-bold text-herb">
                    {stats.stock.formule_complete_remaining}
                  </td>
                  <td className="text-center py-2 px-3 text-muted-foreground">
                    {stats.stock.formule_complete_total}
                  </td>
                  <td className="text-right py-2 px-3">
                    <span className={`font-medium ${stats.stock.formule_complete_remaining === 0 ? 'text-destructive' : 'text-herb'}`}>
                      {Math.round((stats.stock.formule_complete_remaining / stats.stock.formule_complete_total) * 100)}%
                    </span>
                  </td>
                </tr>
                <tr className="border-t border-border">
                  <td className="py-2 px-3">🥈 Galettes</td>
                  <td className="text-center py-2 px-3 font-bold text-herb">
                    {stats.stock.galette_remaining}
                  </td>
                  <td className="text-center py-2 px-3 text-muted-foreground">
                    {stats.stock.galette_total}
                  </td>
                  <td className="text-right py-2 px-3">
                    <span className={`font-medium ${stats.stock.galette_remaining === 0 ? 'text-destructive' : 'text-herb'}`}>
                      {Math.round((stats.stock.galette_remaining / stats.stock.galette_total) * 100)}%
                    </span>
                  </td>
                </tr>
                <tr className="border-t border-border">
                  <td className="py-2 px-3">🥉 Crêpes</td>
                  <td className="text-center py-2 px-3 font-bold text-herb">
                    {stats.stock.crepe_remaining}
                  </td>
                  <td className="text-center py-2 px-3 text-muted-foreground">
                    {stats.stock.crepe_total}
                  </td>
                  <td className="text-right py-2 px-3">
                    <span className={`font-medium ${stats.stock.crepe_remaining === 0 ? 'text-destructive' : 'text-herb'}`}>
                      {Math.round((stats.stock.crepe_remaining / stats.stock.crepe_total) * 100)}%
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default QuizStatsHero;
