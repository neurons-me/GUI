/**
 * Declarative requirements on the parts of a GUI document.
 *
 * An app declares what it OFFERS in its document (`GUI.window.layout.bars.left.<id>` elements and `GUI.window.layout.content.<id>` pages). What a person can
 * USE is decided from the context of the SELECTED link: its session, and a scope the app chooses. A part says what it needs:
 *
 *   requires: 'session'                                  someone has signed in through the selected link
 *   requires: { capability: 'x:admin' }                  the app's resolver says the selected link grants 'x:admin'
 *   requires: { capability: 'x:admin', whenMissing: 'disable' }   ...and shows the link disabled instead of hiding it
 *
 * The GUI never learns what a capability MEANS. The names are the app's words, opaque here; the app supplies a resolver per
 * name (`capabilities` on `<Cleaker>`/`<Namespace>`), called with the selected link and the session through THAT link. The
 * server still authorizes every request: a resolver answers "should this be offered", never "is this allowed".
 *
 * Rules that make it safe to leave to the app:
 *   - fail closed: an unknown requirement, a missing resolver, an error and any answer other than `true`/'granted' are 'denied';
 *   - results belong to ONE key (selected link + identity + the app's scope). Switching any of them starts from nothing, and a
 *     late answer for the key that was left is dropped, so what one link grants never enables another;
 *   - 'unknown' only means "not resolved yet for the current key"; while it lasts the part is not offered (or is shown disabled).
 *
 * Pure: no React, no network. The hook that runs it lives in react/session/useCapabilities.ts.
 */

export type CapabilityState = 'granted' | 'denied' | 'unknown';
export type WhenMissing = 'hide' | 'disable';

/** What a part of the document needs. Plain JSON, like the rest of the document. */
export type GuiRequirement = 'session' | { capability: string; whenMissing?: WhenMissing };

export type RequirementVerdict = {
  /** The requirement holds right now. */
  met: boolean;
  /** Not met only because the answer is not in yet. */
  pending: boolean;
  /** What to do with a part whose requirement is not met. */
  whenMissing: WhenMissing;
};

export type RequirementContext = {
  authenticated?: boolean;
  /** What the resolvers have answered for the current key. A name that is absent is 'unknown'. */
  capabilities?: Readonly<Record<string, CapabilityState>>;
};

const MET: RequirementVerdict = { met: true, pending: false, whenMissing: 'hide' };
const UNMET: RequirementVerdict = { met: false, pending: false, whenMissing: 'hide' };

export function evaluateRequirement(requirement: unknown, context: RequirementContext = {}): RequirementVerdict {
  if (requirement === undefined || requirement === null) return MET;
  if (requirement === 'session') return context.authenticated ? MET : UNMET;
  if (typeof requirement === 'object' && !Array.isArray(requirement)) {
    const { capability, whenMissing } = requirement as { capability?: unknown; whenMissing?: unknown };
    if (typeof capability === 'string' && capability) {
      const how: WhenMissing = whenMissing === 'disable' ? 'disable' : 'hide';
      const state = context.capabilities?.[capability] ?? 'unknown';
      if (state === 'granted') return { met: true, pending: false, whenMissing: how };
      return { met: false, pending: state === 'unknown', whenMissing: how };
    }
  }
  return UNMET; // a requirement this GUI does not understand is not met
}

/** The capability names a document asks for, unique and sorted. */
export function declaredCapabilities(entries: ReadonlyArray<{ requires?: unknown }>): string[] {
  const names = new Set<string>();
  for (const entry of entries) {
    const r = entry.requires as { capability?: unknown } | string | undefined | null;
    if (r && typeof r === 'object' && typeof r.capability === 'string' && r.capability) names.add(r.capability);
  }
  return [...names].sort();
}

// ── what a resolver is given ───────────────────────────────────────────────────────────────────────────────────────

export type CapabilityLink = { id: string; namespace: string; transport: string };
export type CapabilitySession = { authenticated: boolean; identityHash: string | null; me: unknown };

export type CapabilityContext = {
  /** The selected link, or null while none is. */
  link: CapabilityLink | null;
  /** The session through THAT link (not through any other open one). */
  session: CapabilitySession;
  /** Opaque, chosen by the app (for netget: which gateway it has selected). A different scope is asked again. */
  scope: string;
  /** Aborted when the key this answer was for is no longer the current one. */
  signal: AbortSignal;
};

export type CapabilityResolver = (context: CapabilityContext) => unknown | Promise<unknown>;
export type CapabilityResolvers = Readonly<Record<string, CapabilityResolver>>;

/** The identity of a resolution: selected link, identity through it, whether signed in, and the app's scope. */
export function capabilityKey(input: { link: CapabilityLink | null; session: CapabilitySession; scope: string }): string {
  const { link, session, scope } = input;
  return JSON.stringify([link?.id ?? null, session.authenticated ? session.identityHash ?? '' : null, scope ?? '']);
}

// ── results: one key at a time ─────────────────────────────────────────────────────────────────────────────────────

export type CapabilityResults = { readonly key: string; readonly states: Readonly<Record<string, CapabilityState>> };

/** Starts (or restarts) from nothing for this key. */
export function beginResults(key: string): CapabilityResults {
  return { key, states: {} };
}

/** What is known for `key`: nothing, unless the results are for exactly that key. */
export function statesFor(results: CapabilityResults | null, key: string): Record<string, CapabilityState> {
  return results && results.key === key ? { ...results.states } : {};
}

/** Records an answer. An answer for another key than the one the results are for is dropped (the same object comes back). */
export function applyAnswer(results: CapabilityResults, key: string, name: string, state: CapabilityState): CapabilityResults {
  if (results.key !== key) return results;
  if (results.states[name] === state) return results;
  return { key, states: { ...results.states, [name]: state } };
}

const normalize = (value: unknown): CapabilityState => (value === true || value === 'granted' ? 'granted' : 'denied');

/**
 * Runs the resolvers for `names` with `context` and reports each answer once. Never throws: an error, a missing resolver
 * and any answer but `true`/'granted' are 'denied'. Nothing is reported once `context.signal` is aborted.
 */
export async function resolveCapabilities(input: {
  names: readonly string[];
  resolvers: CapabilityResolvers;
  context: CapabilityContext;
  onAnswer: (name: string, state: CapabilityState) => void;
}): Promise<void> {
  const { names, resolvers, context, onAnswer } = input;
  await Promise.all(
    names.map(async (name) => {
      let state: CapabilityState;
      try {
        const resolver = resolvers[name];
        state = resolver ? normalize(await resolver(context)) : 'denied';
      } catch {
        state = 'denied';
      }
      if (!context.signal.aborted) onAnswer(name, state);
    }),
  );
}
