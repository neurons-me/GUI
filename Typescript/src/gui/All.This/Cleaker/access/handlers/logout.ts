import type { LogoutSessionInput, LogoutSessionResult } from '../types';
import { CLEAKER_LOGOUT_CLEAR_FIELDS, writeKernelEntries } from '../internal';
import { resolveSession } from './resolveSession';

/**
 * @deprecated (2026-10-01) Independently-implemented logout primitive, never
 * actually called by the real `Cleaker` identity flow (that goes through
 * `SeedSessionProvider`'s own `logout()`), and has zero internal consumers
 * in this monorepo today. Kept exported, not removed, because it's part of
 * this package's published root (`index.ts`). Do not wire this into new code.
 */
export function logoutCleakerSession(input: LogoutSessionInput): LogoutSessionResult {
  writeKernelEntries(input, CLEAKER_LOGOUT_CLEAR_FIELDS);

  return {
    success: true,
    clearedPaths: CLEAKER_LOGOUT_CLEAR_FIELDS.map((entry) => entry.path),
    session: resolveSession(input),
  };
}
