import {
  ArrowRight,
  CheckCircle,
  Database,
  Gift,
  Mail,
  RefreshCw,
  ShieldCheck,
  Target,
  TicketCheck,
  Trophy,
  Users,
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

const percentage = (value: number, total: number) => total > 0 ? Math.round((value / total) * 100) : 0;

const AdminKPIDashboard = ({ stats, isLoading, error, onRefresh, onNavigate }: Props) => {
  const participations = stats?.totalParticipations ?? 0;
  const winners = stats?.totalWinners ?? 0;
  const claimed = stats?.totalClaimed ?? 0;
  const remaining = Math.max(winners - claimed, 0);
  const winnerRate = percentage(winners, participations);
  const claimRate = percentage(claimed, winners);
  const weekLabel = stats?.weekStart
    ? new Date(`${stats.weekStart}T12:00:00`).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })
    : "semaine en cours";

  const kpis: { label: string; value: number | string; detail: string; progress: number; icon: LucideIcon; status: string }[] = [
    { label: "Participations", value: participations, detail: `Depuis le ${weekLabel}`, progress: participations > 0 ? 100 : 0, icon: Users, status: "Volume" },
    { label: "Taux de gagnants", value: `${winnerRate}%`, detail: `${winners} gagnant${winners > 1 ? "s" : ""} sur ${participations}`, progress: winnerRate, icon: Trophy, status: "Conversion" },
    { label: "Taux d’utilisation", value: `${claimRate}%`, detail: `${claimed} gain${claimed > 1 ? "s" : ""} validé${claimed > 1 ? "s" : ""}`, progress: claimRate, icon: CheckCircle, status: "Caisse" },
    { label: "Gains à utiliser", value: remaining, detail: remaining > 0 ? "Action caisse requise" : "Aucun gain en attente", progress: winners > 0 ? percentage(remaining, winners) : 0, icon: Gift, status: remaining > 0 ? "À traiter" : "À jour" },
  ];

  const quickActions: { tab: AdminTab; label: string; description: string; icon: LucideIcon }[] = [
    { tab: "scan", label: "Valider un gain", description: "Contrôler un code client", icon: TicketCheck },
    { tab: "messages", label: "Voir les messages", description: "Traiter les demandes", icon: Mail },
    { tab: "clients", label: "Ouvrir les clients", description: "Consulter les profils", icon: Database },
    { tab: "carte", label: "Menu secret", description: "Préparer la semaine", icon: UtensilsCrossed },
  ];

  return (
    <div className="space-y-5">
      <section className="rounded-3xl bg-gradient-to-br from-espresso via-[#2b1811] to-caramel p-5 text-white shadow-elevated">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em]">
              <Target className="h-3.5 w-3.5 text-butter" /> KPI de la semaine
            </div>
            <h3 className="font-display text-2xl font-black">Performance opérationnelle</h3>
            <p className="mt-1 text-sm text-white/65">Lecture immédiate des résultats et des priorités caisse.</p>
          </div>
          <Button type="button" variant="outline" onClick={onRefresh} disabled={isLoading} className="border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white">
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} /> Actualiser
          </Button>
        </div>
      </section>

      {error && <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-sm font-semibold text-destructive">{error}</div>}

      <section className="grid gap-3 sm:grid-cols-2">
        {kpis.map(({ label, value, detail, progress, icon: Icon, status }) => (
          <article key={label} className="rounded-3xl border border-caramel/15 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-caramel/10 text-caramel"><Icon className="h-5 w-5" /></div>
              <span className="rounded-full bg-muted px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-muted-foreground">{status}</span>
            </div>
            <p className="mt-5 font-display text-4xl font-black leading-none text-espresso">{isLoading && !stats ? "—" : value}</p>
            <p className="mt-2 text-sm font-black text-espresso">{label}</p>
            <p className="mt-1 min-h-4 text-xs text-muted-foreground">{detail}</p>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-caramel transition-all duration-500" style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }} />
            </div>
          </article>
        ))}
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-3xl border border-caramel/15 bg-gradient-to-br from-butter/35 to-white p-5">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-caramel">Priorité opérationnelle</p>
          <p className="mt-2 font-display text-xl font-black text-espresso">{remaining > 0 ? `${remaining} gain${remaining > 1 ? "s" : ""} à contrôler` : "Caisse à jour"}</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{remaining > 0 ? "Les gains actifs doivent être utilisés avant leur date d’expiration." : "Aucun gain gagné cette semaine n’attend de validation."}</p>
          <Button type="button" onClick={() => onNavigate("scan")} className="mt-4 w-full rounded-2xl bg-caramel font-black text-white">Ouvrir la validation <ArrowRight className="ml-2 h-4 w-4" /></Button>
        </div>
        <div className="rounded-3xl border border-herb/20 bg-herb/10 p-5">
          <div className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-herb" /><p className="text-sm font-black text-espresso">Données fiables</p></div>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">Les KPI sont calculés uniquement à partir des participations, gagnants et gains validés enregistrés dans la base.</p>
          <div className="mt-4 flex items-end justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.14em] text-muted-foreground">Période</p><p className="mt-1 text-sm font-black text-espresso">Depuis le {weekLabel}</p></div><CheckCircle className="h-7 w-7 text-herb" /></div>
        </div>
      </section>

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
