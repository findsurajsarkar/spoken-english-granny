import type { Mistake } from '../lib/types';
import Notebook from './Notebook';

/* Real app screens (live components, not stock photos) inside phone frames. */

const MISTAKES: Mistake[] = [
  { wrong: 'I go', right: 'I went', why: '', kind: 'tense' },
  { wrong: 'buyed', right: 'bought', why: '', kind: 'word' },
];

export default function Showcase() {
  return (
    <section className="l-showcase">
      <h2 className="l-h2">See Granny in action</h2>
      <div className="phones">
        <figure className="phone">
          <div className="phone-screen">
            <div className="ps-topic">
              <span className="pill">beginner</span>
              <h3>My favourite festival</h3>
              <p>Tell Granny about a festival you love and how your family celebrates it.</p>
              <ul>
                <li>Which festival?</li>
                <li>What do you eat?</li>
              </ul>
            </div>
            <div className="ps-mic" aria-hidden>
              <span />
            </div>
            <p className="ps-caption">0:42 / 1:30</p>
          </div>
          <figcaption>1. Speak about a fresh topic</figcaption>
        </figure>

        <figure className="phone featured-phone">
          <div className="phone-screen">
            <div className="ps-marks">
              6<span>/10</span>
            </div>
            <p className="ps-grade">Good</p>
            <div className="ps-notebook">
              <Notebook
                title="My weekend"
                date="Today"
                transcript="Yesterday I go to the market and I buyed sweets for my family."
                mistakes={MISTAKES}
                active={null}
                onSelect={() => {}}
              />
            </div>
          </div>
          <figcaption>2. Get red-pen corrections and marks</figcaption>
        </figure>

        <figure className="phone">
          <div className="phone-screen chat-screen">
            <p className="ps-chat-title">💼 Job interview</p>
            <p className="bubble granny">Good morning! Please tell me a little about yourself.</p>
            <p className="bubble me">I am having 2 years experience in sales and I like to talk with customers.</p>
            <p className="bubble granny">Lovely! What is one thing you achieved in your last job?</p>
            <p className="bubble me">I have increased sales in my area by 20 percent.</p>
          </div>
          <figcaption>3. Practise real conversations</figcaption>
        </figure>
      </div>
    </section>
  );
}
