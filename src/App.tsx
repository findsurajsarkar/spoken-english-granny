import { useCallback, useEffect, useState } from 'react';
import History from './components/History';
import Home from './components/Home';
import Practice from './components/Practice';
import Result from './components/Result';
import { checkEnglish, newTopic } from './lib/granny';
import { getUsername, isSignedIn, signIn } from './lib/puter';
import { loadDays, loadHistory, loadSettings, recentTopicTitles, saveAttempt, saveSettings } from './lib/storage';
import type { Attempt, Settings, Topic } from './lib/types';

type View =
  | { name: 'home' }
  | { name: 'practice'; topic: Topic; key: number }
  | { name: 'checking'; topic: Topic }
  | { name: 'result'; attempt: Attempt; readOnly: boolean }
  | { name: 'history' };

const CHECKING_LINES = ['Granny is putting on her glasses…', 'Reading your page carefully…', 'Taking out the red pen…', 'Writing little notes for you…'];

export default function App() {
  const [view, setView] = useState<View>({ name: 'home' });
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const [days, setDays] = useState(loadDays);
  const [history, setHistory] = useState(loadHistory);
  const [signedIn, setSignedIn] = useState(isSignedIn);
  const [username, setUsername] = useState<string | null>(null);
  const [loadingTopic, setLoadingTopic] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [line, setLine] = useState(0);

  useEffect(() => {
    if (signedIn) getUsername().then(setUsername);
  }, [signedIn]);

  useEffect(() => {
    if (view.name !== 'checking') return;
    const t = window.setInterval(() => setLine((l) => (l + 1) % CHECKING_LINES.length), 2200);
    return () => window.clearInterval(t);
  }, [view.name]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [view.name]);

  const updateSettings = (s: Settings) => {
    setSettings(s);
    saveSettings(s);
  };

  const fetchTopic = useCallback(async () => {
    setError(null);
    setLoadingTopic(true);
    try {
      const topic = await newTopic(settings.level, recentTopicTitles());
      setView({ name: 'practice', topic, key: Date.now() });
    } catch (e) {
      console.error(e);
      setError('Granny could not think of a topic just now. Please try again.');
    } finally {
      setLoadingTopic(false);
    }
  }, [settings.level]);

  const start = async () => {
    if (!isSignedIn()) {
      try {
        await signIn(); // called straight from the click, so the popup isn't blocked
      } catch {
        setError('Sign-in was closed. Granny needs you to sign in with Puter to use her AI.');
        return;
      }
      setSignedIn(isSignedIn());
    }
    fetchTopic();
  };

  const check = async (topic: Topic, transcript: string) => {
    setLine(0);
    setError(null);
    setView({ name: 'checking', topic });
    try {
      const analysis = await checkEnglish(topic, transcript, settings.lang);
      const attempt: Attempt = {
        id: crypto.randomUUID?.() ?? String(Date.now()),
        createdAt: new Date().toISOString(),
        topic,
        transcript,
        analysis,
        lang: settings.lang,
      };
      saveAttempt(attempt);
      setDays(loadDays());
      setHistory(loadHistory());
      setView({ name: 'result', attempt, readOnly: false });
    } catch (e) {
      console.error(e);
      setError('Granny could not check your page this time. Your topic is still here, please try again.');
      setView({ name: 'practice', topic, key: Date.now() });
    }
  };

  return (
    <div className="app">
      <header className="topbar">
        <button className="brand" onClick={() => setView({ name: 'home' })}>
          <img src="icon.svg" alt="" width={32} height={32} />
          <span>Spoken English Granny</span>
        </button>
        <nav>
          <button className={`nav-btn${view.name === 'history' ? ' on' : ''}`} onClick={() => setView({ name: 'history' })}>
            History
          </button>
          {signedIn && username && <span className="user" title="Signed in with Puter">{username}</span>}
        </nav>
      </header>

      <main>
        {view.name === 'home' && (
          <Home settings={settings} onSettings={updateSettings} days={days} signedIn={signedIn} loading={loadingTopic} error={error} onStart={start} />
        )}

        {view.name === 'practice' && (
          <>
            {error && <p className="error banner">{error}</p>}
            <Practice
              key={view.key}
              topic={view.topic}
              lang={settings.lang}
              loadingTopic={loadingTopic}
              onNewTopic={fetchTopic}
              onCheck={(t) => check(view.topic, t)}
            />
          </>
        )}

        {view.name === 'checking' && (
          <section className="card checking">
            <div className="pen" aria-hidden>
              ✎
            </div>
            <p>{CHECKING_LINES[line]}</p>
          </section>
        )}

        {view.name === 'result' && (
          <Result
            attempt={view.attempt}
            readOnly={view.readOnly}
            onAgain={() => setView({ name: 'practice', topic: view.attempt.topic, key: Date.now() })}
            onNew={() => {
              if (view.readOnly) return setView({ name: 'history' });
              setView({ name: 'home' });
              fetchTopic();
            }}
          />
        )}

        {view.name === 'history' && <History items={history} onOpen={(a) => setView({ name: 'result', attempt: a, readOnly: true })} />}
      </main>

      <footer className="foot">Made with love · Granny never laughs at mistakes</footer>
    </div>
  );
}
