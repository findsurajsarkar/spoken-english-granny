import { BADGES, type Badge } from './badges';
import { addDays, dayKey } from './dates';
import { streaks } from './streak';
import type { Attempt, Settings, Stats } from './types';

const KEYS = {
  history: 'granny.history.v1',
  days: 'granny.days.v1',
  settings: 'granny.settings.v1',
  stats: 'granny.stats.v1',
  badges: 'granny.badges.v1',
  visited: 'granny.visited.v1',
};

/** History is kept for this many days (and at most MAX_ATTEMPTS entries). */
export const HISTORY_DAYS = 60;
const MAX_ATTEMPTS = 100;

export function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function write(key: string, value: unknown) {
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

export function hasVisitedApp(): boolean {
  return read(KEYS.visited, false);
}

export function markVisitedApp() {
  write(KEYS.visited, true);
}

export function loadHistory(): Attempt[] {
  const cutoff = addDays(new Date(), -HISTORY_DAYS).toISOString();
  return read<Attempt[]>(KEYS.history, []).filter((a) => a.createdAt >= cutoff);
}

/** Map of YYYY-MM-DD -> number of attempts that day. Kept forever (it's tiny). */
export function loadDays(): Record<string, number> {
  return read<Record<string, number>>(KEYS.days, {});
}

export function sessionsToday(): number {
  return loadDays()[dayKey()] ?? 0;
}

export const EMPTY_STATS: Stats = { sessions: 0, talks: 0, words: 0, best: 0, mostWords: 0, levels: [], interviewBest: 0, earlyBird: false, nightOwl: false };

export function loadStats(): Stats {
  return { ...EMPTY_STATS, ...read<Partial<Stats>>(KEYS.stats, {}) };
}

/** Badge id -> ISO date it was earned. */
export function loadEarned(): Record<string, string> {
  return read<Record<string, string>>(KEYS.badges, {});
}

function awardBadges(): Badge[] {
  const stats = loadStats();
  const { longest } = streaks(loadDays());
  const earned = loadEarned();
  const fresh = BADGES.filter((b) => !earned[b.id] && b.progress(stats, longest) >= 1);
  const now = new Date().toISOString();
  fresh.forEach((b) => (earned[b.id] = now));
  if (fresh.length) write(KEYS.badges, earned);
  return fresh;
}

/** Saves the attempt, updates streak days and lifetime stats, and returns any newly earned badges. */
export function saveAttempt(a: Attempt): Badge[] {
  write(KEYS.history, [a, ...loadHistory()].slice(0, MAX_ATTEMPTS));

  const created = new Date(a.createdAt);
  const days = loadDays();
  const k = dayKey(created);
  days[k] = (days[k] ?? 0) + 1;
  write(KEYS.days, days);

  const s = loadStats();
  const words = a.transcript.split(/\s+/).filter(Boolean).length;
  const hour = created.getHours();
  const next: Stats = {
    sessions: s.sessions + 1,
    talks: s.talks + (a.mode === 'talk' ? 1 : 0),
    words: s.words + words,
    best: Math.max(s.best, a.analysis.score),
    mostWords: Math.max(s.mostWords, words),
    levels: s.levels.includes(a.topic.level) ? s.levels : [...s.levels, a.topic.level],
    interviewBest: a.scenarioId === 'interview' ? Math.max(s.interviewBest, a.analysis.score) : s.interviewBest,
    earlyBird: s.earlyBird || hour < 8,
    nightOwl: s.nightOwl || hour >= 22,
  };
  write(KEYS.stats, next);

  return awardBadges();
}

export function recentTopicTitles(n = 15): string[] {
  return loadHistory()
    .filter((a) => a.mode !== 'talk')
    .slice(0, n)
    .map((a) => a.topic.title);
}

/* ---------- whole-device snapshot, used by cloud sync ---------- */

export const PLUS_KEY = 'granny.plus.v1';
const OWNER_KEY = 'granny.owner.v1';
const OWNER_GUEST_KEY = 'granny.ownerGuest.v1';

export interface Snapshot {
  history: Attempt[];
  days: Record<string, number>;
  stats: Stats;
  badges: Record<string, string>;
  settings: Settings | null;
  plus: unknown;
}

export function exportLocal(): Snapshot {
  return {
    history: loadHistory(),
    days: loadDays(),
    stats: loadStats(),
    badges: loadEarned(),
    settings: read<Settings | null>(KEYS.settings, null),
    plus: read<unknown>(PLUS_KEY, null),
  };
}

export function importLocal(s: Snapshot) {
  write(KEYS.history, s.history.slice(0, MAX_ATTEMPTS));
  write(KEYS.days, s.days);
  write(KEYS.stats, s.stats);
  write(KEYS.badges, s.badges);
  if (s.settings) write(KEYS.settings, s.settings);
  write(PLUS_KEY, s.plus ?? null);
}

/** Removes the learner's progress from this device (it stays safe in their account). */
export function clearLocal() {
  [KEYS.history, KEYS.days, KEYS.stats, KEYS.badges, PLUS_KEY, OWNER_KEY, OWNER_GUEST_KEY].forEach((k) => {
    try {
      localStorage.removeItem(k);
    } catch {
      /* ignore */
    }
  });
}

/** Which account the progress on this device belongs to (null = made before signing in). */
export function localOwner(): string | null {
  return read<string | null>(OWNER_KEY, null);
}

/** True if the progress on this device was made with a temporary guest account. */
export function localOwnerWasGuest(): boolean {
  return read<boolean>(OWNER_GUEST_KEY, false);
}

export function setLocalOwner(username: string, guest = false) {
  write(OWNER_KEY, username);
  write(OWNER_GUEST_KEY, guest);
}
