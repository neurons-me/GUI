import { readMeValue, writeMeValue } from '@/runtime/run-me';
import type {
  AccessKernelContext,
  AccessRequest,
  AccessScope,
  NormalizedAccessRequest,
  ScopeValidationResult,
} from './types';

const DEFAULT_ACCESS_TTL_MS = 1000 * 60 * 60;
const PIN_VERIFIED_AT_PATH = 'runtime.cleaker.pinVerifiedAt';
const PIN_VERIFIED_LEGACY_PATH = 'runtime.cleaker.pin_verified';

export const ACCESS_UI_ROOT = 'ui.cleaker.access';
export const ACCESS_RUNTIME_ROOT = 'runtime.cleaker.access';

export const CLEAKER_LOGOUT_CLEAR_FIELDS: Array<{ path: string; value: any }> = [
  { path: 'username', value: null },
  { path: 'name',     value: null },
  { path: 'avatar',   value: null },
  { path: 'bio',      value: null },
  { path: 'email',    value: null },
  { path: 'phone',    value: null },
  { path: 'auth.claimed_at', value: null },
  { path: 'auth.keys', value: null },
  { path: 'identity.session.username', value: '' },
  { path: 'identity.session.draftUsername', value: '' },
  { path: 'identity.session.authenticated', value: false },
  { path: 'identity.session.identityHash', value: '' },
  { path: 'identity.session.hasSecret', value: false },
  { path: 'identity.session.namespace', value: '' },
  { path: 'identity.session.openedAt', value: null },
  { path: 'identity.session.note', value: '' },
  { path: 'runtime.cleaker.auth.status', value: 'idle' },
  { path: 'runtime.cleaker.auth.error', value: null },
  { path: 'runtime.cleaker.auth.successMessage', value: null },
  { path: 'runtime.cleaker.auth.progressMessage', value: null },
  { path: 'runtime.cleaker.auth.claimed', value: false },
  { path: 'runtime.cleaker.auth.claimResolution', value: 'idle' },
  { path: 'runtime.cleaker.pinVerifiedAt', value: null },
  { path: 'runtime.cleaker.pin_verified', value: false },
  { path: 'runtime.cleaker.namespace.identity', value: '' },
  { path: `${ACCESS_RUNTIME_ROOT}.lastAppName`, value: '' },
  { path: `${ACCESS_RUNTIME_ROOT}.lastIssuedAt`, value: null },
  { path: `${ACCESS_RUNTIME_ROOT}.lastExpiresAt`, value: null },
  { path: `${ACCESS_RUNTIME_ROOT}.lastGrantedScopes`, value: [] },
  { path: `${ACCESS_RUNTIME_ROOT}.lastDeniedScopes`, value: [] },
  { path: `${ACCESS_RUNTIME_ROOT}.lastStatus`, value: 'idle' },
  { path: `${ACCESS_RUNTIME_ROOT}.lastError`, value: null },
  { path: `${ACCESS_UI_ROOT}.pending`, value: false },
  { path: `${ACCESS_UI_ROOT}.appName`, value: '' },
  { path: `${ACCESS_UI_ROOT}.reason`, value: '' },
  { path: `${ACCESS_UI_ROOT}.requestedScopes`, value: [] },
  { path: `${ACCESS_UI_ROOT}.grantedScopes`, value: [] },
  { path: `${ACCESS_UI_ROOT}.deniedScopes`, value: [] },
  { path: `${ACCESS_UI_ROOT}.requirePin`, value: false },
  { path: 'ui.cleaker.settingsOpen', value: false },
  { path: 'ui.cleaker.registerOpen', value: false },
  { path: 'ui.cleaker.avatarExpanded', value: false },
  { path: 'ui.cleaker.showSecret', value: false },
  { path: 'ui.cleaker.viewMode', value: 'login' },
];

