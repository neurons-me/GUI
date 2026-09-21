import * as React from 'react';
import { probeMonadSurface } from '@/runtime/monads';

export type CleakerRootSeed = {
  /** The namespace being read (`acme.test`): a name, never a destination. */
  label: string;
  /** Where its reads are sent: the transport that carries them, chosen separately from the name. */
  cleakerEndpoint: string;
  /**
   * When set, the transport is only accepted if what it answers at /__surface names exactly this
   * namespace. Set when the transport is this page's own origin at a door of the namespace (www.<ns>,
   * <handle>.<ns>): the same monad serves every door, but the namespace a REQUEST resolves to follows the
   * door it came through (www.<ns> is <ns>; <handle>.<ns> is the handle's own), so that has to be checked
   * against the answer, not assumed from the name.
   */
  expectNamespace?: string;
};
export type CleakerRootStatus = 'checking' | 'confirmed' | 'error';

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const base64 = String(pem || '')
    .replace(/-----BEGIN [^-]+-----/, '')
    .replace(/-----END [^-]+-----/, '')
    .replace(/\s+/g, '');
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

function base64UrlToArrayBuffer(value: string): ArrayBuffer {
  const padded = String(value || '').replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(padded + '='.repeat((4 - (padded.length % 4)) % 4));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

/**
 * 'absent' -- no self-signed claim in the payload at all (a real, honest
 * possibility for a minimal Monad, not a failure). 'valid' -- the claim
 * verifies against itself (still NOT proof of authority over the
 * namespace -- see checkMonadSurfaceClaim's own doc comment). 'invalid'
 * -- a signature WAS present and failed to verify: a materially different,
 * worse signal than 'absent' (corruption or a spoofing attempt, not mere
 * minimalism) and must never be quietly downgraded to "compatible, use
 * it" the way 'absent' is.
 */
export type SignatureCheck = 'absent' | 'valid' | 'invalid';

/** Who answered: the monad's own id/name straight out of its /__surface
 * payload -- never inferred client-side. */
export type ProbedMonad = { id: string; name: string | null };

/**
 * Does what a transport answered ("this is the namespace your request resolved to") name the namespace
 * that was asked for? Exact, case-insensitive. A transport that did not say is not confirmed.
 */
export function namespaceIsServed(answered: string | null | undefined, expected: string): boolean {
  const a = String(answered ?? '').trim().toLowerCase().replace(/\.$/, '');
  const e = String(expected ?? '').trim().toLowerCase().replace(/\.$/, '');
  return !!a && !!e && a === e;
}

/**
 * Which transport carries the reads for `label`. The name never becomes an address by itself: when this page
 * is loaded from a door of the namespace -- the namespace's own host, `www.<ns>`, or `<handle>.<ns>` -- the
 * transport is the page's own origin (same origin: no cross-origin hop, and the monad that served this
 * page is the one that answers), and at a door other than the namespace's own host that choice is
 * verified against the answer (`expectNamespace`). Anywhere else (a page that is not a door of the
 * namespace) the address the caller supplied stays as it was.
 */
export function pickRootTransport(input: {
  label: string;
  resolvedEndpoint: string;
  page: { origin: string; hostname: string } | null;
}): CleakerRootSeed {
  const label = String(input.label || '').trim();
  const ns = label.toLowerCase();
  const page = input.page;
  if (page && ns) {
    const host = String(page.hostname || '').trim().toLowerCase();
    if (host === ns) return { label, cleakerEndpoint: page.origin };
    if (host.endsWith(`.${ns}`)) return { label, cleakerEndpoint: page.origin, expectNamespace: ns };
  }
  return { label, cleakerEndpoint: input.resolvedEndpoint };
}

export type CleakerRootCheck = {
  /** Required fields (a real monad id, a non-empty capability/resource
   * list) are present -- a real bar past "any JSON object," but nothing
   * more. */
  compatible: boolean;
  signature: SignatureCheck;
  monad?: ProbedMonad;
  /** The namespace this transport says the request resolved to (payload.target.namespace.me), if it said. */
  namespace?: string | null;
};

/**
 * A valid JSON response at /__surface isn't proof it came from a real
 * Monad -- this checks the actual fields/capabilities, and separately
 * whether the payload's own self-signed claim is internally consistent.
 * These are different facts, returned separately on purpose: collapsing
 * them into one "confirmed" boolean overclaims (a valid self-signature is
 * not proof of authority over the namespace -- anyone can generate a
 * fresh keypair and self-sign the same way; real authority would mean
 * cross-checking that key against an independently-held claim record,
 * future work, not attempted here), and collapsing an INVALID signature
 * down to the same "compatible" bucket as no-signature-at-all would hide
 * a materially worse signal (see SignatureCheck's own doc comment). Same
 * Ed25519 primitive this codebase already trusts everywhere else (this.me's
 * verifyEd25519Signature, e.g. modules/monad/Typescript/src/claim/records.ts),
 * just adapted for this payload's PEM/SPKI key shape via WebCrypto's own
 * 'spki' import (no manual DER-stripping needed).
 */
export async function checkMonadSurfaceClaim(rawPayload: unknown): Promise<CleakerRootCheck> {
  const payload = rawPayload as Record<string, any> | null | undefined;
  if (!payload || typeof payload !== 'object') return { compatible: false, signature: 'absent' };

  // Same field priority monadDiscovery.fetch.ts's own normalizeSurfacePayload
  // already uses -- a real /__surface response carries these under
  // surfaceEntry, not always at the top level (confirmed against a live
  // payload: resources lives at surfaceEntry.resources, not payload.resources).
  const surfaceEntry = payload.surfaceEntry || payload.surface || {};
  const monadId = String(payload.monadId || payload.monad?.id || surfaceEntry?.monadId || surfaceEntry?.monad?.id || '').trim();
  const capabilities: unknown[] = [
    ...(Array.isArray(surfaceEntry?.resources) ? surfaceEntry.resources : []),
    ...(Array.isArray(payload.resources) ? payload.resources : []),
    ...(Array.isArray(surfaceEntry?.capabilities) ? surfaceEntry.capabilities : []),
    ...(Array.isArray(payload.capabilities) ? payload.capabilities : []),
  ];
  const compatible = Boolean(monadId) && capabilities.length > 0;
  if (!compatible) return { compatible: false, signature: 'absent' };
  // A real /__surface names the namespace the request resolved to in `target.namespace.me` (the envelope's
  // target); a top-level `namespace` is read too, for payloads that carry it there.
  const answeredNamespace = String(
    payload.target?.namespace?.me
      ?? (typeof payload.namespace === 'string' ? payload.namespace : payload.namespace?.me)
      ?? '',
  ).trim();
  const namespace = answeredNamespace || null;
  const monadName = String(payload.monad?.name || surfaceEntry?.monad?.name || '').trim() || null;
  const monad: ProbedMonad = { id: monadId, name: monadName };

  const claim = payload.cleaker;
  const signature = claim?.signature;
  const publicKeyPem = claim?.publicKey?.key;
  if (!signature?.value || !signature?.message || !publicKeyPem) {
    return { compatible: true, signature: 'absent', monad, namespace };
  }
  if (signature.algorithm && signature.algorithm !== 'ed25519') {
    return { compatible: true, signature: 'invalid', monad, namespace };
  }
  try {
    const key = await crypto.subtle.importKey(
      'spki',
      pemToArrayBuffer(publicKeyPem),
      { name: 'Ed25519' },
      false,
      ['verify'],
    );
    const valid = await crypto.subtle.verify(
      'Ed25519',
      key,
      base64UrlToArrayBuffer(signature.value),
      new TextEncoder().encode(String(signature.message)),
    );
    return { compatible: true, signature: valid ? 'valid' : 'invalid', monad, namespace };
  } catch {
    return { compatible: true, signature: 'invalid', monad, namespace };
  }
}

export type CleakerRootProbeResult = { ok: boolean; via: 'direct' | 'netget' | null; signature: SignatureCheck; monad: ProbedMonad | null; namespace?: string | null };

/**
 * Tries the direct-to-Monad contract first (bare `${cleakerEndpoint}/__surface`
 * -- what a Monad exposed on its own, without a gateway in front, would
 * answer), falling back to the via-Netget shape only if that fails. Never
 * hardcodes `/apps/netget` onto every destination -- a destination that
 * happens to be reachable directly should be provable as such, not forced
 * through a gateway path it may not even have. `ok` requires `compatible`
 * AND `signature !== 'invalid'` -- a present-but-broken signature rejects
 * that path outright (falls through to the other path, or to overall
 * failure) rather than degrading to "compatible, use it anyway."
 */
export async function probeCleakerRoot(
  cleakerEndpoint: string,
  options: { expectNamespace?: string } = {},
): Promise<CleakerRootProbeResult> {
  // When a namespace is expected, a transport that answers for a different one is not this root's transport.
  const answersFor = (check: CleakerRootCheck) => !options.expectNamespace || namespaceIsServed(check.namespace, options.expectNamespace);
  // ...and the question is asked in the request: /__surface?namespace=<ns> names the namespace. A monad that
  // honors it answers for that namespace through any door; one that does not answers for the door's, and is
  // not confirmed above.
  const expected = options.expectNamespace;
  const fetchImpl = expected
    ? ((input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url);
        const named = url.replace(/(\/__surface)(\?.*)?$/, `$1?namespace=${encodeURIComponent(expected)}`);
        return fetch(named, init);
      }) as typeof fetch
    : undefined;
  const direct = await probeMonadSurface({ endpoint: cleakerEndpoint, sources: ['manual'], timeoutMs: 4000, fetchImpl });
  if (direct.monad) {
    const check = await checkMonadSurfaceClaim(direct.endpoint.surface?.raw);
    if (check.compatible && check.signature !== 'invalid' && answersFor(check)) {
      return { ok: true, via: 'direct', signature: check.signature, monad: check.monad ?? null, namespace: check.namespace ?? null };
    }
  }

  const viaNetget = await probeMonadSurface({
    endpoint: `${cleakerEndpoint}/apps/netget`,
    sources: ['manual'],
    timeoutMs: 4000,
    fetchImpl,
  });
  if (viaNetget.monad) {
    const check = await checkMonadSurfaceClaim(viaNetget.endpoint.surface?.raw);
    if (check.compatible && check.signature !== 'invalid' && answersFor(check)) {
      return { ok: true, via: 'netget', signature: check.signature, monad: check.monad ?? null, namespace: check.namespace ?? null };
    }
  }

  return { ok: false, via: null, signature: 'absent', monad: null };
}

