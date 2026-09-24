import { useState } from 'react';
import { hasLiveTranscription, useRecorder, type Recording } from '../hooks/useRecorder';
import { transcribe } from '../lib/puter';
import type { ExplainLang, Topic } from '../lib/types';

interface Props {
  topic: Topic;
  lang: ExplainLang;
  loadingTopic: boolean;
  onNewTopic: () => void;
  onCheck: (transcript: string) => void;
}

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

export default function Practice({ topic, lang, loadingTopic, onNewTopic, onCheck }: Props) {
  const [transcript, setTranscript] = useState('');
  const [audio, setAudio] = useState<Blob | null>(null);
  const [transcribing, setTranscribing] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [typing, setTyping] = useState(false);
  const [detail, setDetail] = useState<string | null>(null);

  const runPuterTranscription = async (blob: Blob, fallback = '', silent = false) => {
    setTranscribing(true);
    setErr(null);
    setDetail(null);
    try {
      const text = await transcribe(blob);
      setTranscript(text || fallback);
      if (!text && !fallback)
        setErr(
          silent
            ? "Granny couldn't hear any sound. Check that the microphone isn't muted or blocked, and speak close to the phone."
            : "Granny couldn't make out any words. Try again, speaking a little louder and closer to the phone.",
        );
    } catch (e) {
      console.error(e);
      setDetail(e instanceof Error ? e.message : String((e as any)?.error?.message ?? (e as any)?.message ?? e));
      setTranscript(fallback);
      if (!fallback) setErr("Granny couldn't write down your words this time. Try recording again, or type your answer.");
    } finally {
      setTranscribing(false);
    }
  };

  const onFinish = ({ audio, liveText, silent, seconds }: Recording) => {
    setAudio(audio);
    if (seconds < 1.5) {
      setErr('That was very short. Tap the mic, speak for a few sentences, then tap again to finish.');
      return;
    }
    // Even if the meter heard nothing, still try: some phones report very low levels.
    if (audio) runPuterTranscription(audio, liveText, silent);
    else setTranscript(liveText);
  };

  const rec = useRecorder(topic.seconds, onFinish);
  const recording = rec.status === 'recording';
  const progress = Math.min(1, rec.elapsed / topic.seconds);
  const hasAnswer = transcript.trim().length > 0;
  const showReview = (rec.status === 'stopped' || typing) && !transcribing;

  const restart = () => {
    setTranscript('');
    setAudio(null);
    setErr(null);
    setTyping(false);
    rec.reset();
  };

  return (
    <div className="practice">
      <section className="card topic">
        <div className="row-between">
          <span className="pill">{topic.level}</span>
          <span className="pill soft">⏱ {fmt(topic.seconds)}</span>
        </div>
        <h2 className="topic-title">{topic.title}</h2>
        <p className="topic-prompt">{topic.prompt}</p>
        {lang !== 'english' && topic.promptHindi && <p className="topic-hindi">{topic.promptHindi}</p>}
        {topic.hints.length > 0 && (
          <ul className="hints">
            {topic.hints.map((h, i) => (
              <li key={i}>{h}</li>
            ))}
          </ul>
        )}
        {rec.status === 'idle' && !typing && (
          <button className="btn link" onClick={onNewTopic} disabled={loadingTopic}>
            {loadingTopic ? 'Finding another topic…' : '↻ Give me a different topic'}
          </button>
        )}
      </section>

      <section className="card mic-card">
        {!showReview && !transcribing && (
          <>
            <button
              className={`mic${recording ? ' on' : ''}`}
              style={{ ['--p' as string]: progress, ['--lvl' as string]: rec.level }}
              onClick={recording ? rec.stop : rec.start}
              aria-label={recording ? 'Stop recording' : 'Start speaking'}
            >
              <span className="mic-inner">
                {recording ? (
                  <svg viewBox="0 0 24 24" width="34" height="34" aria-hidden>
                    <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" width="38" height="38" aria-hidden>
                    <path fill="currentColor" d="M12 14a3 3 0 0 0 3-3V5a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2Z" />
                  </svg>
                )}
              </span>
            </button>
            <p className="mic-label">
              {recording ? (
                <>
                  <strong>{fmt(rec.elapsed)}</strong> / {fmt(topic.seconds)} · tap to finish
                </>
              ) : (
                'Tap the mic and start speaking. Take your time, beta.'
              )}
            </p>
            {recording && (
              <p className="live">
                {hasLiveTranscription && rec.liveText ? (
                  rec.liveText
                ) : (
                  <span className={`hearing${rec.level > 0.06 ? ' on' : ''}`}>{rec.level > 0.06 ? '👂 Granny can hear you…' : 'Listening… start speaking'}</span>
                )}
              </p>
            )}
            {rec.error && <p className="error">{rec.error}</p>}
            {err && !transcribing && rec.status !== 'stopped' && <p className="error">{err}</p>}
            {!recording && (
              <button className="btn link" onClick={() => setTyping(true)}>
                No microphone? Type your answer instead
              </button>
            )}
          </>
        )}

        {transcribing && (
          <div className="thinking">
            <span className="dots" aria-hidden>
              <i />
              <i />
              <i />
            </span>
            <p>Granny is writing down your words…</p>
          </div>
        )}

        {showReview && (
          <div className="review">
            <h3>{typing && !audio ? 'Type what you would say' : 'This is what Granny heard'}</h3>
            <p className="muted small">
              {typing && !audio
                ? 'Write it the way you would speak it.'
                : "If Granny misheard a word, fix it — but please don't correct your own mistakes, she wants to help with those!"}
            </p>
            <textarea value={transcript} onChange={(e) => setTranscript(e.target.value)} rows={6} placeholder="Your words…" />
            {err && <p className="error">{err}</p>}
            {err && detail && <p className="muted small">Details: {detail}</p>}
            <div className="actions">
              <button className="btn ghost" onClick={restart}>
                Record again
              </button>
              <button className="btn primary" disabled={!hasAnswer} onClick={() => onCheck(transcript.trim())}>
                Check my English ✎
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
