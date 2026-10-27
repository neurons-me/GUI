import assert from 'node:assert/strict';
import {
  applyAnswer,
  beginResults,
  capabilityKey,
  declaredCapabilities,
  evaluateRequirement,
  resolveCapabilities,
  statesFor,
  type CapabilityContext,
  type CapabilityResolvers,
} from '../src/runtime/capabilities';
import { flattenGuiDocument, leftBarSlots, type GuiDocument } from '../src/runtime/guiDocument';

// Declarative requirements. A document declares what an app OFFERS; what a person can USE is decided from the context of
// the SELECTED link (its session, its scope) by a resolver the app supplies. The GUI never learns what a capability means:
// the names below are the app's words, opaque here.

// ── evaluating one requirement ───────────────────────────────────────────────────────────────────────────────────────
const none = { authenticated: false, capabilities: {} };
assert.deepEqual(evaluateRequirement(undefined, none), { met: true, pending: false, whenMissing: 'hide' }, 'no requirement: always offered');
assert.equal(evaluateRequirement('session', { authenticated: false }).met, false);
assert.equal(evaluateRequirement('session', { authenticated: true }).met, true);
assert.equal(evaluateRequirement('session', { authenticated: false }).pending, false, 'a session is known at once; there is nothing to wait for');

const need = { capability: 'x:admin' };
assert.deepEqual(evaluateRequirement(need, { authenticated: true, capabilities: { 'x:admin': 'granted' } }), { met: true, pending: false, whenMissing: 'hide' });
assert.deepEqual(evaluateRequirement(need, { authenticated: true, capabilities: { 'x:admin': 'denied' } }), { met: false, pending: false, whenMissing: 'hide' });
assert.deepEqual(evaluateRequirement(need, { authenticated: true, capabilities: {} }), { met: false, pending: true, whenMissing: 'hide' }, 'not resolved yet: not met, and pending');
assert.deepEqual(evaluateRequirement(need, { authenticated: true }), { met: false, pending: true, whenMissing: 'hide' }, 'no resolver output at all: not met');
assert.equal(evaluateRequirement({ capability: 'x:admin', whenMissing: 'disable' }, none).whenMissing, 'disable');
assert.equal(evaluateRequirement({ capability: 'x:admin' }, { authenticated: true, capabilities: { 'x:admin': 'granted' } }).met, true, 'a capability does not need a second, separate session requirement');
assert.equal(evaluateRequirement({ capability: 'x:admin' }, { authenticated: false, capabilities: { 'x:other': 'granted' } }).met, false, 'one capability never satisfies another');

// fail closed: a requirement the GUI does not understand is not met, whatever else is true
for (const garbage of ['sesion', 42, {}, { capability: '' }, { capability: 7 }, [], null]) {
  const v = evaluateRequirement(garbage as any, { authenticated: true, capabilities: { '': 'granted', 7: 'granted' as any } });
  assert.equal(v.met, garbage === null ? true : false, `garbage ${JSON.stringify(garbage)}`);
}

// ── what a document declares ───────────────────────────────────────────────────────────────────────────────────────────
const doc: GuiDocument = {
  GUI: {
    children: {
      bars: {
        children: {
          left: {
            children: {
              open: { label: 'Open', to: '/open', icon: 'a', placement: 'end' },
              signed: { label: 'Signed', to: '/signed', icon: 'b', requires: 'session', placement: 'end' },
              admin: { label: 'Admin', to: '/admin', icon: 'c', requires: { capability: 'x:admin' }, placement: 'end' },
              audit: { label: 'Audit', to: '/audit', icon: 'd', requires: { capability: 'x:audit', whenMissing: 'disable' }, placement: 'end' },
            },
          },
        },
      },
      content: {
        children: {
          admin: { label: 'Admin', component: 'AdminPage', route: '/admin', requires: { capability: 'x:admin' } },
          signed: { label: 'Signed', component: 'SignedPage', route: '/signed', requires: 'session' },
        },
      },
    },
  },
};
assert.deepEqual(declaredCapabilities(flattenGuiDocument(doc)), ['x:admin', 'x:audit'], 'unique, sorted, sessions are not capabilities');
const entry = (id: string) => flattenGuiDocument(doc).find((e) => e.id === id)!;
assert.deepEqual(entry('GUI.bars.left.admin').requires, { capability: 'x:admin' }, 'the requirement survives flattening as declared (plain JSON)');
assert.deepEqual(entry('GUI.content.admin').requires, { capability: 'x:admin' }, 'a page carries the same requirement as its link');
assert.equal(entry('GUI.content.signed').requires, 'session');

