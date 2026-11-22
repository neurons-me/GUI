import assert from 'node:assert/strict';
import { NETGET_ADAPTER as N, POLLS_ADAPTER as P } from '../src/gui/All.This/Cleaker/Keys/appAdapters';
import { checkGrants, checkWire, makeGrant, MAX_GRANT_MS } from '../src/gui/All.This/Cleaker/Keys/appGrants';

let n = 0;
const test = (name: string, fn: () => void) => { fn(); n++; console.log(`PASS ${name}`); };
const T = 1_000_000;
const req = (o: Partial<{ audience: string; resource: string; op: string; path: string }> = {}) =>
  ({ audience: 'netget', resource: 'gw-1', op: 'bootstrap', path: 'keys.netget', ...o });

test('G1 makeGrant refuses never-auto, unknown, empty ops and bad ttl', () => {
  assert.throws(() => makeGrant(N, { resource: 'gw-1', ops: ['transfer'], ttlMs: 60_000, now: T }), /NEVER_AUTO/);
  assert.throws(() => makeGrant(N, { resource: 'gw-1', ops: ['bootstrap', 'transfer'], ttlMs: 60_000, now: T }), /NEVER_AUTO/);
  assert.throws(() => makeGrant(N, { resource: 'gw-1', ops: ['nope'], ttlMs: 60_000, now: T }), /UNKNOWN_OP/);
  assert.throws(() => makeGrant(N, { resource: 'gw-1', ops: [], ttlMs: 60_000, now: T }), /OPS_REQUIRED/);
  assert.throws(() => makeGrant(N, { resource: '', ops: ['bootstrap'], ttlMs: 60_000, now: T }), /RESOURCE_REQUIRED/);
  assert.throws(() => makeGrant(N, { resource: 'gw-1', ops: ['bootstrap'], ttlMs: 0, now: T }), /TTL/);
  assert.throws(() => makeGrant(N, { resource: 'gw-1', ops: ['bootstrap'], ttlMs: MAX_GRANT_MS + 1, now: T }), /TTL/);
  assert.throws(() => makeGrant(P, { resource: 'p', ops: ['delete'], ttlMs: 1000, now: T }), /NEVER_AUTO/);
});

test('G2 an exact grant auto-signs; every field must match', () => {
  const g = makeGrant(N, { resource: 'gw-1', ops: ['bootstrap'], ttlMs: 60_000, now: T });
  assert.equal(g.path, 'keys.netget');
  assert.equal(checkGrants(N, [g], req(), T + 1).auto, true);
  assert.deepEqual(checkGrants(N, [g], req({ resource: 'gw-2' }), T), { auto: false, reason: 'RESOURCE_MISMATCH' });
  assert.deepEqual(checkGrants(N, [g], req({ op: 'grant' }), T), { auto: false, reason: 'OP_NOT_GRANTED' });
  assert.deepEqual(checkGrants(N, [g], req({ path: 'keys.other' }), T), { auto: false, reason: 'PATH_MISMATCH' });
  assert.deepEqual(checkGrants(N, [g], req(), T + 60_000), { auto: false, reason: 'GRANT_EXPIRED' });
  assert.deepEqual(checkGrants(N, [], req(), T), { auto: false, reason: 'NO_GRANT' });
});

test('G3 never-auto ops ask even if a (forged) grant lists them', () => {
  const forged = { audience: 'netget', resource: 'gw-1', ops: ['transfer'], path: 'keys.netget', createdAt: T, expiresAt: T + 1e9 };
  assert.deepEqual(checkGrants(N, [forged], req({ op: 'transfer' }), T), { auto: false, reason: 'NEVER_AUTO' });
});

test('G4 a grant for one app never covers another (audience is part of the scope)', () => {
  const g = makeGrant(N, { resource: 'gw-1', ops: ['bootstrap'], ttlMs: 60_000, now: T });
  assert.deepEqual(checkGrants(P, [g], { audience: 'polls', resource: 'gw-1', op: 'claim', path: 'keys.polls' }, T), { auto: false, reason: 'NO_GRANT' });
  // A request claiming audience netget evaluated with the polls adapter does not match either.
  assert.deepEqual(checkGrants(P, [g], { audience: 'netget', resource: 'gw-1', op: 'claim', path: 'keys.netget' }, T), { auto: false, reason: 'NO_GRANT' });
  const pg = makeGrant(P, { resource: 'poll-1', ops: ['claim', 'publish'], ttlMs: 60_000, now: T });
  assert.equal(checkGrants(P, [g, pg], { audience: 'polls', resource: 'poll-1', op: 'publish', path: 'keys.polls' }, T).auto, true);
});

test('G5 a wire signs its own app and path, never a never-auto op', () => {
  const w = { audience: 'netget', path: 'keys.netget' };
  assert.equal(checkWire(N, w, req()).auto, true);
  assert.deepEqual(checkWire(N, w, req({ op: 'transfer' })), { auto: false, reason: 'NEVER_AUTO' });
  assert.deepEqual(checkWire(N, null, req()), { auto: false, reason: 'NO_GRANT' });
  assert.deepEqual(checkWire(N, w, req({ path: 'keys.x' })), { auto: false, reason: 'PATH_MISMATCH' });
  assert.deepEqual(checkWire(P, w, { audience: 'polls', resource: 'p', op: 'claim', path: 'keys.polls' }), { auto: false, reason: 'NO_GRANT' });
});

console.log(`appGrants.test.ts: ${n} passed`);
