// keyPaths.ts — the semantic .me path each service key lives at. The keys
// tree reads exactly like these paths, one level per segment:
//
//   keys.meta.instagram.app.secret      keys.paypal.sandbox.client.id
//   keys.dev.github.token               keys.twitch.api.client.id
//
// The leaf (e.g. `meta.instagram`) comes from SERVICE_DEFINITIONS[].path; the
// field part from FIELD_PATHS. serviceKeyVault.ts still seals ONE encrypted
// envelope per leaf (slot named by its stable ServiceId) with the flat field
// ids inside; this map addresses those same values by path and never touches
// them. Paths used before the tree had levels (keys.paypal.sandbox.api.client.id,
// keys.facebook.app.id, keys.github.api.token …) still resolve: LEGACY_* below.
import { SERVICE_DEFINITIONS, type ServiceId } from './serviceKeyVault';

/** Leaf path under `keys` for each service. */
export const SERVICE_PATHS = Object.fromEntries(SERVICE_DEFINITIONS.map((d) => [d.id, d.path])) as Record<ServiceId, string>;

/** Field id → path under the leaf. */
export const FIELD_PATHS: Record<ServiceId, Record<string, string>> = {
  twitch: { clientId: 'api.client.id', clientSecret: 'api.client.secret', channel: 'channel', obsHost: 'obs.host', obsPort: 'obs.port', obsPassword: 'obs.password' },
  paypal: { clientId: 'client.id', clientSecret: 'client.secret' },
  paypalLive: { clientId: 'client.id', clientSecret: 'client.secret' },
  meta: { apiKey: 'api.key' },
  facebook: { appId: 'app.id', appSecret: 'app.secret', pageAccessToken: 'page.token' },
  instagram: { appId: 'app.id', appSecret: 'app.secret' },
  threads: { appId: 'app.id', appSecret: 'app.secret' },
  whatsapp: { appId: 'app.id', appSecret: 'app.secret', accessToken: 'api.token', phoneNumberId: 'phone.id', businessAccountId: 'business.id' },
  google: { clientId: 'oauth.client.id', clientSecret: 'oauth.client.secret', apiKey: 'api.key' },
  openai: { apiKey: 'api.key', organization: 'org.id', project: 'project.id' },
  linkedin: { clientId: 'api.client.id', clientSecret: 'api.client.secret' },
  grok: { apiKey: 'api.key' },
  github: { token: 'token' },
  npm: { token: 'token' },
  sms: { accountSid: 'account.sid', authToken: 'auth.token', fromNumber: 'from' },
};

/** Where services lived before the tree had levels (aliases: still resolve to the same slot). */
export const LEGACY_SERVICE_PATHS: Partial<Record<ServiceId, string>> = {
  paypal: 'paypal.sandbox', meta: 'meta', grok: 'xai.grok', github: 'github',
  facebook: 'facebook', whatsapp: 'whatsapp', openai: 'openai',
};
export const LEGACY_FIELD_PATHS: Partial<Record<ServiceId, Record<string, string>>> = {
  paypal: { clientId: 'api.client.id', clientSecret: 'api.client.secret' },
  github: { token: 'api.token' },
};

const camelToDots = (id: string) => id.replace(/([a-z0-9])([A-Z])/g, '$1.$2').toLowerCase();

export const KEYS_ROOT = 'keys';

/** `keys.paypal.sandbox` */
export function servicePath(service: ServiceId): string {
  return `${KEYS_ROOT}.${SERVICE_PATHS[service]}`;
}

/** `keys.paypal.sandbox.client.id` (unknown fields fall back to camelCase → dots). */
export function fieldPath(service: ServiceId, fieldId: string): string {
  return `${servicePath(service)}.${FIELD_PATHS[service]?.[fieldId] ?? camelToDots(fieldId)}`;
}

/** Every mapped path, for docs/tests: [service, fieldId, path][]. */
export function allKeyPaths(): Array<[ServiceId, string, string]> {
  return SERVICE_DEFINITIONS.flatMap((d) => d.fields.map((f) => [d.id, f.id, fieldPath(d.id, f.id)] as [ServiceId, string, string]));
}

export type ResolvedKeyPath = { service: ServiceId; fieldId?: string; legacy: boolean };

/**
 * A path → the vault slot (and field) it addresses. Accepts `keys.…`,
 * `<user>.keys.…` or `me.keys.…`; a leaf path without a field returns just
 * the service. Current paths win; legacy ones still resolve (`legacy: true`).
 * Addressing only: nothing here reads a value.
 */
export function resolveKeyPath(raw: string): ResolvedKeyPath | null {
  const segs = String(raw ?? '').trim().toLowerCase().split('.').filter(Boolean);
  const at = segs.indexOf(KEYS_ROOT);
  const rest = (at >= 0 ? segs.slice(at + 1) : segs).join('.');
  if (!rest) return null;
  const tryTable = (leafOf: (d: (typeof SERVICE_DEFINITIONS)[number]) => string | undefined, fieldsOf: (id: ServiceId) => Record<string, string> | undefined, legacy: boolean): ResolvedKeyPath | null => {
    for (const d of SERVICE_DEFINITIONS) {
      const leaf = leafOf(d); if (!leaf) continue;
      if (rest === leaf) {
        // `keys.meta` is a group level now, not the old Meta leaf.
        if (legacy && SERVICE_DEFINITIONS.some((x) => x.path.startsWith(`${rest}.`))) continue;
        return { service: d.id, legacy };
      }
      if (!rest.startsWith(`${leaf}.`)) continue;
      const tail = rest.slice(leaf.length + 1);
      for (const f of d.fields) {
        const p = fieldsOf(d.id)?.[f.id] ?? (legacy ? undefined : camelToDots(f.id));
        if (p === tail) return { service: d.id, fieldId: f.id, legacy };
      }
    }
    return null;
  };
  return tryTable((d) => d.path, (id) => FIELD_PATHS[id], false)
    ?? tryTable((d) => LEGACY_SERVICE_PATHS[d.id], (id) => ({ ...FIELD_PATHS[id], ...LEGACY_FIELD_PATHS[id] }), true);
}