export type NetgetGatewayCheck = { available: boolean; gatewayId: string | null };

/**
 * A Monad answering /__surface does NOT mean a Netget gateway is present
 * -- a Monad can run its own local context with no gateway in front of
 * it at all. This is Netget's OWN contract (/gateway-identity, a route
 * that only exists on a real netget backend, never on a bare Monad),
 * checked entirely independently of probeCleakerRoot above -- in THIS
 * deployment the two happen to live at the same origin (confirmed: one
 * Express app mounts both), but that's a fact about this one topology,
 * never assumed as a rule. A 200 with the wrong content-type or a missing
 * gatewayId is treated the same as unreachable, not "close enough."
 */
export async function probeNetgetGateway(cleakerEndpoint: string): Promise<NetgetGatewayCheck> {
  try {
    const res = await fetch(`${cleakerEndpoint.replace(/\/+$/, '')}/gateway-identity`, {
      cache: 'no-store',
      credentials: 'same-origin',
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return { available: false, gatewayId: null };
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) return { available: false, gatewayId: null };
    const body = await res.json().catch(() => null);
    const gatewayId = String(body?.gatewayId || '').trim();
    return gatewayId ? { available: true, gatewayId } : { available: false, gatewayId: null };
  } catch {
    return { available: false, gatewayId: null };
  }
}

export type GenerationGuard = { current: number };

export type GenerationCheckedResult = {
  /** True if a NEWER call against the same guard already started (and
   * possibly already finished) before this one's network work settled --
   * the caller must not apply this result, no matter how "good" it looks,
   * because something more current has already superseded it. */
  stale: boolean;
  result: CleakerRootProbeResult;
  netget: NetgetGatewayCheck;
};

/**
 * The actual race-safety logic useVerifiedCleakerRoot's `promote` runs on
 * every call, pulled out as a plain, directly testable function (no React,
 * no hook) so "a slow response from an old selection can't beat a fast
 * response from a new one" is provable on its own, with a real, timed
 * network race -- not just reasoned about by reading the hook. `guard` is
 * a single mutable counter shared across every call for one logical
 * "which destination is currently active" sequence (the hook keeps one in
 * a ref; a test keeps one in a plain object) -- whoever bumps it last
 * before the others' work finishes wins; the rest resolve with
 * `stale: true` and must be ignored.
 */
export async function verifyCleakerRootGeneration(
  seed: CleakerRootSeed,
  guard: GenerationGuard,
): Promise<GenerationCheckedResult> {
  const generation = ++guard.current;
  const [result, netgetCheck] = await Promise.all([
    probeCleakerRoot(seed.cleakerEndpoint, { expectNamespace: seed.expectNamespace }),
    probeNetgetGateway(seed.cleakerEndpoint),
  ]);
  return { stale: guard.current !== generation, result, netget: netgetCheck };
}

export type VerifiedCleakerRoot = {
  status: CleakerRootStatus;
  /** The Monad-read transport -- `cleakerEndpoint` or `${cleakerEndpoint}/apps/netget`,
   * whichever path actually verified. Feeds useCleakerRootSidebar. */
  transportOrigin: string;
  /** The confirmed root's own bare origin (never with `/apps/netget`
   * appended) -- what a gateway's own backend (GatewaySetup, MainServerView,
   * /gateway-identity) actually needs, since those routes live at the
   * origin's root, not under the Monad's app-proxy path. */
  cleakerEndpoint: string;
  signature: SignatureCheck;
  /** The monad that actually answered this root's /__surface, from its own
   * payload -- null until a probe has confirmed one. */
  monad: ProbedMonad | null;
  /**
   * Netget's own, independently-checked availability for this SAME
   * confirmed namespace -- never inferred from Monad compatibility above.
   * Updates atomically with status/transportOrigin/cleakerEndpoint (all
   * four always describe the one current confirmed namespace, never a
   * mix of an old context's Monad state and a new one's Netget state).
   */
  netget: NetgetGatewayCheck;
  /**
   * Re-verifies `seed` (both the Monad contract and Netget's, in
   * parallel) and, only if the Monad side succeeds, promotes ALL of the
   * above together to the shared confirmed context -- a failed promotion
   * leaves whatever was last confirmed completely untouched, including
   * `netget`. This is how a genuine Beatle "connected" resolution gets to
   * move the SAME context the sidebar and /netget read from, instead of
   * silently drifting apart. Superseded-by-a-newer-call results are
   * discarded on arrival (generation counter), so rapidly switching
   * destinations can't let a slow, stale response win over a faster,
   * newer one.
   */
  promote: (seed: CleakerRootSeed) => void;
};

/**
 * Verification of the namespace/root this page is currently showing --
 * no pill list, no UI of its own. Beatle already owns "let the user
 * explore/switch what the QR points at"; this exists so the sidebar's
 * public-read layer (useCleakerRootSidebar) and the /netget view have a
 * real, verified transport instead of trusting `${cleakerEndpoint}/apps/netget`
 * by construction. Runs once against `initial` on mount; `promote` is the
 * only other way this ever changes -- called when Beatle resolves
 * somewhere new, never automatically. Falls back to the naive
 * `${cleakerEndpoint}/apps/netget` guess (and netget unavailable) while
 * checking or on failure -- the sidebar's own builtin defaults already
 * handle an unreachable/empty root gracefully, so this never blocks
 * rendering.
 */
export function useVerifiedCleakerRoot(initial: CleakerRootSeed): VerifiedCleakerRoot {
  const [status, setStatus] = React.useState<CleakerRootStatus>('checking');
  const [transportOrigin, setTransportOrigin] = React.useState(`${initial.cleakerEndpoint}/apps/netget`);
  const [cleakerEndpoint, setCleakerEndpoint] = React.useState(initial.cleakerEndpoint);
  const [signature, setSignature] = React.useState<SignatureCheck>('absent');
  const [monad, setMonad] = React.useState<ProbedMonad | null>(null);
  const [netget, setNetget] = React.useState<NetgetGatewayCheck>({ available: false, gatewayId: null });
  const guardRef = React.useRef<GenerationGuard>({ current: 0 });
  const everConfirmedRef = React.useRef(false);

  const verify = React.useCallback((seed: CleakerRootSeed) => {
    setStatus('checking');
    verifyCleakerRootGeneration(seed, guardRef.current).then(({ stale, result, netget: netgetCheck }) => {
      if (stale) return; // superseded by a newer promote() -- discard
      if (result.ok) {
        everConfirmedRef.current = true;
        setStatus('confirmed');
        setTransportOrigin(result.via === 'direct' ? seed.cleakerEndpoint : `${seed.cleakerEndpoint}/apps/netget`);
        setCleakerEndpoint(seed.cleakerEndpoint);
        setSignature(result.signature);
        setMonad(result.monad);
        setNetget(netgetCheck);
      } else if (everConfirmedRef.current) {
        // A later promote() that fails must not undo an earlier real
        // confirmation -- transportOrigin/signature/netget already stayed
        // put; status does too, so a bad Beatle destination can't make an
        // already-working context read as broken.
        setStatus('confirmed');
      } else {
        setStatus('error');
      }
    });
  }, []);

  React.useEffect(() => {
    verify(initial);
    // Runs once against the initial seed -- promote() is the only other
    // trigger, called explicitly, never re-derived from `initial` itself.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { status, transportOrigin, cleakerEndpoint, signature, monad, netget, promote: verify };
}
