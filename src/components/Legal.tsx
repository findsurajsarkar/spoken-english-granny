import type { ReactNode } from 'react';
import { BUSINESS } from '../config';
import { FREE_DAILY_SESSIONS, PLANS, PLUS_DAILY_SESSIONS } from '../lib/plan';
import type { Route } from '../lib/router';

const email = BUSINESS.email;
const Mail = () => <a href={`mailto:${email}`}>{email}</a>;
const WhatsApp = () => (
  <a href={`https://wa.me/${BUSINESS.whatsapp}`} target="_blank" rel="noopener">
    {BUSINESS.phoneDisplay}
  </a>
);

const PAGES: Record<string, { title: string; body: ReactNode }> = {
  '/privacy': {
    title: 'Privacy Policy',
    body: (
      <>
        <p>
          {BUSINESS.name} ("we", "Granny") helps you practise spoken English. This page explains what we collect, why, and the choices you have. We follow
          India's Digital Personal Data Protection Act, 2023.
        </p>
        <h2>What we collect</h2>
        <ul>
          <li>
            <strong>Your account:</strong> when you sign in (with Google, through Puter), we receive your Puter username. We do not receive your Google
            password.
          </li>
          <li>
            <strong>What you say:</strong> the text of your answers and conversations, and Granny's corrections, marks and remarks.
          </li>
          <li>
            <strong>Your progress:</strong> practice history, attendance streaks, badges, settings and your Plus membership status.
          </li>
          <li>
            <strong>Payments:</strong> if you buy Granny Plus, Razorpay processes the payment. We receive only a payment reference, never your card, UPI or bank
            details.
          </li>
        </ul>
        <h2>Your voice</h2>
        <p>
          We do not store your recordings. Your voice is sent only to turn it into text: either your browser's built-in speech recognition (for example, Google's
          in Chrome) or Puter's transcription service. After that, only the text is kept.
        </p>
        <h2>How your data is used</h2>
        <ul>
          <li>To give you topics, check your English and show your progress.</li>
          <li>To save your progress in your own account so it works on all your devices.</li>
          <li>To manage your Plus membership.</li>
        </ul>
        <p>We do not sell your data and we do not show ads.</p>
        <h2>Analytics</h2>
        <p>
          We use Google Analytics to count visits and see which features are used (for example, how many practices are finished), so we can improve Granny.
          It uses cookies and does not receive what you say in your practices.
        </p>
        <h2>Who processes it</h2>
        <p>
          <strong>Puter</strong> (sign-in, AI and storage of your progress in your account), the AI model providers Puter uses to check your English,{' '}
          <strong>Google Analytics</strong> (usage statistics) and <strong>Razorpay</strong> (payments). Each follows its own privacy policy.
        </p>
        <h2>Keeping and deleting your data</h2>
        <p>
          Practice pages are kept for 60 days; streaks, stats and badges are kept while you use the app. Signing out removes your progress from that device. To
          delete everything from your account, write to <Mail /> and we will do it within 30 days.
        </p>
        <h2>Children</h2>
        <p>Children under 18 should use Granny with a parent's or guardian's permission.</p>
        <h2>Contact</h2>
        <p>
          Questions or requests about your data: <Mail /> or WhatsApp <WhatsApp />.
        </p>
      </>
    ),
  },
  '/terms': {
    title: 'Terms of Use',
    body: (
      <>
        <p>By using {BUSINESS.name} you agree to these terms. Please read them; they are short.</p>
        <h2>The service</h2>
        <p>
          Granny gives you speaking topics and conversations, and uses AI to point out mistakes and suggest corrections. AI can make mistakes, so treat
          Granny's corrections as friendly guidance, not a certified language assessment.
        </p>
        <h2>Your account</h2>
        <p>You sign in with a Puter account (for example, with Google). Keep it secure; you are responsible for what happens in your account.</p>
        <h2>Plans</h2>
        <ul>
          <li>Free: {FREE_DAILY_SESSIONS} practices a day and 3 everyday conversations.</li>
          <li>
            Plus Monthly (₹{PLANS.monthly.price}): {PLUS_DAILY_SESSIONS} practices a day and all conversations for 30 days from payment. It does not renew
            automatically; buy again to continue.
          </li>
          <li>
            Plus Lifetime (₹{PLANS.lifetime.price.toLocaleString('en-IN')}, one-time): {PLUS_DAILY_SESSIONS} practices a day and all conversations for as long
            as {BUSINESS.name} is offered.
          </li>
        </ul>
        <p>Daily limits reset at midnight on your device. Prices include applicable taxes unless stated otherwise.</p>
        <h2>Fair use</h2>
        <p>
          Please don't misuse the service: no automated use, no abusive or illegal content, and no attempts to get around limits or payments. We may suspend
          accounts that do.
        </p>
        <h2>Changes</h2>
        <p>
          We may improve or change features. If we ever stop offering {BUSINESS.name}, we will tell you in advance. We may update these terms and will change the
          date below when we do.
        </p>
        <h2>Liability</h2>
        <p>The service is provided "as is". To the extent the law allows, our total liability is limited to the amount you paid us in the last 12 months.</p>
        <h2>Law</h2>
        <p>These terms are governed by the laws of India, with courts in {BUSINESS.location} having jurisdiction.</p>
        <h2>Contact</h2>
        <p>
          <Mail /> · WhatsApp <WhatsApp />
        </p>
      </>
    ),
  },
  '/refund': {
    title: 'Refund & Cancellation Policy',
    body: (
      <>
        <h2>Asking for a refund</h2>
        <p>
          If you are not happy with Granny Plus, contact us within <strong>3 days of your payment</strong> on WhatsApp <WhatsApp /> or by email at <Mail />,
          with your payment reference (or the phone number/UPI ID you paid from) and your Puter username.
        </p>
        <ul>
          <li>
            <strong>Within 3 days of payment:</strong> full refund, no questions asked.
          </li>
          <li>
            <strong>After 3 days:</strong> payments are not refundable, except where required by law or in the cases below.
          </li>
        </ul>
        <h2>How long it takes</h2>
        <p>
          We reply and approve refunds within <strong>3 working days</strong>. The money then goes back to your original payment method (UPI, card or bank).
          Your bank usually shows it within <strong>5–7 working days</strong>.
        </p>
        <p>We refund the full amount you paid. We do not deduct any payment-processing charges.</p>
        <h2>Always refunded</h2>
        <ul>
          <li>You were charged twice for the same plan.</li>
          <li>You paid, but Plus did not switch on and we could not fix it within 3 working days.</li>
        </ul>
        <h2>Cancellation</h2>
        <p>
          Plus Monthly does not renew automatically, so there is nothing to cancel: it ends 30 days after payment. Plus Lifetime is a one-time payment.
          After a refund, Plus is switched off on your account.
        </p>
      </>
    ),
  },
  '/contact': {
    title: 'Contact us',
    body: (
      <>
        <p>We would love to hear from you: questions, problems, payments and refunds, or ideas to make Granny better.</p>
        <p className="contact-line">
          💬 WhatsApp / call: <WhatsApp />
        </p>
        <p className="contact-line">
          📧 Email: <Mail />
        </p>
        <p>We usually reply within 1 working day (Monday to Saturday, 10 am – 7 pm IST).</p>
        <p>
          Want to tell us how Granny helped you? <a href="#/feedback">Share your feedback</a>.
        </p>
        <p className="muted small">
          {BUSINESS.name} · {BUSINESS.location}
        </p>
      </>
    ),
  },
};

export default function Legal({ route }: { route: Route }) {
  const page = PAGES[route];
  return (
    <div className="legal">
      <header className="l-nav">
        <a className="brand" href="#/">
          <img src="icon.svg" alt="" width={32} height={32} />
          <span>Spoken English Granny</span>
        </a>
        <a className="btn primary small" href="#/practice">
          Open app
        </a>
      </header>
      <article className="card legal-body">
        <h1>{page.title}</h1>
        <p className="muted small">Last updated: {BUSINESS.lastUpdated}</p>
        {page.body}
      </article>
      <footer className="foot">
        <a href="#/privacy">Privacy</a> · <a href="#/terms">Terms</a> · <a href="#/refund">Refunds</a> · <a href="#/contact">Contact</a>
      </footer>
    </div>
  );
}
