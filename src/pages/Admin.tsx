import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  CheckCircle,
  XCircle,
  Loader2,
  Gift,
  Calendar,
  Lock,
  Scan,
  BarChart3,
  AlertCircle,
  CameraOff,
  Newspaper,
  Sparkles,
  ChefHat,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import confetti from "canvas-confetti";
import QRScanner from "@/components/admin/QRScanner";
import ActusLivePanel from "@/components/admin/ActusLivePanel";
import SplashSettingsPanel from "@/components/admin/SplashSettingsPanel";
import SecretMenuPanel from "@/components/admin/SecretMenuPanel";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

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

interface Stats {
  weekStart: string;
  stock: {
    formule_complete_remaining: number;
    formule_complete_total: number;
    galette_remaining: number;
    galette_total: number;
    crepe_remaining: number;
    crepe_total: number;
  };
  totalParticipations: number;
  totalWinners: number;
  totalClaimed: number;
}

const Admin = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");

  const [manualCode, setManualCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [claimLoading, setClaimLoading] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [activeTab, setActiveTab] = useState<"scan" | "stats" | "actus" | "splash" | "menu">("scan");
  const [scannerActive, setScannerActive] = useState(false);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);

  const storedPassword = useRef("");

  // Check stored auth
  useEffect(() => {
    const stored = sessionStorage.getItem("admin_auth");
    if (stored) {
      storedPassword.current = stored;
      setIsAuthenticated(true);
      fetchStats(stored);
    }
  }, []);

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
        setIsLoading(false);
        return;
      }

      storedPassword.current = password;
      sessionStorage.setItem("admin_auth", password);
      setIsAuthenticated(true);
      setStats(data);
    } catch (error) {
      setAuthError("Erreur de connexion");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async (pwd: string) => {
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/admin-scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "stats", adminPassword: pwd }),
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Stats fetch error:", error);
    }
  };

  const handleVerify = useCallback(async (code: string) => {
    if (!code.trim()) return;

    // Prevent duplicate scans
    if (code.toUpperCase() === lastScannedCode) return;
    setLastScannedCode(code.toUpperCase());

    setIsLoading(true);
    setResult(null);
    setManualCode(code.toUpperCase());

    // Stop scanner while showing result
    setScannerActive(false);

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/admin-scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "verify",
          code: code.toUpperCase(),
          adminPassword: storedPassword.current,
        }),
      });

      const data = await response.json();
      setResult(data);

      // Celebration for valid unclaimed prize
      if (data.valid && !data.claimed) {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 },
          colors: ["#b8860b", "#daa520", "#ffd700", "#228b22"],
        });
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
        body: JSON.stringify({
          action: "claim",
          code: manualCode.toUpperCase(),
          adminPassword: storedPassword.current,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResult((prev) => (prev ? { ...prev, claimed: true, claimedAt: new Date().toISOString() } : null));
        fetchStats(storedPassword.current);

        // Success animation
        confetti({
          particleCount: 50,
          spread: 45,
          origin: { y: 0.7 },
          colors: ["#228b22", "#32cd32", "#90ee90"],
        });
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

  // Login screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen pt-20 pb-24 px-4 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-warm w-full max-w-sm"
        >
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            <h1 className="font-display text-2xl font-bold">Admin</h1>
            <p className="text-sm text-muted-foreground">Accès réservé au personnel</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                placeholder="••••••••"
                className={authError ? "border-destructive" : ""}
              />
              {authError && <p className="text-xs text-destructive">{authError}</p>}
            </div>

            <Button onClick={handleLogin} className="w-full btn-hero" disabled={isLoading || !password}>
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Connexion"}
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-24 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="font-display text-2xl font-bold">Panel Admin</h1>
          <p className="text-sm text-muted-foreground">Validation des lots quiz</p>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-5 gap-2 mb-6">
          <Button
            variant={activeTab === "scan" ? "default" : "outline"}
            onClick={() => setActiveTab("scan")}
            size="sm"
            className="flex flex-col items-center gap-1 h-auto py-2"
          >
            <Scan className="w-4 h-4" />
            <span className="text-xs">Scanner</span>
          </Button>
          <Button
            variant={activeTab === "stats" ? "default" : "outline"}
            onClick={() => setActiveTab("stats")}
            size="sm"
            className="flex flex-col items-center gap-1 h-auto py-2"
          >
            <BarChart3 className="w-4 h-4" />
            <span className="text-xs">Stats</span>
          </Button>
          <Button
            variant={activeTab === "menu" ? "default" : "outline"}
            onClick={() => setActiveTab("menu")}
            size="sm"
            className="flex flex-col items-center gap-1 h-auto py-2"
          >
            <ChefHat className="w-4 h-4" />
            <span className="text-xs">Menu</span>
          </Button>
          <Button
            variant={activeTab === "actus" ? "default" : "outline"}
            onClick={() => setActiveTab("actus")}
            size="sm"
            className="flex flex-col items-center gap-1 h-auto py-2"
          >
            <Newspaper className="w-4 h-4" />
            <span className="text-xs">Actus</span>
          </Button>
          <Button
            variant={activeTab === "splash" ? "default" : "outline"}
            onClick={() => setActiveTab("splash")}
            size="sm"
            className="flex flex-col items-center gap-1 h-auto py-2"
          >
            <Sparkles className="w-4 h-4" />
            <span className="text-xs">Splash</span>
          </Button>
        </div>

        {activeTab === "menu" && (
          <SecretMenuPanel adminPassword={storedPassword.current} />
        )}

        {activeTab === "scan" && (
          <div className="space-y-6">
            {/* QR Scanner */}
            {!result && (
              <div className="card-warm">
                <div className="flex items-center justify-between mb-4">
                  <Label className="flex items-center gap-2">
                    <Camera className="w-4 h-4" />
                    Scanner QR
                  </Label>
                  <Button
                    variant={scannerActive ? "destructive" : "outline"}
                    size="sm"
                    onClick={() => setScannerActive(!scannerActive)}
                  >
                    {scannerActive ? (
                      <>
                        <CameraOff className="w-4 h-4 mr-1" />
                        Arrêter
                      </>
                    ) : (
                      <>
                        <Camera className="w-4 h-4 mr-1" />
                        Activer
                      </>
                    )}
                  </Button>
                </div>
                
                {scannerActive ? (
                  <QRScanner onScan={handleVerify} isActive={scannerActive} />
                ) : (
                  <div className="aspect-square rounded-xl bg-muted/50 flex flex-col items-center justify-center text-muted-foreground">
                    <Camera className="w-12 h-12 mb-3 opacity-30" />
                    <p className="text-sm">Appuyez sur Activer pour scanner</p>
                  </div>
                )}
              </div>
            )}

            {/* Manual Input */}
            {!result && (
              <div className="card-warm">
                <Label htmlFor="code" className="mb-2 block flex items-center gap-2">
                  <Scan className="w-4 h-4" />
                  Ou saisir manuellement
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="code"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === "Enter" && handleVerify(manualCode)}
                    placeholder="XXXXXXXX"
                    className="font-mono text-lg tracking-wider"
                    maxLength={8}
                  />
                  <Button onClick={() => handleVerify(manualCode)} disabled={isLoading || !manualCode.trim()}>
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Vérifier"}
                  </Button>
                </div>
              </div>
            )}

            {/* Result */}
            <AnimatePresence mode="wait">
              {result && (
                <motion.div
                  key={result.valid ? "valid" : "invalid"}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={`card-glow text-center py-8 ${
                    result.valid && !result.claimed
                      ? "border-2 border-herb shadow-[0_0_30px_-8px_hsl(140_35%_40%_/_0.3)]"
                      : result.claimed
                        ? "border-muted"
                        : "border-destructive/30"
                  }`}
                >
                  {/* Status Icon */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200 }}
                    className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${
                      result.valid && !result.claimed
                        ? "bg-herb/10"
                        : result.claimed
                          ? "bg-muted"
                          : "bg-destructive/10"
                    }`}
                  >
                    {result.valid && !result.claimed ? (
                      <CheckCircle className="w-10 h-10 text-herb" />
                    ) : result.claimed ? (
                      <AlertCircle className="w-10 h-10 text-muted-foreground" />
                    ) : (
                      <XCircle className="w-10 h-10 text-destructive" />
                    )}
                  </motion.div>

                  {result.valid ? (
                    <>
                      {/* Status Badge */}
                      <div
                        className={`inline-block px-4 py-2 rounded-full text-sm font-bold mb-4 ${
                          result.claimed ? "bg-muted text-muted-foreground" : "bg-herb/10 text-herb"
                        }`}
                      >
                        {result.claimed ? "❌ DÉJÀ UTILISÉ" : "✓ VALIDE"}
                      </div>

                      {/* Winner Info */}
                      <h2 className="font-display text-2xl font-bold mb-2">{result.firstName}</h2>

                      <div className="flex items-center justify-center gap-2 text-muted-foreground mb-4">
                        <Calendar className="w-4 h-4" />
                        <span>Semaine {result.weekNumber}</span>
                      </div>

                      {/* Prize */}
                      <div className="inline-flex items-center gap-3 px-6 py-4 rounded-2xl bg-gradient-to-r from-caramel/10 to-caramel/5 border border-caramel/20 mb-6">
                        <Gift className="w-6 h-6 text-caramel" />
                        <span className="font-display text-xl font-bold text-primary">{result.prize}</span>
                      </div>

                      {/* Claim Button */}
                      {!result.claimed && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                          <Button onClick={handleClaim} className="w-full btn-hero text-lg py-6" disabled={claimLoading}>
                            {claimLoading ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                              <>
                                <CheckCircle className="w-5 h-5 mr-2" />
                                Marquer comme utilisé
                              </>
                            )}
                          </Button>
                        </motion.div>
                      )}

                      {result.claimed && result.claimedAt && (
                        <p className="text-sm text-muted-foreground">
                          Utilisé le{" "}
                          {new Date(result.claimedAt).toLocaleDateString("fr-FR", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      <h2 className="font-display text-xl font-bold text-destructive mb-2">Code invalide</h2>
                      <p className="text-muted-foreground">{result.message || "Ce code n'existe pas"}</p>
                    </>
                  )}

                  <Button variant="outline" onClick={handleReset} className="mt-6">
                    Nouveau scan
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {activeTab === "stats" && stats && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Week Info */}
            <div className="card-warm text-center">
              <p className="text-sm text-muted-foreground mb-1">Semaine du</p>
              <p className="font-display text-lg font-semibold">
                {new Date(stats.weekStart).toLocaleDateString("fr-FR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-3">
              <div className="card-warm text-center py-4">
                <p className="text-2xl font-bold text-primary">{stats.totalParticipations}</p>
                <p className="text-xs text-muted-foreground">Participations</p>
              </div>
              <div className="card-warm text-center py-4">
                <p className="text-2xl font-bold text-herb">{stats.totalWinners}</p>
                <p className="text-xs text-muted-foreground">Gagnants</p>
              </div>
              <div className="card-warm text-center py-4">
                <p className="text-2xl font-bold text-caramel">{stats.totalClaimed}</p>
                <p className="text-xs text-muted-foreground">Réclamés</p>
              </div>
            </div>

            {/* Stock */}
            {stats.stock && (
              <div className="card-warm">
                <h3 className="font-display font-semibold mb-4">Stock restant</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span className="text-xl">🏆</span>
                      <span>Formules</span>
                    </span>
                    <span className="font-bold text-lg">
                      {stats.stock.formule_complete_remaining}/{stats.stock.formule_complete_total}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span className="text-xl">🥈</span>
                      <span>Galettes</span>
                    </span>
                    <span className="font-bold text-lg">
                      {stats.stock.galette_remaining}/{stats.stock.galette_total}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span className="text-xl">🥉</span>
                      <span>Crêpes</span>
                    </span>
                    <span className="font-bold text-lg">
                      {stats.stock.crepe_remaining}/{stats.stock.crepe_total}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <Button onClick={() => fetchStats(storedPassword.current)} variant="outline" className="w-full">
              Actualiser les stats
            </Button>
          </motion.div>
        )}

        {activeTab === "actus" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <ActusLivePanel adminPassword={storedPassword.current} />
          </motion.div>
        )}

        {activeTab === "splash" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <SplashSettingsPanel adminPassword={storedPassword.current} />
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Admin;
