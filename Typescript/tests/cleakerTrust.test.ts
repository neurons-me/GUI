// The identity agent's creation link (src/agent/cleakerTrust.ts): the URL is only TRANSPORT; the AUDIENCE comes from the
// cleaker's own trusted configuration. A link cannot choose, add or override the audience.
import assert from 'node:assert/strict';
import { BUILTIN_TRUST, CLEAKER_TRUST_PATH, loadTrust, parseTrust, resolveCreateLink } from '../src/agent/cleakerTrust';

let n = 0;
const ok = (c: unknown, m: string) => { assert.ok(c, m); n += 1; };
const q = (s: string) => new URLSearchParams(s);
const TRUST = [
  { audience: 'https://cleaker.me', transports: ['https://cleaker.me', 'http://127.0.0.1:7999'] },
  { audience: 'https://gateway.example', transports: ['http://127.0.0.1:8100'] },
];

// 1. the configured audience, from the transport
let r = resolveCreateLink(q('create=http://127.0.0.1:7999&ns=cleaker.me'), TRUST);
ok(r.ok && r.audience === 'https://cleaker.me' && r.transport === 'http://127.0.0.1:7999' && r.namespace === 'cleaker.me', 'T1 transport -> its configured audience');
r = resolveCreateLink(q('create=http://127.0.0.1:8100&ns=gw.test'), TRUST);
ok(r.ok && r.audience === 'https://gateway.example', 'T2 second entry');
r = resolveCreateLink(q('create=https://cleaker.me&ns=cleaker.me'), BUILTIN_TRUST);
ok(r.ok && r.audience === 'https://cleaker.me', 'T3 built-in: cleaker.me registers with itself');

// 2. hostile links: the URL tries to set or change the audience
for (const s of [
  'create=http://127.0.0.1:7999&ns=cleaker.me&audience=https://evil.example',
  'audience=https://evil.example&create=http://127.0.0.1:7999&ns=cleaker.me',
  'create=http://127.0.0.1:7999&ns=cleaker.me&aud=https://evil.example',
  'create=http://127.0.0.1:7999&ns=cleaker.me&resource=https://evil.example',
  'create=http://127.0.0.1:7999&create=https://evil.example&ns=cleaker.me',
  'create=http://127.0.0.1:7999&ns=cleaker.me&ns=evil.example',
]) {
  const h = resolveCreateLink(q(s), TRUST);
  ok(!h.ok, `T4 refused: ${s}`);
}
// an untrusted transport (an attacker's server) is refused, even naming a trusted audience as the transport's path
for (const s of ['create=https://evil.example&ns=cleaker.me', 'create=https://evil.example/https://cleaker.me&ns=cleaker.me', 'create=http://127.0.0.1:7998&ns=cleaker.me']) {
  ok(!resolveCreateLink(q(s), TRUST).ok, `T5 untrusted transport refused: ${s}`);
}
// the audience is never taken from the transport: a transport that IS an audience elsewhere maps only to its own entry
r = resolveCreateLink(q('create=https://cleaker.me&ns=x.test'), TRUST);
ok(r.ok && r.audience === 'https://cleaker.me', 'T6 audience is the configured one');
// malformed
for (const s of ['create=&ns=cleaker.me', 'create=http://127.0.0.1:7999', 'create=http://127.0.0.1:7999&ns=', 'create=http://127.0.0.1:7999&ns=Bad_NS', 'create=javascript:alert(1)&ns=a.b']) {
  ok(!resolveCreateLink(q(s), TRUST).ok, `T7 malformed refused: ${s}`);
}
// ambiguous: one transport listed for two audiences
ok(!resolveCreateLink(q('create=http://127.0.0.1:1&ns=a.b'), [
  { audience: 'https://a.example', transports: ['http://127.0.0.1:1'] }, { audience: 'https://b.example', transports: ['http://127.0.0.1:1'] },
]).ok, 'T8 ambiguous transport refused');
// nothing trusted -> nothing
ok(!resolveCreateLink(q('create=https://cleaker.me&ns=cleaker.me'), []).ok, 'T9 empty trust refuses all');

// 3. parseTrust: strict
ok(parseTrust(TRUST)?.length === 2, 'P1 valid');
for (const bad of [null, {}, [], [{ audience: 'https://a.example' }], [{ audience: 'nope', transports: ['https://a.example'] }],
  [{ audience: 'https://a.example', transports: [] }], [{ audience: 'https://a.example', transports: ['https://a.example/path'] }],
  [{ audience: 'https://a.example', transports: ['https://a.example'], extra: 1 }]]) {
  ok(parseTrust(bad) === null, `P2 invalid refused: ${JSON.stringify(bad)}`);
}

// 4. loadTrust: same-origin path; 404 -> built-in; broken -> nothing (fail closed)
const fake = (status: number, body: string, seen: string[] = []) => (async (url: any) => { seen.push(String(url)); return new Response(body, { status }); }) as typeof fetch;
const seen: string[] = [];
ok((await loadTrust(fake(200, JSON.stringify(TRUST), seen))).length === 2 && seen[0] === CLEAKER_TRUST_PATH, 'L1 reads its own /cleaker-trust.json');
ok((await loadTrust(fake(404, ''))) === BUILTIN_TRUST, 'L2 missing -> built-in');
ok((await loadTrust(fake(200, 'not json'))).length === 0, 'L3 invalid JSON -> nothing trusted');
ok((await loadTrust(fake(200, '[{"audience":"x"}]'))).length === 0, 'L4 invalid config -> nothing trusted');
ok((await loadTrust(fake(500, ''))).length === 0, 'L5 server error -> nothing trusted');
ok((await loadTrust((async () => { throw new Error('net'); }) as any)).length === 0, 'L6 network error -> nothing trusted');

console.log(`cleakerTrust: ${n} checks ok`);
