import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  CheckCircle,
  Gift,
  Mail,
  MessageCircleMore,
  Newspaper,
  RefreshCw,
  Sparkles,
  TicketCheck,
  Users,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type AdminTab = "dashboard" | "scan" | "messages" | "clients" | "quiz" | "carte" | "actus" | "payment" | "splash";

type DashboardStats = {
  weekStart: string | null;
  totalParticipations: number;
  totalWinners: number;
  totalClaimed: number;
  totalClients: number;
  reservationsToday: number;
  upcomingReservations: number;
  unreadMessages: number;
  visibleSocialPosts: number;
  totalSocialInteractions: number;
  secretMenuActive: boolean;
  secretMenuName: string | null;
  secretMenuValidTo: string | null;
  publicMenuActive: boolean;
  splashActive: boolean;
  stock: {
    galetteRemaining: number;
    galetteTotal: number;
    crepeRemaining: number;
    crepeTotal: number;
    formuleRemaining: number;
    formuleTotal: number;
  } | null;
};

type Props = {
  stats: DashboardStats | null;
  isLoading: boolean;
  error: string;
  onRefresh: () => void;
  onNavigate: (tab: AdminTab) => void;
};

type Metric = {
  label: string;
  value: number | string;
  detail: string;
  icon: LucideIcon;
  tab: AdminTab;
  alert?: boolean;
};

const percentage = (value: number, total: number) => total > 0 ? Math.round((value / total) * 100) : 0;
const stockRate = (remaining: number, total: number) => total > 0 ? Math.round((remaining / total) * 100) : 0;

