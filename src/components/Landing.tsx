import { useState } from 'react';
import { go } from '../lib/router';
import type { Mistake } from '../lib/types';
import { canSellHere } from '../lib/platform';
import { shareText } from '../lib/share';
import Devices from './Devices';
import Notebook from './Notebook';
import Pricing from './Pricing';
import Showcase from './Showcase';
import Testimonials from './Testimonials';

const SAMPLE_TEXT = 'Yesterday I go to the market with my mother. We buyed many vegetables and I am liking the fresh mangoes.';
const SAMPLE_MISTAKES: Mistake[] = [
  { wrong: 'I go', right: 'I went', why: "It happened yesterday, so 'go' becomes 'went'.", kind: 'tense' },
  { wrong: 'buyed', right: 'bought', why: "'Buy' becomes 'bought' for yesterday, never 'buyed'.", kind: 'word' },
  { wrong: 'I am liking', right: 'I like', why: "For things you always enjoy, just say 'I like'.", kind: 'natural' },
];

const FEATURES = [
  { emoji: '🎤', title: 'A new topic every time', text: 'Fresh topics for beginners, intermediate and advanced speakers, with a timer that fits the topic.' },
  { emoji: '✍️', title: 'Red-pen notebook', text: 'Mistakes are circled and corrected like a real teacher checked your notebook.' },
  { emoji: '🗣️', title: 'Explained in your language', text: 'Simple words, no grammar jargon, in English, Hinglish or Hindi.' },
  { emoji: '💬', title: 'Real conversations', text: 'Practise a job interview, office small talk, the doctor, the airport, shopping and more.' },
  { emoji: '💯', title: 'Marks and kind remarks', text: 'Marks out of 10 that consider how difficult your sentences were, not only the mistakes.' },
  { emoji: '🔥', title: 'Streaks and badges', text: 'A daily attendance grid and badges that make coming back every day a happy habit.' },
];

const FAQ = [
  {
    q: 'Is it really free?',
    a: 'Yes. You get 3 practices every day for free, forever. Granny Plus (₹99 a month, or ₹2,999 once for life) gives you 6 practices a day and unlocks all the conversations.',
  },
  {
    q: 'Do I need an account?',
    a: 'Yes, a free one. Sign in once with Google (through Puter, which runs Granny\'s AI) and your progress is saved to your account.',
  },
  {
    q: 'Are my recordings saved?',
    a: 'Granny does not keep your recordings. Your voice is only sent to a speech service to turn it into text. Your practice history is saved to your own account, so it follows you to any device where you sign in.',
  },
  {
    q: 'My English is very weak. Can I still use it?',
    a: 'That is exactly who Granny is for. Choose Beginner, speak a few simple sentences, and read the explanations in Hindi or Hinglish.',
  },
  {
    q: 'Can I use it on my phone?',
    a: 'Yes. Open it in your phone browser and choose "Add to Home Screen" to use it like an app.',
  },
];

