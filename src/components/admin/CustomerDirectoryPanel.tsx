import { useEffect, useMemo, useState } from "react";
import {
  FileSpreadsheet,
  Gift,
  Loader2,
  Mail,
  Merge,
  Phone,
  Printer,
  RefreshCw,
  Search,
  Sparkles,
  Trophy,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
type FilterKey = "all" | "recent" | "vip" | "reward" | "inactive" | "consent";

type Activity = {
  type: string;
  date?: string;
  label?: string;
  details?: string | null;
  score?: number;
  totalQuestions?: number;
  prize?: string | null;
  claimed?: boolean;
};

type Customer = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  userId: string | null;
  loyaltyPoints: number;
  declaredVisits: number;
  effectiveVisits: number;
  quizParticipations: number;
  reservations: number;
  messages: number;
  secretAccesses: number;
  wins: number;
  activeRewards: number;
  totalInteractions: number;
  firstSeen: string;
  lastSeen: string;
  rgpdConsent: boolean;
  sources: string[];
  activity: Activity[];
};

type Meta = {
  uniqueCustomers: number;
  rawRecords: number;
  duplicateRecordsMerged: number;
  sourceCounts: Record<string, number>;
  fallbackMode?: boolean;
};

type LegacyParticipation = {
  id: string;
  created_at: string;
  first_name: string | null;
  email: string | null;
  phone: string | null;
  score: number | null;
  total_questions: number | null;
  prize_won: string | null;
  prize_claimed: boolean | null;
  status: string | null;
  rgpd_consent?: boolean | null;
};

const formatDate = (value?: string) => value ? new Date(value).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const formatDateTime = (value?: string) => value ? new Date(value).toLocaleString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";
const daysSince = (value: string) => Math.floor((Date.now() - new Date(value).getTime()) / 86400000);
const csvCell = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;
const normalizeEmail = (value: string | null) => value?.trim().toLowerCase() || "";
const normalizePhone = (value: string | null) => value?.replace(/\D/g, "") || "";

const legacyToCustomers = (rows: LegacyParticipation[]): { customers: Customer[]; meta: Meta } => {
  const map = new Map<string, Customer>();

  rows.forEach((row) => {
    const email = normalizeEmail(row.email);
    const phone = normalizePhone(row.phone);
    const key = email ? `email:${email}` : phone ? `phone:${phone}` : `row:${row.id}`;
    const name = row.first_name?.trim() || row.email || row.phone || "Client sans nom";
    const current = map.get(key) || {
      id: key,
      name,
      email: row.email || null,
      phone: row.phone || null,
      city: null,
      userId: null,
      loyaltyPoints: 0,
      declaredVisits: 0,
      effectiveVisits: 0,
      quizParticipations: 0,
      reservations: 0,
      messages: 0,
      secretAccesses: 0,
      wins: 0,
      activeRewards: 0,
      totalInteractions: 0,
      firstSeen: row.created_at,
      lastSeen: row.created_at,
      rgpdConsent: row.rgpd_consent === true,
      sources: ["Quiz"],
      activity: [],
    } satisfies Customer;

    current.quizParticipations += 1;
    current.effectiveVisits += 1;
    current.totalInteractions += 1;
    if (row.prize_won) current.wins += 1;
    if (row.prize_won && !row.prize_claimed && row.status !== "invalidated") current.activeRewards += 1;
    if (new Date(row.created_at) < new Date(current.firstSeen)) current.firstSeen = row.created_at;
    if (new Date(row.created_at) > new Date(current.lastSeen)) current.lastSeen = row.created_at;
    if (!current.email && row.email) current.email = row.email;
    if (!current.phone && row.phone) current.phone = row.phone;
    current.rgpdConsent ||= row.rgpd_consent === true;
    current.activity.push({
      type: "quiz",
      date: row.created_at,
      label: row.prize_won ? `Quiz · ${row.prize_won}` : "Participation au quiz",
      score: row.score ?? undefined,
      totalQuestions: row.total_questions ?? undefined,
      prize: row.prize_won,
      claimed: row.prize_claimed === true,
    });
    map.set(key, current);
  });

  const customers = Array.from(map.values())
    .map((customer) => ({ ...customer, activity: customer.activity.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()) }))
    .sort((a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime());

  return {
    customers,
    meta: {
      uniqueCustomers: customers.length,
      rawRecords: rows.length,
      duplicateRecordsMerged: Math.max(rows.length - customers.length, 0),
      sourceCounts: { quiz: rows.length },
      fallbackMode: true,
    },
  };
};

