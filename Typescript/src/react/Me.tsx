import * as React from 'react';
import { RuntimeEnvironmentProvider, useRuntimeEnvironment } from '@/runtime/runtimeContext';
import { createMeRuntime } from '@/runtime/run-me';
import type { RuntimeAdapter } from '@/runtime/adapter';
import ME from 'this.me';
import type { MeLike, MeRuntimeContextValue, MeSubscribeBridge } from './types';
import { normalizeMeUsername, writeMeUsername } from './meIdentity';

const MeRuntimeContext = React.createContext<MeRuntimeContextValue | null>(null);

// Deliberately renders at the SAME tree position regardless of whether a
// session exists yet — see SeedSessionProvider.tsx, which now always wraps
// its children in this component instead of only once `me`/`runtime` are
// non-null. That used to matter a great deal: conditionally inserting this
// component only after authentication meant the moment a claim/login
// succeeded, React saw a NEW element type appear at that position in the
// tree and remounted everything underneath it from scratch — silently
// wiping any local component state that existed at the moment auth
// completed (confirmed live: RegisterMe's post-claim backup-phrase step,
// mid-flow, lost entirely the instant the claim resolved). Accepting
// `me: null` here and skipping runtime creation until a real kernel exists
// — rather than fabricating a placeholder kernel just to keep this
// component's prop non-optional — is what makes that stable position
// possible without lying about there being a session when there isn't one.
export type MeProps = {
  /**
   * A `.me` that already exists: that one is provided, as it is. `null` means nothing is provided here and whatever
   * sits above passes through (what `SeedSessionProvider` uses before anyone has signed in). Left out, `<Me>` makes a
   * local `.me` of its own.
   */
  me?: MeLike | null;
  /**
   * The handle the `.me` made here declares (`ana`). Context, not proof: it does not mean whoever holds the page is
   * ana, and it grants nothing. Not combinable with `me` (that `.me` already says what it is). Read it back with
   * `readMeUsername`.
   */
  username?: string;
  runtime?: RuntimeAdapter | null;
  subscribe?: MeSubscribeBridge | null;
  children: React.ReactNode;
};

/**
 * `<Me>` — a local runtime: the `.me` of this part of the page, provided to everything under it. It draws nothing, needs
 * no permission and no network, and says nothing about any namespace: a `.me` is linked to namespaces from outside
 * (`<Cleaker namespace>`), as many as you like.
 *
 *   <Me username="sui">
 *     <Cleaker namespace="cleaker.me" />
 *   </Me>
 *
 * It is the one provider: `SeedSessionProvider`, `mountApp`, `AppShell` and the editable `MeField` all mount it, and
 * `<Cleaker>` finds the `.me` through it (`useOptionalMe`). Two `<Me>` are two runtimes only if each makes or is given a
 * different `.me`; given the same one, they share it.
 *
 * What it takes, as a contract:
 *   - `me={kernel}`: that `.me`, as it is.
 *   - `me={null}`: nothing here; whatever sits above passes through.
 *   - no `me`: a new local `.me`, made once for this `<Me>`, carrying the `username` when one is declared.
 *   - `me` together with `username`: throws. Two sources for one `.me` would need a precedence rule, and a silent one is
 *     how a page ends up with a `.me` nobody wrote down.
 * Other attributes are not accepted yet; richer data goes in through `me`.
 */
export function Me({ me, username, runtime, subscribe, children }: MeProps) {
  const env = useRuntimeEnvironment();
  const wantedUsername = normalizeMeUsername(username || '');
  if (me && wantedUsername) {
    throw new Error('<Me> takes either `me` or `username`, not both.');
  }

  // A kernel made here is made once per declaration, never per render: whatever is written into it has to survive
  // the provider re-rendering above it.
  const makes = me === undefined;
  const madeRef = React.useRef<{ username: string; me: MeLike } | null>(null);
  if (makes && madeRef.current?.username !== wantedUsername) {
    const kernel = new ME() as unknown as MeLike;
    writeMeUsername(kernel, wantedUsername);
    madeRef.current = { username: wantedUsername, me: kernel };
  }
  const resolvedMe: MeLike | null = makes ? madeRef.current?.me ?? null : me ?? null;

  const runtimeValue = React.useMemo(
    () => (resolvedMe ? (runtime ?? createMeRuntime(resolvedMe, { subscribe })) : null),
    [resolvedMe, runtime, subscribe]
  );

  const contextValue = React.useMemo<MeRuntimeContextValue>(
    () => ({
      me: resolvedMe,
      runtime: runtimeValue,
      subscribe: subscribe ?? null,
    }),
    [resolvedMe, runtimeValue, subscribe]
  );

  const mergedEnvironment = React.useMemo(
    () => ({
      gui: env.gui,
      ctx: env.ctx,
      runtime: runtimeValue ?? env.runtime,
      me: resolvedMe ?? env.me,
    }),
    [env.gui, env.ctx, env.runtime, runtimeValue, resolvedMe, env.me]
  );

  return (
    <MeRuntimeContext.Provider value={contextValue}>
      <RuntimeEnvironmentProvider value={mergedEnvironment}>
        {children}
      </RuntimeEnvironmentProvider>
    </MeRuntimeContext.Provider>
  );
}

export function useOptionalMeRuntimeContext(): MeRuntimeContextValue | null {
  return React.useContext(MeRuntimeContext);
}

export function useMeRuntime(): MeLike {
  const local = React.useContext(MeRuntimeContext);
  const env = useRuntimeEnvironment();
  const runtimeMe = (env.runtime as any)?.__me ?? (env.runtime as any)?.me;
  const me = local?.me ?? (env.me as MeLike | undefined) ?? (runtimeMe as MeLike | undefined);

  if (!me) {
    throw new Error('useMeRuntime must be used inside <Me> or a GUI runtime environment with me.');
  }

  return me;
}
