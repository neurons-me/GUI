// mainServerPresentation.ts -- what the main-server screen says about the facts it was given, and what it must NOT infer.
//
// Three names that are not the same thing, kept apart on the screen too:
//   gatewayId  the gateway's stable identity (what the claim is bound to)
//   hostname   the machine's own name, which can change
//   the domains it is reached through (Entrypoints, the main-server name)
// and two absences that are not what they were being read as:
//   an IP that is not CONFIGURED does not show the gateway is local-only (it may sit behind NAT; nothing here detects it)
//   an /entrypoints that did not answer is not an empty list

/** The machine's name from the identity payload; '' when the gateway did not say (an older one) -- never the gatewayId. */
export function hostnameOf(identity: { hostname?: unknown } | null | undefined): string {
  const value = typeof identity?.hostname === 'string' ? identity.hostname.trim() : '';
  return value.toLowerCase();
}

/** The gateway's stable id from the identity payload, unmodified in case (it is an identifier, not a name). */
export function gatewayIdOf(identity: { gatewayId?: unknown } | null | undefined): string {
  return typeof identity?.gatewayId === 'string' ? identity.gatewayId.trim() : '';
}

export type PublicIPView = { text: string; configured: boolean };

/** What to show for the public IP. An empty value is "not configured" -- netget stores one, it does not detect one. */
export function describePublicIP(publicIP: string | null | undefined): PublicIPView {
  const value = String(publicIP ?? '').trim();
  return value ? { text: value, configured: true } : { text: 'not configured', configured: false };
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
