import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Ban, CheckCircle, ChevronDown, ChevronUp, Clock, Download, Eye, EyeOff, Gift, Loader2, RefreshCw, Search, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

type Participation = {
  id: string;
  created_at: string;
  first_name: string;
  email: string;
  phone: string;
  score: number;
  total_questions: number;
  prize_won: string | null;
  prize_code: string | null;
  prize_claimed: boolean;
  claimed_at: string | null;
  status: string;
  week_start?: string;
};

type WeekFilter = "all" | "winners" | "claimed" | "invalidated" | "lost";

type WeekStats = {
  week_start: string;
  total: number;
  winners: number;
  claimed: number;
  invalidated: number;
  lost: number;
};

const getWeekStartKey = (isoDate: string) => {
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return "unknown";
  const diffToMonday = (d.getDay() + 6) % 7;
  const monday = new Date(d);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(d.getDate() - diffToMonday);
  return monday.toISOString().slice(0, 10);
};

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

const getPrizeLabel = (prize: string | null) => {
  if (!prize) return "Aucun gain";
  if (prize === "formule_complete") return "Formule complète";
  if (prize === "galette") return "Galette";
  if (prize === "crepe") return "Crêpe";
  return prize;
};

const maskEmail = (email = "") => {
  const [local, domain] = email.split("@");
  if (!domain) return "Email masqué";
  return `${local.slice(0, 2)}***@${domain}`;
};

const maskPhone = (phone = "") => (phone.length < 6 ? "Téléphone masqué" : `${phone.slice(0, 2)}****${phone.slice(-2)}`);

const getStatus = (p: Participation) => {
  if (p.status === "invalidated") return { label: "Invalidé", tone: "destructive" as const, icon: Ban };
  if (p.prize_claimed) return { label: "Réclamé", tone: "claimed" as const, icon: CheckCircle };
  if (p.prize_won) return { label: "Gagnant", tone: "winner" as const, icon: Gift };
  return { label: "Perdu", tone: "lost" as const, icon: Clock };
};

