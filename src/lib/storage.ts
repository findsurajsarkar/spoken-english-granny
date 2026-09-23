import type { Attempt, Settings } from './types';
import { addDays, dayKey } from './dates';

const KEYS = {
  history: 'granny.history.v1',
  days: 'granny.days.v1',
  settings: 'granny.settings.v1',
};

/** History is kept for this many days (and at most MAX_ATTEMPTS entries). */
export const HISTORY_DAYS = 60;
const MAX_ATTEMPTS = 100;

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or blocked — the app still works for this session */
  }
}

export function loadSettings(): Settings {
  return { level: 'beginner', lang: 'english', ...read<Partial<Settings>>(KEYS.settings, {}) };
}

export function saveSettings(s: Settings) {
  write(KEYS.settings, s);
}

export function loadHistory(): Attempt[] {
  const cutoff = addDays(new Date(), -HISTORY_DAYS).toISOString();
  return read<Attempt[]>(KEYS.history, []).filter((a) => a.createdAt >= cutoff);
}

/** Map of YYYY-MM-DD -> number of attempts that day. Kept forever (it's tiny). */
export function loadDays(): Record<string, number> {
  return read<Record<string, number>>(KEYS.days, {});
}

export function saveAttempt(a: Attempt) {
  const history = [a, ...loadHistory()].slice(0, MAX_ATTEMPTS);
  write(KEYS.history, history);
  const days = loadDays();
  const k = dayKey(new Date(a.createdAt));
  days[k] = (days[k] ?? 0) + 1;
  write(KEYS.days, days);
}

export function recentTopicTitles(n = 15): string[] {
  return loadHistory()
    .slice(0, n)
    .map((a) => a.topic.title);
}
