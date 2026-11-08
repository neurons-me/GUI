import{u as o,j as e,M as t,C as s}from"./iframe-Dgz0DvjP.js";import{Q as c,D as d}from"./QuickStart.stories-DyYxmgy6.js";import"./preload-helper-Dp1pzeXC.js";import"./me.es-Bc6mvw-6.js";import"./launcherPopover-UgT8i8jv.js";import"./AppShell-DWdFdpJO.js";import"./GuiPages-BITmAqEd.js";import"./Icon-zhfCvvEA.js";import"./TopBar-B-O3jfYe.js";import"./Menu-D9ienzuU.js";import"./useSlot-CjwkB68v.js";import"./resolveComponentProps-C7RzSJ6V.js";import"./useForkRef-DhiyL1xF.js";import"./useSlotProps-D6FndUWw.js";import"./isHostComponent-DVu5iVWx.js";import"./Paper-DKRGBdYt.js";import"./Grow-D7g5qnif.js";import"./TransitionGroupContext-Bovk2g5c.js";import"./mergeSlotProps-DoPK-Muf.js";import"./useEventCallback-CW9ai8zV.js";import"./List-BZwm0z1v.js";import"./MenuItem-DVYWd6rG.js";import"./ButtonBase-DnPFUmZ4.js";import"./listItemIconClasses-U7MvxmKI.js";import"./listItemTextClasses-CANx9uJI.js";import"./dividerClasses-BXzcgXwe.js";import"./getThemeProps-DPkTTLbc.js";import"./useInsets-Cl1hGTb2.js";import"./LeftSidebarContext-COW4ZKa6.js";import"./Avatar-CRm8ZbT3.js";import"./createSvgIcon-BTgnJVyE.js";import"./AppBar-DeyLG5Ky.js";import"./Toolbar-CvqahxVg.js";import"./Layout-eUWfEUDJ.js";import"./Tooltip-Dxz6oaTn.js";import"./Tooltip-B13adE9r.js";import"./useControlled-DSrQ-lxT.js";import"./Collapse-DfTvU6GR.js";import"./IconButton-D_VO_Lm6.js";import"./CircularProgress-CRe5HlWG.js";import"./Gauge-auIj8jG9.js";import"./IconButton-HxKAscSc.js";import"./Avatar-BlQEDC2q.js";import"./TextField-ROcKb43U.js";import"./useFormControl-CTXUw6wt.js";import"./isMuiElement-BIZd4XRc.js";import"./Drawer-YSKRlM1U.js";import"./Button-B3yzBwnB.js";import"./Button-BrwXx0gp.js";import"./Paper-DdBU6wUz.js";import"./Progress-ClTpsf_Z.js";import"./ListItemIcon-Dk9aJ05I.js";import"./ListItemText-DCgrBkAM.js";import"./guiNodeId-Dhpdk8uV.js";import"./AppBar-DPYXXQh5.js";import"./StickyOptionsTop-D26zHUmd.js";import"./QR.me-BskVFbDs.js";import"./QR-BWW61rs2.js";import"./PixelWordmark-DlzTr5ww.js";import"./ToggleMode-B3XOpHmB.js";import"./Switch-D3rl4sxQ.js";import"./Catalog-Bkh75JjA.js";import"./Grid-5Gb7XIfZ.js";import"./Card-BlmjwST2.js";import"./CardHeader-RTlhCgE0.js";import"./CardContent-CFaEEAZE.js";import"./CardActions-44Ka-f-U.js";import"./ClickAwayListener-C8Hpa77_.js";import"./SeedSessionProvider-BeX3WvN1.js";import"./Me-BT-LrcBn.js";import"./createSeedSession-BG4w7POb.js";import"./cleaker.es-CjbQ9B8Y.js";import"./sha3-Bn30YVQW.js";import"./useMe-BLn7zUEV.js";import"./localIdentityVault-s9IV2zl-.js";import"./namespaceExpression-vtRlIp1z.js";import"./Chip-Ccehea2u.js";import"./Chip-84Nuw-fl.js";import"./DialogContent-b3_QE_yD.js";import"./useMeAction-CUbL__aw.js";import"./useMeValue-CcPZQ3GM.js";import"./client-Bkzy0_TJ.js";import"./SpecBoundary-C9FDvdAY.js";import"./Hero-CV8edtFG.js";import"./Stack-CPORitL0.js";function n(r){const i={code:"code",h1:"h1",h2:"h2",li:"li",p:"p",pre:"pre",strong:"strong",ul:"ul",...o(),...r.components};return e.jsxs(e.Fragment,{children:[e.jsx(t,{of:c}),`
`,e.jsx(i.h1,{id:"quick-start",children:"Quick Start"}),`
`,e.jsx(i.h2,{id:"1-install",children:"1. Install"}),`
`,e.jsx(i.pre,{children:e.jsx(i.code,{className:"language-bash",children:`npx this.gui my-app
cd my-app
npm install
npm run dev
`})}),`
`,e.jsxs(i.p,{children:["That scaffolds a Vite + React app already wired to ",e.jsx(i.code,{children:"this.gui"})," and ",e.jsx(i.code,{children:"this.me"}),` —
`,e.jsx(i.code,{children:"AppShell"})," (left rail with navigation and the Theme, ",e.jsx(i.code,{children:".me"}),` and Dev Tools
launchers, plus a top bar that says where you are), and a session surface, all
out of the box. `,e.jsx(i.code,{children:"npm run dev"})," also starts (or reuses) a real ",e.jsx(i.code,{children:"this.me"}),` monad for
the app's own namespace via `,e.jsx(i.code,{children:"npx monads start <app-id> --namespace <app-id>.local"})," — nothing to provision by hand."]}),`
`,e.jsxs(i.p,{children:["Prefer no build step? ",e.jsx(i.code,{children:"npx this.gui --html"})," drops a single ",e.jsx(i.code,{children:"index.html"}),` that
loads `,e.jsx(i.code,{children:"this.gui.umd.js"})," from a CDN and calls ",e.jsx(i.code,{children:"window.GUI.mount(spec, '#root')"})," directly."]}),`
`,e.jsx(i.h2,{id:"2-what-you-get",children:"2. What you get"}),`
`,e.jsx(i.pre,{children:e.jsx(i.code,{children:`my-app/
  src/
    app.ts        # declareApp(): id, namespace, title, theme, views
    main.tsx       # creates the public \`me\`, the runtime, mounts <Root/>
    Root.tsx       # <AppShell app={app} me={me} runtime={runtime} position brand .../>
    views/
      Home.tsx     # your first view: .GUI / Powered by .me / Get started
      Spaces.tsx   # Admin: the Spaces explorer, gated on a session
`})}),`
`,e.jsxs(i.p,{children:[e.jsx(i.code,{children:"app.ts"})," declares the shape; ",e.jsx(i.code,{children:"main.tsx"})," wires it to a live ",e.jsx(i.code,{children:".me"}),` connection;
every view is a normal React component that reads/writes through hooks like
`,e.jsx(i.code,{children:"useSessionSurface()"})," and ",e.jsx(i.code,{children:"useMeAction()"}),` — no separate templating language
to learn on top of React.`]}),`
`,e.jsx(i.h2,{id:"3-the-exports-by-entry-point",children:"3. The exports, by entry point"}),`
`,e.jsxs(i.p,{children:[e.jsx(i.code,{children:"this.gui"}),` ships as several separate entry points — import only what a given
file needs, not the whole library:`]}),`
`,e.jsxs(i.ul,{children:[`
`,e.jsxs(i.li,{children:[e.jsx(i.strong,{children:e.jsx(i.code,{children:"this.gui"})})," — ",e.jsx(i.code,{children:"GUI.mount(spec, target)"}),`, the bare runtime with no build
step (used by `,e.jsx(i.code,{children:"--html"})," mode)"]}),`
`,e.jsxs(i.li,{children:[e.jsx(i.strong,{children:e.jsx(i.code,{children:"this.gui/runtime"})})," — ",e.jsx(i.code,{children:"mountApp"}),", ",e.jsx(i.code,{children:"declareApp"}),", ",e.jsx(i.code,{children:"AppShell"}),`,
`,e.jsx(i.code,{children:"SpecBoundary"}),", ",e.jsx(i.code,{children:"createWsMeRuntime"}),", ",e.jsx(i.code,{children:"AppDeclaration"}),` — the app shell and
the spec-to-React renderer`]}),`
`,e.jsxs(i.li,{children:[e.jsx(i.strong,{children:e.jsx(i.code,{children:"this.gui/react"})})," — ",e.jsx(i.code,{children:"SeedSessionProvider"}),", ",e.jsx(i.code,{children:"SessionSurface"}),`,
`,e.jsx(i.code,{children:"useSessionSurface"}),", ",e.jsx(i.code,{children:"MeLauncher"}),", ",e.jsx(i.code,{children:"CleakerLanding"}),", ",e.jsx(i.code,{children:"useMe"}),", ",e.jsx(i.code,{children:"useMeValue"}),`,
`,e.jsx(i.code,{children:"useMeAction"})," — session and live-data hooks"]}),`
`,e.jsxs(i.li,{children:[e.jsx(i.strong,{children:e.jsx(i.code,{children:"this.gui/atoms"})})," — ",e.jsx(i.code,{children:"Box"}),", ",e.jsx(i.code,{children:"Typography"}),", ",e.jsx(i.code,{children:"Button"}),", ",e.jsx(i.code,{children:"Card"}),", ",e.jsx(i.code,{children:"TextField"}),`,
`,e.jsx(i.code,{children:"Switch"}),", ",e.jsx(i.code,{children:"Avatar"}),", ",e.jsx(i.code,{children:"Chip"}),", … the base component set (see ",e.jsx(i.strong,{children:"Atoms"}),` in the
sidebar for the full list)`]}),`
`,e.jsxs(i.li,{children:[e.jsx(i.strong,{children:e.jsx(i.code,{children:"this.gui/molecules"})}),` — composite components built from atoms (see
`,e.jsx(i.strong,{children:"Molecules"}),")"]}),`
`,e.jsxs(i.li,{children:[e.jsx(i.strong,{children:e.jsx(i.code,{children:"this.gui/compounds"})}),` — higher-level, app-shaped components (see
`,e.jsx(i.strong,{children:"Compounds"}),")"]}),`
`,e.jsxs(i.li,{children:[e.jsx(i.strong,{children:e.jsx(i.code,{children:"this.gui/devtools"})})," — ",e.jsx(i.code,{children:"DevToolsLauncher"}),", ",e.jsx(i.code,{children:"RuntimeInspector"}),`,
`,e.jsx(i.code,{children:"SelectionProvider"})," — the inspector/selection overlay, opt-in"]}),`
`,e.jsxs(i.li,{children:[e.jsx(i.strong,{children:e.jsx(i.code,{children:"this.gui/cleaker"})})," — the Cleaker identity/namespace surface pieces"]}),`
`,e.jsxs(i.li,{children:[e.jsx(i.strong,{children:e.jsx(i.code,{children:"this.gui/style.css"})})," — base styles, import once at the app root"]}),`
`]}),`
`,e.jsxs(i.p,{children:["A minimal ",e.jsx(i.code,{children:"main.tsx"})," touches three of these:"]}),`
`,e.jsx(i.pre,{children:e.jsx(i.code,{className:"language-tsx",children:`import { createWsMeRuntime } from 'this.gui/runtime';
import { SeedSessionProvider, SessionSurface } from 'this.gui/react';
import 'this.gui/style.css';
`})}),`
`,e.jsx(i.h2,{id:"4-see-it-live",children:"4. See it live"}),`
`,e.jsxs(i.p,{children:["The story below is a literal render of exactly what ",e.jsx(i.code,{children:"npx this.gui my-app"}),`
produces — same `,e.jsx(i.code,{children:"AppShell"}),` (top-bar position, brand, rail launchers), same
`,e.jsx(i.code,{children:"Home"}),` view, same app declaration. The kernel runs in memory here instead of
connecting to a monad, and the lightning-bolt bubble is a netget demo, not part
of the scaffold. Use it as the working reference for what "wired correctly" looks
like.`]}),`
`,e.jsx(s,{of:d})]})}function Xe(r={}){const{wrapper:i}={...o(),...r.components};return i?e.jsx(i,{...r,children:e.jsx(n,{...r})}):n(r)}export{Xe as default};
