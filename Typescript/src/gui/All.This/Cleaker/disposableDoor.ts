// What is behind the door in the verification stories: the REAL disposable monad answers /__surface, and the gateway's
// backend is a stub that says it is up (those stories verify the identity flow, not netget's gateway). Without it the
// page reads its own door at Storybook's origin, finds nothing behind it and, correctly, does not offer the form.
import type { ConnectionSeams } from './useQRConnect';

export function disposableDoorSeams(monadOrigin: string): ConnectionSeams {
  const fetchImpl: typeof fetch = async (input, init) => {
    const url = String(typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url);
    if (/\/gateway-identity(\?|$)/.test(url)) {
      return new Response(JSON.stringify({ gatewayId: 'verify-disposable', bootstrapped: true }), { status: 200, headers: { 'content-type': 'application/json' } });
    }
    if (/\/__surface(\?|$)/.test(url)) {
      return fetch(`${monadOrigin}/__surface${url.includes('?') ? url.slice(url.indexOf('?')) : ''}`, init);
    }
    return fetch(input, init);
  };
  return { fetchImpl };
}
