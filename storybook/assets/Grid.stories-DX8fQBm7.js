import{j as r,B as s}from"./iframe-q72FflWy.js";import{G as e}from"./Grid-BO83D8-E.js";import"./preload-helper-Dp1pzeXC.js";const f={title:"Molecules/Grid",component:e,tags:["autodocs"],decorators:[o=>r.jsx("div",{style:{padding:0,minHeight:240},children:r.jsx(o,{})})],parameters:{docs:{description:{component:`
The **Grid** atom is a thin wrapper around MUI's \`Grid\` component. It keeps the original API and polymorphism but integrates with **This.GUI** tokens and allows declarative usage via the resolver.

---
## Features
- Supports all MUI Grid props like \`container\`, \`item\`, \`spacing\`, \`xs\`, \`sm\`, \`md\`, etc.
- Fully themeable via **This.GUI** tokens and \`sx\`.
- Works both as a container and as an item.
- Can be described declaratively via JSON specs for resolvers.

---
## Key Props
- \`container?: boolean\` — defines a grid container.
- \`item?: boolean\` — defines a grid item.
- \`spacing?: number | object\` — gap between items (when container).
- \`xs | sm | md | lg | xl?: number\` — responsive column sizes.
- \`sx?: object\` — granular styling.

---
## Basic usage (React)
~~~tsx
import { Grid, Box } from '@/gui/atoms';

<Grid container spacing={2}>
  <Grid item xs={6}>
    <Box sx={{ backgroundColor: 'primary.main', p: 2, color: '#fff' }}>Item 1</Box>
  </Grid>
  <Grid item xs={6}>
    <Box sx={{ backgroundColor: 'secondary.main', p: 2, color: '#fff' }}>Item 2</Box>
  </Grid>
</Grid>
~~~

---
## Declarative JSON / Config usage
This GUI's **resolver** lets you describe a Grid via a config object:

~~~json
{
  "type": "Grid",
  "props": {
    "container": true,
    "spacing": 2,
    "children": [
      {
        "type": "Grid",
        "props": {
          "item": true,
          "xs": 6,
          "children": {
            "type": "Box",
            "props": {
              "sx": { "backgroundColor": "primary.main", "p": 2, "color": "#fff" },
              "children": "Item 1"
            }
          }
        }
      },
      {
        "type": "Grid",
        "props": {
          "item": true,
          "xs": 6,
          "children": {
            "type": "Box",
            "props": {
              "sx": { "backgroundColor": "secondary.main", "p": 2, "color": "#fff" },
              "children": "Item 2"
            }
          }
        }
      }
    ]
  }
}
~~~

> The resolver maps this spec to real React elements, preserving polymorphism and \`sx\` styling.
        `}}}},n={render:o=>r.jsxs(e,{...o,container:!0,spacing:2,children:[r.jsx(e,{item:!0,xs:6,children:r.jsx(s,{sx:{backgroundColor:"primary.main",p:2,color:"#fff"},children:"Item 1"})}),r.jsx(e,{item:!0,xs:6,children:r.jsx(s,{sx:{backgroundColor:"secondary.main",p:2,color:"#fff"},children:"Item 2"})})]})},i={render:o=>r.jsxs(e,{...o,container:!0,spacing:2,children:[r.jsx(e,{item:!0,xs:12,sm:6,md:4,children:r.jsx(s,{sx:{backgroundColor:"info.main",p:2,color:"#fff"},children:"xs=12 sm=6 md=4"})}),r.jsx(e,{item:!0,xs:12,sm:6,md:4,children:r.jsx(s,{sx:{backgroundColor:"success.main",p:2,color:"#fff"},children:"xs=12 sm=6 md=4"})}),r.jsx(e,{item:!0,xs:12,sm:12,md:4,children:r.jsx(s,{sx:{backgroundColor:"warning.main",p:2,color:"#fff"},children:"xs=12 sm=12 md=4"})})]}),name:"Responsive Grid Layout"},g=["Playground","ResponsiveGrid"];var a,t,d;n.parameters={...n.parameters,docs:{...(a=n.parameters)==null?void 0:a.docs,source:{originalSource:`{
  render: args => <Grid {...args} container spacing={2}>
      <Grid item xs={6}>
        <Box sx={{
        backgroundColor: 'primary.main',
        p: 2,
        color: '#fff'
      }}>Item 1</Box>
      </Grid>
      <Grid item xs={6}>
        <Box sx={{
        backgroundColor: 'secondary.main',
        p: 2,
        color: '#fff'
      }}>Item 2</Box>
      </Grid>
    </Grid>
}`,...(d=(t=n.parameters)==null?void 0:t.docs)==null?void 0:d.source}}};var c,m,l;i.parameters={...i.parameters,docs:{...(c=i.parameters)==null?void 0:c.docs,source:{originalSource:`{
  render: args => <Grid {...args} container spacing={2}>
      <Grid item xs={12} sm={6} md={4}>
        <Box sx={{
        backgroundColor: 'info.main',
        p: 2,
        color: '#fff'
      }}>xs=12 sm=6 md=4</Box>
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <Box sx={{
        backgroundColor: 'success.main',
        p: 2,
        color: '#fff'
      }}>xs=12 sm=6 md=4</Box>
      </Grid>
      <Grid item xs={12} sm={12} md={4}>
        <Box sx={{
        backgroundColor: 'warning.main',
        p: 2,
        color: '#fff'
      }}>xs=12 sm=12 md=4</Box>
      </Grid>
    </Grid>,
  name: 'Responsive Grid Layout'
}`,...(l=(m=i.parameters)==null?void 0:m.docs)==null?void 0:l.source}}};export{n as Playground,i as ResponsiveGrid,g as __namedExportsOrder,f as default};
