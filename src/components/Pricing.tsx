import { FREE_DAILY_SESSIONS, PLANS, PLUS_DAILY_SESSIONS, type PlanId } from '../lib/plan';

export const FREE_FEATURES = [
  `${FREE_DAILY_SESSIONS} practices a day`,
  'Topics at every level',
  'Red-pen notebook corrections',
  'Explanations in English, Hinglish or Hindi',
  '3 everyday conversations',
  'Streaks and badges',
];

export const PLUS_FEATURES = [
  `${PLUS_DAILY_SESSIONS} practices a day, double the free plan`,
  'All 8 conversations: job interview, office, doctor, airport and more',
  'Everything in Free',
];

interface Props {
  onFree: () => void;
  onPlus: (plan: PlanId) => void;
  busy?: PlanId | null;
  plusLabel?: string;
  plusDisabled?: boolean;
}

export default function Pricing({ onFree, onPlus, busy, plusLabel, plusDisabled }: Props) {
  return (
    <div className="pricing">
      <div className="price-card">
        <h3>Free</h3>
        <p className="price">
          ₹0 <span>forever</span>
        </p>
        <ul>
          {FREE_FEATURES.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
        <button className="btn ghost" onClick={onFree}>
          Start practising
        </button>
      </div>

      {(['monthly', 'lifetime'] as PlanId[]).map((id) => {
        const p = PLANS[id];
        return (
          <div key={id} className={`price-card plus${id === 'lifetime' ? ' featured' : ''}`}>
            {id === 'lifetime' && <span className="ribbon">Best value</span>}
            <h3>{p.name}</h3>
            <p className="price">
              ₹{p.price.toLocaleString('en-IN')} <span>{p.days === null ? p.per : `/ ${p.per}`}</span>
            </p>
            <p className="muted small">{p.note}</p>
            <ul>
              {PLUS_FEATURES.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
            <button className="btn primary" onClick={() => onPlus(id)} disabled={plusDisabled || busy != null}>
              {busy === id ? 'Opening…' : plusLabel ?? 'Get Plus'}
            </button>
          </div>
        );
      })}
    </div>
  );
}
