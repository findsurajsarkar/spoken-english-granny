import { useState } from 'react';
import { BUSINESS } from '../config';
import { track } from '../lib/analytics';
import { redeemCode } from '../lib/codes';
import { buyPlus, paymentsLive } from '../lib/payments';
import { daysLeft, FREE_DAILY_SESSIONS, PLANS, plusState, PLUS_DAILY_SESSIONS, type PlanId } from '../lib/plan';
import { canSellHere } from '../lib/platform';
import { getAccount } from '../lib/puter';
import { go } from '../lib/router';
import Checkout from './Checkout';

interface Props {
  username: string | null;
  ensureSignedIn: () => Promise<boolean>;
  onChange: () => void;
}

const off = (id: PlanId) => Math.round(((PLANS[id].regular - PLANS[id].price) / PLANS[id].regular) * 100);
const rupees = (n: number) => `₹${n.toLocaleString('en-IN')}`;

const COMPARE: Array<{ label: string; free: string | boolean; monthly: string | boolean; lifetime: string | boolean }> = [
  { label: 'Practices every day', free: String(FREE_DAILY_SESSIONS), monthly: String(PLUS_DAILY_SESSIONS), lifetime: String(PLUS_DAILY_SESSIONS) },
  { label: 'Red-pen corrections & marks', free: true, monthly: true, lifetime: true },
  { label: 'Hindi & Hinglish explanations', free: true, monthly: true, lifetime: true },
  { label: '3 everyday conversations', free: true, monthly: true, lifetime: true },
  { label: 'Job interview + 4 more conversations', free: false, monthly: false, lifetime: true },
  { label: '🎁 Grammar Guide + 30-Day Planner (PDF)', free: false, monthly: false, lifetime: true },
  { label: 'Streaks, badges & history', free: true, monthly: true, lifetime: true },
  { label: 'Price', free: '₹0', monthly: `${rupees(PLANS.monthly.price)}/mo`, lifetime: `${rupees(PLANS.lifetime.price)} once` },
];

const FAQ = [
  { q: 'Does Monthly renew automatically?', a: 'No. It simply ends after 30 days. We remind you a few days before, and you renew only if you want to.' },
  { q: 'Can I upgrade from Monthly to Lifetime?', a: 'Yes, any time. Lifetime unlocks all 8 conversations, including job interview practice, forever.' },
  { q: 'How quickly is Plus switched on?', a: 'Usually within a few hours of payment. You get a code on WhatsApp and enter it here.' },
  { q: 'What if I am not happy?', a: `Full refund within 3 days of payment. Just message us on WhatsApp ${BUSINESS.phoneDisplay}.` },
];

const cell = (v: string | boolean) => (v === true ? <span className="yes">✓</span> : v === false ? <span className="no">—</span> : v);

