import { useEffect, useState } from 'react';
import { decodeSetupKey, importPrivateKey, makeActivationLink, parseOrderMessage, welcomeMessage } from '../lib/activation';
import { PLANS, type PlanId } from '../lib/plan';
import { read, write } from '../lib/storage';

/* Owner-only page (#/admin, not linked anywhere). Turns a customer's WhatsApp message into a signed
 * activation link, ready to share back on WhatsApp, straight from the owner's phone.
 * The private signing key is stored only in this browser (set up once with the phone setup link). */

const KEY_STORE = 'granny.adminKey.v1';
const LOG_STORE = 'granny.adminLog.v1';

interface LogEntry {
  date: string;
  username: string;
  plan: PlanId;
  order?: string;
  amount: number;
}

export default function Admin() {
  const [jwk, setJwk] = useState<JsonWebKey | null>(() => read<JsonWebKey | null>(KEY_STORE, null));
  const [text, setText] = useState('');
  const [username, setUsername] = useState('');
  const [plan, setPlan] = useState<PlanId>('lifetime');
  const [order, setOrder] = useState('');
  const [received, setReceived] = useState(false);
  const [message, setMessage] = useState('');
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const [log, setLog] = useState<LogEntry[]>(() => read<LogEntry[]>(LOG_STORE, []));
  const [warn, setWarn] = useState<string | null>(null);

  // One-time setup: #/admin?k=<key> saves the key on this phone, then removes it from the address bar.
  useEffect(() => {
    const k = new URLSearchParams(window.location.hash.split('?')[1] ?? '').get('k');
    if (!k) return;
    const key = decodeSetupKey(k);
    if (key) {
      write(KEY_STORE, key);
      setJwk(key);
      setNote({ ok: true, text: 'This phone is now set up to create activation links. Bookmark this page.' });
    } else setNote({ ok: false, text: 'That setup link is not valid.' });
    history.replaceState(null, '', window.location.pathname + '#/admin');
  }, []);

  const fill = (t: string) => {
    setText(t);
    const p = parseOrderMessage(t);
    if (p.username) setUsername(p.username);
    if (p.plan) setPlan(p.plan);
    if (p.order) setOrder(p.order);
    setMessage('');
    const w: string[] = [];
    if (p.plan && p.amount && p.amount !== PLANS[p.plan].price) w.push(`Message says ₹${p.amount.toLocaleString('en-IN')}, current price is ₹${PLANS[p.plan].price.toLocaleString('en-IN')}.`);
    if (t.trim() && !p.paid) w.push('This looks like an order request, not a payment. Send UPI details first.');
    setWarn(w.length ? w.join(' ') : null);
  };

  const paste = async () => {
    try {
      fill(await navigator.clipboard.readText());
    } catch {
      setNote({ ok: false, text: 'Could not read the clipboard. Long-press the box below and choose Paste.' });
    }
  };

  const create = async () => {
    if (!jwk || !username.trim()) return;
    try {
      const key = await importPrivateKey(jwk);
      const link = await makeActivationLink(key, username, plan, order.trim() || undefined);
      const msg = welcomeMessage(username.trim(), plan, link);
      setMessage(msg);
      const entry: LogEntry = { date: new Date().toISOString(), username: username.trim(), plan, order: order.trim() || undefined, amount: PLANS[plan].price };
      const next = [entry, ...log].slice(0, 200);
      setLog(next);
      write(LOG_STORE, next);
      setNote({ ok: true, text: 'Activation link ready. Share it with the customer.' });
    } catch (e) {
      setNote({ ok: false, text: `Could not create the link: ${e instanceof Error ? e.message : e}` });
    }
  };

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ text: message });
        return;
      } catch {
        /* cancelled */
        return;
      }
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank', 'noopener');
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setNote({ ok: true, text: 'Message copied. Paste it in the customer’s WhatsApp chat.' });
    } catch {
      setNote({ ok: false, text: 'Could not copy. Select the message and copy it.' });
    }
  };

  const reset = () => {
    setText('');
    setUsername('');
    setOrder('');
    setReceived(false);
    setMessage('');
    setWarn(null);
    setNote(null);
  };

  if (!jwk) {
    return (
      <section className="card admin">
        <h2>Granny Admin</h2>
        <p className="muted small">This page is only for the owner. Open your private setup link once on this phone to use it.</p>
        {note && <p className={note.ok ? 'success banner' : 'error banner'}>{note.text}</p>}
      </section>
    );
  }

  const total = log.reduce((s, l) => s + l.amount, 0);

  return (
    <div className="admin">
      <section className="card">
        <div className="row-between">
          <h2>🔑 Activate a customer</h2>
          <button className="btn ghost small" onClick={reset}>
            New
          </button>
        </div>
        {note && <p className={note.ok ? 'success banner' : 'error banner'}>{note.text}</p>}

        <label className="field">
          <span>1. Customer's WhatsApp message</span>
          <textarea rows={4} value={text} onChange={(e) => fill(e.target.value)} placeholder="Long-press the customer's message in WhatsApp → Copy, then tap Paste." />
        </label>
        <button className="btn ghost small" onClick={paste}>
          📋 Paste from clipboard
        </button>

        <div className="admin-grid">
          <label className="field">
            <span>Username</span>
            <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="e.g. creative_fish_51930" autoCapitalize="off" autoCorrect="off" />
          </label>
          <label className="field">
            <span>Plan</span>
            <select value={plan} onChange={(e) => setPlan(e.target.value as PlanId)}>
              <option value="lifetime">Plus Lifetime · ₹{PLANS.lifetime.price.toLocaleString('en-IN')}</option>
              <option value="monthly">Plus Monthly · ₹{PLANS.monthly.price.toLocaleString('en-IN')}</option>
            </select>
          </label>
          <label className="field">
            <span>Order (optional)</span>
            <input value={order} onChange={(e) => setOrder(e.target.value.toUpperCase())} placeholder="GR…" />
          </label>
        </div>
        {warn && <p className="error small">⚠ {warn}</p>}

        <label className="check">
          <input type="checkbox" checked={received} onChange={(e) => setReceived(e.target.checked)} />
          <span>
            2. I have received ₹{PLANS[plan].price.toLocaleString('en-IN')} in my bank/UPI app{order ? ` (note ${order})` : ''}
          </span>
        </label>

        <button className="btn primary big" disabled={!username.trim() || !received} onClick={create}>
          3. Create activation link
        </button>

        {message && (
          <div className="admin-result">
            <pre>{message}</pre>
            <div className="actions start">
              <button className="btn primary" onClick={share}>
                Share on WhatsApp
              </button>
              <button className="btn ghost" onClick={copy}>
                Copy
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="card">
        <div className="row-between">
          <h2>Sales on this phone</h2>
          <span className="pill soft">₹{total.toLocaleString('en-IN')}</span>
        </div>
        {log.length === 0 ? (
          <p className="muted small">No activations yet.</p>
        ) : (
          <ul className="admin-log">
            {log.map((l, i) => (
              <li key={i}>
                <div>
                  <strong>{l.username}</strong>
                  <span className="muted small">
                    {new Date(l.date).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })} · {PLANS[l.plan].name}
                    {l.order ? ` · ${l.order}` : ''}
                  </span>
                </div>
                <span className="acc-amount">₹{l.amount.toLocaleString('en-IN')}</span>
              </li>
            ))}
          </ul>
        )}
        <button
          className="btn link"
          onClick={() => {
            if (confirm('Remove the admin key from this phone? You will need the setup link again.')) {
              write(KEY_STORE, null);
              setJwk(null);
            }
          }}
        >
          Remove admin access from this phone
        </button>
      </section>
    </div>
  );
}
