import {
  ArrowRight,
  CheckCircle,
  Database,
  Mail,
  RefreshCw,
  ShieldCheck,
  TicketCheck,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type DashboardStats = {
  weekStart: string | null;
  totalParticipations: number;
  totalWinners: number;
  totalClaimed: number;
};

type AdminTab = "dashboard" | "scan" | "messages" | "clients" | "quiz" | "carte" | "actus" | "payment" | "splash";

type Props = {
  stats: DashboardStats | null;
  isLoading: boolean;
  error: string;
  onRefresh: () => void;
  onNavigate: (tab: AdminTab) => void;
};

const AdminKPIDashboard = ({ stats, isLoading, error, onRefresh, onNavigate }: Props) => {
  const winners = stats?.totalWinners ?? 0;
  const claimed = stats?.totalClaimed ?? 0;
  const remaining = Math.max(winners - claimed, 0);
  const weekLabel = stats?.weekStart
    ? new Date(`${stats.weekStart}T12:00:00`).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })
    : "semaine en cours";

  const quickActions: { tab: AdminTab; label: string; description: string; icon: LucideIcon }[] = [
    { tab: "scan", label: "Valider un gain", description: "Contrôler un code client", icon: TicketCheck },
    { tab: "messages", label: "Voir les messages", description: "Traiter les demandes", icon: Mail },
    { tab: "clients", label: "Ouvrir les clients", description: "Consulter les profils", icon: Database },
    { tab: "carte", label: "Menu secret", description: "Préparer la semaine", icon: UtensilsCrossed },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-3xl border border-caramel/15 bg-gradient-to-br from-butter/30 via-white to-white p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-caramel">Synthèse opérationnelle</p>
          <h2 className="mt-1 font-display text-2xl font-black text-espresso">Priorités de la semaine</h2>
          <p className="mt-1 text-sm text-muted-foreground">Les KPI restent visibles dans le bandeau supérieur pendant toute la navigation.</p>
        </div>
        <Button type="button" variant="outline" onClick={onRefresh} disabled={isLoading} className="rounded-2xl">
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />Actualiser
        </Button>
      </div>

      {error && <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-sm font-semibold text-destructive">{error}</div>}

      <div className="grid gap-3 lg:grid-cols-2">
        <section className="rounded-3xl border border-caramel/15 bg-white p-5 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-caramel">Priorité caisse</p>
          <p className="mt-2 font-display text-2xl font-black text-espresso">{remaining > 0 ? `${remaining} gain${remaining > 1 ? "s" : ""} à contrôler` : "Caisse à jour"}</p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{remaining > 0 ? "Les gains actifs doivent être validés avant leur date d’expiration." : "Aucun gain gagné cette semaine n’attend de validation."}</p>
          <Button type="button" onClick={() => onNavigate("scan")} className="mt-5 w-full rounded-2xl bg-caramel font-black text-white">Ouvrir la validation <ArrowRight className="ml-2 h-4 w-4" /></Button>
        </section>

        <section className="rounded-3xl border border-herb/20 bg-herb/10 p-5">
          <div className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-herb" /><p className="text-sm font-black text-espresso">Données fiables</p></div>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Les indicateurs sont calculés uniquement à partir des participations, gagnants et gains validés enregistrés.</p>
          <div className="mt-5 flex items-end justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.14em] text-muted-foreground">Période analysée</p><p className="mt-1 font-display text-lg font-black text-espresso">Depuis le {weekLabel}</p></div><CheckCircle className="h-7 w-7 text-herb" /></div>
        </section>
      </div>

      <section>
        <div className="mb-3"><p className="text-[10px] font-black uppercase tracking-[0.18em] text-caramel">Actions rapides</p><h3 className="font-display text-xl font-black text-espresso">Pilotage quotidien</h3></div>
        <div className="grid gap-3 sm:grid-cols-2">
          {quickActions.map(({ tab, label, description, icon: Icon }) => (
            <button key={tab} type="button" onClick={() => onNavigate(tab)} className="group flex items-center gap-3 rounded-3xl border border-border/60 bg-background/75 p-4 text-left transition hover:border-caramel/35 hover:bg-white">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-caramel/10 text-caramel"><Icon className="h-5 w-5" /></div>
              <div className="min-w-0 flex-1"><p className="font-display font-black text-espresso">{label}</p><p className="text-xs text-muted-foreground">{description}</p></div>
              <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-caramel" />
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};

export default AdminKPIDashboard;
