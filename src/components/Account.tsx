import { useEffect, useRef, useState } from 'react';
import { onSyncState, type SyncState } from '../lib/cloud';
import { daysLeft, PLANS, plusState } from '../lib/plan';
import { go } from '../lib/router';

const SYNC_TEXT: Record<SyncState, string> = {
  off: 'Not saved to an account',
  syncing: 'Saving…',
  saved: 'Progress saved to your account ✓',
  error: "Couldn't save just now. Granny will try again.",
};

interface Props {
  signedIn: boolean;
  username: string | null;
  guest: boolean;
  onSignIn: () => void;
  onSignOut: () => void;
}

export default function Account({ signedIn, username, guest, onSignIn, onSignOut }: Props) {
  const [open, setOpen] = useState(false);
  const [sync, setSync] = useState<SyncState>('off');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => onSyncState(setSync), []);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  if (!signedIn) {
    return (
      <button className="account-btn signin" onClick={onSignIn}>
        Sign in
      </button>
    );
  }

  const initial = (username ?? '?').charAt(0).toUpperCase();
  const plan = plusState();
  const left = daysLeft(plan);
  const tier = plan?.plan === 'lifetime' ? 'gold' : plan ? 'plus' : '';
  return (
    <div className="account" ref={ref}>
      <button className={`account-btn avatar-btn sync-${sync} ${tier}`} onClick={() => setOpen(!open)} aria-expanded={open} aria-label="Your account">
        {initial}
        {plan && (
          <span className="avatar-badge" aria-hidden>
            {plan.plan === 'lifetime' ? '👑' : '✨'}
          </span>
        )}
      </button>
      {open && (
        <div className="account-menu" role="menu">
          <p className="acc-name">{guest ? 'Guest account' : username ?? 'Signed in'}</p>
          <p className={`acc-member ${tier}`}>
            {plan ? `${plan.plan === 'lifetime' ? '👑' : '✨'} ${PLANS[plan.plan].name}${left !== null ? ` · ${left} ${left === 1 ? 'day' : 'days'} left` : ''}` : 'Free plan'}
          </p>
          <p className={`acc-sync sync-${sync}`}>{SYNC_TEXT[sync]}</p>
          <button
            className="btn ghost small"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              go('/account');
            }}
          >
            My account
          </button>
          {guest ? (
            <>
              <p className="muted small">You're practising as a guest. Save your progress with Google so you never lose it, and use it on other devices.</p>
              <button
                className="btn primary small"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  onSignIn();
                }}
              >
                Save progress with Google
              </button>
            </>
          ) : (
            <p className="muted small">Your history, streaks and badges follow you to any device where you sign in.</p>
          )}
          <button
            className="btn ghost small"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onSignOut();
            }}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
