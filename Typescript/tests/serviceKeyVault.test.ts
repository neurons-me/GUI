// Service keys (Twitch / PayPal / Meta): encrypted per namespace, never plaintext at rest, status without the passphrase.
import assert from 'node:assert/strict';
import { vaultStore } from './port-namespace/shim';
import {
  saveServiceKeys, getServiceKeys, hasServiceKeys, removeServiceKeys, listSavedServices,
  getUnlockedServiceKeys, lockServiceKeys, maskSecret,
} from '../src/gui/All.This/Cleaker/Keys/serviceKeyVault';

const PW = 'a-long-secret-1';
const NS = 'ana.name.space';
const SECRET = 'sk_live_SUPERSECRET_9f1a2b';
let n = 0;
async function test(name: string, fn: () => Promise<void> | void) {
  vaultStore.clear(); lockServiceKeys();
  try { await fn(); console.log(`PASS ${name}`); n += 1; } catch (e: any) { console.log(`FAIL ${name}\n       ${String(e.message).split('\n')[0]}`); process.exitCode = 1; }
}

await test('S1 not set by default', () => {
  assert.equal(hasServiceKeys(NS, 'twitch'), false);
  assert.deepEqual(listSavedServices(NS), []);
});

await test('S2 save -> has -> get round-trips', async () => {
  await saveServiceKeys(NS, 'twitch', { clientId: 'cid123', clientSecret: SECRET, channel: 'suign' }, PW);
  assert.equal(hasServiceKeys(NS, 'twitch'), true);
  assert.equal(hasServiceKeys(NS, 'paypal'), false);
  lockServiceKeys();
  assert.equal(getUnlockedServiceKeys(NS, 'twitch'), null);
  assert.deepEqual(await getServiceKeys(NS, 'twitch', PW), { clientId: 'cid123', clientSecret: SECRET, channel: 'suign' });
  assert.deepEqual(listSavedServices(NS), ['twitch']);
});

await test('S3 nothing in storage contains the secret in plaintext', async () => {
  await saveServiceKeys(NS, 'meta', { apiKey: SECRET }, PW);
  const all = JSON.stringify([...vaultStore.entries()]);
  assert.ok(!all.includes(SECRET));
  assert.ok(!all.includes('SUPERSECRET'));
});

await test('S4 wrong passphrase throws WRONG_PASSPHRASE', async () => {
  await saveServiceKeys(NS, 'paypal', { clientId: 'a', clientSecret: 'b' }, PW);
  await assert.rejects(getServiceKeys(NS, 'paypal', 'nope-wrong-pw'), /WRONG_PASSPHRASE/);
});

await test('S5 per namespace: another namespace sees nothing', async () => {
  await saveServiceKeys(NS, 'meta', { apiKey: SECRET }, PW);
  assert.equal(hasServiceKeys('bob.name.space', 'meta'), false);
  assert.equal(await getServiceKeys('bob.name.space', 'meta', PW), null);
  assert.equal(hasServiceKeys('ANA.name.space', 'meta'), true, 'namespace is case-insensitive');
});

await test('S6 remove clears storage and memory', async () => {
  await saveServiceKeys(NS, 'meta', { apiKey: SECRET }, PW);
  removeServiceKeys(NS, 'meta');
  assert.equal(hasServiceKeys(NS, 'meta'), false);
  assert.equal(getUnlockedServiceKeys(NS, 'meta'), null);
  assert.equal(vaultStore.size, 0);
});

await test('S7 rejects empty fields, unknown services, unknown field names are dropped', async () => {
  await assert.rejects(saveServiceKeys(NS, 'meta', { apiKey: '  ' }, PW), /NO_FIELDS/);
  await assert.rejects(saveServiceKeys(NS, 'nope' as any, { apiKey: 'x' }, PW), /Unknown service/);
  await saveServiceKeys(NS, 'meta', { apiKey: 'k', extra: 'zzz' }, PW);
  assert.deepEqual(await getServiceKeys(NS, 'meta', PW), { apiKey: 'k' });
});

