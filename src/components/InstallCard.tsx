import { useInstall } from '../lib/install';

export default function InstallCard() {
  const { canPrompt, iosHint, install } = useInstall();
  if (!canPrompt && !iosHint) return null;
  return (
    <section className="card install-card">
      <span className="install-emoji" aria-hidden>
        📲
      </span>
      <div>
        <strong>Keep Granny on your phone</strong>
        {canPrompt ? (
          <p className="muted small">Install the app to open it in one tap, like any other app.</p>
        ) : (
          <p className="muted small">
            On iPhone: tap the <strong>Share</strong> button, then <strong>Add to Home Screen</strong>.
          </p>
        )}
      </div>
      {canPrompt && (
        <button className="btn primary small" onClick={install}>
          Install
        </button>
      )}
    </section>
  );
}
