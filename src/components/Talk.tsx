import { useEffect, useRef, useState } from 'react';
import { hasLiveTranscription, useRecorder, type Recording } from '../hooks/useRecorder';
import type { Badge } from '../lib/badges';
import { checkAndSave } from '../lib/attempts';
import { learnerText, nextReply, talkTopic } from '../lib/granny';
import { canPractise, freeLeftToday, isPlus } from '../lib/plan';
import { transcribe } from '../lib/puter';
import { go } from '../lib/router';
import { SCENARIOS, TALK_TURNS, type Scenario } from '../lib/scenarios';
import type { Attempt, Settings, Turn } from '../lib/types';
import { canSpeak, speak, stopSpeaking } from '../lib/voice';
import Checking from './Checking';
import LimitCard from './LimitCard';
import Result from './Result';

type Stage =
  | { name: 'pick' }
  | { name: 'limit' }
  | { name: 'chat'; scenario: Scenario }
  | { name: 'checking' }
  | { name: 'result'; attempt: Attempt; badges: Badge[]; scenario: Scenario };

interface Props {
  settings: Settings;
  ensureSignedIn: () => Promise<boolean>;
  onSaved: () => void;
}

export default function Talk({ settings, ensureSignedIn, onSaved }: Props) {
  const [stage, setStage] = useState<Stage>({ name: 'pick' });
  const [error, setError] = useState<string | null>(null);
  const plus = isPlus();

  const show = (s: Stage) => {
    setStage(s);
    window.scrollTo({ top: 0 });
  };

  const begin = async (scenario: Scenario) => {
    if (scenario.plus && !plus) return go('/plus');
    if (!canPractise()) return show({ name: 'limit' });
    if (!(await ensureSignedIn())) {
      setError('Sign-in was closed. Granny needs you to sign in with Puter to use her AI.');
      return;
    }
    setError(null);
    show({ name: 'chat', scenario });
  };

  const finish = async (scenario: Scenario, turns: Turn[]) => {
    show({ name: 'checking' });
    try {
      const { attempt, badges } = await checkAndSave({
        topic: talkTopic(scenario, settings.level),
        transcript: learnerText(turns),
        lang: settings.lang,
        mode: 'talk',
        scenarioId: scenario.id,
        conversation: turns,
      });
      onSaved();
      show({ name: 'result', attempt, badges, scenario });
    } catch (e) {
      console.error(e);
      setError('Granny could not check this conversation. Please try again.');
      show({ name: 'pick' });
    }
  };

  switch (stage.name) {
    case 'limit':
      return <LimitCard onBack={() => show({ name: 'pick' })} />;
    case 'checking':
      return <Checking />;
    case 'chat':
      return <Chat key={stage.scenario.id} scenario={stage.scenario} settings={settings} onExit={() => show({ name: 'pick' })} onFinish={(t) => finish(stage.scenario, t)} />;
    case 'result':
      return (
        <Result
          attempt={stage.attempt}
          newBadges={stage.badges}
          onAgain={() => begin(stage.scenario)}
          onNew={() => show({ name: 'pick' })}
        />
      );
    case 'pick':
      return (
        <div className="talk-pick">
          <section className="hero small-hero">
            <div className="granny-face" aria-hidden>
              💬
            </div>
            <div>
              <h1>Let's talk, beta</h1>
              <p>
                Pick a situation and have a real conversation. Granny won't stop you for mistakes. She quietly notes them down and shows you at the end.
              </p>
            </div>
          </section>
          {!plus && (
            <p className="free-note">
              {freeLeftToday()} of 3 free practices left today · <button className="btn link inline" onClick={() => go('/plus')}>Unlock all conversations ✨</button>
            </p>
          )}
          {error && <p className="error banner">{error}</p>}
          <div className="scenario-grid">
            {SCENARIOS.map((s) => {
              const locked = s.plus && !plus;
              return (
                <button key={s.id} className={`scenario${locked ? ' locked' : ''}`} onClick={() => begin(s)}>
                  <span className="sc-emoji" aria-hidden>
                    {s.emoji}
                  </span>
                  <strong>{s.title}</strong>
                  <span className="muted small">{s.desc}</span>
                  {locked && <span className="lock">✨ Plus</span>}
                </button>
              );
            })}
          </div>
        </div>
      );
  }
}

/* ---------- the conversation itself ---------- */

