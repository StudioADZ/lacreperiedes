import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, Loader2, Gift, Calendar, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

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
}

const Verify = () => {
  const { code } = useParams<{ code: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [result, setResult] = useState<VerifyResult | null>(null);

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
              Code invalide
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

          {/* Code */}
          <div className="p-4 rounded-xl bg-secondary/50 mb-6">
            <p className="text-xs text-muted-foreground mb-1">Code</p>
            <p className="font-mono text-2xl font-bold tracking-wider">
              {code?.toUpperCase()}
            </p>
          </div>

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

        {/* Info for staff */}
        {!result.claimed && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 p-4 rounded-xl bg-herb/5 border border-herb/20 text-center"
          >
            <p className="text-sm text-herb font-medium">
              ✓ Ce lot peut être remis au client
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Verify;