const StatusLine = ({ active, label, detail, onClick }: { active: boolean; label: string; detail: string; onClick: () => void }) => (
  <button type="button" onClick={onClick} className="flex w-full items-center justify-between gap-3 rounded-2xl border border-border/60 bg-background/70 p-3 text-left transition hover:border-caramel/30 hover:bg-white">
    <div className="min-w-0"><p className="text-sm font-black text-espresso">{label}</p><p className="truncate text-xs text-muted-foreground">{detail}</p></div>
    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${active ? "bg-herb/12 text-herb" : "bg-muted text-muted-foreground"}`}>{active ? "Actif" : "À vérifier"}</span>
  </button>
);

const AdminKPIDashboard = ({ stats, isLoading, error, onRefresh, onNavigate }: Props) => {
  const participations = stats?.totalParticipations ?? 0;
  const winners = stats?.totalWinners ?? 0;
  const claimed = stats?.totalClaimed ?? 0;
  const remainingPrizes = Math.max(winners - claimed, 0);
  const winnerRate = percentage(winners, participations);
  const claimRate = percentage(claimed, winners);
  const weekLabel = stats?.weekStart
    ? new Date(`${stats.weekStart}T12:00:00`).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })
    : "semaine en cours";

  const metrics: Metric[] = [
    { label: "Réservations aujourd’hui", value: stats?.reservationsToday ?? 0, detail: `${stats?.upcomingReservations ?? 0} réservation(s) à venir`, icon: CalendarDays, tab: "clients" },
    { label: "Clients enregistrés", value: stats?.totalClients ?? 0, detail: "Profils disponibles dans le CRM", icon: Users, tab: "clients" },
    { label: "Messages non lus", value: stats?.unreadMessages ?? 0, detail: "Demandes à traiter", icon: Mail, tab: "messages", alert: (stats?.unreadMessages ?? 0) > 0 },
    { label: "Gains à valider", value: remainingPrizes, detail: `${claimRate}% des gains déjà utilisés`, icon: TicketCheck, tab: "scan", alert: remainingPrizes > 0 },
    { label: "Participations quiz", value: participations, detail: `${winnerRate}% de gagnants depuis le ${weekLabel}`, icon: BarChart3, tab: "quiz" },
    { label: "Publications visibles", value: stats?.visibleSocialPosts ?? 0, detail: `${stats?.totalSocialInteractions ?? 0} interaction(s) enregistrée(s)`, icon: Newspaper, tab: "actus" },
  ];

  const stock = stats?.stock;
  const stockRows = stock ? [
    { label: "Galettes", remaining: stock.galetteRemaining, total: stock.galetteTotal },
    { label: "Crêpes", remaining: stock.crepeRemaining, total: stock.crepeTotal },
    { label: "Formules complètes", remaining: stock.formuleRemaining, total: stock.formuleTotal },
  ] : [];

  const priorities = [
    (stats?.unreadMessages ?? 0) > 0 ? { label: `${stats?.unreadMessages} message(s) non lu(s)`, tab: "messages" as AdminTab, icon: MessageCircleMore } : null,
    remainingPrizes > 0 ? { label: `${remainingPrizes} gain(s) à valider`, tab: "scan" as AdminTab, icon: Gift } : null,
    !stats?.secretMenuActive ? { label: "Menu secret à vérifier", tab: "carte" as AdminTab, icon: UtensilsCrossed } : null,
    !stats?.splashActive ? { label: "Écran d’accueil inactif", tab: "splash" as AdminTab, icon: Sparkles } : null,
  ].filter(Boolean) as { label: string; tab: AdminTab; icon: LucideIcon }[];

  return (
    <div className="space-y-5">
      <section className="flex flex-col gap-3 rounded-3xl border border-caramel/15 bg-gradient-to-br from-butter/30 via-white to-white p-5 sm:flex-row sm:items-center sm:justify-between">
        <div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-caramel">Vue globale</p><h2 className="mt-1 font-display text-2xl font-black text-espresso">Toute l’activité en un coup d’œil</h2><p className="mt-1 text-sm text-muted-foreground">Indicateurs de décision uniquement. Les détails restent dans chaque rubrique.</p></div>
        <Button type="button" variant="outline" onClick={onRefresh} disabled={isLoading} className="rounded-2xl"><RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />Actualiser</Button>
      </section>

      {error && <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-sm font-semibold text-destructive">{error}</div>}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {metrics.map(({ label, value, detail, icon: Icon, tab, alert }) => (
          <button key={label} type="button" onClick={() => onNavigate(tab)} className={`group rounded-3xl border p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${alert ? "border-caramel/35 bg-butter/25" : "border-border/60 bg-white"}`}>
            <div className="flex items-start justify-between gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-caramel/10 text-caramel"><Icon className="h-5 w-5" /></span><ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-caramel" /></div>
            <p className="mt-4 font-display text-3xl font-black text-espresso">{isLoading && !stats ? "—" : value}</p><p className="mt-1 text-sm font-black text-espresso">{label}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p>
          </button>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-3xl border border-border/60 bg-white p-5">
          <div className="mb-4 flex items-center justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-caramel">À traiter</p><h3 className="font-display text-xl font-black text-espresso">Priorités opérationnelles</h3></div><CheckCircle className={`h-6 w-6 ${priorities.length === 0 ? "text-herb" : "text-caramel"}`} /></div>
          {priorities.length === 0 ? <div className="rounded-2xl bg-herb/10 p-4 text-sm font-semibold text-herb">Aucune alerte prioritaire détectée.</div> : <div className="space-y-2">{priorities.map(({ label, tab, icon: Icon }) => <button key={label} type="button" onClick={() => onNavigate(tab)} className="flex w-full items-center gap-3 rounded-2xl border border-caramel/15 bg-butter/20 p-3 text-left hover:bg-butter/35"><Icon className="h-5 w-5 shrink-0 text-caramel" /><span className="flex-1 text-sm font-black text-espresso">{label}</span><ArrowRight className="h-4 w-4 text-muted-foreground" /></button>)}</div>}
        </div>

        <div className="rounded-3xl border border-border/60 bg-white p-5">
          <div className="mb-4"><p className="text-[10px] font-black uppercase tracking-[0.18em] text-caramel">Contenus actifs</p><h3 className="font-display text-xl font-black text-espresso">État de publication</h3></div>
          <div className="space-y-2">
            <StatusLine active={stats?.secretMenuActive === true} label="Menu secret" detail={stats?.secretMenuName || "Aucun menu actif détecté"} onClick={() => onNavigate("carte")} />
            <StatusLine active={stats?.publicMenuActive === true} label="Carte publique" detail="Menu visible sur le site" onClick={() => onNavigate("carte")} />
            <StatusLine active={stats?.splashActive === true} label="Écran d’accueil" detail="Animation d’arrivée du site" onClick={() => onNavigate("splash")} />
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-border/60 bg-white p-5">
        <div className="mb-4 flex items-center justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-caramel">Récompenses</p><h3 className="font-display text-xl font-black text-espresso">Stock de la semaine</h3></div><Button type="button" variant="ghost" size="sm" onClick={() => onNavigate("quiz")}>Voir le détail <ArrowRight className="ml-1 h-4 w-4" /></Button></div>
        {stockRows.length === 0 ? <p className="rounded-2xl bg-muted/40 p-4 text-sm text-muted-foreground">Aucun stock hebdomadaire disponible.</p> : <div className="grid gap-3 md:grid-cols-3">{stockRows.map(({ label, remaining, total }) => { const rate = stockRate(remaining, total); return <div key={label} className="rounded-2xl bg-background/75 p-4"><div className="flex items-center justify-between"><p className="text-sm font-black text-espresso">{label}</p><span className="text-xs font-bold text-muted-foreground">{remaining}/{total}</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-caramel" style={{ width: `${Math.min(rate, 100)}%` }} /></div><p className="mt-2 text-xs text-muted-foreground">{rate}% disponible</p></div>; })}</div>}
      </section>
    </div>
  );
};

export default AdminKPIDashboard;
