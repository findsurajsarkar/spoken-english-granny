import QRCode from 'qrcode';
import { useEffect, useMemo, useState } from 'react';
import { BUSINESS, UPI } from '../config';
import { track } from '../lib/analytics';
import { PLANS, type PlanId } from '../lib/plan';

const isMobile = /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent);

/** A short order number the customer and owner can both see (in the UPI note and WhatsApp). */
const newOrderId = () => 'GR' + Math.random().toString(36).slice(2, 7).toUpperCase();

interface Props {
  plan: PlanId;
  username: string;
  onClose: () => void;
}

/** Pay by UPI: QR code + "open UPI app" link with amount and note pre-filled, then confirm on WhatsApp. */
export default function UpiPay({ plan, username, onClose }: Props) {
  const p = PLANS[plan];
  const [order] = useState(newOrderId);
  const [qr, setQr] = useState('');
  const [utr, setUtr] = useState('');
  const [copied, setCopied] = useState(false);
  const [sent, setSent] = useState(false);

  const note = `Granny ${plan === 'monthly' ? 'Monthly' : 'Lifetime'} ${order} ${username}`.slice(0, 50);
  // Spaces as %20 (not "+") and the UPI ID as-is: the format every UPI app understands.
  const link = useMemo(() => {
    const e = encodeURIComponent;
    return `upi://pay?pa=${UPI.id.trim()}&pn=${e(UPI.payeeName)}&am=${p.price.toFixed(2)}&cu=INR&tn=${e(note)}&tr=${order}`;
  }, [p.price, note, order]);

  useEffect(() => {
    QRCode.toDataURL(link, { errorCorrectionLevel: 'M', margin: 1, width: 440, color: { dark: '#3b2f2a', light: '#ffffff' } })
      .then(setQr)
      .catch(() => setQr(''));
  }, [link]);

  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(UPI.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked; the ID is visible anyway */
    }
  };

  const confirm = () => {
    track('plus_upi_confirm', { plan });
    const text = [
      `Hi! I have paid for Granny ${p.name} (₹${p.price.toLocaleString('en-IN')}) by UPI.`,
      `Order: ${order}`,
      utr.trim() ? `UPI reference: ${utr.trim()}` : 'UPI reference: (screenshot attached)',
      `My Puter username: ${username}`,
    ].join('\n');
    window.open(`https://wa.me/${BUSINESS.whatsapp}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
    setSent(true);
  };

  return (
    <section className="card upi-pay" aria-label="Pay by UPI">
      <div className="row-between">
        <h2>
          Pay ₹{p.price.toLocaleString('en-IN')} for {p.name}
        </h2>
        <button className="btn ghost small" onClick={onClose} aria-label="Close">
          ✕
        </button>
      </div>

      <ol className="upi-steps">
        <li className="on">
          <span>1</span>Pay by UPI
        </li>
        <li className={sent ? 'on' : ''}>
          <span>2</span>Confirm on WhatsApp
        </li>
        <li>
          <span>3</span>Get your code
        </li>
      </ol>

      <div className="upi-body">
        {qr && <img className="upi-qr" src={qr} alt={`UPI QR code to pay ₹${p.price}`} width={220} height={220} />}
        <div className="upi-info">
          {isMobile && (
            <a className="btn primary upi-open" href={link} onClick={() => track('plus_upi_open', { plan })}>
              Pay with UPI app
            </a>
          )}
          <p className="muted small">{isMobile ? 'Or scan the QR from another phone, or pay to this UPI ID:' : 'Scan with GPay, PhonePe, Paytm or any UPI app, or pay to:'}</p>
          <div className="upi-id">
            <code>{UPI.id}</code>
            <button className="btn ghost small" onClick={copyId}>
              {copied ? 'Copied ✓' : 'Copy'}
            </button>
          </div>
          <p className="small">
            Amount: <strong>₹{p.price.toLocaleString('en-IN')}</strong> · Order: <strong>{order}</strong>
          </p>
        </div>
      </div>

      <div className="upi-confirm">
        <label className="field">
          <span>After paying: UPI reference / UTR number (optional)</span>
          <input value={utr} onChange={(e) => setUtr(e.target.value.replace(/[^0-9A-Za-z]/g, '').slice(0, 22))} placeholder="e.g. 427812345678" inputMode="numeric" />
        </label>
        <button className="btn primary" onClick={confirm}>
          I've paid: send confirmation
        </button>
        {sent ? (
          <p className="success banner">Thank you! 💛 We'll check the payment and send your activation code on WhatsApp, usually within a few hours.</p>
        ) : (
          <p className="muted small">WhatsApp opens with your order details. If you have no reference number, just attach the payment screenshot there.</p>
        )}
      </div>
    </section>
  );
}