const CustomerDirectoryPanel = ({ adminPassword }: { adminPassword: string }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const loadLegacyCustomers = async () => {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/admin-scan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "list_participations", adminPassword }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || "Impossible de récupérer les clients existants");
    return legacyToCustomers(data.participations || []);
  };

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/admin-customers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminPassword }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !Array.isArray(data.customers) || data.customers.length === 0) {
        throw new Error(data.message || "CRM enrichi momentanément indisponible");
      }
      setCustomers(data.customers);
      setMeta(data.meta || null);
      setSelectedId((current) => current && data.customers.some((customer: Customer) => customer.id === current) ? current : data.customers[0]?.id || null);
    } catch (crmError) {
      try {
        const fallback = await loadLegacyCustomers();
        setCustomers(fallback.customers);
        setMeta(fallback.meta);
        setSelectedId((current) => current && fallback.customers.some((customer) => customer.id === current) ? current : fallback.customers[0]?.id || null);
        toast.warning("Clients restaurés depuis la source historique. L’enrichissement CRM sera ajouté dès que le service répond.");
      } catch (legacyError) {
        toast.error(legacyError instanceof Error ? legacyError.message : crmError instanceof Error ? crmError.message : "Chargement impossible");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadCustomers(); }, [adminPassword]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return customers.filter((customer) => {
      const matchesSearch = !needle || [customer.name, customer.email, customer.phone, customer.city, ...customer.sources].filter(Boolean).join(" ").toLowerCase().includes(needle);
      if (!matchesSearch) return false;
      if (filter === "recent") return daysSince(customer.firstSeen) <= 30;
      if (filter === "vip") return customer.effectiveVisits >= 5 || customer.loyaltyPoints >= 100;
      if (filter === "reward") return customer.activeRewards > 0;
      if (filter === "inactive") return daysSince(customer.lastSeen) > 60;
      if (filter === "consent") return customer.rgpdConsent;
      return true;
    });
  }, [customers, query, filter]);

  const selected = customers.find((customer) => customer.id === selectedId) || null;
  const activeRewards = customers.reduce((sum, customer) => sum + customer.activeRewards, 0);
  const vipCount = customers.filter((customer) => customer.effectiveVisits >= 5 || customer.loyaltyPoints >= 100).length;
  const recentCount = customers.filter((customer) => daysSince(customer.firstSeen) <= 30).length;

  const exportCsv = () => {
    const headers = ["Client", "Email", "Téléphone", "Ville", "Visites", "Quiz", "Réservations", "Messages", "Points", "Gains", "Gains actifs", "Première activité", "Dernière activité", "RGPD", "Sources"];
    const lines = filtered.map((customer) => [customer.name, customer.email, customer.phone, customer.city, customer.effectiveVisits, customer.quizParticipations, customer.reservations, customer.messages, customer.loyaltyPoints, customer.wins, customer.activeRewards, formatDate(customer.firstSeen), formatDate(customer.lastSeen), customer.rgpdConsent ? "Oui" : "Non", customer.sources.join(" · ")].map(csvCell).join(";"));
    const blob = new Blob(["\ufeff", headers.map(csvCell).join(";"), "\n", lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `clients-creperie-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success(`${filtered.length} clients exportés sans doublons`);
  };

  const printReport = () => {
    const report = window.open("", "_blank", "noopener,noreferrer");
    if (!report) return toast.error("Autorise les fenêtres pour générer le PDF");
    const rows = filtered.map((customer) => `<tr><td><strong>${customer.name}</strong><small>${customer.email || customer.phone || "Contact non renseigné"}</small></td><td>${customer.effectiveVisits}</td><td>${customer.quizParticipations}</td><td>${customer.reservations}</td><td>${customer.activeRewards}</td><td>${formatDate(customer.lastSeen)}</td></tr>`).join("");
    report.document.write(`<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Rapport clients</title><style>@page{size:A4 landscape;margin:12mm}*{box-sizing:border-box}body{font-family:Arial,sans-serif;color:#3b251b;margin:0}.hero{padding:24px;border-radius:18px;background:linear-gradient(135deg,#2d1a13,#8b5a34);color:white}.hero h1{margin:0;font-size:28px}.hero p{margin:7px 0 0;opacity:.8}.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:16px 0}.kpi{padding:13px;border:1px solid #d9c7b7;border-radius:12px}.kpi b{display:block;font-size:24px}.kpi span{font-size:10px;text-transform:uppercase;color:#7a6557}table{width:100%;border-collapse:collapse;font-size:10px}th{background:#f1e6db;text-align:left;padding:9px}td{border-bottom:1px solid #e8ddd4;padding:9px;vertical-align:top}td small{display:block;color:#7d6d62;margin-top:3px}</style></head><body><section class="hero"><h1>La Crêperie des Saveurs — Rapport clients</h1><p>Export sans doublons · ${new Date().toLocaleString("fr-FR")}</p></section><section class="kpis"><div class="kpi"><b>${filtered.length}</b><span>Clients exportés</span></div><div class="kpi"><b>${activeRewards}</b><span>Gains actifs</span></div><div class="kpi"><b>${vipCount}</b><span>Clients VIP</span></div><div class="kpi"><b>${meta?.duplicateRecordsMerged || 0}</b><span>Doublons fusionnés</span></div></section><table><thead><tr><th>Client</th><th>Visites</th><th>Quiz</th><th>Réservations</th><th>Gains actifs</th><th>Dernière activité</th></tr></thead><tbody>${rows}</tbody></table><script>window.onload=()=>window.print()</script></body></html>`);
    report.document.close();
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-caramel" /></div>;

  return (
    <div className="space-y-4">
      {meta?.fallbackMode && <div className="rounded-2xl border border-caramel/25 bg-butter/30 p-3 text-sm font-semibold text-espresso">Mode de secours actif : tes clients historiques sont affichés. Aucun client n’est masqué pendant la remise en service de l’agrégateur.</div>}
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Kpi icon={Users} label="Clients uniques" value={customers.length} />
        <Kpi icon={Sparkles} label="Nouveaux 30 j" value={recentCount} />
        <Kpi icon={Trophy} label="Clients VIP" value={vipCount} />
        <Kpi icon={Gift} label="Gains actifs" value={activeRewards} />
        <Kpi icon={Merge} label="Doublons fusionnés" value={meta?.duplicateRecordsMerged || 0} />
      </section>

      <section className="rounded-3xl border border-caramel/15 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div><p className="text-xs font-black uppercase tracking-[0.16em] text-caramel">CRM Clients</p><h2 className="font-display text-2xl font-black text-espresso">Toutes les données clients, une seule fiche</h2><p className="mt-1 text-sm text-muted-foreground">{meta?.rawRecords || 0} enregistrements analysés · {customers.length} personnes uniques.</p></div>
          <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={loadCustomers}><RefreshCw className="mr-2 h-4 w-4" />Actualiser</Button><Button variant="outline" onClick={exportCsv} disabled={!filtered.length}><FileSpreadsheet className="mr-2 h-4 w-4" />Excel / CSV</Button><Button className="bg-espresso text-white" onClick={printReport} disabled={!filtered.length}><Printer className="mr-2 h-4 w-4" />PDF premium</Button></div>
        </div>
        <div className="mt-4 flex flex-col gap-3 xl:flex-row"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher nom, e-mail, téléphone, ville ou source…" className="h-12 rounded-2xl pl-10" /></div><div className="flex flex-wrap gap-2">{([['all','Tous'],['recent','Nouveaux'],['vip','VIP'],['reward','Gain actif'],['inactive','Inactifs'],['consent','RGPD OK']] as const).map(([value,label]) => <button key={value} onClick={() => setFilter(value)} className={`rounded-2xl px-4 py-2 text-xs font-black ${filter === value ? 'bg-caramel text-white' : 'bg-muted text-muted-foreground'}`}>{label}</button>)}</div></div>
      </section>

      <section className="grid min-h-[640px] overflow-hidden rounded-3xl border border-caramel/15 bg-white shadow-warm xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,.65fr)]">
        <div className="min-w-0 overflow-auto border-b xl:border-b-0 xl:border-r"><table className="w-full min-w-[820px] text-left text-sm"><thead className="sticky top-0 z-10 bg-butter/80 text-[10px] uppercase tracking-wider text-muted-foreground backdrop-blur"><tr><th className="p-4">Client</th><th>Visites</th><th>Quiz</th><th>Réservations</th><th>Messages</th><th>Points</th><th>Gains</th><th>Dernière activité</th></tr></thead><tbody>{filtered.length === 0 ? <tr><td colSpan={8} className="p-12 text-center text-muted-foreground">Aucun client ne correspond à cette vue.</td></tr> : filtered.map((customer) => <tr key={customer.id} onClick={() => setSelectedId(customer.id)} className={`cursor-pointer border-t transition hover:bg-butter/20 ${selectedId === customer.id ? 'bg-caramel/10' : ''}`}><td className="p-4"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-caramel/12 font-display font-black text-caramel">{customer.name.slice(0,2).toUpperCase()}</span><div><strong className="block text-espresso">{customer.name}</strong><small className="text-muted-foreground">{customer.email || customer.phone || 'Contact non renseigné'}</small></div></div></td><td className="font-black">{customer.effectiveVisits}</td><td>{customer.quizParticipations}</td><td>{customer.reservations}</td><td>{customer.messages}</td><td>{customer.loyaltyPoints}</td><td className={customer.activeRewards ? 'font-black text-herb' : ''}>{customer.activeRewards}</td><td>{formatDate(customer.lastSeen)}</td></tr>)}</tbody></table></div>

        <aside className="min-w-0 bg-muted/10 p-4">{!selected ? <div className="flex h-full items-center justify-center text-center text-sm text-muted-foreground"><UserRound className="mr-2 h-5 w-5" />Sélectionne un client</div> : <div className="space-y-4"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-wider text-caramel">Fiche client</p><h3 className="font-display text-2xl font-black text-espresso">{selected.name}</h3><p className="mt-1 text-xs text-muted-foreground">Dernière activité · {formatDateTime(selected.lastSeen)}</p></div><button onClick={() => setSelectedId(null)} className="rounded-xl border p-2"><X className="h-4 w-4" /></button></div><div className="grid grid-cols-2 gap-2"><Detail label="Visites" value={selected.effectiveVisits} /><Detail label="Points" value={selected.loyaltyPoints} /><Detail label="Gains" value={selected.wins} /><Detail label="Actifs" value={selected.activeRewards} /></div><div className="rounded-2xl border bg-white p-3 text-sm"><p className="mb-2 text-xs font-black uppercase text-caramel">Coordonnées</p><p className="flex items-center gap-2"><Mail className="h-4 w-4 text-caramel" />{selected.email || 'E-mail non renseigné'}</p><p className="mt-2 flex items-center gap-2"><Phone className="h-4 w-4 text-caramel" />{selected.phone || 'Téléphone non renseigné'}</p></div><div className="rounded-2xl border bg-white p-3"><p className="mb-2 text-xs font-black uppercase text-caramel">Historique</p><div className="max-h-[330px] space-y-2 overflow-y-auto">{selected.activity.length === 0 ? <p className="text-sm text-muted-foreground">Aucune activité détaillée.</p> : selected.activity.map((item, index) => <div key={`${item.type}-${item.date}-${index}`} className="rounded-xl bg-muted/30 p-2 text-xs"><div className="flex justify-between gap-2"><strong>{item.label || item.type}</strong><span>{formatDateTime(item.date)}</span></div>{item.score !== undefined && <p className="mt-1 text-muted-foreground">Score : {item.score}/{item.totalQuestions ?? '—'}</p>}</div>)}</div></div></div>}</aside>
      </section>
    </div>
  );
};

const Kpi = ({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: number }) => <div className="rounded-3xl border border-caramel/15 bg-white p-4 shadow-sm"><div className="flex items-center justify-between"><p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">{label}</p><Icon className="h-4 w-4 text-caramel" /></div><p className="mt-3 font-display text-3xl font-black text-espresso">{value}</p></div>;
const Detail = ({ label, value }: { label: string; value: number }) => <div className="rounded-2xl border bg-white p-3 text-center"><p className="font-display text-xl font-black text-espresso">{value}</p><p className="text-[10px] font-bold uppercase text-muted-foreground">{label}</p></div>;

export default CustomerDirectoryPanel;
