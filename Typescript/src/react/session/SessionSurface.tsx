import * as React from 'react';
import { useSeedSession } from './useSeedSession';
import type { SeedSession } from '@/core/session/createSeedSession';

const SEED_BYTES = 32;

function readOrCreateSeed(storageKey: string): string {
  const existing = window.localStorage.getItem(storageKey);
  if (existing) return existing;

  const bytes = new Uint8Array(SEED_BYTES);
  window.crypto.getRandomValues(bytes);
  const seed = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  window.localStorage.setItem(storageKey, seed);
  return seed;
}

export interface SessionSurfaceContextValue {
  authenticated: boolean;
  session: SeedSession | null;
  handle: string | null;
  pending: boolean;
  error: Error | null;
  /** Generates/reuses the operator's seed, claims+opens it, and activates the session. */
  enter: () => Promise<void>;
  logout: () => void;
}

const SessionSurfaceContext = React.createContext<SessionSurfaceContextValue | null>(null);

export function useSessionSurface(): SessionSurfaceContextValue {
  const ctx = React.useContext(SessionSurfaceContext);
  if (!ctx) throw new Error('useSessionSurface must be used within SessionSurface');
  return ctx;
}

export function useOptionalSessionSurface(): SessionSurfaceContextValue | null {
  return React.useContext(SessionSurfaceContext);
}

export interface SessionSurfaceProps {
  /**
   * DNS-style root namespace of the monad being claimed against — e.g.
   * "myapp.suis-macbook-air.local". NOT the same thing as an
   * AppDeclaration.namespace (that's a `.me` PATH prefix like "apps.myapp");
   * this is the claim identity `monad/kernel/manager.ts`'s
   * `namespaceToKernelPrefix()` checks against, which today requires the
   * claimed namespace to be a DNS suffix of the monad's own root — so the
   * namespace actually claimed here is `${handle}.${claimRootNamespace}`,
   * not claimRootNamespace itself. See FullTrailer's
   * docs/operator-identity-namespace.md for the full reasoning; tracked as
   * kernel debt to relax, not assumed fixed.
   */
  claimRootNamespace: string;
  /**
   * localStorage key the operator's client-generated seed persists under.
   * Must not be 'this.me.seed:v1' — createSeedSession() scrubs that exact
   * key from storage right after using it, which would silently wipe a
   * seed persisted under the same name.
   */
  seedStorageKey: string;
  children: React.ReactNode;
  /**
   * Runs once, after claim/open succeeds and before the session activates —
   * e.g. seeding an app's initial catalog, or recording an app-relation
   * fact (`apps.myapp.operators.<handle>`). Optional: SessionSurface itself
   * has no opinion about what an app does once someone enters.
   */
  onEnter?: (session: SeedSession, handle: string) => void | Promise<void>;
}

/**
 * The public-surface-first session primitive: unlike a login gate,
 * SessionSurface never withholds `children` — the app's shell renders
 * whether or not anyone has entered. What it provides is a context
 * (`useSessionSurface()`) exposing `authenticated`/`session` state and an
 * `enter()` action, so a visible "Sign in with .me" affordance can live
 * anywhere in the public UI instead of blocking it. Session, once active,
 * expands what's visible/writable — it never replaces the surface.
 *
 * Deliberately renders no UI of its own (no button, no card) — placement is
 * an app decision. Read `useSessionSurface()` wherever the app wants a login
 * affordance.
 */
export function SessionSurface({
  claimRootNamespace,
  seedStorageKey,
  children,
  onEnter,
}: SessionSurfaceProps) {
  const {
    authenticated,
    session,
    loginWithSeed,
    activateSession,
    pending,
    error,
    clearError,
    logout: endSeedSession,
  } = useSeedSession();
  const entering = React.useRef(false);

  // Derived, not stored: SeedSessionProvider wraps its children in an extra
  // MeRuntimeProvider layer the moment snapshot.me/runtime first appear
  // (see SeedSessionProvider.tsx's `content`) — that changes the element
  // type at this component's position in the tree, so React unmounts and
  // remounts everything below it, including this component, at exactly the
  // moment a login succeeds. Any useState here would reset to its initial
  // value in that same instant. session.semanticNamespace comes from
  // SeedSessionProvider's own state instead, which doesn't remount, so
  // deriving handle from it survives the remount intact.
  const handle = React.useMemo(() => {
    if (!session?.semanticNamespace) return null;
    const suffix = `.${claimRootNamespace}`;
    return session.semanticNamespace.endsWith(suffix)
      ? session.semanticNamespace.slice(0, -suffix.length)
      : session.semanticNamespace;
  }, [session, claimRootNamespace]);

  const enter = React.useCallback(async () => {
    if (entering.current) return;
    entering.current = true;
    clearError();
    try {
      const seed = readOrCreateSeed(seedStorageKey);
      const nextHandle = seed.slice(0, 8);
      const namespace = `${nextHandle}.${claimRootNamespace}`;

      const nextSession = await loginWithSeed({ seed, namespace, autoOpen: false });
      try {
        await nextSession.open(namespace);
      } catch {
        // First visit from this browser — no claim exists yet.
        await nextSession.claimAndOpen(namespace);
      }
      if (onEnter) await onEnter(nextSession, nextHandle);
      activateSession(nextSession);
    } finally {
      entering.current = false;
    }
  }, [claimRootNamespace, seedStorageKey, loginWithSeed, activateSession, clearError, onEnter]);

  const logout = React.useCallback(() => {
    endSeedSession();
  }, [endSeedSession]);

  const value = React.useMemo<SessionSurfaceContextValue>(
    () => ({ authenticated, session, handle, pending, error, enter, logout }),
    [authenticated, session, handle, pending, error, enter, logout],
  );

  return <SessionSurfaceContext.Provider value={value}>{children}</SessionSurfaceContext.Provider>;
}
