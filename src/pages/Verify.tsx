import { useState, useEffect, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, Loader2, Gift, Calendar, AlertCircle, Shield, RefreshCw, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SocialFooter from "@/components/SocialFooter";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

interface VerifyResult {
  valid: boolean;
  firstName?: string;
  prize?: string;
  weekNumber?: number;
  weekStart?: string;
  claimed?: boolean;
  claimedAt?: string;
  createdAt?: string;
  error?: string;
  message?: string;
  invalidated?: boolean;
  expectedToken?: string;
}

// Generate security token that changes every 10 seconds (must match server)
const generateSecurityToken = (): string => {
  const now = Math.floor(Date.now() / 10000);
  const hash = ((now * 9301 + 49297) % 233280).toString();
  return hash.padStart(4, '0').slice(-4);
};

const Verify = () => {
  const [searchParams] = useSearchParams();
  const code = searchParams.get('code');
  
  const [isLoading, setIsLoading] = useState(true);
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [currentToken, setCurrentToken] = useState(generateSecurityToken());
  const [tokenCountdown, setTokenCountdown] = useState(10);
  const [showCode, setShowCode] = useState(false);
  const [adminMode, setAdminMode] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [claimLoading, setClaimLoading] = useState(false);

  // Update token every second and countdown
  useEffect(() => {
    const interval = setInterval(() => {
      const newToken = generateSecurityToken();
      if (newToken !== currentToken) {
        setCurrentToken(newToken);
        setTokenCountdown(10);
      } else {
        setTokenCountdown(prev => Math.max(0, prev - 1));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentToken]);

  useEffect(() => {
    const verifyCode = async () => {
      if (!code) {
        setResult({ valid: false, error: 'no_code', message: 'Aucun code fourni' });
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/verify-prize`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: code.toUpperCase() }),
        });

        const data = await response.json();
        setResult(data);
      } catch (error) {
        setResult({ valid: false, error: 'connection_error', message: 'Erreur de connexion' });
      } finally {
        setIsLoading(false);
      }
    };

    verifyCode();
  }, [code]);

  const handleClaim = async () => {
    if (!adminPassword || !code) return;

    setClaimLoading(true);
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/admin-scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'claim',
          code: code.toUpperCase(),
          adminPassword,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setResult(prev => prev ? { ...prev, claimed: true, claimedAt: new Date().toISOString() } : null);
      }
    } catch (error) {
      console.error('Claim error:', error);
    } finally {
      setClaimLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pt-20 pb-24 px-4 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Vérification en cours...</p>
        </div>
      </div>
    );
  }

  if (!result?.valid) {
    return (
      <div className="min-h-screen pt-20 pb-24 px-4">
        <div className="max-w-lg mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card-warm text-center py-12"
          >
            <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-10 h-10 text-destructive" />
            </div>
            <h1 className="font-display text-2xl font-bold mb-3">
              {result?.invalidated ? 'Coupon invalidé' : 'Code invalide'}
            </h1>
            <p className="text-muted-foreground mb-6">
              {result?.message || 'Ce code n\'existe pas ou a déjà été utilisé.'}
            </p>
            <p className="font-mono text-lg text-muted-foreground mb-8">
              {code?.toUpperCase()}
            </p>
            <Link to="/quiz">
              <Button className="btn-hero">
                Participer au quiz
              </Button>
            </Link>
          </motion.div>
          <SocialFooter />
        </div>
      </div>
    );
  }

  const formattedDate = result.createdAt
    ? new Date(result.createdAt).toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '';

  return (
    <div className="min-h-screen pt-20 pb-24 px-4">
      <div className="max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`card-glow text-center py-8 ${
            result.claimed
              ? 'border-muted'
              : 'card-quiz-hero'
          }`}
        >
          {/* Status Icon */}
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${
            result.claimed
              ? 'bg-muted'
              : 'bg-herb/10'
          }`}>
            {result.claimed ? (
              <AlertCircle className="w-10 h-10 text-muted-foreground" />
            ) : (
              <CheckCircle className="w-10 h-10 text-herb" />
            )}
          </div>

          {/* Status */}
          <div className={`inline-block px-4 py-2 rounded-full text-sm font-medium mb-6 ${
            result.claimed
              ? 'bg-muted text-muted-foreground'
              : 'bg-herb/10 text-herb'
          }`}>
            {result.claimed ? '❌ Déjà utilisé' : '✓ Valide'}
          </div>

          {/* Winner Info */}
          <h1 className="font-display text-2xl font-bold mb-2">
            {result.firstName}
          </h1>
          
          <div className="flex items-center justify-center gap-2 text-muted-foreground mb-6">
            <Calendar className="w-4 h-4" />
            <span className="text-sm">Semaine {result.weekNumber}</span>
          </div>

          {/* Prize */}
          <div className="inline-flex items-center gap-3 px-6 py-4 rounded-2xl bg-gradient-to-r from-caramel/10 to-caramel/5 border border-caramel/20 mb-6">
            <Gift className="w-6 h-6 text-caramel" />
            <span className="font-display text-xl font-bold text-primary">
              {result.prize}
            </span>
          </div>

          {/* Security Token - Anti-fraud */}
          {!result.claimed && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 rounded-xl bg-primary/5 border border-primary/20"
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-primary" />
                <span className="text-xs font-medium text-primary">Jeton de sécurité</span>
              </div>
              <div className="flex items-center justify-center gap-3">
                <span className="font-mono text-3xl font-bold tracking-widest text-primary">
                  {currentToken}
                </span>
                <div className="flex flex-col items-center">
                  <RefreshCw className={`w-4 h-4 text-muted-foreground ${tokenCountdown <= 3 ? 'animate-spin' : ''}`} />
                  <span className="text-xs text-muted-foreground">{tokenCountdown}s</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Ce jeton change toutes les 10 secondes
              </p>
            </motion.div>
          )}

          {/* Code - Hidden by default */}
          <div className="p-4 rounded-xl bg-secondary/50 mb-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground">Code coupon</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCode(!showCode)}
                className="h-6 px-2"
              >
                {showCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
            {showCode ? (
              <p className="font-mono text-2xl font-bold tracking-wider">
                {code?.toUpperCase()}
              </p>
            ) : (
              <p className="font-mono text-2xl font-bold tracking-wider text-muted-foreground">
                ••••••••
              </p>
            )}
          </div>

          {/* Warning */}
          {!result.claimed && (
            <div className="p-3 rounded-xl bg-destructive/5 border border-destructive/20 mb-6">
              <p className="text-xs text-destructive">
                ⚠️ Ne partage pas ce coupon. Il est nominatif et non transférable.
              </p>
            </div>
          )}

          {/* Dates */}
          <div className="text-sm text-muted-foreground space-y-1">
            <p>Gagné le {formattedDate}</p>
            {result.claimed && result.claimedAt && (
              <p>
                Utilisé le {new Date(result.claimedAt).toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            )}
          </div>
        </motion.div>

        {/* Admin Validation Section */}
        {!result.claimed && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6"
          >
            {!adminMode ? (
              <div className="p-4 rounded-xl bg-herb/5 border border-herb/20 text-center">
                <p className="text-sm text-herb font-medium mb-3">
                  ✓ Ce lot peut être remis au client
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAdminMode(true)}
                >
                  Mode staff
                </Button>
              </div>
            ) : (
              <div className="card-warm space-y-4">
                <h3 className="font-display font-bold text-center">Validation Staff</h3>
                
                <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Jeton attendu</p>
                  <p className="font-mono text-2xl font-bold text-primary">{currentToken}</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="admin-password">Mot de passe admin</Label>
                  <Input
                    id="admin-password"
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>

                <Button
                  className="w-full btn-hero"
                  onClick={handleClaim}
                  disabled={!adminPassword || claimLoading}
                >
                  {claimLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Marquer comme utilisé
                    </>
                  )}
                </Button>
              </div>
            )}
          </motion.div>
        )}

        {/* Social Footer */}
        <SocialFooter />
      </div>
    </div>
  );
};

export default Verify;