export function normalizeAccessRequest(request: AccessRequest): NormalizedAccessRequest {
  const appName = String(request?.appName || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '-');

  const requestedScopes = uniqueStrings(request?.requestedScopes || []).map((scope) =>
    normalizeRequestedScope(scope)
  );

  const ttlMs = Number(request?.ttlMs);
  const normalizedTtlMs =
    Number.isFinite(ttlMs) && ttlMs > 0 ? Math.min(ttlMs, 1000 * 60 * 60 * 24) : DEFAULT_ACCESS_TTL_MS;

  return {
    appName,
    requestedScopes,
    reason: String(request?.reason || '').trim(),
    requirePin: request?.requirePin !== false,
    ttlMs: normalizedTtlMs,
  };
}

export function readKernelString(ctx: AccessKernelContext, path: string): string {
  try {
    const value = readMeValue(ctx.me, path, { allowBarePath: true });
    return typeof value === 'string' ? value.trim() : String(value || '').trim();
  } catch {
    return '';
  }
}

export function readKernelNumber(ctx: AccessKernelContext, path: string): number | null {
  try {
    const value = Number(readMeValue(ctx.me, path, { allowBarePath: true }));
    return Number.isFinite(value) && value > 0 ? value : null;
  } catch {
    return null;
  }
}

export function readKernelBoolean(ctx: AccessKernelContext, path: string): boolean {
  try {
    return Boolean(readMeValue(ctx.me, path, { allowBarePath: true }));
  } catch {
    return false;
  }
}

export function readKernelValue<T = any>(ctx: AccessKernelContext, path: string): T | undefined {
  try {
    return readMeValue(ctx.me, path, { allowBarePath: true }) as T;
  } catch {
    return undefined;
  }
}

export function writeKernelValue(ctx: AccessKernelContext, path: string, value: any): void {
  writeMeValue(ctx.me, path, value, { allowBarePath: true });
  ctx.runtime?.notify?.(path);
}

export function writeKernelEntries(
  ctx: AccessKernelContext,
  entries: Array<{ path: string; value: any }>
): void {
  for (const entry of entries) {
    writeKernelValue(ctx, entry.path, entry.value);
  }
}

export function stageAccessRequest(
  ctx: AccessKernelContext,
  request: NormalizedAccessRequest,
  next: Partial<{
    grantedScopes: AccessScope[];
    deniedScopes: AccessScope[];
    pending: boolean;
  }> = {}
): void {
  writeKernelEntries(ctx, [
    { path: `${ACCESS_UI_ROOT}.pending`, value: next.pending ?? true },
    { path: `${ACCESS_UI_ROOT}.appName`, value: request.appName },
    { path: `${ACCESS_UI_ROOT}.reason`, value: request.reason },
    { path: `${ACCESS_UI_ROOT}.requestedScopes`, value: request.requestedScopes },
    { path: `${ACCESS_UI_ROOT}.grantedScopes`, value: next.grantedScopes ?? [] },
    { path: `${ACCESS_UI_ROOT}.deniedScopes`, value: next.deniedScopes ?? [] },
    { path: `${ACCESS_UI_ROOT}.requirePin`, value: request.requirePin },
  ]);
}

export function finalizeAccessRequest(
  ctx: AccessKernelContext,
  status: 'granted' | 'denied' | 'error',
  input: {
    appName: string;
    grantedScopes?: AccessScope[];
    deniedScopes?: AccessScope[];
    issuedAt?: number | null;
    expiresAt?: number | null;
    error?: string | null;
  }
): void {
  writeKernelEntries(ctx, [
    { path: `${ACCESS_UI_ROOT}.pending`, value: false },
    { path: `${ACCESS_UI_ROOT}.grantedScopes`, value: input.grantedScopes ?? [] },
    { path: `${ACCESS_UI_ROOT}.deniedScopes`, value: input.deniedScopes ?? [] },
    { path: `${ACCESS_RUNTIME_ROOT}.lastStatus`, value: status },
    { path: `${ACCESS_RUNTIME_ROOT}.lastAppName`, value: input.appName },
    { path: `${ACCESS_RUNTIME_ROOT}.lastGrantedScopes`, value: input.grantedScopes ?? [] },
    { path: `${ACCESS_RUNTIME_ROOT}.lastDeniedScopes`, value: input.deniedScopes ?? [] },
    { path: `${ACCESS_RUNTIME_ROOT}.lastIssuedAt`, value: input.issuedAt ?? null },
    { path: `${ACCESS_RUNTIME_ROOT}.lastExpiresAt`, value: input.expiresAt ?? null },
    { path: `${ACCESS_RUNTIME_ROOT}.lastError`, value: input.error ?? null },
  ]);
}

