import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  CheckCircle2,
  ChevronRight,
  Copy,
  Gift,
  History,
  Lock,
  LogOut,
  Mail,
  Phone,
  QrCode,
  RefreshCw,
  Settings,
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

type ClientTab = "overview" | "prizes" | "reservations" | "settings";

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
  firstName: string | null;
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
  return parsed.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
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
    id: getString(record, ["id"]) || `${code || label}-${Math.random().toString(36).slice(2)}`,
    source: "quiz",
    label,
    code,
    wonAt: getString(record, ["created_at", "submitted_at", "won_at", "inserted_at"]),
    claimed: getBoolean(record, ["is_claimed", "claimed"]) || !!getString(record, ["claimed_at", "redeemed_at", "used_at"]),
    score: getNumber(record, ["score", "correct_answers"]),
    totalQuestions: getNumber(record, ["total_questions", "totalQuestions"]),
    weekStart: getString(record, ["week_start", "weekStart"]),
    firstName: getString(record, ["first_name", "firstName"]),
  };
};

const buildHistoryPrize = (record: RawRecord): PrizeRecord | null => {
  const label = normalizePrizeLabel(getString(record, ["prize_type", "prize_won"]));
  const code = getString(record, ["prize_code", "code", "coupon_code"]);

  if (!code && label === "Gain quiz") return null;

  return {
    id: getString(record, ["id"]) || `${code || label}-${Math.random().toString(36).slice(2)}`,
    source: "history",
    label,
    code,
    wonAt: getString(record, ["won_at", "created_at", "inserted_at"]),
    claimed: getBoolean(record, ["is_claimed", "claimed"]) || !!getString(record, ["claimed_at", "redeemed_at", "used_at"]),
    score: getNumber(record, ["score"]),
    totalQuestions: getNumber(record, ["total_questions"]),
    weekStart: getString(record, ["week_start"]),
    firstName: null,
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
    <div className="rounded-[1.75rem] border border-caramel/15 bg-white/70 p-4 shadow-sm backdrop-blur">
      <Icon className="mb-3 h-7 w-7 text-caramel" />
      <p className="text-2xl font-bold text-espresso">{value}</p>
      <p className="text-sm font-semibold text-espresso/80">{label}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

function PrizeCard({ prize, highlight = false, onCopy }: { prize: PrizeRecord; highlight?: boolean; onCopy: (code: string) => void }) {
  const hasCode = !!prize.code;
  const scoreLabel = prize.score !== null && prize.totalQuestions
    ? `${prize.score}/${prize.totalQuestions}`
    : null;

  return (
    <div className={`rounded-[1.75rem] border p-4 shadow-sm ${highlight ? "border-caramel/40 bg-caramel/10" : "border-border/50 bg-white/70"}`}>
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

          {hasCode && (
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
  const { profile, user, signOut, refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<ClientTab>("overview");
  const [prizes, setPrizes] = useState<PrizeRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSyncLabel, setLastSyncLabel] = useState<string | null>(null);

  const email = normalizeEmail(user?.email);
  const phone = normalizePhone(profile?.phone);
  const displayName = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ").trim() || user?.user_metadata?.first_name || "Client fidèle";

  const fetchPrizes = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const quizQuery = async () => {
        if (!email) return [] as PrizeRecord[];

        const { data, error } = await (supabase as any)
          .from("quiz_participations")
          .select("*")
          .eq("email", email)
          .not("prize_won", "is", null);

        if (error) throw error;
        return ((data || []) as RawRecord[]).map(buildQuizPrize).filter(Boolean) as PrizeRecord[];
      };

      const historyQuery = async () => {
        const { data, error } = await (supabase as any)
          .from("prize_history")
          .select("*")
          .eq("user_id", user.id);

        if (error) throw error;
        return ((data || []) as RawRecord[]).map(buildHistoryPrize).filter(Boolean) as PrizeRecord[];
      };

      const [quizResult, historyResult] = await Promise.allSettled([quizQuery(), historyQuery()]);
      const merged = [
        ...(quizResult.status === "fulfilled" ? quizResult.value : []),
        ...(historyResult.status === "fulfilled" ? historyResult.value : []),
      ];

      if (quizResult.status === "rejected") {
        console.warn("[ClientDashboard] quiz rewards fetch failed:", quizResult.reason);
      }
      if (historyResult.status === "rejected") {
        console.warn("[ClientDashboard] prize history fetch failed:", historyResult.reason);
      }

      setPrizes(sortPrizes(dedupePrizes(merged)));
      setLastSyncLabel(new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }));
    } catch (error) {
      console.error("[ClientDashboard] rewards fetch failed:", error);
      toast.error("Impossible de charger vos gains pour le moment");
    } finally {
      setIsLoading(false);
    }
  }, [email, user]);

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

  const menuItems: { id: ClientTab; label: string; icon: typeof User }[] = [
    { id: "overview", label: "Aperçu", icon: User },
    { id: "prizes", label: "Mes gains", icon: Gift },
    { id: "reservations", label: "Réservations", icon: Calendar },
    { id: "settings", label: "Profil", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="relative overflow-hidden bg-gradient-to-br from-butter/70 via-ivory to-caramel/10 px-5 pb-7 pt-[calc(env(safe-area-inset-top)+4.75rem)]">
        <div className="absolute -right-16 top-10 h-40 w-40 rounded-full bg-caramel/20 blur-3xl" />
        <div className="absolute -left-10 bottom-0 h-32 w-32 rounded-full bg-terracotta/10 blur-2xl" />

        <div className="relative flex items-start gap-4">
          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full border-4 border-white/70 bg-white shadow-warm">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              <img src={logo} alt="La Crêperie" className="h-full w-full object-cover" />
            )}
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

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative mt-6 rounded-[1.75rem] border border-white/60 bg-white/75 p-4 shadow-sm backdrop-blur"
        >
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-caramel" />
              <span className="font-display text-lg font-bold text-espresso">Programme fidélité</span>
            </div>
            <span className="text-sm font-black text-caramel">{loyaltyPoints} pts</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-butter/60">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${loyaltyProgress}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full rounded-full bg-gradient-to-r from-caramel to-terracotta"
            />
          </div>
          <div className="mt-3 flex items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>{visitsUntilReward > 0 ? `Encore ${visitsUntilReward} visite${visitsUntilReward > 1 ? "s" : ""} pour un menu offert` : "Menu offert disponible"}</span>
            <span>{loyaltyVisits}/{LOYALTY_TARGET} visites</span>
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
                className={`flex min-w-fit items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition ${
                  active ? "border-caramel text-caramel" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
                {item.id === "prizes" && activePrizes.length > 0 && (
                  <span className="rounded-full bg-caramel px-1.5 py-0.5 text-[10px] text-white">{activePrizes.length}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <main className="mx-auto max-w-xl px-4 py-5">
        {activeTab === "overview" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {lastPrize && !lastPrize.claimed && (
              <PrizeCard prize={lastPrize} highlight onCopy={handleCopyCode} />
            )}

            <div className="grid grid-cols-2 gap-3">
              <StatCard icon={Star} label="Visites" value={loyaltyVisits} hint="Fidélité restaurant" />
              <StatCard icon={Gift} label="Gains" value={prizes.length} hint={`${activePrizes.length} à utiliser`} />
              <StatCard icon={WalletCards} label="Points" value={loyaltyPoints} hint="Cumul fidélité" />
              <StatCard icon={Ticket} label="Codes actifs" value={activePrizes.length} hint="À présenter en caisse" />
            </div>

            <button
              type="button"
              onClick={() => setActiveTab("prizes")}
              className="w-full rounded-[1.75rem] border border-caramel/20 bg-white/70 p-4 text-left shadow-sm transition-colors hover:bg-caramel/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <div className="flex items-center gap-3">
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${secretUnlocked ? "bg-herb/15 text-herb" : "bg-muted text-muted-foreground"}`}>
                  <Lock className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-display text-lg font-bold text-espresso">Carte secrète</h3>
                  <p className="text-sm text-muted-foreground">
                    {secretUnlocked ? `Débloquée${profile?.secret_menu_code ? ` · code ${profile.secret_menu_code}` : ""}` : "Débloquez-la avec le quiz ou un code restaurant"}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </button>

            <div className="rounded-[1.75rem] border border-border/60 bg-white/70 p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="flex items-center gap-2 font-display text-lg font-bold text-espresso">
                  <History className="h-5 w-5 text-caramel" />
                  Activité récente
                </h3>
                <Button variant="ghost" size="sm" onClick={refreshAll} disabled={isLoading} className="h-8 rounded-full">
                  <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
                  Actualiser
                </Button>
              </div>

              {prizes.length > 0 ? (
                <div className="space-y-2">
                  {prizes.slice(0, 3).map((prize) => (
                    <div key={prize.id} className="flex items-center justify-between gap-3 rounded-2xl bg-background/60 px-3 py-2.5">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-espresso">{prize.label}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(prize.wonAt)}</p>
                      </div>
                      <span className="font-mono text-sm font-bold text-caramel">{prize.code || "—"}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="rounded-2xl bg-background/60 px-3 py-4 text-center text-sm text-muted-foreground">
                  Aucun gain rattaché à ce compte pour l’instant. Les gains du quiz sont recherchés avec l’email connecté.
                </p>
              )}

              {lastSyncLabel && <p className="mt-3 text-center text-[11px] text-muted-foreground">Dernière synchronisation : {lastSyncLabel}</p>}
            </div>
          </motion.div>
        )}

        {activeTab === "prizes" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="rounded-[1.75rem] border border-caramel/15 bg-caramel/5 p-4">
              <h2 className="font-display text-xl font-black text-espresso">Mes gains</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Retrouvez ici les codes gagnés au quiz et les avantages à présenter à la caisse.
              </p>
            </div>

            {isLoading ? (
              <div className="rounded-[1.75rem] border border-border/60 bg-white/70 p-8 text-center text-muted-foreground">
                <RefreshCw className="mx-auto mb-3 h-8 w-8 animate-spin text-caramel" />
                Chargement des gains…
              </div>
            ) : prizes.length === 0 ? (
              <div className="rounded-[1.75rem] border border-border/60 bg-white/70 p-8 text-center">
                <Gift className="mx-auto mb-3 h-12 w-12 text-caramel/60" />
                <p className="font-semibold text-espresso">Aucun gain visible pour ce compte</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Connectez-vous avec le même email que celui utilisé à la fin du quiz pour rattacher vos gains.
                </p>
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

        {activeTab === "reservations" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="rounded-[1.75rem] border border-border/60 bg-white/70 p-5 text-center shadow-sm">
              <Calendar className="mx-auto mb-3 h-12 w-12 text-caramel" />
              <h2 className="font-display text-xl font-black text-espresso">Réserver une table</h2>
              <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                La réservation se fait via le calendrier officiel de la crêperie. Gardez votre code gain sous la main si vous venez l’utiliser.
              </p>
              <Button asChild className="mt-5 w-full rounded-full">
                <a href={BOOKING_LINK} target="_blank" rel="noopener noreferrer">
                  <Calendar className="mr-2 h-4 w-4" />
                  Réserver maintenant
                </a>
              </Button>
            </div>
          </motion.div>
        )}

        {activeTab === "settings" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="rounded-[1.75rem] border border-border/60 bg-white/70 p-4 shadow-sm">
              <h2 className="mb-4 font-display text-xl font-black text-espresso">Informations client</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3 rounded-2xl bg-background/60 px-3 py-3">
                  <User className="h-5 w-5 text-caramel" />
                  <div>
                    <p className="text-xs text-muted-foreground">Nom affiché</p>
                    <p className="font-semibold text-espresso">{displayName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-2xl bg-background/60 px-3 py-3">
                  <Mail className="h-5 w-5 text-caramel" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="truncate font-semibold text-espresso">{user?.email || "—"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-2xl bg-background/60 px-3 py-3">
                  <Phone className="h-5 w-5 text-caramel" />
                  <div>
                    <p className="text-xs text-muted-foreground">Téléphone</p>
                    <p className="font-semibold text-espresso">{phone || "Non renseigné"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-2xl bg-background/60 px-3 py-3">
                  <Sparkles className="h-5 w-5 text-caramel" />
                  <div>
                    <p className="text-xs text-muted-foreground">Menu secret</p>
                    <p className="font-semibold text-espresso">
                      {secretUnlocked ? `Débloqué${profile?.secret_menu_code ? ` · ${profile.secret_menu_code}` : ""}` : "Non débloqué"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Button variant="outline" className="w-full rounded-full" onClick={refreshAll} disabled={isLoading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              Actualiser mon compte
            </Button>
            <Button variant="destructive" className="w-full rounded-full" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Se déconnecter
            </Button>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default ClientDashboard;
