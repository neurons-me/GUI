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
import { forgetKey, touchKey } from './keyOrder';

// Ids are stable storage handles (vault slot names). Where a key LIVES is its semantic path
// (`path` below, under `keys.`): e.g. facebook → keys.meta.facebook. Old ids keep their slot, so
// data saved before the tree moved still reads; keyPaths.ts also resolves the old paths (aliases).
export type ServiceId = 'twitch' | 'paypal' | 'paypalLive' | 'meta' | 'facebook' | 'instagram' | 'threads' | 'whatsapp'
  | 'google' | 'openai' | 'linkedin' | 'grok' | 'github' | 'npm' | 'sms';

export interface ServiceFieldDef {
  id: string; label: string; secret: boolean;
  /** Optional subsection heading (fields sharing a group render together). */
  group?: string;
  /** Default used when the field is left empty (shown as placeholder, never stored implicitly). */
  defaultValue?: string;
  /** No longer asked for a NEW key ("+"), but kept so a key saved with it still shows, edits and re-saves it. */
  legacy?: boolean;
}

/** Defaults for the optional OBS WebSocket subsection of the Twitch card. */
export const OBS_DEFAULTS = { host: 'localhost', port: '4455' } as const;
export interface ServiceDef {
  id: ServiceId; name: string; fields: ServiceFieldDef[]; /** Icon tooltip; defaults to name. */ tooltip?: string;
  /** Semantic path under `keys` (each dot is one tree level; the last segment is the leaf). */
  path: string;
  /** Not offered by "+" any more (Meta now comes from Connect with Facebook); a saved one stays readable as before. */
  legacy?: boolean;
}

