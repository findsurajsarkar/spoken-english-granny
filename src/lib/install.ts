import { useEffect, useState } from 'react';
import { track } from './analytics';

/* "Install app" support: Android/desktop Chrome fire beforeinstallprompt; iPhone needs
 * the Share → Add to Home Screen steps instead. */

let deferred: any = null;
const listeners = new Set<() => void>();

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e;
    listeners.forEach((l) => l());
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    listeners.forEach((l) => l());
  });
}

const standalone = () =>
  typeof window !== 'undefined' && (window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true);

const isIOS = () => typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent);

export function useInstall() {
  const [, force] = useState(0);
  useEffect(() => {
    const l = () => force((n) => n + 1);
    listeners.add(l);
    return () => void listeners.delete(l);
  }, []);

  return {
    canPrompt: Boolean(deferred) && !standalone(),
    iosHint: isIOS() && !standalone(),
    install: async () => {
      if (!deferred) return;
      track('install_prompt');
      deferred.prompt();
      await deferred.userChoice.catch(() => null);
      deferred = null;
      force((n) => n + 1);
    },
  };
}
