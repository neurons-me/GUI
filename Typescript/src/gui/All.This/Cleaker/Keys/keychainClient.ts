// keychainClient.ts — the real protocol client behind CleakerKeychain.tsx.
// Mirrors groupsApi.ts's shape (a structural signer, a canonical signed
// body via normalizeProofMessage, a plain fetch POST) rather than
// netgetSetupClient.ts's older module-closure-holding-a-derived-node
// pattern, since a SeedSession is already exactly what's needed here.
//
// What goes over the wire: a freshly generated public key, whether it's
// requesting admin standing within this keychain, a label, and signed
// proofs. The private half is generated
// and encrypted in localKeychainKeyVault.ts and NEVER leaves this module
// — no function here ever puts a seed or a passphrase into a request
// body. The recoverable identity's own root secret is even further away:
// this client never sees it at all, only `rootSigner.signPayload()`,
// which signs inside the SeedSession's own closure.
//
// Retry-without-losing-the-generated-key: generateAndRegisterKey() always
// stores the new local key BEFORE attempting the HTTP call (see
// localKeychainKeyVault.ts's generateAndStoreLocalKey). If that call
// fails for any reason, the key is already safely on disk (encrypted);
// retryRegistration(publicKeyRaw) replays the same stored key with a
// fresh nonce/timestamp rather than generating a new one.
import { normalizeProofMessage } from 'this.me';
import type { KeyAuthorization, KeyLocalAvailability, KeychainKey } from './keychainState';
import {
  findLocalEntryByPublicKey,
  findLocalEntryByRegisteredKeyId,
  generateAndStoreLocalKey,
  isLocalKeyUnlocked,
  listLocalKeychainEntries,
  lockLocalKey,
  markLocalKeyRegistered,
  signWithLocalKey,
  unlockLocalKey,
  type LocalKeychainKeyIndexEntry,
} from './localKeychainKeyVault';

export type KeychainRootSigner = {
  identityHash: string;
  signPayload(message: string): Promise<string>;
};

export interface ServerKeychainKeyRecord {
  keyId: string;
  label: string;
  publicKey: string;
  admin: boolean;
  authorization: KeyAuthorization;
  addedAt: number;
  addedBy: string;
  revokedAt?: number;
  revokedBy?: string;
}

export interface KeychainOperationOutcome {
  ok: boolean;
  status: number;
  error?: string;
}

export interface RegisterOutcome extends KeychainOperationOutcome {
  key?: ServerKeychainKeyRecord;
  publicKeyRaw: string;
}

