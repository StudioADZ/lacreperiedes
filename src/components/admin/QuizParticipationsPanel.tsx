import { useCallback, useEffect, useMemo, useState } from "react";
import { Ban, CheckCircle2, Download, Eye, EyeOff, Gift, Loader2, Mail, Phone, RefreshCw, Search, Trophy, UserRound, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

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
  rgpd_consent?: boolean | null;
};

type FilterKey = "all" | "winners" | "pending" | "claimed" | "lost" | "invalidated";

const formatDateTime = (value: string) => new Date(value).toLocaleString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
const prizeLabel = (value: string | null) => value === "formule_complete" ? "Formule complète" : value === "galette" ? "Galette" : value === "crepe" ? "Crêpe" : value || "Aucun gain";
const statusLabel = (item: Participation) => item.status === "invalidated" ? "Invalidé" : item.prize_claimed ? "Remis" : item.prize_won ? "À remettre" : "Perdu";
const maskEmail = (value: string) => value.includes("@") ? `${value.slice(0, 2)}***@${value.split("@")[1]}` : "—";
const maskPhone = (value: string) => value.length >= 6 ? `${value.slice(0, 2)}••••${value.slice(-2)}` : "—";

const QuizParticipationsPanel = ({ adminPassword }: { adminPassword: string }) => {
  const [items, setItems] = useState<Participation[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showSensitive, setShowSensitive] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/admin-scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "list_participations", adminPassword }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Chargement impossible");
      const sorted = [...(data.participations || [])].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setItems(sorted);
      setSelectedId((current) => current && sorted.some((item) => item.id === current) ? current : sorted[0]?.id || null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Chargement impossible");
    } finally {
      setLoading(false);
    }
  }, [adminPassword]);

  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return items.filter((item) => {
      const matchesSearch = !needle || [item.first_name, item.email, item.phone, item.prize_code].filter(Boolean).join(" ").toLowerCase().includes(needle);
      if (!matchesSearch) return false;
      if (filter === "winners") return item.status !== "invalidated" && Boolean(item.prize_won);
      if (filter === "pending") return item.status !== "invalidated" && Boolean(item.prize_won) && !item.prize_claimed;
      if (filter === "claimed") return item.status !== "invalidated" && item.prize_claimed;
      if (filter === "lost") return item.status !== "invalidated" && !item.prize_won;
      if (filter === "invalidated") return item.status === "invalidated";
      return true;
    });
  }, [items, query, filter]);

  const selected = items.find((item) => item.id === selectedId) || null;
  const winners = items.filter((item) => item.status !== "invalidated" && item.prize_won).length;
  const claimed = items.filter((item) => item.status !== "invalidated" && item.prize_claimed).length;
  const pending = items.filter((item) => item.status !== "invalidated" && item.prize_won && !item.prize_claimed).length;
  const average = items.length ? Math.round(items.reduce((sum, item) => sum + Number(item.score || 0), 0) / items.length) : 0;

  const markClaimed = async () => {
    if (!selected?.prize_code) return;
    setActionLoading(true);
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/admin-scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "claim", code: selected.prize_code, adminPassword }),
      });
      if (!response.ok) throw new Error("Validation impossible");
      setItems((current) => current.map((item) => item.id === selected.id ? { ...item, prize_claimed: true, claimed_at: new Date().toISOString() } : item));
      toast.success("Lot marqué comme remis");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Validation impossible");
    } finally {
      setActionLoading(false);
    }
  };

  const invalidate = async () => {
    if (!selected || !window.confirm("Invalider cette participation ?")) return;
    setActionLoading(true);
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/admin-scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "invalidate", participationId: selected.id, adminPassword }),
      });
      if (!response.ok) throw new Error("Invalidation impossible");
      setItems((current) => current.map((item) => item.id === selected.id ? { ...item, status: "invalidated" } : item));
      toast.success("Participation invalidée");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Invalidation impossible");
    } finally {
      setActionLoading(false);
    }
  };

  const exportCsv = () => {
    const headers = ["N°", "Date", "Prénom", "Email", "Téléphone", "Score", "Gain", "Code", "Statut", "RGPD"];
    const rows = filtered.map((item, index) => [index + 1, formatDateTime(item.created_at), item.first_name, item.email, item.phone, `${item.score}/${item.total_questions}`, prizeLabel(item.prize_won), item.prize_code || "", statusLabel(item), item.rgpd_consent ? "Oui" : "Non"]);
    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(";")).join("\n");
    const blob = new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `quiz-participations-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-caramel" /></div>;

  return <div className="space-y-3">
    <section className="grid grid-cols-5 gap-2">
      <Metric icon={UserRound} label="Participations" value={items.length} />
      <Metric icon={Trophy} label="Gagnants" value={winners} />
      <Metric icon={Gift} label="À remettre" value={pending} />
      <Metric icon={CheckCircle2} label="Lots remis" value={claimed} />
      <Metric icon={Trophy} label="Score moyen" value={average} />
    </section>

    <section className="rounded-3xl border border-caramel/15 bg-white p-3 shadow-sm">
      <div className="flex flex-col gap-2 xl:flex-row xl:items-center">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher nom, e-mail, téléphone ou code…" className="h-11 rounded-xl pl-10" /></div>
        <div className="flex flex-wrap gap-1.5">{([['all','Tous'],['winners','Gagnants'],['pending','À remettre'],['claimed','Remis'],['lost','Perdus'],['invalidated','Invalidés']] as const).map(([value, label]) => <button key={value} onClick={() => setFilter(value)} className={`rounded-xl px-3 py-2 text-xs font-black ${filter === value ? "bg-caramel text-white" : "bg-muted text-muted-foreground"}`}>{label}</button>)}</div>
        <div className="flex gap-1.5"><Button variant="outline" size="sm" onClick={() => setShowSensitive((value) => !value)} className="rounded-xl">{showSensitive ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}{showSensitive ? "Masquer" : "Afficher"}</Button><Button variant="outline" size="sm" onClick={load} className="rounded-xl"><RefreshCw className="h-4 w-4" /></Button><Button size="sm" onClick={exportCsv} className="rounded-xl bg-espresso text-white"><Download className="mr-2 h-4 w-4" />CSV</Button></div>
      </div>
    </section>

    <section className="grid min-h-[600px] overflow-hidden rounded-3xl border border-caramel/15 bg-white shadow-sm xl:grid-cols-[minmax(0,1.5fr)_minmax(330px,.5fr)]">
      <div className="min-w-0 overflow-auto border-b xl:border-b-0 xl:border-r">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="sticky top-0 z-10 bg-butter/80 text-[10px] uppercase tracking-wider text-muted-foreground backdrop-blur"><tr><th className="w-14 p-4">N°</th><th>Participant</th><th>Contact</th><th>Score</th><th>Gain</th><th>Statut</th><th>Date</th></tr></thead>
          <tbody>{filtered.length === 0 ? <tr><td colSpan={7} className="p-12 text-center text-muted-foreground">Aucune participation.</td></tr> : filtered.map((item, index) => <tr key={item.id} onClick={() => setSelectedId(item.id)} className={`cursor-pointer border-t hover:bg-butter/20 ${selectedId === item.id ? "bg-caramel/10" : ""}`}><td className="p-4 font-black">{index + 1}</td><td className="font-bold text-espresso">{item.first_name || "Sans nom"}</td><td><span className="block">{showSensitive ? item.phone || "—" : maskPhone(item.phone || "")}</span><span className="block text-xs text-muted-foreground">{showSensitive ? item.email || "—" : maskEmail(item.email || "")}</span></td><td className="font-black">{item.score}/{item.total_questions}</td><td>{prizeLabel(item.prize_won)}</td><td><Status item={item} /></td><td className="whitespace-nowrap text-xs">{formatDateTime(item.created_at)}</td></tr>)}</tbody>
        </table>
      </div>

      <aside className="min-w-0 bg-muted/10 p-4">{!selected ? <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Sélectionne une participation</div> : <div className="space-y-4"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-black uppercase text-caramel">Fiche participant</p><h3 className="font-display text-2xl font-black text-espresso">{selected.first_name || "Sans nom"}</h3><p className="text-xs text-muted-foreground">{formatDateTime(selected.created_at)}</p></div><button onClick={() => setSelectedId(null)} className="rounded-xl border p-2"><X className="h-4 w-4" /></button></div><div className="grid grid-cols-2 gap-2"><Detail label="Score" value={`${selected.score}/${selected.total_questions}`} /><Detail label="Statut" value={statusLabel(selected)} /></div><div className="rounded-2xl border bg-white p-3 text-sm"><p className="mb-2 text-xs font-black uppercase text-caramel">Coordonnées</p><p className="flex items-center gap-2"><Phone className="h-4 w-4 text-caramel" />{showSensitive ? selected.phone || "Non renseigné" : maskPhone(selected.phone || "")}</p><p className="mt-2 flex items-center gap-2"><Mail className="h-4 w-4 text-caramel" />{showSensitive ? selected.email || "Non renseigné" : maskEmail(selected.email || "")}</p></div><div className="rounded-2xl border bg-white p-3 text-sm"><p className="text-xs font-black uppercase text-caramel">Gain</p><p className="mt-2 font-display text-xl font-black text-espresso">{prizeLabel(selected.prize_won)}</p><p className="mt-1 font-mono text-sm">{selected.prize_code || "Aucun code"}</p><p className="mt-2 text-xs text-muted-foreground">Consentement RGPD : {selected.rgpd_consent ? "oui" : "non enregistré"}</p></div><div className="grid gap-2">{selected.prize_won && !selected.prize_claimed && selected.status !== "invalidated" && <Button onClick={markClaimed} disabled={actionLoading} className="rounded-xl bg-herb text-white"><CheckCircle2 className="mr-2 h-4 w-4" />Marquer le lot comme remis</Button>}{selected.status !== "invalidated" && <Button variant="outline" onClick={invalidate} disabled={actionLoading} className="rounded-xl border-destructive/30 text-destructive"><Ban className="mr-2 h-4 w-4" />Invalider la participation</Button>}</div></div>}</aside>
    </section>
  </div>;
};

const Metric = ({ icon: Icon, label, value }: { icon: typeof UserRound; label: string; value: number }) => <div className="flex min-w-0 items-center gap-2 rounded-xl border border-caramel/15 bg-white px-2.5 py-2 shadow-sm"><Icon className="h-4 w-4 shrink-0 text-caramel" /><div className="min-w-0"><p className="font-display text-lg font-black leading-none text-espresso">{value}</p><p className="truncate text-[9px] font-black uppercase tracking-wide text-muted-foreground">{label}</p></div></div>;
const Detail = ({ label, value }: { label: string; value: string }) => <div className="rounded-2xl border bg-white p-3 text-center"><p className="font-display text-lg font-black text-espresso">{value}</p><p className="text-[10px] font-bold uppercase text-muted-foreground">{label}</p></div>;
const Status = ({ item }: { item: Participation }) => <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black ${item.status === "invalidated" ? "bg-destructive/10 text-destructive" : item.prize_claimed ? "bg-herb/15 text-herb" : item.prize_won ? "bg-caramel/15 text-caramel" : "bg-muted text-muted-foreground"}`}>{statusLabel(item)}</span>;

export default QuizParticipationsPanel;
