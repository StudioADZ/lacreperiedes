import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  CheckCircle,
  CreditCard,
  Database,
  Gift,
  Home,
  LayoutDashboard,
  Loader2,
  Lock,
  LogIn,
  LogOut,
  Mail,
  Newspaper,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TicketCheck,
  Trophy,
  UtensilsCrossed,
  Users,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import confetti from "canvas-confetti";
import ActusLivePanel from "@/components/admin/ActusLivePanel";
import SplashSettingsPanel from "@/components/admin/SplashSettingsPanel";
import QuizStatsPanel from "@/components/admin/QuizStatsPanel";
import CarteMenuPanel from "@/components/admin/CarteMenuPanel";
import MessagesPanel from "@/components/admin/MessagesPanel";
import PaymentQRPanel from "@/components/admin/PaymentQRPanel";
import CustomerDirectoryPanel from "@/components/admin/CustomerDirectoryPanel";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

type AdminTab = "dashboard" | "scan" | "messages" | "clients" | "quiz" | "carte" | "actus" | "payment" | "splash";
type AdminGroup = "Pilotage" | "Caisse" | "Données" | "Contenu" | "Réglages";

type VerifyResult = {
  valid: boolean;
  id?: string;
  firstName?: string;
  prize?: string;
  weekNumber?: number;
  claimed?: boolean;
  claimedAt?: string;
  error?: string;
  message?: string;
};

type DashboardStats = {
  weekStart: string | null;
  totalParticipations: number;
  totalWinners: number;
  totalClaimed: number;
};

const ADMIN_TABS: { id: AdminTab; group: AdminGroup; label: string; description: string; icon: LucideIcon }[] = [
  { id: "dashboard", group: "Pilotage", label: "Tableau de bord", description: "Vue générale", icon: LayoutDashboard },
  { id: "scan", group: "Caisse", label: "Validation", description: "Contrôler les gains", icon: TicketCheck },
  { id: "messages", group: "Caisse", label: "Messages", description: "Demandes clients", icon: Mail },
  { id: "clients", group: "Données", label: "Clients", description: "Fiches clients", icon: Database },
  { id: "quiz", group: "Données", label: "Quiz", description: "Vue complète", icon: BarChart3 },
  { id: "carte", group: "Contenu", label: "Menu secret", description: "Création & code", icon: UtensilsCrossed },
  { id: "actus", group: "Contenu", label: "Actus & réseaux", description: "Publications sociales", icon: Newspaper },
  { id: "payment", group: "Réglages", label: "Paiement", description: "Réglages paiement", icon: CreditCard },
  { id: "splash", group: "Réglages", label: "Accueil", description: "Splash screen", icon: Sparkles },
];

const ADMIN_GROUPS: AdminGroup[] = ["Pilotage", "Caisse", "Données", "Contenu", "Réglages"];

