import { PLUS_CODES } from '../plusCodes';
import { activateUntil, type PlanId } from './plan';

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Checks an activation code for this account and switches Plus on. Returns the plan, or null. */
export async function redeemCode(username: string, raw: string): Promise<PlanId | null> {
  const code = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (code.length !== 8) return null;
  for (const plan of ['monthly', 'lifetime'] as PlanId[]) {
    const h = await sha256(`${username.trim().toLowerCase()}|${plan}|${code}`);
    const entry = PLUS_CODES.find((c) => c.h === h);
    if (entry) {
      if (entry.until <= new Date().toISOString()) return null;
      activateUntil(plan, entry.until, `code:${h.slice(0, 12)}`);
      return plan;
    }
  }
  return null;
}
