import { useState, useEffect, useMemo, useCallback } from "react";
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

  // optionnel si backend le renvoie
  week_start?: string; // "YYYY-MM-DD"
}

interface QuizParticipationsPanelProps {
  adminPassword: string;
}

type WeekFilter = "all" | "winners" | "claimed" | "invalidated" | "lost";

type WeekStats = {
  week_start: string;
  total: number;
  winners: number; // prize_won (hors invalidés) - inclut réclamés
  claimed: number; // prize_claimed (hors invalidés)
  invalidated: number;
  lost: number;
  byPrize: Record<string, number>;
};

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
      <Badge variant="secondary" className="gap-1 bg-herb/10 text-herb border-herb/20">
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
  const safe = email || "";
  const [local, domain] = safe.split("@");
  if (!domain) return "***";
  if (!local) return `***@${domain}`;
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  return `${local.slice(0, 2)}***@${domain}`;
};

const maskPhone = (phone: string) => {
  const p = phone || "";
  if (p.length < 6) return p;
  return `${p.slice(0, 2)}****${p.slice(-2)}`;
};

// Start-of-week (lundi)
const getWeekStartKey = (isoDate: string) => {
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return "unknown";

  const day = d.getDay(); // Sunday=0
  const diffToMonday = (day + 6) % 7;

  const monday = new Date(d);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(d.getDate() - diffToMonday);

  return monday.toISOString().slice(0, 10); // YYYY-MM-DD
};

const formatWeekLabelFR = (weekStartISO: string) => {
  const d = new Date(weekStartISO);
  if (Number.isNaN(d.getTime())) return "Semaine inconnue";
  return `Semaine du ${d.toLocaleDateString("fr-FR")}`;
};

