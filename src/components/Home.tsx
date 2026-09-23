import type { ExplainLang, Level, Settings } from '../lib/types';
import StreakGrid from './StreakGrid';

const LEVELS: Array<{ id: Level; label: string; hint: string }> = [
  { id: 'beginner', label: 'Beginner', hint: 'Simple, everyday topics' },
  { id: 'intermediate', label: 'Intermediate', hint: 'Stories and situations' },
  { id: 'advanced', label: 'Advanced', hint: 'Opinions and debates' },
];

const LANGS: Array<{ id: ExplainLang; label: string }> = [
  { id: 'english', label: 'English' },
  { id: 'hinglish', label: 'Hinglish' },
  { id: 'hindi', label: 'हिंदी' },
];

interface Props {
  settings: Settings;
  onSettings: (s: Settings) => void;
  days: Record<string, number>;
  signedIn: boolean;
  loading: boolean;
  error: string | null;
  onStart: () => void;
}

export default function Home({ settings, onSettings, days, signedIn, loading, error, onStart }: Props) {
  return (
    <div className="home">
      <section className="hero">
        <div className="granny-face" aria-hidden>
          👵
        </div>
        <div>
          <h1>Namaste, beta!</h1>
          <p>
            Come, sit with Granny and talk about anything. Nobody here will laugh at your mistakes — we will fix them together, one by one.
          </p>
        </div>
      </section>

      <section className="card">
        <h2>How hard should today's topic be?</h2>
        <div className="choice-grid">
          {LEVELS.map((l) => (
            <button
              key={l.id}
              className={`choice${settings.level === l.id ? ' on' : ''}`}
              onClick={() => onSettings({ ...settings, level: l.id })}
              aria-pressed={settings.level === l.id}
            >
              <strong>{l.label}</strong>
              <span>{l.hint}</span>
            </button>
          ))}
        </div>

        <h2 className="mt">Granny should explain in</h2>
        <div className="segmented" role="group" aria-label="Explanation language">
          {LANGS.map((l) => (
            <button key={l.id} className={settings.lang === l.id ? 'on' : ''} onClick={() => onSettings({ ...settings, lang: l.id })} aria-pressed={settings.lang === l.id}>
              {l.label}
            </button>
          ))}
        </div>

        <button className="btn primary big" onClick={onStart} disabled={loading}>
          {loading ? 'Granny is thinking of a topic…' : signedIn ? 'Give me a topic' : 'Sign in with Puter & start'}
        </button>
        {!signedIn && (
          <p className="muted small center">
            Granny uses Puter for her AI. It's free: sign in once with a Puter account and you never need an API key.
          </p>
        )}
        {error && <p className="error center">{error}</p>}
      </section>

      <StreakGrid days={days} />
    </div>
  );
}