await test('S8 swapping payloads between services fails (AAD binds namespace+service)', async () => {
  await saveServiceKeys(NS, 'meta', { apiKey: SECRET }, PW);
  await saveServiceKeys(NS, 'paypal', { clientId: 'a', clientSecret: 'b' }, PW);
  const meta = vaultStore.get(`this.me.service-keys:v1:${NS}:meta`)!;
  vaultStore.set(`this.me.service-keys:v1:${NS}:paypal`, meta);
  await assert.rejects(getServiceKeys(NS, 'paypal', PW), /CORRUPTED/);
});

await test('S9 mask shows at most last 4', () => {
  assert.equal(maskSecret('abcdef1a2b'), '••••1a2b');
  assert.equal(maskSecret('abc'), '••••');
});

await test('S10 Google Workspace: API key optional, all four services listed', async () => {
  await saveServiceKeys(NS, 'google', { clientId: 'cid.apps', clientSecret: SECRET, apiKey: '' }, PW);
  assert.equal(hasServiceKeys(NS, 'google'), true);
  lockServiceKeys();
  assert.deepEqual(await getServiceKeys(NS, 'google', PW), { clientId: 'cid.apps', clientSecret: SECRET });
  assert.ok(!JSON.stringify([...vaultStore.entries()]).includes(SECRET));
  await saveServiceKeys(NS, 'twitch', { clientId: 'a' }, PW);
  await saveServiceKeys(NS, 'paypal', { clientId: 'a' }, PW);
  await saveServiceKeys(NS, 'meta', { apiKey: 'a' }, PW);
  assert.deepEqual(listSavedServices(NS), ['twitch', 'paypal', 'meta', 'google']);
});

await test('S11 OpenAI (ChatGPT / Codex): single API key, labelled and listed', async () => {
  const { SERVICE_DEFINITIONS } = await import('../src/gui/All.This/Cleaker/Keys/serviceKeyVault');
  const def = SERVICE_DEFINITIONS.find((d) => d.id === 'openai')!;
  assert.equal(def.name, 'OpenAI · ChatGPT / Codex');
  assert.equal(def.tooltip, 'OpenAI (ChatGPT, Codex)');
  assert.deepEqual(def.fields.map((f) => f.id), ['apiKey', 'organization', 'project']);
  assert.ok(def.fields.every((f) => f.secret), 'secret by default');
  await saveServiceKeys(NS, 'openai', { apiKey: SECRET }, PW);
  lockServiceKeys();
  assert.deepEqual(await getServiceKeys(NS, 'openai', PW), { apiKey: SECRET });
  assert.ok(!JSON.stringify([...vaultStore.entries()]).includes(SECRET));
  assert.deepEqual(listSavedServices(NS), ['openai']);
});

await test('S12 LinkedIn: client id + secret round-trip, all semantic-tree services defined', async () => {
  const { SERVICE_IDS } = await import('../src/gui/All.This/Cleaker/Keys/serviceKeyVault');
  assert.deepEqual([...SERVICE_IDS], ['twitch', 'paypal', 'paypalLive', 'facebook', 'instagram', 'threads', 'whatsapp', 'meta', 'google', 'openai', 'linkedin', 'grok', 'github', 'npm', 'sms']);
  await saveServiceKeys(NS, 'linkedin', { clientId: 'li-id', clientSecret: SECRET }, PW);
  lockServiceKeys();
  assert.deepEqual(await getServiceKeys(NS, 'linkedin', PW), { clientId: 'li-id', clientSecret: SECRET });
  assert.ok(!JSON.stringify([...vaultStore.entries()]).includes(SECRET));
});

