// serviceKeyVault.ts — third-party service credentials (Twitch, PayPal
// Sandbox, Meta) kept in the same Cleaker keychain vault, per namespace,
// encrypted at rest and decrypted only into memory.
//
// Encryption: localIdentityVault.ts's wrap/unwrap (PBKDF2 + AES-256-GCM
// under the user's passphrase) only accepts exactly 32 bytes, so it wraps
// a fresh random 32-byte DATA KEY per service; that data key then seals
// the service's fields (JSON) with AES-256-GCM, the namespace+service bound
// in as AAD. Nothing here ever writes a field value in plaintext, logs
// one, or returns one except from getServiceKeys() after a correct
// passphrase. "Saved / Not set" is answerable WITHOUT the passphrase
// (only whether the envelopes exist), so the UI never needs the secret
// to show status.
import {
  saveLocalIdentityVault,
  loadLocalIdentityVault,
  hasLocalIdentityVault,
  clearLocalIdentityVault,
} from '@/core/identity/localIdentityVault';

export type ServiceId = 'twitch' | 'paypal' | 'meta' | 'google' | 'openai' | 'linkedin' | 'grok' | 'github' | 'facebook' | 'whatsapp' | 'sms';

export interface ServiceFieldDef { id: string; label: string; secret: boolean }
export interface ServiceDef { id: ServiceId; name: string; fields: ServiceFieldDef[]; /** Icon tooltip; defaults to name. */ tooltip?: string }

export const SERVICE_DEFINITIONS: readonly ServiceDef[] = [
  { id: 'twitch', name: 'Twitch', fields: [
    { id: 'clientId', label: 'Client ID', secret: true },
    { id: 'clientSecret', label: 'Client Secret', secret: true },
    { id: 'channel', label: 'Channel', secret: false },
  ] },
  { id: 'paypal', name: 'PayPal Sandbox', fields: [
    { id: 'clientId', label: 'Client ID', secret: true },
    { id: 'clientSecret', label: 'Client Secret', secret: true },
  ] },
  { id: 'meta', name: 'Meta', fields: [
    { id: 'apiKey', label: 'API key', secret: true },
  ] },
  { id: 'google', name: 'Google Workspace', fields: [
    { id: 'clientId', label: 'OAuth Client ID', secret: true },
    { id: 'clientSecret', label: 'OAuth Client Secret', secret: true },
    { id: 'apiKey', label: 'API key (optional)', secret: true },
  ] },
  // One key covers ChatGPT API use and Codex (Codex uses the OpenAI key).
  { id: 'openai', name: 'OpenAI · ChatGPT / Codex', tooltip: 'OpenAI (ChatGPT, Codex)', fields: [
    { id: 'apiKey', label: 'API key', secret: true },
  ] },
  { id: 'linkedin', name: 'LinkedIn', fields: [
    { id: 'clientId', label: 'Client ID', secret: true },
    { id: 'clientSecret', label: 'Client Secret', secret: true },
  ] },
  { id: 'grok', name: 'xAI · Grok', fields: [
    { id: 'apiKey', label: 'API key', secret: true },
  ] },
  { id: 'github', name: 'GitHub', fields: [
    { id: 'token', label: 'Personal access token', secret: true },
  ] },
  { id: 'facebook', name: 'Facebook', fields: [
    { id: 'appId', label: 'App ID', secret: true },
    { id: 'appSecret', label: 'App Secret', secret: true },
    { id: 'pageAccessToken', label: 'Page access token (optional)', secret: true },
  ] },
  { id: 'whatsapp', name: 'WhatsApp', tooltip: 'WhatsApp (Cloud API)', fields: [
    { id: 'accessToken', label: 'Access token', secret: true },
    { id: 'phoneNumberId', label: 'Phone number ID', secret: true },
    { id: 'businessAccountId', label: 'Business account ID (optional)', secret: true },
  ] },
  { id: 'sms', name: 'SMS · Twilio', tooltip: 'SMS (Twilio)', fields: [
    { id: 'accountSid', label: 'Account SID', secret: true },
    { id: 'authToken', label: 'Auth token', secret: true },
    { id: 'fromNumber', label: 'From number', secret: false },
  ] },
];

export const SERVICE_IDS: readonly ServiceId[] = SERVICE_DEFINITIONS.map((s) => s.id);

export function isServiceId(value: unknown): value is ServiceId {
  return typeof value === 'string' && (SERVICE_IDS as readonly string[]).includes(value);
}

export type ServiceFields = Record<string, string>;

const PAYLOAD_PREFIX = 'this.me.service-keys:v1:';

function normalizeNs(namespace: string): string {
  const ns = String(namespace || '').trim().toLowerCase();
  if (!ns) throw new Error('A namespace is required to address service keys.');
  return ns;
}
function assertService(service: string): asserts service is ServiceId {
  if (!isServiceId(service)) throw new Error(`Unknown service: ${service}`);
}
const vaultSlot = (ns: string, s: ServiceId) => `${normalizeNs(ns)}:service-key:${s}`;
const payloadKey = (ns: string, s: ServiceId) => `${PAYLOAD_PREFIX}${normalizeNs(ns)}:${s}`;
const aadFor = (ns: string, s: ServiceId) => new TextEncoder().encode(`service-keys:v1|${normalizeNs(ns)}|${s}`);