const QuizParticipationsPanel = ({ adminPassword }: QuizParticipationsPanelProps) => {
  const [participations, setParticipations] = useState<Participation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // filtres globaux (appliqués à la semaine ouverte)
  const [searchQuery, setSearchQuery] = useState("");
  const [showSensitiveData, setShowSensitiveData] = useState(false);

  // UI
  const [expandedWeek, setExpandedWeek] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // filtre par semaine
  const [weekFilterByWeek, setWeekFilterByWeek] = useState<Record<string, WeekFilter>>({});

  const currentWeekKey = useMemo(() => getWeekStartKey(new Date().toISOString()), []);

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

  // normalisation: week_start si absent
  const normalizedParticipations = useMemo(() => {
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
      const hasPrize = Boolean(p.prize_won);
      const isClaimed = Boolean(p.prize_claimed);

      if (isInvalid) s.invalidated += 1;
      else if (hasPrize) s.winners += 1;
      else s.lost += 1;

      if (!isInvalid && isClaimed) s.claimed += 1;

      if (p.prize_won) {
        s.byPrize[p.prize_won] = (s.byPrize[p.prize_won] || 0) + 1;
      }
    }

    // tri décroissant
    return Array.from(map.values()).sort((a, b) => (a.week_start < b.week_start ? 1 : -1));
  }, [normalizedParticipations]);

  // ouvrir semaine courante par défaut (sinon plus récente)
  useEffect(() => {
    if (expandedWeek) return;
    const hasCurrent = weekStats.some((w) => w.week_start === currentWeekKey);
    if (hasCurrent) setExpandedWeek(currentWeekKey);
    else if (weekStats[0]) setExpandedWeek(weekStats[0].week_start);
  }, [weekStats, currentWeekKey, expandedWeek]);

  const applyWeekFilter = useCallback((items: Participation[], filter: WeekFilter) => {
    switch (filter) {
      case "winners":
        return items.filter((p) => p.status !== "invalidated" && Boolean(p.prize_won));
      case "claimed":
        return items.filter((p) => p.status !== "invalidated" && Boolean(p.prize_claimed));
      case "invalidated":
        return items.filter((p) => p.status === "invalidated");
      case "lost":
        return items.filter((p) => p.status !== "invalidated" && !p.prize_won);
      case "all":
      default:
        return items;
    }
  }, []);

  const applySearch = useCallback((items: Participation[], q: string) => {
    const query = (q || "").trim().toLowerCase();
    if (!query) return items;
    return items.filter(
      (p) =>
        (p.first_name || "").toLowerCase().includes(query) ||
        (p.email || "").toLowerCase().includes(query) ||
        (p.phone || "").includes(query) ||
        (p.prize_code || "").toLowerCase().includes(query)
    );
  }, []);

  const getWeekItems = useCallback(
    (weekStart: string) => {
      const base = normalizedParticipations.filter((p) => (p.week_start || "unknown") === weekStart);
      const filter = weekFilterByWeek[weekStart] || "all";
      const afterFilter = applyWeekFilter(base, filter);
      return applySearch(afterFilter, searchQuery);
    },
    [normalizedParticipations, weekFilterByWeek, applyWeekFilter, applySearch, searchQuery]
  );

  const filterLabel = (f: WeekFilter) => {
    switch (f) {
      case "all":
        return "Participants";
      case "winners":
        return "Gagnants";
      case "claimed":
        return "Réclamés";
      case "invalidated":
        return "Invalidés";
      case "lost":
        return "Perdus";
      default:
        return "Participants";
    }
  };

  const setWeekFilter = (weekStart: string, value: WeekFilter) => {
    setWeekFilterByWeek((prev) => ({ ...prev, [weekStart]: value }));
    setExpandedId(null);
  };

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
            p.id === participationId ? { ...p, prize_claimed: true, claimed_at: new Date().toISOString() } : p
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
        setParticipations((prev) => prev.map((p) => (p.id === participationId ? { ...p, status: "invalidated" } : p)));
      }
    } catch (error) {
      console.error("Error invalidating:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const exportCSV = (rows: Participation[], filenameSuffix: string) => {
    const headers = ["Semaine", "Date", "Prénom", "Email", "Téléphone", "Score", "Gain", "Code", "Statut"];
    const dataRows = rows.map((p) => [
      p.week_start || "-",
      new Date(p.created_at).toLocaleDateString("fr-FR"),
      p.first_name,
      p.email,
      p.phone,
      `${p.score}/${p.total_questions}`,
      p.prize_won || "Aucun",
      p.prize_code || "-",
      p.status === "invalidated"
        ? "Invalidé"
        : p.prize_claimed
        ? "Réclamé"
        : p.prize_won
        ? "Gagnant"
        : "Perdu",
    ]);

    const csvContent = [headers.join(","), ...dataRows.map((r) => r.map((c) => `"${String(c).replaceAll('"', '""')}"`).join(","))].join(
      "\n"
    );

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `participations-quiz-${filenameSuffix}-${new Date().toISOString().split("T")[0]}.csv`;
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
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      {/* Header global */}
      <div className="card-warm">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-display text-lg font-bold flex items-center gap-2">
            <Trophy className="w-5 h-5 text-caramel" />
            Participations
          </h2>

          <div className="flex items-center gap-2">
            <Badge variant="outline">{participations.length} total</Badge>
            <Button variant="outline" size="sm" onClick={fetchParticipations}>
              <RefreshCw className="w-4 h-4 mr-1" />
              Rafraîchir
            </Button>
          </div>
        </div>

        {/* mini stats semaine courante */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            {formatWeekLabelFR(currentWeekKey)}
          </div>

          <Badge variant="outline" className="gap-2">
            <span>Cette semaine:</span>
            <span className="font-semibold">{currentWeekStats ? currentWeekStats.total : 0}</span>
            <span className="text-muted-foreground">•</span>
            <span>Gagnants:</span>
            <span className="font-semibold">{currentWeekStats ? currentWeekStats.winners : 0}</span>
            <span className="text-muted-foreground">•</span>
            <span>Réclamés:</span>
            <span className="font-semibold">{currentWeekStats ? currentWeekStats.claimed : 0}</span>
          </Badge>
        </div>

        {/* recherche + données complètes */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Recherche (prénom, email, tél, code) — s’applique à la semaine ouverte"
              className="pl-9"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant={showSensitiveData ? "default" : "outline"}
              size="sm"
              onClick={() => setShowSensitiveData(!showSensitiveData)}
            >
              {showSensitiveData ? <Eye className="w-4 h-4 mr-1" /> : <EyeOff className="w-4 h-4 mr-1" />}
              Données complètes
            </Button>
          </div>
        </div>
      </div>

      {/* Historique par semaine */}
      <div className="card-warm">
        <h3 className="font-display font-bold mb-3">Historique par semaine</h3>

        <div className="space-y-2">
          {weekStats.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">Aucune participation</div>
          ) : (
            weekStats.map((w) => {
              const isOpen = expandedWeek === w.week_start;
              const weekFilter = weekFilterByWeek[w.week_start] || "all";
              const weekItems = isOpen ? getWeekItems(w.week_start) : [];

              return (
                <div key={w.week_start} className="rounded-xl border border-border bg-muted/10 overflow-hidden">
                  {/* Header semaine */}
                  <button
                    type="button"
                    className="w-full text-left p-3 flex items-start justify-between gap-3"
                    onClick={() => {
                      setExpandedId(null);
                      setExpandedWeek(isOpen ? null : w.week_start);
                    }}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold truncate">{formatWeekLabelFR(w.week_start)}</p>
                        {w.week_start === currentWeekKey && (
                          <Badge className="bg-caramel/10 text-caramel border-caramel/20">Semaine courante</Badge>
                        )}
                      </div>

                      <div className="mt-2 text-sm text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
                        <span>🎁 Gagnants: {w.winners}</span>
                        <span>✅ Réclamés: {w.claimed}</span>
                        <span>⛔ Invalidés: {w.invalidated}</span>
                        <span>🕒 Perdus: {w.lost}</span>
                      </div>

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

                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="outline">{w.total}</Badge>
                      {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </button>

                  {/* Contenu semaine */}
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-3 pb-3">
                          {/* Filtres par semaine */}
                          <div className="flex flex-wrap gap-2 mb-3">
                            <Button
                              size="sm"
                              variant={weekFilter === "all" ? "default" : "outline"}
                              onClick={() => setWeekFilter(w.week_start, "all")}
                            >
                              {filterLabel("all")}
                            </Button>
                            <Button
                              size="sm"
                              variant={weekFilter === "winners" ? "default" : "outline"}
                              onClick={() => setWeekFilter(w.week_start, "winners")}
                            >
                              {filterLabel("winners")}
                            </Button>
                            <Button
                              size="sm"
                              variant={weekFilter === "claimed" ? "default" : "outline"}
                              onClick={() => setWeekFilter(w.week_start, "claimed")}
                            >
                              {filterLabel("claimed")}
                            </Button>
                            <Button
                              size="sm"
                              variant={weekFilter === "invalidated" ? "default" : "outline"}
                              onClick={() => setWeekFilter(w.week_start, "invalidated")}
                            >
                              {filterLabel("invalidated")}
                            </Button>
                            <Button
                              size="sm"
                              variant={weekFilter === "lost" ? "default" : "outline"}
                              onClick={() => setWeekFilter(w.week_start, "lost")}
                            >
                              {filterLabel("lost")}
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => exportCSV(weekItems, `${w.week_start}-${weekFilter}`)}
                              className="ml-auto"
                            >
                              <Download className="w-4 h-4 mr-1" />
                              Export CSV
                            </Button>
                          </div>

                          <p className="text-xs text-muted-foreground mb-2">
                            Affiché: <b>{weekItems.length}</b> • Filtre: <b>{filterLabel(weekFilter)}</b>
                            {searchQuery.trim() ? (
                              <>
                                {" "}
                                • Recherche: <b>{searchQuery.trim()}</b>
                              </>
                            ) : null}
                          </p>

                          {/* Liste semaine */}
                          <div className="space-y-2">
                            <AnimatePresence mode="popLayout">
                              {weekItems.length === 0 ? (
                                <div className="text-center py-6 text-muted-foreground">Aucune participation pour ce filtre.</div>
                              ) : (
                                weekItems.map((p) => (
                                  <motion.div
                                    key={p.id}
                                    layout
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className={`card-warm p-4 ${p.status === "invalidated" ? "opacity-50" : ""}`}
                                  >
                                    <div
                                      className="flex items-center justify-between cursor-pointer"
                                      onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}
                                    >
                                      <div className="min-w-0">
                                        <p className="font-semibold truncate">{p.first_name}</p>
                                        <p className="text-xs text-muted-foreground">
                                          {new Date(p.created_at).toLocaleDateString("fr-FR", {
                                            day: "2-digit",
                                            month: "short",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                          })}
                                        </p>
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
                                                <div className="flex items-center justify-between gap-3">
                                                  <div className="min-w-0">
                                                    <p className="text-xs text-muted-foreground">Gain</p>
                                                    <p className="font-semibold">{getPrizeLabel(p.prize_won)}</p>
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
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default QuizParticipationsPanel;
