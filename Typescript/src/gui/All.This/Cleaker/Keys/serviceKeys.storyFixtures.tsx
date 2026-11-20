// serviceKeys.storyFixtures.tsx — Storybook-only seeding for service keys.
// Uses the REAL serviceKeyVault against this browser's localStorage under
// the demo namespace `storybook.demo`; every seeded value is a fake.
import * as React from 'react';
import {
  hasCustomKeys, hasServiceKeys, listCustomKeyGroups, listSavedServices, removeCustomKeys, removeServiceKeys,
  saveCustomKeys, saveServiceKeys, setCustomKeyDisplay, SERVICE_IDS,
  type CustomKeyDisplay, type CustomKeyGroup, type CustomKeyMark, type KeyNotice, type ServiceFields, type ServiceId,
} from './serviceKeyVault';
import { clearKeyOrder } from './keyOrder';
import { IdentityTreeSeedCtx } from '../IdentityTree';

export const DEMO_NS = 'storybook.demo';
export const DEMO_PASS = 'storybook-demo-passphrase';

export function demoServiceFields(s: ServiceId): ServiceFields {
  return s === 'meta' || s === 'openai' || s === 'grok' ? { apiKey: 'demo-not-a-real-key' }
    : s === 'github' || s === 'npm' ? { token: 'demo-token' }
    : s === 'facebook' || s === 'instagram' || s === 'threads' ? { appId: 'demo-app', appSecret: 'demo-secret' }
    : s === 'whatsapp' ? { appId: 'demo-app', appSecret: 'demo-secret', accessToken: 'demo-token', phoneNumberId: '000' }
    : s === 'sms' ? { accountSid: 'ACdemo', authToken: 'demo', fromNumber: '+10000000000' }
    : s === 'google' ? { clientId: 'demo-id.apps.example', clientSecret: 'demo-secret' }
    : { clientId: 'demo-id', clientSecret: 'demo-secret', channel: 'demo' };
}

export type DemoCustomGroup = {
  name: string; fields: string[]; mark?: CustomKeyMark;
  /** Non-secret values shown in the clear (id, redirect, expires, page, …). */
  publicValues?: Record<string, string>;
  /** Explicit badge: disconnected page, dead token (error 190), … */
  status?: KeyNotice;
  /** Override fake secret values (still encrypted; never real credentials). */
  values?: Record<string, string>;
  /** Public display info beside the fields (meta.app: the App's name + icon). */
  display?: CustomKeyDisplay;
};

/** A long demo collection: custom groups with fake values (for paging stories). */
export const DEMO_CUSTOM_GROUPS: DemoCustomGroup[] = [
  { name: 'myapi', fields: ['token'], mark: { kind: 'glyph', value: '★' } },
  { name: 'stripe.test', fields: ['secret-key', 'publishable'], mark: { kind: 'icon', name: 'payments' } },
  { name: 'home-wifi', fields: ['password'], mark: { kind: 'icon', name: 'home' } },
  { name: 'db.prod', fields: ['url', 'password'], mark: { kind: 'icon', name: 'database' } },
  { name: 'deploy', fields: ['token'], mark: { kind: 'glyph', value: '∆' } },
  { name: 'vault', fields: ['key'], mark: { kind: 'glyph', value: '🔑' } },   // emoji keeps its own color
  { name: 'horus', fields: ['seal'], mark: { kind: 'glyph', value: '𓂀' } },    // U+13080 Egyptian hieroglyph (astral plane)
];

