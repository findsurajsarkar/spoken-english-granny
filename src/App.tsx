import { useCallback, useEffect, useState } from 'react';
import Badges from './components/Badges';
import History from './components/History';
import Landing from './components/Landing';
import Plus from './components/Plus';
import PracticeFlow from './components/PracticeFlow';
import Talk from './components/Talk';
import { isPlus } from './lib/plan';
import { getUsername, isSignedIn, signIn } from './lib/puter';
import { go, useRoute, type Route } from './lib/router';
import { hasVisitedApp, loadDays, loadHistory, loadSettings, markVisitedApp, saveSettings } from './lib/storage';
import type { Settings } from './lib/types';

const TABS: Array<{ route: Route; label: string; icon: string }> = [
  { route: '/practice', label: 'Practice', icon: '🎤' },
  { route: '/talk', label: 'Talk', icon: '💬' },
  { route: '/badges', label: 'Badges', icon: '🏅' },
  { route: '/history', label: 'History', icon: '📒' },
];

export default function App() {
  const route = useRoute();
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const [days, setDays] = useState(loadDays);
  const [history, setHistory] = useState(loadHistory);
  const [signedIn, setSignedIn] = useState(isSignedIn);
  const [username, setUsername] = useState<string | null>(null);
  const [plus, setPlus] = useState(isPlus);

  // Returning learners skip the landing page when they open the bare URL.
  useEffect(() => {
    if (!window.location.hash && hasVisitedApp()) go('/practice');
  }, []);

  useEffect(() => {
    if (route !== '/') markVisitedApp();
  }, [route]);

  useEffect(() => {
    if (signedIn) getUsername().then(setUsername);
  }, [signedIn]);

  const updateSettings = (s: Settings) => {
    setSettings(s);
    saveSettings(s);
  };

  const refresh = useCallback(() => {
    setDays(loadDays());
    setHistory(loadHistory());
    setPlus(isPlus());
  }, []);

  /** Must run from a click so the Puter sign-in popup isn't blocked. */
  const ensureSignedIn = useCallback(async () => {
    if (isSignedIn()) return true;
    try {
      await signIn();
    } catch {
      return false;
    }
    const ok = isSignedIn();
    setSignedIn(ok);
    return ok;
  }, []);

  if (route === '/') return <Landing />;

  return (
    <div className="app">
      <header className="topbar">
        <button className="brand" onClick={() => go('/practice')}>
          <img src="icon.svg" alt="" width={32} height={32} />
          <span>Spoken English Granny</span>
        </button>
        <nav className="top-tabs" aria-label="Main">
          {TABS.map((t) => (
            <button key={t.route} className={`nav-btn${route === t.route ? ' on' : ''}`} onClick={() => go(t.route)}>
              {t.label}
            </button>
          ))}
        </nav>
        <button className={`plus-btn${plus ? ' member' : ''}${route === '/plus' ? ' on' : ''}`} onClick={() => go('/plus')} title={username ? `Signed in as ${username}` : undefined}>
          {plus ? '✨ Plus' : 'Get Plus'}
        </button>
      </header>

      <main>
        {route === '/practice' && (
          <PracticeFlow settings={settings} onSettings={updateSettings} days={days} signedIn={signedIn} ensureSignedIn={ensureSignedIn} onSaved={refresh} />
        )}
        {route === '/talk' && <Talk settings={settings} ensureSignedIn={ensureSignedIn} onSaved={refresh} />}
        {route === '/badges' && <Badges days={days} />}
        {route === '/history' && <History items={history} />}
        {route === '/plus' && <Plus username={username} onChange={refresh} />}
      </main>

      <footer className="foot">
        <a href="#/">About Granny</a> · Made with love · Granny never laughs at mistakes
      </footer>

      <nav className="bottom-tabs" aria-label="Main">
        {TABS.map((t) => (
          <button key={t.route} className={route === t.route ? 'on' : ''} onClick={() => go(t.route)}>
            <span aria-hidden>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
