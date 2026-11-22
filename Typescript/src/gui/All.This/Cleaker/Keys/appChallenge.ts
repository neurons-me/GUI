// appChallenge.ts — the generic app ⇄ .me challenge protocol (any app; netget is only the first adapter).
//
//   app ──(challenge ENCRYPTED to the user's .me public key, asking for path `keys.<app>`)──▶ .me
//   .me  decrypts locally, decides (standing grant / wire / ask), signs the app's own message with the key at that path
//   .me ──(signature + public key + identity, nothing else)──▶ app ──(same proof)──▶ the app's authority
//   authority  verifies again on its own: key exists and is ACTIVE, signature, fresh, not replayed, identity holds
//              authority over the resource — then writes `<authorityRoot>.<resource>`; the app only READS it back.
//
// What never travels: the private signing key, the decryption key, any seed/secret/passphrase, and the plaintext
// challenge. The nonce stays inside the sealed box; what gets signed and forwarded is its digest (proves the
// signer could decrypt it, reveals nothing).
//
// Crypto: signing reuses this.me's public API (importEd25519SigningKey / signEd25519Proof / verifyEd25519Signature /
// normalizeProofMessage) — the same functions Cleaker's keychain uses (localKeychainKeyVault.ts). Encrypt-to-identity
// is DEMO WebCrypto (ECDH P-256 → HKDF-SHA256 → AES-256-GCM): this.me has an audience sealer internally
// (src/audience.ts sealAudience/openAudience) but does not export it from its package entry, so it is not used here.
//
// SIMULATED: createMockApp and createMockAuthority run in the browser (Storybook). Nothing here makes a network call.
import { exportEd25519PublicKey, importEd25519SigningKey, normalizeProofMessage, signEd25519Proof, verifyEd25519Signature } from 'this.me';
import type { AppAdapter } from './appAdapters';

// ── encoding ─────────────────────────────────────────────────────────────────────────────────────────────────────
const te = new TextEncoder();
const td = new TextDecoder();
export function b64u(bytes: Uint8Array): string {
  let bin = '';
  bytes.forEach((b) => { bin += String.fromCharCode(b); });
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
export function unb64u(s: string): Uint8Array {
  const pad = s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4);
  const bin = atob(pad);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}
const buf = (u: Uint8Array): ArrayBuffer => u.buffer.slice(u.byteOffset, u.byteOffset + u.byteLength) as ArrayBuffer;
export async function sha256b64u(text: string): Promise<string> {
  return b64u(new Uint8Array(await crypto.subtle.digest('SHA-256', te.encode(text))));
}
const randomB64u = (n: number) => b64u(crypto.getRandomValues(new Uint8Array(n)));

// ── types ────────────────────────────────────────────────────────────────────────────────────────────────────────
/** The plaintext challenge. Exists only inside the app that made it and, after decrypting, inside the .me. */
export interface AppChallenge {
  v: 1;
  audience: string;
  path: string;
  op: string;
  resource: string;
  target?: string;
  nonce: string;
  issuedAt: number;
  expiresAt: number;
}

/** Public encryption key of a .me (ECDH P-256, only x/y). */
export type EncryptionPublicKey = { kty: 'EC'; crv: 'P-256'; x: string; y: string };

export interface SealedBox {
  alg: 'ECDH-P256+HKDF-SHA256+A256GCM (demo)';
  /** Ephemeral public key of the sender (one per box). */
  epk: EncryptionPublicKey;
  iv: string;
  ct: string;
}

/** On the wire, app → .me. Audience and path are public (routing); op, resource and nonce are inside `sealed`. */
export interface ChallengeEnvelope {
  kind: 'app-challenge';
  id: string;
  audience: string;
  path: string;
  to: string;
  sealed: SealedBox;
}

/** On the wire, .me → app. Signature + public identity only. */
export interface ChallengeResponse {
  kind: 'app-challenge-response';
  id: string;
  audience: string;
  identityHash: string;
  keyId: string;
  publicKey: string;
  timestamp: number;
  signature: string;
}

/** On the wire, app → authority. The digest replaces the nonce. */
export interface AuthorityProof {
  kind: 'authority-proof';
  audience: string;
  op: string;
  resource: string;
  target?: string;
  identityHash: string;
  keyId: string;
  challenge: string;
  timestamp: number;
  signature: string;
}

