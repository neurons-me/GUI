/**
 * Which roots the browser asks directly.
 *
 * The QR shows the root a person typed. When that root is THIS page's own (or a loopback/`local.*` alias of it)
 * the page's own gateway is the one to ask, and it only makes sense while that door is up. Any other root
 * (`cleaker.me`) is a different host: the browser's own runtime can ask THAT host, `wss://<root>/nrp`, with no
 * dependency on whether the local door is on. This only decides which door a channel is opened through; what the
 * remote answers (and what it discloses) is still its own decision, and nothing here signs or writes anything.
 */
export function isLocalRoot(root: string, context: { localRoot?: string | null; confirmedRoot?: string | null } = {}): boolean {
  const r = String(root ?? '').trim().toLowerCase();
  if (!r) return true;
  const same = (other?: string | null) => !!other && r === String(other).trim().toLowerCase();
  if (same(context.localRoot) || same(context.confirmedRoot)) return true;
  // The names this machine answers to for itself: never a different host, whatever resolves them.
  return r === 'localhost' || r.endsWith('.localhost') || r.startsWith('local.') || r.endsWith('.local');
}

/** The typed root to open directly, or null when the page's own gateway is the right door. */
export function remoteRootFor(
  typedRoot: string | null | undefined,
  context: { localRoot?: string | null; confirmedRoot?: string | null } = {},
): string | null {
  const r = String(typedRoot ?? '').trim().toLowerCase();
  if (!r || isLocalRoot(r, context)) return null;
  // Only a name that can be a host: labels, no scheme, port, path or spaces.
  return /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(r) ? r : null;
}