export default function Landing() {
  const [faq, setFaq] = useState<number | null>(0);

  return (
    <div className="landing">
      <header className="l-nav">
        <a className="brand" href="#/">
          <img src="icon.svg" alt="" width={32} height={32} />
          <span>Spoken English Granny</span>
        </a>
        <nav>
          <a href="#features" onClick={(e) => (e.preventDefault(), document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }))}>
            Features
          </a>
          <a href="#devices" onClick={(e) => (e.preventDefault(), document.getElementById('devices')?.scrollIntoView({ behavior: 'smooth' }))}>
            Download
          </a>
          <a href="#pricing" onClick={(e) => (e.preventDefault(), document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' }))}>
            Pricing
          </a>
          <button className="btn primary small" onClick={() => go('/practice')}>
            Open app
          </button>
        </nav>
      </header>

      <section className="l-hero">
        <div className="l-hero-text">
          <p className="eyebrow">Spoken English practice, the kind way</p>
          <h1>
            Speak English <span className="scribble">without fear.</span>
          </h1>
          <p className="lead">
            Granny never laughs at your mistakes. Talk about anything, and she corrects you gently with a red pen, in simple words, in English, Hinglish or
            Hindi.
          </p>
          <div className="l-cta">
            <button className="btn primary big-inline" onClick={() => go('/practice')}>
              Start practising free
            </button>
            <button className="btn ghost big-inline" onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}>
              See pricing
            </button>
          </div>
          <p className="muted small">3 free practices every day · No credit card needed</p>
        </div>
        <div className="l-hero-visual" aria-label="Example of a checked notebook page">
          <div className="l-mark">
            7<span>/10</span>
          </div>
          <Notebook title="A trip to the market" date="Today" transcript={SAMPLE_TEXT} mistakes={SAMPLE_MISTAKES} active={null} onSelect={() => {}} />
        </div>
      </section>

      <section className="l-problem card">
        <h2>Feeling shy to speak English?</h2>
        <div className="problem-grid">
          <div>
            <span aria-hidden>😟</span>
            <p>Scared that people will laugh at your mistakes</p>
          </div>
          <div>
            <span aria-hidden>🙊</span>
            <p>Nobody around to practise speaking with</p>
          </div>
          <div>
            <span aria-hidden>📖</span>
            <p>Grammar books full of words you don't understand</p>
          </div>
        </div>
        <p className="promise">
          Remember how our grandparents never made fun of us? <strong>Granny is that safe place.</strong> No audience, no bullying, no judging. Just you,
          Granny, and a little practice every day.
        </p>
      </section>

      <section className="l-steps">
        <h2 className="l-h2">How it works</h2>
        <ol className="steps">
          <li>
            <span className="step-n">1</span>
            <strong>Get a topic</strong>
            <p>Pick your level and Granny gives you something fun to talk about.</p>
          </li>
          <li>
            <span className="step-n">2</span>
            <strong>Speak freely</strong>
            <p>Tap the mic and talk. Take your time, nobody is listening but Granny.</p>
          </li>
          <li>
            <span className="step-n">3</span>
            <strong>See the red pen</strong>
            <p>Your mistakes are circled and explained simply, with marks out of 10.</p>
          </li>
        </ol>
      </section>

      <Showcase />

      <section id="features" className="l-features">
        <h2 className="l-h2">Everything you need to speak with confidence</h2>
        <div className="feature-grid">
          {FEATURES.map((f) => (
            <div key={f.title} className="feature card">
              <span className="f-emoji" aria-hidden>
                {f.emoji}
              </span>
              <strong>{f.title}</strong>
              <p>{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="l-who card">
        <h2>Made for everyone learning English</h2>
        <div className="who-tags">
          {['Students', 'Job seekers', 'Working professionals', 'Homemakers', 'Shopkeepers & business owners', 'Anyone who feels shy'].map((w) => (
            <span key={w}>{w}</span>
          ))}
        </div>
      </section>

      <Testimonials />

      <Devices />

      <section id="pricing" className="l-pricing">
        <h2 className="l-h2">Simple pricing</h2>
        <p className="center muted">Start free. Upgrade when you want to practise more.</p>
        <Pricing onFree={() => go('/practice')} onPlus={() => go('/plus')} hidePlusButtons={!canSellHere} />
      </section>

      <section className="l-faq">
        <h2 className="l-h2">Questions</h2>
        <div className="faq card">
          {FAQ.map((f, i) => (
            <div key={f.q} className={`faq-item${faq === i ? ' open' : ''}`}>
              <button onClick={() => setFaq(faq === i ? null : i)} aria-expanded={faq === i}>
                {f.q}
                <span aria-hidden>{faq === i ? '−' : '+'}</span>
              </button>
              {faq === i && <p>{f.a}</p>}
            </div>
          ))}
        </div>
      </section>

      <section className="l-final">
        <h2>Granny is waiting for you, beta.</h2>
        <div className="l-cta center-cta">
          <button className="btn primary big-inline" onClick={() => go('/practice')}>
            Start practising free
          </button>
          <button
            className="btn ghost big-inline on-red"
            onClick={() => shareText('Practise spoken English with a kind granny who never laughs at your mistakes. Free to try:')}
          >
            Share with a friend
          </button>
        </div>
      </section>

      <footer className="foot">
        © {new Date().getFullYear()} Spoken English Granny · <a href="#/privacy">Privacy</a> · <a href="#/terms">Terms</a> · <a href="#/refund">Refunds</a> ·{' '}
        <a href="#/contact">Contact</a>
      </footer>
    </div>
  );
}
