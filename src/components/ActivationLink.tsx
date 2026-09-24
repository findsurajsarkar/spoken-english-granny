import { useEffect, useState } from 'react';
import { BUSINESS } from '../config';
import { activateWithToken, type ActivationResult } from '../lib/activation';
import { track } from '../lib/analytics';
import { PLANS } from '../lib/plan';
import { getAccount } from '../lib/puter';

interface Props {
  token: string;
  signedIn: boolean;
  onSignIn: () => void;
  onDone: () => void;
}

/** Shown when the app is opened from an activation link (?activate=…). */
export default function ActivationLink({ token, signedIn, onSignIn, onDone }: Props) {
  const [result, setResult] = useState<ActivationResult | null>(null);
  const [me, setMe] = useState<string | null>(null);

  useEffect(() => {
    if (!signedIn) return;
    let cancelled = false;
    (async () => {
      const { username } = await getAccount();
      if (cancelled || !username) return;
      setMe(username);
      const r = await activateWithToken(token, username);
      if (cancelled) return;
      setResult(r);
      track(r.ok ? 'plus_link_activated' : 'plus_link_failed', r.ok ? { plan: r.plan } : { reason: r.reason });
      if (r.ok) onDone();
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signedIn, token]);

  const close = () => {
    history.replaceState(null, '', window.location.pathname + window.location.hash);
    onDone();
    setResult({ ok: false, reason: 'invalid' });
    setDismissed(true);
  };
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  let body;
  if (!signedIn) {
    body = (
      <>
        <span className="al-icon">🔑</span>
        <h2>Activate your Granny Plus</h2>
        <p className="muted">Sign in with the account you used when you bought Plus, and it switches on straight away.</p>
        <button className="btn primary big" onClick={onSignIn}>
          Sign in to activate
        </button>
      </>
    );
  } else if (!result) {
    body = (
      <>
        <span className="al-icon">⏳</span>
        <h2>Switching on your Plus…</h2>
      </>
    );
  } else if (result.ok) {
    const lifetime = result.plan === 'lifetime';
    body = (
      <>
        <span className="al-icon">{lifetime ? '👑' : '✨'}</span>
        <h2>Welcome to Granny {PLANS[result.plan].name}!</h2>
        <p className="muted">
          {lifetime
            ? 'All 8 conversations are unlocked, you can practise 6 times a day, and your free PDFs are in My account.'
            : 'You can now practise 6 times a day, and ordering food and shopping conversations are unlocked.'}
        </p>
        <button className="btn primary big" onClick={close}>
          Start practising
        </button>
      </>
    );
  } else {
    const text =
      result.reason === 'wrong-account'
        ? `This link is for the account "${result.forUser}", but this app is signed in as "${me}". Open the link on the phone where you bought Plus, or message us and we'll fix it.`
        : result.reason === 'expired'
          ? 'This link has expired. Message us and we will send a new one.'
          : "This link isn't valid. Please copy the whole link from WhatsApp, or message us.";
    body = (
      <>
        <span className="al-icon">🤔</span>
        <h2>Couldn't activate</h2>
        <p className="muted">{text}</p>
        <a className="btn primary" href={`https://wa.me/${BUSINESS.whatsapp}`} target="_blank" rel="noopener">
          Message us on WhatsApp
        </a>
        <button className="btn link" onClick={close}>
          Close
        </button>
      </>
    );
  }

  return (
    <div className="sheet-backdrop">
      <div className="sheet al-sheet" role="dialog" aria-modal="true">
        {body}
      </div>
    </div>
  );
}
