import { useState } from 'react';
import { gradeFor } from '../lib/grading';
import { scenarioById } from '../lib/scenarios';
import { HISTORY_DAYS } from '../lib/storage';
import type { Attempt } from '../lib/types';
import Result from './Result';

export default function History({ items }: { items: Attempt[] }) {
  const [open, setOpen] = useState<Attempt | null>(null);

  if (open) {
    return (
      <Result
        attempt={open}
        readOnly
        onAgain={() => {}}
        onNew={() => {
          setOpen(null);
          window.scrollTo({ top: 0 });
        }}
      />
    );
  }

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
            const sc = a.mode === 'talk' && a.scenarioId ? scenarioById(a.scenarioId) : undefined;
            return (
              <li key={a.id}>
                <button
                  onClick={() => {
                    setOpen(a);
                    window.scrollTo({ top: 0 });
                  }}
                >
                  <span className={`h-score tone-${g.tone}`}>{a.analysis.score}</span>
                  <span className="h-body">
                    <strong>
                      {sc ? `${sc.emoji} ` : ''}
                      {a.topic.title}
                    </strong>
                    <span className="muted small">
                      {new Date(a.createdAt).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })} · {g.label} ·{' '}
                      {a.analysis.mistakes.length} mistakes{sc ? ' · conversation' : ''}
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
