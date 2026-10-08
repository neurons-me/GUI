import type { ClaimHandlerInput, ClaimHandlerResult } from '../types';
import { readKernelString, writeKernelEntries } from '../internal';
import { resolveSession } from './resolveSession';

/**
 * @deprecated (2026-10-01) Independently-implemented claim primitive, never
 * actually called by the real `Cleaker` identity flow (that goes through
 * `SeedSessionProvider`'s own `registerWithCredentials`/`claimAndOpen` —
 * `createCleakerSession.ts`), and has zero internal consumers in this
 * monorepo today. Kept exported, not removed, because it's part of this
 * package's published root (`index.ts`) and "no internal consumer" doesn't
 * rule out an external one importing it by name. Not a drop-in replacement
 * for the real flow — do not wire this into new code.
 */
export function claimCleakerNamespace(input: ClaimHandlerInput): ClaimHandlerResult {
  const username = String(input.username || '').trim();
  const namespace = String(input.namespace || '').trim();
  const claimedAt = Number(input.claimedAt || input.now?.() || Date.now());
  const identityHash = String(
    input.identityHash || readKernelString(input, 'identity.session.identityHash'),
  ).trim();
  const openedAtValue = Number(input.openedAt ?? claimedAt);
  const openedAt = Number.isFinite(openedAtValue) && openedAtValue > 0 ? openedAtValue : null;
  const authenticated = input.authenticated !== false;
  const profile = input.profile || {};

  writeKernelEntries(input, [
    { path: 'username', value: profile.username ?? username },
    { path: 'name',     value: profile.name ?? null },
    { path: 'avatar',   value: profile.avatar ?? null },
    { path: 'bio',      value: profile.bio ?? null },
    { path: 'email',    value: profile.email ?? null },
    { path: 'phone',    value: profile.phone ?? null },
    { path: 'auth.claimed_at', value: claimedAt },
    { path: 'identity.session.username', value: username },
    { path: 'identity.session.namespace', value: namespace },
    { path: 'identity.session.authenticated', value: authenticated },
    { path: 'identity.session.identityHash', value: identityHash },
    { path: 'identity.session.openedAt', value: openedAt },
    { path: 'ui.cleaker.viewMode', value: authenticated ? 'profile' : 'login' },
  ]);

  return {
    success: true,
    username,
    namespace,
    claimedAt,
    authenticated,
    session: resolveSession(input),
  };
}