await test('S13 xAI Grok, GitHub, Facebook (page token optional): labels, fields, round-trip, no plaintext', async () => {
  const { SERVICE_DEFINITIONS } = await import('../src/gui/All.This/Cleaker/Keys/serviceKeyVault');
  const f = (id: string) => SERVICE_DEFINITIONS.find((d) => d.id === id)!;
  assert.equal(f('grok').name, 'xAI · Grok');
  assert.deepEqual(f('grok').fields.map((x) => x.id), ['apiKey']);
  assert.deepEqual(f('github').fields.map((x) => x.label), ['Personal access token']);
  assert.deepEqual(f('facebook').fields.map((x) => x.id), ['appId', 'appSecret', 'pageAccessToken']);
  await saveServiceKeys(NS, 'grok', { apiKey: SECRET }, PW);
  await saveServiceKeys(NS, 'github', { token: SECRET + 'gh' }, PW);
  await saveServiceKeys(NS, 'facebook', { appId: 'app1', appSecret: SECRET + 'fb' }, PW);
  lockServiceKeys();
  assert.deepEqual(await getServiceKeys(NS, 'grok', PW), { apiKey: SECRET });
  assert.deepEqual(await getServiceKeys(NS, 'github', PW), { token: SECRET + 'gh' });
  assert.deepEqual(await getServiceKeys(NS, 'facebook', PW), { appId: 'app1', appSecret: SECRET + 'fb' });
  assert.ok(!JSON.stringify([...vaultStore.entries()]).includes('SUPERSECRET'));
  assert.deepEqual(listSavedServices(NS), ['facebook', 'grok', 'github']); // definition (tree) order
});

await test('S14 WhatsApp Cloud API (business id optional) and SMS · Twilio round-trip', async () => {
  const { SERVICE_DEFINITIONS } = await import('../src/gui/All.This/Cleaker/Keys/serviceKeyVault');
  const f = (id: string) => SERVICE_DEFINITIONS.find((d) => d.id === id)!;
  assert.deepEqual(f('whatsapp').fields.map((x) => x.id), ['appId', 'appSecret', 'phoneNumberId', 'businessAccountId', 'accessToken']);
  assert.equal(f('sms').name, 'SMS · Twilio');
  assert.deepEqual(f('sms').fields.map((x) => x.label), ['Account SID', 'Auth token', 'From number']);
  await saveServiceKeys(NS, 'whatsapp', { accessToken: SECRET, phoneNumberId: '123' }, PW);
  await saveServiceKeys(NS, 'sms', { accountSid: 'AC1', authToken: SECRET + 'tw', fromNumber: '+15550000' }, PW);
  lockServiceKeys();
  assert.deepEqual(await getServiceKeys(NS, 'whatsapp', PW), { accessToken: SECRET, phoneNumberId: '123' });
  assert.deepEqual(await getServiceKeys(NS, 'sms', PW), { accountSid: 'AC1', authToken: SECRET + 'tw', fromNumber: '+15550000' });
  assert.ok(!JSON.stringify([...vaultStore.entries()]).includes('SUPERSECRET'));
  assert.deepEqual(listSavedServices(NS), ['whatsapp', 'sms']);
});

