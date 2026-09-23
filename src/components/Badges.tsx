import { BADGES } from '../lib/badges';
import { loadEarned, loadStats } from '../lib/storage';
import { streaks } from '../lib/streak';

export default function Badges({ days }: { days: Record<string, number> }) {
  const stats = loadStats();
  const earned = loadEarned();
  const { longest, current } = streaks(days);
  const count = BADGES.filter((b) => earned[b.id]).length;

  const tiles = [
    { label: 'Practices', value: stats.sessions },
    { label: 'Conversations', value: stats.talks },
    { label: 'Words spoken', value: stats.words.toLocaleString() },
    { label: 'Best score', value: stats.sessions ? `${stats.best}/10` : '–' },
    { label: 'Current streak', value: `${current} ${current === 1 ? 'day' : 'days'}` },
    { label: 'Longest streak', value: `${longest} ${longest === 1 ? 'day' : 'days'}` },
  ];

  return (
    <div className="badges-page">
      <section className="card">
        <div className="row-between">
          <h2>Your journey so far</h2>
          <span className="pill soft">
            {count} / {BADGES.length} badges
          </span>
        </div>
        <div className="stat-tiles">
          {tiles.map((t) => (
            <div key={t.label} className="stat-tile">
              <strong>{t.value}</strong>
              <span>{t.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <h2>Badges</h2>
        <p className="muted small">Every badge is a little gift from Granny for being brave and practising.</p>
        <div className="badge-grid">
          {BADGES.map((b) => {
            const got = earned[b.id];
            const p = got ? 1 : b.progress(stats, longest);
            return (
              <div key={b.id} className={`badge${got ? ' got' : ''}`}>
                <span className="badge-emoji" aria-hidden>
                  {b.emoji}
                </span>
                <strong>{b.name}</strong>
                <span className="muted small">{b.desc}</span>
                {got ? (
                  <span className="badge-date">Earned {new Date(got).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</span>
                ) : (
                  <span className="badge-bar" aria-label={`${Math.round(p * 100)}% done`}>
                    <span style={{ width: `${Math.round(p * 100)}%` }} />
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
