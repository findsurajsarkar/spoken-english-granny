#!/usr/bin/env node
// Creates a Granny Plus activation code for one customer (without publishing it).
// Usage: npm run plus-code -- <puter-username> <monthly|lifetime>
// Tip: `npm run activate` does everything from a copied WhatsApp message.
import { createCode } from './plus-lib.mjs';

const [username, plan] = process.argv.slice(2);
if (!username || !['monthly', 'lifetime'].includes(plan)) {
  console.error('Usage: npm run plus-code -- <puter-username> <monthly|lifetime>');
  process.exit(1);
}
const code = createCode(username, plan);
console.log(`\nActivation code for ${username} (${plan}): ${code}\n`);
console.log('Now publish it:  git commit -am "Plus code" && git push   (live in ~1 minute)\n');
console.log('Message to send the customer:\n');
console.log(`Code: ${code} (customer enters it under "Have an activation code?" on the Upgrade page)`);
