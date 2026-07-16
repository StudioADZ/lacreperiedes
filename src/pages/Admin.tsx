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
  UtensilsCrossed,
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

export type DashboardStats = {
  weekStart: string | null;
  totalParticipations: number;
  totalWinners: number;
  totalClaimed: number;
  totalClients: number;
  reservationsToday: number;
  upcomingReservations: number;
  unreadMessages: number;
  visibleSocialPosts: number;
  totalSocialInteractions: number;
  secretMenuActive: boolean;
  secretMenuName: string | null;
  secretMenuValidTo: string | null;
  publicMenuActive: boolean;
  splashActive: boolean;
  stock: {
    galetteRemaining: number;
    galetteTotal: number;
    crepeRemaining: number;
    crepeTotal: number;
    formuleRemaining: number;
    formuleTotal: number;
  } | null;
};

type AdminTabDefinition = {
  id: AdminTab;
  label: string;
  description: string;
  icon: LucideIcon;
};

const ADMIN_TABS: AdminTabDefinition[] = [
  { id: "dashboard", label: "Tableau de bord", description: "Vue d’ensemble", icon: LayoutDashboard },
  { id: "scan", label: "Validation", description: "Contrôler les gains", icon: TicketCheck },
  { id: "messages", label: "Messages", description: "Demandes clients", icon: Mail },
  { id: "clients", label: "Clients", description: "Fiches clients", icon: Database },
  { id: "quiz", label: "Quiz", description: "Statistiques", icon: BarChart3 },
  { id: "carte", label: "Proposition du moment", description: "Créations après quiz", icon: UtensilsCrossed },
  { id: "actus", label: "Actus & réseaux", description: "Publications", icon: Newspaper },
  { id: "payment", label: "Paiement", description: "Réglages paiement", icon: CreditCard },
  { id: "splash", label: "Accueil", description: "Écran d’arrivée", icon: Sparkles },
];

const numberValue = (value: unknown) => Number(value || 0);