await test('S15 Twitch with/without optional OBS WebSocket; OBS password never plaintext', async () => {
  const { SERVICE_DEFINITIONS, SERVICE_IDS, OBS_DEFAULTS, obsConnectionFromTwitch } = await import('../src/gui/All.This/Cleaker/Keys/serviceKeyVault');
  const tw = SERVICE_DEFINITIONS.find((d) => d.id === 'twitch')!;
  const obs = tw.fields.filter((f) => f.group);
  assert.deepEqual(obs.map((f) => [f.id, f.secret, f.defaultValue]), [['obsHost', false, 'localhost'], ['obsPort', false, '4455'], ['obsPassword', true, undefined]]);
  assert.deepEqual(OBS_DEFAULTS, { host: 'localhost', port: '4455' });
  for (const s of SERVICE_IDS) removeServiceKeys(NS, s);
  // Without OBS fields.
  await saveServiceKeys(NS, 'twitch', { clientId: 'cid', clientSecret: SECRET }, PW);
  lockServiceKeys();
  const plain = await getServiceKeys(NS, 'twitch', PW);
  assert.deepEqual(plain, { clientId: 'cid', clientSecret: SECRET });
  assert.equal(obsConnectionFromTwitch(plain), null);
  // With OBS password only: host/port defaults apply.
  const OBS_PW = 'OBSPASSWORD_x7q9';
  await saveServiceKeys(NS, 'twitch', { clientId: 'cid', clientSecret: SECRET, obsPassword: OBS_PW }, PW);
  lockServiceKeys();
  const withObs = await getServiceKeys(NS, 'twitch', PW);
  assert.equal(withObs!.obsPassword, OBS_PW);
  assert.deepEqual(obsConnectionFromTwitch(withObs), { host: 'localhost', port: 4455, password: OBS_PW });
  const dump = JSON.stringify([...vaultStore.entries()]) + JSON.stringify({ ...(globalThis as any).localStorage });
  for (let i = 0; i < (globalThis as any).localStorage.length; i++) {
    const k = (globalThis as any).localStorage.key(i);
    assert.ok(!String((globalThis as any).localStorage.getItem(k)).includes(OBS_PW), 'OBS password in localStorage');
  }
  assert.ok(!dump.includes(OBS_PW) && !dump.includes('SUPERSECRET'));
  // Full OBS round-trip.
  await saveServiceKeys(NS, 'twitch', { clientId: 'cid', obsHost: '192.168.1.5', obsPort: '4460', obsPassword: OBS_PW }, PW);
  lockServiceKeys();
  assert.deepEqual(obsConnectionFromTwitch(await getServiceKeys(NS, 'twitch', PW)), { host: '192.168.1.5', port: 4460, password: OBS_PW });
  await assert.rejects(getServiceKeys(NS, 'twitch', 'wrong-pass'));
});

await test('S16 custom key groups: sanitize, save/load/remove, listed without values, no plaintext', async () => {
  const { saveCustomKeys, getCustomKeys, hasCustomKeys, removeCustomKeys, listCustomKeyGroups, sanitizeKeyPath } = await import('../src/gui/All.This/Cleaker/Keys/serviceKeyVault');
  assert.equal(sanitizeKeyPath('  My API '), 'my-api');
  assert.equal(sanitizeKeyPath('Stripe.Test'), 'stripe.test');
  assert.equal(sanitizeKeyPath('a..b__c!'), 'a.b-c');
  await assert.rejects(saveCustomKeys(NS, 'Bad Name', { k: 'v' }, PW), /INVALID_KEY_NAME/);
  await assert.rejects(saveCustomKeys(NS, 'meta', { k: 'v' }, PW), /RESERVED_KEY_NAME/);
  await assert.rejects(saveCustomKeys(NS, 'myapi', { k: '  ' }, PW), /NO_FIELDS/);
  await saveCustomKeys(NS, 'stripe.test', { 'Secret Key': SECRET, publishable: 'pk_1', empty: '' }, PW);
  assert.equal(hasCustomKeys(NS, 'stripe.test'), true);
  assert.deepEqual(listCustomKeyGroups(NS), [{ name: 'stripe.test', fields: ['secret-key', 'publishable'] }]);
  assert.deepEqual(listSavedServices(NS), [], 'custom groups are not services');
  assert.ok(!JSON.stringify([...vaultStore.entries()]).includes('SUPERSECRET'));
  lockServiceKeys();
  assert.deepEqual(await getCustomKeys(NS, 'stripe.test', PW), { 'secret-key': SECRET, publishable: 'pk_1' });
  await assert.rejects(getCustomKeys(NS, 'stripe.test', 'wrong-pass'), /WRONG_PASSPHRASE/);
  assert.equal(hasCustomKeys('bob.name.space', 'stripe.test'), false);
  // Re-save replaces fields (row removed).
  await saveCustomKeys(NS, 'stripe.test', { publishable: 'pk_2' }, PW);
  assert.deepEqual(listCustomKeyGroups(NS), [{ name: 'stripe.test', fields: ['publishable'] }]);
  removeCustomKeys(NS, 'stripe.test');
  assert.equal(hasCustomKeys(NS, 'stripe.test'), false);
  assert.deepEqual(listCustomKeyGroups(NS), []);
  assert.equal(vaultStore.size, 0);
});

