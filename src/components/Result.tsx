import { useState } from 'react';
import { gradeFor } from '../lib/grading';
import type { Attempt } from '../lib/types';
import Notebook, { splitTranscript } from './Notebook';

function speak(text: string) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  const voices = window.speechSynthesis.getVoices();
  u.voice = voices.find((v) => v.lang === 'en-IN') ?? voices.find((v) => v.lang.startsWith('en')) ?? null;
  u.rate = 0.92;
  window.speechSynthesis.speak(u);
}

interface Props {
  attempt: Attempt;
  onAgain: () => void;
  onNew: () => void;
  readOnly?: boolean;
}

export default function Result({ attempt, onAgain, onNew, readOnly }: Props) {
  const { analysis, topic, transcript } = attempt;
  const [active, setActive] = useState<number | null>(null);
  const grade = gradeFor(analysis.score);
  const date = new Date(attempt.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  const { unplaced } = splitTranscript(transcript, analysis.mistakes);

  const select = (n: number) => {
    setActive(n);
    document.getElementById(`note-${n}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <div className="result">
      <section className={`card report tone-${grade.tone}`}>
        <div className="marks" aria-label={`Marks: ${analysis.score} out of 10`}>
          <span className="marks-num">{analysis.score}</span>
          <span className="marks-den">/10</span>
        </div>
        <div className="report-body">
          <div className="stamp">{grade.label}</div>
          <p className="remark">{analysis.remark}</p>
          <p className="signed">— Granny</p>
          <p className="meta">
            {analysis.mistakes.length} {analysis.mistakes.length === 1 ? 'mistake' : 'mistakes'} · {analysis.sentenceLevel} sentences · {topic.level}
          </p>
        </div>
      </section>

      <Notebook title={topic.title} date={date} transcript={transcript} mistakes={analysis.mistakes} active={active} onSelect={select} />

      {analysis.mistakes.length > 0 && (
        <section className="card notes">
          <h2>Granny's notes</h2>
          <p className="muted small">Tap a red circle on the page to jump to its note.</p>
          <ol>
            {analysis.mistakes.map((m, i) => {
              const n = i + 1;
              return (
                <li key={n} id={`note-${n}`} className={active === n ? 'active' : ''} onClick={() => setActive(n)}>
                  <span className="note-n">{n}</span>
                  <div>
                    <p className="note-fix">
                      <s>{m.wrong}</s> <span aria-hidden>→</span> <strong>{m.right || '(remove it)'}</strong>
                      {unplaced.some((u) => u.n === n) && <span className="muted small"> (not marked on page)</span>}
                    </p>
                    <p className="note-why">{m.why}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      )}

      <section className="card">
        <div className="row-between">
          <h2>The right way to say it</h2>
          {'speechSynthesis' in window && (
            <button className="btn ghost small" onClick={() => speak(analysis.correctedText)}>
              🔊 Listen
            </button>
          )}
        </div>
        <p className="corrected">{analysis.correctedText}</p>
      </section>

      {(analysis.strengths.length > 0 || analysis.tip) && (
        <section className="card praise">
          {analysis.strengths.length > 0 && (
            <>
              <h2>What you did well</h2>
              <ul>
                {analysis.strengths.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </>
          )}
          {analysis.tip && (
            <p className="tip">
              <strong>Tip for next time:</strong> {analysis.tip}
            </p>
          )}
        </section>
      )}

      <div className="actions">
        {!readOnly && (
          <button className="btn ghost" onClick={onAgain}>
            Try this topic again
          </button>
        )}
        <button className="btn primary" onClick={onNew}>
          {readOnly ? 'Back' : 'New topic'}
        </button>
      </div>
    </div>
  );
}
