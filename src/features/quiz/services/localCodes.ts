const STORAGE_KEY = "quiz_weekly_code";
const WON_KEY = "quiz_won_week";

function getWeekKey(): string {
  const d = new Date();
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(
    (((d.getTime() - yearStart.getTime()) / 86400000) +
      yearStart.getDay() +
      1) / 7
  );
  return `${d.getFullYear()}-W${week}`;
}

function generateCode(): string {
  return "CREPE-" + Math.random().toString(36).slice(2, 8).toUpperCase();
}

export function hasWonThisWeek(): boolean {
  const stored = localStorage.getItem(WON_KEY);
  if (!stored) return false;
  return stored === getWeekKey();
}

export function markWonThisWeek(): string {
  const weekKey = getWeekKey();
  localStorage.setItem(WON_KEY, weekKey);

  const existing = localStorage.getItem(STORAGE_KEY);
  if (existing) {
    const parsed = JSON.parse(existing);
    if (parsed.weekKey === weekKey) {
      return parsed.code;
    }
  }

  const code = generateCode();
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ weekKey, code })
  );

  return code;
}

export function getWeeklyCode(): string | null {
  if (!hasWonThisWeek()) return null;

  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;

  const parsed = JSON.parse(stored);
  if (parsed.weekKey !== getWeekKey()) return null;

  return parsed.code ?? null;
}
