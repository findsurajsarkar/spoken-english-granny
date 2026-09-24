import { useState } from 'react';
import { daysLeft, lastPlus, plusState } from '../lib/plan';
import { go } from '../lib/router';
import { read, write } from '../lib/storage';

const KEY = 'granny.renewDismissed.v1';
const today = () => new Date().toDateString();

/** Reminder shown from 4 days before a Monthly membership ends, and for a week after it ends. */
export default function RenewalNotice() {
  const [dismissed, setDismissed] = useState(() => read<string>(KEY, '') === today());
  if (dismissed) return null;

  const state = plusState();
  const left = daysLeft(state);
  const last = lastPlus();
  const endedRecently = !state && last && last.plan === 'monthly' && Date.now() - new Date(last.until).getTime() < 7 * 86400000;
  if (!(left !== null && left <= 4) && !endedRecently) return null;

  const text = endedRecently
    ? 'Your Plus Monthly has ended. Renew to get 6 practices a day again.'
    : left === 0
      ? 'Your Plus Monthly ends today. Renew now to keep 6 practices a day.'
      : `Your Plus Monthly ends in ${left} ${left === 1 ? 'day' : 'days'}. Renew now to keep 6 practices a day.`;

  return (
    <div className="renew-notice" role="status">
      <span aria-hidden>⏳</span>
      <p>{text}</p>
      <button className="btn primary small" onClick={() => go('/plus')}>
        Renew
      </button>
      <button
        className="renew-x"
        aria-label="Remind me tomorrow"
        onClick={() => {
          write(KEY, today());
          setDismissed(true);
        }}
      >
        ✕
      </button>
    </div>
  );
}
