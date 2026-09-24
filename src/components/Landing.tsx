import { useState } from 'react';
import { APK_URL, BUSINESS } from '../config';
import { track } from '../lib/analytics';
import { useInstall } from '../lib/install';
import { FREE_DAILY_SESSIONS, PLANS, PLUS_DAILY_SESSIONS } from '../lib/plan';
import { canSellHere } from '../lib/platform';
import { go } from '../lib/router';
import { shareText } from '../lib/share';
import Testimonials from './Testimonials';
import './landing.css';

const VIDEOS = [
  {
    id: 'correct',
    src: 'videos/granny-speak-and-correct.mp4',
    poster: 'videos/granny-speak-and-correct.jpg',
    title: 'Speak, and see every mistake corrected',
    text: 'Pick a level, get a fresh topic and talk. Granny checks your answer like a teacher with a red pen, and explains each mistake in simple words.',
    points: ['New topic every time', 'Corrections written above your words', 'Marks out of 10 with a kind remark'],
  },
  {
    id: 'talk',
    src: 'videos/granny-real-conversations.mp4',
    poster: 'videos/granny-real-conversations.jpg',
    title: 'Practise real conversations',
    text: 'Job interview, office small talk, ordering food, the doctor, the airport. Granny plays the other person and never stops you mid-sentence.',
    points: ['8 everyday situations', 'Replies read aloud', 'Full feedback when you finish'],
  },
  {
    id: 'progress',
    src: 'videos/granny-track-progress.mp4',
    poster: 'videos/granny-track-progress.jpg',
    title: 'Build a daily habit',
    text: 'An attendance calendar, streaks and badges keep you coming back. Every notebook page is saved, so you can see how far you have come.',
    points: ['Streak calendar', '17 badges to earn', 'History on every device'],
  },
];

const FEATURES = [
  { icon: '✎', title: 'Red-pen corrections', text: 'Mistakes are circled and corrected right on your words, just like a teacher checking your copy.' },
  { icon: 'अ', title: 'Hindi & Hinglish explanations', text: 'Every correction explained in simple English, Hinglish or Hindi. No grammar jargon, ever.' },
  { icon: '◎', title: 'Topics for your level', text: 'Beginner, intermediate or advanced. A new topic every time, with a timer that fits it.' },
  { icon: '💬', title: 'Real-life conversations', text: 'Rehearse the job interview, the office chat or the doctor visit before it happens.' },
  { icon: '10', title: 'Fair marks', text: 'Marks out of 10 that reward harder sentences, not just fewer mistakes.' },
  { icon: '↻', title: 'Streaks & history', text: 'Your progress is saved to your account and follows you to every device.' },
];

const FAQ = [
  {
    q: 'Is it really free?',
    a: `Yes. The free plan gives you ${FREE_DAILY_SESSIONS} practices every day, forever, with no card needed. Granny Plus gives you ${PLUS_DAILY_SESSIONS} practices a day and every conversation.`,
  },
  { q: 'Do I need an account?', a: "Yes, a free one. Sign in once with Google (through Puter, which runs Granny's AI). Your progress is saved to your account." },
  { q: 'My English is very weak. Can I still use it?', a: 'Yes. Granny is made for exactly that. Choose Beginner, speak a few simple sentences, and read the explanations in Hindi or Hinglish.' },
  { q: 'Is anyone listening to me?', a: 'No. There is no audience and no human judging you. Granny does not keep your recordings; your voice is only turned into text so she can check it.' },
  { q: 'Which devices does it work on?', a: 'Android phones (download the app below or use Chrome), Windows and Mac computers (Chrome or Edge), and iPhone through Safari.' },
  { q: 'How do I pay for Plus? Can I get a refund?', a: `Pay by UPI through WhatsApp and get an activation code, usually within a few hours. Not happy? Full refund within 3 days: WhatsApp ${BUSINESS.phoneDisplay}.` },
];

function Logo() {
  return (
    <span className="lp-logo">
      <svg viewBox="0 0 32 32" width="30" height="30" aria-hidden>
        <rect width="32" height="32" rx="8" fill="currentColor" />
        <circle cx="16" cy="15" r="8" fill="#fff" />
        <circle cx="13" cy="14.5" r="2.1" fill="none" stroke="currentColor" strokeWidth="1.2" />
        <circle cx="19" cy="14.5" r="2.1" fill="none" stroke="currentColor" strokeWidth="1.2" />
        <path d="M13.5 18.3q2.5 1.8 5 0" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M8 26h16" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
      Spoken English Granny
    </span>
  );
}

