import QRCode from 'qrcode';
import { useEffect, useMemo, useState } from 'react';
import { UPI } from '../config';
import { track } from '../lib/analytics';
import { PLANS, type PlanId } from '../lib/plan';

const isMobile = /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent);

interface Props {
  plan: PlanId;
  username: string;
  order: string;
}

/** UPI QR + "Pay with UPI app" link, with the amount and a note (order + username) filled in. */
export default function UpiPay({ plan, username, order }: Props) {
  const p = PLANS[plan];
  const [qr, setQr] = useState('');
  const [copied, setCopied] = useState(false);

  const note = `Granny ${p.short} ${order} ${username}`.slice(0, 50);
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

  return (
    <div className="upi-body">
      {isMobile && (
        <a className="btn primary big upi-open" href={link} onClick={() => track('plus_upi_open', { plan })}>
          Pay ₹{p.price.toLocaleString('en-IN')} with UPI app
        </a>
      )}
      <div className="upi-row">
        {qr && <img className="upi-qr" src={qr} alt={`UPI QR code to pay ₹${p.price}`} width={180} height={180} />}
        <div className="upi-info">
          <p className="muted small">{isMobile ? 'Or scan from another phone, or pay to:' : 'Scan with GPay, PhonePe, Paytm or any UPI app, or pay to:'}</p>
          <div className="upi-id">
            <code>{UPI.id}</code>
            <button className="btn ghost small" onClick={copyId}>
              {copied ? 'Copied ✓' : 'Copy'}
            </button>
          </div>
          <p className="small">
            Order <strong>{order}</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
