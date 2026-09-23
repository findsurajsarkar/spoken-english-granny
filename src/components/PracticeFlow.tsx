import { useCallback, useState } from 'react';
import type { Badge } from '../lib/badges';
import { checkAndSave } from '../lib/attempts';
import { newTopic } from '../lib/granny';
import { canPractise } from '../lib/plan';
import { recentTopicTitles } from '../lib/storage';
import type { Attempt, Settings, Topic } from '../lib/types';
import Checking from './Checking';
import Home from './Home';
import LimitCard from './LimitCard';
import Practice from './Practice';
import Result from './Result';

type View =
  | { name: 'home' }
  | { name: 'limit' }
  | { name: 'practice'; topic: Topic; key: number }
  | { name: 'checking' }
  | { name: 'result'; attempt: Attempt; badges: Badge[] };

interface Props {
  settings: Settings;
  onSettings: (s: Settings) => void;
  days: Record<string, number>;
  signedIn: boolean;
  ensureSignedIn: () => Promise<boolean>;
  onSaved: () => void;
}

export default function PracticeFlow({ settings, onSettings, days, signedIn, ensureSignedIn, onSaved }: Props) {
  const [view, setView] = useState<View>({ name: 'home' });
  const [loadingTopic, setLoadingTopic] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const show = (v: View) => {
    setView(v);
    window.scrollTo({ top: 0 });
  };

  const fetchTopic = useCallback(async () => {
    if (!canPractise()) return show({ name: 'limit' });
    setError(null);
    setLoadingTopic(true);
    try {
      const topic = await newTopic(settings.level, recentTopicTitles());
      show({ name: 'practice', topic, key: Date.now() });
    } catch (e) {
      console.error(e);
      setError('Granny could not think of a topic just now. Please try again.');
    } finally {
      setLoadingTopic(false);
    }
  }, [settings.level]);

  const start = async () => {
    if (!(await ensureSignedIn())) {
      setError('Sign-in was closed. Granny needs you to sign in with Puter to use her AI.');
      return;
    }
    fetchTopic();
  };

  const check = async (topic: Topic, transcript: string) => {
    setError(null);
    show({ name: 'checking' });
    try {
      const { attempt, badges } = await checkAndSave({ topic, transcript, lang: settings.lang });
      onSaved();
      show({ name: 'result', attempt, badges });
    } catch (e) {
      console.error(e);
      setError('Granny could not check your page this time. Your topic is still here, please try again.');
      show({ name: 'practice', topic, key: Date.now() });
    }
  };

  switch (view.name) {
    case 'home':
      return <Home settings={settings} onSettings={onSettings} days={days} signedIn={signedIn} loading={loadingTopic} error={error} onStart={start} />;
    case 'limit':
      return <LimitCard onBack={() => show({ name: 'home' })} />;
    case 'practice':
      return (
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
      );
    case 'checking':
      return <Checking />;
    case 'result':
      return (
        <Result
          attempt={view.attempt}
          newBadges={view.badges}
          onAgain={() => (canPractise() ? show({ name: 'practice', topic: view.attempt.topic, key: Date.now() }) : show({ name: 'limit' }))}
          onNew={() => {
            show({ name: 'home' });
            fetchTopic();
          }}
        />
      );
  }
}
