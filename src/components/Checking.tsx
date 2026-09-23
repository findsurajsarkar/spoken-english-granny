import { useEffect, useState } from 'react';

const LINES = ['Granny is putting on her glasses…', 'Reading your page carefully…', 'Taking out the red pen…', 'Writing little notes for you…'];

export default function Checking() {
  const [line, setLine] = useState(0);
  useEffect(() => {
    const t = window.setInterval(() => setLine((l) => (l + 1) % LINES.length), 2200);
    return () => window.clearInterval(t);
  }, []);
  return (
    <section className="card checking">
      <div className="pen" aria-hidden>
        ✎
      </div>
      <p>{LINES[line]}</p>
    </section>
  );
}
