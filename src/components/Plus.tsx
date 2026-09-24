import { useState } from 'react';
import { BUSINESS } from '../config';
import { track } from '../lib/analytics';
import { redeemCode } from '../lib/codes';
import { buyPlus, paymentsLive } from '../lib/payments';
import { cancelTestPlus, PLANS, plusState, type PlanId } from '../lib/plan';
import { canSellHere } from '../lib/platform';
import { go } from '../lib/router';
import Pricing from './Pricing';

interface Props {
  username: string | null;
  ensureSignedIn: () => Promise<boolean>;
  onChange: () => void;
}

export default function Plus({ username, ensureSignedIn, onChange }: Props) {
  const [busy, setBusy] = useState<PlanId | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [code, setCode] = useState('');
  const [checking, setChecking] = useState(false);
  const state = plusState();

  const buyOnWhatsApp = async (plan: PlanId) => {
    if (!(await ensureSignedIn())) {
      setMsg({ ok: false, text: 'Please sign in first, so your Plus can be added to your account.' });
      return;
    }
    const p = PLANS[plan];
    const text =
      `Hi! I want to buy Granny ${p.name} (₹${p.price.toLocaleString('en-IN')}).\n` + `My Puter username: ${username ?? '(I will share it)'}`;
    track('plus_whatsapp', { plan });
    window.open(`https://wa.me/${BUSINESS.whatsapp}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
    setMsg({ ok: true, text: 'WhatsApp is opening. We will send you the UPI details, and your activation code after payment.' });
  };

  const buy = async (plan: PlanId) => {
    track('plus_click', { plan });
    if (!paymentsLive) return buyOnWhatsApp(plan);
    setBusy(plan);
    setMsg(null);
    try {
      const ok = await buyPlus(plan, username ? { name: username } : undefined);
      if (ok) {
        track('purchase', { plan, value: PLANS[plan].price, currency: 'INR' });
        setMsg({ ok: true, text: 'Welcome to Granny Plus! Six practices a day and every conversation are yours, beta. ✨' });
        onChange();
      }
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : 'The payment did not go through.' });
    } finally {
      setBusy(null);
    }
  };

  const redeem = async () => {
    setMsg(null);
    if (!(await ensureSignedIn()) || !username) {
      setMsg({ ok: false, text: 'Please sign in with the same Puter account you gave us, then enter the code.' });
      return;
    }
    setChecking(true);
    const plan = await redeemCode(username, code);
    setChecking(false);
    if (plan) {
      track('plus_redeemed', { plan });
      setCode('');
      setMsg({ ok: true, text: `Welcome to Granny ${PLANS[plan].name}! ✨ Thank you, beta.` });
      onChange();
    } else {
      setMsg({
        ok: false,
        text: `That code didn't work for ${username}. Check it, or message us on WhatsApp (${BUSINESS.phoneDisplay}). New codes can take a minute to start working.`,
      });
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
          <p>6 practices a day and every conversation. ₹99 a month, or pay once for life.</p>
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

      {!canSellHere && !state && (
        <p className="muted center">Granny Plus can't be bought inside this app yet. If you already have Plus, sign in and it will appear automatically.</p>
      )}

      <Pricing
        onFree={() => go('/practice')}
        onPlus={buy}
        busy={busy}
        hidePlusButtons={!canSellHere}
        plusDisabled={state?.plan === 'lifetime'}
        plusLabel={paymentsLive ? (state ? 'Extend Plus' : 'Get Plus') : 'Buy on WhatsApp'}
      />

      {canSellHere && !paymentsLive && (
        <section className="card how-to-buy">
          <h2>How buying works</h2>
          <ol>
            <li>Tap <strong>Buy on WhatsApp</strong>. A message with your plan and username opens.</li>
            <li>We reply with UPI details. Pay with any UPI app (GPay, PhonePe, Paytm…).</li>
            <li>We send your <strong>activation code</strong>, usually within a few hours. Enter it below.</li>
          </ol>
          <p className="muted small">
            Questions? WhatsApp {BUSINESS.phoneDisplay}. Not happy? Full refund within 3 days (<a href="#/refund">refund policy</a>).
          </p>
        </section>
      )}

      <section className="card redeem">
        <h2>Have an activation code?</h2>
        <form
          className="type-row"
          onSubmit={(e) => {
            e.preventDefault();
            if (code.trim()) redeem();
          }}
        >
          <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="ABCD-1234" autoCapitalize="characters" aria-label="Activation code" />
          <button className="btn primary small" disabled={!code.trim() || checking}>
            {checking ? 'Checking…' : 'Activate'}
          </button>
        </form>
        {username && <p className="muted small">Signed in as {username}. Codes only work for the account they were made for.</p>}
      </section>
    </div>
  );
}
