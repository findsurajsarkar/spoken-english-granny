import { read, sessionsToday, write } from './storage';

export const FREE_DAILY_SESSIONS = 3;

export type PlanId = 'monthly' | 'lifetime';

/** Plus is "unlimited" with a generous fair-use cap, so one heavy user can't run up a huge AI bill. */
export const PLUS_FAIR_USE_DAILY = 20;

export const PLANS: Record<PlanId, { id: PlanId; name: string; price: number; per: string; days: number | null; note: string }> = {
  monthly: { id: 'monthly', name: 'Plus Monthly', price: 99, per: 'month', days: 30, note: 'Less than ₹4 a day' },
  lifetime: { id: 'lifetime', name: 'Plus Lifetime', price: 2999, per: 'one time', days: null, note: 'Pay once, practise forever' },
};

interface PlusState {
  plan: PlanId;
  until: string;
  paymentId?: string;
  test?: boolean;
}

const KEY = 'granny.plus.v1';

export function plusState(): PlusState | null {
  const s = read<PlusState | null>(KEY, null);
  return s && s.until > new Date().toISOString() ? s : null;
}

export function isPlus(): boolean {
  return plusState() !== null;
}

export function activatePlus(plan: PlanId, paymentId?: string, test = false) {
  const days = PLANS[plan].days;
  const current = plusState();
  // Lifetime never expires; monthly extends from the current end date if they renew early.
  const until = days === null ? new Date('2999-12-31') : current ? new Date(current.until) : new Date();
  if (days !== null) until.setDate(until.getDate() + days);
  write(KEY, { plan, until: until.toISOString(), paymentId, test } satisfies PlusState);
}

export function cancelTestPlus() {
  write(KEY, null);
}

export function freeLeftToday(): number {
  return Math.max(0, FREE_DAILY_SESSIONS - sessionsToday());
}

export function canPractise(): boolean {
  return isPlus() ? sessionsToday() < PLUS_FAIR_USE_DAILY : freeLeftToday() > 0;
}
