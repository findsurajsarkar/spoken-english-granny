import { useEffect, useRef } from 'react';
import { APK_URL, BUSINESS } from '../config';
import { track } from '../lib/analytics';
import { useInstall } from '../lib/install';
import { go } from '../lib/router';
import Testimonials from './Testimonials';
import './landing.css';

/** The same red Granny logo as the app, so the website and the app are clearly one product. */
function Logo() {
  return (
    <span className="lp-logo">
      <img src="icon.svg" width={32} height={32} alt="" />
      Spoken English Granny
    </span>
  );
}

const WHY = [
  { icon: '🙂', title: 'No fear, no judging', text: 'Nobody is watching. Granny never laughs, so you can speak freely and make mistakes.' },
  { icon: '✍️', title: 'Red-pen corrections', text: 'Every mistake circled and corrected, like a teacher checking your notebook.' },
  { icon: 'अ', title: 'Explained in your language', text: 'Simple explanations in English, Hinglish or Hindi. No grammar jargon.' },
  { icon: '💯', title: 'Marks out of 10', text: 'See how you did and watch yourself improve, day after day.' },
];

const FLOW = [
  { img: 'images/app-home.jpg', title: 'Choose your level', text: 'Beginner, intermediate or advanced, and the language for explanations.' },
  { img: 'images/app-topic.jpg', title: 'Speak on a topic', text: 'Get a fresh topic with hints. Tap the mic and speak, or type.' },
  { img: 'images/app-result.jpg', title: 'Get your marks', text: 'Granny checks your English and gives marks out of 10 with a kind remark.' },
  { img: 'images/app-notebook.jpg', title: 'Learn from the red pen', text: 'Mistakes circled, the right words written above, and why, in simple words.' },
];

const ANDROID_ICON =
  'M17.6 9.48l1.84-3.18a.38.38 0 0 0-.66-.38l-1.87 3.23a11.4 11.4 0 0 0-9.82 0L5.22 5.92a.38.38 0 0 0-.66.38l1.84 3.18A10.8 10.8 0 0 0 1 18h22a10.8 10.8 0 0 0-5.4-8.52ZM7 15.25a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5Zm10 0a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5Z';
const WINDOWS_ICON = 'M2 4.6 10 3.5v7.7H2V4.6Zm9-1.2L22 2v9.2H11V3.4ZM2 12.2h8v7.7l-8-1.1v-6.6Zm9 0h11V22l-11-1.5v-8.3Z';

function DownloadButtons({ where }: { where: string }) {
  const { canPrompt, install } = useInstall();
  return (
    <div className="lp-dl-buttons">
      <a className="lp-store" href={APK_URL} download="spoken-english-granny.apk" onClick={() => track('download_apk', { where })}>
        <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden>
          <path fill="currentColor" d={ANDROID_ICON} />
        </svg>
        <span>
          <small>Download for</small>Android
        </span>
      </a>
      <a
        className="lp-store"
        href="#download"
        onClick={(e) => {
          e.preventDefault();
          track('download_windows', { where });
          if (canPrompt) install();
          else document.getElementById('download')?.scrollIntoView({ behavior: 'smooth' });
        }}
      >
        <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden>
          <path fill="currentColor" d={WINDOWS_ICON} />
        </svg>
        <span>
          <small>Install for</small>Windows
        </span>
      </a>
    </div>
  );
}

/** Plays only while on screen (saves data and battery on phones); nothing downloads until then. */
function LazyVideo({ src, poster, label }: { src: string; poster: string; label: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          if (!v.src) v.src = src;
          v.play().catch(() => {});
        } else v.pause();
      },
      { threshold: 0.4 },
    );
    io.observe(v);
    return () => io.disconnect();
  }, [src]);
  return <video ref={ref} poster={poster} muted loop playsInline controls preload="none" aria-label={label} />;
}

function WindowsInstall() {
  const { canPrompt, install } = useInstall();
  return canPrompt ? (
    <button className="lp-btn lp-btn-primary" onClick={() => (track('download_windows', { where: 'download' }), install())}>
      ⬇ <span className="lp-long">Install for Windows</span>
      <span className="lp-short">Install</span>
    </button>
  ) : (
    <p className="lp-note">The install button appears here when you open this page in Chrome or Edge on Windows.</p>
  );
}

