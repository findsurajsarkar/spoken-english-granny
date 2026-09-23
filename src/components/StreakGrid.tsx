import { useEffect, useMemo, useRef } from 'react';
import { addDays, dayKey } from '../lib/dates';

const WEEKS = 26;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function streaks(days: Record<string, number>) {
  const today = new Date();
  // The current streak survives until the end of today even if you haven't practised yet.
  let cursor = days[dayKey(today)] ? today : addDays(today, -1);
  let current = 0;
  while (days[dayKey(cursor)]) {
    current++;
    cursor = addDays(cursor, -1);
  }

  const sorted = Object.keys(days).filter((k) => days[k] > 0).sort();
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

export default function StreakGrid({ days }: { days: Record<string, number> }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const stats = useMemo(() => streaks(days), [days]);

  const { columns, monthLabels } = useMemo(() => {
    const today = new Date();
    const start = addDays(today, -(WEEKS - 1) * 7 - today.getDay()); // a Sunday
    const cols: Array<Array<{ key: string; count: number; future: boolean }>> = [];
    const labels: Array<string | null> = [];
    let lastMonth = -1;
    for (let w = 0; w < WEEKS; w++) {
      const col = [];
      for (let d = 0; d < 7; d++) {
        const date = addDays(start, w * 7 + d);
        const key = dayKey(date);
        col.push({ key, count: days[key] ?? 0, future: date > today });
      }
      const first = addDays(start, w * 7);
      labels.push(first.getMonth() !== lastMonth ? MONTHS[first.getMonth()] : null);
      lastMonth = first.getMonth();
      cols.push(col);
    }
    // Drop a month label that would collide with the next one (e.g. a month cut off at the left edge).
    labels.forEach((l, i) => {
      if (l && (labels[i + 1] || labels[i + 2])) labels[i] = null;
    });
    return { columns: cols, monthLabels: labels };
  }, [days]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, []);

  const level = (n: number) => (n === 0 ? 0 : n === 1 ? 1 : n <= 3 ? 2 : 3);

  return (
    <section className="card streak">
      <div className="streak-head">
        <h2>Attendance</h2>
        <div className="streak-stats">
          <div>
            <strong>{stats.current}</strong>
            <span>day streak</span>
          </div>
          <div>
            <strong>{stats.longest}</strong>
            <span>longest</span>
          </div>
          <div>
            <strong>{stats.total}</strong>
            <span>days practised</span>
          </div>
        </div>
      </div>

      <div className="grid-scroll" ref={scrollRef}>
        <div className="grid-wrap">
          <div className="grid-days" aria-hidden>
            <span />
            <span>Mon</span>
            <span />
            <span>Wed</span>
            <span />
            <span>Fri</span>
            <span />
          </div>
          <div>
            <div className="grid-months" aria-hidden>
              {monthLabels.map((m, i) => (
                <span key={i}>{m}</span>
              ))}
            </div>
            <div className="grid" role="img" aria-label={`${stats.total} days practised in the last ${WEEKS} weeks`}>
              {columns.map((col, i) => (
                <div className="grid-col" key={i}>
                  {col.map((c) => (
                    <span
                      key={c.key}
                      className={`cell l${level(c.count)}${c.future ? ' future' : ''}`}
                      title={c.future ? '' : `${c.key}: ${c.count ? `${c.count} practice${c.count > 1 ? 's' : ''}` : 'no practice'}`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <p className="streak-note">
        {stats.practisedToday
          ? 'Shabash! You came to see Granny today.'
          : stats.current > 0
            ? `Practise today to keep your ${stats.current}-day streak going.`
            : 'Speak one topic today to start your streak.'}
      </p>
    </section>
  );
}
