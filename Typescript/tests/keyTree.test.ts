import assert from 'node:assert/strict';
import { FIELD_PATHS, allKeyPaths, fieldPath, resolveKeyPath, servicePath } from '../src/gui/All.This/Cleaker/Keys/keyPaths';
import { accessFor, capsOf, childrenAt, templatesAt, trimToExisting, type KeyLeaf } from '../src/gui/All.This/Cleaker/Keys/keyTree';
import { SERVICE_DEFINITIONS } from '../src/gui/All.This/Cleaker/Keys/serviceKeyVault';
import { presetFields, presetsAt } from '../src/gui/All.This/Cleaker/Keys/keyPresets';
import { BRAND_COLORS } from '../src/gui/All.This/Cleaker/Keys/ServiceIcons';

let n = 0;
const test = (name: string, fn: () => void) => { fn(); n++; console.log(`PASS ${name}`); };

test('T1 semantic paths: meta / paypal / dev levels', () => {
  assert.equal(fieldPath('instagram', 'appSecret'), 'keys.meta.instagram.app.secret');
  assert.equal(fieldPath('facebook', 'appId'), 'keys.meta.facebook.app.id');
  assert.equal(fieldPath('threads', 'appId'), 'keys.meta.threads.app.id');
  assert.equal(fieldPath('whatsapp', 'appSecret'), 'keys.meta.whatsapp.app.secret');
  assert.equal(fieldPath('paypal', 'clientId'), 'keys.paypal.sandbox.client.id');
  assert.equal(fieldPath('paypalLive', 'clientSecret'), 'keys.paypal.live.client.secret');
  assert.equal(servicePath('github'), 'keys.dev.github');
  assert.equal(servicePath('npm'), 'keys.dev.npm');
  assert.equal(servicePath('openai'), 'keys.dev.openai');
});
test('T2 every field mapped, every path unique', () => {
  for (const d of SERVICE_DEFINITIONS) for (const f of d.fields) assert.ok(FIELD_PATHS[d.id][f.id], `${d.id}.${f.id}`);
  const paths = allKeyPaths().map(([, , p]) => p);
  assert.equal(new Set(paths).size, paths.length);
});
test('T3 resolve current paths (keys., <user>.keys., me.keys.)', () => {
  assert.deepEqual(resolveKeyPath('keys.meta.instagram.app.secret'), { service: 'instagram', fieldId: 'appSecret', legacy: false });
  assert.deepEqual(resolveKeyPath('jabellae.keys.paypal.sandbox.client.id'), { service: 'paypal', fieldId: 'clientId', legacy: false });
  assert.deepEqual(resolveKeyPath('me.keys.dev.github'), { service: 'github', legacy: false });
  assert.equal(resolveKeyPath('keys.meta'), null); // a group, not a leaf
  assert.equal(resolveKeyPath('keys.nope.x'), null);
});
test('T4 legacy paths still resolve to the same slot', () => {
  assert.deepEqual(resolveKeyPath('keys.paypal.sandbox.api.client.id'), { service: 'paypal', fieldId: 'clientId', legacy: true });
  assert.deepEqual(resolveKeyPath('keys.facebook.app.id'), { service: 'facebook', fieldId: 'appId', legacy: true });
  assert.deepEqual(resolveKeyPath('keys.github.api.token'), { service: 'github', fieldId: 'token', legacy: true });
  assert.deepEqual(resolveKeyPath('keys.meta.api.key'), { service: 'meta', fieldId: 'apiKey', legacy: true });
  assert.deepEqual(resolveKeyPath('keys.xai.grok.api.key'), { service: 'grok', fieldId: 'apiKey', legacy: true });
});
const L: KeyLeaf[] = [
  { kind: 'service', id: 'twitch', path: 'twitch' },
  { kind: 'service', id: 'instagram', path: 'meta.instagram' },
  { kind: 'service', id: 'facebook', path: 'meta.facebook' },
  { kind: 'service', id: 'paypal', path: 'paypal.sandbox' },
  { kind: 'custom', name: 'stripe.test', path: 'stripe.test' },
  { kind: 'custom', name: 'meta.mine', path: 'meta.mine' },
  { kind: 'custom', name: 'myapi', path: 'myapi' },
];
test('T5 tree levels: groups vs leaves, stable order', () => {
  assert.deepEqual(childrenAt(L, '').map((c) => [c.seg, c.group, !!c.leaf]), [['twitch', false, true], ['meta', true, false], ['paypal', true, false], ['stripe', true, false], ['myapi', false, true]]);
  assert.deepEqual(childrenAt(L, 'meta').map((c) => c.seg), ['instagram', 'facebook', 'mine']);
  assert.deepEqual(childrenAt(L, 'paypal').map((c) => c.path), ['paypal.sandbox']);
  assert.deepEqual(childrenAt(L, 'twitch'), []);
});
test('T6 trail trims to what exists; templates per level', () => {
  assert.deepEqual(trimToExisting(L, ['meta', 'threads']), ['meta']);
  assert.deepEqual(trimToExisting(L, ['meta', 'instagram']), ['meta', 'instagram']);
  assert.deepEqual(trimToExisting(L, ['gone', 'x']), []);
  // Legacy Meta forms (facebook / instagram / threads / graph) are never offered: Meta comes from Connect.
  assert.deepEqual(templatesAt('meta', ['facebook']), ['whatsapp']);
  assert.deepEqual(templatesAt('meta', []), ['whatsapp']);
  assert.deepEqual(templatesAt('paypal', ['paypal']), ['paypalLive']);
  assert.ok(templatesAt('dev', []).includes('npm'));
});
test('T7 permissions: none / read / edit; owner defaults to edit', () => {
  assert.deepEqual(capsOf('none'), { reveal: false, edit: false });
  assert.deepEqual(capsOf('read'), { reveal: true, edit: false });
  assert.deepEqual(capsOf('edit'), { reveal: true, edit: true });
  assert.equal(accessFor(undefined, 'keys.meta.instagram'), 'edit');
  assert.equal(accessFor('read', 'keys.x'), 'read');
  assert.equal(accessFor((p) => (p.startsWith('keys.paypal') ? 'none' : 'read'), 'keys.paypal.live'), 'none');
  assert.equal(accessFor(() => 'bogus' as any, 'keys.x'), 'none'); // fail closed
});

