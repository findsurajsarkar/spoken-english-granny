// Shared helpers for activating Granny Plus from the Mac (npm run activate / npm run plus-code).
import { createHash, randomInt, webcrypto as crypto } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

export const CODES_FILE = new URL('../src/plusCodes.ts', import.meta.url);
export const KEY_FILE = join(homedir(), 'SpokenEnglishGranny-signing-key', 'granny-admin-key.json');
const SITE_URL = 'https://findsurajsarkar.github.io/spoken-english-granny/';
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O or 1/I lookalikes

/** Signed activation link (same format as the admin page); works instantly, no publishing. */
export async function createLink(username, plan, order) {
  if (!existsSync(KEY_FILE)) throw new Error(`Signing key not found at ${KEY_FILE}. Run: node scripts/make-admin-key.mjs`);
  const jwk = JSON.parse(readFileSync(KEY_FILE, 'utf8'));
  const key = await crypto.subtle.importKey('jwk', { ...jwk, key_ops: ['sign'] }, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  const body = Buffer.from(JSON.stringify({ u: username.trim(), p: plan, t: Date.now(), ...(order ? { o: order } : {}) })).toString('base64url');
  const sig = Buffer.from(await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, new TextEncoder().encode(body))).toString('base64url');
  return `${SITE_URL}?activate=${body}.${sig}#/plus`;
}

/** Older 8-character code (needs publishing). Kept for compatibility. */
export function createCode(username, plan) {
  const user = username.trim();
  if (!user) throw new Error('Missing username');
  if (!['monthly', 'lifetime'].includes(plan)) throw new Error(`Unknown plan "${plan}" (use monthly or lifetime)`);
  const code = Array.from({ length: 8 }, () => ALPHABET[randomInt(ALPHABET.length)]).join('');
  const h = createHash('sha256').update(`${user.toLowerCase()}|${plan}|${code}`).digest('hex');
  const until = new Date();
  if (plan === 'monthly') until.setDate(until.getDate() + 31);
  else until.setFullYear(2999);
  const src = readFileSync(CODES_FILE, 'utf8');
  const entry = `  { h: '${h}', plan: '${plan}', until: '${until.toISOString()}' }, // ${user} ${new Date().toISOString().slice(0, 10)}\n`;
  writeFileSync(CODES_FILE, src.replace(/\];\s*$/, `${entry}];\n`));
  return `${code.slice(0, 4)}-${code.slice(4)}`;
}

/** The warm WhatsApp reply (link version). Keep in sync with welcomeMessage() in src/lib/activation.ts. */
export function welcomeMessage(username, plan, link) {
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