const Admin = () => {
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [accountEmail, setAccountEmail] = useState<string | null>(null);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [claimLoading, setClaimLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState("");

  const verifyAdminSession = useCallback(async () => {
    setAuthLoading(true);
    setAuthError("");
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user?.id || !session.access_token) {
        setIsSignedIn(false);
        setAdminToken(null);
        setAccountEmail(null);
        return;
      }

      setIsSignedIn(true);
      setAccountEmail(session.user.email ?? null);

      const { data: hasAdminRole, error } = await supabase.rpc("has_role", {
        _user_id: session.user.id,
        _role: "admin",
      });

      if (error || !hasAdminRole) {
        setAdminToken(null);
        return;
      }

      setAdminToken(session.access_token);
    } catch {
      setAdminToken(null);
      setAuthError("Impossible de vérifier les droits administrateur.");
    } finally {
      setAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    void verifyAdminSession();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      void verifyAdminSession();
    });
    return () => subscription.unsubscribe();
  }, [verifyAdminSession]);

  const handleGoogleLogin = async () => {
    setAuthError("");
    setAuthLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/admin` },
    });

    if (error) {
      setAuthError(error.message || "Connexion Google impossible");
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setAdminToken(null);
    setAccountEmail(null);
    setIsSignedIn(false);
    setDashboardStats(null);
    setManualCode("");
    setResult(null);
    setLastScannedCode(null);
  };

  const adminRequest = useCallback(async (payload: Record<string, unknown>) => {
    if (!adminToken) throw new Error("Session administrateur expirée");
    const response = await fetch(`${SUPABASE_URL}/functions/v1/admin-scan`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (response.status === 401 || response.status === 403) {
      setAdminToken(null);
      throw new Error(data.message || "Session administrateur expirée");
    }
    if (!response.ok) throw new Error(data.message || "Une erreur est survenue");
    return { response, data };
  }, [adminToken]);

  const loadDashboard = useCallback(async () => {
    if (!adminToken) return;
    setDashboardLoading(true);
    setDashboardError("");
    try {
      const { data } = await adminRequest({ action: "stats" });
      setDashboardStats({
        weekStart: data.weekStart || null,
        totalParticipations: Number(data.totalParticipations || 0),
        totalWinners: Number(data.totalWinners || 0),
        totalClaimed: Number(data.totalClaimed || 0),
      });
    } catch (error) {
      setDashboardError(error instanceof Error ? error.message : "Tableau de bord indisponible");
    } finally {
      setDashboardLoading(false);
    }
  }, [adminRequest, adminToken]);

  useEffect(() => {
    if (adminToken) void loadDashboard();
  }, [adminToken, loadDashboard]);

  const handleVerify = useCallback(async (code: string) => {
    const normalized = code.trim().toUpperCase();
    if (!normalized || normalized === lastScannedCode) return;
    setLastScannedCode(normalized);
    setIsLoading(true);
    setResult(null);
    setManualCode(normalized);
    try {
      const { data } = await adminRequest({ action: "verify", code: normalized });
      setResult(data);
      if (data.valid && !data.claimed) confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
    } catch (error) {
      setResult({ valid: false, message: error instanceof Error ? error.message : "Erreur de connexion" });
    } finally {
      setIsLoading(false);
    }
  }, [adminRequest, lastScannedCode]);

  const handleClaim = async () => {
    if (!result?.id) return;
    setClaimLoading(true);
    try {
      const { data } = await adminRequest({ action: "claim", code: manualCode.toUpperCase() });
      if (data.success) {
        setResult((previous) => previous ? { ...previous, claimed: true, claimedAt: new Date().toISOString() } : null);
        toast.success("Gain marqué comme utilisé");
        void loadDashboard();
      } else {
        toast.error(data.message || "Validation impossible");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Validation impossible");
    } finally {
      setClaimLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setManualCode("");
    setLastScannedCode(null);
  };

  if (authLoading) {
    return <main className="flex min-h-screen items-center justify-center" role="status"><Loader2 className="h-9 w-9 animate-spin text-caramel" /><span className="sr-only">Vérification de l’accès administrateur</span></main>;
  }

  if (!isSignedIn) return <AdminLogin authError={authError} isLoading={authLoading} onGoogleLogin={handleGoogleLogin} />;
  if (!adminToken) return <AccessDenied email={accountEmail} onLogout={handleLogout} />;

  const currentTab = ADMIN_TABS.find((tab) => tab.id === activeTab) ?? ADMIN_TABS[0];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#23140f] via-[hsl(35_45%_92%)] to-background px-4 pb-24 pt-20">
      <div className="mx-auto max-w-2xl space-y-5">
        <AdminHeader currentTab={currentTab} adminEmail={accountEmail} onLogout={handleLogout} />
        <AdminNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
        <section className="overflow-hidden rounded-[2rem] border border-caramel/20 bg-white/90 shadow-warm backdrop-blur">
          <div className="border-b border-caramel/10 bg-gradient-to-r from-butter/45 via-white to-caramel/10 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-caramel text-white"><currentTab.icon className="h-6 w-6" aria-hidden="true" /></div>
              <div><p className="text-xs font-black uppercase tracking-[0.18em] text-caramel">{currentTab.group}</p><h2 className="font-display text-xl font-black text-espresso">{currentTab.label}</h2><p className="text-sm text-muted-foreground">{currentTab.description}</p></div>
            </div>
          </div>
          <div className="p-4 sm:p-5">
            {activeTab === "dashboard" && <DashboardPanel stats={dashboardStats} isLoading={dashboardLoading} error={dashboardError} onRefresh={loadDashboard} onNavigate={setActiveTab} />}
            {activeTab === "clients" && <CustomerDirectoryPanel adminPassword={adminToken} />}
            {activeTab === "quiz" && <QuizStatsPanel adminPassword={adminToken} />}
            {activeTab === "carte" && <CarteMenuPanel adminPassword={adminToken} />}
            {activeTab === "messages" && <MessagesPanel adminPassword={adminToken} />}
            {activeTab === "payment" && <PaymentQRPanel adminPassword={adminToken} />}
            {activeTab === "scan" && <ValidationPanel result={result} manualCode={manualCode} isLoading={isLoading} claimLoading={claimLoading} onManualCodeChange={setManualCode} onVerify={handleVerify} onClaim={handleClaim} onReset={handleReset} />}
            {activeTab === "actus" && <ActusLivePanel adminPassword={adminToken} />}
            {activeTab === "splash" && <SplashSettingsPanel adminPassword={adminToken} />}
          </div>
        </section>
      </div>
    </div>
  );
};

const DashboardPanel = ({ stats, isLoading, error, onRefresh, onNavigate }: { stats: DashboardStats | null; isLoading: boolean; error: string; onRefresh: () => void; onNavigate: (tab: AdminTab) => void }) => {
  const weekLabel = stats?.weekStart ? new Date(`${stats.weekStart}T12:00:00`).toLocaleDateString("fr-FR", { day: "numeric", month: "long" }) : "semaine en cours";
  const remaining = Math.max((stats?.totalWinners || 0) - (stats?.totalClaimed || 0), 0);
  const metrics = [
    { label: "Participations", value: stats?.totalParticipations ?? 0, detail: `Depuis le ${weekLabel}`, icon: Users },
    { label: "Gagnants", value: stats?.totalWinners ?? 0, detail: "Cette semaine", icon: Trophy },
    { label: "Gains utilisés", value: stats?.totalClaimed ?? 0, detail: "Validés en caisse", icon: CheckCircle },
    { label: "À utiliser", value: remaining, detail: "Gains encore actifs", icon: Gift },
  ];

  const quickActions: { tab: AdminTab; label: string; description: string; icon: LucideIcon }[] = [
    { tab: "scan", label: "Valider un gain", description: "Contrôler un code client", icon: TicketCheck },
    { tab: "messages", label: "Voir les messages", description: "Traiter les demandes", icon: Mail },
    { tab: "clients", label: "Ouvrir les clients", description: "Consulter les profils", icon: Database },
    { tab: "carte", label: "Menu secret", description: "Préparer la semaine", icon: UtensilsCrossed },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-3xl border border-caramel/15 bg-gradient-to-br from-white via-butter/25 to-caramel/10 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div><p className="text-xs font-black uppercase tracking-[0.18em] text-caramel">Cockpit opérationnel</p><h3 className="mt-1 font-display text-2xl font-black text-espresso">Bonjour, voici l’essentiel.</h3><p className="mt-1 text-sm text-muted-foreground">Les chiffres affichés proviennent directement de la base de la crêperie.</p></div>
        <Button type="button" variant="outline" onClick={onRefresh} disabled={isLoading} className="rounded-2xl"><RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />Actualiser</Button>
      </div>

      {error && <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-sm font-semibold text-destructive">{error}</div>}

      <div className="grid grid-cols-2 gap-3">
        {metrics.map(({ label, value, detail, icon: Icon }) => (
          <div key={label} className="rounded-3xl border border-caramel/12 bg-white p-4 shadow-sm">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-caramel/10 text-caramel"><Icon className="h-5 w-5" /></div>
            <p className="font-display text-3xl font-black text-espresso">{isLoading && !stats ? "—" : value}</p>
            <p className="mt-1 text-sm font-black text-espresso">{label}</p>
            <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
          </div>
        ))}
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-caramel">Actions rapides</p><h3 className="font-display text-xl font-black text-espresso">Que veux-tu faire ?</h3></div><ShieldCheck className="h-6 w-6 text-herb" /></div>
        <div className="grid gap-3 sm:grid-cols-2">
          {quickActions.map(({ tab, label, description, icon: Icon }) => (
            <button key={tab} type="button" onClick={() => onNavigate(tab)} className="group flex items-center gap-3 rounded-3xl border border-border/60 bg-background/75 p-4 text-left transition hover:border-caramel/35 hover:bg-white">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-caramel/10 text-caramel"><Icon className="h-5 w-5" /></div>
              <div className="min-w-0 flex-1"><p className="font-display font-black text-espresso">{label}</p><p className="text-xs text-muted-foreground">{description}</p></div>
              <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-caramel" />
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-3xl border border-herb/20 bg-herb/10 p-4"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-herb" /><div><p className="text-sm font-black text-espresso">Session administrateur sécurisée</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">Le rôle administrateur est vérifié avant chaque action sensible et les opérations importantes sont journalisées.</p></div></div>
    </div>
  );
};

const AdminLogin = ({ authError, isLoading, onGoogleLogin }: { authError: string; isLoading: boolean; onGoogleLogin: () => void }) => (
  <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#23140f] via-[hsl(35_45%_92%)] to-background px-4 pb-24 pt-20">
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
      <div className="rounded-[2rem] bg-gradient-to-br from-espresso via-[#2b1811] to-caramel p-6 text-center text-white shadow-elevated"><div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-white/12 text-butter"><Lock className="h-8 w-8" /></div><p className="text-xs font-bold uppercase tracking-[0.18em] text-white/70">Espace privé</p><h1 className="mt-1 font-display text-3xl font-black">Administration</h1><p className="mt-2 text-sm leading-relaxed text-white/78">Cet espace est réservé à l’équipe autorisée de La Crêperie des Saveurs.</p></div>
      <div className="mt-4 rounded-[2rem] border border-caramel/15 bg-white/95 p-5 shadow-warm"><div className="mb-5 flex items-start gap-3 rounded-2xl bg-caramel/10 p-3"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-caramel" /><p className="text-xs leading-relaxed text-muted-foreground">Connexion sécurisée avec Google. Aucun mot de passe administrateur n’est demandé sur cette page.</p></div><Button type="button" onClick={onGoogleLogin} disabled={isLoading} className="h-13 w-full rounded-2xl bg-caramel font-black text-white hover:bg-caramel/90">{isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><LogIn className="mr-2 h-5 w-5" />Se connecter avec Google</>}</Button>{authError && <p className="mt-3 rounded-xl bg-destructive/10 p-3 text-center text-xs font-semibold text-destructive">{authError}</p>}<Button asChild variant="outline" className="mt-3 h-12 w-full rounded-2xl font-bold"><Link to="/"><Home className="mr-2 h-4 w-4" />Retour au site</Link></Button></div>
    </motion.div>
  </main>
);

const AccessDenied = ({ email, onLogout }: { email: string | null; onLogout: () => void }) => (
  <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#23140f] via-[hsl(35_45%_92%)] to-background px-4 pb-24 pt-20"><motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm rounded-[2rem] border border-caramel/15 bg-white/95 p-6 text-center shadow-warm"><div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-destructive/10 text-destructive"><XCircle className="h-8 w-8" /></div><p className="text-xs font-black uppercase tracking-[0.18em] text-caramel">Accès refusé</p><h1 className="mt-2 font-display text-3xl font-black text-espresso">Compte non autorisé</h1><p className="mt-3 text-sm leading-relaxed text-muted-foreground">Le compte {email ? <strong>{email}</strong> : "connecté"} ne possède pas le rôle administrateur.</p><Button type="button" onClick={onLogout} className="mt-6 h-12 w-full rounded-2xl bg-caramel font-black text-white">Changer de compte</Button><Button asChild variant="outline" className="mt-3 h-12 w-full rounded-2xl font-bold"><Link to="/"><Home className="mr-2 h-4 w-4" />Retour au site</Link></Button></motion.div></main>
);

const AdminHeader = ({ currentTab, adminEmail, onLogout }: { currentTab: { group: AdminGroup; label: string; icon: LucideIcon }; adminEmail: string | null; onLogout: () => void }) => {
  const Icon = currentTab.icon;
  return <section className="rounded-[2rem] bg-gradient-to-br from-espresso via-[#2b1811] to-caramel p-5 text-white shadow-elevated"><div className="flex items-start justify-between gap-4"><div><div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em]"><LayoutDashboard className="h-3.5 w-3.5 text-butter" />Panel Admin</div><h1 className="font-display text-3xl font-black">Gestion premium</h1><p className="mt-2 text-sm text-white/78">{currentTab.group} · {currentTab.label}</p><p className="mt-1 text-xs text-white/55">{adminEmail}</p></div><div className="flex gap-2"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/12 text-butter"><Icon className="h-6 w-6" /></div><button type="button" onClick={onLogout} className="rounded-2xl border border-white/20 bg-white/10 p-3" aria-label="Déconnexion administrateur"><LogOut className="h-5 w-5" /></button></div></div></section>;
};

const AdminNavigation = ({ activeTab, setActiveTab }: { activeTab: AdminTab; setActiveTab: (tab: AdminTab) => void }) => (
  <section className="rounded-[2rem] border border-caramel/15 bg-white/85 p-3 shadow-warm"><div className="space-y-4">{ADMIN_GROUPS.map((group) => <div key={group}><p className="mb-2 px-1 text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">{group}</p><div className="grid grid-cols-2 gap-2">{ADMIN_TABS.filter((tab) => tab.group === group).map((tab) => { const Icon = tab.icon; const active = activeTab === tab.id; return <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={`rounded-2xl border p-3 text-left ${active ? "border-caramel bg-caramel text-white" : "border-border/60 bg-background/75 text-espresso"}`}><div className={`mb-2 flex h-9 w-9 items-center justify-center rounded-xl ${active ? "bg-white/18" : "bg-caramel/10 text-caramel"}`}><Icon className="h-4 w-4" /></div><p className="font-display text-sm font-black">{tab.label}</p><p className={`mt-0.5 text-[10px] ${active ? "text-white/72" : "text-muted-foreground"}`}>{tab.description}</p></button>; })}</div></div>)}</div></section>
);

const ValidationPanel = ({ result, manualCode, isLoading, claimLoading, onManualCodeChange, onVerify, onClaim, onReset }: { result: VerifyResult | null; manualCode: string; isLoading: boolean; claimLoading: boolean; onManualCodeChange: (code: string) => void; onVerify: (code: string) => void; onClaim: () => void; onReset: () => void }) => (
  <div className="space-y-5">{!result && <div className="rounded-3xl border border-border/55 bg-background/70 p-4"><Label htmlFor="code" className="mb-2 flex items-center gap-2 font-bold"><TicketCheck className="h-4 w-4 text-caramel" />Saisie manuelle</Label><div className="flex gap-2"><Input id="code" value={manualCode} onChange={(event) => onManualCodeChange(event.target.value.toUpperCase())} onKeyDown={(event) => event.key === "Enter" && onVerify(manualCode)} placeholder="XXXXXXXX" className="h-12 rounded-2xl font-mono text-lg tracking-wider" maxLength={8} /><Button onClick={() => onVerify(manualCode)} disabled={isLoading || !manualCode.trim()} className="h-12 rounded-2xl bg-caramel font-bold text-white">{isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Contrôler"}</Button></div></div>}<AnimatePresence mode="wait">{result && <ValidationResult result={result} claimLoading={claimLoading} onClaim={onClaim} onReset={onReset} />}</AnimatePresence></div>
);

const ValidationResult = ({ result, claimLoading, onClaim, onReset }: { result: VerifyResult; claimLoading: boolean; onClaim: () => void; onReset: () => void }) => {
  const usable = result.valid && !result.claimed;
  return <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className={`rounded-[2rem] border p-6 text-center ${usable ? "border-herb/35 bg-herb/10" : result.valid ? "border-border/70 bg-muted/35" : "border-destructive/25 bg-destructive/10"}`}><div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-white/70">{usable ? <CheckCircle className="h-10 w-10 text-herb" /> : result.valid ? <AlertCircle className="h-10 w-10 text-muted-foreground" /> : <XCircle className="h-10 w-10 text-destructive" />}</div>{result.valid ? <><div className="mb-4 font-black">{result.claimed ? "Déjà utilisé" : "Gain valide"}</div><h2 className="font-display text-2xl font-black text-espresso">{result.firstName}</h2><p className="mt-1 text-sm text-muted-foreground">Semaine {result.weekNumber}</p><div className="my-5 inline-flex items-center gap-3 rounded-2xl border border-caramel/20 bg-white/70 px-5 py-4"><Gift className="h-6 w-6 text-caramel" /><span className="font-display text-xl font-black">{result.prize}</span></div>{usable && <Button onClick={onClaim} className="h-14 w-full rounded-2xl bg-herb font-black text-white" disabled={claimLoading}>{claimLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Marquer comme utilisé"}</Button>}</> : <><h2 className="font-display text-xl font-black text-destructive">Code refusé</h2><p className="mt-2 text-sm text-muted-foreground">{result.message || "Code invalide"}</p></>}<Button variant="outline" onClick={onReset} className="mt-5 rounded-2xl font-bold">Nouveau contrôle</Button></motion.div>;
};

export default Admin;
