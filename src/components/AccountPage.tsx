import { BUSINESS } from '../config';
import { track } from '../lib/analytics';
import { dailyLimit, daysLeft, FREEBIES, lastPlus, PLANS, plusState, purchases } from '../lib/plan';
import { go } from '../lib/router';
import { sessionsToday } from '../lib/storage';

interface Props {
  signedIn: boolean;
  username: string | null;
  guest: boolean;
  onSignIn: () => void;
  onSignOut: () => void;
}

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

export default function AccountPage({ signedIn, username, guest, onSignIn, onSignOut }: Props) {
  const state = plusState();
  const ended = !state ? lastPlus() : null;
  const left = daysLeft(state);
  const isLifetime = state?.plan === 'lifetime';
  const list = purchases();
  const used = sessionsToday();
  const limit = dailyLimit();

  if (!signedIn) {
    return (
      <section className="card acc-page-empty">
        <h2>Your account</h2>
        <p className="muted">Sign in to see your plan, payments and progress on every device.</p>
        <button className="btn primary" onClick={onSignIn}>
          Sign in
        </button>
      </section>
    );
  }

  return (
    <div className="acc-page">
      <section className="card acc-profile">
        <span className={`acc-avatar${state ? (isLifetime ? ' gold' : ' plus') : ''}`}>{(username ?? '?').charAt(0).toUpperCase()}</span>
        <div className="acc-who">
          <strong>{guest ? 'Guest account' : username}</strong>
          <span className="muted small">{guest ? `Username: ${username}` : 'Signed in with Puter'}</span>
        </div>
        {state && <span className={`acc-tag${isLifetime ? ' gold' : ''}`}>{isLifetime ? '👑 Lifetime' : '✨ Plus'}</span>}
      </section>

      {guest && (
        <section className="card acc-guest">
          <p>
            <strong>Keep your progress safe.</strong> Save it with Google so you never lose your streaks{state ? ' or your Plus' : ''}, and use Granny on other devices.
          </p>
          <button className="btn primary small" onClick={onSignIn}>
            Save progress with Google
          </button>
        </section>
      )}

      <section className={`card acc-plan${isLifetime ? ' gold' : state ? ' plus' : ''}`}>
        <div className="row-between">
          <h2>Your plan</h2>
          {state && <span className="acc-status">Active</span>}
          {ended && <span className="acc-status ended">Ended</span>}
        </div>
        {state ? (
          <>
            <p className="acc-plan-name">
              {isLifetime ? '👑' : '✨'} {PLANS[state.plan].name}
            </p>
            <dl className="acc-facts">
              {state.since && (
                <>
                  <dt>Member since</dt>
                  <dd>{fmtDate(state.since)}</dd>
                </>
              )}
              <dt>{isLifetime ? 'Valid' : 'Ends on'}</dt>
              <dd>{isLifetime ? 'Forever' : fmtDate(state.until)}</dd>
              <dt>Includes</dt>
              <dd>{isLifetime ? '6 practices a day · all 8 conversations' : '6 practices a day · 3 everyday conversations'}</dd>
            </dl>
            {left !== null && (
              <>
                <div className="acc-bar" aria-label={`${left} of 30 days left`}>
                  <span style={{ width: `${Math.min(100, (left / 30) * 100)}%` }} className={left <= 4 ? 'low' : ''} />
                </div>
                <p className={`small ${left <= 4 ? 'error' : 'muted'}`}>
                  {left} {left === 1 ? 'day' : 'days'} left{left <= 4 ? ' · renew soon to keep 6 practices a day' : ''}
                </p>
                <div className="actions start">
                  <button className="btn primary small" onClick={() => go('/plus')}>
                    Renew Monthly
                  </button>
                  <button className="btn ghost small" onClick={() => go('/plus')}>
                    👑 Upgrade to Lifetime
                  </button>
                </div>
              </>
            )}
          </>
        ) : (
          <>
            <p className="acc-plan-name">Free plan</p>
            <p className="muted small">
              {ended ? `Your ${PLANS[ended.plan].name} ended on ${fmtDate(ended.until)}. ` : ''}3 practices a day and 3 everyday conversations.
            </p>
            <button className="btn primary small" onClick={() => go('/plus')}>
              {ended ? 'Renew Plus' : 'See Granny Plus'}
            </button>
          </>
        )}
      </section>

      <section className={`card acc-gifts${isLifetime ? ' gold' : ''}`}>
        <div className="row-between">
          <h2>🎁 {isLifetime ? 'Your free downloads' : 'Lifetime gifts'}</h2>
          {!isLifetime && <span className="acc-tag gold">👑 Lifetime</span>}
        </div>
        {!isLifetime && <p className="muted small">Included free with Plus Lifetime:</p>}
        <ul>
          {FREEBIES.map((f) => (
            <li key={f.file} className={isLifetime ? '' : 'locked'}>
              <span className="gift-icon" aria-hidden>
                {f.icon}
              </span>
              <div>
                <strong>{f.title}</strong>
                <span className="muted small">
                  {f.desc} · PDF, {f.pages} pages
                </span>
              </div>
              {isLifetime ? (
                <a className="btn primary small" href={f.file} download onClick={() => track('freebie_download', { file: f.file })}>
                  Download
                </a>
              ) : (
                <span aria-label="Locked">🔒</span>
              )}
            </li>
          ))}
        </ul>
        {!isLifetime && (
          <button className="btn primary small" onClick={() => go('/plus')}>
            Get Lifetime
          </button>
        )}
      </section>

      <section className="card">
        <h2>Today</h2>
        <div className="acc-bar">
          <span style={{ width: `${Math.min(100, (used / limit) * 100)}%` }} />
        </div>
        <p className="muted small">
          {used} of {limit} practices used today · resets at midnight
        </p>
      </section>

      <section className="card acc-payments">
        <h2>Payments</h2>
        {list.length === 0 ? (
          <p className="muted small">No payments yet.</p>
        ) : (
          <ul>
            {list.map((p) => (
              <li key={p.ref}>
                <div>
                  <strong>{PLANS[p.plan].name}</strong>
                  <span className="muted small">
                    {fmtDate(p.date)} · Ref {p.ref.replace(/^code:/, '').slice(0, 10).toUpperCase()}
                  </span>
                </div>
                <span className="acc-amount">₹{p.amount.toLocaleString('en-IN')}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card acc-help">
        <h2>Help</h2>
        <p className="muted small">
          Questions about payments or refunds? WhatsApp{' '}
          <a href={`https://wa.me/${BUSINESS.whatsapp}`} target="_blank" rel="noopener">
            {BUSINESS.phoneDisplay}
          </a>{' '}
          or email <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a>.
        </p>
        <button className="btn ghost small" onClick={onSignOut}>
          Sign out
        </button>
      </section>
    </div>
  );
}
