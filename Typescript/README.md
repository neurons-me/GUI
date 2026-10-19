<img src="./public/GUI.png" style="width: 34%" />

---

# this.gui

###### Generative User Interfaces

[![npm](https://img.shields.io/npm/v/this.gui)](https://www.npmjs.com/package/this.gui) [![docs](https://img.shields.io/badge/docs-neurons--me.github.io-blue)](https://neurons-me.github.io/GUI/docs/)

A collection of components and building blocks for **UI Generation**.

## Scaffold a new app

```bash
npx this.gui my-app
cd my-app
npm install
npm run dev
```

## Install

```bash
npm install this.gui
```

Add `this.me` only if you want namespace-backed state:

```bash
npm install this.me
```

## Composition

`this.gui` separates five concerns: **syntax, form, composition, routes, identity.**

```
Theme → Layout → view
```

`Theme` is the visual environment. `Layout` is the chrome — topbar, sidebar, footer. Your view fills the content area.

```tsx
import { Theme, Layout } from 'this.gui';
import { Typography, Button } from 'this.gui/atoms';
import { Hero, Stack } from 'this.gui/molecules';

function Home() {
  return (
    <Hero height="100vh" mode="left" padding={{ xs: 3, md: 8 }}>
      <Stack spacing={2} alignItems="flex-start">
        <Typography variant="h1">My App</Typography>
        <Button variant="contained" size="large">Get started</Button>
      </Stack>
    </Hero>
  );
}

export default function App() {
  return (
    <Theme initialThemeId="neurons.me">
      <Layout
        TopBar={{ title: 'My App' }}
        LeftBar={{ initialView: 'rail' }}
      >
        <Home />
      </Layout>
    </Theme>
  );
}
```

## Routes + Identity

Use `this.me` when your app should be declared as a namespace-backed identity. The app manifest is written into `.me`, and views read from that namespace.

```tsx
// app.ts — declare the app as a namespace context
export default {
  id: 'my-app',
  namespace: 'apps.my-app',
  title: 'My App',
  theme: 'neurons.me',
  views: { home: Home },
};
```

```tsx
// main.tsx
import ME from 'this.me';
import { mountApp } from 'this.gui/runtime';
import app from './app';

mountApp({ me: new ME() as any, app, target: '#root' });
```

```tsx
// views/Home.tsx — reads from .me namespace
import { Typography, Button } from 'this.gui/atoms';
import { Hero, Stack } from 'this.gui/molecules';
import { useMeValue } from 'this.gui/react';

export default function Home() {
  const title = useMeValue<string>('apps.my-app.manifest.title') || 'My App';
  return (
    <Hero height="100vh" mode="left" padding={{ xs: 3, md: 8 }}>
      <Stack spacing={2} alignItems="flex-start">
        <Typography variant="h1">{title}</Typography>
        <Button variant="contained" size="large">Get started</Button>
      </Stack>
    </Hero>
  );
}
```

## Package Surface

Components are organized as **atoms → molecules → compounds** — primitives compose
into patterns, patterns compose into features.

| Entry | What it gives you |
|---|---|
| `this.gui` | `Theme`, `Layout`, `ThemeLauncher` |
| `this.gui/atoms` | Primitives — `Box`, `Button`, `Typography`, `Icon`, `Avatar`, … |
| `this.gui/molecules` | Compositions — `Hero`, `Stack`, `Page`, … |
| `this.gui/compounds` | Feature panels built from molecules |
| `this.gui/react` | `.me` bridge — `Me`, `useMeValue`, `useMeAction` |
| `this.gui/runtime` | `mountApp`, `declareApp`, `writeMeValue`, `readMeValue` |

## Docs

[neurons-me.github.io/GUI](https://neurons-me.github.io/GUI/docs/)

---

<img src="https://suign.github.io/assets/imgs/neurons_me_logo.png" alt="neurons.me logo" width="89">

**MIT License.** ∴ suiGn / [neurons.me](https://neurons.me)
