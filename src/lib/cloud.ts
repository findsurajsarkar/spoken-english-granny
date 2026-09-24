/* Cloud sync: keeps each learner's progress in their own Puter account (Puter's per-user
 * key-value store), so history, streaks, badges and Plus survive clearing the browser and
 * follow them to a new phone. localStorage stays the fast local copy.
 *
 * Keys: "attempt:<createdAt>:<id>" per practice (keeps every value well under Puter's 400 KB
 * limit) plus small "days", "stats", "badges", "settings" and "plus" entries.
 *
 * To move to Supabase later, re-implement pull/push here; the rest of the app doesn't change. */
import { getAccount, isSignedIn, kv } from './puter';
import {
  clearLocal,
  exportLocal,
  EMPTY_STATS,
  HISTORY_DAYS,
  importLocal,
  localOwner,
  localOwnerWasGuest,
  setLocalOwner,
  type Snapshot,
} from './storage';
import type { Attempt, Stats } from './types';
import { addDays } from './dates';

export type SyncState = 'off' | 'syncing' | 'saved' | 'error';

type Listener = (s: SyncState) => void;
const listeners = new Set<Listener>();
let state: SyncState = 'off';

function set(s: SyncState) {
  state = s;
  listeners.forEach((l) => l(s));
}

export function onSyncState(l: Listener): () => void {
  listeners.add(l);
  l(state);
  return () => listeners.delete(l);
}

const attemptKey = (a: Attempt) => `attempt:${a.createdAt}:${a.id}`;

/* ---------- merging two copies of the same learner's data ---------- */

function mergeStats(a: Stats, b: Stats): Stats {
  return {
    sessions: Math.max(a.sessions, b.sessions),
    talks: Math.max(a.talks, b.talks),
    words: Math.max(a.words, b.words),
    best: Math.max(a.best, b.best),
    mostWords: Math.max(a.mostWords, b.mostWords),
    levels: [...new Set([...a.levels, ...b.levels])],
    interviewBest: Math.max(a.interviewBest, b.interviewBest),
    earlyBird: a.earlyBird || b.earlyBird,
    nightOwl: a.nightOwl || b.nightOwl,
  };
}

function mergePlus(a: any, b: any) {
  if (!a) return b ?? null;
  if (!b) return a;
  const winner = a.plan === 'lifetime' && b.plan !== 'lifetime' ? a : b.plan === 'lifetime' && a.plan !== 'lifetime' ? b : a.until >= b.until ? a : b;
  // Keep every payment from both copies (history), newest first.
  const seen = new Set<string>();
  const purchases = [...(a.purchases ?? []), ...(b.purchases ?? [])]
    .filter((p: { ref: string }) => (seen.has(p.ref) ? false : (seen.add(p.ref), true)))
    .sort((x: { date: string }, y: { date: string }) => y.date.localeCompare(x.date));
  const since = [a.since, b.since].filter(Boolean).sort()[0];
  return { ...winner, since, purchases };
}

function merge(local: Snapshot, cloud: Snapshot): Snapshot {
  const byId = new Map<string, Attempt>();
  [...cloud.history, ...local.history].forEach((a) => byId.set(a.id, a));
  const history = [...byId.values()].sort((x, y) => y.createdAt.localeCompare(x.createdAt));

  const days = { ...cloud.days };
  Object.entries(local.days).forEach(([k, n]) => (days[k] = Math.max(days[k] ?? 0, n)));

  const badges = { ...local.badges };
  Object.entries(cloud.badges).forEach(([k, d]) => (badges[k] = badges[k] && badges[k] < d ? badges[k] : d));

  return {
    history,
    days,
    stats: mergeStats(local.stats, cloud.stats),
    badges,
    settings: cloud.settings ?? local.settings,
    plus: mergePlus(local.plus, cloud.plus),
  };
}

/* ---------- reading and writing the cloud copy ---------- */

async function readCloud(): Promise<Snapshot> {
  const store = kv();
  const [days, stats, badges, settings, plus, attempts] = await Promise.all([
    store.get('days'),
    store.get('stats'),
    store.get('badges'),
    store.get('settings'),
    store.get('plus'),
    store.list('attempt:', true),
  ]);
  return {
    history: (attempts ?? []).map((p) => p.value as Attempt).filter(Boolean),
    days: days ?? {},
    stats: { ...EMPTY_STATS, ...(stats ?? {}) },
    badges: badges ?? {},
    settings: settings ?? null,
    plus: plus ?? null,
  };
}

async function writeSummary(s: Snapshot) {
  const store = kv();
  await Promise.all([
    store.set('days', s.days),
    store.set('stats', s.stats),
    store.set('badges', s.badges),
    s.settings ? store.set('settings', s.settings) : Promise.resolve(true),
    store.set('plus', s.plus ?? null),
  ]);
}

/**
 * Called after sign-in and on app start. Merges this device with the account and saves the
 * result both ways. Progress made on this device before signing in is added to the account;
 * progress belonging to a different (non-guest) account is removed from this device first.
 */
export async function syncNow(): Promise<boolean> {
  if (!isSignedIn()) {
    set('off');
    return false;
  }
  set('syncing');
  try {
    const { username, guest } = await getAccount();
    const owner = localOwner();
    // Another person's progress on a shared device is removed first. A guest's progress is kept
    // and merged, so "Save progress with Google" moves it into their real account.
    if (username && owner && owner !== username && !localOwnerWasGuest()) clearLocal();

    const local = exportLocal();
    const cloud = await readCloud();
    const merged = merge(local, cloud);

    // Upload practices the account doesn't have yet, and delete ones past the history window.
    const cloudIds = new Set(cloud.history.map((a) => a.id));
    const cutoff = addDays(new Date(), -HISTORY_DAYS).toISOString();
    const store = kv();
    await Promise.all([
      ...merged.history.filter((a) => !cloudIds.has(a.id) && a.createdAt >= cutoff).map((a) => store.set(attemptKey(a), a)),
      ...cloud.history.filter((a) => a.createdAt < cutoff).map((a) => store.del(attemptKey(a))),
    ]);
    // Anything that changed on this device while we were talking to the cloud (a new practice,
    // Plus switched on by a link or code…) is merged in again, so it is never overwritten.
    const final = merge(exportLocal(), merged);
    await writeSummary(final);

    importLocal({ ...final, history: final.history.filter((a) => a.createdAt >= cutoff) });
    if (username) setLocalOwner(username, guest);
    set('saved');
    return true;
  } catch (e) {
    console.error('Sync failed', e);
    set('error');
    return false;
  }
}

/** Saves one new practice (and the updated streak/stats/badges) to the account. */
export async function pushAttempt(a: Attempt) {
  if (!isSignedIn()) return;
  set('syncing');
  try {
    await kv().set(attemptKey(a), a);
    await writeSummary(exportLocal());
    set('saved');
  } catch (e) {
    console.error('Saving to account failed', e);
    set('error');
  }
}

/** Saves settings / Plus after they change. */
export async function pushSummary() {
  if (!isSignedIn()) return;
  try {
    await writeSummary(exportLocal());
    set('saved');
  } catch (e) {
    console.error('Saving to account failed', e);
    set('error');
  }
}
