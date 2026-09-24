import { useEffect, useState } from 'react';
import { BUSINESS, UPI } from '../config';
import { track } from '../lib/analytics';
import { PLANS, type PlanId } from '../lib/plan';
import UpiPay from './UpiPay';

const newOrderId = () => 'GR' + Math.random().toString(36).slice(2, 7).toUpperCase();

interface Props {
  plan: PlanId;
  username: string;
  onClose: () => void;
  onHaveCode: () => void;
}

/** Checkout sheet: plan summary → pay (UPI) → confirm on WhatsApp → activation code. */
export default function Checkout({ plan, username, onClose, onHaveCode }: Props) {
  const p = PLANS[plan];
  const [order] = useState(newOrderId);
  const [utr, setUtr] = useState('');
  const [sent, setSent] = useState(false);
  const save = p.regular - p.price;
  const off = Math.round((save / p.regular) * 100);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const openWhatsApp = () => {
    const paid = Boolean(UPI.id);
    track(paid ? 'plus_upi_confirm' : 'plus_whatsapp', { plan });
    const text = [
      paid ? `Hi! I have paid for Granny ${p.name} (₹${p.price.toLocaleString('en-IN')}) by UPI.` : `Hi! I want to buy Granny ${p.name} (₹${p.price.toLocaleString('en-IN')}).`,
      `Order: ${order}`,
      paid ? (utr.trim() ? `UPI reference: ${utr.trim()}` : 'UPI reference: (screenshot attached)') : null,
      `My Puter username: ${username}`,
    ]
      .filter(Boolean)
      .join('\n');
    window.open(`https://wa.me/${BUSINESS.whatsapp}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
    setSent(true);
  };

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={`Buy ${p.name}`} onClick={(e) => e.stopPropagation()}>
        <div className="sheet-grip" aria-hidden />
        <button className="sheet-close" onClick={onClose} aria-label="Close">
          ✕
        </button>

        <div className={`co-summary${plan === 'lifetime' ? ' gold' : ''}`}>
          <span className="co-icon" aria-hidden>
            {plan === 'lifetime' ? '👑' : '✨'}
          </span>
          <div className="co-what">
            <strong>{p.name}</strong>
            <span>{plan === 'lifetime' ? '6 a day · all 8 conversations · 🎁 2 PDFs · forever' : '6 practices a day · 30 days'}</span>
          </div>
          <div className="co-price">
            <s>₹{p.regular.toLocaleString('en-IN')}</s>
            <strong>₹{p.price.toLocaleString('en-IN')}</strong>
            <em>{off}% off</em>
          </div>
        </div>

        {!sent ? (
          <>
            {UPI.id ? (
              <>
                <h3 className="co-step">1. Pay by UPI</h3>
                <UpiPay plan={plan} username={username} order={order} />
                <h3 className="co-step">2. Confirm your payment</h3>
                <label className="field">
                  <span className="muted small">UPI reference / UTR number (optional)</span>
                  <input
                    value={utr}
                    onChange={(e) => setUtr(e.target.value.replace(/[^0-9A-Za-z]/g, '').slice(0, 22))}
                    placeholder="e.g. 427812345678"
                    inputMode="numeric"
                  />
                </label>
                <button className="btn primary big" onClick={openWhatsApp}>
                  I've paid ✓
                </button>
              </>
            ) : (
              <>
                <ol className="co-how">
                  <li>
                    <span>1</span>Tap <strong>Continue</strong>: we get your order instantly.
                  </li>
                  <li>
                    <span>2</span>Pay ₹{p.price.toLocaleString('en-IN')} by UPI (GPay, PhonePe, Paytm…).
                  </li>
                  <li>
                    <span>3</span>Receive your activation code, usually within a few hours.
                  </li>
                </ol>
                <button className="btn primary big" onClick={openWhatsApp}>
                  Continue · ₹{p.price.toLocaleString('en-IN')}
                </button>
                <p className="muted small center">Your order opens in WhatsApp so we can help you personally.</p>
              </>
            )}
          </>
        ) : (
          <div className="co-done">
            <span aria-hidden>💌</span>
            <strong>Thank you! Your order {order} is on its way to us.</strong>
            <p className="muted small">
              {UPI.id
                ? "We'll check your payment and send your activation code on WhatsApp, usually within a few hours."
                : "We'll reply on WhatsApp with the payment details, then send your activation code."}
            </p>
            <button
              className="btn ghost"
              onClick={() => {
                onClose();
                onHaveCode();
              }}
            >
              I have my code
            </button>
          </div>
        )}

        <ul className="co-trust">
          <li>🔒 Secure UPI</li>
          <li>↩️ 3-day refund</li>
          <li>💬 Real human support</li>
        </ul>
      </div>
    </div>
  );
}