const normalizeDashboardStats = (data: Record<string, unknown>): DashboardStats => {
  const rawStock = data.stock && typeof data.stock === "object" ? data.stock as Record<string, unknown> : null;
  return {
    weekStart: typeof data.weekStart === "string" ? data.weekStart : null,
    totalParticipations: numberValue(data.totalParticipations),
    totalWinners: numberValue(data.totalWinners),
    totalClaimed: numberValue(data.totalClaimed),
    totalClients: numberValue(data.totalClients),
    reservationsToday: numberValue(data.reservationsToday),
    upcomingReservations: numberValue(data.upcomingReservations),
    unreadMessages: numberValue(data.unreadMessages),
    visibleSocialPosts: numberValue(data.visibleSocialPosts),
    totalSocialInteractions: numberValue(data.totalSocialInteractions),
    secretMenuActive: data.secretMenuActive === true,
    secretMenuName: typeof data.secretMenuName === "string" ? data.secretMenuName : null,
    secretMenuValidTo: typeof data.secretMenuValidTo === "string" ? data.secretMenuValidTo : null,
    publicMenuActive: data.publicMenuActive === true,
    splashActive: data.splashActive === true,
    stock: rawStock ? {
      galetteRemaining: numberValue(rawStock.galette_remaining),
      galetteTotal: numberValue(rawStock.galette_total),
      crepeRemaining: numberValue(rawStock.crepe_remaining),
      crepeTotal: numberValue(rawStock.crepe_total),
      formuleRemaining: numberValue(rawStock.formule_complete_remaining),
      formuleTotal: numberValue(rawStock.formule_complete_total),
    } : null,
  };
};

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
      const response = await fetch(`${SUPABASE_URL}/functions/v1/admin-overview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminPassword: password }),
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
      setDashboardStats(normalizeDashboardStats(data));
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
    const functionName = payload.action === "stats" ? "admin-overview" : "admin-scan";
    const response = await fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
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
    return data as Record<string, unknown>;
  }, [adminCredential, authMode]);

  const loadDashboard = useCallback(async () => {
    if (!adminCredential) return;
    setDashboardLoading(true);
    setDashboardError("");
    try {
      const data = await adminRequest({ action: "stats" });
      setDashboardStats(normalizeDashboardStats(data));
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
      const verifyData = data as unknown as VerifyResult;
      setResult(verifyData);
      if (verifyData.valid && !verifyData.claimed) confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
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
      } else toast.error(typeof data.message === "string" ? data.message : "Validation impossible");
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
    <div className="min-h-screen bg-[hsl(35_35%_96%)] pb-10 pt-20">
      <div className="mx-auto flex w-full max-w-[1700px] items-start gap-2 px-2 sm:gap-3 sm:px-3">
        <AdminSidebar open={sidebarOpen} onToggle={() => setSidebarOpen((value) => !value)} activeTab={activeTab} setActiveTab={setActiveTab} />

        <section className="min-w-0 flex-1 overflow-hidden rounded-[1.5rem] border border-caramel/15 bg-white shadow-warm">
          <AdminWorkspaceHeader currentTab={currentTab} authMode={authMode} adminEmail={accountEmail} isLoading={dashboardLoading} onRefresh={loadDashboard} onLogout={handleLogout} />
          <div className="p-3 sm:p-5">
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
  );
};

const AdminSidebar = ({ open, onToggle, activeTab, setActiveTab }: { open: boolean; onToggle: () => void; activeTab: AdminTab; setActiveTab: (tab: AdminTab) => void }) => (
  <aside className={`sticky top-20 z-30 shrink-0 overflow-hidden rounded-[1.4rem] border border-caramel/15 bg-[#21140f] text-white shadow-elevated transition-[width] duration-300 ${open ? "w-48" : "w-14"}`} aria-label="Navigation de l’administration">
    <div className="flex flex-col">
      <div className={`flex items-center border-b border-white/10 p-2 ${open ? "justify-between" : "flex-col gap-2"}`}>
        <div className={`flex items-center ${open ? "gap-2" : "justify-center"}`}>
          <img src={logo} alt="La Crêperie des Saveurs" className="h-9 w-9 rounded-full object-cover ring-1 ring-white/15" />
          {open && <span className="font-display text-sm font-black">Administration</span>}
        </div>
        <button type="button" onClick={onToggle} className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-white/70 hover:bg-white/10 hover:text-white" aria-label={open ? "Réduire le menu admin" : "Ouvrir le menu admin"}>
          {open ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
        </button>
      </div>

      <nav className="space-y-1 p-1.5">
        {ADMIN_TABS.map((tab) => {
          const Icon = tab.icon;
          const selected = tab.id === activeTab;
          return (
            <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} title={!open ? tab.label : undefined} aria-current={selected ? "page" : undefined} className={`group relative flex w-full items-center rounded-xl transition ${open ? "gap-2 px-2 py-2" : "justify-center p-2"} ${selected ? "bg-caramel text-white shadow-md" : "text-white/65 hover:bg-white/10 hover:text-white"}`}>
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${selected ? "bg-white/15" : "bg-white/5 group-hover:bg-white/10"}`}><Icon className="h-4 w-4" /></span>
              {open && <span className="truncate text-left text-xs font-black">{tab.label}</span>}
              {selected && !open && <span className="absolute right-0 h-6 w-1 rounded-l-full bg-butter" />}
            </button>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-1.5">
        <Button asChild variant="ghost" className={`h-10 w-full rounded-xl text-white/65 hover:bg-white/10 hover:text-white ${open ? "justify-start px-2" : "justify-center px-0"}`}>
          <Link to="/" title={!open ? "Retour au site" : undefined}><Home className={`h-4 w-4 ${open ? "mr-2" : ""}`} />{open && "Retour au site"}</Link>
        </Button>
      </div>
    </div>
  </aside>
);

const AdminWorkspaceHeader = ({ currentTab, authMode, adminEmail, isLoading, onRefresh, onLogout }: { currentTab: AdminTabDefinition; authMode: AuthMode; adminEmail: string | null; isLoading: boolean; onRefresh: () => void; onLogout: () => void }) => {
  const Icon = currentTab.icon;
  return (
    <header className="flex flex-col gap-3 border-b border-caramel/10 bg-gradient-to-r from-butter/35 via-white to-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <div className="min-w-0">
        <div className="flex items-center gap-2 text-xs text-muted-foreground"><span className="font-bold">Administration</span><ChevronRight className="h-3.5 w-3.5" /><span className="truncate font-black text-espresso">{currentTab.label}</span></div>
        <div className="mt-1 flex items-center gap-2"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-caramel/10 text-caramel"><Icon className="h-4 w-4" /></span><div className="min-w-0"><h1 className="truncate font-display text-xl font-black text-espresso">{currentTab.label}</h1><p className="truncate text-xs text-muted-foreground">{currentTab.description}</p></div></div>
      </div>
      <div className="flex items-center gap-2">
        <span className="hidden max-w-56 truncate text-[10px] text-muted-foreground lg:block">{adminEmail} · {authMode === "password" ? "Accès secours" : "Google"}</span>
        <button type="button" onClick={onRefresh} className="rounded-xl border border-caramel/15 bg-white p-2.5 text-caramel hover:bg-caramel/5" aria-label="Actualiser"><RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} /></button>
        <button type="button" onClick={onLogout} className="rounded-xl border border-caramel/15 bg-white p-2.5 text-espresso hover:bg-caramel/5" aria-label="Déconnexion administrateur"><LogOut className="h-4 w-4" /></button>
      </div>
    </header>
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
