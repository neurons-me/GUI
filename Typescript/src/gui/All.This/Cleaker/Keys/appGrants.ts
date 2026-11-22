// appGrants.ts — scoped standing grants: "this app may get an automatic signature for THESE ops on THIS resource,
// under THIS path, until THEN". Pure functions, app-agnostic; the adapter only says which ops exist and which may
// never be automatic. A grant can never widen what an app asks for: every field has to match exactly.
import type { AppAdapter } from './appAdapters';

export interface StandingGrant {
  /** The app (audience) the grant is for. */
  audience: string;
  /** One resource id (exact match — no wildcards). */
  resource: string;
  /** The ops that may be signed without asking. Never contains a `neverAuto` op. */
  ops: string[];
  /** The .me path the app is allowed to ask under (`keys.netget`). */
  path: string;
  expiresAt: number;
  createdAt: number;
}

/** What a challenge asks for (from the decrypted challenge, never from the clear envelope alone). */
export interface GrantRequest { audience: string; resource: string; op: string; path: string }

export type GrantReason =
  | 'NEVER_AUTO' | 'UNKNOWN_OP' | 'NO_GRANT' | 'PATH_MISMATCH' | 'RESOURCE_MISMATCH' | 'OP_NOT_GRANTED' | 'GRANT_EXPIRED';

export type GrantDecision = { auto: true; grant?: StandingGrant; wire?: AppWire } | { auto: false; reason: GrantReason };

/** Longest a standing grant may live. */
export const MAX_GRANT_MS = 24 * 60 * 60 * 1000;

/** Builds a grant, refusing anything wider than allowed: unknown ops, never-auto ops, no ops, no/too long expiry. */
export function makeGrant(
  adapter: AppAdapter,
  input: { resource: string; ops: string[]; ttlMs: number; now: number; path?: string },
): StandingGrant {
  const resource = String(input.resource || '').trim();
  if (!resource) throw new Error('GRANT_RESOURCE_REQUIRED');
  const ops = [...new Set(input.ops)];
  if (!ops.length) throw new Error('GRANT_OPS_REQUIRED');
  for (const op of ops) {
    const def = adapter.ops[op];
    if (!def) throw new Error(`GRANT_UNKNOWN_OP:${op}`);
    if (def.neverAuto) throw new Error(`GRANT_NEVER_AUTO_OP:${op}`);
  }
  if (!(input.ttlMs > 0) || input.ttlMs > MAX_GRANT_MS) throw new Error('GRANT_TTL_OUT_OF_RANGE');
  return { audience: adapter.id, resource, ops, path: input.path ?? adapter.keyPath, createdAt: input.now, expiresAt: input.now + input.ttlMs };
}

/** May this request be signed without asking? `neverAuto` ops always ask, whatever the grants say. */
export function checkGrants(adapter: AppAdapter, grants: readonly StandingGrant[], req: GrantRequest, now: number): GrantDecision {
  const def = adapter.ops[req.op];
  if (!def) return { auto: false, reason: 'UNKNOWN_OP' };
  if (def.neverAuto) return { auto: false, reason: 'NEVER_AUTO' };
  const mine = grants.filter((g) => g.audience === req.audience && g.audience === adapter.id);
  if (!mine.length) return { auto: false, reason: 'NO_GRANT' };
  // Report the most specific failure so the consent UI can say why it is asking.
  let reason: GrantReason = 'PATH_MISMATCH';
  for (const g of mine) {
    if (g.path !== req.path) continue;
    if (reason === 'PATH_MISMATCH') reason = 'RESOURCE_MISMATCH';
    if (g.resource !== req.resource) continue;
    if (reason === 'RESOURCE_MISMATCH') reason = 'OP_NOT_GRANTED';
    if (!g.ops.includes(req.op) || adapter.ops[req.op]?.neverAuto) continue;
    if (g.expiresAt <= now) { reason = 'GRANT_EXPIRED'; continue; }
    return { auto: true, grant: g };
  }
  return { auto: false, reason };
}

/** A live outputs→inputs wire: the user connected their `.keys.<app>` output to that app's challenge input. */
export interface AppWire { audience: string; path: string }

/** A wire signs what arrives on it — except `neverAuto` ops, which still ask. */
export function checkWire(adapter: AppAdapter, wire: AppWire | null, req: GrantRequest): GrantDecision {
  const def = adapter.ops[req.op];
  if (!def) return { auto: false, reason: 'UNKNOWN_OP' };
  if (def.neverAuto) return { auto: false, reason: 'NEVER_AUTO' };
  if (!wire || wire.audience !== req.audience || wire.audience !== adapter.id) return { auto: false, reason: 'NO_GRANT' };
  if (wire.path !== req.path) return { auto: false, reason: 'PATH_MISMATCH' };
  return { auto: true, wire };
}

export const GRANT_REASON_TEXT: Record<GrantReason, string> = {
  NEVER_AUTO: 'This operation always asks.',
  UNKNOWN_OP: 'Unknown operation.',
  NO_GRANT: 'No standing permission for this app.',
  PATH_MISMATCH: 'Asked under a different path than allowed.',
  RESOURCE_MISMATCH: 'A different resource than allowed.',
  OP_NOT_GRANTED: 'This operation is not in the permission.',
  GRANT_EXPIRED: 'The permission expired.',
};