const QuizParticipationsPanel = ({ adminPassword }: { adminPassword: string }) => {
  const [participations, setParticipations] = useState<Participation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSensitiveData, setShowSensitiveData] = useState(false);
  const [expandedWeek, setExpandedWeek] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [weekFilter, setWeekFilter] = useState<WeekFilter>("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const currentWeekKey = useMemo(() => getWeekStartKey(new Date().toISOString()), []);

  const fetchParticipations = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/admin-scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "list_participations", adminPassword }),
      });
      if (response.ok) {
        const data = await response.json();
        setParticipations(data.participations || []);
      }
    } catch (error) {
      console.error("Error fetching participations:", error);
    } finally {
      setIsLoading(false);
    }
  }, [adminPassword]);

  useEffect(() => {
    void fetchParticipations();
  }, [fetchParticipations]);

  const normalizedParticipations = useMemo(
    () => participations.map((p) => ({ ...p, week_start: p.week_start || getWeekStartKey(p.created_at) })),
    [participations],
  );

  const weekStats = useMemo(() => {
    const map = new Map<string, WeekStats>();
    normalizedParticipations.forEach((p) => {
      const key = p.week_start || "unknown";
      const current = map.get(key) || { week_start: key, total: 0, winners: 0, claimed: 0, invalidated: 0, lost: 0 };
      current.total += 1;
      if (p.status === "invalidated") current.invalidated += 1;
      else if (p.prize_won) current.winners += 1;
      else current.lost += 1;
      if (p.status !== "invalidated" && p.prize_claimed) current.claimed += 1;
      map.set(key, current);
    });
    return Array.from(map.values()).sort((a, b) => (a.week_start < b.week_start ? 1 : -1));
  }, [normalizedParticipations]);

  useEffect(() => {
    if (expandedWeek || weekStats.length === 0) return;
    setExpandedWeek(weekStats.some((w) => w.week_start === currentWeekKey) ? currentWeekKey : weekStats[0].week_start);
  }, [currentWeekKey, expandedWeek, weekStats]);

  const selectedWeek = weekStats.find((week) => week.week_start === expandedWeek) || weekStats[0];

  const filteredItems = useMemo(() => {
    let items = normalizedParticipations.filter((p) => p.week_start === selectedWeek?.week_start);
    if (weekFilter === "winners") items = items.filter((p) => p.status !== "invalidated" && Boolean(p.prize_won));
    if (weekFilter === "claimed") items = items.filter((p) => p.status !== "invalidated" && Boolean(p.prize_claimed));
    if (weekFilter === "invalidated") items = items.filter((p) => p.status === "invalidated");
    if (weekFilter === "lost") items = items.filter((p) => p.status !== "invalidated" && !p.prize_won);

    const query = searchQuery.trim().toLowerCase();
    if (query) {
      items = items.filter((p) => [p.first_name, p.email, p.phone, p.prize_code].filter(Boolean).join(" ").toLowerCase().includes(query));
    }
    return items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [normalizedParticipations, searchQuery, selectedWeek?.week_start, weekFilter]);

  const handleMarkClaimed = async (participationId: string, prizeCode: string) => {
    setActionLoading(participationId);
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/admin-scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "claim", code: prizeCode, adminPassword }),
      });
      if (response.ok) {
        setParticipations((prev) => prev.map((p) => (p.id === participationId ? { ...p, prize_claimed: true, claimed_at: new Date().toISOString() } : p)));
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleInvalidate = async (participationId: string) => {
    setActionLoading(participationId);
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/admin-scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "invalidate", participationId, adminPassword }),
      });
      if (response.ok) setParticipations((prev) => prev.map((p) => (p.id === participationId ? { ...p, status: "invalidated" } : p)));
    } finally {
      setActionLoading(null);
    }
  };

  const exportCSV = () => {
    const headers = ["Date", "Prénom", "Email", "Téléphone", "Score", "Gain", "Code", "Statut"];
    const rows = filteredItems.map((p) => [formatDateTime(p.created_at), p.first_name, p.email, p.phone, `${p.score}/${p.total_questions}`, getPrizeLabel(p.prize_won), p.prize_code || "-", getStatus(p).label]);
    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `participations-quiz-${selectedWeek?.week_start || "semaine"}.csv`;
    link.click();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-caramel" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <section className="rounded-[1.75rem] border border-caramel/15 bg-gradient-to-br from-white via-butter/25 to-caramel/10 p-4 shadow-sm">
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-caramel">Participations</p>
              <h3 className="font-display text-2xl font-black text-espresso">Historique quiz</h3>
              <p className="mt-1 text-xs text-muted-foreground">{participations.length} participations enregistrées</p>
            </div>
            <Button variant="outline" size="icon" onClick={fetchParticipations} className="shrink-0 rounded-2xl">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <MiniStat label="Cette semaine" value={weekStats.find((w) => w.week_start === currentWeekKey)?.total || 0} />
            <MiniStat label="Gagnants" value={weekStats.find((w) => w.week_start === currentWeekKey)?.winners || 0} />
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Rechercher client, email, téléphone, code..." className="h-12 rounded-2xl pl-10" />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            <Button variant={showSensitiveData ? "default" : "outline"} size="sm" onClick={() => setShowSensitiveData(!showSensitiveData)} className="shrink-0 rounded-2xl">
              {showSensitiveData ? <Eye className="mr-1 h-4 w-4" /> : <EyeOff className="mr-1 h-4 w-4" />}
              Données complètes
            </Button>
            <Button variant="outline" size="sm" onClick={exportCSV} className="shrink-0 rounded-2xl">
              <Download className="mr-1 h-4 w-4" /> Export
            </Button>
          </div>
        </div>
      </section>

      <section className="rounded-[1.75rem] border border-border/60 bg-white/80 p-4 shadow-sm">
        <p className="mb-3 font-display text-xl font-black text-espresso">Semaines</p>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {weekStats.map((week) => (
            <button key={week.week_start} type="button" onClick={() => { setExpandedWeek(week.week_start); setExpandedId(null); }} className={`shrink-0 rounded-2xl border px-4 py-3 text-left transition ${selectedWeek?.week_start === week.week_start ? "border-caramel bg-caramel text-white" : "border-border bg-background/70 text-espresso"}`}>
              <span className="block text-xs font-bold uppercase tracking-wide opacity-70">{week.week_start === currentWeekKey ? "Semaine actuelle" : "Semaine"}</span>
              <span className="block font-display font-black">{formatDate(week.week_start)}</span>
              <span className="text-xs opacity-80">{week.total} participations</span>
            </button>
          ))}
        </div>
      </section>

      {selectedWeek && (
        <section className="rounded-[1.75rem] border border-border/60 bg-white/80 p-4 shadow-sm">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-caramel">{formatDate(selectedWeek.week_start)}</p>
              <h3 className="font-display text-xl font-black text-espresso">Détail semaine</h3>
            </div>
            <Badge variant="outline" className="rounded-full">{filteredItems.length} affichés</Badge>
          </div>

          <div className="mb-4 grid grid-cols-4 gap-2">
            <WeekMetric label="Total" value={selectedWeek.total} />
            <WeekMetric label="Gagnés" value={selectedWeek.winners} />
            <WeekMetric label="Utilisés" value={selectedWeek.claimed} />
            <WeekMetric label="Perdus" value={selectedWeek.lost} />
          </div>

          <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
            {([
              ["all", "Tous"],
              ["winners", "Gagnants"],
              ["claimed", "Réclamés"],
              ["invalidated", "Invalidés"],
              ["lost", "Perdus"],
            ] as [WeekFilter, string][]).map(([value, label]) => (
              <Button key={value} size="sm" variant={weekFilter === value ? "default" : "outline"} onClick={() => setWeekFilter(value)} className="shrink-0 rounded-2xl">
                {label}
              </Button>
            ))}
          </div>

          <div className="space-y-2">
            {filteredItems.length === 0 ? (
              <div className="rounded-2xl bg-background/70 p-6 text-center text-sm text-muted-foreground">Aucune participation pour ce filtre.</div>
            ) : (
              filteredItems.map((item) => (
                <ParticipationRow key={item.id} item={item} isOpen={expandedId === item.id} showSensitiveData={showSensitiveData} actionLoading={actionLoading === item.id} onToggle={() => setExpandedId(expandedId === item.id ? null : item.id)} onClaim={() => item.prize_code && handleMarkClaimed(item.id, item.prize_code)} onInvalidate={() => handleInvalidate(item.id)} />
              ))
            )}
          </div>
        </section>
      )}
    </motion.div>
  );
};

