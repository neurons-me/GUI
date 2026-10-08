import type { ResolveSessionInput, ResolvedCleakerSession } from '../types';
import { readKernelBoolean, readKernelNumber, readKernelString } from '../internal';

/**
 * @deprecated (2026-10-01) Independently-implemented session-status read,
 * used internally only by this same `access/` subsystem's other
 * (also-deprecated) handlers — the real `Cleaker` identity flow reads
 * session status via `useOptionalSeedSessionContext()`/`useSeedSession()`
 * instead. Kept exported, not removed, because it's part of this package's
 * published root (`index.ts`, as `resolveCleakerSession`). Do not wire this
 * into new code.
 */
export function resolveSession(input: ResolveSessionInput): ResolvedCleakerSession {
  const profileUsername = readKernelString(input, 'username');
  const sessionUsername = readKernelString(input, 'identity.session.username');
  const namespace = readKernelString(input, 'identity.session.namespace');
  const claimedAt = readKernelNumber(input, 'auth.claimed_at');
  const authenticated = readKernelBoolean(input, 'identity.session.authenticated');
  const viewMode = readKernelString(input, 'ui.cleaker.viewMode') || 'login';
  const username = sessionUsername || profileUsername;
  const hasSession = Boolean(namespace && authenticated);
  const isClaimed = Boolean(profileUsername && claimedAt && namespace);

  return {
    username,
    profileUsername,
    namespace,
    claimedAt,
    identityHash: readKernelString(input, 'identity.session.identityHash'),
    openedAt: readKernelNumber(input, 'identity.session.openedAt'),
    authenticated,
    hasSession,
    isClaimed,
    viewMode,
  };
}
