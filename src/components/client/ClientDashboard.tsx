import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  CheckCircle2,
  Copy,
  Gift,
  History,
  Lock,
  LogOut,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Save,
  ShieldCheck,
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
import { toast } from "sonner";
import logo from "@/assets/logo.png";

const BOOKING_LINK = "https://calendar.app.google/nZShjcjWUyTcGLR97";
const LOYALTY_TARGET = 9;

type ClientTab = "overview" | "rewards" | "loyalty" | "profile";

type PrizeRecord = {
  id: string;
  source: "quiz" | "history";
  label: string;
  code: string | null;
  wonAt: string | null;
  claimed: boolean;
  score: number | null;
  totalQuestions: number | null;
  weekStart: string | null;
};

type RawRecord = Record<string, unknown>;

const normalizeEmail = (email?: string | null) => (email || "").trim().toLowerCase();
const normalizePhone = (phone?: string | null) => (phone || "").replace(/[\s.-]/g, "").trim();

const getString = (record: RawRecord, keys: string[]) => {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
};

const getNumber = (record: RawRecord, keys: string[]) => {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() && !Number.isNaN(Number(value))) return Number(value);
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

const formatDate = (date: string | null) => {
  if (!date) return "Date non disponible";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "Date non disponible";
  return parsed.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
};

const formatShortDate = (date: string | null) => {
  if (!date) return "—";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
};

const normalizePrizeLabel = (value: string | null) => {
  if (!value) return "Gain quiz";
  if (value === "formule_complete") return "Formule complète";
  if (value === "galette") return "Une galette";
  if (value === "crepe") return "Une crêpe";
  return value;
};

const buildQuizPrize = (record: RawRecord): PrizeRecord | null => {
  const label = normalizePrizeLabel(getString(record, ["prize_won", "prize_type", "prizeLabel"]));
  const code = getString(record, ["prize_code", "code", "coupon_code"]);

  if (!code && !getString(record, ["prize_won", "prize_type", "prizeLabel"])) return null;

  return {
    id: getString(record, ["id"]) || `${code || label}-${getString(record, ["created_at", "submitted_at", "won_at"]) || "quiz"}`,
    source: "quiz",
    label,
    code,
    wonAt: getString(record, ["created_at", "submitted_at", "won_at", "inserted_at"]),
    claimed: getBoolean(record, ["is_claimed", "claimed"]) || !!getString(record, ["claimed_at", "redeemed_at", "used_at"]),
    score: getNumber(record, ["score", "correct_answers"]),
    totalQuestions: getNumber(record, ["total_questions", "totalQuestions"]),
    weekStart: getString(record, ["week_start", "weekStart"]),
  };
};

const buildHistoryPrize = (record: RawRecord): PrizeRecord | null => {
  const label = normalizePrizeLabel(getString(record, ["prize_type", "prize_won"]));
  const code = getString(record, ["prize_code", "code", "coupon_code"]);

  if (!code && label === "Gain quiz") return null;

  return {
    id: getString(record, ["id"]) || `${code || label}-${getString(record, ["won_at", "created_at"]) || "history"}`,
    source: "history",
    label,
    code,
    wonAt: getString(record, ["won_at", "created_at", "inserted_at"]),
    claimed: getBoolean(record, ["is_claimed", "claimed"]) || !!getString(record, ["claimed_at", "redeemed_at", "used_at"]),
    score: getNumber(record, ["score"]),
    totalQuestions: getNumber(record, ["total_questions"]),
    weekStart: getString(record, ["week_start"]),
  };
};

