import { useEffect, useState } from 'react';
import { onSyncState, type SyncState } from '../lib/cloud';
import { plusState } from '../lib/plan';
import { go } from '../lib/router';

interface Props {
  signedIn: boolean;
  username: string | null;
  onSignIn: () => void;
}

/** Header account button: "Sign in", or the learner's avatar which opens My account directly. */
export default function Account({ signedIn, username, onSignIn }: Props) {
  const [sync, setSync] = useState<SyncState>('off');
  useEffect(() => onSyncState(setSync), []);

  if (!signedIn) {
    return (
      <button className="account-btn signin" onClick={onSignIn}>
        Sign in
      </button>
    );
  }

  const plan = plusState();
  const tier = plan?.plan === 'lifetime' ? 'gold' : plan ? 'plus' : '';
  return (
    <button className={`account-btn avatar-btn sync-${sync} ${tier}`} onClick={() => go('/account')} aria-label="My account" title="My account">
      {(username ?? '?').charAt(0).toUpperCase()}
      {plan && (
        <span className="avatar-badge" aria-hidden>
          {plan.plan === 'lifetime' ? '👑' : '✨'}
        </span>
      )}
    </button>
  );
}
