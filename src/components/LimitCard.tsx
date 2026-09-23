import { go } from '../lib/router';
import { FREE_DAILY_SESSIONS } from '../lib/plan';

export default function LimitCard({ onBack }: { onBack: () => void }) {
  return (
    <section className="card limit">
      <div className="limit-emoji" aria-hidden>
        😴
      </div>
      <h2>Granny is taking her afternoon nap</h2>
      <p>
        You have used today's {FREE_DAILY_SESSIONS} free practices. Wonderful work, beta! Come back tomorrow, or join <strong>Granny Plus</strong> to practise as
        much as you like.
      </p>
      <div className="actions center-actions">
        <button className="btn ghost" onClick={onBack}>
          Back
        </button>
        <button className="btn primary" onClick={() => go('/plus')}>
          See Granny Plus ✨
        </button>
      </div>
    </section>
  );
}
