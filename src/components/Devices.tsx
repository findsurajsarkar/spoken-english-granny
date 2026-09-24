import { STORE_LINKS } from '../config';
import { useInstall } from '../lib/install';
import { go } from '../lib/router';

export default function Devices() {
  const { canPrompt, install } = useInstall();

  const cards = [
    {
      icon: '🤖',
      name: 'Android',
      how: STORE_LINKS.playStore ? 'Get it on Google Play.' : 'Open Granny in Chrome and tap "Install app" (Play Store version coming soon).',
      link: STORE_LINKS.playStore,
      linkText: 'Google Play',
    },
    {
      icon: '🍎',
      name: 'iPhone & iPad',
      how: STORE_LINKS.appStore ? 'Download it from the App Store.' : 'Open Granny in Safari, tap Share, then "Add to Home Screen".',
      link: STORE_LINKS.appStore,
      linkText: 'App Store',
    },
    {
      icon: '🪟',
      name: 'Windows',
      how: STORE_LINKS.microsoftStore ? 'Get it from the Microsoft Store.' : 'Open Granny in Chrome or Edge and click the install icon in the address bar.',
      link: STORE_LINKS.microsoftStore,
      linkText: 'Microsoft Store',
    },
    {
      icon: '💻',
      name: 'Mac',
      how: 'Open Granny in Chrome and click the install icon, or in Safari choose File → Add to Dock.',
      link: '',
      linkText: '',
    },
  ];

  return (
    <section id="devices" className="l-devices">
      <h2 className="l-h2">Use Granny on any device</h2>
      <p className="center muted">One account, the same progress everywhere: phone, tablet or computer.</p>
      <div className="device-grid">
        {cards.map((c) => (
          <div key={c.name} className="device card">
            <span className="device-icon" aria-hidden>
              {c.icon}
            </span>
            <strong>{c.name}</strong>
            <p>{c.how}</p>
            {c.link && (
              <a className="btn ghost small" href={c.link} target="_blank" rel="noopener">
                {c.linkText}
              </a>
            )}
          </div>
        ))}
      </div>
      <div className="l-cta center-cta">
        {canPrompt ? (
          <button className="btn primary big-inline" onClick={install}>
            📲 Install Granny now
          </button>
        ) : (
          <button className="btn primary big-inline" onClick={() => go('/practice')}>
            Open Granny in your browser
          </button>
        )}
      </div>
    </section>
  );
}
