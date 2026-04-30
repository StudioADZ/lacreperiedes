import { useEffect, useMemo, useState } from "react";
import { Gift, Loader2, RefreshCw, Search, Trophy, UserRound, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

type Participation = {
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
};

type Customer = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  visits: number;
  wins: number;
  activeRewards: number;
  bestScore: number | null;
  firstSeen: string;
  lastSeen: string;
};

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });

const getCustomerKey = (row: Participation) =>
  row.email?.trim().toLowerCase() || row.phone?.trim() || row.first_name?.trim().toLowerCase() || row.id;

const CustomerDirectoryPanel = ({ adminPassword }: { adminPassword: string }) => {
  const [rows, setRows] = useState<Participation[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  const loadRows = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/admin-scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "list_participations", adminPassword }),
      });
      const data = await response.json();
      setRows(data.participations || []);
    } catch (error) {
      console.error("Customer directory error", error);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRows();
  }, [adminPassword]);

  const customers = useMemo(() => {
    const map = new Map<string, Customer>();

    rows.forEach((row) => {
      const key = getCustomerKey(row);
      const name = row.first_name?.trim() || row.email || row.phone || "Client sans nom";
      const current = map.get(key) || {
        id: key,
        name,
        email: row.email || null,
        phone: row.phone || null,
        visits: 0,
        wins: 0,
        activeRewards: 0,
        bestScore: null,
        firstSeen: row.created_at,
        lastSeen: row.created_at,
      };

      current.visits += 1;
      if (row.prize_won) current.wins += 1;
      if (row.prize_won && !row.prize_claimed && row.status !== "invalidated") current.activeRewards += 1;
      if (typeof row.score === "number") current.bestScore = Math.max(current.bestScore ?? 0, row.score);
      if (new Date(row.created_at) < new Date(current.firstSeen)) current.firstSeen = row.created_at;
      if (new Date(row.created_at) > new Date(current.lastSeen)) current.lastSeen = row.created_at;
      if (!current.email && row.email) current.email = row.email;
      if (!current.phone && row.phone) current.phone = row.phone;
      if (current.name === "Client sans nom" && name !== "Client sans nom") current.name = name;

      map.set(key, current);
    });

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, "fr", { sensitivity: "base" }));
  }, [rows]);

  const filteredCustomers = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return customers;
    return customers.filter((customer) =>
      [customer.name, customer.email, customer.phone].filter(Boolean).join(" ").toLowerCase().includes(needle),
    );
  }, [customers, query]);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-2">
        <StatCard icon={Users} label="Clients" value={customers.length} />
        <StatCard icon={Trophy} label="Passages" value={rows.length} />
        <StatCard icon={Gift} label="Gains actifs" value={customers.reduce((sum, customer) => sum + customer.activeRewards, 0)} />
      </div>

      <div className="rounded-[1.75rem] border border-caramel/15 bg-gradient-to-br from-white via-butter/30 to-caramel/10 p-4 shadow-sm">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-caramel">Données clients</p>
            <h3 className="font-display text-xl font-black text-espresso">Répertoire alphabétique</h3>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Base construite avec les participations quiz enregistrées. Les profils complets seront ajoutés au prochain passage Supabase.
            </p>
          </div>
          <Button variant="outline" size="icon" onClick={loadRows} disabled={loading} className="shrink-0 rounded-2xl">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher nom, email, téléphone..."
            className="h-12 rounded-2xl pl-10"
          />
        </div>
      </div>

      {loading ? (
        <div className="rounded-[1.75rem] border border-border/60 bg-white/70 p-8 text-center">
          <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-caramel" />
          <p className="text-sm font-semibold text-muted-foreground">Chargement des clients…</p>
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="rounded-[1.75rem] border border-border/60 bg-white/70 p-8 text-center">
          <UserRound className="mx-auto mb-3 h-10 w-10 text-caramel/60" />
          <p className="font-display text-lg font-black text-espresso">Aucun client trouvé</p>
          <p className="mt-1 text-sm text-muted-foreground">La recherche ne retourne aucun résultat.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredCustomers.map((customer) => (
            <CustomerCard key={customer.id} customer={customer} />
          ))}
        </div>
      )}
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: number }) => (
  <div className="rounded-3xl border border-caramel/15 bg-white/75 p-3 text-center shadow-sm">
    <Icon className="mx-auto mb-2 h-5 w-5 text-caramel" />
    <p className="font-display text-xl font-black text-espresso">{value}</p>
    <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
  </div>
);

const CustomerCard = ({ customer }: { customer: Customer }) => (
  <article className="rounded-[1.75rem] border border-border/55 bg-white/75 p-4 shadow-sm backdrop-blur">
    <div className="flex items-start gap-3">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-caramel/12 font-display text-base font-black text-caramel">
        {customer.name.slice(0, 2).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h4 className="truncate font-display text-lg font-black text-espresso">{customer.name}</h4>
            <p className="truncate text-xs text-muted-foreground">{customer.email || customer.phone || "Contact non renseigné"}</p>
          </div>
          <span className="rounded-full bg-herb/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-herb">
            {customer.activeRewards} actif{customer.activeRewards > 1 ? "s" : ""}
          </span>
        </div>

        <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
          <span className="rounded-full bg-caramel/10 px-2 py-1 text-caramel">{customer.visits} passages</span>
          <span className="rounded-full bg-caramel/10 px-2 py-1 text-caramel">{customer.wins} gains</span>
          <span className="rounded-full bg-background/70 px-2 py-1">Score max {customer.bestScore ?? "—"}</span>
          <span className="rounded-full bg-background/70 px-2 py-1">Vu le {formatDate(customer.lastSeen)}</span>
        </div>
      </div>
    </div>
  </article>
);

export default CustomerDirectoryPanel;
