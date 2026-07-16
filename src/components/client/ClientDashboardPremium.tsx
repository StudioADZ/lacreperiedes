import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Calendar,
  CheckCircle2,
  Clock3,
  Copy,
  Gift,
  LogOut,
  Mail,
  MapPin,
  PackageCheck,
  Phone,
  RefreshCw,
  Save,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Ticket,
  Trophy,
  User,
  WalletCards,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { getWeeklyCode, hasWonThisWeek } from "@/features/quiz/services/localCodes";
import { toast } from "sonner";
import logo from "@/assets/logo.png";

type ClientTab = "overview" | "activity" | "rewards" | "loyalty" | "profile";
type PrizeSource = "profile" | "history" | "device";
type RawRecord = Record<string, unknown>;

type PrizeRecord = {
  id: string;
  source: PrizeSource;
  label: string;
  code: string | null;
  wonAt: string | null;
  claimed: boolean;
};

type Reservation = {
  id: string;
  reservation_date: string;
  reservation_time: string;
  party_size: number | null;
  status: string | null;
};

type Order = {
  id: string;
  order_number: string;
  pickup_date: string;
  pickup_time: string;
  status: string;
  payment_status: string;
  total: number;
  created_at: string;
};

const LOYALTY_TARGET = 9;

const getString = (record: RawRecord, keys: string[]) => {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
};

const getBoolean = (record: RawRecord, keys: string[]) => {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "boolean") return value;
  }
  return false;
};

const normalizePrizeLabel = (value: string | null) => {
  if (!value) return "Gain fidélité";
  if (value === "formule_complete") return "Formule complète";
  if (value === "galette") return "Une galette";
  if (value === "crepe") return "Une crêpe";
  return value;
};

const formatDate = (date: string | null) => {
  if (!date) return "Rattaché à votre compte";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "Date non disponible";
  return parsed.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
};

const orderStatusLabel = (status: string) => ({
  pending: "Nouvelle",
  confirmed: "Confirmée",
  preparing: "En préparation",
  ready: "Prête",
  collected: "Retirée",
  cancelled: "Annulée",
}[status] || status);

function StatCard({ icon: Icon, label, value, hint }: { icon: typeof Star; label: string; value: string | number; hint: string }) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-caramel/15 bg-white/85 p-3 shadow-sm">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-caramel/10 text-caramel"><Icon className="h-5 w-5" /></div>
      <div className="min-w-0"><p className="font-display text-xl font-black leading-none text-espresso">{value}</p><p className="mt-1 truncate text-xs font-bold text-espresso/80">{label}</p><p className="truncate text-[10px] text-muted-foreground">{hint}</p></div>
    </div>
  );
}