await test('S17 custom group mark (icon or glyph) persists as metadata, kept on re-save, validated', async () => {
  const { saveCustomKeys, listCustomKeyGroups, firstGlyph, cleanCustomKeyMark } = await import('../src/gui/All.This/Cleaker/Keys/serviceKeyVault');
  assert.equal(firstGlyph('  🔑abc'), '🔑');
  assert.equal(firstGlyph('★'), '★');
  assert.equal(cleanCustomKeyMark({ kind: 'icon', name: 'bolt' })?.kind, 'icon');
  assert.equal(cleanCustomKeyMark({ kind: 'icon', name: 'Bad Name!' }), undefined);
  assert.equal(cleanCustomKeyMark({ kind: 'glyph', value: '   ' }), undefined);
  await saveCustomKeys(NS, 'myapi', { token: SECRET }, PW, { kind: 'glyph', value: '∆xyz' });
  assert.deepEqual(listCustomKeyGroups(NS), [{ name: 'myapi', fields: ['token'], mark: { kind: 'glyph', value: '∆' } }]);
  await saveCustomKeys(NS, 'myapi', { token: SECRET, other: 'v' }, PW);
  assert.deepEqual(listCustomKeyGroups(NS)[0].mark, { kind: 'glyph', value: '∆' }, 'undefined keeps the mark');
  await saveCustomKeys(NS, 'myapi', { token: SECRET }, PW, { kind: 'icon', name: 'bolt' });
  assert.deepEqual(listCustomKeyGroups(NS)[0].mark, { kind: 'icon', name: 'bolt' });
  await saveCustomKeys(NS, 'myapi', { token: SECRET }, PW, null);
  assert.equal(listCustomKeyGroups(NS)[0].mark, undefined, 'null clears it');
  // v1 index (plain field array) still reads.
  vaultStore.set(`this.me.service-keys:v1:custom-index:${NS}`, JSON.stringify({ myapi: ['token'] }));
  assert.deepEqual(listCustomKeyGroups(NS), [{ name: 'myapi', fields: ['token'] }]);
  assert.ok(!JSON.stringify([...vaultStore.entries()]).includes('SUPERSECRET'));
});

