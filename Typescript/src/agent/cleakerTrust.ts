// The identity agent's TRUSTED resources: which public audiences it registers identities with, and at which transport
// addresses it may reach each one. PROTOTYPE, agent page only.
//
// The creation link (`/?create=<transport>&ns=<namespace>`, or the `/agent.html` alias) only says WHERE to send the registration. It
// never says who the registration is FOR: that is the audience, and it comes from this configuration -- deployed with
// the agent page itself (same origin, `/cleaker-trust.json`) -- never from the URL. A transport that no trusted audience
// lists is refused, and so is any link carrying more than `create` and `ns` (e.g. an `audience=` an attacker added).
// The audience is the verifying service's public, stable name (e.g. https://cleaker.me); the transport may be a
// loopback or internal address that is never itself an audience.
import { isNamespace, isOrigin } from './protocol';

export type TrustedResource = Readonly<{ audience: string; transports: readonly string[] }>;

/** Where the agent page reads its configuration: its own origin, never a parameter. */
export const CLEAKER_TRUST_PATH = '/cleaker-trust.json';

/** With no configuration deployed: cleaker.me registers with itself, reached at itself. */
export const BUILTIN_TRUST: readonly TrustedResource[] = Object.freeze([
  Object.freeze({ audience: 'https://cleaker.me', transports: Object.freeze(['https://cleaker.me']) }),
]);

const MAX_ENTRIES = 32;

/** Strict: an array of exactly {audience, transports}; origins only. Anything else -> null (nothing is trusted). */
export function parseTrust(raw: unknown): TrustedResource[] | null {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > MAX_ENTRIES) return null;
  const out: TrustedResource[] = [];
  for (const e of raw) {
    if (!e || typeof e !== 'object' || Array.isArray(e)) return null;
    if (Object.keys(e).sort().join(',') !== 'audience,transports') return null;
    const { audience, transports } = e as Record<string, unknown>;
    if (!isOrigin(audience)) return null;
    if (!Array.isArray(transports) || transports.length === 0 || transports.length > MAX_ENTRIES || !transports.every(isOrigin)) return null;
    out.push(Object.freeze({ audience, transports: Object.freeze([...transports]) }));
  }
  return out;
}

/**
 * The configuration deployed with this agent page. Missing (404): the built-in one. Present but unreadable or invalid:
 * nothing is trusted (fail closed) -- a broken deployment must not fall back to something else.
 */
export async function loadTrust(fetchImpl: typeof fetch = fetch): Promise<readonly TrustedResource[]> {
  let res: Response;
  try {
    res = await fetchImpl(CLEAKER_TRUST_PATH, { credentials: 'omit', cache: 'no-store', redirect: 'error' });
  } catch {
    return [];
  }
  if (res.status === 404) return BUILTIN_TRUST;
  if (!res.ok) return [];
  try { return parseTrust(await res.json()) ?? []; } catch { return []; }
}

export type CreateLink =
  | { ok: true; transport: string; audience: string; namespace: string }
  | { ok: false; reason: string };

/** Reads a creation link against the trusted configuration: the URL gives the transport, the configuration the audience. */
export function resolveCreateLink(search: URLSearchParams, trust: readonly TrustedResource[]): CreateLink {
  const keys = [...search.keys()];
  if (keys.length !== 2 || keys.slice().sort().join(',') !== 'create,ns') return { ok: false, reason: 'the link may carry only create and ns' };
  const transport = search.get('create');
  const namespace = search.get('ns');
  if (!isOrigin(transport)) return { ok: false, reason: 'create must be an origin' };
  if (!isNamespace(namespace)) return { ok: false, reason: 'ns is not a valid name' };
  const matches = trust.filter((t) => t.transports.includes(transport));
  if (matches.length === 0) return { ok: false, reason: 'this address is not trusted' };
  if (matches.length > 1) return { ok: false, reason: 'that address is listed for more than one audience' };
  return { ok: true, transport, audience: matches[0].audience, namespace };
}
