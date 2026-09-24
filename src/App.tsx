import { useCallback, useEffect, useState } from 'react';
import Account from './components/Account';
import Badges from './components/Badges';
import Feedback from './components/Feedback';
import History from './components/History';
import Landing from './components/Landing';
import Legal from './components/Legal';
import Plus from './components/Plus';
import PracticeFlow from './components/PracticeFlow';
import Talk from './components/Talk';
import { pushSummary, syncNow } from './lib/cloud';
import { isPlus } from './lib/plan';
import { getUsername, isSignedIn, signIn, signOut } from './lib/puter';
import { go, LEGAL_ROUTES, useRoute, type Route } from './lib/router';
import { clearLocal, loadDays, loadHistory, loadSettings, markVisitedApp, saveSettings } from './lib/storage';
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

  useEffect(() => {
    if (route !== '/') markVisitedApp();
  }, [route]);

  const refresh = useCallback(() => {
    setDays(loadDays());
    setHistory(loadHistory());
    setPlus(isPlus());
    setSettings(loadSettings());
  }, []);

  // When signed in, merge this device with the learner's account (on start and when back online).
  useEffect(() => {
    if (!signedIn) {
      setUsername(null);
      return;
    }
    getUsername().then(setUsername);
    const sync = () => syncNow().then((ok) => ok && refresh());
    sync();
    window.addEventListener('online', sync);
    return () => window.removeEventListener('online', sync);
  }, [signedIn, refresh]);

  const updateSettings = (s: Settings) => {
    setSettings(s);
    saveSettings(s);
    void pushSummary();
  };

  const handleSignIn = async () => {
    try {
      await signIn();
    } catch {
      return;
    }
    setSignedIn(isSignedIn());
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (e) {
      console.error(e);
    }
    clearLocal(); // their progress is safe in their account; don't leave it on a shared phone
    setSignedIn(false);
    refresh();
    go('/practice');
  };

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
  if (LEGAL_ROUTES.includes(route)) return <Legal route={route} />;

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
        <Account signedIn={signedIn} username={username} onSignIn={handleSignIn} onSignOut={handleSignOut} />
      </header>

      <main>
        {route === '/practice' && (
          <PracticeFlow settings={settings} onSettings={updateSettings} days={days} signedIn={signedIn} ensureSignedIn={ensureSignedIn} onSaved={refresh} />
        )}
        {route === '/talk' && <Talk settings={settings} ensureSignedIn={ensureSignedIn} onSaved={refresh} />}
        {route === '/badges' && <Badges days={days} />}
        {route === '/history' && <History items={history} />}
        {route === '/feedback' && <Feedback username={username} />}
        {route === '/plus' && (
          <Plus
            username={username}
            ensureSignedIn={ensureSignedIn}
            onChange={() => {
              refresh();
              void pushSummary();
            }}
          />
        )}
      </main>

      <footer className="foot">
        <a href="#/">About</a> · <a href="#/feedback">Feedback</a> · <a href="#/privacy">Privacy</a> · <a href="#/terms">Terms</a> · <a href="#/refund">Refunds</a> ·{' '}
        <a href="#/contact">Contact</a>
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
