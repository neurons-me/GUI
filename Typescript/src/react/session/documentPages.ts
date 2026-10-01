// Small, dependency-free (at runtime) home for the handful of things every
// GUI-document page component (CleakerUsersView, CleakerBlockchainView,
// CleakerUrlView, the extracted identity/landing card, GUI itself) needs in
// common: the shared page-props shape, the one page id the shell has to
// recognize by name, and the two endpoint-derivation helpers every page
// calls with its own `cleakerEndpoint` prop.
//
// Split out of Namespace.tsx specifically so the extracted identity card
// (@/gui/All.This/Cleaker/CleakerIdentityCard.tsx) can depend on these
// without creating a runtime import cycle with Namespace.tsx itself
// (Namespace.tsx imports the card as the `Landing` page component; the card
// needs `requireCleakerEndpoint`/`deriveNamespaceRootLabel`/`LANDING_ID`/
// `DocumentPageProps`). The only thing this file takes FROM Namespace.tsx is
// a `import type` of `NamespaceProps` -- type-only, erased at compile time,
// so it introduces no runtime edge and therefore no cycle.
import type { NamespaceProps } from './Namespace';

// Local extension of NamespaceProps (like the removed `destination` prop
// before it), not a change to that shared, exported type -- only the GUI
// document renderer (renderGuiDocumentPage) supplies these two extra fields,
// carrying the document path a page was declared at. Defaults keep each
// page usable on its own (e.g. mounted directly in a story).
export type DocumentPageProps = NamespaceProps & {
  'data-gui-node-id'?: string;
  'data-gui-component'?: string;
};

// Where the GUI document (runtime/GUI.document.json) declares the landing
// page. Namespace.tsx's page-routing logic (renderGuiDocumentPage's per-page
// props branch) checks `entry.id === LANDING_ID` to decide which page gets
// the extra `onBeatleNamespaceResolved`/`sharedRootStatus` props -- same
// constant, one definition, both sides of that check.
export const LANDING_ID = 'GUI.content.landing';

// No hardcoded root here on purpose — cleaker.me/local.cleaker were never
// structurally special, just two values `cleakerEndpoint` happened to hold
// in this session's dev environment (see SetChemistry.findings.md's
// "generalizes past 2" note). Every REAL caller today already passes
// `cleakerEndpoint` explicitly (netget's App.jsx, every Storybook story,
// every demo pilot) — window.location was never actually load-bearing, it
// was a silent guess sitting behind an `||` that happened to agree with
// reality only because this component has so far only ever been mounted
// as the whole page, self-hosted by the exact origin it names. That
// coincidence breaks the moment this same component is mounted somewhere
// that ISN'T the namespace it should bind to — an embedded script on an
// unrelated third-party page (e.g. inserted into a Wikipedia article) is
// the clearest case: window.location would name that OTHER site, and this
// used to silently bind there instead, with no error, no warning, just a
// wrong namespace resolved with total confidence. Same principle as
// cleaker's own `confirmedNamespace` fix (binder.ts): never let a guess
// this consequential stand in for a value the caller can simply be
// required to supply. `cleakerEndpoint` stays optional in the TS type
// (existing callers, external consumers) — this is the runtime guard.
export function requireCleakerEndpoint(cleakerEndpoint: string | undefined): string {
  const explicit = String(cleakerEndpoint || '').trim();
  if (explicit) return explicit;
  throw new Error(
    'CLEAKER_ENDPOINT_REQUIRED: this component needs an explicit `cleakerEndpoint` prop -- ' +
    'it never guesses one from window.location. Pass the real namespace root it should bind ' +
    'to (e.g. "http://local.cleaker"), even when this page happens to be self-hosted from ' +
    'that same origin.'
  );
}

// Same idea as netget resolving which app you're addressing — this landing
// page is the entry point for a namespace *root*, and until now gave no
// sign of which one. Derived straight from cleakerEndpoint (the same value
// that already drives the QR), so it's never a second source of truth: the
// prop netget's App.jsx passes ("http://local.cleaker") or the component's
// own absolute default ("https://cleaker.me") both reduce to just the host
// — "local.cleaker" or "cleaker.me" — matching <handle>.<root> exactly.
export function deriveNamespaceRootLabel(endpoint: string): string {
  try {
    return new URL(endpoint).hostname;
  } catch {
    return endpoint.replace(/^https?:\/\//, '').replace(/\/+$/, '');
  }
}
