// Service keys (Twitch / PayPal / Meta): encrypted per namespace, never plaintext at rest, status without the passphrase.
import assert from 'node:assert/strict';
import { vaultStore } from './port-namespace/shim';
import {
  saveServiceKeys, getServiceKeys, hasServiceKeys, removeServiceKeys, listSavedServices,
  getUnlockedServiceKeys, lockServiceKeys, maskSecret,
} from '../src/gui/All.This/Cleaker/Keychain/serviceKeyVault';

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
  const { SERVICE_DEFINITIONS } = await import('../src/gui/All.This/Cleaker/Keychain/serviceKeyVault');
  const def = SERVICE_DEFINITIONS.find((d) => d.id === 'openai')!;
  assert.equal(def.name, 'OpenAI · ChatGPT / Codex');
  assert.equal(def.tooltip, 'OpenAI (ChatGPT, Codex)');
  assert.deepEqual(def.fields.map((f) => f.id), ['apiKey']);
  await saveServiceKeys(NS, 'openai', { apiKey: SECRET }, PW);
  lockServiceKeys();
  assert.deepEqual(await getServiceKeys(NS, 'openai', PW), { apiKey: SECRET });
  assert.ok(!JSON.stringify([...vaultStore.entries()]).includes(SECRET));
  assert.deepEqual(listSavedServices(NS), ['openai']);
});

await test('S12 LinkedIn: client id + secret round-trip, eleven services defined', async () => {
  const { SERVICE_IDS } = await import('../src/gui/All.This/Cleaker/Keychain/serviceKeyVault');
  assert.deepEqual([...SERVICE_IDS], ['twitch', 'paypal', 'meta', 'google', 'openai', 'linkedin', 'grok', 'github', 'facebook', 'whatsapp', 'sms']);
  await saveServiceKeys(NS, 'linkedin', { clientId: 'li-id', clientSecret: SECRET }, PW);
  lockServiceKeys();
  assert.deepEqual(await getServiceKeys(NS, 'linkedin', PW), { clientId: 'li-id', clientSecret: SECRET });
  assert.ok(!JSON.stringify([...vaultStore.entries()]).includes(SECRET));
});

await test('S13 xAI Grok, GitHub, Facebook (page token optional): labels, fields, round-trip, no plaintext', async () => {
  const { SERVICE_DEFINITIONS } = await import('../src/gui/All.This/Cleaker/Keychain/serviceKeyVault');
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
  assert.deepEqual(listSavedServices(NS), ['grok', 'github', 'facebook']);
});

await test('S14 WhatsApp Cloud API (business id optional) and SMS · Twilio round-trip', async () => {
  const { SERVICE_DEFINITIONS } = await import('../src/gui/All.This/Cleaker/Keychain/serviceKeyVault');
  const f = (id: string) => SERVICE_DEFINITIONS.find((d) => d.id === id)!;
  assert.deepEqual(f('whatsapp').fields.map((x) => x.id), ['accessToken', 'phoneNumberId', 'businessAccountId']);
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

console.log(`${n} passed`);
