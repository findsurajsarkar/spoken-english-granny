import { TESTIMONIALS } from '../config';

/** Shows only genuine tester feedback from config.ts; hidden until there is some. */
export default function Testimonials() {
  if (!TESTIMONIALS.length) return null;
  return (
    <section className="lp-section">
      <div className="lp-wrap">
        <p className="lp-kicker">Learners</p>
        <h2 className="lp-h2">What learners say</h2>
        <div className="lp-grid3">
          {TESTIMONIALS.map((t) => (
            <figure key={t.name + t.quote} className="lp-card lp-quote">
              <blockquote>“{t.quote}”</blockquote>
              <figcaption>
                <strong>{t.name}</strong>
                <span>{t.detail}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
