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
// Domain-separated from AUTH_ROOT_INFO on purpose, even though both derive
// FROM the same 32-byte root (not from the raw BIP-39 seed again — see
// deriveWireSecretFromRootBytes's own doc comment for why that specific
// choice matters for recovery). Two different derived values from one
// root, each scoped to its own use, is the same pattern this.me's own
// crypto.ts already uses for auth vs. other branch-scoped keys.
const WIRE_SECRET_INFO = 'this.me/bip39-wire-secret:v1';
const WIRE_SECRET_BYTES = 32;

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

/**
 * Derives the `secret` sent over the wire to claim/signIn — the value
 * modules/monad's claim/records.ts scrypt's into the key that
 * encrypts/decrypts `noise` (verified live: that derivation is completely
 * independent of identityHash/publicKey/the signed proof; see
 * createCleakerSession.ts's identityRootHex doc comment).
 *
 * Deliberately derived from the ROOT (not from username+password, and not
 * by re-deriving from the raw BIP-39 seed a second time) — this is what
 * makes full data recovery possible without any server change: the same
 * root is reconstructible from EITHER the 12-word phrase (recovery, no
 * password involved at all) OR the local encrypted vault (day-to-day,
 * password only ever unlocks the vault, never reaches the server). Either
 * path derives the exact same wire secret, which reproduces the exact same
 * `noise` decryption key the original claim established — recovery is
 * then just calling the ALREADY-EXISTING signIn/open endpoint with a
 * re-derived secret, not a new server capability.
 *
 * Deriving from the root specifically (not the raw bip39Seed) matters
 * because day-to-day sign-in only ever has the ROOT on hand (unwrapped
 * from the vault) — it never re-touches the phrase or the raw BIP-39 seed
 * at all after registration. One shared root, two domain-separated
 * children (this and the auth-root's branch-proof key) — never the other
 * way around.
 */
export async function deriveWireSecretFromRootBytes(rootBytes: Uint8Array): Promise<string> {
  const secretBytes = await deriveHkdfBytes(rootBytes, HKDF_SALT, WIRE_SECRET_INFO, WIRE_SECRET_BYTES);
  return bytesToHex(secretBytes);
}