function Chat({ scenario, settings, onExit, onFinish }: { scenario: Scenario; settings: Settings; onExit: () => void; onFinish: (turns: Turn[]) => void }) {
  const [turns, setTurns] = useState<Turn[]>([{ who: 'granny', text: scenario.opener }]);
  const [thinking, setThinking] = useState(false);
  const [hearing, setHearing] = useState(false);
  const [voiceOn, setVoiceOn] = useState(canSpeak);
  const [typed, setTyped] = useState('');
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const myTurns = turns.filter((t) => t.who === 'me').length;
  const done = myTurns >= TALK_TURNS && !thinking;

  useEffect(() => {
    if (voiceOn) speak(scenario.opener);
    return stopSpeaking;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [turns, thinking, hearing]);

  const send = async (text: string) => {
    const clean = text.trim();
    if (!clean) {
      setError("Granny couldn't hear any words. Try again a little closer to the mic.");
      return;
    }
    setError(null);
    const withMine: Turn[] = [...turns, { who: 'me', text: clean }];
    setTurns(withMine);
    setThinking(true);
    try {
      const left = TALK_TURNS - (myTurns + 1);
      const reply = await nextReply(scenario, settings.level, withMine, left);
      setTurns([...withMine, { who: 'granny', text: reply }]);
      if (voiceOn) speak(reply);
    } catch (e) {
      console.error(e);
      setError('Granny lost her train of thought. Please say that again.');
      setTurns(turns);
    } finally {
      setThinking(false);
    }
  };

  const onRecorded = async ({ audio, liveText, silent, seconds }: Recording) => {
    rec.reset();
    if (seconds < 1.2) return setError('That was very short. Tap the mic, say your answer, then tap again to send.');
    if (!audio) return liveText ? send(liveText) : undefined;
    setHearing(true);
    try {
      const text = (await transcribe(audio)) || liveText;
      if (text) send(text);
      else setError(silent ? "Granny couldn't hear any sound. Check the microphone isn't muted or blocked, and speak close to the phone." : "Granny couldn't make out any words. Please try again a little louder.");
    } catch (e) {
      console.error(e);
      if (liveText) send(liveText);
      else setError(`Granny couldn't hear that clearly. Try again, or type your answer. (${e instanceof Error ? e.message : 'transcription failed'})`);
    } finally {
      setHearing(false);
    }
  };

  const rec = useRecorder(60, onRecorded);
  const recording = rec.status === 'recording';
  const busy = thinking || hearing;

  const startRec = () => {
    stopSpeaking();
    rec.start();
  };

  return (
    <div className="talk">
      <div className="talk-head card">
        <button className="btn ghost small" onClick={onExit}>
          ← Back
        </button>
        <div className="talk-title">
          <strong>
            {scenario.emoji} {scenario.title}
          </strong>
          <span className="muted small">
            Turn {Math.min(myTurns + 1, TALK_TURNS)} of {TALK_TURNS}
          </span>
        </div>
        {canSpeak && (
          <button
            className="btn ghost small"
            onClick={() => {
              if (voiceOn) stopSpeaking();
              setVoiceOn(!voiceOn);
            }}
            aria-pressed={voiceOn}
            title="Granny reads her replies aloud"
          >
            {voiceOn ? '🔊' : '🔇'}
          </button>
        )}
      </div>

      <div className="chat card">
        {turns.map((t, i) => (
          <div key={i} className={`bubble-row ${t.who}`}>
            {t.who === 'granny' && (
              <span className="avatar" aria-hidden>
                {scenario.id === 'granny' ? '👵' : scenario.emoji}
              </span>
            )}
            <p className={`bubble ${t.who}`}>
              {t.text}
              {t.who === 'granny' && canSpeak && (
                <button className="replay" onClick={() => speak(t.text)} aria-label="Hear this again">
                  🔊
                </button>
              )}
            </p>
          </div>
        ))}
        {recording && (
          <div className="bubble-row me">
            <p className="bubble me live-bubble">
              {hasLiveTranscription && rec.liveText ? rec.liveText : rec.level > 0.06 ? '👂 Granny can hear you…' : 'Listening… start speaking'}
            </p>
          </div>
        )}
        {busy && (
          <div className={`bubble-row ${hearing ? 'me' : 'granny'}`}>
            <p className={`bubble ${hearing ? 'me' : 'granny'} typing`}>
              <span className="dots" aria-label={hearing ? 'Listening' : 'Granny is typing'}>
                <i />
                <i />
                <i />
              </span>
            </p>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {error && <p className="error banner">{error}</p>}
      {rec.error && <p className="error banner">{rec.error}</p>}

      {done ? (
        <section className="card talk-done">
          <p>Well done, beta! That was a lovely conversation.</p>
          <button className="btn primary big" onClick={() => onFinish(turns)}>
            See Granny's notes ✎
          </button>
        </section>
      ) : (
        <div className="talk-controls card">
          <button
            className={`mic small-mic${recording ? ' on' : ''}`}
            style={{ ['--p' as string]: Math.min(1, rec.elapsed / 60), ['--lvl' as string]: rec.level }}
            onClick={recording ? rec.stop : startRec}
            disabled={busy}
            aria-label={recording ? 'Stop and send' : 'Tap to speak'}
          >
            <span className="mic-inner">
              {recording ? (
                <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden>
                  <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden>
                  <path fill="currentColor" d="M12 14a3 3 0 0 0 3-3V5a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2Z" />
                </svg>
              )}
            </span>
          </button>
          <form
            className="type-row"
            onSubmit={(e) => {
              e.preventDefault();
              if (busy || recording || !typed.trim()) return;
              send(typed);
              setTyped('');
            }}
          >
            <input value={typed} onChange={(e) => setTyped(e.target.value)} placeholder={recording ? 'Listening… tap the mic to send' : 'Tap the mic, or type here'} disabled={busy || recording} />
            <button className="btn primary small" disabled={busy || recording || !typed.trim()}>
              Send
            </button>
          </form>
          {myTurns >= 2 && (
            <button className="btn link end-early" onClick={() => onFinish(turns)} disabled={busy || recording}>
              Finish now and see notes
            </button>
          )}
        </div>
      )}
    </div>
  );
}
