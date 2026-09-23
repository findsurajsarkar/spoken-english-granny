import type { Mistake } from '../lib/types';

type Piece = { text: string } | { mistake: Mistake; n: number; text: string };

/** Split the transcript into plain text and marked mistakes, matching each `wrong` in order. */
export function splitTranscript(transcript: string, mistakes: Mistake[]): { pieces: Piece[]; unplaced: Array<{ mistake: Mistake; n: number }> } {
  const lower = transcript.toLowerCase();
  const found: Array<{ start: number; end: number; mistake: Mistake; n: number }> = [];
  const unplaced: Array<{ mistake: Mistake; n: number }> = [];
  let cursor = 0;

  mistakes.forEach((m, i) => {
    const needle = m.wrong.toLowerCase();
    const overlaps = (s: number) => found.some((f) => s < f.end && s + needle.length > f.start);
    let at = lower.indexOf(needle, cursor);
    if (at === -1) {
      // The AI listed it out of order — look from the start for a free spot.
      at = lower.indexOf(needle);
      while (at !== -1 && overlaps(at)) at = lower.indexOf(needle, at + 1);
    }
    if (at === -1 || overlaps(at)) {
      unplaced.push({ mistake: m, n: i + 1 });
      return;
    }
    found.push({ start: at, end: at + needle.length, mistake: m, n: i + 1 });
    cursor = at + needle.length;
  });

  found.sort((a, b) => a.start - b.start);
  const pieces: Piece[] = [];
  let pos = 0;
  for (const f of found) {
    if (f.start > pos) pieces.push({ text: transcript.slice(pos, f.start) });
    pieces.push({ mistake: f.mistake, n: f.n, text: transcript.slice(f.start, f.end) });
    pos = f.end;
  }
  if (pos < transcript.length) pieces.push({ text: transcript.slice(pos) });
  return { pieces, unplaced };
}

// A slightly wobbly hand-drawn loop, like a real red pen.
const CIRCLE = 'M10,22 C6,9 38,2 62,4 C86,6 98,15 95,25 C91,36 58,40 36,37 C15,35 3,28 8,17 C11,10 20,6 32,5';

interface Props {
  title: string;
  date: string;
  transcript: string;
  mistakes: Mistake[];
  active: number | null;
  onSelect: (n: number) => void;
}

export default function Notebook({ title, date, transcript, mistakes, active, onSelect }: Props) {
  const { pieces } = splitTranscript(transcript, mistakes);

  return (
    <article className="notebook" aria-label="Your answer, checked by Granny">
      <header className="nb-head">
        <span className="nb-date">{date}</span>
        <h3 className="nb-title">{title}</h3>
      </header>
      <p className="nb-text">
        {pieces.map((p, i) =>
          'mistake' in p ? (
            <button
              key={i}
              type="button"
              className={`mk${p.mistake.right ? '' : ' mk-cut'}${active === p.n ? ' active' : ''}`}
              style={{ ['--d' as string]: `${0.2 + p.n * 0.25}s` }}
              onClick={() => onSelect(p.n)}
              aria-label={`Mistake ${p.n}: "${p.text}" should be ${p.mistake.right ? `"${p.mistake.right}"` : 'removed'}`}
            >
              <span className="mk-wrong">
                {p.mistake.right && <span className="mk-fix">{p.mistake.right}</span>}
                {p.text}
                {p.mistake.right && (
                  <svg className="mk-circle" viewBox="0 0 100 42" preserveAspectRatio="none" aria-hidden>
                    <path d={CIRCLE} pathLength={1} />
                  </svg>
                )}
              </span>
              <sup className="mk-n">{p.n}</sup>
            </button>
          ) : (
            <span key={i}>{p.text}</span>
          ),
        )}
      </p>
      {mistakes.length === 0 && <p className="nb-perfect">No mistakes! ✓</p>}
    </article>
  );
}
