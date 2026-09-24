#!/usr/bin/env node
// Creates a Granny Plus activation code for one customer.
// Usage: npm run plus-code -- <puter-username> <monthly|lifetime>
import { createHash, randomInt } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';

const [username, plan] = process.argv.slice(2);
if (!username || !['monthly', 'lifetime'].includes(plan)) {
  console.error('Usage: npm run plus-code -- <puter-username> <monthly|lifetime>');
  process.exit(1);
}

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O or 1/I lookalikes
const code = Array.from({ length: 8 }, () => ALPHABET[randomInt(ALPHABET.length)]).join('');
const h = createHash('sha256').update(`${username.trim().toLowerCase()}|${plan}|${code}`).digest('hex');

const until = new Date();
if (plan === 'monthly') until.setDate(until.getDate() + 31); // 30 days + 1 day to redeem
else until.setFullYear(2999);

const file = new URL('../src/plusCodes.ts', import.meta.url);
const src = readFileSync(file, 'utf8');
const entry = `  { h: '${h}', plan: '${plan}', until: '${until.toISOString()}' }, // ${username} ${new Date().toISOString().slice(0, 10)}\n`;
writeFileSync(file, src.replace(/\];\s*$/, `${entry}];\n`));

const pretty = `${code.slice(0, 4)}-${code.slice(4)}`;
console.log(`\nActivation code for ${username} (${plan}): ${pretty}\n`);
console.log('Now publish it:  git commit -am "Plus code" && git push   (live in ~1 minute)\n');
console.log('Message to send the customer:');
console.log(
  `Thank you for buying Granny Plus ${plan === 'monthly' ? 'Monthly' : 'Lifetime'}! 👵💛\n` +
    `Your activation code: ${pretty}\n` +
    `Open the app → Get Plus → "Have an activation code?" → enter the code (sign in with the same Puter account: ${username}).`,
);