export const SERVICE_DEFINITIONS: readonly ServiceDef[] = [
  { id: 'twitch', name: 'Twitch', path: 'twitch', fields: [
    { id: 'clientId', label: 'Client ID', secret: true },
    { id: 'clientSecret', label: 'Client Secret', secret: true },
    { id: 'channel', label: 'Channel', secret: false },
    { id: 'obsHost', label: 'Host', secret: false, group: 'OBS WebSocket (optional)', defaultValue: OBS_DEFAULTS.host },
    { id: 'obsPort', label: 'Port', secret: false, group: 'OBS WebSocket (optional)', defaultValue: OBS_DEFAULTS.port },
    { id: 'obsPassword', label: 'Password', secret: true, group: 'OBS WebSocket (optional)' },
  ] },
  { id: 'paypal', name: 'PayPal Sandbox', tooltip: 'Sandbox', path: 'paypal.sandbox', fields: [
    { id: 'clientId', label: 'Client ID', secret: true },
    { id: 'clientSecret', label: 'Client Secret', secret: true },
  ] },
  { id: 'paypalLive', name: 'PayPal Live', tooltip: 'Live', path: 'paypal.live', fields: [
    { id: 'clientId', label: 'Client ID', secret: true },
    { id: 'clientSecret', label: 'Client Secret', secret: true },
  ] },
  { id: 'facebook', name: 'Facebook', path: 'meta.facebook', legacy: true, fields: [
    { id: 'appId', label: 'App ID', secret: true },
    { id: 'appSecret', label: 'App Secret', secret: true },
    { id: 'pageAccessToken', label: 'Page access token (optional)', secret: true },
  ] },
  { id: 'instagram', name: 'Instagram', path: 'meta.instagram', legacy: true, fields: [
    { id: 'appId', label: 'App ID', secret: true },
    { id: 'appSecret', label: 'App Secret', secret: true },
  ] },
  { id: 'threads', name: 'Threads', path: 'meta.threads', legacy: true, fields: [
    { id: 'appId', label: 'App ID', secret: true },
    { id: 'appSecret', label: 'App Secret', secret: true },
  ] },
  // The Meta App comes from Meta's own connect, so App ID / Secret are no longer asked here (kept for old saves).
  { id: 'whatsapp', name: 'WhatsApp', tooltip: 'WhatsApp (Cloud API)', path: 'meta.whatsapp', fields: [
    { id: 'appId', label: 'App ID', secret: true, legacy: true },
    { id: 'appSecret', label: 'App Secret', secret: true, legacy: true },
    { id: 'phoneNumberId', label: 'Phone number ID', secret: true },
    { id: 'businessAccountId', label: 'Business account ID (optional)', secret: true },
    { id: 'accessToken', label: 'Access token', secret: true },
  ] },
  // The single "Meta" API key saved before the tree had levels: now Meta's Graph API leaf (same slot).
  { id: 'meta', name: 'Meta Graph API', tooltip: 'Graph API', path: 'meta.graph', legacy: true, fields: [
    { id: 'apiKey', label: 'API key', secret: true },
  ] },
  { id: 'google', name: 'Google Workspace', tooltip: 'Workspace', path: 'google.workspace', fields: [
    { id: 'clientId', label: 'OAuth Client ID', secret: true },
    { id: 'clientSecret', label: 'OAuth Client Secret', secret: true },
    { id: 'apiKey', label: 'API key (optional)', secret: true },
  ] },
  // One key covers ChatGPT API use and Codex (Codex uses the OpenAI key).
  { id: 'openai', name: 'OpenAI · ChatGPT / Codex', tooltip: 'OpenAI (ChatGPT, Codex)', path: 'dev.openai', fields: [
    { id: 'apiKey', label: 'API key', secret: true },
    { id: 'organization', label: 'Organization ID (optional)', secret: true },
    { id: 'project', label: 'Project ID (optional)', secret: true },
  ] },
  { id: 'linkedin', name: 'LinkedIn', path: 'linkedin', fields: [
    { id: 'clientId', label: 'Client ID', secret: true },
    { id: 'clientSecret', label: 'Client Secret', secret: true },
  ] },
  { id: 'grok', name: 'xAI · Grok', path: 'dev.xai', fields: [
    { id: 'apiKey', label: 'API key', secret: true },
  ] },
  { id: 'github', name: 'GitHub', path: 'dev.github', fields: [
    { id: 'token', label: 'Personal access token', secret: true },
  ] },
  { id: 'npm', name: 'npm', path: 'dev.npm', fields: [
    { id: 'token', label: 'Access token', secret: true },
  ] },
  { id: 'sms', name: 'SMS · Twilio', tooltip: 'Twilio', path: 'sms.twilio', fields: [
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
// Envelope addressing. `id` is a ServiceId or a custom group id (`custom:<name>`).
type EnvelopeId = ServiceId | CustomKeyId;
const vaultSlot = (ns: string, s: EnvelopeId) => `${normalizeNs(ns)}:service-key:${s}`;
const payloadKey = (ns: string, s: EnvelopeId) => `${PAYLOAD_PREFIX}${normalizeNs(ns)}:${s}`;
const aadFor = (ns: string, s: EnvelopeId) => new TextEncoder().encode(`service-keys:v1|${normalizeNs(ns)}|${s}`);

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
const cacheKey = (ns: string, s: EnvelopeId) => `${normalizeNs(ns)}:${s}`;

function cleanFields(service: ServiceId, fields: ServiceFields): ServiceFields {
  const def = SERVICE_DEFINITIONS.find((d) => d.id === service)!;
  const out: ServiceFields = {};
  for (const f of def.fields) {
    const v = String(fields[f.id] ?? '').trim();
    if (v) out[f.id] = v;
  }
  return out;
}

async function sealEnvelope(namespace: string, id: EnvelopeId, clean: ServiceFields, passphrase: string): Promise<void> {
  const store = storage();
  if (!store) throw new Error('LOCAL_STORAGE_UNAVAILABLE');
  if (!passphrase) throw new Error('PASSPHRASE_REQUIRED');
  if (Object.keys(clean).length === 0) throw new Error('NO_FIELDS');
  const dataKey = crypto.getRandomValues(new Uint8Array(32));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData: aadFor(namespace, id) },
    await aesKey(dataKey),
    new TextEncoder().encode(JSON.stringify(clean)),
  ));
  await saveLocalIdentityVault(vaultSlot(namespace, id), dataKey, passphrase);
  dataKey.fill(0);
  store.setItem(payloadKey(namespace, id), JSON.stringify({ v: 1, iv: b64(iv), ct: b64(ct) }));
  _unlocked.set(cacheKey(namespace, id), clean);
}