export default function Landing() {
  const start = (where: string) => {
    track('cta_start', { where });
    go('/practice');
  };
  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  return (
    <div className="lp">
      <header className="lp-nav">
        <div className="lp-wrap lp-nav-in">
          <a href="#/" className="lp-brand" aria-label="Spoken English Granny home">
            <Logo />
          </a>
          <nav>
            <a href="#why" onClick={(e) => (e.preventDefault(), scrollTo('why'))}>
              Why Granny
            </a>
            <a href="#how" onClick={(e) => (e.preventDefault(), scrollTo('how'))}>
              How it works
            </a>
            <a href="#download" onClick={(e) => (e.preventDefault(), scrollTo('download'))}>
              Download
            </a>
          </nav>
          <button className="lp-btn lp-btn-primary lp-btn-sm lp-nav-cta" onClick={() => start('nav')}>
            <span className="lp-long">Test your English</span>
            <span className="lp-short">Try free</span>
          </button>
        </div>
      </header>

      {/* 1. The product, 2. the free offer, 3. downloads: all visible straight away */}
      <section className="lp-hero">
        <div className="lp-wrap lp-hero-in">
          <div className="lp-hero-copy">
            <p className="lp-eyebrow">Spoken English practice for Hindi speakers</p>
            <h1>
              Speak English with confidence. <em>Granny never laughs at mistakes.</em>
            </h1>
            <p className="lp-lead">
              Talk about anything and get your English checked instantly: every mistake circled in red, corrected, and explained simply in English, Hinglish or
              Hindi.
            </p>
            <div className="lp-offer">
              <button className="lp-btn lp-btn-primary lp-btn-lg" onClick={() => start('hero')}>
                Test your English free →
              </button>
              <p>Takes 2 minutes · No payment · Start speaking with Granny right away</p>
            </div>
            <DownloadButtons where="hero" />
          </div>

          <div className="lp-hero-art" aria-hidden>
            <div className="lp-phone lp-phone-back">
              <img src="images/app-topic.jpg" alt="" width={480} height={1038} decoding="async" />
            </div>
            <div className="lp-phone lp-phone-front">
              <img src="images/app-notebook.jpg" alt="" width={480} height={1038} fetchPriority="high" />
            </div>
            <div className="lp-chip lp-chip-1">✍️ Mistakes circled</div>
            <div className="lp-chip lp-chip-2">💯 Marks out of 10</div>
            <div className="lp-chip lp-chip-3">अ Hindi & Hinglish help</div>
          </div>
        </div>
      </section>

      <section id="why" className="lp-section">
        <div className="lp-wrap">
          <p className="lp-kicker lp-c">Why Granny</p>
          <h2 className="lp-h2 lp-c">The safe way to practise speaking English</h2>
          <div className="lp-why">
            {WHY.map((w) => (
              <div key={w.title} className="lp-why-card">
                <span className="lp-why-icon" aria-hidden>
                  {w.icon}
                </span>
                <strong>{w.title}</strong>
                <p>{w.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how" className="lp-section lp-tint">
        <div className="lp-wrap">
          <p className="lp-kicker lp-c">How it works</p>
          <h2 className="lp-h2 lp-c">From your first word to better English in 4 steps</h2>
          <ol className="lp-flow">
            {FLOW.map((f, i) => (
              <li key={f.title}>
                <div className="lp-flow-shot">
                  <img src={f.img} alt={`${f.title}: app screen`} loading="lazy" decoding="async" width={480} height={1038} />
                </div>
                <div className="lp-flow-text">
                  <span className="lp-flow-n">{i + 1}</span>
                  <strong>{f.title}</strong>
                  <p>{f.text}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="lp-video">
            <div className="lp-video-frame">
              <LazyVideo src="videos/granny-walkthrough.mp4" poster="videos/granny-walkthrough.jpg" label="30-second walkthrough of the app" />
            </div>
            <div>
              <h3>See it in 30 seconds</h3>
              <p>Choose a level, get a topic, speak, and watch Granny's red pen check your English.</p>
              <button className="lp-btn lp-btn-primary lp-btn-lg" onClick={() => start('how')}>
                Try it now, free →
              </button>
            </div>
          </div>
        </div>
      </section>

      <Testimonials />

      <section id="download" className="lp-section">
        <div className="lp-wrap">
          <p className="lp-kicker lp-c">Download</p>
          <h2 className="lp-h2 lp-c">Get Granny on your phone or computer</h2>
          <div className="lp-downloads">
            <div className="lp-dl-card">
              <div className="lp-dl-head">
                <span className="lp-dl-icon" aria-hidden>
                  <svg viewBox="0 0 24 24" width="30" height="30">
                    <path fill="currentColor" d={ANDROID_ICON} />
                  </svg>
                </span>
                <div>
                  <strong>Android app</strong>
                  <span>Free · 1.1 MB</span>
                </div>
              </div>
              <ol>
                <li>Tap the button below to download the app.</li>
                <li>Open the downloaded file and tap Install. Allow installs from your browser if asked.</li>
                <li>Open Granny and start speaking.</li>
              </ol>
              <a className="lp-btn lp-btn-primary" href={APK_URL} download="spoken-english-granny.apk" onClick={() => track('download_apk', { where: 'download' })}>
                ⬇ <span className="lp-long">Download for Android</span>
                <span className="lp-short">Download</span>
              </a>
            </div>
            <div className="lp-dl-card">
              <div className="lp-dl-head">
                <span className="lp-dl-icon" aria-hidden>
                  <svg viewBox="0 0 24 24" width="28" height="28">
                    <path fill="currentColor" d={WINDOWS_ICON} />
                  </svg>
                </span>
                <div>
                  <strong>Windows app</strong>
                  <span>Free · installs from Chrome or Edge</span>
                </div>
              </div>
              <ol>
                <li>Open this page in Chrome or Edge on your computer.</li>
                <li>Click the button below, or the install icon (⊕) in the address bar.</li>
                <li>Granny opens in its own window, with a Start-menu icon.</li>
              </ol>
              <WindowsInstall />
            </div>
          </div>
          <p className="lp-fine">iPhone or Mac? Just open Granny in your browser: it works there too.</p>
        </div>
      </section>

      <section className="lp-final">
        <div className="lp-wrap">
          <h2>How good is your spoken English?</h2>
          <p>Find out in 2 minutes. Granny is waiting, beta.</p>
          <button className="lp-btn lp-btn-white lp-btn-lg" onClick={() => start('final')}>
            Test your English free →
          </button>
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
          Test your English free
        </button>
      </div>
    </div>
  );
}