function randomNonce(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  let binary = '';
  bytes.forEach((b) => { binary += String.fromCharCode(b); });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// The server stores/returns each key's public half as a PEM-wrapped SPKI
// string (confirmed live: "-----BEGIN PUBLIC KEY-----\n...\n-----END..."),
// never the bare base64url `publicKeyRaw` this client generates and holds
// locally (this.me's own exportEd25519PublicKey, used when the key was
// first created). A first version of the post-timeout "did this already
// register?" check below compared those two forms directly and always
// got `false` -- confirmed live with a real, deliberately delayed
// request: the key WAS registered server-side, this just never
// recognized it, left it stuck in the local "pending" list, and reported
// failure for a request that had actually succeeded. Converts the LOCAL
// form into the SAME PEM shape the server already uses, via WebCrypto
// (the same raw-import/spki-export pair this.me's own crypto.ts uses for
// this exact key type), rather than comparing across two different
// encodings.
function base64UrlToBytes(b64url: string): Uint8Array {
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
  const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

// Matches this.me/crypto.ts's own toArrayBuffer() -- SubtleCrypto's TS
// types want a plain ArrayBuffer, not the ArrayBufferLike a Uint8Array's
// own .buffer is typed as (which admits SharedArrayBuffer too).
function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const clean = Uint8Array.from(bytes);
  return clean.buffer.slice(clean.byteOffset, clean.byteOffset + clean.byteLength);
}

async function publicKeyRawToPem(publicKeyRaw: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', toArrayBuffer(base64UrlToBytes(publicKeyRaw)), { name: 'Ed25519' }, true, ['verify']);
  const spki = new Uint8Array(await crypto.subtle.exportKey('spki', key));
  let binary = '';
  spki.forEach((b) => { binary += String.fromCharCode(b); });
  const b64 = btoa(binary);
  const lines = b64.match(/.{1,64}/g) ?? [b64];
  return `-----BEGIN PUBLIC KEY-----\n${lines.join('\n')}\n-----END PUBLIC KEY-----\n`;
}

// Non-secret instrumentation only -- stage name, key label/keyId, HTTP
// status, error CODE. Never a passphrase, seed, private key, or raw
// signature. Added specifically because "the button just sat there" was
// reported with nothing to distinguish "still generating," "waiting on
// the network," and "got a response and something else broke" -- each of
// those needs a different fix, and none were visible before this.
function logStage(stage: string, detail?: Record<string, unknown>) {
  // eslint-disable-next-line no-console
  console.debug(`[keychain] ${stage}`, detail ?? {});
}

// A plain fetch() has no timeout of its own -- a server that never
// responds (hung request handler, dropped connection with no RST) left
// this Promise pending forever, which is indistinguishable from "still
// working" in the UI. Aborted at DEFAULT_TIMEOUT_MS so a caller can at
// least DECIDE what "too long" means instead of waiting indefinitely;
// see submitRegistration's own handling of the resulting 'TIMEOUT' error
// for why this must never be treated the same as a normal rejection.
const DEFAULT_TIMEOUT_MS = 15000;

export function createKeychainClient({
  endpoint,
  namespace,
  rootSigner,
}: {
  endpoint: string;
  namespace: string;
  rootSigner: KeychainRootSigner;
}) {
  const base = endpoint.replace(/\/+$/, '');

  async function post(path: string, body: unknown, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<{ status: number; json: any }> {
    // A network-level failure (offline, DNS, connection refused) throws
    // from fetch() itself, before there's any Response to read a status
    // from -- distinct from the server responding with a 4xx/5xx, which
    // is a normal, already-handled outcome below. Callers always get a
    // {status, json} back rather than an exception, so a registration
    // attempt fails cleanly into "retry" instead of an unhandled
    // rejection that leaves the UI stuck.
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(`${base}${path}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      const json = await res.json().catch(() => null);
      return { status: res.status, json };
    } catch (err) {
      // AbortError from OUR OWN timer, not the caller cancelling anything
      // -- distinguished from a generic network failure so callers (see
      // submitRegistration) can react differently: a timeout genuinely
      // does not tell you whether the server acted on the request before
      // the response was lost; a connection-refused/offline error does.
      if (err instanceof Error && err.name === 'AbortError') {
        return { status: 0, json: { error: 'TIMEOUT' } };
      }
      return { status: 0, json: { error: 'NETWORK_ERROR', detail: err instanceof Error ? err.message : String(err) } };
    } finally {
      clearTimeout(timer);
    }
  }

  async function get(path: string): Promise<{ status: number; json: any }> {
    try {
      const res = await fetch(`${base}${path}`);
      const json = await res.json().catch(() => null);
      return { status: res.status, json };
    } catch (err) {
      return { status: 0, json: { error: 'NETWORK_ERROR', detail: err instanceof Error ? err.message : String(err) } };
    }
  }

  async function signAsRegisteredKey(registeredKeyId: string, message: string): Promise<string> {
    const local = findLocalEntryByRegisteredKeyId(namespace, registeredKeyId);
    if (!local) throw new Error('ACTING_KEY_NOT_LOCAL');
    return signWithLocalKey(namespace, local.publicKeyRaw, message);
  }

  function toUiKey(record: ServerKeychainKeyRecord): KeychainKey {
    const local = findLocalEntryByRegisteredKeyId(namespace, record.keyId);
    const localAvailability: KeyLocalAvailability = !local
      ? 'not-available'
      : isLocalKeyUnlocked(namespace, local.publicKeyRaw)
        ? 'available-unlocked'
        : 'available-locked';
    return {
      keyId: record.keyId,
      label: record.label,
      admin: record.admin,
      authorization: record.authorization,
      localAvailability,
      addedAt: record.addedAt,
      revokedAt: record.revokedAt,
    };
  }

  async function listKeys(): Promise<KeychainKey[]> {
    const { json } = await get(`/api/v1/keychain/keys?namespace=${encodeURIComponent(namespace)}`);
    const records = (json?.keys ?? []) as ServerKeychainKeyRecord[];
    return records.map(toUiKey);
  }

  /** Locally generated keys this device holds material for that the
   *  server has not (yet, or successfully) confirmed — the "retry"
   *  candidates, surfaced separately from the server's own key list. */
  function listPendingLocalRegistrations(): LocalKeychainKeyIndexEntry[] {
    return listLocalKeychainEntries(namespace).filter((e) => !e.registeredKeyId);
  }

  async function submitRegistration(publicKeyRaw: string): Promise<RegisterOutcome> {
    const entry = findLocalEntryByPublicKey(namespace, publicKeyRaw);
    if (!entry) return { ok: false, status: 0, error: 'LOCAL_ENTRY_MISSING', publicKeyRaw };
    logStage('submitRegistration:start', { label: entry.label, admin: entry.requestedAdmin, actingKeyId: entry.actingKeyId ?? '(root)' });

    const nonce = randomNonce();
    const timestamp = Date.now();
    const newKey = { publicKey: publicKeyRaw, label: entry.label, admin: entry.requestedAdmin };

    let body: Record<string, unknown>;
    try {
      if (!entry.actingKeyId) {
        logStage('submitRegistration:signing', { via: 'root' });
        const signedFields = { op: 'keychain-register', namespace, newKey, nonce, timestamp, identityHash: rootSigner.identityHash };
        const signature = await rootSigner.signPayload(normalizeProofMessage(signedFields));
        body = { namespace, identityHash: rootSigner.identityHash, newKey, nonce, timestamp, signature };
      } else {
        logStage('submitRegistration:signing', { via: 'actingKey', actingKeyId: entry.actingKeyId });
        const signedFields = { op: 'keychain-register', namespace, newKey, nonce, timestamp, actingKeyId: entry.actingKeyId };
        const signature = await signAsRegisteredKey(entry.actingKeyId, normalizeProofMessage(signedFields));
        body = { namespace, actingKeyId: entry.actingKeyId, newKey, nonce, timestamp, signature };
      }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'SIGN_FAILED';
      logStage('submitRegistration:sign-failed', { error });
      return { ok: false, status: 0, error, publicKeyRaw };
    }

    logStage('submitRegistration:sending');
    const res = await post('/api/v1/keychain/keys', body);
    logStage('submitRegistration:response', { status: res.status, error: res.json?.error });

    if (res.status === 201 && res.json?.key?.keyId) {
      markLocalKeyRegistered(namespace, publicKeyRaw, res.json.key.keyId);
      return { ok: true, status: res.status, key: res.json.key, publicKeyRaw };
    }

    // A TIMEOUT or NETWORK_ERROR means the response was lost, not
    // necessarily that the request was -- the server may have already
    // committed this exact key before the connection dropped. Checking
    // BEFORE reporting failure means a caller (and whatever UI it drives)
    // never has to guess between "actually failed" and "probably worked,
    // just tell me to retry" -- and specifically never regenerates a NEW
    // key or discards this one's local private half over a response that
    // simply never arrived. A genuine server rejection (any real 4xx/5xx
    // with a body) skips this -- that's an unambiguous answer already,
    // not a "we don't know" case.
    if (res.status === 0 && (res.json?.error === 'TIMEOUT' || res.json?.error === 'NETWORK_ERROR')) {
      logStage('submitRegistration:unclear-outcome-checking-server', { reason: res.json?.error });
      const confirmed = await findRegisteredKeyByPublicKey(publicKeyRaw);
      if (confirmed) {
        logStage('submitRegistration:confirmed-despite-lost-response', { keyId: confirmed.keyId });
        markLocalKeyRegistered(namespace, publicKeyRaw, confirmed.keyId);
        return { ok: true, status: 201, key: confirmed, publicKeyRaw };
      }
      logStage('submitRegistration:not-found-on-server');
    }

    return { ok: false, status: res.status, error: res.json?.error, key: res.json?.key, publicKeyRaw };
  }

  async function findRegisteredKeyByPublicKey(publicKeyRaw: string): Promise<ServerKeychainKeyRecord | null> {
    const expectedPem = await publicKeyRawToPem(publicKeyRaw);
    const { json } = await get(`/api/v1/keychain/keys?namespace=${encodeURIComponent(namespace)}`);
    const records = (json?.keys ?? []) as ServerKeychainKeyRecord[];
    return records.find((r) => r.publicKey === expectedPem) ?? null;
  }

  /** Generates a brand-new local key, stores it encrypted immediately,
   *  then attempts registration. `actingKeyId` null means "authorize via
   *  the root/claim key" (only valid while the keychain is still empty —
   *  the server enforces that, not this client). */
  async function generateAndRegisterKey(opts: {
    label: string;
    admin: boolean;
    passphrase: string;
    actingKeyId?: string | null;
  }): Promise<RegisterOutcome> {
    logStage('generateAndRegisterKey:start', { label: opts.label, admin: opts.admin, actingKeyId: opts.actingKeyId ?? '(root)' });
    const { publicKeyRaw } = await generateAndStoreLocalKey(namespace, {
      label: opts.label,
      requestedAdmin: opts.admin,
      actingKeyId: opts.actingKeyId ?? null,
      passphrase: opts.passphrase,
    });
    logStage('generateAndRegisterKey:generated-local-key');
    return submitRegistration(publicKeyRaw);
  }

  /** Re-attempts registration for a key that's already been generated
   *  and stored locally (a prior attempt's network/server failure) —
   *  never regenerates the key pair. */
  async function retryRegistration(publicKeyRaw: string): Promise<RegisterOutcome> {
    logStage('retryRegistration:start');
    return submitRegistration(publicKeyRaw);
  }

  async function unlockKey(keyId: string, passphrase: string): Promise<boolean> {
    const local = findLocalEntryByRegisteredKeyId(namespace, keyId);
    if (!local) return false;
    return unlockLocalKey(namespace, local.publicKeyRaw, passphrase);
  }

  function lockKey(keyId: string): void {
    const local = findLocalEntryByRegisteredKeyId(namespace, keyId);
    if (local) lockLocalKey(namespace, local.publicKeyRaw);
  }

  // Deliberately no permission argument -- the keychain only checks that
  // this key is active and that the signature verifies. Whether whatever
  // system consumes the resulting signature (netget, or anything else)
  // trusts it for something specific is that system's own decision.
  async function signOperation(keyId: string, payload: unknown = null): Promise<KeychainOperationOutcome & { opId?: string }> {
    const nonce = randomNonce();
    const timestamp = Date.now();
    const signedFields = { op: 'keychain-sign', namespace, keyId, payload, nonce, timestamp };
    let signature: string;
    try {
      signature = await signAsRegisteredKey(keyId, normalizeProofMessage(signedFields));
    } catch (err) {
      return { ok: false, status: 0, error: err instanceof Error ? err.message : 'SIGN_FAILED' };
    }
    const res = await post(`/api/v1/keychain/keys/${keyId}/sign`, { namespace, payload, nonce, timestamp, signature });
    return { ok: res.status === 200, status: res.status, error: res.json?.error, opId: res.json?.opId };
  }

  async function revokeKey(actingKeyId: string, targetKeyId: string): Promise<KeychainOperationOutcome> {
    const nonce = randomNonce();
    const timestamp = Date.now();
    const signedFields = { op: 'keychain-revoke', namespace, actingKeyId, targetKeyId, nonce, timestamp };
    let signature: string;
    try {
      signature = await signAsRegisteredKey(actingKeyId, normalizeProofMessage(signedFields));
    } catch (err) {
      return { ok: false, status: 0, error: err instanceof Error ? err.message : 'SIGN_FAILED' };
    }
    const res = await post(`/api/v1/keychain/keys/${targetKeyId}/revoke`, { namespace, actingKeyId, nonce, timestamp, signature });
    return { ok: res.status === 200, status: res.status, error: res.json?.error };
  }

  /** A deliberately separate action from generateAndRegisterKey(): always
   *  root-signed, and — as the server enforces — a full reset. Every
   *  currently-active key is revoked; exactly this one new key becomes
   *  active. Never call this expecting it to "add a key alongside" the
   *  ones that already exist. */
  async function recoverKeychain(opts: { label: string; passphrase: string }): Promise<RegisterOutcome> {
    const { publicKeyRaw } = await generateAndStoreLocalKey(namespace, {
      label: opts.label,
      requestedAdmin: true, // the server always grants the recovery key admin
      actingKeyId: null,
      passphrase: opts.passphrase,
    });

    const nonce = randomNonce();
    const timestamp = Date.now();
    const newKey = { publicKey: publicKeyRaw, label: opts.label };
    const signedFields = { op: 'keychain-recovery', namespace, identityHash: rootSigner.identityHash, newKey, nonce, timestamp };
    const signature = await rootSigner.signPayload(normalizeProofMessage(signedFields));

    const res = await post('/api/v1/keychain/recover', {
      namespace, identityHash: rootSigner.identityHash, newKey, nonce, timestamp, signature,
    });
    if (res.status === 201 && res.json?.key?.keyId) {
      markLocalKeyRegistered(namespace, publicKeyRaw, res.json.key.keyId);
    }
    return { ok: res.status === 201, status: res.status, error: res.json?.error, key: res.json?.key, publicKeyRaw };
  }

  // Local-only signing, portable across origins on purpose: unlike
  // signOperation() (which POSTs straight to this keychain's own /sign
  // endpoint and only ever returns an opId), this returns the raw
  // signature and does NOT touch the network. A caller that needs to hand
  // a signed proof to some OTHER system for independent verification
  // (netget's gateway claim, or anything else) needs exactly this — the
  // signature, not this keychain's own audit trail. Still never touches
  // or exposes the private key itself; still requires the key to already
  // be unlocked on THIS device (throws LOCAL_KEY_LOCKED otherwise, same
  // as signOperation's internal use of the same primitive).
  async function signWithKeychainKey(keyId: string, message: string): Promise<string> {
    return signAsRegisteredKey(keyId, message);
  }

  return {
    listKeys,
    listPendingLocalRegistrations,
    generateAndRegisterKey,
    retryRegistration,
    unlockKey,
    lockKey,
    signOperation,
    signWithKeychainKey,
    revokeKey,
    recoverKeychain,
  };
}

export type KeychainClient = ReturnType<typeof createKeychainClient>;
