import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2,
  Search,
  Download,
  CheckCircle,
  XCircle,
  AlertCircle,
  Gift,
  Trophy,
  Clock,
  Ban,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

interface Participation {
  id: string;
  created_at: string;
  first_name: string;
  email: string;
  phone: string;
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
    return <Badge variant="destructive" className="gap-1"><Ban className="w-3 h-3" /> Invalidé</Badge>;
  }
  if (participation.prize_claimed) {
    return <Badge variant="secondary" className="gap-1 bg-herb/10 text-herb border-herb/20"><CheckCircle className="w-3 h-3" /> Réclamé</Badge>;
  }
  if (participation.prize_won) {
    return <Badge className="gap-1 bg-caramel/10 text-caramel border-caramel/20"><Gift className="w-3 h-3" /> Gagnant</Badge>;
  }
  return <Badge variant="outline" className="gap-1"><Clock className="w-3 h-3" /> Perdu</Badge>;
};

const getPrizeLabel = (prize: string | null) => {
  if (!prize) return '-';
  switch (prize) {
    case 'formule_complete': return '🏆 Formule Complète';
    case 'galette': return '🥈 Galette';
    case 'crepe': return '🥉 Crêpe';
    default: return prize;
  }
};

const maskEmail = (email: string) => {
  const [local, domain] = email.split('@');
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  return `${local.slice(0, 2)}***@${domain}`;
};

const maskPhone = (phone: string) => {
  if (phone.length < 6) return phone;
  return `${phone.slice(0, 2)}****${phone.slice(-2)}`;
};

const QuizParticipationsPanel = ({ adminPassword }: QuizParticipationsPanelProps) => {
  const [participations, setParticipations] = useState<Participation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showOnlyWinners, setShowOnlyWinners] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showSensitiveData, setShowSensitiveData] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchParticipations();
  }, []);

  const fetchParticipations = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/admin-scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'list_participations',
          adminPassword,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setParticipations(data.participations || []);
      }
    } catch (error) {
      console.error('Error fetching participations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkClaimed = async (participationId: string, prizeCode: string) => {
    setActionLoading(participationId);
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

      if (response.ok) {
        setParticipations(prev =>
          prev.map(p =>
            p.id === participationId
              ? { ...p, prize_claimed: true, claimed_at: new Date().toISOString() }
              : p
          )
        );
      }
    } catch (error) {
      console.error('Error claiming prize:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleInvalidate = async (participationId: string) => {
    setActionLoading(participationId);
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

      if (response.ok) {
        setParticipations(prev =>
          prev.map(p =>
            p.id === participationId ? { ...p, status: 'invalidated' } : p
          )
        );
      }
    } catch (error) {
      console.error('Error invalidating:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const exportCSV = () => {
    const headers = ['Date', 'Prénom', 'Email', 'Téléphone', 'Score', 'Gain', 'Code', 'Statut'];
    const rows = filteredParticipations.map(p => [
      new Date(p.created_at).toLocaleDateString('fr-FR'),
      p.first_name,
      p.email,
      p.phone,
      `${p.score}/${p.total_questions}`,
      p.prize_won || 'Aucun',
      p.prize_code || '-',
      p.status === 'invalidated' ? 'Invalidé' : p.prize_claimed ? 'Réclamé' : p.prize_won ? 'Gagnant' : 'Perdu',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `participations-quiz-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const filteredParticipations = useMemo(() => {
    let filtered = participations;

    if (showOnlyWinners) {
      filtered = filtered.filter(p => p.prize_won);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        p =>
          p.first_name.toLowerCase().includes(query) ||
          p.email.toLowerCase().includes(query) ||
          p.phone.includes(query) ||
          (p.prize_code && p.prize_code.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [participations, searchQuery, showOnlyWinners]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="card-warm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-bold flex items-center gap-2">
            <Trophy className="w-5 h-5 text-caramel" />
            Participations
          </h2>
          <Badge variant="outline">{participations.length} total</Badge>
        </div>

        {/* Quiz Period Info */}
        <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 mb-4">
          <p className="text-xs text-primary font-medium">
            📅 Période active : lundi 00h01 → dimanche 23h59
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            ⚠️ Les gains expirent automatiquement après dimanche 23h59.
          </p>
        </div>

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
          <p className="text-xs text-muted-foreground">
            Utilisez les filtres ci-dessous pour afficher les gagnants ou voir les données complètes.
          </p>

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
            >
              {showSensitiveData ? <Eye className="w-4 h-4 mr-1" /> : <EyeOff className="w-4 h-4 mr-1" />}
              Données complètes
            </Button>
            <Button variant="outline" size="sm" onClick={exportCSV}>
              <Download className="w-4 h-4 mr-1" />
              Export CSV
            </Button>
          </div>
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
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-semibold">{p.first_name}</p>
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
                  <div className="flex items-center gap-2">
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
                              {showSensitiveData ? p.email : maskEmail(p.email)}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">Téléphone</p>
                            <p className="font-mono">
                              {showSensitiveData ? p.phone : maskPhone(p.phone)}
                            </p>
                          </div>
                        </div>

                        {/* Prize Info */}
                        {p.prize_won && (
                          <div className="p-3 rounded-xl bg-caramel/10 border border-caramel/20">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-xs text-muted-foreground">Gain</p>
                                <p className="font-semibold">{getPrizeLabel(p.prize_won)}</p>
                              </div>
                              {p.prize_code && (
                                <div className="text-right">
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
