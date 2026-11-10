// Local door for Getting Started / Namespace: this Storybook page is the namespace
// (case 1). It answers its own /gateway-identity, /__surface, claim and sign-in
// so login stays here instead of being sent to cleaker.me, which refuses this origin.
import type { ConnectionSeams } from '@/gui/All.This/Cleaker/useQRConnect';

const STORE = 'gui:demo-namespace:claims';

function readClaims(): Record<string, string> {
  try {
    if (typeof sessionStorage === 'undefined') return {};
    const raw = sessionStorage.getItem(STORE);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeClaims(claims: Record<string, string>) {
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.setItem(STORE, JSON.stringify(claims));
}

function urlOf(input: RequestInfo | URL): string {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.href;
  return String((input as Request).url || '');
}

async function bodyOf(input: RequestInfo | URL, init?: RequestInit): Promise<any> {
  const raw = init?.body;
  if (typeof raw === 'string') {
    try { return JSON.parse(raw); } catch { return null; }
  }
  if (typeof input !== 'string' && !(input instanceof URL) && typeof (input as Request).clone === 'function') {
    try { return await (input as Request).clone().json(); } catch { return null; }
  }
  return null;
}

function proofHash(body: any): string {
  const proof = body?.proof;
  return String(proof?.identityHash || proof?.identity?.hash || '').trim();
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

const DEMO_HOST = typeof window !== 'undefined' ? window.location.hostname : 'localhost';

export const demoNamespaceFetch: typeof fetch = async (input, init) => {
  const url = urlOf(input);
  const method = String(init?.method || (typeof input !== 'string' && !(input instanceof URL) ? (input as Request).method : 'GET') || 'GET').toUpperCase();

  if (/\/gateway-identity(\?|$)/.test(url)) {
    return json({ gatewayId: 'gui-demo', bootstrapped: true });
  }

  if (/\/__surface(\?|$)/.test(url)) {
    return json({
      monadId: 'gui-demo',
      namespace: DEMO_HOST,
      surfaceEntry: { monadId: 'gui-demo', resources: ['claims'] },
      target: { namespace: { me: DEMO_HOST } },
    });
  }

  if (method === 'POST' && /\/claims\/signIn(\?|$)/.test(url)) {
    const body = await bodyOf(input, init);
    const namespace = String(body?.namespace || '').trim();
    const hash = proofHash(body);
    if (!namespace || !hash) return json({ ok: false, error: 'INVALID_CLAIM' });
    const claims = readClaims();
    const stored = claims[namespace];
    if (!stored) return json({ ok: false, error: 'CLAIM_NOT_FOUND' });
    if (stored !== hash) return json({ ok: false, error: 'IDENTITY_MISMATCH' });
    return json({ ok: true, namespace, identityHash: hash, openedAt: Date.now(), memories: [] });
  }

  if (method === 'POST' && (/\/me\/kernel:claim\//.test(url) || /\/me\/kernel%3Aclaim\//.test(url))) {
    const body = await bodyOf(input, init);
    const namespace = String(body?.namespace || '').trim();
    const hash = proofHash(body);
    if (!namespace || !hash) return json({ ok: false, error: 'INVALID_CLAIM' });
    const claims = readClaims();
    if (claims[namespace] && claims[namespace] !== hash) {
      return json({ ok: false, error: 'IDENTITY_MISMATCH' });
    }
    claims[namespace] = hash;
    writeClaims(claims);
    return json({ ok: true, namespace, identityHash: hash, createdAt: Date.now() });
  }

  if (method === 'POST') {
    const body = await bodyOf(input, init);
    const operation = String(body?.operation || '').trim();
    if (operation === 'open' || operation === 'signIn') {
      return demoNamespaceFetch(new URL('/claims/signIn', url).href, { ...init, method: 'POST', body: JSON.stringify(body) });
    }
    if (operation === 'claim') {
      return demoNamespaceFetch(new URL(`/me/kernel:claim/${encodeURIComponent(String(body?.namespace || ''))}`, url).href, {
        ...init,
        method: 'POST',
        body: JSON.stringify(body),
      });
    }
  }

  return fetch(input, init);
};

export const demoNamespaceSeams: ConnectionSeams = { fetchImpl: demoNamespaceFetch };
