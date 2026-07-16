import { useCallback, useEffect, useState } from "react";
import { BarChart3, Gift, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import QuizStatsHero from "./QuizStatsHero";
import QuizParticipationsPanel from "./QuizParticipationsPanel";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

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

const QuizStatsPanel = ({ adminPassword }: { adminPassword: string }) => {
  const [activeTab, setActiveTab] = useState<"overview" | "participations">("participations");
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/admin-scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "stats", adminPassword }),
      });
      if (!response.ok) throw new Error("Statistiques indisponibles");
      setStats(await response.json());
    } catch (error) {
      console.error("Quiz stats fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [adminPassword]);

  useEffect(() => { void fetchStats(); }, [fetchStats]);

  if (isLoading && !stats) {
    return <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-caramel" /></div>;
  }

  return (
    <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "overview" | "participations")} className="space-y-3">
      <TabsList className="grid h-11 w-full grid-cols-2 rounded-2xl bg-muted/60 p-1">
        <TabsTrigger value="participations" className="gap-2 rounded-xl font-bold"><Gift className="h-4 w-4" />Participations</TabsTrigger>
        <TabsTrigger value="overview" className="gap-2 rounded-xl font-bold"><BarChart3 className="h-4 w-4" />Stocks & statistiques</TabsTrigger>
      </TabsList>
      <TabsContent value="participations" className="mt-0"><QuizParticipationsPanel adminPassword={adminPassword} /></TabsContent>
      <TabsContent value="overview" className="mt-0"><QuizStatsHero stats={stats} onRefresh={fetchStats} isLoading={isLoading} /></TabsContent>
    </Tabs>
  );
};

export default QuizStatsPanel;