function PrizeCard({ prize, onCopy }: { prize: PrizeRecord; onCopy: (code: string) => void }) {
  return (
    <article className="rounded-2xl border border-border/60 bg-white/85 p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${prize.claimed ? "bg-herb/15 text-herb" : "bg-caramel/15 text-caramel"}`}>
          {prize.claimed ? <CheckCircle2 className="h-5 w-5" /> : <Ticket className="h-5 w-5" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3"><div><h3 className="font-display text-lg font-bold text-espresso">{prize.label}</h3><p className="text-xs text-muted-foreground">{formatDate(prize.wonAt)}</p></div><span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${prize.claimed ? "bg-herb/15 text-herb" : "bg-caramel/15 text-caramel"}`}>{prize.claimed ? "Utilisé" : "Disponible"}</span></div>
          {prize.code && <button type="button" onClick={() => onCopy(prize.code!)} className="mt-3 flex w-full items-center justify-between rounded-xl border border-caramel/20 bg-ivory px-3 py-3 text-left"><span><span className="block text-[9px] font-black uppercase tracking-wider text-muted-foreground">Code à présenter</span><span className="font-mono text-lg font-black tracking-[0.14em] text-espresso">{prize.code}</span></span><Copy className="h-4 w-4 text-caramel" /></button>}
        </div>
      </div>
    </article>
  );
}

const ClientDashboardPremium = () => {
  const { profile, user, signOut, refreshProfile, updateProfile } = useAuth();
  const prefersReducedMotion = useReducedMotion();
  const [activeTab, setActiveTab] = useState<ClientTab>("overview");
  const [prizes, setPrizes] = useState<PrizeRecord[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [city, setCity] = useState("");

  const displayName = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ").trim() || user?.user_metadata?.first_name || "Client fidèle";

  useEffect(() => {
    setFirstName(profile?.first_name || "");
    setLastName(profile?.last_name || "");
    setPhoneInput(profile?.phone || "");
    setCity(profile?.city || "");
  }, [profile]);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const items: PrizeRecord[] = [];
      if (profile?.secret_menu_unlocked && profile.secret_menu_code) {
        items.push({ id: `proposal-${profile.secret_menu_code}`, source: "profile", label: "Proposition du moment débloquée", code: profile.secret_menu_code, wonAt: profile.secret_menu_unlocked_at || null, claimed: false });
      }

      const [prizeResult, reservationResult, orderResult] = await Promise.all([
        (supabase as any).from("prize_history").select("*").eq("user_id", user.id).order("won_at", { ascending: false }).limit(30),
        (supabase as any).from("reservations").select("id,reservation_date,reservation_time,party_size,status").eq("user_id", user.id).order("reservation_date", { ascending: false }).limit(20),
        user.email ? (supabase as any).from("click_collect_orders").select("id,order_number,pickup_date,pickup_time,status,payment_status,total,created_at").eq("customer_email", user.email).order("created_at", { ascending: false }).limit(20) : Promise.resolve({ data: [], error: null }),
      ]);

      if (!prizeResult.error) {
        ((prizeResult.data || []) as RawRecord[]).forEach((record) => {
          const label = normalizePrizeLabel(getString(record, ["prize_type", "prize_won"]));
          const code = getString(record, ["prize_code", "code", "coupon_code"]);
          if (!code && label === "Gain fidélité") return;
          items.push({ id: getString(record, ["id"]) || `${code || label}-${getString(record, ["won_at", "created_at"]) || "history"}`, source: "history", label, code, wonAt: getString(record, ["won_at", "created_at"]), claimed: getBoolean(record, ["is_claimed", "claimed", "prize_claimed"]) || Boolean(getString(record, ["claimed_at", "redeemed_at", "used_at"])) });
        });
      }

      const deviceCode = getWeeklyCode();
      if (hasWonThisWeek() && deviceCode) items.push({ id: `device-${deviceCode}`, source: "device", label: "Gain quiz de la semaine", code: deviceCode, wonAt: null, claimed: false });

      setPrizes(items.filter((item, index, all) => all.findIndex((candidate) => (candidate.code || candidate.id) === (item.code || item.id)) === index));
      setReservations((reservationResult.data || []) as Reservation[]);
      setOrders((orderResult.data || []) as Order[]);
    } catch (error) {
      console.error("[ClientDashboardPremium] load failed:", error);
      toast.error("Impossible de charger toutes vos informations");
    } finally {
      setIsLoading(false);
    }
  }, [profile, user]);

  useEffect(() => { void fetchData(); }, [fetchData]);

  const refreshAll = async () => { await refreshProfile(); await fetchData(); toast.success("Espace client actualisé"); };
  const handleCopyCode = async (code: string) => { try { await navigator.clipboard.writeText(code); toast.success("Code copié"); } catch { toast.info(`Code : ${code}`); } };
  const handleSaveProfile = async () => {
    setProfileSaving(true);
    try {
      await updateProfile({ first_name: firstName.trim() || null, last_name: lastName.trim() || null, phone: phoneInput.trim() || null, city: city.trim() || null });
      await refreshProfile();
      toast.success("Profil mis à jour");
    } catch { toast.error("Impossible de modifier le profil"); } finally { setProfileSaving(false); }
  };

  const loyaltyVisits = profile?.total_visits || 0;
  const loyaltyPoints = profile?.loyalty_points || 0;
  const loyaltyProgress = Math.min((loyaltyVisits / LOYALTY_TARGET) * 100, 100);
  const visitsUntilReward = Math.max(LOYALTY_TARGET - loyaltyVisits, 0);
  const activePrizes = prizes.filter((prize) => !prize.claimed);
  const upcomingReservations = reservations.filter((item) => new Date(`${item.reservation_date}T${item.reservation_time}`) >= new Date());
  const activeOrders = orders.filter((item) => !["collected", "cancelled"].includes(item.status));
  const profileCompletion = useMemo(() => { const fields = [profile?.first_name, profile?.last_name, user?.email, profile?.phone, profile?.city]; return Math.round((fields.filter(Boolean).length / fields.length) * 100); }, [profile, user?.email]);

  const menuItems: { id: ClientTab; label: string; icon: typeof User }[] = [
    { id: "overview", label: "Accueil", icon: User },
    { id: "activity", label: "Activité", icon: Clock3 },
    { id: "rewards", label: "Avantages", icon: Gift },
    { id: "loyalty", label: "Fidélité", icon: Trophy },
    { id: "profile", label: "Profil", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-butter/25 via-background to-background pb-28">
      <header className="relative overflow-hidden border-b border-caramel/10 bg-gradient-to-br from-espresso via-espresso to-caramel px-4 pb-5 pt-[calc(env(safe-area-inset-top)+4.75rem)] text-white">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-start gap-3">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border-2 border-white/30 bg-white shadow-lg"><img src={profile?.avatar_url || logo} alt="Avatar du compte client" className="h-full w-full object-cover" /></div>
            <div className="min-w-0 flex-1"><p className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider"><ShieldCheck className="h-3.5 w-3.5" /> Espace personnel</p><h1 className="mt-2 font-display text-2xl font-black leading-tight">Bonjour {displayName}</h1><p className="mt-1 truncate text-xs text-white/70">{user?.email}</p></div>
            <Button variant="ghost" size="icon" onClick={signOut} aria-label="Se déconnecter" className="rounded-xl bg-white/10 text-white hover:bg-white/20"><LogOut className="h-5 w-5" /></Button>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="rounded-2xl bg-white/10 p-3"><p className="text-xl font-black">{loyaltyPoints}</p><p className="text-[10px] uppercase text-white/65">Points</p></div>
            <div className="rounded-2xl bg-white/10 p-3"><p className="text-xl font-black">{activePrizes.length}</p><p className="text-[10px] uppercase text-white/65">Avantages</p></div>
            <div className="rounded-2xl bg-white/10 p-3"><p className="text-xl font-black">{upcomingReservations.length}</p><p className="text-[10px] uppercase text-white/65">Réservations</p></div>
            <div className="rounded-2xl bg-white/10 p-3"><p className="text-xl font-black">{activeOrders.length}</p><p className="text-[10px] uppercase text-white/65">Commandes</p></div>
          </div>
        </div>
      </header>

      <nav className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur"><div className="mx-auto flex max-w-3xl overflow-x-auto px-2">{menuItems.map((item) => { const Icon = item.icon; const active = activeTab === item.id; return <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex min-h-12 min-w-fit items-center gap-2 border-b-2 px-3 text-xs font-black ${active ? "border-caramel text-caramel" : "border-transparent text-muted-foreground"}`}><Icon className="h-4 w-4" />{item.label}</button>; })}</div></nav>

      <main className="mx-auto max-w-3xl px-4 py-4">
        {activeTab === "overview" && <motion.div initial={prefersReducedMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="flex items-center justify-between"><div><h2 className="font-display text-xl font-black text-espresso">Mon espace</h2><p className="text-sm text-muted-foreground">Tout ce qui compte pour votre prochaine visite.</p></div><Button variant="outline" size="icon" onClick={refreshAll} className="rounded-xl"><RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} /></Button></div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4"><StatCard icon={Calendar} label="Visites" value={loyaltyVisits} hint="Validées" /><StatCard icon={Gift} label="Avantages" value={activePrizes.length} hint="Disponibles" /><StatCard icon={ShoppingBag} label="Commandes" value={activeOrders.length} hint="En cours" /><StatCard icon={User} label="Profil" value={`${profileCompletion}%`} hint="Complété" /></div>
          {profile?.secret_menu_unlocked && profile.secret_menu_code && <div className="rounded-2xl border border-caramel/20 bg-gradient-to-r from-caramel/10 to-butter/40 p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-wider text-caramel">Accès personnel</p><h3 className="mt-1 font-display text-lg font-black text-espresso">Proposition du moment</h3><p className="mt-1 text-sm text-muted-foreground">Votre accès reste lié à votre compte.</p></div><Sparkles className="h-6 w-6 text-caramel" /></div><div className="mt-3 grid gap-2 sm:grid-cols-2"><Button asChild className="rounded-xl"><Link to={`/carte?code=${encodeURIComponent(profile.secret_menu_code)}`}>Voir la carte</Link></Button><Button variant="outline" onClick={() => handleCopyCode(profile.secret_menu_code!)} className="rounded-xl"><Copy className="mr-2 h-4 w-4" />{profile.secret_menu_code}</Button></div></div>}
          <div className="grid gap-2 sm:grid-cols-3"><Button asChild className="h-12 rounded-xl"><Link to="/reserver"><Calendar className="mr-2 h-4 w-4" />Réserver</Link></Button><Button asChild variant="outline" className="h-12 rounded-xl"><Link to="/carte"><ShoppingBag className="mr-2 h-4 w-4" />Voir la carte</Link></Button><Button variant="outline" className="h-12 rounded-xl" onClick={() => setActiveTab("profile")}><User className="mr-2 h-4 w-4" />Mon profil</Button></div>
        </motion.div>}

        {activeTab === "activity" && <motion.div initial={prefersReducedMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div><h2 className="font-display text-xl font-black text-espresso">Mon activité</h2><p className="text-sm text-muted-foreground">Réservations et commandes liées à votre compte.</p></div>
          <section className="rounded-2xl border bg-white/85 p-4"><h3 className="flex items-center gap-2 font-display text-lg font-black text-espresso"><Calendar className="h-5 w-5 text-caramel" />Réservations</h3><div className="mt-3 space-y-2">{reservations.length === 0 ? <p className="rounded-xl bg-muted/40 p-4 text-sm text-muted-foreground">Aucune réservation liée à ce compte.</p> : reservations.map((item) => <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl border p-3"><div><p className="font-bold text-espresso">{new Date(`${item.reservation_date}T12:00:00`).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}</p><p className="text-xs text-muted-foreground">{item.reservation_time.slice(0, 5)} · {item.party_size || 1} personne{(item.party_size || 1) > 1 ? "s" : ""}</p></div><span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-black capitalize">{item.status || "Confirmée"}</span></div>)}</div></section>
          <section className="rounded-2xl border bg-white/85 p-4"><h3 className="flex items-center gap-2 font-display text-lg font-black text-espresso"><PackageCheck className="h-5 w-5 text-caramel" />Commandes à emporter</h3><div className="mt-3 space-y-2">{orders.length === 0 ? <p className="rounded-xl bg-muted/40 p-4 text-sm text-muted-foreground">Aucune commande liée à votre e-mail.</p> : orders.map((item) => <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl border p-3"><div><p className="font-mono text-xs font-black text-espresso">{item.order_number}</p><p className="mt-1 text-sm font-bold">{Number(item.total || 0).toFixed(2)} €</p><p className="text-xs text-muted-foreground">Retrait {new Date(`${item.pickup_date}T12:00:00`).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })} à {item.pickup_time.slice(0, 5)}</p></div><div className="text-right"><span className="rounded-full bg-caramel/10 px-2.5 py-1 text-[10px] font-black text-caramel">{orderStatusLabel(item.status)}</span><p className="mt-2 text-[10px] font-bold text-muted-foreground">{item.payment_status === "paid" ? "Payée" : "À payer"}</p></div></div>)}</div></section>
        </motion.div>}

        {activeTab === "rewards" && <motion.div initial={prefersReducedMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3"><div><h2 className="font-display text-xl font-black text-espresso">Mes avantages</h2><p className="text-sm text-muted-foreground">Gains, codes et accès rattachés à votre compte.</p></div>{isLoading ? <div className="rounded-2xl border bg-white p-8 text-center text-muted-foreground"><RefreshCw className="mx-auto mb-3 h-7 w-7 animate-spin text-caramel" />Chargement…</div> : prizes.length === 0 ? <div className="rounded-2xl border bg-white p-8 text-center"><Gift className="mx-auto mb-3 h-10 w-10 text-caramel/60" /><p className="font-bold text-espresso">Aucun avantage disponible</p><Button asChild className="mt-4 rounded-xl"><Link to="/quiz">Participer au quiz</Link></Button></div> : prizes.map((prize) => <PrizeCard key={prize.id} prize={prize} onCopy={handleCopyCode} />)}</motion.div>}

        {activeTab === "loyalty" && <motion.div initial={prefersReducedMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4"><div className="rounded-2xl border bg-white/85 p-5"><div className="flex items-center justify-between"><div><p className="text-[10px] font-black uppercase tracking-wider text-caramel">Programme fidélité</p><h2 className="font-display text-2xl font-black text-espresso">{loyaltyPoints} points</h2></div><Trophy className="h-9 w-9 text-caramel" /></div><div className="mt-5 h-3 overflow-hidden rounded-full bg-butter/70"><div className="h-full rounded-full bg-gradient-to-r from-caramel to-terracotta" style={{ width: `${loyaltyProgress}%` }} /></div><div className="mt-2 flex justify-between text-xs text-muted-foreground"><span>{loyaltyVisits} visite{loyaltyVisits > 1 ? "s" : ""}</span><span>{visitsUntilReward > 0 ? `${visitsUntilReward} restante${visitsUntilReward > 1 ? "s" : ""}` : "Récompense disponible"}</span></div></div><Button asChild className="h-12 w-full rounded-xl"><Link to="/reserver">Préparer ma prochaine visite</Link></Button></motion.div>}

        {activeTab === "profile" && <motion.div initial={prefersReducedMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4"><div><h2 className="font-display text-xl font-black text-espresso">Mon profil</h2><p className="text-sm text-muted-foreground">Vos informations personnelles et votre compte.</p></div><div className="rounded-2xl border bg-white/85 p-4"><div className="grid grid-cols-2 gap-3"><label className="space-y-1 text-sm font-bold">Prénom<input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="min-h-11 w-full rounded-xl border bg-background px-3" /></label><label className="space-y-1 text-sm font-bold">Nom<input value={lastName} onChange={(e) => setLastName(e.target.value)} className="min-h-11 w-full rounded-xl border bg-background px-3" /></label></div><label className="mt-3 block space-y-1 text-sm font-bold">Téléphone<div className="relative"><Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input value={phoneInput} onChange={(e) => setPhoneInput(e.target.value)} className="min-h-11 w-full rounded-xl border bg-background pl-10 pr-3" /></div></label><label className="mt-3 block space-y-1 text-sm font-bold">Ville<div className="relative"><MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input value={city} onChange={(e) => setCity(e.target.value)} className="min-h-11 w-full rounded-xl border bg-background pl-10 pr-3" /></div></label><div className="mt-3 rounded-xl bg-muted/40 p-3"><p className="text-[10px] uppercase text-muted-foreground">Email de connexion</p><p className="truncate font-bold text-espresso"><Mail className="mr-2 inline h-4 w-4 text-caramel" />{user?.email || "—"}</p></div></div><Button className="h-12 w-full rounded-xl" onClick={handleSaveProfile} disabled={profileSaving}>{profileSaving ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Enregistrer mon profil</Button></motion.div>}
      </main>
    </div>
  );
};

export default ClientDashboardPremium;