await test('S18 stable order: only a NEW key goes first, re-saving does not move it, unknown keep default order, removal forgets, ids only', async () => {
  const { readKeyOrder, touchKey, orderByUsage, KEY_ORDER_PREFIX } = await import('../src/gui/All.This/Cleaker/Keys/keyOrder');
  const { saveCustomKeys, removeCustomKeys } = await import('../src/gui/All.This/Cleaker/Keys/serviceKeyVault');
  assert.deepEqual(readKeyOrder(NS), []);
  const defaults = ['twitch', 'paypal', 'meta', 'google'];
  assert.deepEqual(orderByUsage(defaults, readKeyOrder(NS), (x) => x), defaults, 'no usage: default order');
  await saveServiceKeys(NS, 'twitch', { clientId: 'a' }, PW);
  await saveServiceKeys(NS, 'meta', { apiKey: SECRET }, PW);
  assert.deepEqual(readKeyOrder(NS), ['meta', 'twitch'], 'newest first');
  await saveServiceKeys(NS, 'twitch', { clientId: 'b' }, PW);
  assert.deepEqual(readKeyOrder(NS), ['meta', 'twitch'], 're-saving an existing key does not move it');
  touchKey(NS, 'twitch'); // explicit opt-in MRU still works
  assert.deepEqual(readKeyOrder(NS), ['twitch', 'meta'], 'used moves to front');
  await saveCustomKeys(NS, 'myapi', { token: SECRET }, PW);
  assert.deepEqual(readKeyOrder(NS), ['custom:myapi', 'twitch', 'meta']);
  touchKey(NS, 'meta');
  await saveCustomKeys(NS, 'myapi', { token: SECRET, extra: 'x' }, PW);
  assert.deepEqual(readKeyOrder(NS), ['meta', 'custom:myapi', 'twitch'], 're-saving a custom group does not move it');
  touchKey(NS, 'custom:myapi'); touchKey(NS, 'twitch'); touchKey(NS, 'custom:myapi');
  const items = ['twitch', 'paypal', 'meta', 'google', 'custom:myapi'];
  assert.deepEqual(orderByUsage(items, readKeyOrder(NS), (x) => x), ['custom:myapi', 'twitch', 'meta', 'paypal', 'google'], 'unknown append in default order');
  touchKey(NS, 'nope' as any); touchKey(NS, 'custom:Bad Name' as any);
  assert.deepEqual(readKeyOrder(NS), ['custom:myapi', 'twitch', 'meta'], 'invalid ids ignored');
  vaultStore.set(`${KEY_ORDER_PREFIX}${NS}`, JSON.stringify(['meta', 42, 'meta', 'zzz']));
  assert.deepEqual(readKeyOrder(NS), ['meta'], 'garbage filtered');
  touchKey(NS, 'twitch'); touchKey(NS, 'custom:myapi');
  const stored = vaultStore.get(`${KEY_ORDER_PREFIX}${NS}`)!;
  assert.ok(!stored.includes('SUPERSECRET') && !stored.includes(PW), 'order holds ids only');
  removeCustomKeys(NS, 'myapi'); removeServiceKeys(NS, 'twitch'); removeServiceKeys(NS, 'meta');
  assert.deepEqual(readKeyOrder(NS), []);
  assert.equal(vaultStore.size, 0, 'empty order is removed');
});

await test('S19 glyph marks are single graphemes: emoji (ZWJ / variation selector), hieroglyphs, never a split surrogate', async () => {
  const { firstGlyph, lastGlyph, graphemes, cleanCustomKeyMark } = await import('../src/gui/All.This/Cleaker/Keys/serviceKeyVault');
  const eye = '\u{13080}'; // 𓂀
  assert.equal(eye.length, 2, 'astral: two UTF-16 units');
  assert.equal(firstGlyph(eye + 'abc'), eye);
  assert.equal(lastGlyph('★' + eye), eye);
  assert.equal(firstGlyph('👩‍💻x'), '👩‍💻', 'ZWJ sequence stays whole');
  assert.equal(firstGlyph('❤️ok'), '❤️', 'variation selector kept');
  assert.equal(lastGlyph('a 🔑'), '🔑', 'spaces skipped');
  assert.equal(firstGlyph('👍🏽'), '👍🏽', 'skin tone kept');
  assert.deepEqual(graphemes('★🔑' + eye), ['★', '🔑', eye]);
  assert.deepEqual(cleanCustomKeyMark({ kind: 'glyph', value: eye }), { kind: 'glyph', value: eye });
  for (const s of [eye, '👩‍👩‍👧‍👦', '🏳️‍🌈']) {
    const g = firstGlyph(s);
    assert.ok(!/[\uD800-\uDBFF]$/.test(g) && !/^[\uDC00-\uDFFF]/.test(g), 'no lone surrogate');
    assert.equal(g, s);
  }
});


