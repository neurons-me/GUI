// mainServerPresentation.ts -- what the main-server screen says about the facts it was given, and what it must NOT infer.
//
// Three names that are not the same thing, kept apart on the screen too:
//   gatewayId  the gateway's stable identity (what the claim is bound to)
//   hostname   the machine's own name, which can change
//   the domains it is reached through (Entrypoints, the main-server name)
// and two absences that are not what they were being read as:
//   an IP that is not CONFIGURED does not show the gateway is local-only (it may sit behind NAT; nothing here detects it)
//   an /entrypoints that did not answer is not an empty list
//   an /openresty-status that did not answer (401, 404, timeout, not JSON) is not "the port is not listening"
//   an /openresty-status REFUSED to this caller (401/403: it is the operator's route) is "not shown on this door" --
//     a fact about who is asking, not a port that is down, and not the same words as a request that failed

/** The machine's name from the identity payload; '' when the gateway did not say (an older one) -- never the gatewayId. */
export function hostnameOf(identity: { hostname?: unknown } | null | undefined): string {
  const value = typeof identity?.hostname === 'string' ? identity.hostname.trim() : '';
  return value.toLowerCase();
}

/** The gateway's stable id from the identity payload, unmodified in case (it is an identifier, not a name). */
export function gatewayIdOf(identity: { gatewayId?: unknown } | null | undefined): string {
  return typeof identity?.gatewayId === 'string' ? identity.gatewayId.trim() : '';
}

export type PublicIPDetectionView = {
  state?: 'detected' | 'pending' | 'failed' | string;
  observedAt?: string | null;
  checkedAt?: string | null;
  error?: string | null;
} | null | undefined;

export type PublicIPView = { text: string; configured: boolean };

/**
 * What to show for the public address. The gateway stores the address it last OBSERVED and says when and whether the
 * latest check worked (`detection`); with that record the words are exactly what is known:
 *   the address alone                     a check succeeded
 *   last known ...; the latest check failed   the value is older than the last attempt, and why
 *   not detected yet / the check failed       nothing was ever observed
 * Without a record (an older gateway) the earlier wording stays: an empty value is "not configured". Neither says the
 * gateway is reachable from the internet: an address having been observed proves nothing about what answers on it.
 */
export function describePublicIP(publicIP: string | null | undefined, detection?: PublicIPDetectionView): PublicIPView {
  const value = String(publicIP ?? '').trim();
  const day = (iso?: string | null) => (iso ? String(iso).slice(0, 10) : '');
  if (!detection || (detection.state !== 'detected' && detection.state !== 'failed' && detection.state !== 'pending')) {
    return value ? { text: value, configured: true } : { text: 'not configured', configured: false };
  }
  // A successful check is the ordinary case: the address, nothing around it. The qualifiers below appear only when
  // the value is old or missing, which is when they say something.
  if (value && detection.state === 'detected') return { text: value, configured: true };
  if (value && detection.state === 'failed') {
    return { text: `${value} · last known${detection.observedAt ? `, observed ${day(detection.observedAt)}` : ''}; the latest check failed${detection.error ? `: ${detection.error}` : ''}`, configured: true };
  }
  if (value) return { text: value, configured: true };
  if (detection.state === 'failed') return { text: `not detected · the check failed${detection.error ? `: ${detection.error}` : ''}`, configured: false };
  return { text: 'not detected yet', configured: false };
}

export type EntrypointsView =
  | { kind: 'unavailable' }
  | { kind: 'empty' }
  | { kind: 'list'; rows: string[] };

/** `response` is the parsed /entrypoints body, or null when the request failed or was not JSON (a 404, a refusal, no answer). */
export function describeEntrypoints(response: { entrypoints?: unknown } | null | undefined): EntrypointsView {
  if (!response || typeof response !== 'object' || !Array.isArray(response.entrypoints)) return { kind: 'unavailable' };
  const rows = response.entrypoints
    .map((e) => (e && typeof e === 'object' ? String((e as { host?: unknown }).host ?? '').trim() : ''))
    .filter(Boolean);
  return rows.length === 0 ? { kind: 'empty' } : { kind: 'list', rows };
}