function storage(): Storage | null {
  try { return globalThis.localStorage ?? null; } catch { return null; }
}
function b64(bytes: Uint8Array): string {
  let s = ''; for (const b of bytes) s += String.fromCharCode(b); return btoa(s);
}
function unb64(text: string): Uint8Array {
  const s = atob(text); const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i += 1) out[i] = s.charCodeAt(i); return out;
}
async function aesKey(raw: Uint8Array): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', raw as BufferSource, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

// In-memory only; a reload clears it.
const _unlocked = new Map<string, ServiceFields>();
const cacheKey = (ns: string, s: ServiceId) => `${normalizeNs(ns)}:${s}`;

function cleanFields(service: ServiceId, fields: ServiceFields): ServiceFields {
  const def = SERVICE_DEFINITIONS.find((d) => d.id === service)!;
  const out: ServiceFields = {};
  for (const f of def.fields) {
    const v = String(fields[f.id] ?? '').trim();
    if (v) out[f.id] = v;
  }
  return out;
}

/** Encrypts and stores `fields` for `service` under `namespace`. Overwrites any previous value. */
export async function saveServiceKeys(namespace: string, service: ServiceId, fields: ServiceFields, passphrase: string): Promise<void> {
  assertService(service);
  const store = storage();
  if (!store) throw new Error('LOCAL_STORAGE_UNAVAILABLE');
  if (!passphrase) throw new Error('PASSPHRASE_REQUIRED');
  const clean = cleanFields(service, fields);
  if (Object.keys(clean).length === 0) throw new Error('NO_FIELDS');

  const dataKey = crypto.getRandomValues(new Uint8Array(32));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData: aadFor(namespace, service) },
    await aesKey(dataKey),
    new TextEncoder().encode(JSON.stringify(clean)),
  ));
  await saveLocalIdentityVault(vaultSlot(namespace, service), dataKey, passphrase);
  dataKey.fill(0);
  store.setItem(payloadKey(namespace, service), JSON.stringify({ v: 1, iv: b64(iv), ct: b64(ct) }));
  _unlocked.set(cacheKey(namespace, service), clean);
}

/** Decrypts the stored fields. Returns null when nothing is stored; throws WRONG_PASSPHRASE on a bad passphrase. */
export async function getServiceKeys(namespace: string, service: ServiceId, passphrase: string): Promise<ServiceFields | null> {
  assertService(service);
  const raw = storage()?.getItem(payloadKey(namespace, service));
  if (!raw || !hasLocalIdentityVault(vaultSlot(namespace, service))) return null;
  let dataKey: Uint8Array | null;
  try {
    dataKey = await loadLocalIdentityVault(vaultSlot(namespace, service), passphrase);
  } catch {
    throw new Error('WRONG_PASSPHRASE');
  }
  if (!dataKey) return null;
  const { iv, ct } = JSON.parse(raw) as { iv: string; ct: string };
  let plain: ArrayBuffer;
  try {
    plain = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: unb64(iv) as BufferSource, additionalData: aadFor(namespace, service) },
      await aesKey(dataKey),
      unb64(ct) as BufferSource,
    );
  } catch {
    throw new Error('SERVICE_KEYS_CORRUPTED');
  } finally {
    dataKey.fill(0);
  }
  const fields = JSON.parse(new TextDecoder().decode(plain)) as ServiceFields;
  _unlocked.set(cacheKey(namespace, service), fields);
  return fields;
}

/** Whether keys are stored for this service — needs no passphrase, reveals nothing secret. */
export function hasServiceKeys(namespace: string, service: ServiceId): boolean {
  if (!isServiceId(service)) return false;
  try {
    return storage()?.getItem(payloadKey(namespace, service)) != null
      && hasLocalIdentityVault(vaultSlot(namespace, service));
  } catch {
    return false;
  }
}

export function listSavedServices(namespace: string): ServiceId[] {
  return SERVICE_IDS.filter((s) => hasServiceKeys(namespace, s));
}

export function removeServiceKeys(namespace: string, service: ServiceId): void {
  assertService(service);
  storage()?.removeItem(payloadKey(namespace, service));
  clearLocalIdentityVault(vaultSlot(namespace, service));
  _unlocked.delete(cacheKey(namespace, service));
}

/** Fields decrypted earlier in this page's life (save or get), or null. Memory only. */
export function getUnlockedServiceKeys(namespace: string, service: ServiceId): ServiceFields | null {
  return _unlocked.get(cacheKey(namespace, service)) ?? null;
}

export function lockServiceKeys(namespace?: string): void {
  if (!namespace) { _unlocked.clear(); return; }
  const prefix = `${normalizeNs(namespace)}:`;
  for (const k of [..._unlocked.keys()]) if (k.startsWith(prefix)) _unlocked.delete(k);
}

/** "••••1a2b" — at most the last 4 characters. Only for values already in memory. */
export function maskSecret(value: string): string {
  const v = String(value || '');
  return v.length <= 4 ? '••••' : `••••${v.slice(-4)}`;
}