const MiniStat = ({ label, value }: { label: string; value: number }) => (
  <div className="rounded-3xl border border-caramel/15 bg-white/75 p-3 text-center">
    <p className="font-display text-xl font-black text-espresso">{value}</p>
    <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
  </div>
);

const WeekMetric = ({ label, value }: { label: string; value: number }) => (
  <div className="rounded-2xl bg-background/70 p-2 text-center">
    <p className="font-display text-lg font-black text-espresso">{value}</p>
    <p className="text-[9px] font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
  </div>
);

const StatusBadge = ({ participation }: { participation: Participation }) => {
  const status = getStatus(participation);
  const Icon = status.icon;
  const className = status.tone === "winner" ? "bg-caramel/10 text-caramel border-caramel/20" : status.tone === "claimed" ? "bg-herb/10 text-herb border-herb/20" : "";
  return (
    <Badge variant={status.tone === "destructive" ? "destructive" : "outline"} className={`gap-1 rounded-full ${className}`}>
      <Icon className="h-3 w-3" /> {status.label}
    </Badge>
  );
};

const ParticipationRow = ({ item, isOpen, showSensitiveData, actionLoading, onToggle, onClaim, onInvalidate }: { item: Participation; isOpen: boolean; showSensitiveData: boolean; actionLoading: boolean; onToggle: () => void; onClaim: () => void; onInvalidate: () => void }) => (
  <article className={`overflow-hidden rounded-2xl border border-border/55 bg-background/70 ${item.status === "invalidated" ? "opacity-60" : ""}`}>
    <button type="button" onClick={onToggle} className="w-full p-3 text-left">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-caramel/12 text-caramel">
          <Trophy className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate font-display text-base font-black text-espresso">{item.first_name || "Client"}</p>
            <span className="shrink-0 font-mono text-xs font-black text-caramel">{item.score}/{item.total_questions}</span>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span className="truncate text-xs text-muted-foreground">{formatDateTime(item.created_at)}</span>
            <StatusBadge participation={item} />
          </div>
        </div>
        {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </div>
    </button>

    {isOpen && (
      <div className="border-t border-border/50 p-3">
        <div className="grid grid-cols-1 gap-2 text-sm">
          <InfoLine label="Email" value={showSensitiveData ? item.email : maskEmail(item.email)} />
          <InfoLine label="Téléphone" value={showSensitiveData ? item.phone : maskPhone(item.phone)} />
          <InfoLine label="Gain" value={getPrizeLabel(item.prize_won)} />
          {item.prize_code && <InfoLine label="Code" value={item.prize_code} mono />}
        </div>

        {item.prize_won && item.status !== "invalidated" && (
          <div className="mt-3 flex gap-2">
            {!item.prize_claimed && item.prize_code && (
              <Button size="sm" className="flex-1 rounded-2xl" onClick={onClaim} disabled={actionLoading}>
                {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CheckCircle className="mr-1 h-4 w-4" /> Réclamé</>}
              </Button>
            )}
            <Button size="sm" variant="destructive" className="rounded-2xl" onClick={onInvalidate} disabled={actionLoading}>
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Ban className="mr-1 h-4 w-4" /> Invalider</>}
            </Button>
          </div>
        )}
      </div>
    )}
  </article>
);

const InfoLine = ({ label, value, mono }: { label: string; value: string; mono?: boolean }) => (
  <div className="rounded-xl bg-white/70 p-2">
    <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
    <p className={`truncate text-espresso ${mono ? "font-mono font-black" : "font-semibold"}`}>{value || "—"}</p>
  </div>
);

export default QuizParticipationsPanel;
