import * as React from 'react';
import { RuntimeEnvironmentProvider, useRuntimeEnvironment } from '@/runtime/runtimeContext';
import { createMeRuntime } from '@/runtime/run-me';
import type { RuntimeAdapter } from '@/runtime/adapter';
import ME from 'this.me';
import type { MeLike, MeRuntimeContextValue, MeSubscribeBridge } from './types';
import { normalizeMeUsername, writeMeIdentity } from './meNamespace';

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
  /** A `.me` that already exists. Not combinable with `namespace` / `username`: that is an error, not a precedence rule. */
  me?: MeLike | null;
  /**
   * The root this `.me` stands in (`cleaker.me`). With no `me`, `<Me>` makes one: a kernel that carries only what is
   * declared here, no secret and no session (signing in is what gives a session its own kernel, further down). Read it
   * back with `readMeNamespace`.
   */
  namespace?: string;
  /**
   * The handle this `.me` declares (`ana`). With `namespace` it also names `ana.cleaker.me` (`readMeNamedNamespace`).
   * It is a declaration of context: it does not prove that whoever holds the page is ana and grants nothing.
   */
  username?: string;
  /**
   * Where this `.me` is reached, when that is not simply the namespace's own address (netget's gateway page: the
   * namespace is the host it was served from, the monad answers behind `/apps/netget`). Connection configuration, not
   * kernel state: it lives in the context, not in the `.me`.
   */
  transport?: string;
  runtime?: RuntimeAdapter | null;
  subscribe?: MeSubscribeBridge | null;
  children: React.ReactNode;
};

/**
 * `<Me>` — the `.me` of this part of the page, provided to everything under it. It draws nothing.
 *
 *   <Me username="ana" namespace="cleaker.me">
 *     <Cleaker />
 *   </Me>
 *
 * It is the one provider: `SeedSessionProvider`, `mountApp`, `AppShell` and the editable `MeField` all mount it, and
 * `<Cleaker>` finds the `.me` through it (`useOptionalMe`).
 *
 * What it takes, as a contract:
 *   - `me` alone: that `.me`, as it is.
 *   - `namespace` and/or `username`: a new `.me` that carries exactly that, made once per distinct pair.
 *   - `me` together with `namespace` or `username`: throws. Two sources for one `.me` would need a precedence rule,
 *     and a silent one is how a page ends up pointing somewhere nobody wrote down.
 *   - none of them: nothing is provided here, whatever sits above passes through (the form `SeedSessionProvider` uses).
 * Other attributes are not accepted yet; richer data goes in through `me`.
 */
export function Me({ me, namespace, username, transport, runtime, subscribe, children }: MeProps) {
  const env = useRuntimeEnvironment();
  const wantedNamespace = String(namespace || '').trim();
  const wantedUsername = normalizeMeUsername(username || '');
  const declares = Boolean(wantedNamespace || wantedUsername);
  if (me && declares) {
    throw new Error('<Me> takes either `me` or `namespace` / `username`, not both.');
  }

  // A kernel made here is made once per declaration, never per render: whatever is written into it has to survive
  // the provider re-rendering above it.
  const declaredKey = `${wantedUsername}|${wantedNamespace}`;
  const madeRef = React.useRef<{ key: string; me: MeLike } | null>(null);
  if (!me && declares && madeRef.current?.key !== declaredKey) {
    const kernel = new ME() as unknown as MeLike;
    writeMeIdentity(kernel, { namespace: wantedNamespace, username: wantedUsername });
    madeRef.current = { key: declaredKey, me: kernel };
  }
  const resolvedMe: MeLike | null = me ?? (declares ? madeRef.current?.me ?? null : null);

  const runtimeValue = React.useMemo(
    () => (resolvedMe ? (runtime ?? createMeRuntime(resolvedMe, { subscribe })) : null),
    [resolvedMe, runtime, subscribe]
  );

  const contextValue = React.useMemo<MeRuntimeContextValue>(
    () => ({
      me: resolvedMe,
      runtime: runtimeValue,
      subscribe: subscribe ?? null,
      transport: String(transport || '').trim() || null,
    }),
    [resolvedMe, runtimeValue, subscribe, transport]
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
