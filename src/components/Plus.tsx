import { useState } from 'react';
import { buyPlus, paymentsLive, testUpgradeAllowed } from '../lib/payments';
import { cancelTestPlus, PLANS, plusState, type PlanId } from '../lib/plan';
import { go } from '../lib/router';
import Pricing from './Pricing';

export default function Plus({ username, onChange }: { username: string | null; onChange: () => void }) {
  const [busy, setBusy] = useState<PlanId | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const state = plusState();

  const buy = async (plan: PlanId) => {
    setBusy(plan);
    setMsg(null);
    try {
      const ok = await buyPlus(plan, username ? { name: username } : undefined);
      if (ok) {
        setMsg({ ok: true, text: 'Welcome to Granny Plus! Practise as much as you like, beta. ✨' });
        onChange();
      }
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : 'The payment did not go through.' });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="plus-page">
      <section className="hero">
        <div className="granny-face" aria-hidden>
          ✨
        </div>
        <div>
          <h1>Granny Plus</h1>
          <p>Practise as much as you like and unlock every conversation. ₹99 a month, or pay once for life.</p>
        </div>
      </section>

      {state && (
        <section className="card plus-active">
          <h2>You are a Plus member 💛</h2>
          <p>
            {PLANS[state.plan].name}
            {PLANS[state.plan].days === null
              ? ' · yours forever'
              : ` · active until ${new Date(state.until).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}`}
            {state.test && ' (test mode, no real payment)'}
          </p>
          {state.test && (
            <button
              className="btn ghost small"
              onClick={() => {
                cancelTestPlus();
                onChange();
              }}
            >
              End test membership
            </button>
          )}
        </section>
      )}

      {msg && <p className={msg.ok ? 'success banner' : 'error banner'}>{msg.text}</p>}

      <Pricing
        onFree={() => go('/practice')}
        onPlus={buy}
        busy={busy}
        plusDisabled={(!paymentsLive && !testUpgradeAllowed) || state?.plan === 'lifetime'}
        plusLabel={paymentsLive ? (state ? 'Extend Plus' : 'Get Plus') : testUpgradeAllowed ? 'Test upgrade (no payment)' : 'Coming soon'}
      />

      {!paymentsLive && (
        <p className="muted small center">
          {testUpgradeAllowed
            ? 'Payments are in test mode: add your Razorpay key to take real payments.'
            : 'Online payments are coming very soon.'}
        </p>
      )}
      <p className="muted small center">Secure payments by Razorpay · UPI, cards, net banking and wallets.</p>
    </div>
  );
}
