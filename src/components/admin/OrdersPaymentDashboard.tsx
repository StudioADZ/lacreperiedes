import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock3, CreditCard, Loader2, PackageCheck, RefreshCw, Search, ShoppingBag, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

type OrderStatus = "pending" | "confirmed" | "preparing" | "ready" | "collected" | "cancelled";
type OrderItem = { name?: string; category?: string; quantity?: number; price?: number };
type Order = {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string;
  pickup_date: string;
  pickup_time: string;
  status: OrderStatus;
  payment_status: "pending" | "paid" | "refunded" | "failed";
  total: number;
  notes: string | null;
  items: OrderItem[];
  created_at: string;
};

type Filter = "active" | "pending" | "preparing" | "ready" | "collected" | "cancelled" | "all";

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Nouvelle",
  confirmed: "Confirmée",
  preparing: "En préparation",
  ready: "Prête",
  collected: "Retirée",
  cancelled: "Annulée",
};

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  pending: "confirmed",
  confirmed: "preparing",
  preparing: "ready",
  ready: "collected",
};

const OrdersPaymentDashboard = ({ adminPassword }: { adminPassword: string }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("active");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const request = useCallback(async (payload: Record<string, unknown>) => {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/admin-orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminPassword}` },
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || "Service indisponible");
    return data;
  }, [adminPassword]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await request({ action: "list" });
      const next = Array.isArray(data.orders) ? data.orders : [];
      setOrders(next);
      setSelectedId((current) => current && next.some((order: Order) => order.id === current) ? current : next[0]?.id || null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Chargement impossible");
    } finally {
      setLoading(false);
    }
  }, [request]);

  useEffect(() => { void load(); }, [load]);

  const updateStatus = async (order: Order, status: OrderStatus) => {
    setActionLoading(order.id);
    try {
      const data = await request({ action: "update_status", id: order.id, status });
      setOrders((current) => current.map((item) => item.id === order.id ? data.order : item));
      toast.success(`Commande ${STATUS_LABELS[status].toLowerCase()}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Modification impossible");
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return orders.filter((order) => {
      const matches = !needle || [order.order_number, order.customer_name, order.customer_phone, order.customer_email].filter(Boolean).join(" ").toLowerCase().includes(needle);
      if (!matches) return false;
      if (filter === "active") return !["collected", "cancelled"].includes(order.status);
      if (filter === "pending") return ["pending", "confirmed"].includes(order.status);
      if (filter === "preparing") return order.status === "preparing";
      if (filter === "ready") return order.status === "ready";
      if (filter === "collected") return order.status === "collected";
      if (filter === "cancelled") return order.status === "cancelled";
      return true;
    });
  }, [orders, query, filter]);

  const selected = orders.find((order) => order.id === selectedId) || null;
  const active = orders.filter((order) => !["collected", "cancelled"].includes(order.status)).length;
  const preparing = orders.filter((order) => order.status === "preparing").length;
  const ready = orders.filter((order) => order.status === "ready").length;
  const paidRevenue = orders.filter((order) => order.payment_status === "paid" && order.status !== "cancelled").reduce((sum, order) => sum + Number(order.total || 0), 0);
  const pendingPayments = orders.filter((order) => order.payment_status === "pending" && order.status !== "cancelled").length;

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-caramel" /></div>;

  return <div className="space-y-3">
    <section className="grid grid-cols-5 gap-2">
      <Metric icon={ShoppingBag} label="Commandes actives" value={active} />
      <Metric icon={UtensilsCrossed} label="En préparation" value={preparing} />
      <Metric icon={PackageCheck} label="Prêtes" value={ready} />
      <Metric icon={CreditCard} label="À encaisser" value={pendingPayments} />
      <Metric icon={CheckCircle2} label="CA encaissé" value={`${paidRevenue.toFixed(2)} €`} />
    </section>

    <section className="rounded-3xl border border-caramel/15 bg-white p-3 shadow-sm">
      <div className="flex flex-col gap-2 xl:flex-row xl:items-center">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Commande, client, téléphone ou e-mail…" className="h-11 rounded-xl pl-10" /></div>
        <div className="flex flex-wrap gap-1.5">{([['active','Actives'],['pending','Nouvelles'],['preparing','Cuisine'],['ready','Prêtes'],['collected','Retirées'],['cancelled','Annulées'],['all','Toutes']] as const).map(([value, label]) => <button key={value} onClick={() => setFilter(value)} className={`rounded-xl px-3 py-2 text-xs font-black ${filter === value ? "bg-caramel text-white" : "bg-muted text-muted-foreground"}`}>{label}</button>)}</div>
        <Button variant="outline" size="sm" onClick={load} className="rounded-xl"><RefreshCw className="mr-2 h-4 w-4" />Actualiser</Button>
      </div>
    </section>

    <section className="grid min-h-[620px] overflow-hidden rounded-3xl border border-caramel/15 bg-white shadow-sm xl:grid-cols-[minmax(0,1.5fr)_minmax(350px,.5fr)]">
      <div className="min-w-0 overflow-auto border-b xl:border-b-0 xl:border-r">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="sticky top-0 z-10 bg-butter/80 text-[10px] uppercase tracking-wider text-muted-foreground backdrop-blur"><tr><th className="w-14 p-4">N°</th><th>Commande</th><th>Client</th><th>Retrait</th><th>Articles</th><th>Total</th><th>Paiement</th><th>Statut</th></tr></thead>
          <tbody>{filtered.length === 0 ? <tr><td colSpan={8} className="p-12 text-center text-muted-foreground">Aucune commande pour ce filtre.</td></tr> : filtered.map((order, index) => <tr key={order.id} onClick={() => setSelectedId(order.id)} className={`cursor-pointer border-t transition hover:bg-butter/20 ${selectedId === order.id ? "bg-caramel/10" : ""}`}><td className="p-4 font-black">{index + 1}</td><td className="font-mono text-xs font-black text-espresso">{order.order_number}</td><td><strong className="block text-espresso">{order.customer_name}</strong><span className="text-xs text-muted-foreground">{order.customer_phone}</span></td><td className="whitespace-nowrap"><Clock3 className="mr-1 inline h-3.5 w-3.5 text-caramel" />{formatPickup(order)}</td><td>{order.items?.reduce((sum, item) => sum + Number(item.quantity || 0), 0) || 0}</td><td className="font-black">{Number(order.total || 0).toFixed(2)} €</td><td><PaymentStatus value={order.payment_status} /></td><td><OrderStatusBadge value={order.status} /></td></tr>)}</tbody>
        </table>
      </div>

      <aside className="bg-muted/10 p-4">{!selected ? <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Sélectionne une commande</div> : <div className="space-y-4">
        <div><p className="text-xs font-black uppercase tracking-wider text-caramel">Commande</p><h3 className="mt-1 font-display text-2xl font-black text-espresso">{selected.order_number}</h3><p className="text-xs text-muted-foreground">Retrait : {formatPickup(selected)}</p></div>
        <div className="grid grid-cols-2 gap-2"><Detail label="Total" value={`${Number(selected.total || 0).toFixed(2)} €`} /><Detail label="Paiement" value={selected.payment_status === "paid" ? "Payé" : "À payer"} /></div>
        <div className="rounded-2xl border bg-white p-3 text-sm"><p className="text-xs font-black uppercase text-caramel">Client</p><p className="mt-2 font-bold text-espresso">{selected.customer_name}</p><p>{selected.customer_phone}</p><p className="text-muted-foreground">{selected.customer_email || "E-mail non renseigné"}</p></div>
        <div className="rounded-2xl border bg-white p-3"><p className="mb-3 text-xs font-black uppercase text-caramel">Préparation</p><div className="space-y-2">{selected.items?.length ? selected.items.map((item, index) => <div key={`${item.name}-${index}`} className="flex items-start justify-between gap-3 border-b pb-2 text-sm last:border-0 last:pb-0"><div><p className="font-bold text-espresso">{item.quantity || 1} × {item.name || "Article"}</p><p className="text-xs capitalize text-muted-foreground">{item.category || "Autre"}</p></div><span className="font-bold">{Number(item.price || 0).toFixed(2)} €</span></div>) : <p className="text-sm text-muted-foreground">Aucun article détaillé.</p>}</div></div>
        {selected.notes && <div className="rounded-2xl border border-caramel/20 bg-butter/20 p-3 text-sm"><p className="text-xs font-black uppercase text-caramel">Note client</p><p className="mt-2">{selected.notes}</p></div>}
        <div className="grid gap-2">{NEXT_STATUS[selected.status] && <Button onClick={() => void updateStatus(selected, NEXT_STATUS[selected.status]!)} disabled={actionLoading === selected.id} className="rounded-xl bg-herb text-white">{actionLoading === selected.id ? <Loader2 className="h-4 w-4 animate-spin" /> : `Passer à : ${STATUS_LABELS[NEXT_STATUS[selected.status]!]}`}</Button>}{!["collected", "cancelled"].includes(selected.status) && <Button variant="outline" onClick={() => void updateStatus(selected, "cancelled")} disabled={actionLoading === selected.id} className="rounded-xl border-destructive/30 text-destructive">Annuler la commande</Button>}</div>
      </div>}</aside>
    </section>
  </div>;
};

