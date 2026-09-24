import { useState } from 'react';
import { BUSINESS, FEEDBACK_FORM_URL } from '../config';
import { track } from '../lib/analytics';

export default function Feedback({ username }: { username: string | null }) {
  const [rating, setRating] = useState(0);
  const [liked, setLiked] = useState('');
  const [improve, setImprove] = useState('');
  const [quote, setQuote] = useState(false);
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [sent, setSent] = useState(false);

  const message = () =>
    [
      'Spoken English Granny feedback',
      `Rating: ${'❤️'.repeat(rating)}${rating ? ` (${rating}/5)` : 'not given'}`,
      liked && `What I liked: ${liked}`,
      improve && `What could be better: ${improve}`,
      `May you quote me on the website: ${quote ? 'YES' : 'no'}`,
      quote && `Name: ${name || '-'} · City: ${city || '-'}`,
      username && `Puter username: ${username}`,
    ]
      .filter(Boolean)
      .join('\n');

  const send = (via: 'whatsapp' | 'email') => {
    track('feedback_sent', { rating, quote, via });
    const text = message();
    if (via === 'whatsapp') {
      window.open(`https://wa.me/${BUSINESS.whatsapp}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
    } else {
      window.location.href = `mailto:${BUSINESS.email}?subject=${encodeURIComponent('Granny feedback')}&body=${encodeURIComponent(text)}`;
    }
    setSent(true);
  };

  const ready = rating > 0 && (liked.trim() || improve.trim());

  return (
    <section className="card feedback">
      <h2>How is Granny doing?</h2>
      <p className="muted small">Your honest words help us make Granny better, and help other shy learners find her.</p>

      <div className="hearts" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" role="radio" aria-checked={rating === n} className={n <= rating ? 'on' : ''} onClick={() => setRating(n)} aria-label={`${n} of 5`}>
            {n <= rating ? '❤️' : '🤍'}
          </button>
        ))}
      </div>

      <label className="field">
        <span>What did you like?</span>
        <textarea rows={3} value={liked} onChange={(e) => setLiked(e.target.value)} placeholder="e.g. The red-pen corrections helped me understand my mistakes" />
      </label>
      <label className="field">
        <span>What could be better?</span>
        <textarea rows={3} value={improve} onChange={(e) => setImprove(e.target.value)} placeholder="Anything confusing, missing or annoying" />
      </label>

      <label className="check">
        <input type="checkbox" checked={quote} onChange={(e) => setQuote(e.target.checked)} />
        <span>You may show my words on the Spoken English Granny website</span>
      </label>
      {quote && (
        <div className="field-row">
          <label className="field">
            <span>Name to show</span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Priya S." />
          </label>
          <label className="field">
            <span>City / what you do</span>
            <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Student, Lucknow" />
          </label>
        </div>
      )}

      <div className="actions">
        <button className="btn ghost" disabled={!ready} onClick={() => send('email')}>
          Send by email
        </button>
        <button className="btn primary" disabled={!ready} onClick={() => send('whatsapp')}>
          Send on WhatsApp
        </button>
      </div>
      {!ready && <p className="muted small">Choose a rating and write at least one answer.</p>}
      {sent && <p className="success banner">Thank you, beta! Granny read every word. 💛</p>}
      {FEEDBACK_FORM_URL && (
        <p className="muted small">
          Prefer a form? <a href={FEEDBACK_FORM_URL} target="_blank" rel="noopener">Fill in our short feedback form</a>.
        </p>
      )}
    </section>
  );
}