await test('S20 meta account branches: allowed under a service leaf, public fields stay public, secrets stay sealed, notices', async () => {
  const { saveCustomKeys, getCustomKeys, listCustomKeyGroups, isPublicKeyField, keyNoticeFromGroup } = await import('../src/gui/All.This/Cleaker/Keys/serviceKeyVault');
  assert.equal(isPublicKeyField('id'), true);
  assert.equal(isPublicKeyField('redirect'), true);
  assert.equal(isPublicKeyField('expires'), true);
  assert.equal(isPublicKeyField('expiresAt'), true, 'old name still public (saved before the rename)');
  assert.equal(isPublicKeyField('page'), true);
  assert.equal(isPublicKeyField('userId'), true);
  assert.equal(isPublicKeyField('token'), false);
  assert.equal(isPublicKeyField('secret'), false);
  await assert.rejects(saveCustomKeys(NS, 'meta.facebook', { id: '1' }, PW), /RESERVED_KEY_NAME/);
  await saveCustomKeys(NS, 'meta.facebook.elbuentono', { id: '111111', token: SECRET, instagram_business_account: '178410000000001' }, PW);
  const page = listCustomKeyGroups(NS).find((g) => g.name === 'meta.facebook.elbuentono');
  assert.ok(page);
  assert.deepEqual(page.publicValues, { id: '111111', 'instagram-business-account': '178410000000001' });
  assert.ok(!JSON.stringify(page).includes('SUPERSECRET'));
  assert.ok(!JSON.stringify([...vaultStore.entries()]).includes('SUPERSECRET'));
  lockServiceKeys();
  const fields = await getCustomKeys(NS, 'meta.facebook.elbuentono', PW);
  assert.equal(fields!.token, SECRET);
  assert.equal(fields!.id, '111111');

  await saveCustomKeys(NS, 'meta.threads.jabellae', { userId: '99999', token: SECRET, expires: '2026-11-19' }, PW);
  const th = listCustomKeyGroups(NS).find((g) => g.name === 'meta.threads.jabellae')!;
  assert.equal(th.publicValues!.userid, '99999');
  assert.equal(th.publicValues!.expires, '2026-11-19');
  assert.equal(keyNoticeFromGroup(th, Date.parse('2026-11-15T18:00:00-06:00')), 'expiring');
  assert.equal(keyNoticeFromGroup(th, Date.parse('2026-10-01T12:00:00Z')), undefined);
  // Saved before the rename: `expiresAt` (stored as `expiresat`) still shows and still badges.
  await saveCustomKeys(NS, 'meta.threads.vieja', { userId: '88888', token: SECRET, expiresAt: '2026-11-19' }, PW);
  const legacy = listCustomKeyGroups(NS).find((g) => g.name === 'meta.threads.vieja')!;
  assert.equal(legacy.publicValues!.expiresat, '2026-11-19');
  assert.equal(keyNoticeFromGroup(legacy, Date.parse('2026-11-15T18:00:00-06:00')), 'expiring');
  assert.equal(keyNoticeFromGroup(legacy, Date.parse('2026-10-01T12:00:00Z')), undefined);

  await saveCustomKeys(NS, 'meta.facebook.vieja', { id: '444444', token: SECRET, error: '190' }, PW);
  assert.equal(keyNoticeFromGroup(listCustomKeyGroups(NS).find((g) => g.name === 'meta.facebook.vieja')!), 'dead');

  await saveCustomKeys(NS, 'meta.facebook.archivo', { id: '333333', token: SECRET, status: 'disconnected' }, PW);
  assert.equal(keyNoticeFromGroup(listCustomKeyGroups(NS).find((g) => g.name === 'meta.facebook.archivo')!), 'disconnected');

  await saveCustomKeys(NS, 'meta.instagram.neuronsme', { userId: '178420000000002', page: 'facebook.neuronsme' }, PW);
  const ig = listCustomKeyGroups(NS).find((g) => g.name === 'meta.instagram.neuronsme')!;
  assert.deepEqual(ig.publicValues, { userid: '178420000000002', page: 'facebook.neuronsme' });
  assert.ok(!ig.fields.includes('token'), 'instagram stores a page reference, not a token copy');
});

console.log(`${n} passed`);