async function openEnvelope(namespace: string, id: EnvelopeId, passphrase: string): Promise<ServiceFields | null> {
  const raw = storage()?.getItem(payloadKey(namespace, id));
  if (!raw || !hasLocalIdentityVault(vaultSlot(namespace, id))) return null;
  let dataKey: Uint8Array | null;
  try {
    dataKey = await loadLocalIdentityVault(vaultSlot(namespace, id), passphrase);
  } catch {
    throw new Error('WRONG_PASSPHRASE');
  }
  if (!dataKey) return null;
  const { iv, ct } = JSON.parse(raw) as { iv: string; ct: string };
  let plain: ArrayBuffer;
  try {
    plain = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: unb64(iv) as BufferSource, additionalData: aadFor(namespace, id) },
      await aesKey(dataKey),
      unb64(ct) as BufferSource,
    );
  } catch {
    throw new Error('SERVICE_KEYS_CORRUPTED');
  } finally {
    dataKey.fill(0);
  }
  const fields = JSON.parse(new TextDecoder().decode(plain)) as ServiceFields;
  _unlocked.set(cacheKey(namespace, id), fields);
  return fields;
}

function hasEnvelope(namespace: string, id: EnvelopeId): boolean {
  try {
    return storage()?.getItem(payloadKey(namespace, id)) != null && hasLocalIdentityVault(vaultSlot(namespace, id));
  } catch {
    return false;
  }
}

function dropEnvelope(namespace: string, id: EnvelopeId): void {
  storage()?.removeItem(payloadKey(namespace, id));
  clearLocalIdentityVault(vaultSlot(namespace, id));
  _unlocked.delete(cacheKey(namespace, id));
}

/** Encrypts and stores `fields` for `service` under `namespace`. Overwrites any previous value. */
export async function saveServiceKeys(namespace: string, service: ServiceId, fields: ServiceFields, passphrase: string): Promise<void> {
  assertService(service);
  const isNew = !hasEnvelope(namespace, service);
  await sealEnvelope(namespace, service, cleanFields(service, fields), passphrase);
  // Stable order: only a NEW key is placed first (once, at creation). Re-saving never moves it.
  if (isNew) touchKey(namespace, service);
}

/** Decrypts the stored fields. Returns null when nothing is stored; throws WRONG_PASSPHRASE on a bad passphrase. */
export async function getServiceKeys(namespace: string, service: ServiceId, passphrase: string): Promise<ServiceFields | null> {
  assertService(service);
  return openEnvelope(namespace, service, passphrase);
}

/** Whether keys are stored for this service — needs no passphrase, reveals nothing secret. */
export function hasServiceKeys(namespace: string, service: ServiceId): boolean {
  if (!isServiceId(service)) return false;
  return hasEnvelope(namespace, service);
}

export function listSavedServices(namespace: string): ServiceId[] {
  return SERVICE_IDS.filter((s) => hasServiceKeys(namespace, s));
}

export function removeServiceKeys(namespace: string, service: ServiceId): void {
  assertService(service);
  dropEnvelope(namespace, service);
  forgetKey(namespace, service);
}

// ── Custom key groups ──────────────────────────────────────────────────
// User-named groups of key/value pairs (path <user>.keys.<name>.<field>),
// sealed exactly like a service (same vault, envelope id `custom:<name>`).
// Group names, FIELD NAMES and the group's mark (icon/glyph) are kept in a small plaintext index so the
// UI can list/reopen them without the passphrase; values are only ever in
// the encrypted envelope.
export type CustomKeyId = `custom:${string}`;
const CUSTOM_INDEX_PREFIX = 'this.me.service-keys:v1:custom-index:';
const indexKey = (ns: string) => `${CUSTOM_INDEX_PREFIX}${normalizeNs(ns)}`;
export const customKeyId = (name: string): CustomKeyId => `custom:${name}`;

