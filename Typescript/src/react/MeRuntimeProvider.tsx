import * as React from 'react';
import { RuntimeEnvironmentProvider, useRuntimeEnvironment } from '@/runtime/runtimeContext';
import { createMeRuntime } from '@/runtime/run-me';
import type { RuntimeAdapter } from '@/runtime/adapter';
import type { MeLike, MeRuntimeContextValue, MeSubscribeBridge } from './types';

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
export function MeRuntimeProvider({
  me,
  runtime,
  subscribe,
  children,
}: {
  me: MeLike | null;
  runtime?: RuntimeAdapter | null;
  subscribe?: MeSubscribeBridge | null;
  children: React.ReactNode;
}) {
  const env = useRuntimeEnvironment();
  const runtimeValue = React.useMemo(
    () => (me ? (runtime ?? createMeRuntime(me, { subscribe })) : null),
    [me, runtime, subscribe]
  );

  const contextValue = React.useMemo<MeRuntimeContextValue>(
    () => ({
      me,
      runtime: runtimeValue,
      subscribe: subscribe ?? null,
    }),
    [me, runtimeValue, subscribe]
  );

  const mergedEnvironment = React.useMemo(
    () => ({
      gui: env.gui,
      ctx: env.ctx,
      runtime: runtimeValue ?? env.runtime,
      me: me ?? env.me,
    }),
    [env.gui, env.ctx, env.runtime, runtimeValue, me, env.me]
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
    throw new Error('useMeRuntime must be used inside MeRuntimeProvider or a GUI runtime environment with me.');
  }

  return me;
}
