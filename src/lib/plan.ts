import { PLUS_KEY, read, sessionsToday, write } from './storage';

export const FREE_DAILY_SESSIONS = 3;

export type PlanId = 'monthly' | 'lifetime';

/** Plus members get this many practices a day (keeps AI costs predictable). */
export const PLUS_DAILY_SESSIONS = 6;

export interface Plan {
  id: PlanId;
  name: string;
  short: string;
  /** What the customer pays now (launch offer). */
  price: number;
  /** The regular price, shown struck through. Only show a price you will actually charge after the offer. */
  regular: number;
  per: string;
  days: number | null;
  /** Lifetime unlocks all 8 conversations; Monthly keeps the 3 everyday ones. */
  allConversations: boolean;
  note: string;
}

export const PLANS: Record<PlanId, Plan> = {
  monthly: {
    id: 'monthly',
    name: 'Plus Monthly',
    short: 'Monthly',
    price: 149,
    regular: 299,
    per: 'month',
    days: 30,
    allConversations: false,
    note: 'About ₹5 a day',
  },
  lifetime: {
    id: 'lifetime',
    name: 'Plus Lifetime',
    short: 'Lifetime',
    price: 5999,
    regular: 9999,
    per: 'one time',
    days: null,
    allConversations: true,
    note: 'Pay once. Everything, forever.',
  },
};

/** Downloadable gifts included with Plus Lifetime (files in public/downloads, made by npm run freebies). */
export const FREEBIES = [
  { file: 'downloads/granny-grammar-guide.pdf', title: 'Everyday English Grammar Guide', desc: '16 common mistakes, tenses, a/an/the, in/on/at, 45 irregular words and ready phrases', pages: 7, icon: '📘' },
  { file: 'downloads/granny-30-day-speaking-planner.pdf', title: '30-Day Speaking Planner', desc: 'A topic for every day, progress tracker, weekly check-ins and a mistake notebook', pages: 8, icon: '🗓️' },
];

export interface Purchase {
  date: string;
  plan: PlanId;
  amount: number;
  ref: string;
}

export interface PlusState {
  plan: PlanId;
  until: string;
  /** When this membership first started. */
  since?: string;
  paymentId?: string;
  test?: boolean;
  /** Every payment on this account, newest first. */
  purchases?: Purchase[];
}

const KEY = PLUS_KEY;

/** The stored membership, even if it has ended (for "your Plus has ended" and history). */
export function lastPlus(): PlusState | null {
  const s = read<PlusState | null>(KEY, null);
  if (!s) return null;
  // Memberships from plans that no longer exist (e.g. the old yearly plan) still count.
  return s.plan in PLANS ? s : { ...s, plan: 'monthly' };
}

/** The active membership, or null. */
export function plusState(): PlusState | null {
  const s = lastPlus();
  return s && s.until > new Date().toISOString() ? s : null;
}

export function isPlus(): boolean {
  return plusState() !== null;
}

/** All 8 conversations are included only with Lifetime. */
export function hasAllConversations(): boolean {
  return plusState()?.plan === 'lifetime';
}

/** Whole days left on a Monthly membership (null for Lifetime or no Plus). */
export function daysLeft(s: PlusState | null = plusState()): number | null {
  if (!s || PLANS[s.plan].days === null) return null;
  return Math.max(0, Math.ceil((new Date(s.until).getTime() - Date.now()) / 86400000));
}

export function purchases(): Purchase[] {
  return lastPlus()?.purchases ?? [];
}

function save(plan: PlanId, until: string, paymentId: string | undefined, test = false) {
  const prev = lastPlus();
  const active = plusState();
  const purchase: Purchase | null = paymentId ? { date: new Date().toISOString(), plan, amount: PLANS[plan].price, ref: paymentId } : null;
  const history = prev?.purchases ?? [];
  const purchasesNext = purchase && !history.some((p) => p.ref === purchase.ref) ? [purchase, ...history] : history;
  // Lifetime always wins; otherwise keep whichever membership lasts longer.
  const keepCurrent = active && (active.plan === 'lifetime' || active.until >= until) && !(plan === 'lifetime' && active.plan !== 'lifetime');
  const next: PlusState = keepCurrent
    ? { ...active, purchases: purchasesNext }
    : { plan, until, since: active?.since ?? new Date().toISOString(), paymentId, test, purchases: purchasesNext };
  write(KEY, next);
}

export function activatePlus(plan: PlanId, paymentId?: string, test = false) {
  const days = PLANS[plan].days;
  const current = plusState();
  // Lifetime never expires; monthly extends from the current end date if they renew early.
  const until = days === null ? new Date('2999-12-31') : current && current.plan === 'monthly' ? new Date(current.until) : new Date();
  if (days !== null) until.setDate(until.getDate() + days);
  save(plan, until.toISOString(), paymentId ?? (test ? undefined : `pay-${Date.now()}`), test);
}

/** Switches Plus on until a fixed date (used by activation codes). Never shortens an existing membership. */
export function activateUntil(plan: PlanId, until: string, paymentId: string) {
  save(plan, until, paymentId);
}

export function cancelTestPlus() {
  write(KEY, null);
}

export function freeLeftToday(): number {
  return Math.max(0, FREE_DAILY_SESSIONS - sessionsToday());
}

export function dailyLimit(): number {
  return isPlus() ? PLUS_DAILY_SESSIONS : FREE_DAILY_SESSIONS;
}

export function canPractise(): boolean {
  return sessionsToday() < dailyLimit();
}