/** What a .me publishes about itself. No private material. */
export interface PublicIdentity {
  namespace: string;
  identityHash: string;
  keyId: string;
  /** Ed25519 raw public key (base64url) — verifies signatures. */
  publicKey: string;
  /** ECDH P-256 public key — what apps encrypt challenges to. */
  encryptionKey: EncryptionPublicKey;
}

export const challengeDigest = (nonce: string) => sha256b64u(`this.gui/app-challenge:v1:nonce:${nonce}`);

// ── encrypt to identity (demo) ───────────────────────────────────────────────────────────────────────────────────
const boxInfo = (audience: string, id: string, to: string) => te.encode(`this.gui/app-challenge:v1:${audience}:${id}:${to}`);

async function boxKey(priv: CryptoKey, pub: CryptoKey, info: Uint8Array): Promise<CryptoKey> {
  const bits = new Uint8Array(await crypto.subtle.deriveBits({ name: 'ECDH', public: pub }, priv, 256));
  const hk = await crypto.subtle.importKey('raw', buf(bits), 'HKDF', false, ['deriveKey']);
  bits.fill(0);
  return crypto.subtle.deriveKey(
    { name: 'HKDF', hash: 'SHA-256', salt: buf(te.encode('this.gui/app-challenge/v1')), info: buf(info) },
    hk, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt'],
  );
}
const importEcPublic = (k: EncryptionPublicKey) =>
  crypto.subtle.importKey('jwk', { kty: 'EC', crv: 'P-256', x: k.x, y: k.y, ext: true }, { name: 'ECDH', namedCurve: 'P-256' }, true, []);

/** Seals `plaintext` so only the holder of `to`'s private key can read it; bound to (audience, id, recipient). */
export async function sealToIdentity(to: EncryptionPublicKey, plaintext: string, bind: { audience: string; id: string; to: string }): Promise<SealedBox> {
  const eph = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
  const info = boxInfo(bind.audience, bind.id, bind.to);
  const key = await boxKey(eph.privateKey, await importEcPublic(to), info);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: buf(info) }, key, buf(te.encode(plaintext))));
  const j = await crypto.subtle.exportKey('jwk', eph.publicKey);
  return { alg: 'ECDH-P256+HKDF-SHA256+A256GCM (demo)', epk: { kty: 'EC', crv: 'P-256', x: j.x!, y: j.y! }, iv: b64u(iv), ct: b64u(ct) };
}

async function openBox(priv: CryptoKey, box: SealedBox, bind: { audience: string; id: string; to: string }): Promise<string> {
  const info = boxInfo(bind.audience, bind.id, bind.to);
  const key = await boxKey(priv, await importEcPublic(box.epk), info);
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: buf(unb64u(box.iv)), additionalData: buf(info) }, key, buf(unb64u(box.ct)));
  return td.decode(pt);
}

// ── the .me side ─────────────────────────────────────────────────────────────────────────────────────────────────
export interface MeSigner {
  readonly identity: PublicIdentity;
  /** Decrypts a challenge addressed to this .me; the clear audience/path must match the sealed ones. */
  open(envelope: ChallengeEnvelope): Promise<AppChallenge>;
  /** Signs the app's own message for an opened challenge. Refuses expired challenges. */
  sign(envelope: ChallengeEnvelope, challenge: AppChallenge, adapter: AppAdapter, now: number): Promise<ChallengeResponse>;
}

/**
 * A .me's key at `keys.<app>`: an Ed25519 signing key and an ECDH decryption key, both held only in this closure
 * (the decryption key is non-extractable; the signing seed is wiped right after import). Demo: generated per page
 * load, never stored. The real one is a keychain key unlocked from the encrypted local vault (localKeychainKeyVault).
 */
