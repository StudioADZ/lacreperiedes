import { useState, useRef, useCallback, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  BarChart3,
  Camera,
  CameraOff,
  CheckCircle,
  CreditCard,
  Database,
  Gift,
  LayoutDashboard,
  Loader2,
  Lock,
  LogOut,
  Mail,
  Newspaper,
  Scan,
  ShieldCheck,
  Sparkles,
  UtensilsCrossed,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import confetti from "canvas-confetti";
import QRScanner from "@/components/admin/QRScanner";
import ActusLivePanel from "@/components/admin/ActusLivePanel";
import SplashSettingsPanel from "@/components/admin/SplashSettingsPanel";
import QuizStatsPanel from "@/components/admin/QuizStatsPanel";
import CarteMenuPanel from "@/components/admin/CarteMenuPanel";
import MessagesPanel from "@/components/admin/MessagesPanel";
import PaymentQRPanel from "@/components/admin/PaymentQRPanel";
import CustomerDirectoryPanel from "@/components/admin/CustomerDirectoryPanel";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

type AdminTab = "scan" | "messages" | "clients" | "quiz" | "carte" | "actus" | "payment" | "splash";
type AdminGroup = "Caisse" | "Données" | "Contenu" | "Réglages";

interface VerifyResult {
  valid: boolean;
  id?: string;
  firstName?: string;
  prize?: string;
  weekNumber?: number;
  weekStart?: string;
  claimed?: boolean;
  claimedAt?: string;
  createdAt?: string;
  error?: string;
  message?: string;
}

const ADMIN_TABS: { id: AdminTab; group: AdminGroup; label: string; description: string; icon: LucideIcon }[] = [
  { id: "scan", group: "Caisse", label: "Scanner", description: "Valider les gains", icon: Scan },
  { id: "messages", group: "Caisse", label: "Messages", description: "Demandes clients", icon: Mail },
  { id: "clients", group: "Données", label: "Clients", description: "Base alphabétique", icon: Database },
  { id: "quiz", group: "Données", label: "Quiz", description: "Stats et lots", icon: BarChart3 },
  { id: "carte", group: "Contenu", label: "Carte", description: "Menu et photos", icon: UtensilsCrossed },
  { id: "actus", group: "Contenu", label: "Actus", description: "Infos en direct", icon: Newspaper },
  { id: "payment", group: "Réglages", label: "Paiement", description: "QR paiement", icon: CreditCard },
  { id: "splash", group: "Réglages", label: "Splash", description: "Écran d’accueil", icon: Sparkles },
];

const ADMIN_GROUPS: AdminGroup[] = ["Caisse", "Données", "Contenu", "Réglages"];

const Admin = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [manualCode, setManualCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [claimLoading, setClaimLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>("scan");
  const [scannerActive, setScannerActive] = useState(false);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);

  const storedPassword = useRef("");

  const handleLogin = async () => {
    setAuthError("");
    setIsLoading(true);
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/admin-scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "stats", adminPassword: password }),
      });
      const data = await response.json();
      if (!response.ok) {
        setAuthError(data.message || "Mot de passe incorrect");
        return;
      }
      storedPassword.current = password;
      setIsAuthenticated(true);
    } catch (error) {
      setAuthError("Erreur de connexion");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    storedPassword.current = "";
    setPassword("");
    setIsAuthenticated(false);
    setManualCode("");
    setResult(null);
    setScannerActive(false);
    setLastScannedCode(null);
  };

  const handleVerify = useCallback(async (code: string) => {
    if (!code.trim()) return;
    if (code.toUpperCase() === lastScannedCode) return;
    setLastScannedCode(code.toUpperCase());
    setIsLoading(true);
    setResult(null);
    setManualCode(code.toUpperCase());
    setScannerActive(false);
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/admin-scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify", code: code.toUpperCase(), adminPassword: storedPassword.current }),
      });
      const data = await response.json();
      setResult(data);
      if (data.valid && !data.claimed) {
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 }, colors: ["#b8860b", "#daa520", "#ffd700", "#228b22"] });
      }
    } catch (error) {
      setResult({ valid: false, error: "connection_error", message: "Erreur de connexion" });
    } finally {
      setIsLoading(false);
    }
  }, [lastScannedCode]);

  const handleClaim = async () => {
    if (!result?.id) return;
    setClaimLoading(true);
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/admin-scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "claim", code: manualCode.toUpperCase(), adminPassword: storedPassword.current }),
      });
      const data = await response.json();
      if (data.success) {
        setResult((prev) => (prev ? { ...prev, claimed: true, claimedAt: new Date().toISOString() } : null));
        confetti({ particleCount: 50, spread: 45, origin: { y: 0.7 }, colors: ["#228b22", "#32cd32", "#90ee90"] });
      }
    } catch (error) {
      console.error("Claim error:", error);
    } finally {
      setClaimLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setManualCode("");
    setLastScannedCode(null);
  };

  if (!isAuthenticated) {
    return <AdminLogin password={password} setPassword={setPassword} authError={authError} isLoading={isLoading} onLogin={handleLogin} />;
  }

  const currentTab = ADMIN_TABS.find((tab) => tab.id === activeTab) ?? ADMIN_TABS[0];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#23140f] via-[hsl(35_45%_92%)] to-background px-4 pb-24 pt-20">
      <div className="mx-auto max-w-xl space-y-5">
        <AdminHeader currentTab={currentTab} onLogout={handleLogout} />
        <AdminNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
        <section className="overflow-hidden rounded-[2rem] border border-caramel/20 bg-white/85 shadow-warm backdrop-blur">
          <div className="border-b border-caramel/10 bg-gradient-to-r from-butter/45 via-white to-caramel/10 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-caramel text-white shadow-sm">
                <currentTab.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-caramel">{currentTab.group}</p>
                <h2 className="font-display text-xl font-black text-espresso">{currentTab.label}</h2>
                <p className="text-sm text-muted-foreground">{currentTab.description}</p>
              </div>
            </div>
          </div>
          <div className="p-4">
            {activeTab === "clients" && <CustomerDirectoryPanel adminPassword={storedPassword.current} />}
            {activeTab === "quiz" && <QuizStatsPanel adminPassword={storedPassword.current} />}
            {activeTab === "carte" && <CarteMenuPanel adminPassword={storedPassword.current} />}
            {activeTab === "messages" && <MessagesPanel adminPassword={storedPassword.current} />}
            {activeTab === "payment" && <PaymentQRPanel adminPassword={storedPassword.current} />}
            {activeTab === "scan" && (
              <ScanPanel result={result} manualCode={manualCode} isLoading={isLoading} claimLoading={claimLoading} scannerActive={scannerActive} onManualCodeChange={setManualCode} onScannerToggle={() => setScannerActive((value) => !value)} onVerify={handleVerify} onClaim={handleClaim} onReset={handleReset} />
            )}
            {activeTab === "actus" && <ActusLivePanel adminPassword={storedPassword.current} />}
            {activeTab === "splash" && <SplashSettingsPanel adminPassword={storedPassword.current} />}
          </div>
        </section>
      </div>
    </div>
  );
};

