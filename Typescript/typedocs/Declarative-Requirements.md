# Declarative requirements

A GUI document declares what an app **offers**. What a person can **use** is decided from the context of the *selected link*.
The shell never learns what a capability means: the names are the app's words.

```json
{ "GUI": { "children": { "bars": { "children": { "left": { "children": {
  "domains": { "label": "Domains", "to": "/domains", "icon": "language", "placement": "end",
               "requires": { "capability": "gateway:admin" } },
  "audit":   { "label": "Audit", "to": "/audit", "icon": "article", "placement": "end",
               "requires": { "capability": "gateway:audit", "whenMissing": "disable" } },
  "keys":    { "label": "Keys", "to": "/keys", "icon": "key", "requires": "session" }
}}}}}}}
```

| `requires` | meaning |
|---|---|
| `"session"` | someone has signed in through the selected link |
| `{ "capability": "x" }` | the app's resolver says the selected link grants `x`; otherwise the part is hidden |
| `{ "capability": "x", "whenMissing": "disable" }` | ...otherwise the link stays, shown disabled (`aria-disabled`) |

The same declaration gates the link in the bar **and** the page behind its route (declare it on both). A hidden part is not a route
(a typed path goes to the way in); a disabled part's route says it is not available.

## The app supplies resolvers

```tsx
const capabilities = {
  'gateway:admin': async ({ link, session, scope, signal }) => { /* return true | 'granted' | false */ },
};

<Cleaker
  document={DOCUMENT} pages={PAGES}
  capabilities={capabilities}
  capabilityScope={selectedGatewayId} />
```

A resolver is called with the **selected link** (`{ id, namespace, transport }`), the **session through that link**
(`{ authenticated, identityHash, me }`), an opaque app `scope`, and an `AbortSignal`. Pages read the result with
`useGuiCapability(name)` (`'granted' | 'denied' | 'unknown'`).

## Rules

* **Fail closed.** An unknown requirement, a missing resolver, an error, and any answer but `true`/`'granted'` are `denied`.
  `unknown` only means "not resolved yet for the current key" (the part is not offered, or is shown disabled, meanwhile).
* **One key at a time.** Results belong to `(selected link, identity through it, scope)`. Switching any of them starts from
  nothing, and a late answer for the key that was left is dropped: what one link grants never enables another.
* **The GUI offers; the server authorizes.** A resolver answers "should this be shown", never "is this allowed". Every request is
  still authorized where it lands.
* A resolver is read when the key (or the set of declared capabilities) changes; keep the `capabilities` object stable across
  renders. To resolve again without changing link or identity, change `capabilityScope`.

Pure parts: `src/runtime/capabilities.ts` (`tests/capabilities.test.ts`). The shell around them: `src/react/session/useCapabilities.ts`,
`Namespace.tsx` (`tests/integration/capabilities.browser.test.mjs`, real components, real browser, controlled transports).
