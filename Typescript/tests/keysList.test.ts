// keys.list (src/agent/keysList.ts, requestOperation.ts parseKeysGrant): an app gets names/paths/status only -- never
// a value; the words and effects are the agent's; a replaced request invalidates the approval.
import assert from 'node:assert/strict';
import { vaultStore } from './port-namespace/shim';
import { saveServiceKeys, saveCustomKeys, lockServiceKeys } from '../src/gui/All.This/Cleaker/Keys/serviceKeyVault';
import { validateOperation, AGENT_PROTOCOL } from '../src/agent/protocol';
import { ApprovalInvalidated } from '../src/agent/approval';
import { KEYS_LIST_TEXT, approvalForKeys, assertKeysApproval, isKeysListExcluded, isLoginExcluded, listKeysFor, validateKeysListRequest } from '../src/agent/keysList';
import { parseKeysGrant } from '../src/agent/requestOperation';

let n = 0;
const ok = (c: unknown, m: string) => { assert.ok(c, m); n += 1; };
const NS = 'ana.cleaker.me';
const PW = 'a-long-secret-1';
const SECRET = 'sk_live_SUPERSECRET_9f1a2b';
const FIELD_VALUE = 'field-value-NEVER-LISTED';
vaultStore.clear(); lockServiceKeys();

// shape
ok(validateOperation({ action: 'keys.list', namespace: 'cleaker.me' }) === null, 'K1 valid shape');
ok(validateOperation({ action: 'keys.list', namespace: 'cleaker.me', values: true }) !== null, 'K2 extra field refused');
ok(validateOperation({ action: 'keys.list', namespace: 'Bad NS' }) !== null, 'K3 bad namespace refused');
ok(validateOperation({ action: 'keys.list' }) !== null, 'K4 missing namespace refused');

// listing: names only
await saveServiceKeys(NS, 'instagram', { appSecret: SECRET }, PW);
await saveCustomKeys(NS, 'stripe.test', { secretKey: FIELD_VALUE }, PW);
await saveCustomKeys(NS, 'netget', { token: SECRET }, PW);
await saveCustomKeys(NS, 'netget.gw', { token: SECRET }, PW);
lockServiceKeys();
const listing = listKeysFor(NS);
ok(listing.resource === `${NS}.keys`, 'K5 resource is <ns>.keys');
assert.deepEqual(listing.entries, [{ path: 'keys.meta.instagram', status: 'set' }, { path: 'keys.stripe.test', status: 'set' }]); n += 1;
const wire = JSON.stringify(listing);
ok(!wire.includes(SECRET) && !wire.includes(FIELD_VALUE) && !wire.includes('appSecret') && !wire.includes('secretKey'), 'K6 no value and no field name in the listing');
ok(!wire.includes('netget'), 'K7 keys.netget is never listed');
ok(isLoginExcluded('netget') && isLoginExcluded('netget.x') && !isLoginExcluded('netgetx') && !isLoginExcluded('meta.instagram'), 'K8 exclusion is by path segment');

await saveCustomKeys(NS, 'namespace.meta.app', { secret: SECRET }, PW);
await saveCustomKeys(NS, 'namespace.netget', { token: SECRET }, PW);
lockServiceKeys();
const listingNs = listKeysFor(NS);
ok(!JSON.stringify(listingNs).includes('namespace'), 'K21 keys.namespace is never listed to an app');
ok(!JSON.stringify(listingNs).includes(SECRET), 'K22 namespace listing still has no values');
ok(isKeysListExcluded('namespace') && isKeysListExcluded('namespace.meta.app') && isKeysListExcluded('namespace.netget'), 'K23 all keys.namespace paths are list-excluded');
ok(isLoginExcluded('namespace.netget') && !isLoginExcluded('namespace.meta.app'), 'K24 netget stays out of login; meta.app is visible to the root');

// approval bound to the digest; a replacement invalidates it
const v1 = await validateKeysListRequest('req-1', { action: 'keys.list', namespace: 'cleaker.me' }, 'https://app.example');
assert.ok(v1.ok); n += 1;
const a1 = approvalForKeys(v1.validated);
await assertKeysApproval(a1, v1.validated); n += 1;
ok(Object.isFrozen(v1.validated) && Object.isFrozen(v1.validated.operation), 'K9 frozen');
const v2 = await validateKeysListRequest('req-1', { action: 'keys.list', namespace: 'other.me' }, 'https://app.example');
assert.ok(v2.ok);
await assert.rejects(() => assertKeysApproval(a1, v2.validated), ApprovalInvalidated); n += 1;
const v3 = await validateKeysListRequest('req-1', { action: 'keys.list', namespace: 'cleaker.me' }, 'https://evil.example');
assert.ok(v3.ok);
await assert.rejects(() => assertKeysApproval(a1, v3.validated), ApprovalInvalidated); n += 1;   // other origin
const forged = { ...v1.validated, operation: { action: 'keys.list' as const, namespace: 'other.me' } };
await assert.rejects(() => assertKeysApproval(a1, forged), ApprovalInvalidated); n += 1;           // mutated copy, stale digest
ok(!(await validateKeysListRequest('r', { action: 'call' }, 'https://a.example')).ok, 'K10 not keys.list refused');

// the agent's own words; effects computed in the temporary kernel
const { effectsView } = await import('../src/agent/approvalKernel');
const view = effectsView(KEYS_LIST_TEXT.facts('<you>.cleaker.me.keys'), KEYS_LIST_TEXT.rules);
const eff = Object.fromEntries(view.effects.map((e) => [e.name, e.value]));
assert.deepEqual(eff, { namesShared: true, valuesShared: false, leavesDevice: false }); n += 1;
ok(view.effects.find((e) => e.name === 'valuesShared')!.sentence.startsWith('No value is sent'), 'K11 agent words');

// host side: strict parse; anything beyond names/paths/status is refused
const good = { protocol: AGENT_PROTOCOL, type: 'agent.result', id: 'x', ok: true, keys: listing, identity: { namespace: NS, identityHash: 'h', keyId: 'k' } };
const g = parseKeysGrant(good as any);
ok(g && g.keys.entries.length === 2 && g.identity.namespace === NS, 'K12 good answer accepted (rebuilt)');
const bad = (mut: (o: any) => void) => { const o = JSON.parse(JSON.stringify(good)); mut(o); return parseKeysGrant(o); };
ok(bad((o) => { o.keys.entries[0].value = SECRET; }) === null, 'K13 a value in an entry -> refused');
ok(bad((o) => { o.keys.values = { x: SECRET }; }) === null, 'K14 extra field in keys -> refused');
ok(bad((o) => { o.secret = SECRET; }) === null, 'K15 extra top-level field -> refused');
ok(bad((o) => { o.identity.seed = SECRET; }) === null, 'K16 extra identity field -> refused');
ok(bad((o) => { o.keys.entries[0].status = SECRET; }) === null, 'K17 status other than set -> refused');
ok(bad((o) => { o.keys.entries[0].path = 'keys.meta.' + 'x'.repeat(80); }) === null, 'K18 overlong path -> refused');
ok(bad((o) => { o.keys.entries[0].path = 'notkeys.x'; }) === null, 'K19 path outside keys -> refused');
ok(bad((o) => { o.proof = 'p'; }) === null, 'K20 a proof field -> refused');

console.log(`keysList: ${n} checks ok`);
