import type { Badge } from '../lib/badges';
import { go } from '../lib/router';

export default function NewBadges({ badges }: { badges: Badge[] }) {
  if (!badges.length) return null;
  return (
    <section className="card new-badges" role="status">
      <h2>{badges.length === 1 ? 'New badge unlocked!' : `${badges.length} new badges unlocked!`}</h2>
      <div className="new-badge-row">
        {badges.map((b) => (
          <div key={b.id} className="new-badge">
            <span className="nb-emoji" aria-hidden>
              {b.emoji}
            </span>
            <strong>{b.name}</strong>
            <span className="muted small">{b.desc}</span>
          </div>
        ))}
      </div>
      <button className="btn link" onClick={() => go('/badges')}>
        See all badges →
      </button>
    </section>
  );
}