test('T8 facebook pages live under the facebook group (wrap-ready siblings)', () => {
  const pages: KeyLeaf[] = [
    { kind: 'custom', name: 'meta.app', path: 'meta.app' },
    { kind: 'custom', name: 'meta.user', path: 'meta.user' },
    { kind: 'custom', name: 'meta.facebook.elbuentono', path: 'meta.facebook.elbuentono' },
    { kind: 'custom', name: 'meta.facebook.neuronsme', path: 'meta.facebook.neuronsme' },
    { kind: 'custom', name: 'meta.instagram.neuronsme', path: 'meta.instagram.neuronsme' },
    { kind: 'custom', name: 'meta.threads.jabellae', path: 'meta.threads.jabellae' },
  ];
  assert.deepEqual(childrenAt(pages, 'meta').map((c) => [c.seg, c.group, !!c.leaf]), [
    ['app', false, true],
    ['user', false, true],
    ['facebook', true, false],
    ['instagram', true, false],
    ['threads', true, false],
  ]);
  assert.deepEqual(childrenAt(pages, 'meta.facebook').map((c) => c.seg), ['elbuentono', 'neuronsme']);
  assert.equal(childrenAt(pages, 'meta.instagram')[0].leaf?.kind, 'custom');
});
test('T9 presets: the long-list services + Meta connect; legacy forms never offered; field names only', () => {
  const root = presetsAt('', [], { metaConnect: true });
  assert.equal(root[0].id, 'meta.connect', 'Meta first, as connect');
  assert.deepEqual(root.slice(1).map((p) => p.id), ['twitch', 'paypal', 'paypalLive', 'google', 'openai', 'linkedin', 'grok', 'github', 'npm', 'sms']);
  for (const legacy of ['facebook', 'instagram', 'threads', 'meta']) assert.ok(!root.some((p) => p.id === legacy), legacy);
  assert.ok(!presetsAt('', []).some((p) => p.id === 'meta.connect'), 'no connect preset unless offered');
  assert.ok(!presetsAt('dev', [], { metaConnect: true }).some((p) => p.id === 'meta.connect'), 'connect only at root / .meta');
  assert.deepEqual(presetsAt('meta', [], { metaConnect: true }).map((p) => p.id), ['meta.connect', 'whatsapp', 'meta.threads']);
  // WhatsApp / Threads belong to Meta: only .meta's "+" offers them; the root keeps Meta as its single entry.
  assert.ok(!presetsAt('', [], { metaConnect: true }).some((p) => p.id === 'whatsapp' || p.id === 'meta.threads'), 'root: no whatsapp / threads');
  assert.ok(!templatesAt('', []).some((id) => id === 'whatsapp' || id === 'threads'));
  assert.equal(presetsAt('meta', []).find((p) => p.id === 'meta.threads')?.kind, 'soon', 'threads: connect flow later, shown as coming soon');
  assert.ok(!presetsAt('meta', ['threads']).some((p) => p.id === 'meta.threads'), 'saved threads drops out');
  assert.deepEqual(presetFields('whatsapp'), ['phoneNumberId', 'businessAccountId', 'accessToken']);
  assert.deepEqual(presetsAt('', ['twitch']).some((p) => p.id === 'twitch'), false, 'saved ones drop out');
  assert.deepEqual(presetFields('whatsapp'), ['phoneNumberId', 'businessAccountId', 'accessToken'], 'WhatsApp: no App ID / Secret');
  assert.deepEqual(presetFields('openai'), ['apiKey', 'organization', 'project']);
  // Legacy fields stay in the definition, so an old WhatsApp save keeps (and re-saves) them.
  assert.deepEqual(SERVICE_DEFINITIONS.find((d) => d.id === 'whatsapp')!.fields.map((f) => f.id).slice(0, 2), ['appId', 'appSecret']);
  assert.equal(BRAND_COLORS.twitch, '#9146FF'); assert.equal(BRAND_COLORS.npm, '#CB3837'); assert.equal(BRAND_COLORS.github, undefined);
});
console.log(`${n} passed`);
