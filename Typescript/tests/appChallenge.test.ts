import assert from 'node:assert/strict';
import { NETGET_ADAPTER as N, POLLS_ADAPTER as P } from '../src/gui/All.This/Cleaker/Keys/appAdapters';
import { createMeSigner, createMockApp, createMockAuthority, type ChallengeResponse } from '../src/gui/All.This/Cleaker/Keys/appChallenge';

let n = 0;
const test = async (name: string, fn: () => Promise<void>) => { await fn(); n++; console.log(`PASS ${name}`); };
let now = 1_800_000_000_000;
const clock = () => now;
const NS = 'storybook.demo';

async function setup(adapter = N) {
  const me = await createMeSigner({ namespace: NS, identityHash: 'demo-identity:jabellae' });
  const authority = createMockAuthority(adapter, { clock });
  authority.registerKey(me.identity);
  const app = createMockApp(adapter, { authority, clock });
  return { me, authority, app };
}
async function roundTrip(s: Awaited<ReturnType<typeof setup>>, op: string, extra: { target?: string; resource?: string } = {}) {
  const env = await s.app.issue({ op, resource: extra.resource ?? s.app.adapter.defaultResource, target: extra.target, to: s.me.identity });
  const c = await s.me.open(env);
  const resp = await s.me.sign(env, c, s.app.adapter, clock());
  return { env, c, resp, res: await s.app.receive(resp) };
}
const SECRETLESS = (s: string, banned: string[]) => banned.every((b) => !s.includes(b));

await test('C1 bootstrap: sealed challenge → signature → authority sets owner; app reads it', async () => {
  const s = await setup();
  const { env, c, resp, res } = await roundTrip(s, 'bootstrap');
  assert.equal(res.ok, true);
  assert.equal(s.authority.read('gw-demo-01').record?.owner, 'demo-identity:jabellae');
  assert.equal(s.authority.read('gw-demo-01').path, 'daemon.gateways.gw-demo-01');
  // The plaintext nonce is nowhere on the wire; neither op nor resource leak from the envelope.
  const wire = JSON.stringify([env, resp, res.ok ? res.proof : null]);
  assert.ok(SECRETLESS(wire, [c.nonce]));
  assert.ok(!JSON.stringify(env).includes('bootstrap') && !JSON.stringify(env).includes('gw-demo-01'));
  assert.deepEqual(Object.keys(resp).sort(), ['audience', 'id', 'identityHash', 'keyId', 'kind', 'publicKey', 'signature', 'timestamp']);
});

await test('C2 replay: same response again is refused by the app, and by the authority if sent directly', async () => {
  const s = await setup();
  const { resp, res } = await roundTrip(s, 'bootstrap');
  assert.equal(res.ok, true);
  assert.deepEqual(await s.app.receive(resp), { ok: false, error: 'UNKNOWN_OR_USED_CHALLENGE' });
  if (!res.ok) throw new Error('unreachable');
  assert.deepEqual(await s.authority.submit(res.proof), { ok: false, error: 'REPLAY_REJECTED' });
});

await test('C3 expired: the .me refuses to sign; a late response is refused by the app', async () => {
  const s = await setup();
  const env = await s.app.issue({ op: 'bootstrap', resource: 'gw-x', to: s.me.identity, ttlMs: -1 });
  const c = await s.me.open(env);
  await assert.rejects(s.me.sign(env, c, N, clock()), /CHALLENGE_EXPIRED/);
  const env2 = await s.app.issue({ op: 'bootstrap', resource: 'gw-y', to: s.me.identity, ttlMs: 5_000 });
  const resp = await s.me.sign(env2, await s.me.open(env2), N, clock());
  now += 6_000;
  assert.deepEqual(await s.app.receive(resp), { ok: false, error: 'CHALLENGE_EXPIRED' });
  // Stale proofs straight to the authority fail too.
  const env3 = await s.app.issue({ op: 'bootstrap', resource: 'gw-z', to: s.me.identity, ttlMs: 600_000 });
  const r3 = await s.me.sign(env3, await s.me.open(env3), N, clock());
  now += 130_000;
  const res3 = await s.app.receive(r3);
  assert.deepEqual(res3.ok ? null : res3.error, 'PROOF_STALE');
});

