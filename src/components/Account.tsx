import { useEffect, useRef, useState } from 'react';
import { onSyncState, type SyncState } from '../lib/cloud';

const SYNC_TEXT: Record<SyncState, string> = {
  off: 'Not saved to an account',
  syncing: 'Saving…',
  saved: 'Progress saved to your account ✓',
  error: "Couldn't save just now. Granny will try again.",
};

interface Props {
  signedIn: boolean;
  username: string | null;
  onSignIn: () => void;
  onSignOut: () => void;
}

export default function Account({ signedIn, username, onSignIn, onSignOut }: Props) {
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
  return (
    <div className="account" ref={ref}>
      <button className={`account-btn avatar-btn sync-${sync}`} onClick={() => setOpen(!open)} aria-expanded={open} aria-label="Your account">
        {initial}
      </button>
      {open && (
        <div className="account-menu" role="menu">
          <p className="acc-name">{username ?? 'Signed in'}</p>
          <p className={`acc-sync sync-${sync}`}>{SYNC_TEXT[sync]}</p>
          <p className="muted small">Your history, streaks and badges follow you to any device where you sign in.</p>
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
