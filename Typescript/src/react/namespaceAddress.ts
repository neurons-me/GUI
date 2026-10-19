// Where a namespace is actually reached, with its scheme and port. The namespace itself is a name (`localhost`); the
// address is a place (`http://localhost:6016`). They only look alike when the page happens to be served by the
// namespace's own host, and then the page's own address is the truth about the place: a scheme and a port the name
// cannot carry.
//
//   1. `transport`, when it lives on the namespace's host (netget: the monad is behind /apps/netget on the same host)
//   2. the page's own origin, when the page is served by the namespace's host (Storybook on localhost:6016 for `localhost`)
//   3. the namespace's own address, derived from its name (`cleaker.me` -> https://cleaker.me)
function hostnameOf(address: string): string {
  try {
    return new URL(address).hostname.toLowerCase();
  } catch {
    return '';
  }
}

function originIfOnHost(address: string | null | undefined, host: string): string {
  const raw = String(address || '').trim();
  if (!raw || !host) return '';
  try {
    const url = new URL(raw);
    return url.hostname.toLowerCase() === host ? url.origin : '';
  } catch {
    return '';
  }
}

export function namespaceAddress({
  namespaceOrigin,
  transport,
  pageOrigin,
}: {
  /** The address derived from the namespace's name alone. */
  namespaceOrigin: string;
  transport?: string | null;
  pageOrigin?: string | null;
}): string {
  const host = hostnameOf(namespaceOrigin);
  return originIfOnHost(transport, host) || originIfOnHost(pageOrigin, host) || namespaceOrigin;
}
