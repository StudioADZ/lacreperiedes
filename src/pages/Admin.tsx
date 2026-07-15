import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  BarChart3,
  CheckCircle,
  ChevronRight,
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
  PanelLeftClose,
  PanelLeftOpen,
  RefreshCw,
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
import logo from "@/assets/logo.png";
import ActusLivePanel from "@/components/admin/ActusLivePanel";
import SplashSettingsPanel from "@/components/admin/SplashSettingsPanel";
import QuizStatsPanel from "@/components/admin/QuizStatsPanel";
import CarteMenuPanel from "@/components/admin/CarteMenuPanel";
import MessagesPanel from "@/components/admin/MessagesPanel";
import PaymentQRPanel from "@/components/admin/PaymentQRPanel";
import CustomerDirectoryPanel from "@/components/admin/CustomerDirectoryPanel";
import AdminKPIDashboard from "@/components/admin/AdminKPIDashboard";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

type AdminTab = "dashboard" | "scan" | "messages" | "clients" | "quiz" | "carte" | "actus" | "payment" | "splash";
type AdminGroup = "Pilotage" | "Caisse" | "Données" | "Contenu" | "Réglages";
type AuthMode = "google" | "password" | null;

type VerifyResult = {
  valid: boolean;
  id?: string;
  firstName?: string;
  prize?: string;
  weekNumber?: number;
  claimed?: boolean;
  claimedAt?: string;
  message?: string;
};

type DashboardStats = {
  weekStart: string | null;
  totalParticipations: number;
  totalWinners: number;
  totalClaimed: number;
};

type AdminTabDefinition = {
  id: AdminTab;
  group: AdminGroup;
  label: string;
  description: string;
  icon: LucideIcon;
};

const ADMIN_TABS: AdminTabDefinition[] = [
  { id: "dashboard", group: "Pilotage", label: "Tableau de bord", description: "Vue KPI", icon: LayoutDashboard },
  { id: "scan", group: "Caisse", label: "Validation", description: "Contrôler les gains", icon: TicketCheck },
  { id: "messages", group: "Caisse", label: "Messages", description: "Demandes clients", icon: Mail },
  { id: "clients", group: "Données", label: "Clients", description: "Fiches clients", icon: Database },
  { id: "quiz", group: "Données", label: "Quiz", description: "Statistiques", icon: BarChart3 },
  { id: "carte", group: "Contenu", label: "Menu secret", description: "Création & code", icon: UtensilsCrossed },
  { id: "actus", group: "Contenu", label: "Actus & réseaux", description: "Publications", icon: Newspaper },
  { id: "payment", group: "Réglages", label: "Paiement", description: "Réglages paiement", icon: CreditCard },
  { id: "splash", group: "Réglages", label: "Accueil", description: "Écran d’arrivée", icon: Sparkles },
];

const ADMIN_GROUPS: AdminGroup[] = ["Pilotage", "Caisse", "Données", "Contenu", "Réglages"];
const percentage = (value: number, total: number) => (total > 0 ? Math.round((value / total) * 100) : 0);

