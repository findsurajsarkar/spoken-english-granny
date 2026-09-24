/* Google Analytics 4. Off until GA_MEASUREMENT_ID is set in config.ts.
 * Only page views and product events are sent, never what learners say. */
import { GA_MEASUREMENT_ID } from '../config';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

let started = false;

export function initAnalytics() {
  if (started || !GA_MEASUREMENT_ID || import.meta.env.DEV) return;
  started = true;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments);
  };
  window.gtag('js', new Date());
  // Hash routes (#/practice) are tracked as page paths, so send page views ourselves.
  window.gtag('config', GA_MEASUREMENT_ID, { send_page_view: false });
  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(s);

  // Remember where visitors came from (?ref=whatsapp etc.) for the whole visit.
  const ref = new URLSearchParams(window.location.search).get('ref');
  if (ref) window.gtag('set', 'user_properties', { first_ref: ref });
}

export function trackPage(route: string) {
  if (!started) return;
  window.gtag?.('event', 'page_view', {
    page_path: route === '/' ? '/' : route,
    page_location: window.location.origin + window.location.pathname + '#' + route,
    page_title: document.title,
  });
}

export function track(event: string, params: Record<string, unknown> = {}) {
  if (!started) return;
  window.gtag?.('event', event, params);
}
