import { useEffect, useState } from 'react';

export type Route = '/' | '/practice' | '/talk' | '/badges' | '/history' | '/plus' | '/privacy' | '/terms' | '/refund' | '/contact';
const ROUTES: Route[] = ['/', '/practice', '/talk', '/badges', '/history', '/plus', '/privacy', '/terms', '/refund', '/contact'];
export const LEGAL_ROUTES: Route[] = ['/privacy', '/terms', '/refund', '/contact'];

function current(): Route {
  const r = window.location.hash.replace(/^#/, '') || '/';
  return (ROUTES as string[]).includes(r) ? (r as Route) : '/';
}

/** Tiny hash router: hash URLs work on any static host and inside a Capacitor app. */
export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(current);
  useEffect(() => {
    const on = () => {
      setRoute(current());
      window.scrollTo({ top: 0 });
    };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}

export function go(route: Route) {
  window.location.hash = route;
}