const dedupePrizes = (items: PrizeRecord[]) => {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.code || `${item.label}-${item.wonAt || item.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const sortPrizes = (items: PrizeRecord[]) =>
  [...items].sort((a, b) => {
    const aTime = a.wonAt ? new Date(a.wonAt).getTime() : 0;
    const bTime = b.wonAt ? new Date(b.wonAt).getTime() : 0;
    return bTime - aTime;
  });

function StatCard({ icon: Icon, label, value, hint }: { icon: typeof Star; label: string; value: string | number; hint: string }) {
  return (
    <div className="rounded-[1.75rem] border border-caramel/15 bg-white/75 p-4 shadow-sm backdrop-blur">
      <Icon className="mb-3 h-7 w-7 text-caramel" />
      <p className="text-2xl font-bold text-espresso">{value}</p>
      <p className="text-sm font-semibold text-espresso/80">{label}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

function PrizeCard({ prize, highlight = false, onCopy }: { prize: PrizeRecord; highlight?: boolean; onCopy: (code: string) => void }) {
  const scoreLabel = prize.score !== null && prize.totalQuestions ? `${prize.score}/${prize.totalQuestions}` : null;

  return (
    <div className={`rounded-[1.75rem] border p-4 shadow-sm ${highlight ? "border-caramel/40 bg-caramel/10" : "border-border/50 bg-white/75"}`}>
      <div className="flex items-start gap-3">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${prize.claimed ? "bg-herb/15 text-herb" : "bg-caramel/15 text-caramel"}`}>
          {prize.claimed ? <CheckCircle2 className="h-6 w-6" /> : <Ticket className="h-6 w-6" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-display text-lg font-bold text-espresso">{prize.label}</p>
              <p className="text-xs text-muted-foreground">Gagné le {formatDate(prize.wonAt)}</p>
            </div>
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${prize.claimed ? "bg-herb/15 text-herb" : "bg-caramel/15 text-caramel"}`}>
              {prize.claimed ? "Utilisé" : "À présenter"}
            </span>
          </div>

          {prize.code && (
            <div className="mt-4 rounded-2xl border border-caramel/20 bg-ivory px-4 py-3 text-center">
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Code caisse</p>
              <button
                type="button"
                onClick={() => onCopy(prize.code!)}
                className="mt-1 inline-flex items-center gap-2 rounded-xl px-2 py-1 font-mono text-2xl font-black tracking-[0.18em] text-espresso transition-colors hover:bg-caramel/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {prize.code}
                <Copy className="h-4 w-4 text-caramel" />
              </button>
              <p className="mt-1 text-xs text-muted-foreground">Touchez pour copier · présentez ce code à la caisse</p>
            </div>
          )}

          <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
            {scoreLabel && <span className="rounded-full bg-background/60 px-2 py-1">Score {scoreLabel}</span>}
            {prize.weekStart && <span className="rounded-full bg-background/60 px-2 py-1">Semaine du {formatShortDate(prize.weekStart)}</span>}
            <span className="rounded-full bg-background/60 px-2 py-1">Source {prize.source === "quiz" ? "quiz" : "fidélité"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const ClientDashboard = () => {
  const { profile, user, signOut, refreshProfile, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<ClientTab>("overview");
  const [prizes, setPrizes] = useState<PrizeRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [loyaltySaving, setLoyaltySaving] = useState(false);
  const [lastSyncLabel, setLastSyncLabel] = useState<string | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [city, setCity] = useState("");

  const email = normalizeEmail(user?.email);
  const phone = normalizePhone(profile?.phone);
  const displayName = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ").trim() || user?.user_metadata?.first_name || "Client fidèle";

  useEffect(() => {
    setFirstName(profile?.first_name || "");
    setLastName(profile?.last_name || "");
    setPhoneInput(profile?.phone || "");
    setCity(profile?.city || "");
  }, [profile]);

  const fetchPrizes = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const quizQuery = async () => {
        if (!email && !phone) return [] as PrizeRecord[];

        let query = (supabase as any).from("quiz_participations").select("*").not("prize_won", "is", null);
        if (email && phone) query = query.or(`email.eq.${email},phone.eq.${phone}`);
        else if (email) query = query.eq("email", email);
        else query = query.eq("phone", phone);

        const { data, error } = await query.order("created_at", { ascending: false }).limit(30);
        if (error) throw error;
        return ((data || []) as RawRecord[]).map(buildQuizPrize).filter(Boolean) as PrizeRecord[];
      };

      const historyQuery = async () => {
        const { data, error } = await (supabase as any)
          .from("prize_history")
          .select("*")
          .eq("user_id", user.id)
          .order("won_at", { ascending: false })
          .limit(30);

        if (error) throw error;
        return ((data || []) as RawRecord[]).map(buildHistoryPrize).filter(Boolean) as PrizeRecord[];
      };

      const [quizResult, historyResult] = await Promise.allSettled([quizQuery(), historyQuery()]);
      const merged = [
        ...(quizResult.status === "fulfilled" ? quizResult.value : []),
        ...(historyResult.status === "fulfilled" ? historyResult.value : []),
      ];

      if (quizResult.status === "rejected") console.warn("[ClientDashboard] quiz rewards fetch failed:", quizResult.reason);
      if (historyResult.status === "rejected") console.warn("[ClientDashboard] prize history fetch failed:", historyResult.reason);

      setPrizes(sortPrizes(dedupePrizes(merged)));
      setLastSyncLabel(new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }));
    } catch (error) {
      console.error("[ClientDashboard] rewards fetch failed:", error);
      toast.error("Impossible de charger vos gains pour le moment");
    } finally {
      setIsLoading(false);
    }
  }, [email, phone, user]);

  useEffect(() => {
    void fetchPrizes();
  }, [fetchPrizes]);

  const refreshAll = useCallback(async () => {
    await Promise.all([refreshProfile(), fetchPrizes()]);
    toast.success("Espace client actualisé");
  }, [fetchPrizes, refreshProfile]);

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success("Code copié");
    } catch {
      toast.info(`Code à présenter : ${code}`);
    }
  };

  const handleSaveProfile = async () => {
    setProfileSaving(true);
    try {
      await updateProfile({
        first_name: firstName.trim() || null,
        last_name: lastName.trim() || null,
        phone: phoneInput.trim() || null,
        city: city.trim() || null,
      });
      await refreshAll();
      toast.success("Profil mis à jour");
    } catch (error) {
      console.error("[ClientDashboard] profile update failed:", error);
      toast.error("Impossible de modifier le profil");
    } finally {
      setProfileSaving(false);
    }
  };

  const handleBookingClick = () => {
    window.open(BOOKING_LINK, "_blank", "noopener,noreferrer");
  };

  const handleConfirmAppBooking = async () => {
    if (!profile || !user) return;

    const today = new Date().toISOString().slice(0, 10);
    const storageKey = `lcs-booking-credit:${user.id}:${today}`;
    if (localStorage.getItem(storageKey)) {
      toast.info("Réservation déjà prise en compte aujourd’hui");
      return;
    }

    setLoyaltySaving(true);
    try {
      const nextVisits = (profile.total_visits || 0) + 1;
      const nextPoints = (profile.loyalty_points || 0) + 1;
      await updateProfile({ total_visits: nextVisits, loyalty_points: nextPoints });
      localStorage.setItem(storageKey, "1");
      await refreshProfile();
      toast.success("Réservation ajoutée à votre fidélité");
    } catch (error) {
      console.error("[ClientDashboard] loyalty update failed:", error);
      toast.error("Impossible d’ajouter cette réservation à la fidélité");
    } finally {
      setLoyaltySaving(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Déconnexion réussie");
    } catch (error) {
      console.error("[ClientDashboard] signOut failed:", error);
      toast.error("Erreur lors de la déconnexion");
    }
  };

  const loyaltyVisits = profile?.total_visits || 0;
  const loyaltyPoints = profile?.loyalty_points || 0;
  const loyaltyProgress = Math.min((loyaltyVisits / LOYALTY_TARGET) * 100, 100);
  const visitsUntilReward = Math.max(LOYALTY_TARGET - loyaltyVisits, 0);
  const activePrizes = prizes.filter((prize) => !prize.claimed);
  const lastPrize = prizes[0] || null;
  const secretUnlocked = !!profile?.secret_menu_unlocked;
  const profileCompletion = useMemo(() => {
    const fields = [profile?.first_name, profile?.last_name, user?.email, profile?.phone, profile?.city];
    return Math.round((fields.filter(Boolean).length / fields.length) * 100);
  }, [profile, user?.email]);

  const menuItems: { id: ClientTab; label: string; icon: typeof User }[] = [
    { id: "overview", label: "Aperçu", icon: User },
    { id: "rewards", label: "Gains", icon: Gift },
    { id: "loyalty", label: "Fidélité", icon: Trophy },
    { id: "profile", label: "Profil", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="relative overflow-hidden bg-gradient-to-br from-butter/70 via-ivory to-caramel/10 px-5 pb-7 pt-[calc(env(safe-area-inset-top)+4.75rem)]">
        <div className="absolute -right-16 top-10 h-40 w-40 rounded-full bg-caramel/20 blur-3xl" />
        <div className="absolute -left-10 bottom-0 h-32 w-32 rounded-full bg-terracotta/10 blur-2xl" />

        <div className="relative flex items-start gap-4">
          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full border-4 border-white/70 bg-white shadow-warm">
            {profile?.avatar_url ? <img src={profile.avatar_url} alt="Avatar" className="h-full w-full object-cover" /> : <img src={logo} alt="La Crêperie" className="h-full w-full object-cover" />}
          </div>

          <div className="min-w-0 flex-1">
            <p className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-white/70 px-2.5 py-1 text-[11px] font-semibold text-caramel">
              <ShieldCheck className="h-3.5 w-3.5" />
              Compte client
            </p>
            <h1 className="font-display text-2xl font-black leading-tight text-espresso">{displayName}</h1>
            <p className="mt-1 truncate text-sm text-muted-foreground">{user?.email}</p>
          </div>

          <Button variant="ghost" size="icon" onClick={handleSignOut} aria-label="Se déconnecter" className="rounded-full bg-white/45">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative mt-6 rounded-[1.75rem] border border-white/60 bg-white/75 p-4 shadow-sm backdrop-blur">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-caramel" />
              <span className="font-display text-lg font-bold text-espresso">Fidélité réservation</span>
            </div>
            <span className="text-sm font-black text-caramel">{loyaltyPoints} pts</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-butter/60">
            <motion.div initial={{ width: 0 }} animate={{ width: `${loyaltyProgress}%` }} transition={{ duration: 0.8, ease: "easeOut" }} className="h-full rounded-full bg-gradient-to-r from-caramel to-terracotta" />
          </div>
          <div className="mt-3 flex items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>{visitsUntilReward > 0 ? `Encore ${visitsUntilReward} réservation${visitsUntilReward > 1 ? "s" : ""} pour un menu offert` : "Menu offert disponible"}</span>
            <span>{loyaltyVisits}/{LOYALTY_TARGET}</span>
          </div>
        </motion.div>
      </div>

      <div className="sticky top-0 z-30 border-b border-border/70 bg-background/90 backdrop-blur">
        <div className="flex overflow-x-auto px-3 [-webkit-overflow-scrolling:touch]">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`flex min-w-fit items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition ${active ? "border-caramel text-caramel" : "border-transparent text-muted-foreground hover:text-foreground"}`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
                {item.id === "rewards" && activePrizes.length > 0 && <span className="rounded-full bg-caramel px-1.5 py-0.5 text-[10px] text-white">{activePrizes.length}</span>}
              </button>
            );
          })}
        </div>
      </div>

      <main className="mx-auto max-w-xl px-4 py-5">
        {activeTab === "overview" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="rounded-[1.75rem] border border-caramel/15 bg-white/75 p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-xl font-black text-espresso">Tableau de bord</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Vos gains, vos réservations fidélité et votre profil client.</p>
                </div>
                <Button variant="ghost" size="icon" onClick={refreshAll} disabled={isLoading} className="rounded-full">
                  <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                </Button>
              </div>
            </div>

            {lastPrize && !lastPrize.claimed ? (
              <PrizeCard prize={lastPrize} highlight onCopy={handleCopyCode} />
            ) : (
              <div className="rounded-[1.75rem] border border-border/60 bg-white/75 p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-caramel/15 text-caramel">
                    <Gift className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <p className="font-display text-lg font-bold text-espresso">Aucun code actif à utiliser</p>
                    <p className="text-sm text-muted-foreground">Jouez au quiz ou réservez depuis l’app pour faire vivre votre espace client.</p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <StatCard icon={Calendar} label="Réservations" value={loyaltyVisits} hint="Comptées fidélité" />
              <StatCard icon={Gift} label="Gains" value={prizes.length} hint={`${activePrizes.length} à utiliser`} />
              <StatCard icon={WalletCards} label="Points" value={loyaltyPoints} hint="1 réservation = 1 point" />
              <StatCard icon={User} label="Profil" value={`${profileCompletion}%`} hint="Données complétées" />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Button className="h-12 rounded-full" onClick={() => setActiveTab("loyalty")}>
                <Calendar className="mr-2 h-4 w-4" />
                Réserver / fidélité
              </Button>
              <Button variant="outline" className="h-12 rounded-full" onClick={() => setActiveTab("profile")}>
                <User className="mr-2 h-4 w-4" />
                Compléter mon profil
              </Button>
            </div>

            {lastSyncLabel && <p className="text-center text-[11px] text-muted-foreground">Dernière synchronisation : {lastSyncLabel}</p>}
          </motion.div>
        )}

        {activeTab === "rewards" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="rounded-[1.75rem] border border-caramel/15 bg-caramel/5 p-4">
              <h2 className="font-display text-xl font-black text-espresso">Mes gains</h2>
              <p className="mt-1 text-sm text-muted-foreground">Codes gagnés au quiz et avantages à présenter à la caisse.</p>
            </div>

            {isLoading ? (
              <div className="rounded-[1.75rem] border border-border/60 bg-white/75 p-8 text-center text-muted-foreground">
                <RefreshCw className="mx-auto mb-3 h-8 w-8 animate-spin text-caramel" />
                Chargement des gains…
              </div>
            ) : prizes.length === 0 ? (
              <div className="rounded-[1.75rem] border border-border/60 bg-white/75 p-8 text-center">
                <Gift className="mx-auto mb-3 h-12 w-12 text-caramel/60" />
                <p className="font-semibold text-espresso">Aucun gain visible pour ce compte</p>
                <p className="mt-1 text-sm text-muted-foreground">Les gains sont recherchés avec l’email connecté et le téléphone du profil.</p>
                <Button className="mt-4 rounded-full" onClick={refreshAll} disabled={isLoading}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Rechercher mes gains
                </Button>
              </div>
            ) : (
              prizes.map((prize) => <PrizeCard key={prize.id} prize={prize} onCopy={handleCopyCode} />)
            )}
          </motion.div>
        )}

        {activeTab === "loyalty" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="rounded-[1.75rem] border border-border/60 bg-white/75 p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-caramel/15 text-caramel">
                  <Trophy className="h-7 w-7" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-black text-espresso">Fidélité réservation</h2>
                  <p className="text-sm text-muted-foreground">1 réservation faite depuis l’app = 1 point.</p>
                </div>
              </div>

              <div className="mt-5 rounded-2xl bg-background/60 p-4">
                <div className="mb-2 flex justify-between text-sm font-semibold text-espresso">
                  <span>{loyaltyVisits} réservation{loyaltyVisits > 1 ? "s" : ""}</span>
                  <span>{visitsUntilReward} restante{visitsUntilReward > 1 ? "s" : ""}</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-butter/70">
                  <div className="h-full rounded-full bg-gradient-to-r from-caramel to-terracotta" style={{ width: `${loyaltyProgress}%` }} />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">À {LOYALTY_TARGET} réservations, un menu offert devient disponible.</p>
              </div>

              <div className="mt-5 grid gap-3">
                <Button className="h-12 rounded-full" onClick={handleBookingClick}>
                  <Calendar className="mr-2 h-4 w-4" />
                  Réserver maintenant
                </Button>
                <Button variant="outline" className="h-12 rounded-full" onClick={handleConfirmAppBooking} disabled={loyaltySaving}>
                  {loyaltySaving ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                  J’ai réservé depuis l’app
                </Button>
              </div>

              <p className="mt-3 text-center text-[11px] text-muted-foreground">Le bouton de validation est limité à une fois par jour sur ce téléphone.</p>
            </div>
          </motion.div>
        )}

        {activeTab === "profile" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="rounded-[1.75rem] border border-border/60 bg-white/75 p-4 shadow-sm">
              <h2 className="font-display text-xl font-black text-espresso">Mon profil</h2>
              <p className="mt-1 text-sm text-muted-foreground">Ces informations servent à retrouver vos gains et préparer votre accueil.</p>

              <div className="mt-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <label className="space-y-1 text-sm font-semibold text-espresso">
                    Prénom
                    <input value={firstName} onChange={(event) => setFirstName(event.target.value)} className="w-full rounded-2xl border border-border/60 bg-background/60 px-3 py-3 text-sm outline-none focus:border-caramel" placeholder="Prénom" />
                  </label>
                  <label className="space-y-1 text-sm font-semibold text-espresso">
                    Nom
                    <input value={lastName} onChange={(event) => setLastName(event.target.value)} className="w-full rounded-2xl border border-border/60 bg-background/60 px-3 py-3 text-sm outline-none focus:border-caramel" placeholder="Nom" />
                  </label>
                </div>

                <label className="block space-y-1 text-sm font-semibold text-espresso">
                  Téléphone
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input value={phoneInput} onChange={(event) => setPhoneInput(event.target.value)} className="w-full rounded-2xl border border-border/60 bg-background/60 py-3 pl-10 pr-3 text-sm outline-none focus:border-caramel" placeholder="06 00 00 00 00" inputMode="tel" />
                  </div>
                </label>

                <label className="block space-y-1 text-sm font-semibold text-espresso">
                  Ville
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input value={city} onChange={(event) => setCity(event.target.value)} className="w-full rounded-2xl border border-border/60 bg-background/60 py-3 pl-10 pr-3 text-sm outline-none focus:border-caramel" placeholder="Mamers" />
                  </div>
                </label>

                <div className="rounded-2xl bg-background/60 px-3 py-3">
                  <p className="text-xs text-muted-foreground">Email de connexion</p>
                  <p className="truncate font-semibold text-espresso"><Mail className="mr-2 inline h-4 w-4 text-caramel" />{user?.email || "—"}</p>
                </div>

                <div className="rounded-2xl bg-background/60 px-3 py-3">
                  <p className="text-xs text-muted-foreground">Carte secrète</p>
                  <p className="font-semibold text-espresso"><Sparkles className="mr-2 inline h-4 w-4 text-caramel" />{secretUnlocked ? `Débloquée${profile?.secret_menu_code ? ` · ${profile.secret_menu_code}` : ""}` : "Non débloquée"}</p>
                </div>
              </div>
            </div>

            <Button className="h-12 w-full rounded-full" onClick={handleSaveProfile} disabled={profileSaving}>
              {profileSaving ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Enregistrer mon profil
            </Button>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default ClientDashboard;
