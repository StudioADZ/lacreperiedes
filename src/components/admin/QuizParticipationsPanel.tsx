import { useEffect, useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  Search,
  Download,
  CheckCircle,
  Gift,
  Trophy,
  Clock,
  Ban,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  RefreshCw,
  Calendar,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

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

  // ✅ SAFE : optionnel (si admin-scan le renvoie)
  week_start?: string; // ex: "2026-01-12"
}

interface QuizParticipationsPanelProps {
  adminPassword: string;
}

const getStatusBadge = (p: Participation) => {
  if (p.status === "invalidated") {
    return (
      <Badge variant="destructive" className="gap-1">
        <Ban className="w-3 h-3" /> Invalidé
      </Badge>
    );
  }
  if (p.prize_claimed) {
    return (
      <Badge
        variant="secondary"
        className="gap-1 bg-herb/10 text-herb border-herb/20"
      >
        <CheckCircle className="w-3 h-3" /> Réclamé
      </Badge>
    );
  }
  if (p.prize_won) {
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
  if (!prize) return "-";
  switch (prize) {
    case "formule_complete":
      return "🏆 Formule Complète";
    case "galette":
      return "🥈 Galette";
    case "crepe":
      return "🥉 Crêpe";
    default:
      return prize;
  }
};

const maskEmail = (email: string) => {
  const [local, domain] = email.split("@");
  if (!domain) return "***";
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  return `${local.slice(0, 2)}***@${domain}`;
};

const maskPhone = (phone: string) => {
  if (phone.length < 6) return phone;
  return `${phone.slice(0, 2)}****${phone.slice(-2)}`;
};

// ✅ Start-of-week (lundi) – simple et stable
// (si ton DB utilise dimanche, dis-moi et je te l’adapte)
const getWeekStartKey = (isoDate: string) => {
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return "unknown";

  // JS: Sunday=0 ... Saturday=6
  const day = d.getDay();
  // We choose Monday as start: convert so Monday=0
  const diffToMonday = (day + 6) % 7;

  const monday = new Date(d);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(d.getDate() - diffToMonday);

  // YYYY-MM-DD
  return monday.toISOString().slice(0, 10);
};

const formatWeekLabelFR = (weekStartISO: string) => {
  const d = new Date(weekStartISO);
  if (Number.isNaN(d.getTime())) return "Semaine inconnue";
  return `Semaine du ${d.toLocaleDateString("fr-FR")}`;
};

type WeekStats = {
  week_start: string;
  total: number;
  winners: number;
  claimed: number;
  invalidated: number;
  lost: number;
  byPrize: Record<string, number>;
};

const QuizParticipationsPanel = ({ adminPassword }: QuizParticipationsPanelProps) => {
  const [participations, setParticipations] = useState<Participation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showOnlyWinners, setShowOnlyWinners] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showSensitiveData, setShowSensitiveData] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // ✅ NEW: mode semaine courante par défaut
  const [showHistory, setShowHistory] = useState(false);

  const fetchParticipations = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/admin-scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "list_participations",
          adminPassword,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setParticipations((data.participations || []) as Participation[]);
      }
    } catch (error) {
      console.error("Error fetching participations:", error);
    } finally {
      setIsLoading(false);
    }
  }, [adminPassword]);

  useEffect(() => {
    fetchParticipations();
  }, [fetchParticipations]);

  // ✅ Semaine courante (clé) — utilisée pour “reset => liste vide”
  const currentWeekKey = useMemo(() => {
    return getWeekStartKey(new Date().toISOString());
  }, []);

  const normalizedParticipations = useMemo(() => {
    // ✅ Ajoute week_key même si week_start n’est pas dans les données
    return participations.map((p) => ({
      ...p,
      week_start: p.week_start || getWeekStartKey(p.created_at),
    }));
  }, [participations]);

  const weekStats = useMemo<WeekStats[]>(() => {
    const map = new Map<string, WeekStats>();

    for (const p of normalizedParticipations) {
      const wk = p.week_start || "unknown";
      if (!map.has(wk)) {
        map.set(wk, {
          week_start: wk,
          total: 0,
          winners: 0,
          claimed: 0,
          invalidated: 0,
          lost: 0,
          byPrize: {},
        });
      }
      const s = map.get(wk)!;
      s.total += 1;

      const isInvalid = p.status === "invalidated";
      const isWinner = Boolean(p.prize_won);
      const isClaimed = Boolean(p.prize_claimed);

      if (isInvalid) s.invalidated += 1;
      else if (isClaimed) s.claimed += 1;
      else if (isWinner) s.winners += 1;
      else s.lost += 1;

      if (p.prize_won) {
        s.byPrize[p.prize_won] = (s.byPrize[p.prize_won] || 0) + 1;
      }
    }

    // tri: semaine la plus récente en haut
    return Array.from(map.values()).sort((a, b) => (a.week_start < b.week_start ? 1 : -1));
  }, [normalizedParticipations]);

  // ✅ Filtrage principal (par défaut: semaine courante)
  const filteredParticipations = useMemo(() => {
    let filtered = normalizedParticipations;

    if (!showHistory) {
      filtered = filtered.filter((p) => (p.week_start || "unknown") === currentWeekKey);
    }

    if (showOnlyWinners) {
      filtered = filtered.filter((p) => p.prize_won);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.first_name.toLowerCase().includes(query) ||
          p.email.toLowerCase().includes(query) ||
          p.phone.includes(query) ||
          (p.prize_code && p.prize_code.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [normalizedParticipations, searchQuery, showOnlyWinners, showHistory, currentWeekKey]);

  const handleMarkClaimed = async (participationId: string, prizeCode: string) => {
    setActionLoading(participationId);
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/admin-scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "claim",
          code: prizeCode,
          adminPassword,
        }),
      });

      if (response.ok) {
        setParticipations((prev) =>
          prev.map((p) =>
            p.id === participationId
              ? { ...p, prize_claimed: true, claimed_at: new Date().toISOString() }
              : p
          )
        );
      }
    } catch (error) {
      console.error("Error claiming prize:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleInvalidate = async (participationId: string) => {
    setActionLoading(participationId);
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/admin-scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "invalidate",
          participationId,
          adminPassword,
        }),
      });

      if (response.ok) {
        setParticipations((prev) =>
          prev.map((p) => (p.id === participationId ? { ...p, status: "invalidated" } : p))
        );
      }
    } catch (error) {
      console.error("Error invalidating:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const exportCSV = () => {
    const headers = ["Semaine", "Date", "Prénom", "Email", "Téléphone", "Score", "Gain", "Code", "Statut"];
    const rows = filteredParticipations.map((p) => [
      p.week_start || "-",
      new Date(p.created_at).toLocaleDateString("fr-FR"),
      p.first_name,
      p.email,
      p.phone,
      `${p.score}/${p.total_questions}`,
      p.prize_won || "Aucun",
      p.prize_code || "-",
      p.status === "invalidated" ? "Invalidé" : p.prize_claimed ? "Réclamé" : p.prize_won ? "Gagnant" : "Perdu",
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `participations-quiz-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const currentWeekStats = weekStats.find((w) => w.week_start === currentWeekKey);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      {/* Header */}
      <div className="card-warm">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-display text-lg font-bold flex items-center gap-2">
            <Trophy className="w-5 h-5 text-caramel" />
            Participations
          </h2>

          <div className="flex items-center gap-2">
            <Badge variant="outline">{filteredParticipations.length} affichées</Badge>
            <Button variant="outline" size="sm" onClick={fetchParticipations}>
              <RefreshCw className="w-4 h-4 mr-1" />
              Rafraîchir
            </Button>
          </div>
        </div>

        {/* ✅ Indicateur “semaine courante” */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            {formatWeekLabelFR(currentWeekKey)}
          </div>

          <Button
            variant={showHistory ? "default" : "outline"}
            size="sm"
            onClick={() => setShowHistory((v) => !v)}
          >
            <BarChart3 className="w-4 h-4 mr-1" />
            {showHistory ? "Historique ON" : "Historique OFF"}
          </Button>
        </div>

        {/* ✅ Mini stats semaine courante */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="p-3 rounded-xl bg-muted/30 border border-border">
            <p className="text-xs text-muted-foreground">Cette semaine</p>
            <p className="font-semibold">
              {currentWeekStats ? `${currentWeekStats.total} participations` : "0 participation"}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-caramel/10 border border-caramel/20">
            <p className="text-xs text-muted-foreground">Gagnants</p>
            <p className="font-semibold">
              {currentWeekStats ? `${currentWeekStats.winners + currentWeekStats.claimed}` : "0"}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher prénom, email, tél, code..."
              className="pl-9"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant={showOnlyWinners ? "default" : "outline"}
              size="sm"
              onClick={() => setShowOnlyWinners(!showOnlyWinners)}
            >
              <Gift className="w-4 h-4 mr-1" />
              Gagnants seuls
            </Button>

            <Button
              variant={showSensitiveData ? "default" : "outline"}
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

      {/* ✅ Historique stats (si toggle ON) */}
      {showHistory && (
        <div className="card-warm">
          <h3 className="font-display font-bold mb-3 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Historique par semaine
          </h3>

          <div className="space-y-2">
            {weekStats.map((w) => (
              <div key={w.week_start} className="p-3 rounded-xl border border-border bg-muted/10">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{formatWeekLabelFR(w.week_start)}</p>
                  <Badge variant="outline">{w.total}</Badge>
                </div>
                <div className="mt-2 text-sm text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
                  <span>🎁 Gagnants: {w.winners}</span>
                  <span>✅ Réclamés: {w.claimed}</span>
                  <span>⛔ Invalidés: {w.invalidated}</span>
                  <span>🕒 Perdus: {w.lost}</span>
                </div>

                {/* Répartition gains */}
                {Object.keys(w.byPrize).length > 0 && (
                  <div className="mt-2 text-xs text-muted-foreground flex flex-wrap gap-2">
                    {Object.entries(w.byPrize).map(([k, v]) => (
                      <Badge key={k} variant="secondary" className="bg-caramel/10 text-caramel border-caramel/20">
                        {getPrizeLabel(k)} : {v}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Participations List */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {filteredParticipations.length === 0 ? (
            <div className="card-warm text-center py-8">
              <p className="text-muted-foreground">
                {showHistory
                  ? "Aucune participation trouvée"
                  : "Aucune participation cette semaine (après reset, c’est normal)."}
              </p>
            </div>
          ) : (
            filteredParticipations.map((p) => (
              <motion.div
                key={p.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`card-warm p-4 ${p.status === "invalidated" ? "opacity-50" : ""}`}
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
                        {new Date(p.created_at).toLocaleDateString("fr-FR", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
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
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-4 pt-4 border-t border-border space-y-3">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-muted-foreground text-xs">Email</p>
                            <p className="font-mono">{showSensitiveData ? p.email : maskEmail(p.email)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">Téléphone</p>
                            <p className="font-mono">{showSensitiveData ? p.phone : maskPhone(p.phone)}</p>
                          </div>
                        </div>

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
                                Réclamé le{" "}
                                {new Date(p.claimed_at).toLocaleDateString("fr-FR", {
                                  day: "2-digit",
                                  month: "long",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            )}
                          </div>
                        )}

                        {p.prize_won && p.status !== "invalidated" && (
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