// ── the left bar follows the verdicts ────────────────────────────────────────────────────────────────────────────────
const idsOf = (els: any[]) => els.map((e) => e.props.id);
const offOf = (els: any[]) => Object.fromEntries(els.map((e) => [e.props.id, Boolean(e.props.off)]));
const bar = (options?: any) => leftBarSlots(doc, options).end;

assert.deepEqual(idsOf(bar()), ['open', 'audit'], 'no options at all: only what asks for nothing is enabled (fails closed); a part that asked to be disabled is present, disabled');
assert.equal(offOf(bar()).audit, true);
assert.deepEqual(idsOf(bar({ authenticated: true })), ['open', 'signed', 'audit'], 'a session alone never satisfies a capability');
assert.deepEqual(idsOf(bar({ authenticated: true, capabilities: { 'x:admin': 'granted' } })), ['open', 'signed', 'admin', 'audit'], 'granted: offered; a disabled one is present while it is only pending');
assert.deepEqual(offOf(bar({ authenticated: true, capabilities: { 'x:admin': 'granted' } })), { open: false, signed: false, admin: false, audit: true }, 'audit is shown disabled (its capability is not resolved)');
assert.deepEqual(idsOf(bar({ authenticated: true, capabilities: { 'x:admin': 'denied', 'x:audit': 'denied' } })), ['open', 'signed', 'audit'], 'denied + hide = gone; denied + disable = still there, disabled');
assert.deepEqual(offOf(bar({ authenticated: true, capabilities: { 'x:admin': 'denied', 'x:audit': 'denied' } })).audit, true);
assert.deepEqual(offOf(bar({ authenticated: true, capabilities: { 'x:admin': 'granted', 'x:audit': 'granted' } })), { open: false, signed: false, admin: false, audit: false }, 'both granted: nothing disabled');
assert.deepEqual(idsOf(bar({ authenticated: false, capabilities: { 'x:admin': 'granted' } })), ['open', 'admin', 'audit'], 'a granted capability is honoured as the resolver said (the app decides what it needs), "signed" still needs its session, and audit is present but disabled');
// the declared path is the node id, as before
assert.equal(bar({ authenticated: true, capabilities: { 'x:admin': 'granted' } })[2].props['data-gui-node-id'], 'GUI.bars.left.admin');

// ── a key per link, identity and scope ─────────────────────────────────────────────────────────────────────────────────
const linkA = { id: 'acme.test@https://a.test', namespace: 'acme.test', transport: 'https://a.test' };
const linkB = { id: 'acme.test@https://b.test', namespace: 'acme.test', transport: 'https://b.test' };
const ana = { authenticated: true, identityHash: 'ana-hash', me: {} };
const bob = { authenticated: true, identityHash: 'bob-hash', me: {} };
const anon = { authenticated: false, identityHash: null, me: null };
const key = (link: any, session: any, scope = '') => capabilityKey({ link, session, scope });
assert.equal(key(linkA, ana), key(linkA, ana), 'stable');
assert.notEqual(key(linkA, ana), key(linkB, ana), 'another link');
assert.notEqual(key(linkA, ana), key(linkA, bob), 'another identity through the same link');
assert.notEqual(key(linkA, ana), key(linkA, anon), 'signed out');
assert.notEqual(key(linkA, ana, 'one'), key(linkA, ana, 'two'), 'another scope (what the app has selected, e.g. a gateway)');
assert.notEqual(key(null, anon), key(linkA, anon));

// ── results belong to ONE key; a late answer for another key is dropped ─────────────────────────────────────────────────
let results = beginResults(key(linkA, ana));
assert.deepEqual(statesFor(results, key(linkA, ana)), {}, 'nothing known yet: every capability is unknown');
results = applyAnswer(results, key(linkA, ana), 'x:admin', 'granted');
assert.deepEqual(statesFor(results, key(linkA, ana)), { 'x:admin': 'granted' });
assert.deepEqual(statesFor(results, key(linkB, ana)), {}, 'what was learned through A says nothing about B');
const afterSwitch = beginResults(key(linkB, ana));
assert.deepEqual(statesFor(afterSwitch, key(linkB, ana)), {}, 'switching starts empty: A\'s grant does not carry over');
assert.equal(applyAnswer(afterSwitch, key(linkA, ana), 'x:admin', 'granted'), afterSwitch, 'A\'s late answer changes nothing in B');
assert.deepEqual(statesFor(results, key(linkA, bob)), {}, 'nor does it say anything about another identity');