await test('C4 wrong key: a different key claiming the user\u2019s keyId fails PROOF_INVALID; unknown key not found; revoked key refused', async () => {
  const s = await setup();
  const attacker = await createMeSigner({ namespace: NS, identityHash: 'demo-identity:jabellae' });
  const env = await s.app.issue({ op: 'bootstrap', resource: 'gw-w', to: s.me.identity });
  const c = await s.me.open(env); // strongest case: the attacker somehow knows the plaintext
  const forged: ChallengeResponse = { ...(await attacker.sign(env, c, N, clock())), keyId: s.me.identity.keyId, publicKey: s.me.identity.publicKey };
  const r1 = await s.app.receive(forged);
  assert.deepEqual(r1.ok ? null : r1.error, 'PROOF_INVALID');
  const env2 = await s.app.issue({ op: 'bootstrap', resource: 'gw-w', to: s.me.identity });
  const r2 = await s.app.receive(await attacker.sign(env2, await s.me.open(env2), N, clock()));
  assert.deepEqual(r2.ok ? null : r2.error, 'ACTING_KEY_NOT_FOUND');
  // A sealed challenge is noise to anyone else.
  await assert.rejects(attacker.open({ ...env2, to: s.me.identity.identityHash }));
  s.authority.setKeyActive(s.me.identity.keyId, false);
  const r3 = (await roundTrip(s, 'bootstrap', { resource: 'gw-r' })).res;
  assert.deepEqual(r3.ok ? null : r3.error, 'ACTING_KEY_REVOKED');
});

await test('C5 authority: first claim wins; transfer needs the owner; tampered envelope refused', async () => {
  const s = await setup();
  assert.equal((await roundTrip(s, 'bootstrap')).res.ok, true);
  const other = await createMeSigner({ namespace: NS, identityHash: 'demo-identity:ana' });
  s.authority.registerKey(other.identity);
  const env = await s.app.issue({ op: 'bootstrap', resource: 'gw-demo-01', to: other.identity });
  const r = await s.app.receive(await other.sign(env, await other.open(env), N, clock()));
  assert.deepEqual(r.ok ? null : r.error, 'ALREADY_CLAIMED');
  const envT = await s.app.issue({ op: 'transfer', resource: 'gw-demo-01', target: 'demo-identity:ana', to: other.identity });
  const rT = await s.app.receive(await other.sign(envT, await other.open(envT), N, clock()));
  assert.deepEqual(rT.ok ? null : rT.error, 'NOT_AUTHORIZED');
  const okT = await roundTrip(s, 'transfer', { target: 'demo-identity:ana' });
  assert.equal(okT.res.ok, true);
  assert.equal(s.authority.read('gw-demo-01').record?.owner, 'demo-identity:ana');
  const envX = await s.app.issue({ op: 'bootstrap', resource: 'gw-q', to: s.me.identity });
  await assert.rejects(s.me.open({ ...envX, path: 'keys.other' }));
  await assert.rejects(s.me.open({ ...envX, audience: 'polls' }));
});

await test('C6 generic: the same core runs a second app with its own vocabulary and record root', async () => {
  const s = await setup(P);
  const { res } = await roundTrip(s, 'claim');
  assert.equal(res.ok, true);
  assert.equal(s.authority.read('poll-demo-7').path, 'daemon.polls.poll-demo-7');
  assert.equal((await roundTrip(s, 'publish')).res.ok, true);
  // A netget response can't be replayed into polls.
  const n2 = await setup(N);
  const e = await n2.app.issue({ op: 'bootstrap', resource: 'gw-1', to: n2.me.identity });
  const resp = await n2.me.sign(e, await n2.me.open(e), N, clock());
  const cross = await s.app.receive(resp);
  assert.deepEqual(cross.ok ? null : cross.error, 'AUDIENCE_MISMATCH');
});

console.log(`appChallenge.test.ts: ${n} passed`);
