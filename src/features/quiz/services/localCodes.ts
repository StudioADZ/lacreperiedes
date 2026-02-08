const WON_KEY = 'quiz_won_week';
const CODE_KEY = 'quiz_weekly_code';

/**
 * Returns the Monday-based week start string (YYYY-MM-DD) for the current week.
 */
function getCurrentWeekStart(): string {
  const now = new Date();
  const day = now.getDay(); // 0=Sun … 6=Sat
  const diff = day === 0 ? 6 : day - 1; // distance to Monday
  const monday = new Date(now);
  monday.setDate(now.getDate() - diff);
  return monday.toISOString().slice(0, 10);
}

export function hasWonThisWeek(): boolean {
  try {
    const stored = localStorage.getItem(WON_KEY);
    if (!stored) return false;
    const { week } = JSON.parse(stored);
    return week === getCurrentWeekStart();
  } catch {
    return false;
  }
}

export function getWeeklyCode(): string | null {
  try {
    const stored = localStorage.getItem(CODE_KEY);
    if (!stored) return null;
    const { week, code } = JSON.parse(stored);
    if (week === getCurrentWeekStart()) return code;
    return null;
  } catch {
    return null;
  }
}

export function markWonThisWeek(code?: string): void {
  const week = getCurrentWeekStart();
  localStorage.setItem(WON_KEY, JSON.stringify({ week }));
  if (code) {
    localStorage.setItem(CODE_KEY, JSON.stringify({ week, code }));
  }
}