const AdminLogin = ({ password, setPassword, authError, isLoading, onLogin }: { password: string; setPassword: (value: string) => void; authError: string; isLoading: boolean; onLogin: () => void }) => (
  <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#23140f] via-[hsl(35_45%_92%)] to-background px-4 pb-24 pt-20">
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
      <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-espresso via-[#2b1811] to-caramel p-5 text-white shadow-elevated">
        <div className="absolute -right-14 -top-14 h-40 w-40 rounded-full bg-white/10 blur-sm" />
        <div className="relative text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-white/12 text-butter"><Lock className="h-8 w-8" /></div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/70">Accès personnel</p>
          <h1 className="mt-1 font-display text-3xl font-black">Panel Admin</h1>
          <p className="mt-2 text-sm leading-relaxed text-white/78">Poste de pilotage privé de La Crêperie des Saveurs.</p>
        </div>
      </div>
      <div className="mt-4 rounded-[2rem] border border-caramel/15 bg-white/85 p-5 shadow-warm backdrop-blur">
        <div className="mb-4 flex items-start gap-3 rounded-2xl bg-caramel/10 p-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-caramel" />
          <p className="text-xs leading-relaxed text-muted-foreground">Le mot de passe est vérifié par Supabase. La session admin n’est pas persistée.</p>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe admin</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && onLogin()} placeholder="••••••••" className={`h-12 rounded-2xl ${authError ? "border-destructive" : ""}`} />
            {authError && <p className="text-xs font-semibold text-destructive">{authError}</p>}
          </div>
          <Button onClick={onLogin} className="h-12 w-full rounded-2xl bg-caramel font-black text-white hover:bg-caramel/90" disabled={isLoading || !password}>{isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Connexion admin"}</Button>
        </div>
      </div>
    </motion.div>
  </div>
);

const AdminHeader = ({ currentTab, onLogout }: { currentTab: { group: AdminGroup; label: string; icon: LucideIcon }; onLogout: () => void }) => {
  const Icon = currentTab.icon;
  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-espresso via-[#2b1811] to-caramel p-5 text-white shadow-elevated">
      <div className="absolute -right-14 -top-14 h-40 w-40 rounded-full bg-white/10 blur-sm" />
      <div className="absolute -bottom-16 -left-16 h-44 w-44 rounded-full bg-butter/10 blur-sm" />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-white/90 backdrop-blur"><LayoutDashboard className="h-3.5 w-3.5 text-butter" />Panel Admin</div>
          <h1 className="font-display text-3xl font-black leading-tight">Gestion premium</h1>
          <p className="mt-2 text-sm leading-relaxed text-white/78">Module actif : {currentTab.group} · {currentTab.label}</p>
        </div>
        <div className="flex gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/12 text-butter"><Icon className="h-6 w-6" /></div>
          <button type="button" onClick={onLogout} className="rounded-2xl border border-white/20 bg-white/10 p-3 text-white/85 transition hover:bg-white/15" aria-label="Déconnexion admin"><LogOut className="h-5 w-5" /></button>
        </div>
      </div>
    </section>
  );
};

const AdminNavigation = ({ activeTab, setActiveTab }: { activeTab: AdminTab; setActiveTab: (tab: AdminTab) => void }) => (
  <section className="rounded-[2rem] border border-caramel/15 bg-white/85 p-3 shadow-warm backdrop-blur">
    <div className="space-y-4">
      {ADMIN_GROUPS.map((group) => (
        <div key={group}>
          <p className="mb-2 px-1 text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">{group}</p>
          <div className="grid grid-cols-2 gap-2">
            {ADMIN_TABS.filter((tab) => tab.group === group).map((tab) => <AdminNavButton key={tab.id} tab={tab} active={activeTab === tab.id} onClick={() => setActiveTab(tab.id)} />)}
          </div>
        </div>
      ))}
    </div>
  </section>
);

const AdminNavButton = ({ tab, active, onClick }: { tab: { id: AdminTab; label: string; description: string; icon: LucideIcon }; active: boolean; onClick: () => void }) => {
  const Icon = tab.icon;
  return (
    <button type="button" onClick={onClick} className={`rounded-2xl border p-3 text-left transition ${active ? "border-caramel bg-caramel text-white shadow-sm" : "border-border/60 bg-background/75 text-espresso hover:border-caramel/40 hover:bg-white"}`}>
      <div className={`mb-2 flex h-9 w-9 items-center justify-center rounded-xl ${active ? "bg-white/18 text-white" : "bg-caramel/10 text-caramel"}`}><Icon className="h-4 w-4" /></div>
      <p className="font-display text-sm font-black">{tab.label}</p>
      <p className={`mt-0.5 text-[10px] leading-tight ${active ? "text-white/72" : "text-muted-foreground"}`}>{tab.description}</p>
    </button>
  );
};

const ScanPanel = ({ result, manualCode, isLoading, claimLoading, scannerActive, onManualCodeChange, onScannerToggle, onVerify, onClaim, onReset }: { result: VerifyResult | null; manualCode: string; isLoading: boolean; claimLoading: boolean; scannerActive: boolean; onManualCodeChange: (code: string) => void; onScannerToggle: () => void; onVerify: (code: string) => void; onClaim: () => void; onReset: () => void }) => (
  <div className="space-y-5">
    {!result && <ScannerCard scannerActive={scannerActive} onScannerToggle={onScannerToggle} onVerify={onVerify} />}
    {!result && <ManualCodeCard manualCode={manualCode} isLoading={isLoading} onManualCodeChange={onManualCodeChange} onVerify={onVerify} />}
    <AnimatePresence mode="wait">{result && <ScanResult result={result} claimLoading={claimLoading} onClaim={onClaim} onReset={onReset} />}</AnimatePresence>
  </div>
);

const ScannerCard = ({ scannerActive, onScannerToggle, onVerify }: { scannerActive: boolean; onScannerToggle: () => void; onVerify: (code: string) => void }) => (
  <div className="rounded-3xl border border-border/55 bg-background/70 p-4">
    <div className="mb-4 flex items-center justify-between gap-3">
      <Label className="flex items-center gap-2 font-bold"><Camera className="h-4 w-4 text-caramel" />Scanner QR</Label>
      <Button variant={scannerActive ? "destructive" : "outline"} size="sm" onClick={onScannerToggle} className="rounded-2xl">{scannerActive ? <><CameraOff className="mr-1 h-4 w-4" />Arrêter</> : <><Camera className="mr-1 h-4 w-4" />Activer</>}</Button>
    </div>
    {scannerActive ? <QRScanner onScan={onVerify} isActive={scannerActive} /> : <div className="flex aspect-square flex-col items-center justify-center rounded-3xl border border-dashed border-caramel/25 bg-butter/20 text-muted-foreground"><Camera className="mb-3 h-12 w-12 opacity-35" /><p className="text-sm font-semibold">Activez la caméra pour scanner un QR code</p></div>}
  </div>
);

const ManualCodeCard = ({ manualCode, isLoading, onManualCodeChange, onVerify }: { manualCode: string; isLoading: boolean; onManualCodeChange: (code: string) => void; onVerify: (code: string) => void }) => (
  <div className="rounded-3xl border border-border/55 bg-background/70 p-4">
    <Label htmlFor="code" className="mb-2 flex items-center gap-2 font-bold"><Scan className="h-4 w-4 text-caramel" />Saisie manuelle</Label>
    <div className="flex gap-2">
      <Input id="code" value={manualCode} onChange={(e) => onManualCodeChange(e.target.value.toUpperCase())} onKeyDown={(e) => e.key === "Enter" && onVerify(manualCode)} placeholder="XXXXXXXX" className="h-12 rounded-2xl font-mono text-lg tracking-wider" maxLength={8} />
      <Button onClick={() => onVerify(manualCode)} disabled={isLoading || !manualCode.trim()} className="h-12 rounded-2xl bg-caramel font-bold text-white hover:bg-caramel/90">{isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Vérifier"}</Button>
    </div>
  </div>
);

const ScanResult = ({ result, claimLoading, onClaim, onReset }: { result: VerifyResult; claimLoading: boolean; onClaim: () => void; onReset: () => void }) => {
  const isValidUnused = result.valid && !result.claimed;
  const isClaimed = result.valid && result.claimed;
  return (
    <motion.div key={result.valid ? "valid" : "invalid"} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} className={`rounded-[2rem] border p-6 text-center shadow-sm ${isValidUnused ? "border-herb/35 bg-herb/10" : isClaimed ? "border-border/70 bg-muted/35" : "border-destructive/25 bg-destructive/10"}`}>
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }} className={`mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full ${isValidUnused ? "bg-herb/10" : isClaimed ? "bg-background" : "bg-destructive/10"}`}>{isValidUnused ? <CheckCircle className="h-10 w-10 text-herb" /> : isClaimed ? <AlertCircle className="h-10 w-10 text-muted-foreground" /> : <XCircle className="h-10 w-10 text-destructive" />}</motion.div>
      {result.valid ? <><div className={`mb-4 inline-block rounded-full px-4 py-2 text-sm font-black ${result.claimed ? "bg-muted text-muted-foreground" : "bg-herb/10 text-herb"}`}>{result.claimed ? "Déjà utilisé" : "Gain valide"}</div><h2 className="font-display text-2xl font-black text-espresso">{result.firstName}</h2><p className="mt-1 text-sm text-muted-foreground">Semaine {result.weekNumber}</p><div className="my-5 inline-flex items-center gap-3 rounded-2xl border border-caramel/20 bg-white/70 px-5 py-4"><Gift className="h-6 w-6 text-caramel" /><span className="font-display text-xl font-black text-primary">{result.prize}</span></div>{!result.claimed && <Button onClick={onClaim} className="h-14 w-full rounded-2xl bg-herb font-black text-white hover:bg-herb/90" disabled={claimLoading}>{claimLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Marquer comme utilisé"}</Button>}{result.claimed && result.claimedAt && <p className="text-sm text-muted-foreground">Utilisé le {new Date(result.claimedAt).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}</p>}</> : <><h2 className="font-display text-xl font-black text-destructive">Code invalide</h2><p className="mt-2 text-sm text-muted-foreground">{result.message || "Ce code n’existe pas"}</p></>}
      <Button variant="outline" onClick={onReset} className="mt-5 rounded-2xl font-bold">Nouveau scan</Button>
    </motion.div>
  );
};

export default Admin;
