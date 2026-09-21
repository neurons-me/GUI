// signedRequest — the X-Me-Proof signing protocol, extracted from useCleakerAuth.ts
// so it can be called outside that hook's full login/registration state machine.
// Framework-free on purpose: no React, no refs, no hidden state. Callers own the
// node/hostname and pass them explicitly.
//
// This is the one production implementation of the protocol netget's gateway
// verifies in lua/middleware/me_sig.lua (see modules/netget/Typescript/docs/
// GatewayCapabilityModel.md) — useCleakerAuth.ts's signedFetch is a thin
// React-ref-backed wrapper around the same functions exported here.

import MeKernel from 'this.me';
import cleaker from 'cleaker';
import sha3 from 'js-sha3';

const { keccak256 } = sha3;
const COMPOUND_SEED_DOMAIN = 'me.seed/compound:v1::';

// Canonical JSON (sorted keys) for tamper-proof request fingerprinting.
export function canonicalJson(obj: Record<string, unknown>): string {
  return JSON.stringify(
    Object.fromEntries(Object.entries(obj).sort(([a], [b]) => a.localeCompare(b))),
  );
}

// Random hex nonce — client-generated, marks each request uniquely.
export function genNonce(): string {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
}

// SHA-256 of the exact request body, hex-encoded. Binds the signature to the
// payload, not just method+path — without this, a signed request proves "this
// identity authorized a call to this endpoint right now", not "authorized this
// value". Hashed even for empty bodies (GETs) so the challenge shape is uniform.
export async function sha256Hex(data: string): Promise<string> {
  const bytes = new TextEncoder().encode(data);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Step 1 of the gateway-first flow: the physical hostname IS the namespace —
// not the virtual alias (e.g. "local.netget") a browser might be pointed at.
// Throws with a distinct message per failure mode — "unreachable" and
// "reachable but no hostname" are different operator-facing problems (nginx
// down vs. gateway misconfigured), and collapsing them into one generic
// message sends whoever's debugging it to the wrong place.
export async function fetchGatewayHostname(): Promise<string> {
  const res = await fetch('/me/gateway').catch(() => null);
  if (!res?.ok) throw new Error('Could not reach gateway. Is nginx running?');
  const data = await res.json().catch(() => ({}));
  const hostname = typeof data?.hostname === 'string' ? data.hostname.trim() : '';
  if (!hostname) throw new Error('Gateway did not return a hostname.');
  return hostname;
}

// The identity root a person has explicitly picked when a UI offers a
// choice between reachable roots for the same physical gateway (e.g.
// CleakerLanding's local.cleaker/cleaker.me switch) — read by
// resolveNetgetSeedFromCredentials-style resolvers at claim/open time so the
// namespace actually claimed matches what was shown, instead of always
// falling back to fetchGatewayHostname()'s single physical answer. A
// globalThis-keyed singleton, not a module-scope variable — this.gui ships
// from separate build entries (this.gui, this.gui/react, this.gui/cleaker),
// and each bundled copy of a plain variable would be its own independent
// instance (same failure class launcherPopover.tsx's context duplication
// hit, fixed the same way).
const ACTIVE_NAMESPACE_ROOT_KEY = '__thisGui_activeNamespaceRoot__';

export function setActiveNamespaceRoot(root: string | null): void {
  (globalThis as any)[ACTIVE_NAMESPACE_ROOT_KEY] = root || null;
}

export function getActiveNamespaceRoot(): string | null {
  return (globalThis as any)[ACTIVE_NAMESPACE_ROOT_KEY] || null;
}

// The one formula for "this browser's own guess at a full namespace" --
// every caller that needs it (SeedSessionProvider.tsx's loginWithCleaker/
// registerWithCredentials, and the local identity vault's own save key in
// RegisterMe.tsx/RecoverAccount.tsx) MUST use this exact function, not its
// own inline copy. Root cause of a real, live-confirmed bug otherwise: the
// server can canonicalize a root string differently than this browser
// guessed it (e.g. "localhost" -> this monad's real configured root,
// confirmed live against a disposable monad) -- claimNamespace()/
// openNamespace() on the server already normalize consistently between
// claim and open, so THAT part is never the mismatch. What broke was the
// LOCAL vault's own storage key: RegisterMe.tsx used to save it under the
// server-CONFIRMED semanticNamespace (post-canonicalization), while
// loginWithCleaker looked it up under this same guessed (pre-
// canonicalization) key -- two independently-computed strings that only
// coincidentally matched when no aliasing was in play. Vault miss ->
// silent fallback to a completely different (compound-seed) identity ->
// a real, correct IDENTITY_MISMATCH rejection from the server. Keying the
// vault off THIS guess instead (what it already resolves to on every
// subsequent visit, alias or not) closes that gap without this browser
// ever needing to know how the server's canonicalization works.
export function buildGuessedFullNamespace(username: string, rootNamespace: string): string {
  return splitTypedNamespace(username, rootNamespace).fullNamespace;
}

/**
 * What the person typed, split into the handle and the full namespace it names.
 *
 * - `short`: a handle (`jabellae`). Completed with the monad's own namespace, once (`jabellae.cleaker.me`).
 * - `complete`: already under that namespace (`jabellae.cleaker.me`). Respected as it is; the namespace
 *   is never appended to it again.
 * - `foreign`: a dotted name that is not under that namespace (`jabellae.other.me`), or the namespace
 *   itself. A handle is one DNS label (me-uri's HANDLE_RE), so a dotted name is a full name of some
 *   namespace, and this client cannot open a namespace other than the one it is on until a namespace
 *   can be selected. It is never reinterpreted as a short name: the current namespace is NOT appended
 *   and callers must refuse it (`foreignNamespaceMessage`).
 *
 * A value with `@` (an email used as a username) is left as before, as a short name.
 * This only resolves the typed text. Which namespace is *selected* and kept while navigating is a
 * separate matter, and is not decided here.
 */
export type TypedNamespaceKind = 'short' | 'complete' | 'foreign';

export function splitTypedNamespace(
  typed: string,
  rootNamespace: string,
): { handle: string; fullNamespace: string; kind: TypedNamespaceKind } {
  const text = String(typed || '').trim();
  const root = String(rootNamespace || '').trim();
  const suffix = root ? `.${root.toLowerCase()}` : '';
  if (suffix && text.toLowerCase().endsWith(suffix) && text.length > suffix.length) {
    return { handle: text.slice(0, text.length - suffix.length), fullNamespace: text.toLowerCase(), kind: 'complete' };
  }
  if (root && text.includes('.') && !text.includes('@')) {
    return { handle: text, fullNamespace: text.toLowerCase(), kind: 'foreign' };
  }
  return { handle: text, fullNamespace: `${text.toLowerCase()}.${root}`, kind: 'short' };
}

/** What to tell the person when the typed name is under another namespace. */
export function foreignNamespaceMessage(typed: string, rootNamespace: string): string {
  const root = String(rootNamespace || '').trim();
  return `"${String(typed || '').trim()}" is under a different namespace. This address opens names under ${root}, and choosing another namespace is not available yet. Type your name, or a full name ending in .${root}.`;
}

// Same formula this.me's ME_RESEED uses internally (me/Typescript/src/me.ts,
// deriveCompoundSeed) — exposed here so a caller can derive the identical
// seed WITHOUT going through a .me kernel instance, e.g. to open a real
// monad session (createSeedSession({ seed })) for the same identity
// deriveCleakerNode below signs gateway proofs with. Same identity, two
// consumers — see modules/monad's claim/open vs this file's signedRequest,
// unified under docs/wild-bubbling-lemon plan.
export function deriveCompoundSeed(username: string, secret: string): string {
  return keccak256(COMPOUND_SEED_DOMAIN + username + '::' + secret);
}

// Step 2: seed a .me kernel from username+secret, then bind it to this
// physical gateway via cleaker(me, hostname) — "who am I HERE". Cleaker does
// not add a second cryptographic identity system; it composes the namespace
// this gateway's proof verification is scoped to, then calls .me's own
// prove() with it (see modules/cleaker/Typescript/src/binder.ts,
// proveKernelNamespace). The secret is consumed here and never stored —
// only the derived node (holding the Ed25519 key, not the secret) is returned.
export function deriveCleakerNode(username: string, secret: string, hostname: string): unknown {
  const ME_RESEED = Symbol.for('me.internal.reseed');
  const me = new (MeKernel as any)();
  (me as any)[ME_RESEED](username, secret);
  return cleaker(me as any, hostname);
}

// Same binding as deriveCleakerNode above, but starting from an already-live
// `me` kernel instance (e.g. SeedSession.me from a real monad session)
// instead of re-deriving one from username+secret. Lets a page that already
// holds an open seed session (via this.gui/react's SeedSessionProvider)
// produce the exact same kind of signing node deriveCleakerNode makes,
// without importing `cleaker` itself as a direct dependency — this file is
// the one place that owns the cleaker import.
export function deriveCleakerNodeFromMe(me: unknown, hostname: string): unknown {
  return cleaker(me as any, hostname);
}

// signedFetch's protocol, as a plain function: sign { method, path, bodyHash,
// nonce, timestamp } with the given node's Ed25519 key, attach it as
// X-Me-Proof, send the request. Falls back to plain fetch only if signing
// itself throws (e.g. a stale/invalid node) — never silently proceeds
// unsigned when a node was supplied.
export async function signedRequest(
  node: unknown,
  hostname: string,
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  if (!node || !hostname) return fetch(input, init);

  const method    = (init?.method ?? 'GET').toUpperCase();
  const url       = typeof input === 'string' ? input
                  : input instanceof URL       ? input.pathname
                  : (input as Request).url;
  const path      = new URL(url, window.location.origin).pathname;
  const nonce     = genNonce();
  const timestamp = Date.now();
  const bodyStr   = typeof init?.body === 'string' ? init.body : '';
  const bodyHash  = await sha256Hex(bodyStr);

  const challenge = canonicalJson({ method, path, bodyHash, nonce, timestamp });

  try {
    const proof    = await (node as any).prove({ rootNamespace: hostname, challenge });
    const proofB64 = btoa(JSON.stringify(proof))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

    return fetch(input, {
      ...init,
      headers: {
        ...(init?.headers ?? {}),
        'X-Me-Proof': proofB64,
      },
    });
  } catch {
    // prove() failed (key gone / session ended) → plain fetch, will get 401.
    return fetch(input, init);
  }
}
