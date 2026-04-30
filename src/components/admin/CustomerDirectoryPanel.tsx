import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Gift,
  Loader2,
  Mail,
  Phone,
  RefreshCw,
  Search,
  Trophy,
  UserRound,
  Users,
} from "lucide-react";
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
  history: Participation[];
};

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const getCustomerKey = (row: Participation) =>
  row.email?.trim().toLowerCase() || row.phone?.trim() || row.first_name?.trim().toLowerCase() || row.id;

const CustomerDirectoryPanel = ({ adminPassword }: { adminPassword: string }) => {
  const [rows, setRows] = useState<Participation[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [openedCustomerId, setOpenedCustomerId] = useState<string | null>(null);

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
        history: [],
      };

      current.visits += 1;
      current.history.push(row);
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

    return Array.from(map.values())
      .map((customer) => ({
        ...customer,
        history: customer.history.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
      }))
      .sort((a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime());
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
            <p className="text-xs font-black uppercase tracking-[0.16em] text-caramel">Fiches clients</p>
            <h3 className="font-display text-xl font-black text-espresso">Derniers clients en haut</h3>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Une ligne par client. Touchez une ligne pour ouvrir sa fiche complète.
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
        <div className="space-y-2">
          {filteredCustomers.map((customer) => (
            <CustomerRow
              key={customer.id}
              customer={customer}
              isOpen={openedCustomerId === customer.id}
              onToggle={() => setOpenedCustomerId((current) => (current === customer.id ? null : customer.id))}
            />
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

const CustomerRow = ({ customer, isOpen, onToggle }: { customer: Customer; isOpen: boolean; onToggle: () => void }) => (
  <article className="overflow-hidden rounded-[1.25rem] border border-border/55 bg-white/80 shadow-sm backdrop-blur">
    <button type="button" onClick={onToggle} className="w-full p-3 text-left">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-caramel/12 font-display text-sm font-black text-caramel">
          {customer.name.slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h4 className="truncate font-display text-base font-black text-espresso">{customer.name}</h4>
            <span className="shrink-0 text-[11px] font-bold text-caramel">{formatDate(customer.lastSeen)}</span>
          </div>
          <p className="truncate text-xs text-muted-foreground">{customer.email || customer.phone || "Contact non renseigné"}</p>
        </div>
        <div className="shrink-0 text-muted-foreground">{isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</div>
      </div>
    </button>

    {isOpen && <CustomerDetails customer={customer} />}
  </article>
);

const CustomerDetails = ({ customer }: { customer: Customer }) => (
  <div className="border-t border-border/55 bg-background/45 p-4">
    <div className="grid grid-cols-2 gap-2">
      <DetailTile label="Passages" value={customer.visits} />
      <DetailTile label="Gains" value={customer.wins} />
      <DetailTile label="Gains actifs" value={customer.activeRewards} />
      <DetailTile label="Score max" value={customer.bestScore ?? "—"} />
    </div>

    <div className="mt-3 space-y-2 rounded-2xl bg-white/70 p-3 text-xs text-muted-foreground">
      <p className="font-black uppercase tracking-wide text-caramel">Contact</p>
      <p className="flex items-center gap-2">
        <Mail className="h-3.5 w-3.5 text-caramel" />
        {customer.email || "Email non renseigné"}
      </p>
      <p className="flex items-center gap-2">
        <Phone className="h-3.5 w-3.5 text-caramel" />
        {customer.phone || "Téléphone non renseigné"}
      </p>
      <p>Première activité : {formatDate(customer.firstSeen)}</p>
      <p>Dernière activité : {formatDateTime(customer.lastSeen)}</p>
    </div>

    <div className="mt-3 rounded-2xl bg-white/70 p-3">
      <p className="mb-2 text-xs font-black uppercase tracking-wide text-caramel">Historique récent</p>
      <div className="space-y-2">
        {customer.history.slice(0, 5).map((item) => (
          <div key={item.id} className="rounded-xl border border-border/50 bg-background/60 p-2 text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-espresso">{formatDateTime(item.created_at)}</span>
              <span className="rounded-full bg-caramel/10 px-2 py-0.5 text-caramel">{item.score ?? "—"}/{item.total_questions ?? "—"}</span>
            </div>
            <p className="mt-1 text-muted-foreground">
              {item.prize_won ? `Gain : ${item.prize_won}` : "Aucun gain"}
              {item.prize_won && item.prize_claimed ? " · utilisé" : ""}
              {item.prize_won && !item.prize_claimed ? " · actif" : ""}
            </p>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const DetailTile = ({ label, value }: { label: string; value: string | number }) => (
  <div className="rounded-2xl bg-white/75 p-3 text-center">
    <p className="font-display text-lg font-black text-espresso">{value}</p>
    <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
  </div>
);

export default CustomerDirectoryPanel;
