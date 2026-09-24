import { useCallback, useEffect, useState } from 'react';
import Account from './components/Account';
import AccountPage from './components/AccountPage';
import Badges from './components/Badges';
import Feedback from './components/Feedback';
import History from './components/History';
import Landing from './components/Landing';
import Legal from './components/Legal';
import Plus from './components/Plus';
import RenewalNotice from './components/RenewalNotice';
import PracticeFlow from './components/PracticeFlow';
import Talk from './components/Talk';
import { pushSummary, syncNow } from './lib/cloud';
import { daysLeft, isPlus, plusState } from './lib/plan';
import { getAccount, isSignedIn, loadPuter, signIn, signOut } from './lib/puter';
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
  const [guest, setGuest] = useState(false);
  // Bumped when the signed-in account changes (e.g. guest → Google) to re-run the sync.
  const [accountVersion, setAccountVersion] = useState(0);
  const [plus, setPlus] = useState(isPlus);

  useEffect(() => {
    if (route !== '/') markVisitedApp();
  }, [route]);

  // Load Puter (sign-in + AI) in the background: right away inside the app, and once the
  // landing page has finished loading, so "Test your English" feels instant.
  useEffect(() => {
    const load = () => loadPuter().then(() => setSignedIn(isSignedIn())).catch(() => {});
    if (route !== '/' && !LEGAL_ROUTES.includes(route)) {
      load();
      return;
    }
    const t = window.setTimeout(load, 2500);
    return () => window.clearTimeout(t);
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
      setGuest(false);
      return;
    }
    getAccount().then((a) => {
      setUsername(a.username);
      setGuest(a.guest);
    });
    const sync = () => syncNow().then((ok) => ok && refresh());
    sync();
    window.addEventListener('online', sync);
    return () => window.removeEventListener('online', sync);
  }, [signedIn, accountVersion, refresh]);

  const updateSettings = (s: Settings) => {
    setSettings(s);
    saveSettings(s);
    void pushSummary();
  };

  /** "Sign in" / "Save progress with Google": the full Puter sign-in where Google can be chosen. */
  const handleSignIn = async () => {
    try {
      await signIn({ pickAccount: isSignedIn() });
    } catch {
      return;
    }
    setSignedIn(isSignedIn());
    setAccountVersion((v) => v + 1);
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

  /** Must run from a click so the Puter popup isn't blocked. New learners get a one-tap guest account. */
  const ensureSignedIn = useCallback(async () => {
    if (isSignedIn()) return true;
    try {
      await signIn({ guest: true });
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
        <PlusBadge plus={plus} active={route === '/plus'} />
        <Account signedIn={signedIn} username={username} onSignIn={handleSignIn} />
      </header>

      <RenewalNotice key={String(plus)} />

      <main>
        {route === '/practice' && (
          <PracticeFlow settings={settings} onSettings={updateSettings} days={days} signedIn={signedIn} ensureSignedIn={ensureSignedIn} onSaved={refresh} />
        )}
        {route === '/talk' && <Talk settings={settings} ensureSignedIn={ensureSignedIn} onSaved={refresh} />}
        {route === '/badges' && <Badges days={days} />}
        {route === '/history' && <History items={history} />}
        {route === '/feedback' && <Feedback username={username} />}
        {route === '/account' && <AccountPage signedIn={signedIn} username={username} guest={guest} onSignIn={handleSignIn} onSignOut={handleSignOut} />}
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

/** Header upgrade button: "⚡ Upgrade" (free), "👑 Upgrade" / "⏳ Renew" (Monthly), or "👑 Lifetime". Opens the Plus page. */
function PlusBadge({ plus, active }: { plus: boolean; active: boolean }) {
  const state = plus ? plusState() : null;
  const left = daysLeft(state);
  if (state?.plan === 'lifetime') {
    return (
      <button className={`plus-btn member gold${active ? ' on' : ''}`} onClick={() => go('/plus')} title="You have Plus Lifetime">
        👑 Lifetime
      </button>
    );
  }
  if (state) {
    const ending = left !== null && left <= 4;
    return (
      <button
        className={`plus-btn${ending ? ' member ending' : ''}${active ? ' on' : ''}`}
        onClick={() => go('/plus')}
        title={ending ? 'Renew your Plus Monthly' : 'Upgrade to Lifetime: all 8 conversations'}
      >
        {ending ? `⏳ Renew · ${left}d` : '👑 Upgrade'}
      </button>
    );
  }
  return (
    <button className={`plus-btn${active ? ' on' : ''}`} onClick={() => go('/plus')} title="Upgrade: more practice and conversations">
      ⚡ Upgrade
    </button>
  );
}
