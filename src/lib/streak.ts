import { addDays, dayKey } from './dates';

export function streaks(days: Record<string, number>) {
  const today = new Date();
  // The current streak survives until the end of today even if you haven't practised yet.
  let cursor = days[dayKey(today)] ? today : addDays(today, -1);
  let current = 0;
  while (days[dayKey(cursor)]) {
    current++;
    cursor = addDays(cursor, -1);
  }

  const sorted = Object.keys(days)
    .filter((k) => days[k] > 0)
    .sort();
  let longest = 0;
  let run = 0;
  let prev: string | null = null;
  for (const k of sorted) {
    const expected = prev ? dayKey(addDays(new Date(prev + 'T12:00:00'), 1)) : null;
    run = expected === k ? run + 1 : 1;
    longest = Math.max(longest, run);
    prev = k;
  }
  return { current, longest, total: sorted.length, practisedToday: Boolean(days[dayKey(today)]) };
}
