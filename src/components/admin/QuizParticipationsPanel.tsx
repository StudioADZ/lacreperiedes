import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2,
  Search,
  Download,
  CheckCircle,
  AlertCircle,
  Gift,
  Trophy,
  Clock,
  Ban,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

interface Participation {
  id: string;
  created_at: string;
  first_name: string;
  email: string; // (peut être vide côté backend -> on protège quand même)
  phone: string; // (peut être vide côté backend -> on protège quand même)
  score: number;
  total_questions: number;
  prize_won: string | null;
  prize_code: string | null;
  prize_claimed: boolean;
  claimed_at: string | null;
  status: string;
}

interface QuizParticipationsPanelProps {
  adminPassword: string;
}

const getStatusBadge = (participation: Participation) => {
  if (participation.status === 'invalidated') {
    return (
      <Badge variant="destructive" className="gap-1">
        <Ban className="w-3 h-3" /> Invalidé
      </Badge>
    );
  }
  if (participation.prize_claimed) {
    return (
      <Badge
        variant="secondary"
        className="gap-1 bg-herb/10 text-herb border-herb/20"
      >
        <CheckCircle className="w-3 h-3" /> Réclamé
      </Badge>
    );
  }
  if (participation.prize_won) {
    return (
      <Badge className="gap-1 bg-caramel/10 text-caramel border-caramel/20">
        <Gift className="w-3 h-3" /> Gagnant
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="gap-1">
      <Clock className="w-3 h-3" /> Perdu
    </Badge>
  );
};

const getPrizeLabel = (prize: string | null) => {
  if (!prize) return '-';
  switch (prize) {
    case 'formule_complete':
      return '🏆 Formule Complète';
    case 'galette':
      return '🥈 Galette';
    case 'crepe':
      return '🥉 Crêpe';
    default:
      return prize;
  }
};

const maskEmail = (email?: string | null) => {
  if (!email) return '-';
  const atIndex = email.indexOf('@');
  if (atIndex <= 0) return `${email.slice(0, 2)}***`;
  const local = email.slice(0, atIndex);
  const domain = email.slice(atIndex + 1);
  if (local.length <= 2) return `${local[0] ?? ''}***@${domain}`;
  return `${local.slice(0, 2)}***@${domain}`;
};

const maskPhone = (phone?: string | null) => {
  if (!phone) return '-';
  const cleaned = phone.replace(/\s+/g, '');
  if (cleaned.length < 6) return cleaned;
  return `${cleaned.slice(0, 2)}****${cleaned.slice(-2)}`;
};

const QuizParticipationsPanel = ({ adminPassword }: QuizParticipationsPanelProps) => {
  const [participations, setParticipations] = useState<Participation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showOnlyWinners, setShowOnlyWinners] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showSensitiveData, setShowSensitiveData] = useState(false);

  // actionLoading = id de participation en cours (claim/invalidate)
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // feedback UX (safe)
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const clearFeedback = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const fetchParticipations = useCallback(async () => {
    // Non destructif : si pas de mot de passe admin, on ne fetch pas
    if (!adminPassword) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    clearFeedback();

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/admin-scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'list_participations',
          adminPassword,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setErrorMessage(data?.error || "Impossible de charger les participations.");
        return;
      }

      setParticipations(data.participations || []);
    } catch (error) {
      console.error('Error fetching participations:', error);
      setErrorMessage("Erreur de connexion. Réessaie.");
    } finally {
      setIsLoading(false);
    }
  }, [adminPassword]);

  // ✅ SAFE: dépend de adminPassword (évite fetch vide au mount)
  useEffect(() => {
    if (adminPassword) fetchParticipations();
  }, [adminPassword, fetchParticipations]);

  const handleMarkClaimed = async (participationId: string, prizeCode: string) => {
    if (!adminPassword) return;

    const ok = confirm("Confirmer : marquer ce gain comme réclamé ?");
    if (!ok) return;

    setActionLoading(participationId);
    clearFeedback();

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/admin-scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'claim',
          code: prizeCode,
          adminPassword,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || data?.success === false) {
        setErrorMessage(data?.error || "Impossible de marquer comme réclamé.");
        return;
      }

      setParticipations((prev) =>
        prev.map((p) =>
          p.id === participationId
            ? { ...p, prize_claimed: true, claimed_at: new Date().toISOString() }
            : p
        )
      );

      setSuccessMessage("Gain marqué comme réclamé.");
    } catch (error) {
      console.error('Error claiming prize:', error);
      setErrorMessage("Erreur lors de l’action. Réessaie.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleInvalidate = async (participationId: string) => {
    if (!adminPassword) return;

    const ok = confirm("Confirmer : invalider cette participation ? (Action staff)");
    if (!ok) return;

    setActionLoading(participationId);
    clearFeedback();

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/admin-scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'invalidate',
          participationId,
          adminPassword,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || data?.success === false) {
        setErrorMessage(data?.error || "Impossible d’invalider.");
        return;
      }

      setParticipations((prev) =>
        prev.map((p) => (p.id === participationId ? { ...p, status: 'invalidated' } : p))
      );

      setSuccessMessage("Participation invalidée.");
    } catch (error) {
      console.error('Error invalidating:', error);
      setErrorMessage("Erreur lors de l’action. Réessaie.");
    } finally {
      setActionLoading(null);
    }
  };

  const filteredParticipations = useMemo(() => {
    let filtered = participations;

    if (showOnlyWinners) filtered = filtered.filter((p) => p.prize_won);

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((p) => {
        const email = (p.email || '').toLowerCase();
        const first = (p.first_name || '').toLowerCase();
        const phone = p.phone || '';
        const code = (p.prize_code || '').toLowerCase();

        return (
          first.includes(query) ||
          email.includes(query) ||
          phone.includes(query) ||
          code.includes(query)
        );
      });
    }

    return filtered;
  }, [participations, searchQuery, showOnlyWinners]);

  const exportCSV = () => {
    // ✅ privacy-safe : par défaut on export masqué
    if (showSensitiveData) {
      const ok = confirm("Exporter avec emails/téléphones complets ?");
      if (!ok) return;
    }

    const headers = ['Date', 'Prénom', 'Email', 'Téléphone', 'Score', 'Gain', 'Code', 'Statut'];

    const rows = filteredParticipations.map((p) => {
      const emailValue = showSensitiveData ? (p.email || '-') : maskEmail(p.email);
      const phoneValue = showSensitiveData ? (p.phone || '-') : maskPhone(p.phone);

      return [
        new Date(p.created_at).toLocaleDateString('fr-FR'),
        p.first_name,
        emailValue,
        phoneValue,
        `${p.score}/${p.total_questions}`,
        p.prize_won || 'Aucun',
        p.prize_code || '-',
        p.status === 'invalidated'
          ? 'Invalidé'
          : p.prize_claimed
          ? 'Réclamé'
          : p.prize_won
          ? 'Gagnant'
          : 'Perdu',
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `participations-quiz-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      {/* Header */}
      <div className="card-warm">
        <div className="flex items-center justify-between mb-4 gap-3">
          <div className="min-w-0">
            <h2 className="font-display text-lg font-bold flex items-center gap-2">
              <Trophy className="w-5 h-5 text-caramel" />
              Participations
            </h2>
            <p className="text-xs text-muted-foreground">
              📅 Période active : lundi 00h01 → dimanche 23h59 · ⚠️ gains expirent après dimanche 23h59
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="outline">{participations.length} total</Badge>
            <Button variant="outline" size="sm" onClick={fetchParticipations} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Actualiser
            </Button>
          </div>
        </div>

        {/* Feedback (safe, non intrusif) */}
        {(errorMessage || successMessage) && (
          <div
            className={`p-3 rounded-xl border mb-4 ${
              errorMessage
                ? 'bg-destructive/5 border-destructive/20'
                : 'bg-herb/5 border-herb/20'
            }`}
          >
            <div className="flex items-start gap-2">
              <AlertCircle className={`w-4 h-4 mt-0.5 ${errorMessage ? 'text-destructive' : 'text-herb'}`} />
              <p className={`text-xs ${errorMessage ? 'text-destructive' : 'text-herb'}`}>
                {errorMessage || successMessage}
              </p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Prénom, email, téléphone ou code..."
              className="pl-9"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant={showOnlyWinners ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowOnlyWinners(!showOnlyWinners)}
            >
              <Gift className="w-4 h-4 mr-1" />
              Gagnants seuls
            </Button>

            <Button
              variant={showSensitiveData ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowSensitiveData(!showSensitiveData)}
              title="Affiche/masque les emails et téléphones complets"
            >
              {showSensitiveData ? <Eye className="w-4 h-4 mr-1" /> : <EyeOff className="w-4 h-4 mr-1" />}
              Données complètes
            </Button>

            <Button variant="outline" size="sm" onClick={exportCSV}>
              <Download className="w-4 h-4 mr-1" />
              Export CSV
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Astuce : l’export CSV respecte le bouton “Données complètes” (masqué par défaut).
          </p>
        </div>
      </div>

      {/* Participations List */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {filteredParticipations.length === 0 ? (
            <div className="card-warm text-center py-8">
              <p className="text-muted-foreground">Aucune participation trouvée</p>
            </div>
          ) : (
            filteredParticipations.map((p) => (
              <motion.div
                key={p.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`card-warm p-4 ${p.status === 'invalidated' ? 'opacity-50' : ''}`}
              >
                {/* Header Row */}
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{p.first_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(p.created_at).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono text-sm font-bold">
                      {p.score}/{p.total_questions}
                    </span>
                    {getStatusBadge(p)}
                    {expandedId === p.id ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                <AnimatePresence>
                  {expandedId === p.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-4 pt-4 border-t border-border space-y-3">
                        {/* Contact Info */}
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-muted-foreground text-xs">Email</p>
                            <p className="font-mono">
                              {showSensitiveData ? (p.email || '-') : maskEmail(p.email)}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">Téléphone</p>
                            <p className="font-mono">
                              {showSensitiveData ? (p.phone || '-') : maskPhone(p.phone)}
                            </p>
                          </div>
                        </div>

                        {/* Prize Info */}
                        {p.prize_won && (
                          <div className="p-3 rounded-xl bg-caramel/10 border border-caramel/20">
                            <div className="flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <p className="text-xs text-muted-foreground">Gain</p>
                                <p className="font-semibold truncate">{getPrizeLabel(p.prize_won)}</p>
                              </div>
                              {p.prize_code && (
                                <div className="text-right shrink-0">
                                  <p className="text-xs text-muted-foreground">Code</p>
                                  <p className="font-mono font-bold text-lg">{p.prize_code}</p>
                                </div>
                              )}
                            </div>

                            {p.claimed_at && (
                              <p className="text-xs text-muted-foreground mt-2">
                                Réclamé le{' '}
                                {new Date(p.claimed_at).toLocaleDateString('fr-FR', {
                                  day: '2-digit',
                                  month: 'long',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Actions */}
                        {p.prize_won && p.status !== 'invalidated' && (
                          <div className="flex gap-2">
                            {!p.prize_claimed && p.prize_code && (
                              <Button
                                size="sm"
                                className="flex-1"
                                onClick={() => handleMarkClaimed(p.id, p.prize_code!)}
                                disabled={actionLoading === p.id}
                              >
                                {actionLoading === p.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <>
                                    <CheckCircle className="w-4 h-4 mr-1" />
                                    Marquer réclamé
                                  </>
                                )}
                              </Button>
                            )}

                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleInvalidate(p.id)}
                              disabled={actionLoading === p.id}
                            >
                              {actionLoading === p.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  <Ban className="w-4 h-4 mr-1" />
                                  Invalider
                                </>
                              )}
                            </Button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default QuizParticipationsPanel;
```0
