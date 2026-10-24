/**
 * Runs the app's capability resolvers for the SELECTED link and tells the pages what they said.
 * The rules (fail closed, one key at a time, late answers dropped) live in runtime/capabilities.ts; this is only React around them.
 */
import * as React from 'react';
import {
  applyAnswer,
  beginResults,
  capabilityKey,
  resolveCapabilities,
  statesFor,
  type CapabilityLink,
  type CapabilityResolvers,
  type CapabilityResults,
  type CapabilitySession,
  type CapabilityState,
} from '@/runtime/capabilities';

export type CapabilityStatesInput = {
  /** The app's resolvers, by capability name. Read when the key below changes; keep the object stable across renders. */
  resolvers?: CapabilityResolvers;
  /** The names to resolve (what the document declares). */
  names: readonly string[];
  /** The selected link, or null while none is. */
  link: CapabilityLink | null;
  /** The session through that link. */
  session: CapabilitySession;
  /** Opaque, the app's: a different scope is asked again (netget: which gateway is selected). */
  scope?: string;
};

export type CapabilityStates = { key: string; states: Readonly<Record<string, CapabilityState>> };

/** Resolves `names` for the key (selected link, identity through it, scope). Anything not answered yet is absent: 'unknown'. */
export function useCapabilityStates(input: CapabilityStatesInput): CapabilityStates {
  const scope = input.scope ?? '';
  const key = capabilityKey({ link: input.link, session: input.session, scope });
  const [results, setResults] = React.useState<CapabilityResults | null>(null);
  const latest = React.useRef(input);
  latest.current = input;
  const namesKey = input.names.join('\u0000');
  const hasResolvers = Boolean(input.resolvers);

  React.useEffect(() => {
    const { resolvers, names, link, session } = latest.current;
    if (!resolvers || names.length === 0) return undefined;
    const controller = new AbortController();
    setResults(beginResults(key));
    void resolveCapabilities({
      names,
      resolvers,
      context: { link, session, scope, signal: controller.signal },
      // an answer for a key that is no longer the current one is dropped inside applyAnswer
      onAnswer: (name, state) => setResults((current) => (current ? applyAnswer(current, key, name, state) : current)),
    });
    return () => controller.abort();
    // `names`/`resolvers` are read through `latest`: what restarts a resolution is the key, the set of names, or gaining resolvers
  }, [key, namesKey, hasResolvers]); // eslint-disable-line react-hooks/exhaustive-deps

  return React.useMemo(() => ({ key, states: statesFor(results, key) }), [key, results]);
}

/** What the pages under the shell can read: the resolved capabilities of the selected link. */
export type GuiCapabilitiesValue = { readonly key: string; readonly states: Readonly<Record<string, CapabilityState>> };

export const GuiCapabilitiesContext = React.createContext<GuiCapabilitiesValue | null>(null);

/** The state of one capability for the selected link: 'granted', 'denied' or 'unknown' (not resolved yet). Outside a shell: 'denied'. */
export function useGuiCapability(name: string): CapabilityState {
  const value = React.useContext(GuiCapabilitiesContext);
  return value ? value.states[name] ?? 'unknown' : 'denied';
}

/** Every resolved capability of the selected link, with the key they belong to (it changes with link, identity and scope). */
export function useGuiCapabilities(): GuiCapabilitiesValue | null {
  return React.useContext(GuiCapabilitiesContext);
}
