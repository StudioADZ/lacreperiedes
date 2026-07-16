import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import {
  CalendarDays,
  ChevronRight,
  CircleUserRound,
  Clock3,
  Copy,
  Gift,
  LogOut,
  MapPin,
  PackageCheck,
  Phone,
  RefreshCw,
  Save,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  TicketCheck,
  Trophy,
  UserRound,
  WalletCards,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { getWeeklyCode, hasWonThisWeek } from "@/features/quiz/services/localCodes";
import { toast } from "sonner";
import logo from "@/assets/logo.png";

type Tab = "home" | "activity" | "benefits" | "loyalty" | "profile";
type Raw = Record<string, unknown>;
type Reward = { id: string; label: string; code: string | null; date: string | null; used: boolean };
type Reservation = { id: string; reservation_date: string; reservation_time: string; party_size: number | null; status: string | null };
type Order = { id: string; order_number: string; pickup_date: string; pickup_time: string; status: string; payment_status: string; total: number };

const TARGET = 9;
const text = (row: Raw, keys: string[]) => keys.map((key) => row[key]).find((value) => typeof value === "string" && value.trim()) as string | undefined;
const dateFr = (value: string) => new Date(`${value}T12:00:00`).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
const statusLabel = (status: string) => ({ pending: "Nouvelle", confirmed: "Confirmée", preparing: "En préparation", ready: "Prête", collected: "Retirée", cancelled: "Annulée" }[status] || status);

const Metric = ({ icon: Icon, value, label }: { icon: typeof Star; value: number | string; label: string }) => (
  <div className="group rounded-[1.35rem] border border-white/10 bg-white/[0.08] p-3.5 backdrop-blur transition hover:bg-white/[0.13]">
    <div className="flex items-center justify-between gap-2">
      <div><p className="font-display text-2xl font-black leading-none text-white">{value}</p><p className="mt-1 text-[10px] font-black uppercase tracking-[0.14em] text-white/55">{label}</p></div>
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white/80"><Icon className="h-4 w-4" /></div>
    </div>
  </div>
);

const SectionTitle = ({ eyebrow, title, action }: { eyebrow: string; title: string; action?: React.ReactNode }) => (
  <div className="flex items-end justify-between gap-3">
    <div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-caramel">{eyebrow}</p><h2 className="mt-1 font-display text-2xl font-black text-espresso">{title}</h2></div>
    {action}
  </div>
);

const ClientDashboardPremiumV2 = () => {
  const { profile, user, signOut, refreshProfile, updateProfile } = useAuth();
  const reducedMotion = useReducedMotion();
  const [tab, setTab] = useState<Tab>("home");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");

  const displayName = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ").trim() || user?.user_metadata?.first_name || "Client fidèle";
  const firstDisplayName = profile?.first_name || user?.user_metadata?.first_name || "Bienvenue";

  useEffect(() => {
    setFirstName(profile?.first_name || "");
    setLastName(profile?.last_name || "");
    setPhone(profile?.phone || "");
    setCity(profile?.city || "");
  }, [profile]);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [rewardResult, reservationResult, orderResult] = await Promise.all([
        (supabase as any).from("prize_history").select("*").eq("user_id", user.id).order("won_at", { ascending: false }).limit(30),
        (supabase as any).from("reservations").select("id,reservation_date,reservation_time,party_size,status").eq("user_id", user.id).order("reservation_date", { ascending: false }).limit(20),
        user.email ? (supabase as any).from("click_collect_orders").select("id,order_number,pickup_date,pickup_time,status,payment_status,total").eq("customer_email", user.email).order("created_at", { ascending: false }).limit(20) : Promise.resolve({ data: [] }),
      ]);

      const nextRewards: Reward[] = [];
      if (profile?.secret_menu_unlocked && profile.secret_menu_code) nextRewards.push({ id: `offer-${profile.secret_menu_code}`, label: "Proposition du moment", code: profile.secret_menu_code, date: profile.secret_menu_unlocked_at || null, used: false });
      ((rewardResult.data || []) as Raw[]).forEach((row) => {
        const code = text(row, ["prize_code", "code", "coupon_code"]) || null;
        const rawLabel = text(row, ["prize_type", "prize_won"]) || "Récompense";
        const label = rawLabel === "formule_complete" ? "Formule complète" : rawLabel === "galette" ? "Une galette" : rawLabel === "crepe" ? "Une crêpe" : rawLabel;
        nextRewards.push({ id: text(row, ["id"]) || `${label}-${code}`, label, code, date: text(row, ["won_at", "created_at"]) || null, used: Boolean(row.is_claimed || row.claimed_at || row.redeemed_at) });
      });
      const localCode = getWeeklyCode();
      if (hasWonThisWeek() && localCode) nextRewards.push({ id: `local-${localCode}`, label: "Gain quiz de la semaine", code: localCode, date: null, used: false });

      setRewards(nextRewards.filter((item, index, all) => all.findIndex((candidate) => (candidate.code || candidate.id) === (item.code || item.id)) === index));
      setReservations((reservationResult.data || []) as Reservation[]);
      setOrders((orderResult.data || []) as Order[]);
    } catch (error) {
      console.error(error);
      toast.error("Certaines informations n’ont pas pu être chargées");
    } finally {
      setLoading(false);
    }
  }, [profile, user]);

  useEffect(() => { void load(); }, [load]);

  const visits = profile?.total_visits || 0;
  const points = profile?.loyalty_points || 0;
  const progress = Math.min((visits / TARGET) * 100, 100);
  const availableRewards = rewards.filter((reward) => !reward.used);
  const upcomingReservations = reservations.filter((item) => new Date(`${item.reservation_date}T${item.reservation_time}`) >= new Date());
  const activeOrders = orders.filter((item) => !["collected", "cancelled"].includes(item.status));
  const completion = useMemo(() => Math.round(([profile?.first_name, profile?.last_name, user?.email, profile?.phone, profile?.city].filter(Boolean).length / 5) * 100), [profile, user?.email]);

  const copy = async (value: string) => { try { await navigator.clipboard.writeText(value); toast.success("Code copié"); } catch { toast.info(value); } };
  const saveProfile = async () => {
    setSaving(true);
    try {
      await updateProfile({ first_name: firstName.trim() || null, last_name: lastName.trim() || null, phone: phone.trim() || null, city: city.trim() || null });
      await refreshProfile();
      toast.success("Profil mis à jour");
    } catch { toast.error("Modification impossible"); } finally { setSaving(false); }
  };

  const tabs: { id: Tab; label: string; icon: typeof Star }[] = [
    { id: "home", label: "Accueil", icon: CircleUserRound },
    { id: "activity", label: "Activité", icon: Clock3 },
    { id: "benefits", label: "Avantages", icon: Gift },
    { id: "loyalty", label: "Fidélité", icon: Trophy },
    { id: "profile", label: "Profil", icon: UserRound },
  ];

  return (
    <div className="min-h-screen bg-[#f7f2e8] pb-28">
      <header className="relative overflow-hidden bg-[#211914] px-4 pb-8 pt-[calc(env(safe-area-inset-top)+5rem)] text-white">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-caramel/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-20 h-72 w-72 rounded-full bg-terracotta/20 blur-3xl" />
        <div className="relative mx-auto max-w-5xl">
          <div className="grid gap-5 lg:grid-cols-[1.25fr_.75fr] lg:items-stretch">
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-2xl backdrop-blur">
              <div className="flex items-start gap-4">
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-[1.6rem] border border-white/20 bg-white shadow-xl"><img src={profile?.avatar_url || logo} alt="Avatar du compte" className="h-full w-full object-cover" /></div>
                <div className="min-w-0 flex-1">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white/80"><ShieldCheck className="h-3.5 w-3.5" /> Carte membre</span>
                  <p className="mt-3 text-sm text-white/60">Bonjour,</p>
                  <h1 className="truncate font-display text-3xl font-black tracking-tight sm:text-4xl">{firstDisplayName}</h1>
                  <p className="mt-1 truncate text-xs text-white/55">{user?.email}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={signOut} className="rounded-2xl border border-white/10 bg-white/5 text-white hover:bg-white/15" aria-label="Se déconnecter"><LogOut className="h-5 w-5" /></Button>
              </div>
              <div className="mt-6 flex items-center justify-between gap-3 border-t border-white/10 pt-4">
                <div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/45">Membre La Crêperie des Saveurs</p><p className="mt-1 font-mono text-sm tracking-[0.18em] text-white/85">SAVEURS • {user?.id?.slice(0, 8).toUpperCase()}</p></div>
                <Sparkles className="h-6 w-6 text-caramel" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Metric icon={WalletCards} value={points} label="Points" />
              <Metric icon={Gift} value={availableRewards.length} label="Avantages" />
              <Metric icon={CalendarDays} value={upcomingReservations.length} label="Réservations" />
              <Metric icon={ShoppingBag} value={activeOrders.length} label="Commandes" />
            </div>
          </div>
        </div>
      </header>

      <nav className="sticky top-0 z-30 border-b border-black/5 bg-[#f7f2e8]/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-5xl overflow-x-auto px-3">
          {tabs.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => setTab(id)} className={`flex min-h-14 min-w-fit items-center gap-2 border-b-2 px-4 text-xs font-black transition ${tab === id ? "border-caramel text-espresso" : "border-transparent text-muted-foreground hover:text-espresso"}`}><Icon className="h-4 w-4" />{label}{id === "benefits" && availableRewards.length > 0 && <span className="rounded-full bg-caramel px-1.5 py-0.5 text-[9px] text-white">{availableRewards.length}</span>}</button>)}
        </div>
      </nav>

      <main className="mx-auto max-w-5xl px-4 py-6">
        {tab === "home" && <motion.div initial={reducedMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          <SectionTitle eyebrow="Votre espace" title="Tout est prêt pour votre prochaine visite" action={<Button variant="outline" size="icon" onClick={() => void load()} className="rounded-xl bg-white"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /></Button>} />

          <div className="grid gap-4 lg:grid-cols-[1.2fr_.8fr]">
            <section className="rounded-[2rem] border border-caramel/15 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-caramel">Programme fidélité</p><h3 className="mt-1 font-display text-2xl font-black text-espresso">{visits}/{TARGET} visites</h3></div><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-caramel/10 text-caramel"><Trophy className="h-7 w-7" /></div></div>
              <div className="mt-5 h-3 overflow-hidden rounded-full bg-butter"><div className="h-full rounded-full bg-gradient-to-r from-caramel to-terracotta" style={{ width: `${progress}%` }} /></div>
              <div className="mt-3 flex justify-between text-xs text-muted-foreground"><span>{Math.max(TARGET - visits, 0)} visite(s) avant la prochaine récompense</span><span>{points} points</span></div>
            </section>

            <section className="rounded-[2rem] border border-caramel/15 bg-gradient-to-br from-[#fff7e8] to-[#f2dfbd] p-5 shadow-sm">
              <div className="flex items-start justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-caramel">Accès exclusif</p><h3 className="mt-1 font-display text-2xl font-black text-espresso">Proposition du moment</h3><p className="mt-2 text-sm text-muted-foreground">Retrouvez les créations réservées aux participants du quiz.</p></div><Sparkles className="h-7 w-7 text-caramel" /></div>
              <Button asChild className="mt-5 h-12 w-full rounded-xl"><Link to={profile?.secret_menu_code ? `/carte?offer=${encodeURIComponent(profile.secret_menu_code)}` : "/quiz"}>{profile?.secret_menu_unlocked ? "Découvrir mes propositions" : "Participer au quiz"}<ChevronRight className="ml-2 h-4 w-4" /></Link></Button>
            </section>
          </div>

          <section className="grid gap-3 sm:grid-cols-3">
            <Link to="/reserver" className="group rounded-[1.6rem] border border-caramel/15 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-caramel/10 text-caramel"><CalendarDays className="h-5 w-5" /></div><h3 className="mt-4 font-display text-lg font-black text-espresso">Réserver une table</h3><p className="mt-1 text-xs text-muted-foreground">Choisissez votre prochain créneau.</p></Link>
            <Link to="/carte" className="group rounded-[1.6rem] border border-caramel/15 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-herb/10 text-herb"><ShoppingBag className="h-5 w-5" /></div><h3 className="mt-4 font-display text-lg font-black text-espresso">Voir la carte</h3><p className="mt-1 text-xs text-muted-foreground">Galettes, crêpes et boissons.</p></Link>
            <button onClick={() => setTab("profile")} className="group rounded-[1.6rem] border border-caramel/15 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><UserRound className="h-5 w-5" /></div><h3 className="mt-4 font-display text-lg font-black text-espresso">Mon profil</h3><p className="mt-1 text-xs text-muted-foreground">Profil complété à {completion}%.</p></button>
          </section>
        </motion.div>}

        {tab === "activity" && <div className="space-y-5"><SectionTitle eyebrow="Historique" title="Mes réservations et commandes" /><div className="grid gap-4 lg:grid-cols-2"><section className="rounded-[2rem] border border-caramel/15 bg-white p-5"><h3 className="flex items-center gap-2 font-display text-xl font-black text-espresso"><CalendarDays className="h-5 w-5 text-caramel" />Réservations</h3><div className="mt-4 space-y-2">{reservations.length === 0 ? <p className="rounded-2xl bg-muted/40 p-4 text-sm text-muted-foreground">Aucune réservation liée à ce compte.</p> : reservations.map((item) => <div key={item.id} className="flex items-center justify-between rounded-2xl border p-3"><div><p className="font-bold text-espresso">{dateFr(item.reservation_date)}</p><p className="text-xs text-muted-foreground">{item.reservation_time.slice(0, 5)} · {item.party_size || 1} personne(s)</p></div><span className="rounded-full bg-butter px-2.5 py-1 text-[10px] font-black text-caramel">{item.status || "Confirmée"}</span></div>)}</div></section><section className="rounded-[2rem] border border-caramel/15 bg-white p-5"><h3 className="flex items-center gap-2 font-display text-xl font-black text-espresso"><PackageCheck className="h-5 w-5 text-caramel" />Commandes</h3><div className="mt-4 space-y-2">{orders.length === 0 ? <p className="rounded-2xl bg-muted/40 p-4 text-sm text-muted-foreground">Aucune commande liée à cette adresse e-mail.</p> : orders.map((item) => <div key={item.id} className="rounded-2xl border p-3"><div className="flex items-center justify-between"><p className="font-mono text-xs font-black text-espresso">{item.order_number}</p><span className="text-sm font-black">{Number(item.total || 0).toFixed(2)} €</span></div><div className="mt-2 flex items-center justify-between text-xs text-muted-foreground"><span>{dateFr(item.pickup_date)} · {item.pickup_time.slice(0, 5)}</span><span>{statusLabel(item.status)}</span></div></div>)}</div></section></div></div>}

        {tab === "benefits" && <div className="space-y-5"><SectionTitle eyebrow="Récompenses" title="Mes avantages" />{rewards.length === 0 ? <div className="rounded-[2rem] border border-caramel/15 bg-white p-10 text-center"><Gift className="mx-auto h-12 w-12 text-caramel/50" /><p className="mt-3 font-bold text-espresso">Aucun avantage disponible</p><Button asChild className="mt-4 rounded-xl"><Link to="/quiz">Participer au quiz</Link></Button></div> : <div className="grid gap-3 sm:grid-cols-2">{rewards.map((reward) => <article key={reward.id} className="rounded-[1.6rem] border border-caramel/15 bg-white p-4 shadow-sm"><div className="flex items-start justify-between"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-caramel/10 text-caramel"><TicketCheck className="h-5 w-5" /></div><span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${reward.used ? "bg-muted text-muted-foreground" : "bg-herb/10 text-herb"}`}>{reward.used ? "Utilisé" : "Disponible"}</span></div><h3 className="mt-4 font-display text-lg font-black text-espresso">{reward.label}</h3>{reward.code && <button onClick={() => void copy(reward.code!)} className="mt-3 flex w-full items-center justify-between rounded-xl border border-caramel/15 bg-butter/40 px-3 py-3"><span className="font-mono font-black tracking-[0.12em] text-espresso">{reward.code}</span><Copy className="h-4 w-4 text-caramel" /></button>}</article>)}</div>}</div>}

        {tab === "loyalty" && <div className="space-y-5"><SectionTitle eyebrow="Programme" title="Ma fidélité" /><section className="overflow-hidden rounded-[2rem] bg-[#211914] p-6 text-white shadow-xl"><div className="flex items-center justify-between"><div><p className="text-xs uppercase tracking-[0.18em] text-white/50">Solde actuel</p><p className="mt-2 font-display text-5xl font-black">{points}</p><p className="text-sm text-white/60">points fidélité</p></div><Trophy className="h-16 w-16 text-caramel" /></div><div className="mt-8 h-3 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-caramel" style={{ width: `${progress}%` }} /></div><div className="mt-3 flex justify-between text-xs text-white/55"><span>{visits} visite(s) validée(s)</span><span>Objectif {TARGET}</span></div></section></div>}

        {tab === "profile" && <div className="space-y-5"><SectionTitle eyebrow="Informations" title="Mon profil" /><section className="rounded-[2rem] border border-caramel/15 bg-white p-5 shadow-sm"><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-bold text-espresso">Prénom<input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="mt-1.5 h-12 w-full rounded-xl border bg-background px-3 outline-none focus:border-caramel" /></label><label className="text-sm font-bold text-espresso">Nom<input value={lastName} onChange={(e) => setLastName(e.target.value)} className="mt-1.5 h-12 w-full rounded-xl border bg-background px-3 outline-none focus:border-caramel" /></label><label className="text-sm font-bold text-espresso">Téléphone<div className="relative mt-1.5"><Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-caramel" /><input value={phone} onChange={(e) => setPhone(e.target.value)} className="h-12 w-full rounded-xl border bg-background pl-10 pr-3 outline-none focus:border-caramel" /></div></label><label className="text-sm font-bold text-espresso">Ville<div className="relative mt-1.5"><MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-caramel" /><input value={city} onChange={(e) => setCity(e.target.value)} className="h-12 w-full rounded-xl border bg-background pl-10 pr-3 outline-none focus:border-caramel" /></div></label></div><div className="mt-4 rounded-xl bg-butter/40 p-3 text-sm"><p className="text-xs text-muted-foreground">Adresse e-mail de connexion</p><p className="font-bold text-espresso">{user?.email}</p></div><Button onClick={() => void saveProfile()} disabled={saving} className="mt-5 h-12 w-full rounded-xl"><Save className="mr-2 h-4 w-4" />{saving ? "Enregistrement…" : "Enregistrer mon profil"}</Button></section></div>}
      </main>
    </div>
  );
};

export default ClientDashboardPremiumV2;
