import { CheckCircle, Gift, RefreshCw, Trophy, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

type Stats = {
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
};

const percent = (remaining: number, total: number) => total > 0 ? Math.round((remaining / total) * 100) : 0;

const QuizStatsHero = ({ stats, onRefresh, isLoading }: { stats: Stats | null; onRefresh: () => void; isLoading?: boolean }) => {
  if (!stats) return <div className="rounded-2xl border bg-white p-8 text-center text-sm text-muted-foreground">Statistiques indisponibles.</div>;
  const pending = Math.max(stats.totalWinners - stats.totalClaimed, 0);
  const winRate = stats.totalParticipations > 0 ? Math.round((stats.totalWinners / stats.totalParticipations) * 100) : 0;
  const stockRows = [
    ["Formules complètes", stats.stock?.formule_complete_remaining || 0, stats.stock?.formule_complete_total || 0],
    ["Galettes", stats.stock?.galette_remaining || 0, stats.stock?.galette_total || 0],
    ["Crêpes", stats.stock?.crepe_remaining || 0, stats.stock?.crepe_total || 0],
  ] as const;

  return <div className="space-y-3">
    <section className="grid grid-cols-4 gap-2">
      <Metric icon={Users} label="Participations" value={stats.totalParticipations} />
      <Metric icon={Trophy} label="Gagnants" value={stats.totalWinners} />
      <Metric icon={CheckCircle} label="Lots remis" value={stats.totalClaimed} />
      <Metric icon={Gift} label="En attente" value={pending} />
    </section>
    <section className="overflow-hidden rounded-3xl border border-caramel/15 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div><h2 className="font-display text-lg font-black text-espresso">Stocks du quiz</h2><p className="text-xs text-muted-foreground">Taux de gagnants : {winRate}%</p></div>
        <Button variant="outline" size="sm" onClick={onRefresh} disabled={isLoading} className="rounded-xl"><RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />Actualiser</Button>
      </div>
      <table className="w-full text-sm">
        <thead className="bg-butter/40 text-[10px] uppercase tracking-wider text-muted-foreground"><tr><th className="px-4 py-3 text-left">Lot</th><th className="text-center">Restant</th><th className="text-center">Total</th><th className="px-4 text-right">Disponible</th></tr></thead>
        <tbody>{stockRows.map(([label, remaining, total]) => <tr key={label} className="border-t"><td className="px-4 py-3 font-bold text-espresso">{label}</td><td className="text-center font-black">{remaining}</td><td className="text-center text-muted-foreground">{total}</td><td className={`px-4 text-right font-black ${remaining === 0 ? "text-destructive" : "text-herb"}`}>{percent(remaining, total)}%</td></tr>)}</tbody>
      </table>
    </section>
  </div>;
};

const Metric = ({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: number }) => <div className="flex min-w-0 items-center gap-2 rounded-xl border border-caramel/15 bg-white px-2.5 py-2 shadow-sm"><Icon className="h-4 w-4 shrink-0 text-caramel" /><div className="min-w-0"><p className="font-display text-lg font-black leading-none text-espresso">{value}</p><p className="truncate text-[9px] font-black uppercase tracking-wide text-muted-foreground">{label}</p></div></div>;

export default QuizStatsHero;