export type PortView = 'listening' | 'not-listening' | 'restricted' | 'unavailable';

/**
 * Whether a port is listening, from the parsed /openresty-status body. `response` is null when the request failed or was
 * not JSON (a 401 -- the route is for the gateway's operator --, a 404, a refusal, no answer): then nothing was learned
 * about the port, which is 'unavailable', never 'not-listening'. Only an explicit boolean says anything about the port.
 * A 401/403 is 'restricted': the answer exists but is not given to this caller.
 */
export function describePort(
  response: Record<string, unknown> | null | undefined,
  key: 'httpListening' | 'httpsListening',
  status?: number,
): PortView {
  // `status` is the HTTP status of that request, when known: a refusal says the route is not for this caller.
  if (status === 401 || status === 403) return 'restricted';
  if (!response || typeof response !== 'object' || response.ok === false) return 'unavailable';
  const value = response[key];
  if (typeof value !== 'boolean') return 'unavailable';
  return value ? 'listening' : 'not-listening';
}

/** A name that only means something on one machine's own mesh (`localhost`, `local.cleaker`): never a public name. */
export function isLocalMeshValue(value: string): boolean {
  const v = String(value ?? '').trim().toLowerCase();
  return v === 'localhost' || v === '127.0.0.1' || v === 'local' || v.startsWith('local.');
}

export type DoorView = { door: string | null; namespace: string | null };

/**
 * The public name this main server answers at (`netget.site`) and the namespace that name points to (`cleaker.me`).
 * Two facts shown as one line ("door -> namespace"); neither is derived from the other, and a local mesh name is not a
 * public door.
 */
export function describeDoor(mainServerName: unknown, namespace: unknown): DoorView {
  const name = typeof mainServerName === 'string' ? mainServerName.trim() : '';
  const ns = typeof namespace === 'string' ? namespace.trim() : '';
  return { door: name && !isLocalMeshValue(name) ? name : null, namespace: ns || null };
}

/** Where the admin session the operator signed in with is kept (the same key LogsView and the Domains page use). */
export const ADMIN_SESSION_STORAGE_KEY = 'netget:admin-session-token';

/** The stored admin session token, or null: no storage, a storage that throws (private mode), or nothing stored. */
export function readAdminSessionToken(storage?: { getItem(key: string): string | null } | null): string | null {
  try {
    const found = storage ?? (typeof window !== 'undefined' ? window.localStorage : null);
    const value = found?.getItem(ADMIN_SESSION_STORAGE_KEY);
    return value ? String(value) : null;
  } catch {
    return null;
  }
}

/**
 * Whether to show the operator's part of the screen (OpenResty, the machine's own name, how the address was
 * detected). It needs BOTH a stored session and a status route that did not refuse it: a stale token that the gateway
 * rejects is a visitor, not an operator.
 */
export function isOperatorView(token: string | null | undefined, port: PortView): boolean {
  return Boolean(token) && port !== 'restricted';
}

/** One line about the claim from what the identity payload says, or null when there is nothing to add. */
export function describeClaim(identity: { bootstrapped?: unknown; adminCount?: unknown; updatedAt?: unknown } | null | undefined): string | null {
  if (!identity || identity.bootstrapped !== true) return null;
  const parts = ['claimed'];
  const admins = Number(identity.adminCount);
  if (Number.isInteger(admins) && admins >= 0) parts.push(`${admins} admin${admins === 1 ? '' : 's'}`);
  const at = Number(identity.updatedAt);
  const when = Number.isFinite(at) && at > 0 ? new Date(at) : null;
  if (when && !Number.isNaN(when.getTime())) parts.push(`updated ${when.toISOString().slice(0, 10)}`);
  return parts.join(' · ');
}
