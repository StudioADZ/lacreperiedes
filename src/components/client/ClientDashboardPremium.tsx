import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Calendar,
  CheckCircle2,
  Copy,
  Gift,
  LogOut,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Save,
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
import { getWeeklyCode, hasWonThisWeek } from "@/features/quiz/services/localCodes";
import { toast } from "sonner";
import logo from "@/assets/logo.png";

type ClientTab = "overview" | "rewards" | "loyalty" | "profile";
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

function StatCard({ icon: Icon, label, value, hint }: { icon: typeof Star; label: string; value: string | number; hint: string }) {
  return (
    <div className="rounded-[1.5rem] border border-caramel/15 bg-white/80 p-4 shadow-sm">
      <Icon className="mb-3 h-6 w-6 text-caramel" aria-hidden="true" />
      <p className="text-2xl font-black text-espresso">{value}</p>
      <p className="text-sm font-semibold text-espresso/80">{label}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

function PrizeCard({ prize, onCopy }: { prize: PrizeRecord; onCopy: (code: string) => void }) {
  const sourceLabel: Record<PrizeSource, string> = {
    profile: "Profil client",
    history: "Historique fidélité",
    device: "Ce téléphone",
  };

  return (
    <article className="rounded-[1.5rem] border border-border/60 bg-white/80 p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${prize.claimed ? "bg-herb/15 text-herb" : "bg-caramel/15 text-caramel"}`}>
          {prize.claimed ? <CheckCircle2 className="h-6 w-6" aria-hidden="true" /> : <Ticket className="h-6 w-6" aria-hidden="true" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-display text-lg font-bold text-espresso">{prize.label}</h3>
              <p className="text-xs text-muted-foreground">{formatDate(prize.wonAt)}</p>
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
                className="mt-1 inline-flex min-h-11 items-center gap-2 rounded-xl px-2 py-1 font-mono text-xl font-black tracking-[0.16em] text-espresso focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label={`Copier le code ${prize.code}`}
              >
                {prize.code}
                <Copy className="h-4 w-4 text-caramel" aria-hidden="true" />
              </button>
              <p className="mt-1 text-xs text-muted-foreground">Présentez ce code à la caisse.</p>
            </div>
          )}

          <p className="mt-3 text-[11px] text-muted-foreground">Source : {sourceLabel[prize.source]}</p>
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

  const fetchPrizes = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      const items: PrizeRecord[] = [];

      if (profile?.secret_menu_unlocked && profile.secret_menu_code) {
        items.push({
          id: `profile-secret-${profile.secret_menu_code}`,
          source: "profile",
          label: "Carte secrète débloquée",
          code: profile.secret_menu_code,
          wonAt: profile.secret_menu_unlocked_at || null,
          claimed: false,
        });
      }

      const { data, error } = await (supabase as any)
        .from("prize_history")
        .select("*")
        .eq("user_id", user.id)
        .order("won_at", { ascending: false })
        .limit(30);

      if (error) throw error;

      ((data || []) as RawRecord[]).forEach((record) => {
        const label = normalizePrizeLabel(getString(record, ["prize_type", "prize_won"]));
        const code = getString(record, ["prize_code", "code", "coupon_code"]);
        if (!code && label === "Gain fidélité") return;
        items.push({
          id: getString(record, ["id"]) || `${code || label}-${getString(record, ["won_at", "created_at"]) || "history"}`,
          source: "history",
          label,
          code,
          wonAt: getString(record, ["won_at", "created_at", "inserted_at"]),
          claimed: getBoolean(record, ["is_claimed", "claimed", "prize_claimed"]) || Boolean(getString(record, ["claimed_at", "redeemed_at", "used_at"])),
        });
      });

      const deviceCode = getWeeklyCode();
      if (hasWonThisWeek() && deviceCode) {
        items.push({
          id: `device-weekly-${deviceCode}`,
          source: "device",
          label: "Gain quiz de la semaine",
          code: deviceCode,
          wonAt: null,
          claimed: false,
        });
      }

      const deduped = items.filter((item, index, all) => all.findIndex((candidate) => (candidate.code || candidate.id) === (item.code || item.id)) === index);
      setPrizes(deduped);
    } catch (error) {
      console.error("[ClientDashboardPremium] rewards fetch failed:", error);
      toast.error("Impossible de charger vos gains pour le moment");
    } finally {
      setIsLoading(false);
    }
  }, [profile, user]);

  useEffect(() => {
    void fetchPrizes();
  }, [fetchPrizes]);

  const refreshAll = async () => {
    await refreshProfile();
    await fetchPrizes();
    toast.success("Espace client actualisé");
  };

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
      await refreshProfile();
      toast.success("Profil mis à jour");
    } catch (error) {
      console.error("[ClientDashboardPremium] profile update failed:", error);
      toast.error("Impossible de modifier le profil");
    } finally {
      setProfileSaving(false);
    }
  };

  const loyaltyVisits = profile?.total_visits || 0;
  const loyaltyPoints = profile?.loyalty_points || 0;
  const loyaltyProgress = Math.min((loyaltyVisits / LOYALTY_TARGET) * 100, 100);
  const visitsUntilReward = Math.max(LOYALTY_TARGET - loyaltyVisits, 0);
  const activePrizes = prizes.filter((prize) => !prize.claimed);
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
      <header className="relative overflow-hidden bg-gradient-to-br from-butter/70 via-ivory to-caramel/10 px-5 pb-7 pt-[calc(env(safe-area-inset-top)+4.75rem)]">
        <div className="relative flex items-start gap-4">
          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full border-4 border-white/70 bg-white shadow-warm">
            <img src={profile?.avatar_url || logo} alt="Avatar du compte client" className="h-full w-full object-cover" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-white/70 px-2.5 py-1 text-[11px] font-semibold text-caramel">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" /> Compte client sécurisé
            </p>
            <h1 className="font-display text-2xl font-black leading-tight text-espresso">Bonjour {displayName}</h1>
            <p className="mt-1 truncate text-sm text-muted-foreground">{user?.email}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={signOut} aria-label="Se déconnecter" className="rounded-full bg-white/60">
            <LogOut className="h-5 w-5" aria-hidden="true" />
          </Button>
        </div>

        <div className="relative mt-6 rounded-[1.5rem] border border-white/60 bg-white/80 p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2"><Trophy className="h-5 w-5 text-caramel" aria-hidden="true" /><span className="font-display text-lg font-bold text-espresso">Fidélité validée</span></div>
            <span className="text-sm font-black text-caramel">{loyaltyPoints} pts</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-butter/60" aria-label={`${loyaltyVisits} visites validées sur ${LOYALTY_TARGET}`}>
            <div className="h-full rounded-full bg-gradient-to-r from-caramel to-terracotta" style={{ width: `${loyaltyProgress}%` }} />
          </div>
          <div className="mt-3 flex items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>{visitsUntilReward > 0 ? `Encore ${visitsUntilReward} visite${visitsUntilReward > 1 ? "s" : ""} validée${visitsUntilReward > 1 ? "s" : ""}` : "Récompense disponible"}</span>
            <span>{loyaltyVisits}/{LOYALTY_TARGET}</span>
          </div>
        </div>
      </header>

      <nav className="sticky top-0 z-30 border-b border-border/70 bg-background/95 backdrop-blur" aria-label="Sections de l’espace client">
        <div className="flex overflow-x-auto px-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button key={item.id} type="button" onClick={() => setActiveTab(item.id)} aria-current={active ? "page" : undefined} className={`flex min-h-12 min-w-fit items-center gap-2 border-b-2 px-4 text-sm font-semibold ${active ? "border-caramel text-caramel" : "border-transparent text-muted-foreground"}`}>
                <Icon className="h-4 w-4" aria-hidden="true" />{item.label}
                {item.id === "rewards" && activePrizes.length > 0 && <span className="rounded-full bg-caramel px-1.5 py-0.5 text-[10px] text-white">{activePrizes.length}</span>}
              </button>
            );
          })}
        </div>
      </nav>

      <main className="mx-auto max-w-xl px-4 py-5">
        {activeTab === "overview" && (
          <motion.div initial={prefersReducedMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="flex items-start justify-between gap-3 rounded-[1.5rem] border border-caramel/15 bg-white/80 p-4 shadow-sm">
              <div><h2 className="font-display text-xl font-black text-espresso">Votre tableau de bord</h2><p className="mt-1 text-sm text-muted-foreground">Retrouvez ici vos avantages réellement enregistrés.</p></div>
              <Button variant="ghost" size="icon" onClick={refreshAll} disabled={isLoading} aria-label="Actualiser l’espace client"><RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} aria-hidden="true" /></Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <StatCard icon={Calendar} label="Visites" value={loyaltyVisits} hint="Validées par la crêperie" />
              <StatCard icon={Gift} label="Gains" value={prizes.length} hint={`${activePrizes.length} à utiliser`} />
              <StatCard icon={WalletCards} label="Points" value={loyaltyPoints} hint="Solde enregistré" />
              <StatCard icon={User} label="Profil" value={`${profileCompletion}%`} hint="Informations complétées" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Button asChild className="h-12 rounded-full"><Link to="/reserver"><Calendar className="mr-2 h-4 w-4" aria-hidden="true" />Réserver une table</Link></Button>
              <Button variant="outline" className="h-12 rounded-full" onClick={() => setActiveTab("profile")}><User className="mr-2 h-4 w-4" aria-hidden="true" />Compléter mon profil</Button>
            </div>
          </motion.div>
        )}

        {activeTab === "rewards" && (
          <motion.div initial={prefersReducedMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="rounded-[1.5rem] border border-caramel/15 bg-caramel/5 p-4"><h2 className="font-display text-xl font-black text-espresso">Mes gains</h2><p className="mt-1 text-sm text-muted-foreground">Seuls les gains rattachés à votre compte ou à ce téléphone sont affichés.</p></div>
            {isLoading ? <div className="rounded-[1.5rem] border border-border/60 bg-white/80 p-8 text-center text-muted-foreground"><RefreshCw className="mx-auto mb-3 h-8 w-8 animate-spin text-caramel" aria-hidden="true" />Chargement des gains…</div> : prizes.length === 0 ? <div className="rounded-[1.5rem] border border-border/60 bg-white/80 p-8 text-center"><Gift className="mx-auto mb-3 h-12 w-12 text-caramel/60" aria-hidden="true" /><p className="font-semibold text-espresso">Aucun gain disponible</p><p className="mt-1 text-sm text-muted-foreground">Participez au quiz ou demandez à l’équipe de vérifier votre fidélité.</p></div> : prizes.map((prize) => <PrizeCard key={prize.id} prize={prize} onCopy={handleCopyCode} />)}
          </motion.div>
        )}

        {activeTab === "loyalty" && (
          <motion.div initial={prefersReducedMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="rounded-[1.5rem] border border-border/60 bg-white/80 p-5 shadow-sm">
              <div className="flex items-center gap-3"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-caramel/15 text-caramel"><Trophy className="h-7 w-7" aria-hidden="true" /></div><div><h2 className="font-display text-xl font-black text-espresso">Ma fidélité</h2><p className="text-sm text-muted-foreground">Les points sont ajoutés après validation par la crêperie.</p></div></div>
              <div className="mt-5 rounded-2xl bg-background/60 p-4"><div className="mb-2 flex justify-between text-sm font-semibold text-espresso"><span>{loyaltyVisits} visite{loyaltyVisits > 1 ? "s" : ""} validée{loyaltyVisits > 1 ? "s" : ""}</span><span>{visitsUntilReward} restante{visitsUntilReward > 1 ? "s" : ""}</span></div><div className="h-3 overflow-hidden rounded-full bg-butter/70"><div className="h-full rounded-full bg-gradient-to-r from-caramel to-terracotta" style={{ width: `${loyaltyProgress}%` }} /></div><p className="mt-2 text-xs text-muted-foreground">À {LOYALTY_TARGET} visites validées, une récompense peut être attribuée selon le programme en cours.</p></div>
              <div className="mt-5 grid gap-3"><Button asChild className="h-12 rounded-full"><Link to="/reserver"><Calendar className="mr-2 h-4 w-4" aria-hidden="true" />Réserver maintenant</Link></Button><a href="tel:+33259660176" className="inline-flex h-12 items-center justify-center rounded-full border border-input bg-background px-4 text-sm font-medium"><Phone className="mr-2 h-4 w-4" aria-hidden="true" />Contacter la crêperie</a></div>
              <p className="mt-3 text-center text-[11px] text-muted-foreground">Aucun point ne peut être ajouté manuellement depuis cet écran.</p>
            </div>
          </motion.div>
        )}

        {activeTab === "profile" && (
          <motion.div initial={prefersReducedMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="rounded-[1.5rem] border border-border/60 bg-white/80 p-4 shadow-sm">
              <h2 className="font-display text-xl font-black text-espresso">Mon profil</h2><p className="mt-1 text-sm text-muted-foreground">Ces informations servent à retrouver vos gains et mieux préparer votre accueil.</p>
              <div className="mt-4 space-y-3">
                <div className="grid grid-cols-2 gap-3"><label className="space-y-1 text-sm font-semibold text-espresso">Prénom<input value={firstName} onChange={(event) => setFirstName(event.target.value)} className="min-h-11 w-full rounded-2xl border border-border/60 bg-background/60 px-3 py-3 text-sm outline-none focus:border-caramel" autoComplete="given-name" /></label><label className="space-y-1 text-sm font-semibold text-espresso">Nom<input value={lastName} onChange={(event) => setLastName(event.target.value)} className="min-h-11 w-full rounded-2xl border border-border/60 bg-background/60 px-3 py-3 text-sm outline-none focus:border-caramel" autoComplete="family-name" /></label></div>
                <label className="block space-y-1 text-sm font-semibold text-espresso">Téléphone<div className="relative"><Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" /><input value={phoneInput} onChange={(event) => setPhoneInput(event.target.value)} className="min-h-11 w-full rounded-2xl border border-border/60 bg-background/60 py-3 pl-10 pr-3 text-sm outline-none focus:border-caramel" placeholder="06 00 00 00 00" inputMode="tel" autoComplete="tel" /></div></label>
                <label className="block space-y-1 text-sm font-semibold text-espresso">Ville<div className="relative"><MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" /><input value={city} onChange={(event) => setCity(event.target.value)} className="min-h-11 w-full rounded-2xl border border-border/60 bg-background/60 py-3 pl-10 pr-3 text-sm outline-none focus:border-caramel" placeholder="Mamers" autoComplete="address-level2" /></div></label>
                <div className="rounded-2xl bg-background/60 px-3 py-3"><p className="text-xs text-muted-foreground">Email de connexion</p><p className="truncate font-semibold text-espresso"><Mail className="mr-2 inline h-4 w-4 text-caramel" aria-hidden="true" />{user?.email || "—"}</p></div>
                <div className="rounded-2xl bg-background/60 px-3 py-3"><p className="text-xs text-muted-foreground">Carte secrète</p><p className="font-semibold text-espresso"><Sparkles className="mr-2 inline h-4 w-4 text-caramel" aria-hidden="true" />{profile?.secret_menu_unlocked ? "Débloquée" : "Non débloquée"}</p></div>
              </div>
            </div>
            <Button className="h-12 w-full rounded-full" onClick={handleSaveProfile} disabled={profileSaving}>{profileSaving ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="mr-2 h-4 w-4" aria-hidden="true" />}Enregistrer mon profil</Button>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default ClientDashboardPremium;