/** A neutral placeholder profile picture (inline, no network, no real person). */
const DEMO_PROFILE_PICTURE = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">'
  + '<stop offset="0" stop-color="#6fc7b5"/><stop offset="1" stop-color="#3d6fa8"/></linearGradient></defs>'
  + '<rect width="64" height="64" fill="url(#g)"/><text x="32" y="41" text-anchor="middle" font-family="system-ui,sans-serif" '
  + 'font-size="26" font-weight="600" fill="#ffffff">DP</text></svg>',
)}`;

/** Neutral placeholder Page / account photos (inline, no network). */
const demoPicture = (text: string, a: string, b: string) => `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">`
  + `<stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>`
  + `<rect width="64" height="64" fill="url(#g)"/><text x="32" y="41" text-anchor="middle" font-family="system-ui,sans-serif" `
  + `font-size="24" font-weight="600" fill="#ffffff">${text}</text></svg>`,
)}`;
const DEMO_PAGE_PICTURE = demoPicture('N', '#3d6fa8', '#24324a');
const DEMO_PAGE_PICTURE_2 = demoPicture('BT', '#d08a3c', '#8a3c2c');
const DEMO_IG_PICTURE = demoPicture('n', '#c04c8a', '#e0a040');

const FB_SCOPES = 'pages_show_list, pages_read_engagement, pages_manage_posts, instagram_basic, instagram_content_publish';

/** Shared Meta app + user + a few Pages/accounts (Fase 1). Pages unfold from me/accounts; these are fixtures only. */
export const META_KEY_GROUPS: DemoCustomGroup[] = [
  {
    name: 'meta.app', fields: ['id', 'secret', 'redirect'], mark: { kind: 'icon', name: 'apps' },
    publicValues: { id: '123456789', redirect: 'https://cleaker.me/oauth/callback' },
    display: { name: 'Demo App', picture: demoPicture('A', '#5b5fc7', '#2b2d6b') },
  },
  {
    name: 'meta.user', fields: ['token', 'expires', 'scopes', 'id', 'name', 'picture'], mark: { kind: 'icon', name: 'account_circle' },
    publicValues: { expires: '2026-12-15', scopes: FB_SCOPES, id: '100000000000001', name: 'Demo Person', picture: DEMO_PROFILE_PICTURE },
  },
  {
    name: 'meta.facebook.elbuentono', fields: ['id', 'token', 'name', 'picture', 'instagram_business_account'],
    publicValues: { id: '111111', name: 'El Buen Tono', picture: DEMO_PAGE_PICTURE_2, instagram_business_account: '178410000000001' },
  },
  {
    name: 'meta.facebook.neuronsme', fields: ['id', 'token', 'name', 'picture', 'instagram_business_account'],
    publicValues: { id: '222222', name: 'neurons.me', picture: DEMO_PAGE_PICTURE, instagram_business_account: '178420000000002' },
  },
  {
    name: 'meta.facebook.archivo', fields: ['id', 'token', 'status'],
    publicValues: { id: '333333', status: 'disconnected' },
    status: 'disconnected',
  },
  {
    name: 'meta.facebook.vieja', fields: ['id', 'token', 'error'],
    publicValues: { id: '444444', error: '190' },
    status: 'dead',
  },
  {
    name: 'meta.instagram.neuronsme', fields: ['userId', 'page', 'username', 'picture'],
    publicValues: { userId: '178420000000002', page: 'facebook.neuronsme', username: 'neurons.me', picture: DEMO_IG_PICTURE },
  },
  {
    name: 'meta.threads.jabellae', fields: ['userId', 'token', 'expires'],
    publicValues: { userId: '99999', expires: '2026-11-19' },
  },
];

/** ~29 Facebook pages to prove wrap + collapse. Includes the four named pages above. */
const EXTRA_FACEBOOK_PAGES = [
  'buentonocafe', 'neuronslab', 'tallereste', 'casaroja', 'puntanorte',
  'lacantera', 'miraflores', 'sietelunas', 'alameda', 'barriosanto',
  'costera', 'elportal', 'fincavieja', 'galeria29', 'huertoalto',
  'isladelsol', 'jardincentral', 'kilometro8', 'laloma', 'mesaredonda',
  'nubegis', 'ojasucia', 'piedraluna', 'quebrada', 'rioverde',
];

export const META_MANY_PAGES: DemoCustomGroup[] = [
  ...META_KEY_GROUPS,
  ...EXTRA_FACEBOOK_PAGES.map((slug, i) => ({
    name: `meta.facebook.${slug}`,
    fields: ['id', 'token'],
    publicValues: { id: String(500000 + i) },
  })),
];

/** Whether the demo namespace already has exactly this public collection (names only, no decrypt). */
function collectionMatches(saved: readonly ServiceId[], custom: readonly DemoCustomGroup[]): boolean {
  const have = listSavedServices(DEMO_NS);
  const groups = listCustomKeyGroups(DEMO_NS);
  if (have.length !== saved.length || groups.length !== custom.length) return false;
  const haveSet = new Set(have);
  if (saved.some((s) => !haveSet.has(s))) return false;
  const byName = new Map(groups.map((g) => [g.name, g]));
  return custom.every((c) => {
    const g = byName.get(c.name);
    if (!g || c.fields.length !== g.fields.length || !c.fields.every((f) => g.fields.includes(f) || g.fields.includes(f.replace(/_/g, '-').toLowerCase()))) return false;
    if ((c.status || '') !== (g.status || '')) return false;
    if ((c.display?.name || '') !== (g.display?.name || '') || (c.display?.picture || '') !== (g.display?.picture || '')) return false;
    const want = c.publicValues || {};
    const have = g.publicValues || {};
    const norm = (k: string) => k.toLowerCase().replace(/_/g, '-');
    return Object.keys(want).every((k) => have[k] === want[k] || have[norm(k)] === want[k]);
  });
}

/**
 * Ensures the demo namespace holds `saved` + `custom`. Skips work when it
 * already matches, so opening the QR card does not re-run PBKDF2 (600k
 * iterations × every key) on each mount. The tree renders immediately via
 * IdentityTreeSeedCtx; envelopes are written in the background only when missing.
 */
async function ensureSeeded(saved: readonly ServiceId[], custom: readonly DemoCustomGroup[]): Promise<void> {
  if (collectionMatches(saved, custom)) return;
  const wantS = new Set(saved);
  const wantC = new Set(custom.map((c) => c.name));
  for (const s of SERVICE_IDS) if (hasServiceKeys(DEMO_NS, s) && !wantS.has(s)) removeServiceKeys(DEMO_NS, s);
  for (const g of listCustomKeyGroups(DEMO_NS)) if (!wantC.has(g.name)) removeCustomKeys(DEMO_NS, g.name);
  // Sequential on purpose: 22 parallel PBKDF2-600k wraps would hitch the UI thread.
  let wrote = false;
  for (const s of saved) {
    if (!hasServiceKeys(DEMO_NS, s)) {
      await saveServiceKeys(DEMO_NS, s, demoServiceFields(s), DEMO_PASS);
      wrote = true;
    }
  }
  for (const g of custom) {
    if (!hasCustomKeys(DEMO_NS, g.name)) {
      const fields = Object.fromEntries(g.fields.map((f) => [f, g.publicValues?.[f] ?? g.values?.[f] ?? `demo-${f}`]));
      await saveCustomKeys(DEMO_NS, g.name, fields, DEMO_PASS, g.mark ?? null, {
        publicFields: g.publicValues ? Object.keys(g.publicValues) : [],
        status: g.status,
      });
      wrote = true;
    }
    if (g.display) setCustomKeyDisplay(DEMO_NS, g.name, g.display);
  }
  // New keys would otherwise be MRU-prepended as they save; stories want the default order.
  if (wrote) clearKeyOrder(DEMO_NS);
}

/** Renders the tree immediately; writes missing demo envelopes in the background. */
export function Seeded({ saved, custom = [], children }: { saved: ServiceId[]; custom?: DemoCustomGroup[]; children: () => React.ReactNode }) {
  const seed = React.useMemo<{ saved: ServiceId[]; custom: CustomKeyGroup[] }>(
    () => ({ saved, custom: custom.map((g) => {
      const publicValues = g.publicValues
        ? Object.fromEntries(Object.entries(g.publicValues).map(([k, v]) => [k.toLowerCase().replace(/_/g, '-'), v]))
        : undefined;
      return {
        name: g.name, fields: [...g.fields],
        ...(g.mark ? { mark: g.mark } : {}),
        ...(publicValues ? { publicValues } : {}),
        ...(g.status ? { status: g.status } : {}),
        ...(g.display ? { display: g.display } : {}),
      };
    }) }),
    [saved.join(','), custom.map((g) => g.name).join(',')],
  );
  React.useEffect(() => {
    let live = true;
    (async () => {
      await ensureSeeded(saved, custom);
      if (!live) return;
    })();
    return () => { live = false; };
  }, [seed.saved.join(','), seed.custom.map((g) => g.name).join(',')]);
  return <IdentityTreeSeedCtx.Provider value={seed}>{children()}</IdentityTreeSeedCtx.Provider>;
}