export default function Landing() {
  const [faq, setFaq] = useState<number | null>(0);
  const [video, setVideo] = useState(0);
  const { canPrompt, install } = useInstall();
  const start = (where: string) => {
    track('cta_start', { where });
    go('/practice');
  };
  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  const v = VIDEOS[video];

  return (
    <div className="lp">
      <header className="lp-nav">
        <div className="lp-wrap lp-nav-in">
          <a href="#/" className="lp-brand" aria-label="Spoken English Granny home">
            <Logo />
          </a>
          <nav>
            {[
              ['demo', 'Demo'],
              ['features', 'Features'],
              ['pricing', 'Pricing'],
              ['download', 'Download'],
              ['faq', 'FAQ'],
            ].map(([id, label]) => (
              <a key={id} href={`#${id}`} onClick={(e) => (e.preventDefault(), scrollTo(id))}>
                {label}
              </a>
            ))}
          </nav>
          <button className="lp-btn lp-btn-primary lp-btn-sm" onClick={() => start('nav')}>
            Start free
          </button>
        </div>
      </header>

      {/* 1. Hero: promise + primary action */}
      <section className="lp-hero">
        <div className="lp-wrap lp-hero-in">
          <div className="lp-hero-copy">
            <p className="lp-eyebrow">AI spoken-English coach for Hindi speakers</p>
            <h1>
              Speak English with confidence, <em>without the fear of mistakes.</em>
            </h1>
            <p className="lp-lead">
              Talk about anything. Granny listens, never laughs, and corrects you like a patient teacher: every mistake circled, fixed and explained in simple
              English, Hinglish or Hindi.
            </p>
            <div className="lp-ctas">
              <button className="lp-btn lp-btn-primary" onClick={() => start('hero')}>
                Start practising free
              </button>
              <button className="lp-btn lp-btn-ghost" onClick={() => scrollTo('demo')}>
                ▶ Watch the demo
              </button>
            </div>
            <ul className="lp-trust">
              <li>Free plan forever</li>
              <li>No credit card</li>
              <li>Android & Windows</li>
            </ul>
          </div>
          <div className="lp-hero-media">
            <div className="lp-device">
              <video src={VIDEOS[0].src} poster={VIDEOS[0].poster} autoPlay muted loop playsInline aria-label="Short demo of Granny correcting spoken English" />
            </div>
          </div>
        </div>
      </section>

      {/* 2. Problem */}
      <section className="lp-section">
        <div className="lp-wrap">
          <p className="lp-kicker">The real problem</p>
          <h2 className="lp-h2">Knowing English isn't the hard part. Speaking it is.</h2>
          <div className="lp-grid3">
            <div className="lp-card">
              <strong>Fear of being laughed at</strong>
              <p>So you stay quiet in class, in meetings and in interviews, even when you know the answer.</p>
            </div>
            <div className="lp-card">
              <strong>No one to practise with</strong>
              <p>Speaking needs practice, but friends and family can't correct you every day.</p>
            </div>
            <div className="lp-card">
              <strong>Explanations you can't follow</strong>
              <p>Grammar books talk about "participles" and "clauses". You just want to know what to say.</p>
            </div>
          </div>
          <p className="lp-bridge">
            Remember how our grandparents never made fun of our mistakes? <strong>Granny is that safe place</strong>: no audience, no judging, just practice.
          </p>
        </div>
      </section>

      {/* 3. Demo videos */}
      <section id="demo" className="lp-section lp-tint">
        <div className="lp-wrap">
          <p className="lp-kicker">See it in action</p>
          <h2 className="lp-h2">Three minutes a day. Real progress.</h2>
          <div className="lp-tabs" role="tablist">
            {VIDEOS.map((x, i) => (
              <button
                key={x.id}
                role="tab"
                aria-selected={video === i}
                className={video === i ? 'on' : ''}
                onClick={() => {
                  setVideo(i);
                  track('demo_video', { video: x.id });
                }}
              >
                <span>{i + 1}</span> {x.title}
              </button>
            ))}
          </div>
          <div className="lp-demo">
            <div className="lp-device lp-device-lg">
              <video key={v.src} src={v.src} poster={v.poster} controls playsInline preload="metadata" aria-label={v.title} />
            </div>
            <div className="lp-demo-copy">
              <h3>{v.title}</h3>
              <p>{v.text}</p>
              <ul className="lp-checks">
                {v.points.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
              <p className="lp-note">Tap play and turn the sound on for the voiceover.</p>
              <button className="lp-btn lp-btn-primary" onClick={() => start('demo')}>
                Try it yourself, free
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 4. How it works */}
      <section className="lp-section">
        <div className="lp-wrap">
          <p className="lp-kicker">How it works</p>
          <h2 className="lp-h2">Get a topic. Speak. See the red pen.</h2>
          <ol className="lp-steps">
            <li>
              <span>1</span>
              <strong>Get a topic</strong>
              <p>Choose Beginner, Intermediate or Advanced. Granny gives you something easy and fun to talk about.</p>
            </li>
            <li>
              <span>2</span>
              <strong>Speak freely</strong>
              <p>Tap the mic and talk at your own pace, or type if you prefer. Nobody else is listening.</p>
            </li>
            <li>
              <span>3</span>
              <strong>Learn from the corrections</strong>
              <p>See your mistakes circled and fixed, read why in simple words, and hear the right way to say it.</p>
            </li>
          </ol>
        </div>
      </section>

      {/* 5. Features */}
      <section id="features" className="lp-section lp-tint">
        <div className="lp-wrap">
          <p className="lp-kicker">Features</p>
          <h2 className="lp-h2">Everything you need to speak with confidence</h2>
          <div className="lp-grid3">
            {FEATURES.map((f) => (
              <div key={f.title} className="lp-card lp-feature">
                <span className="lp-ficon" aria-hidden>
                  {f.icon}
                </span>
                <strong>{f.title}</strong>
                <p>{f.text}</p>
              </div>
            ))}
          </div>
          <div className="lp-uses">
            {['Job interviews', 'College & viva', 'Office meetings', 'Customer calls', 'Travel', 'Everyday confidence'].map((u) => (
              <span key={u}>{u}</span>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Social proof (real testimonials only) */}
      <Testimonials />
      <section className="lp-section lp-early">
        <div className="lp-wrap lp-early-in">
          <div>
            <h2 className="lp-h2 lp-left">Be one of our first learners</h2>
            <p>
              Granny is new. Try her free for a week and tell us honestly how it went. The best stories (with your permission) will appear right here.
            </p>
          </div>
          <div className="lp-ctas">
            <button className="lp-btn lp-btn-primary" onClick={() => start('early')}>
              Start free
            </button>
            <a className="lp-btn lp-btn-ghost" href="#/feedback">
              Share feedback
            </a>
          </div>
        </div>
      </section>

      {/* 7. Pricing */}
      <section id="pricing" className="lp-section lp-tint">
        <div className="lp-wrap">
          <p className="lp-kicker">Pricing</p>
          <h2 className="lp-h2">Start free. Upgrade only if you love it.</h2>
          <div className="lp-prices">
            <div className="lp-price">
              <h3>Free</h3>
              <p className="lp-amount">
                ₹0 <span>forever</span>
              </p>
              <ul className="lp-checks">
                <li>{FREE_DAILY_SESSIONS} practices a day</li>
                <li>All levels & red-pen corrections</li>
                <li>English, Hinglish & Hindi explanations</li>
                <li>3 everyday conversations</li>
                <li>Streaks, badges & history</li>
              </ul>
              <button className="lp-btn lp-btn-ghost" onClick={() => start('pricing_free')}>
                Start free
              </button>
            </div>
            <div className="lp-price">
              <h3>Plus Monthly</h3>
              <p className="lp-amount">
                ₹{PLANS.monthly.price} <span>/ month</span>
              </p>
              <ul className="lp-checks">
                <li>{PLUS_DAILY_SESSIONS} practices a day</li>
                <li>All 8 conversations incl. job interview</li>
                <li>Everything in Free</li>
                <li>No auto-renewal</li>
              </ul>
              {canSellHere && (
                <button className="lp-btn lp-btn-primary" onClick={() => (track('pricing_plus', { plan: 'monthly' }), go('/plus'))}>
                  Get Plus Monthly
                </button>
              )}
            </div>
            <div className="lp-price lp-price-best">
              <span className="lp-badge">Best value</span>
              <h3>Plus Lifetime</h3>
              <p className="lp-amount">
                ₹{PLANS.lifetime.price.toLocaleString('en-IN')} <span>one time</span>
              </p>
              <ul className="lp-checks">
                <li>{PLUS_DAILY_SESSIONS} practices a day, for life</li>
                <li>All 8 conversations incl. job interview</li>
                <li>Everything in Free</li>
                <li>Pay once, no renewals</li>
              </ul>
              {canSellHere && (
                <button className="lp-btn lp-btn-primary" onClick={() => (track('pricing_plus', { plan: 'lifetime' }), go('/plus'))}>
                  Get Plus Lifetime
                </button>
              )}
            </div>
          </div>
          <p className="lp-fine">Pay by UPI · Full refund within 3 days · Questions: WhatsApp {BUSINESS.phoneDisplay}</p>
        </div>
      </section>

      {/* 8. Download (free options only) */}
      <section id="download" className="lp-section">
        <div className="lp-wrap">
          <p className="lp-kicker">Download</p>
          <h2 className="lp-h2">Get Granny on your phone or computer</h2>
          <div className="lp-downloads">
            <div className="lp-card lp-dl">
              <span className="lp-dl-icon" aria-hidden>
                <svg viewBox="0 0 24 24" width="30" height="30">
                  <path
                    fill="currentColor"
                    d="M17.6 9.48l1.84-3.18a.38.38 0 0 0-.66-.38l-1.87 3.23a11.4 11.4 0 0 0-9.82 0L5.22 5.92a.38.38 0 0 0-.66.38l1.84 3.18A10.8 10.8 0 0 0 1 18h22a10.8 10.8 0 0 0-5.4-8.52ZM7 15.25a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5Zm10 0a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5Z"
                  />
                </svg>
              </span>
              <strong>Android</strong>
              <p>Download the app directly (free, about 1 MB). When asked, allow your browser to install apps.</p>
              {APK_URL ? (
                <a className="lp-btn lp-btn-primary" href={APK_URL} onClick={() => track('download_apk')}>
                  Download for Android (.apk)
                </a>
              ) : (
                <p className="lp-note">APK coming very soon. Meanwhile, open this page in Chrome and tap “Install app”.</p>
              )}
            </div>
            <div className="lp-card lp-dl">
              <span className="lp-dl-icon" aria-hidden>
                <svg viewBox="0 0 24 24" width="28" height="28">
                  <path fill="currentColor" d="M2 4.6 10 3.5v7.7H2V4.6Zm9-1.2L22 2v9.2H11V3.4ZM2 12.2h8v7.7l-8-1.1v-6.6Zm9 0h11V22l-11-1.5v-8.3Z" />
                </svg>
              </span>
              <strong>Windows</strong>
              <p>Install from Chrome or Edge: it opens in its own window with a Start-menu icon. Free, no store needed.</p>
              {canPrompt ? (
                <button className="lp-btn lp-btn-primary" onClick={install}>
                  Install on this computer
                </button>
              ) : (
                <p className="lp-note">Open this page in Chrome or Edge on Windows, then click the install icon (⊕) at the right of the address bar.</p>
              )}
            </div>
          </div>
          <p className="lp-fine">Using an iPhone or Mac? Just open Granny in your browser: it works there too.</p>
        </div>
      </section>

      {/* 9. FAQ / objections */}
      <section id="faq" className="lp-section lp-tint">
        <div className="lp-wrap lp-narrow">
          <p className="lp-kicker">FAQ</p>
          <h2 className="lp-h2">Questions, answered</h2>
          <div className="lp-faq">
            {FAQ.map((f, i) => (
              <div key={f.q} className={`lp-faq-item${faq === i ? ' open' : ''}`}>
                <button onClick={() => setFaq(faq === i ? null : i)} aria-expanded={faq === i}>
                  {f.q}
                  <span aria-hidden>{faq === i ? '−' : '+'}</span>
                </button>
                {faq === i && <p>{f.a}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 10. Final call to action */}
      <section className="lp-final">
        <div className="lp-wrap">
          <h2>Your first practice takes two minutes.</h2>
          <p>Free forever plan. No credit card. Nobody watching.</p>
          <div className="lp-ctas lp-center">
            <button className="lp-btn lp-btn-white" onClick={() => start('final')}>
              Start practising free
            </button>
            <button
              className="lp-btn lp-btn-outline-white"
              onClick={() => shareText('Practise spoken English with a kind AI granny who never laughs at your mistakes. Free to try:')}
            >
              Share with a friend
            </button>
          </div>
        </div>
      </section>

      <footer className="lp-footer">
        <div className="lp-wrap lp-footer-in">
          <div>
            <Logo />
            <p>Speak English without fear.</p>
          </div>
          <div className="lp-footer-links">
            <a href={`https://wa.me/${BUSINESS.whatsapp}`} target="_blank" rel="noopener">
              WhatsApp {BUSINESS.phoneDisplay}
            </a>
            <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a>
            <span>
              <a href="#/privacy">Privacy</a> · <a href="#/terms">Terms</a> · <a href="#/refund">Refunds</a> · <a href="#/contact">Contact</a>
            </span>
          </div>
        </div>
        <p className="lp-copy">© {new Date().getFullYear()} Spoken English Granny</p>
      </footer>

      <div className="lp-sticky">
        <button className="lp-btn lp-btn-primary" onClick={() => start('sticky')}>
          Start practising free
        </button>
      </div>
    </div>
  );
}
