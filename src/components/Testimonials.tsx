import { TESTIMONIALS } from '../config';

/** Shows only genuine tester feedback from config.ts; hidden until there is some. */
export default function Testimonials() {
  if (!TESTIMONIALS.length) return null;
  return (
    <section className="l-testimonials">
      <h2 className="l-h2">What learners say</h2>
      <div className="quote-grid">
        {TESTIMONIALS.map((t) => (
          <figure key={t.name + t.quote} className="quote card">
            <blockquote>“{t.quote}”</blockquote>
            <figcaption>
              <strong>{t.name}</strong>
              <span className="muted small">{t.detail}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