export default function Plus({ username, ensureSignedIn, onChange }: Props) {
  const [busy, setBusy] = useState<PlanId | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [checkout, setCheckout] = useState<{ plan: PlanId; username: string } | null>(null);
  const [showCode, setShowCode] = useState(false);
  const [code, setCode] = useState('');
  const [checking, setChecking] = useState(false);
  const [faq, setFaq] = useState<number | null>(null);
  const state = plusState();
  const left = daysLeft(state);
  const isLifetime = state?.plan === 'lifetime';

  const buy = async (plan: PlanId) => {
    track('plus_click', { plan });
    setMsg(null);
    if (!(await ensureSignedIn())) {
      setMsg({ ok: false, text: 'Please sign in first, so your Plus can be added to your account.' });
      return;
    }
    if (paymentsLive) {
      setBusy(plan);
      try {
        if (await buyPlus(plan, username ? { name: username } : undefined)) {
          track('purchase', { plan, value: PLANS[plan].price, currency: 'INR' });
          setMsg({ ok: true, text: `Welcome to Granny ${PLANS[plan].name}! ✨` });
          onChange();
        }
      } catch (e) {
        setMsg({ ok: false, text: e instanceof Error ? e.message : 'The payment did not go through.' });
      } finally {
        setBusy(null);
      }
      return;
    }
    const name = username ?? (await getAccount()).username;
    if (!name) {
      setMsg({ ok: false, text: 'Please sign in first, so your Plus can be added to your account.' });
      return;
    }
    setCheckout({ plan, username: name });
  };

  const redeem = async () => {
    setMsg(null);
    if (!(await ensureSignedIn()) || !username) {
      setMsg({ ok: false, text: 'Please sign in with the same account you gave us, then enter the code.' });
      return;
    }
    setChecking(true);
    const plan = await redeemCode(username, code);
    setChecking(false);
    if (plan) {
      track('plus_redeemed', { plan });
      setCode('');
      setShowCode(false);
      setMsg({ ok: true, text: `Welcome to Granny ${PLANS[plan].name}! ${plan === 'lifetime' ? '👑' : '✨'} Thank you, beta.` });
      onChange();
    } else {
      setMsg({
        ok: false,
        text: `That code didn't work for ${username}. Check it, or message us on WhatsApp (${BUSINESS.phoneDisplay}). New codes can take a minute to start working.`,
      });
    }
  };

  const PlanCard = ({ id }: { id: PlanId }) => {
    const p = PLANS[id];
    const best = id === 'lifetime';
    const owned = state?.plan === id;
    const disabled = !canSellHere || isLifetime || busy != null;
    return (
      <div className={`pp-card${best ? ' best' : ''}`}>
        {best && <span className="pp-ribbon">Best value</span>}
        <div className="pp-head">
          <span className="pp-icon" aria-hidden>
            {best ? '👑' : '✨'}
          </span>
          <div>
            <strong>{p.name}</strong>
            <span className="pp-sub">{best ? 'Everything, forever' : 'Practise more each day'}</span>
          </div>
        </div>
        <div className="pp-price">
          <s>{rupees(p.regular)}</s>
          <strong>{rupees(p.price)}</strong>
          <span>{best ? 'one time' : '/ month'}</span>
          <em>{off(id)}% OFF</em>
        </div>
        <ul className="pp-list">
          <li>{PLUS_DAILY_SESSIONS} practices every day</li>
          {best ? (
            <>
              <li>
                <b>All 8 conversations</b> incl. job interview
              </li>
              <li>
                🎁 <b>Free:</b> Grammar Guide + 30-Day Planner (PDF)
              </li>
              <li>Pay once, no renewals</li>
            </>
          ) : (
            <>
              <li>3 everyday conversations</li>
              <li>30 days · no auto-renewal</li>
            </>
          )}
        </ul>
        {canSellHere && (
          <button className={`btn big ${best ? 'primary gold-btn' : 'primary'}`} onClick={() => buy(id)} disabled={disabled}>
            {busy === id ? 'Opening…' : owned ? (best ? 'Your plan ✓' : 'Renew · add 30 days') : isLifetime ? 'Included in Lifetime' : 'Buy now'}
          </button>
        )}
        {best && <p className="pp-note">One payment. Never renew again.</p>}
      </div>
    );
  };

  return (
    <div className="plus-page">
      <section className="pp-hero">
        <span className="pp-offer">🎉 Launch offer · up to {Math.max(off('monthly'), off('lifetime'))}% off</span>
        <h1>
          Speak more. <span>Improve faster.</span>
        </h1>
        <p>Double your daily practice and unlock job-interview practice with Granny Plus.</p>
      </section>

      {state && (
        <section className={`card pp-member${isLifetime ? ' gold' : ''}`}>
          <span className="pp-icon" aria-hidden>
            {isLifetime ? '👑' : '✨'}
          </span>
          <div>
            <strong>You're a {PLANS[state.plan].name} member</strong>
            <span className="muted small">{isLifetime ? 'Yours forever. Thank you, beta!' : `${left} ${left === 1 ? 'day' : 'days'} left`}</span>
          </div>
          <button className="btn ghost small" onClick={() => go('/account')}>
            My account
          </button>
        </section>
      )}

      {msg && <p className={msg.ok ? 'success banner' : 'error banner'}>{msg.text}</p>}
      {!canSellHere && !state && (
        <p className="muted center">Granny Plus can't be bought inside this app yet. If you already have Plus, sign in and it will appear automatically.</p>
      )}

      <div className="pp-cards">
        <PlanCard id="lifetime" />
        <PlanCard id="monthly" />
      </div>

      <ul className="pp-trust">
        <li>🔒 Secure UPI payment</li>
        <li>↩️ 3-day full refund</li>
        <li>⚡ Activated within hours</li>
      </ul>

      <section className="card pp-compare">
        <h2>Compare plans</h2>
        <table>
          <thead>
            <tr>
              <th />
              <th>Free</th>
              <th>Monthly</th>
              <th className="hl">Lifetime</th>
            </tr>
          </thead>
          <tbody>
            {COMPARE.map((r) => (
              <tr key={r.label}>
                <td>{r.label}</td>
                <td>{cell(r.free)}</td>
                <td>{cell(r.monthly)}</td>
                <td className="hl">{cell(r.lifetime)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="card pp-faq">
        <h2>Questions</h2>
        {FAQ.map((f, i) => (
          <div key={f.q} className="pp-faq-item">
            <button onClick={() => setFaq(faq === i ? null : i)} aria-expanded={faq === i}>
              {f.q}
              <span aria-hidden>{faq === i ? '−' : '+'}</span>
            </button>
            {faq === i && <p>{f.a}</p>}
          </div>
        ))}
      </section>

      <div className="pp-code">
        {!showCode ? (
          <button className="btn link" onClick={() => setShowCode(true)}>
            Have an activation code?
          </button>
        ) : (
          <section className="card redeem">
            <h2>Enter your activation code</h2>
            <form
              className="type-row"
              onSubmit={(e) => {
                e.preventDefault();
                if (code.trim()) redeem();
              }}
            >
              <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="ABCD-1234" autoCapitalize="characters" aria-label="Activation code" autoFocus />
              <button className="btn primary small" disabled={!code.trim() || checking}>
                {checking ? 'Checking…' : 'Activate'}
              </button>
            </form>
            {username && <p className="muted small">Signed in as {username}. Codes only work for the account they were made for.</p>}
          </section>
        )}
      </div>

      {checkout && (
        <Checkout
          plan={checkout.plan}
          username={checkout.username}
          onClose={() => setCheckout(null)}
          onHaveCode={() => {
            setShowCode(true);
            setTimeout(() => document.querySelector('.pp-code')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
          }}
        />
      )}
    </div>
  );
}