/** "Stripe Test" → "stripe-test"; "Stripe.Test" → "stripe.test". Lowercase [a-z0-9-] segments joined by dots. */
export function sanitizeKeyPath(raw: string): string {
  return String(raw ?? '').toLowerCase().split('.')
    .map((seg) => seg.trim().replace(/[^a-z0-9-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, ''))
    .filter(Boolean).join('.');
}

/** Words the tree uses for its own controls under any level. */
const RESERVED_SEGMENTS = new Set(['add', 'custom', 'more', 'less']);
/**
 * Field ids that may be shown in the clear (id, redirect, dates, references).
 * Token-like names stay secret even if listed here.
 */
const PUBLIC_KEY_FIELD_IDS = new Set([
  // `expiresat` is the old name of `expires` (saved before the rename); kept so old keys still show.
  'id', 'redirect', 'expires', 'expiresat', 'scopes', 'userid', 'page',
  // Public profile of meta.user / each Page (name, picture) and each Instagram account (username, picture).
  'name', 'picture', 'username',
  'instagram-business-account', 'error', 'status',
]);

function isAlwaysSecretField(id: string): boolean {
  return /^(secret|token|password|key|auth|appsecret|accesstoken)(-|$)/.test(id)
    || id.endsWith('-token') || id.endsWith('-secret') || id.endsWith('-password') || id.endsWith('-key');
}

/** Whether a field may display as plain text. Secrets (token, secret, …) never qualify. */
export function isPublicKeyField(id: string): boolean {
  const n = sanitizeKeyPath(id);
  return !!n && PUBLIC_KEY_FIELD_IDS.has(n) && !isAlwaysSecretField(n);
}

export type KeyNotice = 'ok' | 'expiring' | 'dead' | 'disconnected';

/** A group's public expiry date: `expires`, or the old `expiresAt` (stored lowercased as `expiresat`). */
export function keyExpires(publicValues?: Record<string, string>): string | undefined {
  return publicValues?.expires || publicValues?.expiresat || undefined;
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function cleanKeyNotice(value: unknown): KeyNotice | undefined {
  return value === 'ok' || value === 'expiring' || value === 'dead' || value === 'disconnected' ? value : undefined;
}

/** Public status badge for a group: dead (error 190) > disconnected > expiring (< 7 days or already past). */
export function keyNoticeFromGroup(
  group: { status?: KeyNotice; publicValues?: Record<string, string> },
  now = Date.now(),
): Exclude<KeyNotice, 'ok'> | undefined {
  const st = (group.status || group.publicValues?.status || '').toLowerCase();
  const err = String(group.publicValues?.error ?? '').trim();
  if (st === 'dead' || err === '190') return 'dead';
  if (st === 'disconnected' || st === 'not-connected' || st === 'not_connected') return 'disconnected';
  // A stored "expiring" flag is only a hint when there is no date; the date wins so a badge
  // can clear (or appear) without rewriting the index.
  const exp = keyExpires(group.publicValues);
  if (exp) {
    const t = Date.parse(exp);
    if (Number.isFinite(t) && t - now < WEEK_MS) return 'expiring';
    return undefined;
  }
  if (st === 'expiring') return 'expiring';
  return undefined;
}

function cleanPublicValues(raw: unknown, publicIds?: string[]): Record<string, string> | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const allow = new Set((publicIds ?? Object.keys(raw as object)).map((k) => sanitizeKeyPath(k)).filter(isPublicKeyField));
  const out: Record<string, string> = {};
  for (const [k, val] of Object.entries(raw as Record<string, unknown>)) {
    const id = sanitizeKeyPath(k);
    if (allow.has(id) && typeof val === 'string' && val.trim()) out[id] = val.trim();
  }
  return Object.keys(out).length ? out : undefined;
}

/**
 * A custom name is a path under `keys` too. It may live INSIDE a built-in group
 * (`meta.mine`, `dev.deno`) or under a built-in leaf (`meta.facebook.<page>` —
 * the leaf becomes a group of accounts). It may not be a built-in group itself
 * (`meta`), a built-in leaf (`meta.instagram`), or a bare legacy id.
 */
function assertCustomName(name: string): void {
  if (!name || sanitizeKeyPath(name) !== name) throw new Error('INVALID_KEY_NAME');
  if (name.split('.').some((seg) => RESERVED_SEGMENTS.has(seg)) || isServiceId(name)) throw new Error('RESERVED_KEY_NAME');
  for (const d of SERVICE_DEFINITIONS) {
    if (name === d.path || d.path.startsWith(`${name}.`)) throw new Error('RESERVED_KEY_NAME');
  }
}

/** A custom group's mark: an icon token from the GUI icon set, or one typed glyph — any single grapheme: a symbol (★ ∆), an emoji incl. ZWJ / skin tone / variation selectors (🔑 👩‍💻 ❤️), or an astral-plane script char like an Egyptian hieroglyph (𓂀). Non-secret metadata. */
export type CustomKeyMark = { kind: 'icon'; name: string } | { kind: 'glyph'; value: string };
/**
 * Public display info for a group, kept apart from its fields (e.g. meta.app's name + icon from Facebook).
 * Lives only in the index: saving the group's fields never drops it, and it never touches the encrypted values.
 */
export type CustomKeyDisplay = { name?: string; picture?: string };
type IndexEntry = { fields: string[]; mark?: CustomKeyMark; public?: string[]; publicValues?: Record<string, string>; status?: KeyNotice; display?: CustomKeyDisplay };

/** Validates display info: a short name, and an https (or inline data: image) picture URL. Never a secret. */
export function cleanCustomKeyDisplay(raw: unknown): CustomKeyDisplay | undefined {
  const d = raw as CustomKeyDisplay | null | undefined;
  if (!d || typeof d !== 'object') return undefined;
  const name = typeof d.name === 'string' ? d.name.trim().slice(0, 120) : '';
  let picture = '';
  if (typeof d.picture === 'string' && d.picture.length <= 2048) {
    try { if (new URL(d.picture).protocol === 'https:') picture = d.picture; } catch { /* drop */ }
    if (!picture && /^data:image\/(png|jpeg|webp|svg\+xml)[;,]/.test(d.picture)) picture = d.picture;
  }
  if (!name && !picture) return undefined;
  return { ...(name ? { name } : {}), ...(picture ? { picture } : {}) };
}

/** Max code points kept for one glyph (long ZWJ families fit; never cuts a surrogate pair). */
const GLYPH_MAX_CODE_POINTS = 16;

/** User-perceived characters (grapheme clusters). Intl.Segmenter when available, else code points (astral-safe). */
export function graphemes(raw: string): string[] {
  const text = String(raw ?? '');
  const Seg = (Intl as any).Segmenter;
  if (Seg) return Array.from(new Seg(undefined, { granularity: 'grapheme' }).segment(text) as Iterable<{ segment: string }>, (s) => s.segment);
  return Array.from(text);
}
const capGlyph = (g: string) => Array.from(g).slice(0, GLYPH_MAX_CODE_POINTS).join('');

/** First user-perceived character of `raw` (emoji / hieroglyph safe), or ''. */
export function firstGlyph(raw: string): string {
  const g = graphemes(String(raw ?? '').trim()).find((s) => s.trim());
  return g ? capGlyph(g) : '';
}

/** Last user-perceived character of `raw` (typing over a glyph replaces it), or ''. */
export function lastGlyph(raw: string): string {
  const list = graphemes(String(raw ?? '').trim()).filter((s) => s.trim());
  return list.length ? capGlyph(list[list.length - 1]) : '';
}

/** Validates a mark; returns undefined for anything unusable. */
export function cleanCustomKeyMark(mark: unknown): CustomKeyMark | undefined {
  const m = mark as CustomKeyMark | null | undefined;
  if (m?.kind === 'icon' && typeof m.name === 'string' && /^[a-z0-9_]{1,40}$/.test(m.name)) return { kind: 'icon', name: m.name };
  if (m?.kind === 'glyph' && typeof m.value === 'string') { const g = firstGlyph(m.value); if (g) return { kind: 'glyph', value: g }; }
  return undefined;
}

function readIndex(namespace: string): Record<string, IndexEntry> {
  let raw: Record<string, unknown> = {};
  try { raw = JSON.parse(storage()?.getItem(indexKey(namespace)) ?? '{}') ?? {}; } catch { return {}; }
  const out: Record<string, IndexEntry> = {};
  for (const [name, v] of Object.entries(raw)) {
    // v1 index stored just the field-name array.
    if (Array.isArray(v)) out[name] = { fields: v.map(String) };
    else if (v && typeof v === 'object' && Array.isArray((v as any).fields)) {
      const mark = cleanCustomKeyMark((v as any).mark);
      const publicValues = cleanPublicValues((v as any).publicValues, Array.isArray((v as any).public) ? (v as any).public.map(String) : undefined);
      const status = cleanKeyNotice((v as any).status);
      const display = cleanCustomKeyDisplay((v as any).display);
      out[name] = {
        fields: (v as any).fields.map(String),
        ...(mark ? { mark } : {}),
        ...(publicValues ? { public: Object.keys(publicValues), publicValues } : {}),
        ...(status && status !== 'ok' ? { status } : {}),
        ...(display ? { display } : {}),
      };
    }
  }
  return out;
}
function writeIndex(namespace: string, index: Record<string, IndexEntry>): void {
  const store = storage(); if (!store) return;
  if (Object.keys(index).length === 0) store.removeItem(indexKey(namespace));
  else store.setItem(indexKey(namespace), JSON.stringify(index));
}

/** Encrypts a custom group. Field names are sanitized; empty values are dropped. Replaces any previous fields. */
/** Optional public metadata written next to a custom group (never contains secrets). */
export type SaveCustomMeta = { publicFields?: readonly string[]; status?: KeyNotice | null };

export async function saveCustomKeys(
  namespace: string, name: string, fields: ServiceFields, passphrase: string,
  /** undefined keeps the previous mark; null clears it. */
  mark?: CustomKeyMark | null,
  meta?: SaveCustomMeta,
): Promise<void> {
  assertCustomName(name);
  const clean: ServiceFields = {};
  for (const [k, v] of Object.entries(fields)) {
    const id = sanitizeKeyPath(k); const val = String(v ?? '').trim();
    if (id && val) clean[id] = val;
  }
  const isNew = !hasEnvelope(namespace, customKeyId(name));
  await sealEnvelope(namespace, customKeyId(name), clean, passphrase);
  const index = readIndex(namespace);
  const nextMark = mark === undefined ? index[name]?.mark : cleanCustomKeyMark(mark);
  const inferredPublic = Object.keys(clean).filter(isPublicKeyField);
  const publicIds = (meta?.publicFields ?? inferredPublic).map((k) => sanitizeKeyPath(k)).filter(isPublicKeyField);
  const publicValues = cleanPublicValues(
    Object.fromEntries(publicIds.filter((id) => clean[id]).map((id) => [id, clean[id]])),
    publicIds,
  );
  const status = meta?.status === undefined ? keyNoticeFromGroup({ publicValues }) : (meta.status || undefined);
  writeIndex(namespace, { ...index, [name]: {
    fields: Object.keys(clean),
    ...(nextMark ? { mark: nextMark } : {}),
    ...(publicValues ? { public: Object.keys(publicValues), publicValues } : {}),
    ...(status && status !== 'ok' ? { status } : {}),
    ...(index[name]?.display ? { display: index[name].display } : {}), // display info survives re-saving fields
  } });
  if (isNew) touchKey(namespace, customKeyId(name)); // new only: re-saving never moves it
}

export async function getCustomKeys(namespace: string, name: string, passphrase: string): Promise<ServiceFields | null> {
  assertCustomName(name);
  return openEnvelope(namespace, customKeyId(name), passphrase);
}

export function hasCustomKeys(namespace: string, name: string): boolean {
  try { assertCustomName(name); } catch { return false; }
  return hasEnvelope(namespace, customKeyId(name));
}

/** Saved custom groups and their field names (no values, no passphrase needed). */
export type CustomKeyGroup = { name: string; fields: string[]; mark?: CustomKeyMark; publicValues?: Record<string, string>; status?: KeyNotice; display?: CustomKeyDisplay };
export function listCustomKeyGroups(namespace: string): CustomKeyGroup[] {
  return Object.entries(readIndex(namespace))
    .filter(([name]) => hasCustomKeys(namespace, name))
    .map(([name, e]) => ({
      name, fields: [...e.fields],
      ...(e.mark ? { mark: e.mark } : {}),
      ...(e.publicValues ? { publicValues: { ...e.publicValues } } : {}),
      ...(e.status ? { status: e.status } : {}),
      ...(e.display ? { display: { ...e.display } } : {}),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Public status only (disconnected / dead). Does not open the envelope or touch secrets. */
export function setCustomKeyStatus(namespace: string, name: string, status: KeyNotice | null): void {
  assertCustomName(name);
  const index = readIndex(namespace);
  const cur = index[name];
  if (!cur) return;
  const publicValues = { ...(cur.publicValues || {}) };
  if (!status || status === 'ok') {
    delete publicValues.status;
    const next: IndexEntry = { fields: cur.fields, ...(cur.mark ? { mark: cur.mark } : {}), ...(Object.keys(publicValues).length ? { public: Object.keys(publicValues), publicValues } : {}), ...(cur.display ? { display: cur.display } : {}) };
    writeIndex(namespace, { ...index, [name]: next });
    return;
  }
  publicValues.status = status;
  writeIndex(namespace, { ...index, [name]: {
    fields: cur.fields,
    ...(cur.mark ? { mark: cur.mark } : {}),
    public: Object.keys(publicValues),
    publicValues,
    status,
    ...(cur.display ? { display: cur.display } : {}),
  } });
}

/** Public display info only (name / picture). Does not open the envelope or touch any field value. null clears it. */
export function setCustomKeyDisplay(namespace: string, name: string, display: CustomKeyDisplay | null): void {
  assertCustomName(name);
  const index = readIndex(namespace);
  const cur = index[name];
  if (!cur) return;
  const clean = display ? cleanCustomKeyDisplay(display) : undefined;
  const { display: _old, ...rest } = cur;
  writeIndex(namespace, { ...index, [name]: { ...rest, ...(clean ? { display: clean } : {}) } });
}

export function removeCustomKeys(namespace: string, name: string): void {
  assertCustomName(name);
  dropEnvelope(namespace, customKeyId(name));
  forgetKey(namespace, customKeyId(name));
  const index = readIndex(namespace); delete index[name]; writeIndex(namespace, index);
}

/** Fields decrypted earlier in this page's life (save or get), or null. Memory only. */
export function getUnlockedServiceKeys(namespace: string, service: ServiceId | CustomKeyId): ServiceFields | null {
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

/**
 * OBS WebSocket connection settings from decrypted Twitch fields, applying
 * host/port defaults. Returns null when no OBS field was saved.
 */
export function obsConnectionFromTwitch(fields: ServiceFields | null | undefined): { host: string; port: number; password?: string } | null {
  if (!fields || !(fields.obsHost || fields.obsPort || fields.obsPassword)) return null;
  const port = Number.parseInt(fields.obsPort || OBS_DEFAULTS.port, 10);
  return {
    host: fields.obsHost || OBS_DEFAULTS.host,
    port: Number.isFinite(port) ? port : Number(OBS_DEFAULTS.port),
    ...(fields.obsPassword ? { password: fields.obsPassword } : {}),
  };
}
