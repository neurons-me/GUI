import{L as e,j as r,h as s}from"./iframe-q72FflWy.js";import{B as u}from"./Button-DuvGvkXy.js";import"./Paper-9gdP3SeZ.js";import"./preload-helper-Dp1pzeXC.js";import"./Icon-Doq3uhPc.js";import"./Button-BpF6GA05.js";import"./ButtonBase-D2HnvhjV.js";import"./TransitionGroupContext-4zVEsxkP.js";import"./useForkRef-BR9zNRBO.js";import"./useEventCallback-BVb6jHPB.js";import"./CircularProgress-BunsQ8Ul.js";import"./Paper-C4cHEfmg.js";const U={title:"Atoms/Link",component:e,tags:["autodocs"],decorators:[n=>r.jsx("div",{style:{padding:16,minHeight:240},children:r.jsx(n,{})})],parameters:{docs:{description:{component:`
The **Link** primitive is a thin wrapper over MUI's \`MuiLink\` that supports **both** external links (\`href\`) and internal routing (\`to\`) using **react-router-dom**. It integrates with **This.GUI** theming via the \`Theme\` provider.

---
## Features
- External links with \`href\` (renders an anchor).
- Internal navigation with \`to\` (renders a RouterLink under the hood).
- Works seamlessly as a child or as a render target for other primitives (e.g. \`<Button component={Link} to="/docs"/>\`).
- Inherits typography and color from the theme tokens.

---
## Key Props
- \`href?: string\` — external URL.
- \`to?: string | LocationDescriptor\` — internal route (react-router-dom).
- \`underline?: 'none' | 'hover' | 'always'\` — underline behavior.
- \`color?: 'primary' | 'secondary' | 'inherit' | 'textPrimary' | 'textSecondary' | 'error' | 'info' | 'success' | 'warning'\`.

> Note: \`to\` and \`href\` are demonstrated in dedicated stories rather than Storybook controls.

---
## Basic Usage
~~~jsx
import { Link } from '@/gui/primitives';

<Link href="https://neurons.me" target="_blank" rel="noreferrer">Visit neurons.me</Link>
~~~

## Internal Routing
~~~jsx
import { Link } from '@/gui/primitives';

<Link to="/docs">Go to docs</Link>
~~~

## As render target for Button
~~~jsx
import { Button, Link } from '@/gui/primitives';

<Button component={Link} to="/docs">Docs</Button>
~~~

## Declarative JSON / Config usage
~~~json
{
  "type": "Link",
  "props": {
    "to": "/docs",
    "children": "Go to docs"
  }
}
~~~

Another example with an external URL:
~~~json
{
  "type": "Link",
  "props": {
    "href": "https://neurons.me",
    "target": "_blank",
    "rel": "noreferrer",
    "children": "Visit neurons.me"
  }
}
~~~
        `}}},argTypes:{underline:{control:{type:"radio"},options:["none","hover","always"]},color:{control:{type:"select"},options:["primary","secondary","inherit","textPrimary","textSecondary","error","info","success","warning"]},component:{table:{disable:!0}}},args:{underline:"hover",color:"primary",children:"Example link"}},o={},i={render:n=>{const m=["primary","secondary","success","info","warning","error"];return r.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:32},children:[r.jsxs("div",{children:[r.jsx(s,{variant:"h6",gutterBottom:!0,children:"Colors"}),r.jsx("div",{style:{display:"flex",gap:12,flexWrap:"wrap"},children:m.map(t=>r.jsx(e,{...n,color:t,href:"#",children:t[0].toUpperCase()+t.slice(1)},t))})]}),r.jsxs("div",{children:[r.jsx(s,{variant:"h6",gutterBottom:!0,children:"Underline"}),r.jsxs("div",{style:{display:"flex",gap:12,flexWrap:"wrap"},children:[r.jsx(e,{...n,underline:"none",href:"#",children:"None"}),r.jsx(e,{...n,underline:"hover",href:"#",children:"Hover"}),r.jsx(e,{...n,underline:"always",href:"#",children:"Always"})]})]}),r.jsxs("div",{children:[r.jsx(s,{variant:"h6",gutterBottom:!0,children:"Usage"}),r.jsxs("div",{style:{display:"flex",gap:12,flexWrap:"wrap",alignItems:"center"},children:[r.jsx(e,{href:"https://neurons.me",target:"_blank",rel:"noreferrer",children:"External (href)"}),r.jsx(e,{to:"/docs",children:"Internal (to)"}),r.jsx(u,{component:e,to:"/docs",children:"As Button component"})]})]})]})}},b=["Playground","Variants"];var a,l,p;o.parameters={...o.parameters,docs:{...(a=o.parameters)==null?void 0:a.docs,source:{originalSource:"{}",...(p=(l=o.parameters)==null?void 0:l.docs)==null?void 0:p.source}}};var d,c,h;i.parameters={...i.parameters,docs:{...(d=i.parameters)==null?void 0:d.docs,source:{originalSource:`{
  render: args => {
    const colors: Array<any> = ['primary', 'secondary', 'success', 'info', 'warning', 'error'];
    return <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 32
    }}>
        <div>
          <Typography variant="h6" gutterBottom>Colors</Typography>
          <div style={{
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap'
        }}>
            {colors.map(c => <Link key={c} {...args} color={c} href="#">
                {c[0].toUpperCase() + c.slice(1)}
              </Link>)}
          </div>
        </div>
        <div>
          <Typography variant="h6" gutterBottom>Underline</Typography>
          <div style={{
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap'
        }}>
            <Link {...args} underline="none" href="#">None</Link>
            <Link {...args} underline="hover" href="#">Hover</Link>
            <Link {...args} underline="always" href="#">Always</Link>
          </div>
        </div>
        <div>
          <Typography variant="h6" gutterBottom>Usage</Typography>
          <div style={{
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
            <Link href="https://neurons.me" target="_blank" rel="noreferrer">External (href)</Link>
            <Link to="/docs">Internal (to)</Link>
            <Button component={Link} to="/docs">As Button component</Button>
          </div>
        </div>
      </div>;
  }
}`,...(h=(c=i.parameters)==null?void 0:c.docs)==null?void 0:h.source}}};export{o as Playground,i as Variants,b as __namedExportsOrder,U as default};
