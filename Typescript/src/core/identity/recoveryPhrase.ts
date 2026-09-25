// recoveryPhrase.ts — client-only BIP-39 recovery phrase generation and
// derivation. Nothing here ever leaves this module unencrypted except the
// words themselves, which the caller is responsible for showing to the
// person once and never transmitting anywhere (see Passphrase.tsx and
// RegisterMe.tsx's use of it).
//
// Deliberately built on @scure/bip39 (audited, maintained, standard
// wordlist/checksum) rather than hand-rolled entropy/checksum logic — "no
// custom crypto" applies here the same way it already does to this.me's own
// crypto.ts. The seed→root step reuses this.me's own deriveHkdfBytes
// (native WebCrypto HKDF) instead of a second implementation of the same
// primitive — one audited HKDF path for the whole system, not two.
import { generateMnemonic, mnemonicToSeedWebcrypto, validateMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english.js';
import { deriveHkdfBytes } from 'this.me';

const WORD_COUNT = 12;
const ENTROPY_BITS = 128; // 128 bits of entropy -> 12 words (BIP-39 standard ratio)
const ROOT_BYTES = 32;

// Fixed HKDF salt for this derivation specifically — not a secret, just a
// domain separator so "HKDF over a BIP-39 seed, for this.me identity roots"
// can never collide with some unrelated HKDF use of the same seed material
// elsewhere. The "v1" info string below is the actual scheme identifier;
// bump it (auth-root:v2, ...) if the derivation ever changes shape, so an
// old phrase can never silently resolve to a different root under a new
// scheme.
const HKDF_SALT = 'this.me/bip39-recovery:v1';
const AUTH_ROOT_INFO = 'this.me/bip39-auth-root:v1';

function normalizePhrase(words: string[]): string {
  return words.map((w) => String(w || '').trim().toLowerCase()).join(' ').trim();
}

export function bytesToHex(bytes: Uint8Array): string {
  let out = '';
  for (const byte of bytes) out += byte.toString(16).padStart(2, '0');
  return out;
}

export function hexToBytes(hex: string): Uint8Array {
  const clean = String(hex || '').trim();
  if (clean.length % 2 !== 0) throw new Error('Hex string must have an even length.');
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(clean.substring(i * 2, i * 2 + 2), 16);
  }
  return out;
}

/** A fresh 12-word phrase from real CSPRNG entropy (via @scure/bip39). */
export function generateRecoveryPhrase(): string[] {
  const phrase = generateMnemonic(wordlist, ENTROPY_BITS);
  const words = phrase.split(' ');
  if (words.length !== WORD_COUNT) {
    throw new Error(`Expected a ${WORD_COUNT}-word phrase, got ${words.length}.`);
  }
  return words;
}

/** Checksum + wordlist validation — does NOT confirm it belongs to any particular identity. */
export function isValidRecoveryPhrase(words: string[]): boolean {
  if (!Array.isArray(words) || words.length !== WORD_COUNT) return false;
  if (words.some((w) => !String(w || '').trim())) return false;
  return validateMnemonic(normalizePhrase(words), wordlist);
}

/**
 * Derives this.me's identity root (the `#seed` a kernel is constructed
 * from) from a recovery phrase — deterministic: the same 12 words always
 * derive the exact same root, which is what makes recovery possible at
 * all. Empty BIP-39 passphrase, deliberately (v1 scope) — the day-to-day
 * login password must never participate in this derivation, or changing
 * the password would silently change the identity it recovers to.
 *
 * Returns raw bytes (32) — pass to `wrapIdentityRoot()` for local encrypted
 * storage, or hex-encode for `new ME(hexSeed)`. See
 * `deriveIdentityRootHexFromPhrase` for the hex-string convenience form.
 */
export async function deriveIdentityRootBytesFromPhrase(words: string[]): Promise<Uint8Array> {
  const phrase = normalizePhrase(words);
  if (!validateMnemonic(phrase, wordlist)) {
    throw new Error('INVALID_RECOVERY_PHRASE');
  }
  const bip39Seed = await mnemonicToSeedWebcrypto(phrase, '');
  return deriveHkdfBytes(bip39Seed as Uint8Array, HKDF_SALT, AUTH_ROOT_INFO, ROOT_BYTES);
}

/**
 * Hex-string convenience form of `deriveIdentityRootBytesFromPhrase`,
 * matching this.me's own `generateSeed()` encoding (me/Typescript/src/me.ts)
 * — ready to pass straight into `new ME(hexSeed)`.
 */
export async function deriveIdentityRootHexFromPhrase(words: string[]): Promise<string> {
  return bytesToHex(await deriveIdentityRootBytesFromPhrase(words));
}

