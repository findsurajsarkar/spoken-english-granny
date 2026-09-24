// Shared helpers for creating Granny Plus activation codes (see src/plusCodes.ts).
import { createHash, randomInt } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';

export const CODES_FILE = new URL('../src/plusCodes.ts', import.meta.url);
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O or 1/I lookalikes

/** Adds a code for this username + plan to src/plusCodes.ts and returns it (e.g. "KX7P-9M2D"). */
export function createCode(username, plan) {
  const user = username.trim();
  if (!user) throw new Error('Missing username');
  if (!['monthly', 'lifetime'].includes(plan)) throw new Error(`Unknown plan "${plan}" (use monthly or lifetime)`);
  const code = Array.from({ length: 8 }, () => ALPHABET[randomInt(ALPHABET.length)]).join('');
  const h = createHash('sha256').update(`${user.toLowerCase()}|${plan}|${code}`).digest('hex');
  const until = new Date();
  if (plan === 'monthly') until.setDate(until.getDate() + 31); // 30 days + 1 day to redeem
  else until.setFullYear(2999);
  const src = readFileSync(CODES_FILE, 'utf8');
  const entry = `  { h: '${h}', plan: '${plan}', until: '${until.toISOString()}' }, // ${user} ${new Date().toISOString().slice(0, 10)}\n`;
  writeFileSync(CODES_FILE, src.replace(/\];\s*$/, `${entry}];\n`));
  return `${code.slice(0, 4)}-${code.slice(4)}`;
}

/** The warm reply to send the customer on WhatsApp. */
export function welcomeMessage(username, plan, code) {
  const name = plan === 'monthly' ? 'Granny Plus Monthly' : 'Granny Plus Lifetime';
  return [
    `Thank you so much for joining ${name}! 👵💛`,
    `We are so happy to welcome you, and Granny can't wait to hear you speak more English every day.`,
    ``,
    `🔑 Your activation code: ${code}`,
    ``,
    `How to activate:`,
    `1. Open Spoken English Granny`,
    `2. Tap "⚡ Upgrade" at the top right`,
    `3. Scroll down, tap "Have an activation code?", enter ${code} and tap Activate`,
    ``,
    `(Please use the same account: ${username}. If the code doesn't work straight away, wait one minute and try again.)`,
    ``,
    plan === 'monthly'
      ? `Your Plus is valid for 30 days. Happy practising, beta! 🌸`
      : `Plus is yours for life, with all 8 conversations (including job interview practice).\n🎁 Your free Grammar Guide and 30-Day Speaking Planner are waiting in the app: tap your round profile picture (top right) → Your free downloads.\nHappy practising, beta! 🌸`,
  ].join('\n');
}
