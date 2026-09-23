/* Thin wrapper around Puter.js (loaded from a <script> tag in index.html).
 * Puter uses a "user pays" model: each learner signs in with a free Puter
 * account and AI usage comes from their own allowance — no API keys here. */

declare global {
  interface Window {
    puter?: any;
  }
}

/** Better model for the careful English check; topics use Puter's default model. */
const ANALYSIS_MODEL = 'claude-sonnet-5';

function puter() {
  if (!window.puter) {
    throw new Error("Granny can't reach Puter right now. Please check your internet and reload the page.");
  }
  return window.puter;
}

export function isSignedIn(): boolean {
  try {
    return Boolean(puter().auth.isSignedIn());
  } catch {
    return false;
  }
}

/** Must be called directly from a click handler, otherwise the browser blocks the popup. */
export async function signIn(): Promise<void> {
  await puter().auth.signIn();
}

export async function getUsername(): Promise<string | null> {
  try {
    const user = await puter().auth.getUser();
    return user?.username ?? null;
  } catch {
    return null;
  }
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

export async function transcribe(audio: Blob): Promise<string> {
  const result = await puter().ai.speech2txt(audio, { language: 'en' });
  return (typeof result === 'string' ? result : result?.text ?? '').trim();
}