export async function createMeSigner(opts: { namespace: string; identityHash: string }): Promise<MeSigner> {
  const enc = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, false, ['deriveBits']);
  const seed = crypto.getRandomValues(new Uint8Array(32));
  const { privateKey, publicKey } = await importEd25519SigningKey(seed);
  seed.fill(0);
  const publicKeyRaw = await exportEd25519PublicKey(publicKey);
  const keyId = (await sha256b64u(`keyId:${publicKeyRaw}`)).slice(0, 16);
  const j = await crypto.subtle.exportKey('jwk', enc.publicKey);
  const identity: PublicIdentity = Object.freeze<PublicIdentity>({
    namespace: opts.namespace, identityHash: opts.identityHash, keyId, publicKey: publicKeyRaw,
    encryptionKey: { kty: 'EC', crv: 'P-256', x: j.x!, y: j.y! },
  });

  return {
    identity,
    async open(envelope) {
      if (envelope.to !== identity.identityHash) throw new Error('NOT_ADDRESSED_TO_ME');
      const text = await openBox(enc.privateKey, envelope.sealed, { audience: envelope.audience, id: envelope.id, to: envelope.to });
      const c = JSON.parse(text) as AppChallenge;
      if (c.v !== 1 || c.audience !== envelope.audience || c.path !== envelope.path) throw new Error('ENVELOPE_MISMATCH');
      return c;
    },
    async sign(envelope, c, adapter, now) {
      if (c.audience !== adapter.id) throw new Error('AUDIENCE_MISMATCH');
      if (!adapter.ops[c.op]) throw new Error('UNKNOWN_OP');
      if (now > c.expiresAt) throw new Error('CHALLENGE_EXPIRED');
      const timestamp = now;
      const challenge = await challengeDigest(c.nonce);
      const message = normalizeProofMessage(adapter.signedFields({
        op: c.op, resource: c.resource, namespace: identity.namespace, identityHash: identity.identityHash,
        keyId: identity.keyId, challenge, timestamp, target: c.target,
      }));
      const signature = await signEd25519Proof(privateKey, message);
      return {
        kind: 'app-challenge-response', id: envelope.id, audience: c.audience,
        identityHash: identity.identityHash, keyId: identity.keyId, publicKey: identity.publicKey, timestamp, signature,
      };
    },
  };
}

// ── the app's authority (SIMULATED; mirrors monad claim/gatewayAuthority.ts checks) ───────────────────────────────
export interface AuthorityRecord {
  owner: string | null;
  admins: Record<string, true>;
  namespaces: Record<string, string>;
  pubkeys: Record<string, string>;
  updatedAt: number;
}
export type AuthorityResult = { ok: true; path: string; record: AuthorityRecord } | { ok: false; error: string };

export const REPLAY_WINDOW_MS = 120_000;

export function createMockAuthority(adapter: AppAdapter, opts: { clock: () => number }) {
  const keychain = new Map<string, { namespace: string; identityHash: string; publicKey: string; active: boolean }>();
  const records = new Map<string, AuthorityRecord>();
  const seen = new Set<string>();
  const pathOf = (resource: string) => `${adapter.authorityRoot}.${resource}`;

  async function submit(p: AuthorityProof): Promise<AuthorityResult> {
    const def = adapter.ops[p.op];
    if (p.audience !== adapter.id) return { ok: false, error: 'AUDIENCE_MISMATCH' };
    if (!def) return { ok: false, error: 'UNKNOWN_OP' };
    if (!p.challenge || !p.signature) return { ok: false, error: 'PROOF_REQUIRED' };
    if (!Number.isFinite(p.timestamp) || Math.abs(opts.clock() - p.timestamp) > REPLAY_WINDOW_MS) return { ok: false, error: 'PROOF_STALE' };
    if (def.needsTarget && !p.target) return { ok: false, error: 'TARGET_REQUIRED' };
    // "vigencia": the key the proof names, looked up here — never the public key the caller sent along.
    const key = keychain.get(p.keyId);
    if (!key) return { ok: false, error: 'ACTING_KEY_NOT_FOUND' };
    if (!key.active) return { ok: false, error: 'ACTING_KEY_REVOKED' };
    if (key.identityHash !== p.identityHash) return { ok: false, error: 'IDENTITY_MISMATCH' };
    const replay = `${p.op}:${p.resource}:${p.identityHash}:${p.challenge}`;
    if (seen.has(replay)) return { ok: false, error: 'REPLAY_REJECTED' };
    const message = normalizeProofMessage(adapter.signedFields({
      op: p.op, resource: p.resource, namespace: key.namespace, identityHash: p.identityHash,
      keyId: p.keyId, challenge: p.challenge, timestamp: p.timestamp, target: p.target,
    }));
    if (!(await verifyEd25519Signature(key.publicKey, message, p.signature))) return { ok: false, error: 'PROOF_INVALID' };

    // "autorización": from this record, never from the key.
    const prev = records.get(p.resource);
    const rec: AuthorityRecord = prev
      ? { ...prev, admins: { ...prev.admins }, namespaces: { ...prev.namespaces }, pubkeys: { ...prev.pubkeys } }
      : { owner: null, admins: {}, namespaces: {}, pubkeys: {}, updatedAt: 0 };
    const who = p.identityHash;
    if (def.claims && rec.owner && rec.owner !== who) return { ok: false, error: 'ALREADY_CLAIMED' };
    if (!def.claims && !rec.owner) return { ok: false, error: 'NOT_CLAIMED' };
    if (def.ownerOnly && rec.owner !== who) return { ok: false, error: 'NOT_AUTHORIZED' };
    if (def.adminOnly && !rec.admins[who]) return { ok: false, error: 'NOT_AUTHORIZED' };

    seen.add(replay);
    switch (def.effect) {
      case 'claim': rec.owner = who; rec.admins[who] = true; rec.namespaces[who] = key.namespace; rec.pubkeys[who] = key.publicKey; break;
      case 'grant-admin': rec.admins[p.target!] = true; break;
      case 'revoke-admin': if (p.target === rec.owner) return { ok: false, error: 'CANNOT_REVOKE_OWNER' }; delete rec.admins[p.target!]; break;
      case 'transfer-owner': rec.owner = p.target!; rec.admins[p.target!] = true; break;
      default: break;
    }
    rec.updatedAt = opts.clock();
    records.set(p.resource, rec);
    return { ok: true, path: pathOf(p.resource), record: rec };
  }

  return {
    adapter,
    pathOf,
    /** The user registered this public key for their identity (in reality: the keychain registration flow). */
    registerKey(id: PublicIdentity) { keychain.set(id.keyId, { namespace: id.namespace, identityHash: id.identityHash, publicKey: id.publicKey, active: true }); },
    setKeyActive(keyId: string, active: boolean) { const k = keychain.get(keyId); if (k) k.active = active; },
    isKeyActive(keyId: string) { return keychain.get(keyId)?.active === true; },
    submit,
    /** The only thing the app does with the authority besides forwarding proofs: read. */
    read(resource: string): { path: string; record: AuthorityRecord | null } { return { path: pathOf(resource), record: records.get(resource) ?? null }; },
  };
}
export type MockAuthority = ReturnType<typeof createMockAuthority>;

