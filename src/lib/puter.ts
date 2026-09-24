/* Thin wrapper around Puter.js (loaded from a <script> tag in index.html).
 * Puter uses a "user pays" model: each learner signs in with a free Puter
 * account and AI usage comes from their own allowance — no API keys here. */

import { demoAsk, demoKv, isDemo } from './demo';

declare global {
  interface Window {
    puter?: any;
  }
}

/** Better model for the careful English check; topics use Puter's default model. */
const ANALYSIS_MODEL = 'claude-sonnet-5';

let loading: Promise<void> | null = null;

/** Loads Puter.js on demand, so the landing page opens fast and the app loads it in the background. */
export function loadPuter(): Promise<void> {
  if (isDemo() || window.puter) return Promise.resolve();
  if (!loading) {
    loading = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://js.puter.com/v2/';
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => {
        loading = null;
        reject(new Error("Granny can't reach Puter right now. Please check your internet and try again."));
      };
      document.head.appendChild(s);
    });
  }
  return loading;
}

function puter() {
  if (!window.puter) {
    throw new Error("Granny can't reach Puter right now. Please check your internet and reload the page.");
  }
  return window.puter;
}

export function isSignedIn(): boolean {
  if (isDemo()) return true;
  try {
    return Boolean(puter().auth.isSignedIn());
  } catch {
    return false;
  }
}

/**
 * Must be called directly from a click handler, otherwise the browser blocks the popup.
 * guest: Puter creates a free temporary account in one tap (no sign-up form).
 * pickAccount: always let the learner choose an account (used for "Save progress with Google").
 */
export async function signIn(opts: { guest?: boolean; pickAccount?: boolean } = {}): Promise<void> {
  if (isDemo()) return;
  await loadPuter();
  await puter().auth.signIn({
    attempt_temp_user_creation: Boolean(opts.guest),
    ...(opts.pickAccount ? { request_auth: true } : {}),
  });
}

/** The signed-in Puter account, and whether it is a temporary guest account. */
export async function getAccount(): Promise<{ username: string | null; guest: boolean }> {
  if (isDemo()) return { username: 'priya', guest: false };
  try {
    await loadPuter();
    const user = await puter().auth.getUser();
    return { username: user?.username ?? null, guest: Boolean(user?.is_temp ?? user?.isTemp ?? user?.is_temporary) };
  } catch {
    return { username: null, guest: false };
  }
}

export async function signOut(): Promise<void> {
  await loadPuter();
  await puter().auth.signOut();
}

/** Puter's per-user, per-app key-value store (values up to 400 KB each). */
export function kv() {
  if (isDemo()) return demoKv;
  return puter().kv as {
    get: (key: string) => Promise<any>;
    set: (key: string, value: unknown) => Promise<boolean>;
    del: (key: string) => Promise<boolean>;
    list: (pattern: string, returnValues: true) => Promise<Array<{ key: string; value: any }>>;
  };
}

export async function getUsername(): Promise<string | null> {
  return (await getAccount()).username;
}

function textOf(resp: any): string {
  if (typeof resp === 'string') return resp;
  const content = resp?.message?.content;
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) return content.map((b: any) => b?.text ?? '').join('');
  if (typeof resp?.text === 'string') return resp.text;
  return String(resp ?? '');
}

function parseJSON<T>(text: string): T {
  const cleaned = text.replace(/```(?:json)?/gi, '');
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end <= start) throw new Error('Granny got confused by the answer. Please try again.');
  return JSON.parse(cleaned.slice(start, end + 1)) as T;
}

async function chat(prompt: string, model?: string): Promise<string> {
  if (isDemo()) return demoAsk(prompt);
  await loadPuter();
  const opts: Record<string, unknown> = { normalize: true };
  if (model) opts.model = model;
  return textOf(await puter().ai.chat(prompt, opts));
}

export async function askJSON<T>(prompt: string, careful = false): Promise<T> {
  let text: string;
  try {
    text = await chat(prompt, careful ? ANALYSIS_MODEL : undefined);
  } catch (err) {
    if (!careful) throw err;
    // The preferred model may be unavailable for this account — use Puter's default.
    text = await chat(prompt);
  }
  return parseJSON<T>(text);
}

export async function askText(prompt: string): Promise<string> {
  return chat(prompt);
}

export async function transcribe(audio: Blob): Promise<string> {
  if (isDemo()) return 'Last Diwali I go to my grandmother village.';
  // Give the file a name/extension that matches the phone's recording format (webm, mp4 or ogg).
  await loadPuter();
  const type = audio.type || 'audio/webm';
  const ext = type.includes('mp4') ? 'm4a' : type.includes('ogg') ? 'ogg' : 'webm';
  const file = new File([audio], `speech.${ext}`, { type: type.split(';')[0] });
  const result = await puter().ai.speech2txt(file, {
    language: 'en',
    // Keep the learner's own words, mistakes included: Granny needs to see them.
    prompt: 'Transcribe exactly what the speaker says, word for word. Keep grammar mistakes and Indian English as spoken. Do not correct anything.',
  });
  return (typeof result === 'string' ? result : result?.text ?? '').trim();
}
