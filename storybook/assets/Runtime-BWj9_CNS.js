import{u as t,j as e,M as r}from"./iframe-q72FflWy.js";import"./preload-helper-Dp1pzeXC.js";function s(i){const n={code:"code",h1:"h1",h2:"h2",hr:"hr",li:"li",p:"p",pre:"pre",strong:"strong",ul:"ul",...t(),...i.components};return e.jsxs(e.Fragment,{children:[e.jsx(r,{title:"Getting Started/Runtime"}),`
`,e.jsx(n.h1,{id:"runtime",children:"Runtime"}),`
`,e.jsxs(n.p,{children:[e.jsx(n.code,{children:"this.gui"})," renders a spec, but ",e.jsx(n.strong,{children:"runtime"})," decides how data and actions resolve."]}),`
`,e.jsx(n.p,{children:"Modern usage is split across two explicit surfaces:"}),`
`,e.jsxs(n.ul,{children:[`
`,e.jsxs(n.li,{children:[e.jsx(n.code,{children:"this.gui/react"})," for the ",e.jsx(n.code,{children:".me"})," React bridge"]}),`
`,e.jsxs(n.li,{children:[e.jsx(n.code,{children:"this.gui/runtime"})," for ",e.jsx(n.code,{children:"mount()"}),", adapters, and lower-level runtime APIs"]}),`
`]}),`
`,e.jsxs(n.p,{children:["If you call ",e.jsx(n.code,{children:"mount()"})," directly inside a React/Vite app, pass ",e.jsx(n.code,{children:"gui"}),", ",e.jsx(n.code,{children:"React"}),", and ",e.jsx(n.code,{children:"ReactDOM"})," explicitly."]}),`
`,e.jsx(n.hr,{}),`
`,e.jsx(n.h2,{id:"minimal-no-runtime",children:"Minimal: no runtime"}),`
`,e.jsx(n.p,{children:"Use this when you only need static UI."}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-ts",children:`import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import * as GUI from 'this.gui';
import { mount } from 'this.gui/runtime';

const spec = {
  type: 'Page',
  props: { title: 'Hello GUI' },
  children: [
    { type: 'Button', props: { variant: 'contained', children: 'Click' } },
  ],
};

mount(spec, '#root', { gui: GUI, React, ReactDOM });
`})}),`
`,e.jsx(n.hr,{}),`
`,e.jsx(n.h2,{id:"pass-a-runtime-adapter",children:"Pass a runtime adapter"}),`
`,e.jsx(n.p,{children:"Use this when you already have a runtime (custom adapter, router, shared app state)."}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-ts",children:`import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import * as GUI from 'this.gui';
import { mount } from 'this.gui/runtime';

const runtime = buildRuntime(/* ... */);

mount(spec, '#root', { gui: GUI, React, ReactDOM, runtime });
`})}),`
`,e.jsx(n.hr,{}),`
`,e.jsxs(n.h2,{id:"pass-a-me-instance",children:["Pass a ",e.jsx(n.code,{children:".me"})," instance"]}),`
`,e.jsxs(n.p,{children:["If ",e.jsx(n.code,{children:".me"})," is your runtime, you can pass ",e.jsx(n.code,{children:"{ me }"}),` and GUI will derive the runtime.
For mixed React + mounted-spec screens, sharing an explicit runtime is cleaner.`]}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-ts",children:`import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import * as GUI from 'this.gui';
import ME from 'this.me';
import { createMeRuntime, mount } from 'this.gui/runtime';

const me = new ME();
const runtime = createMeRuntime(me);

mount(spec, '#root', {
  gui: GUI,
  React,
  ReactDOM,
  me,
  runtime,
  devtools: {
    inspector: false,
    inspectorToggleVisible: true,
    adminView: false,
  },
});
`})}),`
`,e.jsx(n.hr,{}),`
`,e.jsx(n.h2,{id:"when-to-choose-which",children:"When to choose which"}),`
`,e.jsxs(n.ul,{children:[`
`,e.jsxs(n.li,{children:[e.jsx(n.strong,{children:"No runtime"}),": static docs, marketing pages, or mockups."]}),`
`,e.jsxs(n.li,{children:[e.jsx(n.strong,{children:"runtime"}),": you already have a runtime adapter (router, app state)."]}),`
`,e.jsxs(n.li,{children:[e.jsx(n.strong,{children:"me"}),": your app is driven by ",e.jsx(n.code,{children:".me"})," and you want the cleanest API."]}),`
`]}),`
`,e.jsx(n.hr,{}),`
`,e.jsx(n.h2,{id:"canonical-story",children:"Canonical Story"}),`
`,e.jsxs(n.p,{children:["See ",e.jsx(n.code,{children:"Runtime/React + .me Basic"})," for the canonical smoke test:"]}),`
`,e.jsxs(n.ul,{children:[`
`,e.jsx(n.li,{children:e.jsx(n.code,{children:"MeRuntimeProvider"})}),`
`,e.jsx(n.li,{children:e.jsx(n.code,{children:"useMeValue"})}),`
`,e.jsx(n.li,{children:e.jsx(n.code,{children:"useMeAction"})}),`
`,e.jsxs(n.li,{children:["official ",e.jsx(n.code,{children:"<Me />"})]}),`
`,e.jsxs(n.li,{children:[e.jsx(n.code,{children:"mount()"})," with shared ",e.jsx(n.code,{children:".me"})," runtime"]}),`
`,e.jsxs(n.li,{children:["opt-in ",e.jsx(n.code,{children:"devtools"})]}),`
`]})]})}function a(i={}){const{wrapper:n}={...t(),...i.components};return n?e.jsx(n,{...i,children:e.jsx(s,{...i})}):s(i)}export{a as default};