// ── the app (SIMULATED) ──────────────────────────────────────────────────────────────────────────────────────────
export type AppReceiveResult =
  | { ok: true; proof: AuthorityProof; path: string; record: AuthorityRecord }
  | { ok: false; error: string; proof?: AuthorityProof };

export function createMockApp(adapter: AppAdapter, opts: { authority: MockAuthority; clock: () => number }) {
  const pending = new Map<string, AppChallenge>();

  async function issue(input: { op: string; resource: string; target?: string; to: PublicIdentity; ttlMs?: number }): Promise<ChallengeEnvelope> {
    if (!adapter.ops[input.op]) throw new Error('UNKNOWN_OP');
    const now = opts.clock();
    const id = randomB64u(12);
    const challenge: AppChallenge = {
      v: 1, audience: adapter.id, path: adapter.keyPath, op: input.op, resource: input.resource, target: input.target,
      nonce: randomB64u(24), issuedAt: now, expiresAt: now + (input.ttlMs ?? 60_000),
    };
    pending.set(id, challenge);
    const sealed = await sealToIdentity(input.to.encryptionKey, JSON.stringify(challenge), { audience: adapter.id, id, to: input.to.identityHash });
    return { kind: 'app-challenge', id, audience: adapter.id, path: adapter.keyPath, to: input.to.identityHash, sealed };
  }

  async function receive(r: ChallengeResponse): Promise<AppReceiveResult> {
    if (r.audience !== adapter.id) return { ok: false, error: 'AUDIENCE_MISMATCH' };
    const c = pending.get(r.id);
    if (!c) return { ok: false, error: 'UNKNOWN_OR_USED_CHALLENGE' };
    pending.delete(r.id); // one shot, whatever happens next
    if (opts.clock() > c.expiresAt) return { ok: false, error: 'CHALLENGE_EXPIRED' };
    const proof: AuthorityProof = {
      kind: 'authority-proof', audience: adapter.id, op: c.op, resource: c.resource, target: c.target,
      identityHash: r.identityHash, keyId: r.keyId, challenge: await challengeDigest(c.nonce), timestamp: r.timestamp, signature: r.signature,
    };
    const res = await opts.authority.submit(proof);
    return res.ok ? { ok: true, proof, path: res.path, record: res.record } : { ok: false, error: res.error, proof };
  }

  return { adapter, issue, receive, isPending: (id: string) => pending.has(id), cancel: (id: string) => void pending.delete(id) };
}
export type MockApp = ReturnType<typeof createMockApp>;
