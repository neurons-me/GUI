# Runtime Contract

This document defines the modern runtime contract for `this.gui`.

The current direction is:

- React-first apps
- `.me` as the semantic state layer
- explicit **runtime/devtools** boundaries

## 1. Runtime Sources

When you call `mount()` directly inside a modern ESM app, pass the package surface and React namespaces explicitly:

```ts
import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import * as GUI from 'this.gui';
```

`this.GUI` can render in three modes:

- static render with no runtime
- custom runtime adapter
- `.me` runtime derived automatically

### Static UI

```ts
import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import * as GUI from 'this.gui';
import { mount } from 'this.gui/runtime';

mount(
  {
    type: 'Page',
    props: { title: 'Static' },
    children: [{ type: 'Typography', props: { children: 'No runtime needed.' } }],
  },
  '#root',
  { gui: GUI, React, ReactDOM }
);
```

### Custom runtime adapter

```ts
import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import * as GUI from 'this.gui';
import { mount } from 'this.gui/runtime';

const runtime = {
  resolve(value: any) {
    return value;
  },
  action(_expression: string) {
    return () => {};
  },
};

mount(spec, '#root', { gui: GUI, React, ReactDOM, runtime });
```

### `.me` runtime

```ts
import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import * as GUI from 'this.gui';
import ME from 'this.me';
import { createMeRuntime, mount } from 'this.gui/runtime';

const me = new ME();
me.profile.name('Ana');
const runtime = createMeRuntime(me);

mount(spec, '#root', { gui: GUI, React, ReactDOM, me, runtime });
```

When `me` is passed, `this.gui` can derive the runtime adapter automatically.
For mixed React + mounted-spec screens, sharing an explicit `runtime` is the recommended path.

### `.me` runtime, live over a network monad

`createMeRuntime()` above is local-only — `me` is an in-memory kernel with no
network awareness. `createWsMeRuntime()` is a drop-in `RuntimeAdapter` for
talking to a **remote** monad instead: reads/writes go over HTTP, and
`subscribe`/`getSnapshot` ride a `/nrp` WebSocket connection, so
`useMeValue`/`{ read: ... }` tokens reflect writes made by *other* connected
clients — no polling.

```ts
import ME from 'this.me';
import { createWsMeRuntime, mount } from 'this.gui/runtime';

const me = new ME();
const runtime = createWsMeRuntime(me, {
  semanticNamespace: 'myapp.mymachine.local',
  transportOrigin: 'http://local.netget/apps/myapp',
});

mount(spec, '#root', { gui: GUI, React, ReactDOM, me, runtime });
```

Two things this doesn't do automatically:

- **`transportOrigin` is opaque to this adapter** — it can be a bare origin
  or carry a base path (e.g. `.../apps/myapp`, netget's app-mesh proxy — see
  [Apps Over Netget](../../../modules/netget/Typescript/docs/AppsOverNetget.md)
  for why that's the recommended shape rather than a dedicated subdomain).
  Get `semanticNamespace` wrong and writes silently land in the wrong `.me`
  namespace server-side — nothing here validates that they match.
- **Pass `runtime` explicitly wherever it's used** — `Me`'s
  `runtime` prop, and separately to any standalone `SpecBoundary` (not
  context-aware on its own). Omitting it falls back to a no-op identity
  adapter with no error — a `{ read: ... }` token just echoes its own path
  string back, easy to mistake for a security-allowlist rejection (§5).

## 2. React Bridge

When your host app is React, use `this.gui/react`.

```tsx
import ME from 'this.me';
import { Me, useMeAction, useMeValue } from 'this.gui/react';

const me = new ME();

function ProfileName() {
  const name = useMeValue<string>('profile.name');
  const setName = useMeAction('profile.name');

  return (
    <button onClick={() => setName('Ana')}>
      {name}
    </button>
  );
}

export default function App() {
  return (
    <Me me={me}>
      <ProfileName />
    </Me>
  );
}
```

Contract:

- `useMeValue(path)` reads semantic values reactively
- `useMeAction(path)` writes payloads through the runtime bridge
- `Me` keeps `.me` and the runtime adapter aligned

## 3. Read / Write Tokens

Dynamic spec props are expressed as tokens:

- `{ read: '...' }`
- `{ write: '...' }`

Legacy aliases still work:

- `{ $expr: '...' }`
- `{ $action: '...' }`

Example:

```json
{
  "type": "Button",
  "props": {
    "label": { "read": "me/profile/name" },
    "onClick": { "write": "me/profile/status = 'offline'" }
  }
}
```

Notes:

- `read` tokens are resolved before render
- `write` tokens are hydrated into callbacks
- interpolation works inside token strings

Examples:

- `{{params.id}}`
- `{{ctx.params.id}}`
- `{{wildcard}}`

```json
{
  "type": "Typography",
  "props": {
    "children": { "read": "me/shops/{{params.id}}/name" }
  }
}
```

## 4. Router Contract

`Router` supports:

- exact routes
- params like `:id`
- wildcards like `*`

Resolved params are injected into `ctx.params`.

```ts
import { Router } from 'this.gui';

const router = new Router({ runtime });

router.set('/dashboard', () => ({
  type: 'Page',
  props: { title: 'Dashboard' },
}));

router.set('/shops/:id', ({ ctx }) => ({
  type: 'Page',
  props: {
    title: { read: 'me/shops/{{params.id}}/name' },
    subtitle: `shop id=${ctx.params.id}`,
  },
}));
```

Behavior:

- exact routes win over dynamic routes
- dynamic routes are ranked by specificity
- params are decoded safely

## 5. Security Defaults

Runtime expressions are deny-by-default unless they match an allowed root.

Current default roots:

- `me/views/`
- `me/public/`
- `me/`
- `me://`
- `self:`
- `kernel:`

You can extend them:

```ts
mount(spec, '#root', {
  gui: GUI,
  React,
  ReactDOM,
  me,
  allowedExprRoots: ['me/', 'me://', 'self:', 'kernel:'],
});
```

Or disable the allowlist entirely for trusted environments:

```ts
mount(spec, '#root', {
  gui: GUI,
  React,
  ReactDOM,
  me,
  unsafeAllowAllExpressions: true,
});
```

## 6. Devtools Contract

Devtools are now opt-in.

```ts
mount(spec, '#root', {
  gui: GUI,
  React,
  ReactDOM,
  me,
  devtools: {
    inspector: false,
    inspectorToggleVisible: true,
    adminView: false,
  },
});
```

Recommended rule:

- runtime core should render without devtools by default
- inspector/admin should only mount when explicitly requested

For direct imports, use `this.gui/devtools`.

## 7. Package Boundaries

modern boundaries:

- `this.gui` → UI surface
- `this.gui/react` → React + `.me` bridge
- `this.gui/runtime` → mount + adapters
- `this.gui/devtools` → inspector/admin tooling
- `this.gui/legacy` → compatibility facade
