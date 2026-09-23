import { gradeFor } from '../lib/grading';
import { HISTORY_DAYS } from '../lib/storage';
import type { Attempt } from '../lib/types';

export default function History({ items, onOpen }: { items: Attempt[]; onOpen: (a: Attempt) => void }) {
  return (
    <section className="card history">
      <h2>Your old notebook pages</h2>
      <p className="muted small">Granny keeps your pages for {HISTORY_DAYS} days.</p>
      {items.length === 0 ? (
        <p className="empty">No pages yet. Speak your first topic and it will appear here.</p>
      ) : (
        <ul>
          {items.map((a) => {
            const g = gradeFor(a.analysis.score);
            return (
              <li key={a.id}>
                <button onClick={() => onOpen(a)}>
                  <span className={`h-score tone-${g.tone}`}>{a.analysis.score}</span>
                  <span className="h-body">
                    <strong>{a.topic.title}</strong>
                    <span className="muted small">
                      {new Date(a.createdAt).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })} · {g.label} ·{' '}
                      {a.analysis.mistakes.length} mistakes
                    </span>
                  </span>
                  <span aria-hidden>›</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
