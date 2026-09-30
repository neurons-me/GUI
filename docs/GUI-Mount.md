# GUI Mount

**GUI Mount** is the boundary where a GUI description becomes a live surface.

It answers one question:

> Given a target DOM element, what kind of GUI thing are we projecting into it?

There are three related levels:

| Level | API | Input | Output |
| --- | --- | --- | --- |
| Spec mount | `mount(spec, target, options)` | A `GuiNode` spec | A rendered GUI tree |
| Route runtime | `startApp(options)` | A router/runtime setup | A route-driven GUI runtime |
| App mount | `mountApp({ me, app, target })` | An app declaration | A themed React app shell with layout |

They all mount something, but they do not mount the same kind of thing.

---

## The Core Primitive: `mount`

`mount` is the low-level GUI renderer.

```ts
import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import * as GUI from 'this.gui';
import { mount } from 'this.gui/runtime';

mount(
  {
    type: 'Hero',
    props: {
      header: 'FullTrailer',
      subheader: 'Trailer operations surface',
      height: '100vh',
      mode: 'left',
    },
  },
  '#root',
  {
    gui: GUI,
    React,
    ReactDOM,
  },
);
```

Read it as:

```txt
GuiNode spec -> DOM surface
```

`mount` does not know what an app is. It does not own routes, app identity, or business state. It receives a declarative GUI node and renders it.

Internally it:

- resolves the DOM target,
- creates or reuses a React root for that target,
- wraps the tree in `RuntimeEnvironmentProvider`,
- passes `gui`, `runtime`, `ctx`, and optional `.me`,
- optionally enables runtime devtools/selection,
- returns a mount handle with `root` and `unmount()`.

Use `mount` when you already have a GUI spec and want to render that spec.

---

## `.me` In Mount

`mount` can receive a `.me` instance:

```ts
mount(spec, '#root', {
  gui: GUI,
  React,
  ReactDOM,
  me,
});
```

That does not mean `mount` creates a `.me` app.

It means the mounted GUI tree receives `.me` as runtime context, so nodes inside the tree can resolve values or actions through the runtime.

```txt
mount does not declare identity.
mount receives identity context.
```

---

## App Mount: `mountApp`

`mountApp` is a higher-level app bootstrap helper.

```ts
import ME from 'this.me';
import { mountApp } from 'this.gui/runtime';
import app from './app';
import 'this.gui/style.css';

const me = ME();

mountApp({
  me,
  app,
  target: '#root',
});
```

With an app declaration:

```ts
import Home from './views/Home';

export default {
  id: 'fulltrailer',
  namespace: 'apps.fulltrailer',
  title: 'FullTrailer',
  theme: 'neurons.me',
  views: {
    home: Home,
  },
};
```

Read it as:

```txt
App declaration -> .me manifest -> Theme -> Layout -> active view
```

`mountApp` is not the same as `mount`.

`mountApp` does app-level work:

- declares the app manifest into `.me`,
- writes the available views into `.me`,
- derives the active view from `window.location.pathname`,
- creates the React root,
- wraps the view in `Theme`,
- wraps the view in `MeRuntimeProvider`,
- renders inside `Layout`.

Use `mountApp` when you are building a React-first app with namespace identity.

---

## Route Runtime: `startApp`

`startApp` sits between `mount` and `mountApp`.

It is route/runtime oriented:

```ts
import { startApp } from 'this.gui/runtime';

await startApp({
  target: '#root',
  basePath: '/',
  me,
  registerRoutes(router) {
    router.get('/', {
      type: 'Hero',
      props: { header: 'Home' },
    });
  },
});
```

Read it as:

```txt
Router setup -> route state -> GUI runtime
```

Use `startApp` when the app is primarily driven by GUI specs and route registration.

---

## Why The Names Are Similar

They are similar because all three APIs cross the same boundary:

```txt
description -> live DOM surface
```

But they cross it at different levels.

```txt
mount
  spec -> DOM

startApp
  routes/runtime -> DOM

mountApp
  namespace-backed app declaration -> DOM
```

---

## The Five Concerns

`this.gui` separates five concerns:

| Concern | Meaning | Primary APIs |
| --- | --- | --- |
| Syntax | How UI is written | JSX, `GuiNode` specs |
| Form | What UI is made of | atoms, molecules, compounds |
| Composition | How views sit inside chrome | `Theme`, `Layout`, `Hero`, `Page` |
| Routes | Which view is active | `startApp`, app `views`, router |
| Identity | Which namespace/context owns the app | `.me`, `declareApp`, `MeRuntimeProvider` |

`mount` mostly belongs to syntax/form.

`mountApp` belongs to routes/identity/composition.

That is why both exist.

---

## Relationship To `.me`

In `.me`, an app is not just a bundle of React components.

It is a namespace-backed context:

```txt
apps.fulltrailer
  manifest
  views
  themes
  trucks
  dashboard
```

`mountApp` declares that context.

`mount` can render a projection inside that context.

GUI does not replace `.me`. GUI projects `.me` onto a surface.

```txt
Namespace -> Context
Context -> Identity
Selection -> Collection memory
Resolve(Collection) -> Space runtime
GUI Mount -> DOM surface
```

---

## Which One Should I Use?

| Goal | Use |
| --- | --- |
| Render one declarative GUI spec | `mount` |
| Build a spec-driven runtime with routes | `startApp` |
| Boot a React-first app with `.me` identity | `mountApp` |
| Just build a React view with GUI components | `Theme` + `Layout` + JSX |

The simplest React app does not need `mount`.

The simplest GUI spec does not need `mountApp`.

They meet later, when apps become namespace-backed surfaces.
