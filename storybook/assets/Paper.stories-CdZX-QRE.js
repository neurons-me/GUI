import{j as e}from"./iframe-q72FflWy.js";import{P as n}from"./Paper-9gdP3SeZ.js";import"./preload-helper-Dp1pzeXC.js";import"./Paper-C4cHEfmg.js";const h={title:"Atoms/Paper",component:n,tags:["autodocs"],decorators:[a=>e.jsx("div",{style:{padding:16,minHeight:240,background:"var(--mui-palette-background-default)"},children:e.jsx(a,{})})],parameters:{docs:{description:{component:`
The **Paper** atom is a thin wrapper around MUI's \`MuiPaper\` that preserves **polymorphism** and integrates with **This.GUI** theming.

---
## Features
- Variants: \`elevation\`, \`outlined\`
- Elevation: \`0..24\`
- \`square\` toggle
- Polymorphic via \`component\`
- Fully stylable via \`sx\`

---
## Key Props
- \`variant?: 'elevation' | 'outlined'\`
- \`elevation?: number\`
- \`square?: boolean\`
- \`sx?: object\`

---
## Basic usage (React)
~~~tsx
import { Paper } from '@/gui/atoms';

<Paper elevation={2} sx={{ p: 2 }}>
  Content
</Paper>
~~~

---
## Declarative JSON / Config usage
~~~json
{
  "type": "Paper",
  "props": {
    "variant": "outlined",
    "sx": { "p": 2 },
    "children": "Content"
  }
}
~~~
        `}},controls:{exclude:["component"]}},argTypes:{variant:{control:{type:"radio"},options:["elevation","outlined"]},elevation:{control:{type:"range",min:0,max:24,step:1}},square:{control:"boolean"},sx:{control:"object"}},args:{variant:"elevation",elevation:1,square:!1,children:"Paper content",sx:{p:2}}},r={},t={render:a=>e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:32},children:[e.jsxs("div",{children:[e.jsx("h3",{children:"Variants"}),e.jsxs("div",{style:{display:"flex",gap:12,flexWrap:"wrap"},children:[e.jsx(n,{...a,variant:"elevation",children:"Elevation"}),e.jsx(n,{...a,variant:"outlined",children:"Outlined"})]})]}),e.jsxs("div",{children:[e.jsx("h3",{children:"Elevation Levels"}),e.jsx("div",{style:{display:"flex",gap:12,flexWrap:"wrap"},children:[0,1,2,4,8,16,24].map(i=>e.jsxs(n,{...a,elevation:i,children:["elevation ",i]},i))})]}),e.jsxs("div",{children:[e.jsx("h3",{children:"States"}),e.jsxs("div",{style:{display:"flex",gap:12,flexWrap:"wrap"},children:[e.jsx(n,{...a,children:"Default"}),e.jsx(n,{...a,square:!0,children:"Square"}),e.jsx(n,{...a,variant:"outlined",square:!0,children:"Outlined Square"})]})]})]})},g=["Playground","Variants"];var s,l,o;r.parameters={...r.parameters,docs:{...(s=r.parameters)==null?void 0:s.docs,source:{originalSource:"{}",...(o=(l=r.parameters)==null?void 0:l.docs)==null?void 0:o.source}}};var p,d,c;t.parameters={...t.parameters,docs:{...(p=t.parameters)==null?void 0:p.docs,source:{originalSource:`{
  render: args => {
    return <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 32
    }}>
        <div>
          <h3>Variants</h3>
          <div style={{
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap'
        }}>
            <Paper {...args} variant="elevation">Elevation</Paper>
            <Paper {...args} variant="outlined">Outlined</Paper>
          </div>
        </div>

        <div>
          <h3>Elevation Levels</h3>
          <div style={{
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap'
        }}>
            {[0, 1, 2, 4, 8, 16, 24].map(e => <Paper key={e} {...args} elevation={e}>
                elevation {e}
              </Paper>)}
          </div>
        </div>

        <div>
          <h3>States</h3>
          <div style={{
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap'
        }}>
            <Paper {...args}>Default</Paper>
            <Paper {...args} square>Square</Paper>
            <Paper {...args} variant="outlined" square>Outlined Square</Paper>
          </div>
        </div>
      </div>;
  }
}`,...(c=(d=t.parameters)==null?void 0:d.docs)==null?void 0:c.source}}};export{r as Playground,t as Variants,g as __namedExportsOrder,h as default};
