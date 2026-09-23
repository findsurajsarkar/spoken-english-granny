import { go } from '../lib/router';
import { FREE_DAILY_SESSIONS, isPlus, PLUS_DAILY_SESSIONS } from '../lib/plan';

export default function LimitCard({ onBack }: { onBack: () => void }) {
  const plus = isPlus();
  return (
    <section className="card limit">
      <div className="limit-emoji" aria-hidden>
        😴
      </div>
      <h2>Granny is taking her afternoon nap</h2>
      {plus ? (
        <p>
          You have finished all {PLUS_DAILY_SESSIONS} of today's practices. That is wonderful work, beta! Rest your voice, and Granny will be waiting for you
          tomorrow.
        </p>
      ) : (
        <p>
          You have used today's {FREE_DAILY_SESSIONS} free practices. Wonderful work, beta! Come back tomorrow, or join <strong>Granny Plus</strong> for{' '}
          {PLUS_DAILY_SESSIONS} practices a day and every conversation.
        </p>
      )}
      <div className="actions center-actions">
        <button className="btn ghost" onClick={onBack}>
          Back
        </button>
        {!plus && (
          <button className="btn primary" onClick={() => go('/plus')}>
            See Granny Plus ✨
          </button>
        )}
      </div>
    </section>
  );
}
