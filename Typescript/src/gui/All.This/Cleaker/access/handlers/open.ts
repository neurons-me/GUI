import type { OpenSessionInput, OpenSessionResult } from '../types';
import { readKernelString, writeKernelEntries } from '../internal';
import { resolveSession } from './resolveSession';

/**
 * @deprecated (2026-10-01) Independently-implemented open/sign-in primitive,
 * never actually called by the real `Cleaker` identity flow (that goes
 * through `SeedSessionProvider`'s own `loginWithCredentials`/`open` —
 * `createCleakerSession.ts`), and has zero internal consumers in this
 * monorepo today. Kept exported, not removed, because it's part of this
 * package's published root (`index.ts`). Do not wire this into new code.
 */
export function openCleakerSession(input: OpenSessionInput): OpenSessionResult {
  const namespace = String(input.namespace || '').trim();
  const profileUsername = readKernelString(input, 'username');
  const username = String(input.username || profileUsername).trim();
  const identityHash = String(
    input.identityHash || readKernelString(input, 'identity.session.identityHash'),
  ).trim();
  const openedAtValue = Number(input.openedAt ?? input.now?.() ?? Date.now());
  const openedAt = Number.isFinite(openedAtValue) && openedAtValue > 0 ? openedAtValue : null;
  const authenticated = input.authenticated !== false;
  const viewMode = input.viewMode || (authenticated ? 'profile' : 'login');

  writeKernelEntries(input, [
    { path: 'identity.session.username', value: username },
    { path: 'identity.session.namespace', value: namespace },
    { path: 'identity.session.authenticated', value: authenticated },
    { path: 'identity.session.identityHash', value: identityHash },
    { path: 'identity.session.openedAt', value: openedAt },
    { path: 'ui.cleaker.viewMode', value: viewMode },
  ]);

  return {
    success: true,
    session: resolveSession(input),
  };
}
