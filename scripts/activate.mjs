#!/usr/bin/env node
/* One-step Plus activation from a customer's WhatsApp message.
 *
 *   1. Copy the customer's whole WhatsApp message ("Hi! I want to buy Granny Plus Monthly ... username: xyz")
 *   2. npm run activate
 *   3. Paste the reply (already on your clipboard) into WhatsApp.
 *
 * It reads the clipboard, finds the plan and username, creates the code, publishes it
 * (git commit + push; live in about a minute) and copies the welcome reply to the clipboard.
 * You can also pass the message text instead: npm run activate -- "…message…"   (add --dry to test)
 * Only run this AFTER you have seen the money arrive in your bank/UPI app. */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { CODES_FILE, createCode, welcomeMessage } from './plus-lib.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const args = process.argv.slice(2);
const dry = args.includes('--dry'); // test run: nothing is saved, published or copied
const text = args.filter((a) => a !== '--dry').join(' ') || execFileSync('pbpaste').toString();

const plan = /plus\s+lifetime|2,?999/i.test(text) ? 'lifetime' : /plus\s+monthly|\b99\b/i.test(text) ? 'monthly' : null;
const username = text.match(/username:\s*([A-Za-z0-9_.-]+)/i)?.[1];

if (!plan || !username) {
  console.error('\n✗ Could not find the plan and username in the copied message.');
  console.error('  Copy the customer\'s whole WhatsApp message (it contains "Granny Plus …" and "Puter username: …") and run again,');
  console.error('  or use: npm run plus-code -- <username> <monthly|lifetime>\n');
  console.error('Copied text was:\n' + text.slice(0, 300));
  process.exit(1);
}

console.log(`\nCustomer: ${username}   Plan: ${plan === 'monthly' ? 'Plus Monthly (₹99)' : 'Plus Lifetime (₹2,999)'}`);
const before = readFileSync(CODES_FILE, 'utf8');
const code = createCode(username, plan);
if (dry) {
  writeFileSync(CODES_FILE, before);
  console.log(`Code (dry run, not saved): ${code}\n\n${welcomeMessage(username, plan, code)}\n`);
  process.exit(0);
}
console.log(`Code: ${code}`);

try {
  execFileSync('git', ['add', fileURLToPath(CODES_FILE)], { cwd: ROOT });
  execFileSync('git', ['commit', '-q', '-m', `Plus code: ${username} (${plan})`], { cwd: ROOT });
  execFileSync('git', ['push', '-q'], { cwd: ROOT, stdio: 'inherit' });
  console.log('✓ Published. The code works in about 1 minute.');
} catch (e) {
  console.error('✗ Could not publish automatically. Run:  git commit -am "Plus code" && git push');
}

const reply = welcomeMessage(username, plan, code);
execFileSync('pbcopy', { input: reply });
console.log('\n✓ Welcome message copied. Paste it into WhatsApp:\n');
console.log(reply + '\n');