// ── resolving ─────────────────────────────────────────────────────────────────────────────────────────────────────────
const seen: CapabilityContext[] = [];
const resolvers: CapabilityResolvers = {
  'x:admin': (c) => { seen.push(c); return c.session.identityHash === 'ana-hash' && c.link?.id === linkA.id; },
  'x:audit': async (c) => (c.scope === 'local' ? 'granted' : 'denied'),
  'x:boom': () => { throw new Error('unreachable'); },
  'x:weird': () => 'maybe',
};
const run = async (ctxBase: { link: any; session: any; scope: string }, names: string[], signal = new AbortController().signal) => {
  const out: Record<string, string> = {};
  await resolveCapabilities({ names, resolvers, context: { ...ctxBase, signal }, onAnswer: (name, state) => { out[name] = state; } });
  return out;
};
assert.deepEqual(await run({ link: linkA, session: ana, scope: 'local' }, ['x:admin', 'x:audit']), { 'x:admin': 'granted', 'x:audit': 'granted' });
assert.deepEqual(await run({ link: linkB, session: ana, scope: 'local' }, ['x:admin']), { 'x:admin': 'denied' }, 'the same identity through another link is asked again, and answers for that link');
assert.deepEqual(await run({ link: linkA, session: bob, scope: 'local' }, ['x:admin']), { 'x:admin': 'denied' }, 'another identity through the same link: asked again');
assert.deepEqual(await run({ link: linkA, session: ana, scope: 'remote' }, ['x:audit']), { 'x:audit': 'denied' }, 'another scope: asked again');
assert.deepEqual(await run({ link: linkA, session: ana, scope: 'local' }, ['x:boom', 'x:weird', 'x:nobody']), { 'x:boom': 'denied', 'x:weird': 'denied', 'x:nobody': 'denied' }, 'an error, an odd answer and a missing resolver all fail closed');
const ctxSeen = seen[0];
assert.equal(ctxSeen.link?.id, linkA.id);
assert.equal(ctxSeen.session.identityHash, 'ana-hash');
assert.equal(ctxSeen.scope, 'local');
assert.ok(ctxSeen.signal instanceof AbortSignal);

// an aborted resolution reports nothing (its key is gone)
{
  const controller = new AbortController();
  const got: string[] = [];
  const slow: CapabilityResolvers = { 'x:admin': () => new Promise((resolve) => setTimeout(() => resolve(true), 20)) };
  const pending = resolveCapabilities({ names: ['x:admin'], resolvers: slow, context: { link: linkA, session: ana, scope: '', signal: controller.signal }, onAnswer: (n) => got.push(n) });
  controller.abort();
  await pending;
  assert.deepEqual(got, [], 'nothing is reported after the context moved on');
}

// ── switching links with a slow answer in flight: B never inherits A's grant ─────────────────────────────────────────────
{
  let state = beginResults(key(linkA, ana));
  const current = { key: key(linkA, ana) };
  const slowGrant: CapabilityResolvers = { 'x:admin': (c) => new Promise((resolve) => setTimeout(() => resolve(c.link?.id === linkA.id), c.link?.id === linkA.id ? 30 : 0)) };
  const start = (link: any) => {
    const k = key(link, ana);
    const controller = new AbortController();
    return resolveCapabilities({
      names: ['x:admin'], resolvers: slowGrant, context: { link, session: ana, scope: '', signal: controller.signal },
      onAnswer: (name, s) => { state = applyAnswer(state, k, name, s); },
    });
  };
  const forA = start(linkA);                       // slow: will answer granted later
  current.key = key(linkB, ana); state = beginResults(current.key);   // the person selects B meanwhile
  const forB = start(linkB);                       // fast: denied
  await Promise.all([forA, forB]);
  assert.deepEqual(statesFor(state, key(linkB, ana)), { 'x:admin': 'denied' }, 'B is denied; A\'s late grant was dropped');
}

console.log('capabilities: ok');
