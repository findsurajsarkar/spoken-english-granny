#!/usr/bin/env node
/* One-time setup for signed activation links.
 * Creates an ECDSA P-256 key pair:
 *   - the PUBLIC key goes into src/lib/activationKey.ts (the app uses it to check links),
 *   - the PRIVATE key is saved ONLY on this Mac in ~/SpokenEnglishGranny-signing-key/granny-admin-key.json.
 * It also prints the one-time setup link that puts the private key on your phone's admin page.
 * Never commit or share the private key. Running this again refuses to replace an existing key. */
import { webcrypto as crypto } from 'node:crypto';
import { existsSync, mkdirSync, writeFileSync, chmodSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const dir = join(homedir(), 'SpokenEnglishGranny-signing-key');
const privFile = join(dir, 'granny-admin-key.json');
const pubFile = new URL('../src/lib/activationKey.ts', import.meta.url);

if (existsSync(privFile) && !process.argv.includes('--force')) {
  console.error(`A key already exists at ${privFile}. Links made with it would stop working if replaced.`);
  console.error('Use --force only if the key was leaked (then re-run the phone setup).');
  process.exit(1);
}

const pair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
const pub = await crypto.subtle.exportKey('jwk', pair.publicKey);
const priv = await crypto.subtle.exportKey('jwk', pair.privateKey);

mkdirSync(dir, { recursive: true });
writeFileSync(privFile, JSON.stringify(priv));
chmodSync(privFile, 0o600);
writeFileSync(
  pubFile,
  `/* Public key for checking signed activation links (made by scripts/make-admin-key.mjs).
 * Safe to publish: it can only CHECK links. The private key that MAKES links stays with the owner. */
export const ACTIVATION_PUBLIC_KEY: JsonWebKey = ${JSON.stringify({ kty: pub.kty, crv: pub.crv, x: pub.x, y: pub.y })};
`,
);
const setup = Buffer.from(JSON.stringify({ kty: priv.kty, crv: priv.crv, x: priv.x, y: priv.y, d: priv.d })).toString('base64url');
writeFileSync(join(dir, 'phone-setup-link.txt'), `https://findsurajsarkar.github.io/spoken-english-granny/#/admin?k=${setup}\n`);
chmodSync(join(dir, 'phone-setup-link.txt'), 0o600);
console.log('✓ Public key written to src/lib/activationKey.ts');
console.log(`✓ Private key saved to ${privFile}`);
console.log(`✓ Phone setup link saved to ${join(dir, 'phone-setup-link.txt')}`);
