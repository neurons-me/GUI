// Controlled transports for tests/integration/links.browser.test.mjs.
//
// Each fake monad owns one origin (http://a.test). The test runner routes the browser's network to it, so the REAL
// components make REAL fetches and the runner sees every one: `calls` is the count per transport, `gate()` holds an
// answer until the test lets it go (a late reply), `failing` makes the next answers refuse (a transport that is down).
// It answers only what the components ask: /__surface, /gateway-identity, /claims/signIn and the kernel claim/open commands. It
// is not a monad; it checks nothing a monad would.
const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': '*',
  'access-control-allow-methods': 'GET,POST,OPTIONS',
  'access-control-expose-headers': '*',
};
const json = (status, body) => ({ status, headers: { ...CORS, 'content-type': 'application/json' }, body: JSON.stringify(body) });

export function fakeMonad({ origin, namespace, monadId = `monad-of-${namespace}` }) {
  const url = new URL(origin);
  const state = {
    origin,
    host: url.hostname,
    namespace,
    calls: [],
    failing: false,
    gates: { surface: null, open: null, channel: null },
    /** NRP channel (wss://<host>/nrp): connections opened and expressions asked, as a transport sees them. */
    channels: [],
    opened: [],
    /** Hold the next answers of a kind until `release()` is called. Returns release. */
    gate(kind) {
      let release;
      const promise = new Promise((resolve) => { release = resolve; });
      state.gates[kind] = promise;
      return () => { state.gates[kind] = null; release(); };
    },
    count(pattern) { return state.calls.filter((c) => pattern.test(`${c.method} ${c.path}`)).length; },
    reset() { state.calls.length = 0; state.opened.length = 0; state.channels.length = 0; },
    async handleSocket(ws) {
      const entry = { url: ws.url(), asked: [] };
      state.channels.push(entry);
      ws.onMessage(async (raw) => {
        let msg;
        try { msg = JSON.parse(String(raw)); } catch { return; }
        if (msg.type !== 'nrp.open') return;
        entry.asked.push(msg.expression);
        if (state.failing) return ws.send(JSON.stringify({ type: 'error', payload: 'DOWN', timestamp: Date.now() }));
        const gate = state.gates.channel;
        if (gate) await gate;
        ws.send(JSON.stringify({
          type: 'resolved',
          channelId: `ch-${state.channels.length}`,
          payload: { endpoints: [], audience: 'public', capabilities: [], disclosure: 'public' },
          timestamp: Date.now(),
        }));
      });
    },
    async handle(route) {
      const request = route.request();
      const u = new URL(request.url());
      const method = request.method();
      if (method === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS });
      const call = { method, path: u.pathname + u.search, at: Date.now() };
      state.calls.push(call);
      if (state.failing) return route.fulfill(json(503, { ok: false, error: 'DOWN' }));
      if (/\/__surface$/.test(u.pathname)) {
        const gate = state.gates.surface;
        if (gate) await gate;
        const asked = u.searchParams.get('namespace');
        return route.fulfill(json(200, {
          ok: true,
          monadId,
          monad: { id: monadId, name: `fake-${namespace}` },
          resources: ['kernel:open', 'kernel:claim'],
          target: { namespace: { me: asked || namespace, host: state.host }, operation: 'read', path: '/' },
        }));
      }
      if (/\/gateway-identity$/.test(u.pathname)) return route.fulfill(json(200, { gatewayId: `gw-${namespace}`, bootstrapped: true }));
      if (/\/claims\/signIn$/.test(u.pathname) && method === 'POST') {
        const gate = state.gates.open;
        if (gate) await gate;
        const body = (() => { try { return JSON.parse(request.postData() || '{}'); } catch { return {}; } })();
        const ns = String(body.namespace || '');
        state.opened.push(ns);
        return route.fulfill(json(200, {
          ok: true,
          namespace: ns,
          identityHash: String(body.proof?.identityHash || `hash-${ns}`),
          memories: [],
          openedAt: Date.now(),
          target: { namespace: { me: ns, host: state.host }, operation: 'open', path: '/' },
        }));
      }
      const kernel = u.pathname.match(/\/me\/kernel:(claim|open)\/(.+)$/);
      if (kernel && method === 'POST') {
        const ns = decodeURIComponent(kernel[2]);
        if (kernel[1] === 'open') {
          const gate = state.gates.open;
          if (gate) await gate;
          state.opened.push(ns);
        }
        const target = { namespace: { me: ns, host: state.host }, operation: kernel[1], path: '/' };
        return route.fulfill(json(200, kernel[1] === 'claim'
          ? { ok: true, target, identityHash: `hash-${ns}`, createdAt: Date.now() }
          : { ok: true, target, identityHash: `hash-${ns}`, memories: [], openedAt: Date.now(), verified: true }));
      }
      return route.fulfill(json(404, { ok: false, error: 'NOT_FOUND' }));
    },
  };
  return state;
}

/** Route the browser's requests for each fake monad's host to it. Returns an unroute function. */
export async function routeMonads(context, monads) {
  for (const m of monads) {
    await context.route((u) => u.hostname === m.host, (route) => m.handle(route));
    await context.routeWebSocket((u) => u.hostname === m.host, (ws) => m.handleSocket(ws));
  }
}