const Admin = () => {
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  const [authMode, setAuthMode] = useState<AuthMode>(null);
  const [adminCredential, setAdminCredential] = useState<string | null>(null);
  const [accountEmail, setAccountEmail] = useState<string | null>(null);
  const [isGoogleSignedIn, setIsGoogleSignedIn] = useState(false);
  const [password, setPassword] = useState("");
  const passwordRef = useRef("");
  const [manualCode, setManualCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [claimLoading, setClaimLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState("");

  const verifyGoogleSession = useCallback(async () => {
    setAuthLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id || !session.access_token) {
        setIsGoogleSignedIn(false);
        if (authMode !== "password") {
          setAdminCredential(null);
          setAccountEmail(null);
          setAuthMode(null);
        }
        return;
      }

      setIsGoogleSignedIn(true);
      setAccountEmail(session.user.email ?? null);
      const { data: hasAdminRole, error } = await supabase.rpc("has_role", {
        _user_id: session.user.id,
        _role: "admin",
      });

      if (!error && hasAdminRole) {
        setAdminCredential(session.access_token);
        setAuthMode("google");
      } else if (authMode !== "password") {
        setAdminCredential(null);
      }
    } catch {
      if (authMode !== "password") setAuthError("Impossible de vérifier les droits administrateur.");
    } finally {
      setAuthLoading(false);
    }
  }, [authMode]);

  useEffect(() => {
    void verifyGoogleSession();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => void verifyGoogleSession());
    return () => subscription.unsubscribe();
  }, [verifyGoogleSession]);

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

  const handlePasswordLogin = async () => {
    if (!password.trim()) return;
    setAuthError("");
    setAuthLoading(true);
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/admin-scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "stats", adminPassword: password }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setAuthError(data.message || "Mot de passe administrateur incorrect");
        return;
      }
      passwordRef.current = password;
      setAdminCredential(password);
      setAuthMode("password");
      setAccountEmail("Accès par mot de passe administrateur");
      setIsGoogleSignedIn(false);
      setDashboardStats({
        weekStart: data.weekStart || null,
        totalParticipations: Number(data.totalParticipations || 0),
        totalWinners: Number(data.totalWinners || 0),
        totalClaimed: Number(data.totalClaimed || 0),
      });
      setPassword("");
      toast.success("Accès administrateur ouvert");
    } catch {
      setAuthError("Erreur de connexion au service administrateur");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    if (authMode === "google") await supabase.auth.signOut();
    passwordRef.current = "";
    setPassword("");
    setAdminCredential(null);
    setAccountEmail(null);
    setIsGoogleSignedIn(false);
    setAuthMode(null);
    setDashboardStats(null);
    setManualCode("");
    setResult(null);
    setLastScannedCode(null);
  };

  const adminRequest = useCallback(async (payload: Record<string, unknown>) => {
    if (!adminCredential) throw new Error("Session administrateur expirée");
    const passwordMode = authMode === "password";
    const response = await fetch(`${SUPABASE_URL}/functions/v1/admin-scan`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(passwordMode ? {} : { Authorization: `Bearer ${adminCredential}` }),
      },
      body: JSON.stringify(passwordMode ? { ...payload, adminPassword: passwordRef.current || adminCredential } : payload),
    });
    const data = await response.json().catch(() => ({}));
    if (response.status === 401 || response.status === 403) {
      setAdminCredential(null);
      setAuthMode(null);
      throw new Error(data.message || "Accès administrateur refusé");
    }
    if (!response.ok) throw new Error(data.message || "Une erreur est survenue");
    return data;
  }, [adminCredential, authMode]);

  const loadDashboard = useCallback(async () => {
    if (!adminCredential) return;
    setDashboardLoading(true);
    setDashboardError("");
    try {
      const data = await adminRequest({ action: "stats" });
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
  }, [adminCredential, adminRequest]);

  useEffect(() => {
    if (adminCredential && !dashboardStats) void loadDashboard();
  }, [adminCredential, dashboardStats, loadDashboard]);

  const handleVerify = useCallback(async (code: string) => {
    const normalized = code.trim().toUpperCase();
    if (!normalized || normalized === lastScannedCode) return;
    setLastScannedCode(normalized);
    setIsLoading(true);
    setResult(null);
    setManualCode(normalized);
    try {
      const data = await adminRequest({ action: "verify", code: normalized });
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
      const data = await adminRequest({ action: "claim", code: manualCode.toUpperCase() });
      if (data.success) {
        setResult((previous) => previous ? { ...previous, claimed: true, claimedAt: new Date().toISOString() } : null);
        toast.success("Gain marqué comme utilisé");
        void loadDashboard();
      } else toast.error(data.message || "Validation impossible");
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

  if (authLoading && !adminCredential) {
    return <main className="flex min-h-screen items-center justify-center" role="status"><Loader2 className="h-9 w-9 animate-spin text-caramel" /><span className="sr-only">Vérification de l’accès administrateur</span></main>;
  }

  if (!adminCredential && !isGoogleSignedIn) {
    return <AdminLogin password={password} setPassword={setPassword} authError={authError} isLoading={authLoading} onGoogleLogin={handleGoogleLogin} onPasswordLogin={handlePasswordLogin} />;
  }

  if (!adminCredential && isGoogleSignedIn) return <AccessDenied email={accountEmail} onLogout={handleLogout} />;

  const currentTab = ADMIN_TABS.find((tab) => tab.id === activeTab) ?? ADMIN_TABS[0];

  return (
    <div className="min-h-screen bg-[hsl(35_35%_96%)] pb-12 pt-20">
      <div className="mx-auto flex w-full max-w-[1500px] items-start gap-3 px-2 sm:gap-5 sm:px-4">
        <AdminSidebar open={sidebarOpen} onToggle={() => setSidebarOpen((value) => !value)} activeTab={activeTab} setActiveTab={setActiveTab} />

        <div className="min-w-0 flex-1 space-y-4">
          <AdminHero
            currentTab={currentTab}
            adminEmail={accountEmail}
            authMode={authMode}
            stats={dashboardStats}
            isLoading={dashboardLoading}
            onRefresh={loadDashboard}
            onLogout={handleLogout}
          />

          <section className="overflow-hidden rounded-[1.75rem] border border-caramel/15 bg-white shadow-warm">
            <AdminBreadcrumb currentTab={currentTab} />
            <div className="p-4 sm:p-6">
              {activeTab === "dashboard" && <AdminKPIDashboard stats={dashboardStats} isLoading={dashboardLoading} error={dashboardError} onRefresh={loadDashboard} onNavigate={setActiveTab} />}
              {activeTab === "clients" && <CustomerDirectoryPanel adminPassword={adminCredential!} />}
              {activeTab === "quiz" && <QuizStatsPanel adminPassword={adminCredential!} />}
              {activeTab === "carte" && <CarteMenuPanel adminPassword={adminCredential!} />}
              {activeTab === "messages" && <MessagesPanel adminPassword={adminCredential!} />}
              {activeTab === "payment" && <PaymentQRPanel adminPassword={adminCredential!} />}
              {activeTab === "scan" && <ValidationPanel result={result} manualCode={manualCode} isLoading={isLoading} claimLoading={claimLoading} onManualCodeChange={setManualCode} onVerify={handleVerify} onClaim={handleClaim} onReset={handleReset} />}
              {activeTab === "actus" && <ActusLivePanel adminPassword={adminCredential!} />}
              {activeTab === "splash" && <SplashSettingsPanel adminPassword={adminCredential!} />}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

const AdminSidebar = ({ open, onToggle, activeTab, setActiveTab }: { open: boolean; onToggle: () => void; activeTab: AdminTab; setActiveTab: (tab: AdminTab) => void }) => (
  <aside className={`sticky top-20 z-30 h-[calc(100vh-6rem)] shrink-0 overflow-hidden rounded-[1.75rem] border border-caramel/15 bg-[#21140f] text-white shadow-elevated transition-[width] duration-300 ${open ? "w-64" : "w-[4.75rem]"}`} aria-label="Navigation de l’administration">
    <div className="flex h-full flex-col">
      <div className={`flex items-center border-b border-white/10 p-3 ${open ? "justify-between" : "flex-col gap-3"}`}>
        <div className={`flex items-center ${open ? "gap-3" : "justify-center"}`}>
          <img src={logo} alt="La Crêperie des Saveurs" className="h-11 w-11 rounded-full object-cover ring-2 ring-white/15" />
          {open && <div><p className="font-display text-sm font-black">Administration</p><p className="text-[10px] uppercase tracking-[0.16em] text-white/50">Espace de travail</p></div>}
        </div>
        <button type="button" onClick={onToggle} className="rounded-xl border border-white/10 bg-white/5 p-2 text-white/75 hover:bg-white/10 hover:text-white" aria-label={open ? "Réduire le menu admin" : "Ouvrir le menu admin"}>
          {open ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto p-2">
        {ADMIN_GROUPS.map((group) => (
          <div key={group} className="mb-4">
            {open && <p className="mb-2 px-3 text-[9px] font-black uppercase tracking-[0.2em] text-white/35">{group}</p>}
            <div className="space-y-1">
              {ADMIN_TABS.filter((tab) => tab.group === group).map((tab) => {
                const Icon = tab.icon;
                const selected = tab.id === activeTab;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    title={!open ? tab.label : undefined}
                    aria-current={selected ? "page" : undefined}
                    className={`group relative flex w-full items-center rounded-2xl py-2.5 transition ${open ? "gap-3 px-3" : "justify-center px-2"} ${selected ? "bg-caramel text-white shadow-lg" : "text-white/65 hover:bg-white/8 hover:text-white"}`}
                  >
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${selected ? "bg-white/15" : "bg-white/5 group-hover:bg-white/10"}`}><Icon className="h-4 w-4" /></span>
                    {open && <span className="min-w-0 text-left"><span className="block truncate text-sm font-black">{tab.label}</span><span className={`block truncate text-[10px] ${selected ? "text-white/70" : "text-white/35"}`}>{tab.description}</span></span>}
                    {selected && !open && <span className="absolute right-0 h-7 w-1 rounded-l-full bg-butter" />}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 p-2">
        <Button asChild variant="ghost" className={`h-11 w-full rounded-2xl text-white/65 hover:bg-white/10 hover:text-white ${open ? "justify-start" : "justify-center px-0"}`}>
          <Link to="/" title={!open ? "Retour au site" : undefined}><Home className={`h-4 w-4 ${open ? "mr-3" : ""}`} />{open && "Retour au site"}</Link>
        </Button>
      </div>
    </div>
  </aside>
);

const AdminHero = ({ currentTab, adminEmail, authMode, stats, isLoading, onRefresh, onLogout }: { currentTab: AdminTabDefinition; adminEmail: string | null; authMode: AuthMode; stats: DashboardStats | null; isLoading: boolean; onRefresh: () => void; onLogout: () => void }) => {
  const participations = stats?.totalParticipations ?? 0;
  const winners = stats?.totalWinners ?? 0;
  const claimed = stats?.totalClaimed ?? 0;
  const remaining = Math.max(winners - claimed, 0);
  const winnerRate = percentage(winners, participations);
  const claimRate = percentage(claimed, winners);
  const metrics = [
    { label: "Participations", value: participations, icon: Users },
    { label: "Taux gagnants", value: `${winnerRate}%`, icon: Trophy },
    { label: "Utilisation", value: `${claimRate}%`, icon: CheckCircle },
    { label: "À utiliser", value: remaining, icon: Gift },
  ];

  return (
    <header className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-espresso via-[#2b1811] to-caramel text-white shadow-elevated">
      <div className="p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em]"><LayoutDashboard className="h-3.5 w-3.5 text-butter" />Gestion premium</div>
            <h1 className="mt-3 font-display text-3xl font-black sm:text-4xl">Pilotage de la crêperie</h1>
            <p className="mt-2 text-sm text-white/65">{currentTab.group} · {currentTab.label}</p>
            <p className="mt-1 text-xs text-white/45">{adminEmail} · {authMode === "password" ? "Accès secours" : "Google"}</p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={onRefresh} className="rounded-2xl border border-white/15 bg-white/10 p-3 text-white/75 hover:bg-white/15 hover:text-white" aria-label="Actualiser les KPI"><RefreshCw className={`h-5 w-5 ${isLoading ? "animate-spin" : ""}`} /></button>
            <button type="button" onClick={onLogout} className="rounded-2xl border border-white/15 bg-white/10 p-3 text-white/75 hover:bg-white/15 hover:text-white" aria-label="Déconnexion administrateur"><LogOut className="h-5 w-5" /></button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-2 lg:grid-cols-4">
          {metrics.map(({ label, value, icon: Icon }) => (
            <div key={label} className="rounded-2xl border border-white/10 bg-white/8 p-3 backdrop-blur-sm">
              <div className="flex items-center justify-between gap-2"><p className="text-[9px] font-black uppercase tracking-[0.14em] text-white/45">{label}</p><Icon className="h-4 w-4 text-butter" /></div>
              <p className="mt-2 font-display text-2xl font-black">{isLoading && !stats ? "—" : value}</p>
            </div>
          ))}
        </div>
      </div>
    </header>
  );
};

const AdminBreadcrumb = ({ currentTab }: { currentTab: AdminTabDefinition }) => {
  const Icon = currentTab.icon;
  return (
    <div className="flex items-center gap-2 border-b border-caramel/10 bg-gradient-to-r from-butter/35 via-white to-white px-4 py-3 sm:px-6">
      <span className="text-xs font-bold text-muted-foreground">Administration</span>
      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="text-xs font-bold text-muted-foreground">{currentTab.group}</span>
      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="inline-flex min-w-0 items-center gap-2 text-sm font-black text-espresso"><Icon className="h-4 w-4 shrink-0 text-caramel" /><span className="truncate">{currentTab.label}</span></span>
    </div>
  );
};

const AdminLogin = ({ password, setPassword, authError, isLoading, onGoogleLogin, onPasswordLogin }: { password: string; setPassword: (value: string) => void; authError: string; isLoading: boolean; onGoogleLogin: () => void; onPasswordLogin: () => void }) => (
  <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#23140f] via-[hsl(35_45%_92%)] to-background px-4 pb-24 pt-20">
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
      <div className="rounded-[2rem] bg-gradient-to-br from-espresso via-[#2b1811] to-caramel p-6 text-center text-white shadow-elevated"><div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-white/12 text-butter"><Lock className="h-8 w-8" /></div><p className="text-xs font-bold uppercase tracking-[0.18em] text-white/70">Espace privé</p><h1 className="mt-1 font-display text-3xl font-black">Administration</h1><p className="mt-2 text-sm leading-relaxed text-white/78">Accès réservé à l’équipe autorisée de La Crêperie des Saveurs.</p></div>
      <div className="mt-4 rounded-[2rem] border border-caramel/15 bg-white/95 p-5 shadow-warm">
        <Button type="button" onClick={onGoogleLogin} disabled={isLoading} className="h-12 w-full rounded-2xl bg-caramel font-black text-white hover:bg-caramel/90">{isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><LogIn className="mr-2 h-5 w-5" />Se connecter avec Google</>}</Button>
        <div className="my-5 flex items-center gap-3"><div className="h-px flex-1 bg-border" /><span className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">ou accès de secours</span><div className="h-px flex-1 bg-border" /></div>
        <form onSubmit={(event) => { event.preventDefault(); void onPasswordLogin(); }} className="space-y-3">
          <div className="space-y-2"><Label htmlFor="admin-password">Mot de passe administrateur</Label><Input id="admin-password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Saisir le mot de passe" className={`h-12 rounded-2xl ${authError ? "border-destructive" : ""}`} required /></div>
          <Button type="submit" variant="outline" disabled={isLoading || !password.trim()} className="h-12 w-full rounded-2xl border-caramel/30 font-black text-espresso hover:bg-caramel/10">{isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Lock className="mr-2 h-4 w-4" />Connexion par mot de passe</>}</Button>
        </form>
        {authError && <p className="mt-3 rounded-xl bg-destructive/10 p-3 text-center text-xs font-semibold text-destructive">{authError}</p>}
        <Button asChild variant="ghost" className="mt-3 h-11 w-full rounded-2xl font-bold"><Link to="/"><Home className="mr-2 h-4 w-4" />Retour au site</Link></Button>
      </div>
    </motion.div>
  </main>
);

const AccessDenied = ({ email, onLogout }: { email: string | null; onLogout: () => void }) => <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#23140f] via-[hsl(35_45%_92%)] to-background px-4 pb-24 pt-20"><motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm rounded-[2rem] border border-caramel/15 bg-white/95 p-6 text-center shadow-warm"><div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-destructive/10 text-destructive"><XCircle className="h-8 w-8" /></div><p className="text-xs font-black uppercase tracking-[0.18em] text-caramel">Accès refusé</p><h1 className="mt-2 font-display text-3xl font-black text-espresso">Compte non autorisé</h1><p className="mt-3 text-sm text-muted-foreground">Le compte {email ? <strong>{email}</strong> : "connecté"} ne possède pas le rôle administrateur.</p><Button type="button" onClick={onLogout} className="mt-6 h-12 w-full rounded-2xl bg-caramel font-black text-white">Changer de compte</Button></motion.div></main>;

const ValidationPanel = ({ result, manualCode, isLoading, claimLoading, onManualCodeChange, onVerify, onClaim, onReset }: { result: VerifyResult | null; manualCode: string; isLoading: boolean; claimLoading: boolean; onManualCodeChange: (code: string) => void; onVerify: (code: string) => void; onClaim: () => void; onReset: () => void }) => (
  <div className="space-y-5">{!result && <div className="rounded-3xl border border-border/55 bg-background/70 p-4"><Label htmlFor="code" className="mb-2 flex items-center gap-2 font-bold"><TicketCheck className="h-4 w-4 text-caramel" />Saisie manuelle</Label><div className="flex gap-2"><Input id="code" value={manualCode} onChange={(event) => onManualCodeChange(event.target.value.toUpperCase())} onKeyDown={(event) => event.key === "Enter" && onVerify(manualCode)} placeholder="XXXXXXXX" className="h-12 rounded-2xl font-mono text-lg tracking-wider" maxLength={8} /><Button onClick={() => onVerify(manualCode)} disabled={isLoading || !manualCode.trim()} className="h-12 rounded-2xl bg-caramel font-bold text-white">{isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Contrôler"}</Button></div></div>}<AnimatePresence mode="wait">{result && <ValidationResult result={result} claimLoading={claimLoading} onClaim={onClaim} onReset={onReset} />}</AnimatePresence></div>
);

const ValidationResult = ({ result, claimLoading, onClaim, onReset }: { result: VerifyResult; claimLoading: boolean; onClaim: () => void; onReset: () => void }) => {
  const usable = result.valid && !result.claimed;
  return <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className={`rounded-[2rem] border p-6 text-center ${usable ? "border-herb/35 bg-herb/10" : result.valid ? "border-border/70 bg-muted/35" : "border-destructive/25 bg-destructive/10"}`}><div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-white/70">{usable ? <CheckCircle className="h-10 w-10 text-herb" /> : result.valid ? <AlertCircle className="h-10 w-10 text-muted-foreground" /> : <XCircle className="h-10 w-10 text-destructive" />}</div>{result.valid ? <><div className="mb-4 font-black">{result.claimed ? "Déjà utilisé" : "Gain valide"}</div><h2 className="font-display text-2xl font-black text-espresso">{result.firstName}</h2><p className="mt-1 text-sm text-muted-foreground">Semaine {result.weekNumber}</p><div className="my-5 inline-flex items-center gap-3 rounded-2xl border border-caramel/20 bg-white/70 px-5 py-4"><Gift className="h-6 w-6 text-caramel" /><span className="font-display text-xl font-black">{result.prize}</span></div>{usable && <Button onClick={onClaim} className="h-14 w-full rounded-2xl bg-herb font-black text-white" disabled={claimLoading}>{claimLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Marquer comme utilisé"}</Button>}</> : <><h2 className="font-display text-xl font-black text-destructive">Code refusé</h2><p className="mt-2 text-sm text-muted-foreground">{result.message || "Code invalide"}</p></>}<Button variant="outline" onClick={onReset} className="mt-5 rounded-2xl font-bold">Nouveau contrôle</Button></motion.div>;
};

export default Admin;