export function readPinVerified(ctx: AccessKernelContext): boolean {
  return Boolean(readKernelNumber(ctx, PIN_VERIFIED_AT_PATH) || readKernelBoolean(ctx, PIN_VERIFIED_LEGACY_PATH));
}

export function normalizeRequestedScope(scope: string): string {
  const value = String(scope || '').trim();
  if (!value) return '';
  if (value === 'username') return 'username';
  if (value === 'name') return 'name';
  if (value === 'avatar') return 'avatar';
  if (value === 'bio') return 'bio';
  if (value === 'email') return 'email';
  if (value === 'phone') return 'phone';
  if (value === 'namespace') return 'identity.session.namespace';
  return value.replace(/^me\./, '');
}

export function defaultValidateScopes(
  requestedScopes: AccessScope[],
  appName: string,
  availableAuthKeys: Record<string, unknown> | null | undefined
): ScopeValidationResult {
  const grantedScopes: AccessScope[] = [];
  const deniedScopes: AccessScope[] = [];

  const authKeys = availableAuthKeys && typeof availableAuthKeys === 'object' ? availableAuthKeys : {};
  const authKeyPaths = flattenKeyPaths(authKeys, 'auth.keys');

  for (const rawScope of requestedScopes) {
    const scope = normalizeRequestedScope(rawScope);
    if (!scope) continue;

    if (
      scope === 'username' ||
      scope === 'name' ||
      scope === 'avatar' ||
      scope === 'bio' ||
      scope === 'email' ||
      scope === 'phone' ||
      scope === 'identity.session.namespace'
    ) {
      grantedScopes.push(scope);
      continue;
    }

    if (scope.startsWith(`keys.${appName}.`) || scope === `keys.${appName}`) {
      const authScope = `auth.${scope}`;
      if (authKeyPaths.has(authScope) || authKeyPaths.has(`${authScope}.*`)) {
        grantedScopes.push(scope);
      } else {
        deniedScopes.push(scope);
      }
      continue;
    }

    if (scope.startsWith(`auth.keys.${appName}.`) || scope === `auth.keys.${appName}`) {
      if (authKeyPaths.has(scope) || authKeyPaths.has(`${scope}.*`)) {
        grantedScopes.push(scope);
      } else {
        deniedScopes.push(scope);
      }
      continue;
    }

    deniedScopes.push(scope);
  }

  return {
    grantedScopes: uniqueStrings(grantedScopes),
    deniedScopes: uniqueStrings(deniedScopes),
  };
}

export function generateEphemeralToken(appName: string, issuedAt: number): string {
  const slug = String(appName || 'app').trim().toLowerCase() || 'app';
  const randomPart = typeof globalThis.crypto?.randomUUID === 'function'
    ? globalThis.crypto.randomUUID().replace(/-/g, '')
    : Math.random().toString(36).slice(2, 14);
  return `cleaker_${slug}_${issuedAt}_${randomPart}`;
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(
    new Set(
      values
        .map((value) => String(value || '').trim())
        .filter(Boolean)
    )
  );
}

function flattenKeyPaths(value: Record<string, unknown>, prefix: string): Set<string> {
  const paths = new Set<string>();

  const visit = (entry: unknown, path: string) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      if (path) paths.add(path);
      return;
    }

    const keys = Object.keys(entry as Record<string, unknown>);
    if (keys.length === 0) {
      paths.add(path);
      return;
    }

    paths.add(`${path}.*`);
    for (const key of keys) {
      visit((entry as Record<string, unknown>)[key], `${path}.${key}`);
    }
  };

  visit(value, prefix);
  return paths;
}