const Metric = ({ icon: Icon, label, value }: { icon: typeof ShoppingBag; label: string; value: number | string }) => <div className="flex min-w-0 items-center gap-2 rounded-xl border border-caramel/15 bg-white px-2.5 py-2 shadow-sm"><Icon className="h-4 w-4 shrink-0 text-caramel" /><div className="min-w-0"><p className="truncate font-display text-lg font-black leading-none text-espresso">{value}</p><p className="truncate text-[9px] font-black uppercase tracking-wide text-muted-foreground">{label}</p></div></div>;
const Detail = ({ label, value }: { label: string; value: string }) => <div className="rounded-2xl border bg-white p-3 text-center"><p className="font-display text-lg font-black text-espresso">{value}</p><p className="text-[10px] font-bold uppercase text-muted-foreground">{label}</p></div>;
const PaymentStatus = ({ value }: { value: Order['payment_status'] }) => <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black ${value === "paid" ? "bg-herb/15 text-herb" : value === "failed" ? "bg-destructive/10 text-destructive" : "bg-caramel/15 text-caramel"}`}>{value === "paid" ? "Payé" : value === "refunded" ? "Remboursé" : value === "failed" ? "Échec" : "À payer"}</span>;
const OrderStatusBadge = ({ value }: { value: OrderStatus }) => <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black ${value === "ready" ? "bg-herb/15 text-herb" : value === "cancelled" ? "bg-destructive/10 text-destructive" : value === "preparing" ? "bg-caramel/15 text-caramel" : "bg-muted text-muted-foreground"}`}>{STATUS_LABELS[value]}</span>;
const formatPickup = (order: Order) => `${new Date(`${order.pickup_date}T12:00:00`).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })} · ${order.pickup_time.slice(0, 5)}`;

export default OrdersPaymentDashboard;