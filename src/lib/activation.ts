/* Signed activation links: the owner makes them on the admin page (or with npm run activate),
 * the customer taps the link and Plus switches on instantly. No publishing step.
 *
 * Link:  <site>/?activate=<payload>.<signature>
 *   payload   = base64url(JSON { u: username, p: plan, t: issued (ms), o: order })
 *   signature = ECDSA P-256 / SHA-256 over the payload text, made with the owner's private key.
 * The app checks the signature with the public key in activationKey.ts, so links can't be forged,
 * and a link only works for the account it was made for. */
import { ACTIVATION_PUBLIC_KEY } from './activationKey';
import { activateUntil, PLANS, type PlanId } from './plan';

export interface ActivationPayload {
  u: string;
  p: PlanId;
  t: number;
  o?: string;
}

export const SITE_URL = 'https://findsurajsarkar.github.io/spoken-english-granny/';
const ALG = { name: 'ECDSA', namedCurve: 'P-256' } as const;
const SIGN = { name: 'ECDSA', hash: 'SHA-256' } as const;

const enc = new TextEncoder();

function toB64url(bytes: Uint8Array): string {
  let s = '';
  bytes.forEach((b) => (s += String.fromCharCode(b)));
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromB64url(text: string): Uint8Array {
  const b = atob(text.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (text.length % 4)) % 4));
  return Uint8Array.from(b, (c) => c.charCodeAt(0));
}

/** Pulls the token out of whatever was pasted: a full link, "?activate=…", or the token itself. */
export function extractToken(input: string): string | null {
  const m = input.match(/activate=([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)/) ?? input.trim().match(/^([A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{40,})$/);
  return m ? m[1] : null;
}

/** Checks the signature and returns what the link grants, or null if it's not a genuine link. */
export async function readToken(token: string): Promise<ActivationPayload | null> {
  try {
    const [body, sig] = token.split('.');
    const key = await crypto.subtle.importKey('jwk', ACTIVATION_PUBLIC_KEY, ALG, false, ['verify']);
    const ok = await crypto.subtle.verify(SIGN, key, fromB64url(sig) as BufferSource, enc.encode(body));
    if (!ok) return null;
    const p = JSON.parse(new TextDecoder().decode(fromB64url(body))) as ActivationPayload;
    return p && typeof p.u === 'string' && (p.p === 'monthly' || p.p === 'lifetime') && typeof p.t === 'number' ? p : null;
  } catch {
    return null;
  }
}

export type ActivationResult =
  | { ok: true; plan: PlanId }
  | { ok: false; reason: 'invalid' | 'wrong-account' | 'expired'; forUser?: string };

/** Applies a link for the signed-in username. Monthly lasts 30 days from when the link was made. */
export async function activateWithToken(token: string, username: string): Promise<ActivationResult> {
  const p = await readToken(token);
  if (!p) return { ok: false, reason: 'invalid' };
  if (p.u.trim().toLowerCase() !== username.trim().toLowerCase()) return { ok: false, reason: 'wrong-account', forUser: p.u };
  const days = PLANS[p.p].days;
  const until = days === null ? '2999-12-31T00:00:00.000Z' : new Date(p.t + days * 86400000).toISOString();
  if (until <= new Date().toISOString()) return { ok: false, reason: 'expired' };
  activateUntil(p.p, until, `link:${p.o ?? token.slice(-10)}`);
  return { ok: true, plan: p.p };
}

/* ---------- owner side (admin page): making links ---------- */

export async function importPrivateKey(jwk: JsonWebKey): Promise<CryptoKey> {
  return crypto.subtle.importKey('jwk', { ...jwk, key_ops: ['sign'], ext: true }, ALG, false, ['sign']);
}

export async function makeActivationLink(key: CryptoKey, username: string, plan: PlanId, order?: string): Promise<string> {
  const payload: ActivationPayload = { u: username.trim(), p: plan, t: Date.now(), ...(order ? { o: order } : {}) };
  const body = toB64url(enc.encode(JSON.stringify(payload)));
  const sig = new Uint8Array(await crypto.subtle.sign(SIGN, key, enc.encode(body)));
  return `${SITE_URL}?activate=${body}.${toB64url(sig)}#/plus`;
}

/** The private key JWK encoded in the one-time phone setup link (#/admin?k=…). */
export function decodeSetupKey(k: string): JsonWebKey | null {
  try {
    const jwk = JSON.parse(new TextDecoder().decode(fromB64url(k))) as JsonWebKey;
    return jwk.kty === 'EC' && jwk.d ? jwk : null;
  } catch {
    return null;
  }
}

/* ---------- reading the customer's WhatsApp message ---------- */

export interface ParsedOrder {
  username?: string;
  plan?: PlanId;
  order?: string;
  amount?: number;
  paid: boolean;
}

export function parseOrderMessage(text: string): ParsedOrder {
  const plan: PlanId | undefined = /plus\s+lifetime/i.test(text) ? 'lifetime' : /plus\s+monthly/i.test(text) ? 'monthly' : undefined;
  const amount = text.match(/₹\s?([\d,]+)/)?.[1];
  return {
    username: text.match(/username:\s*([A-Za-z0-9_.-]+)/i)?.[1],
    plan,
    order: text.match(/Order:\s*(GR[A-Z0-9]+)/i)?.[1]?.toUpperCase(),
    amount: amount ? Number(amount.replace(/,/g, '')) : undefined,
    paid: /have paid|\bpaid\b/i.test(text),
  };
}

/** The warm WhatsApp reply with the activation link. */
export function welcomeMessage(username: string, plan: PlanId, link: string): string {
  const name = plan === 'monthly' ? 'Granny Plus Monthly' : 'Granny Plus Lifetime';
  return [
    `Thank you so much for joining ${name}! 👵💛`,
    `We are so happy to welcome you, and Granny can't wait to hear you speak more English every day.`,
    ``,
    `👉 Tap this link to switch on your Plus:`,
    link,
    ``,
    `(Open it on the phone where you use Granny, signed in as ${username}.)`,
    ``,
    plan === 'monthly'
      ? `Your Plus is valid for 30 days. Happy practising, beta! 🌸`
      : `Plus is yours for life, with all 8 conversations (including job interview practice).\n🎁 Your free Grammar Guide and 30-Day Speaking Planner are in the app: tap your round profile picture (top right) → Your free downloads.\nHappy practising, beta! 🌸`,
  ].join('\n');
}
