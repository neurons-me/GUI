import{j as r,a as e,B as W}from"./iframe-9xs7r-yC.js";import{A as D}from"./AppBar-Dmb1gXWb.js";import{B as C}from"./Button-BZ2a02w5.js";import{I as l}from"./IconButton-BTVRcgHZ.js";import"./Paper-D3ZYW61L.js";import"./Hero-DtS3rAl9.js";import{T as o}from"./Gauge-b94eazVZ.js";import"./ListItemIcon-B7hmZwSO.js";import"./ListItemText-CYWXZB3q.js";import"./Drawer-cqwrOwxl.js";import{I as d}from"./Icon-Coo2vCLK.js";import"./preload-helper-Dp1pzeXC.js";import"./AppBar-DPKQgtSA.js";import"./Paper-BQJEQDIX.js";import"./Button-2IZqaMH4.js";import"./ButtonBase-CmaSafY6.js";import"./TransitionGroupContext-Ddsw9Vt9.js";import"./useForkRef-CY5C0zUu.js";import"./CircularProgress-Cc9H9qAL.js";import"./IconButton-2EQKHUpt.js";import"./Avatar-CYaJ7BCk.js";import"./Avatar-CHOZ5ucK.js";import"./createSvgIcon-ApOObPh6.js";import"./useSlot-Pi2X4fgs.js";import"./resolveComponentProps-Cy9ikCBM.js";import"./TextField-MYNk8PjL.js";import"./useFormControl-Daq17cxB.js";import"./isHostComponent-DVu5iVWx.js";import"./Menu-DcUO-yQz.js";import"./useSlotProps-CEMoFeCz.js";import"./Grow-CkmZyC82.js";import"./mergeSlotProps-DRRQWfkx.js";import"./List-QlunaKS6.js";import"./useControlled-CR8NUisP.js";import"./isMuiElement-FUZCUFHm.js";import"./Progress-BGC2gmP_.js";import"./Toolbar-DWHH-c6u.js";import"./listItemIconClasses-Cdc3Z4Nj.js";import"./listItemTextClasses-BzoRJwRN.js";import"./dividerClasses-D5nEUdl6.js";const Tr={title:"Molecules/Toolbar",component:o,tags:["autodocs"],decorators:[R=>r.jsx("div",{style:{padding:16,minHeight:240},children:r.jsx(R,{})})],parameters:{docs:{description:{component:`
The **Toolbar** atom is a thin wrapper over MUI's \`MuiToolbar\`.

> **Not polymorphic.** Unlike \`Button\` or \`Box\`, **Toolbar does not accept** a \`component\` prop in MUI. If you need a different semantic element (e.g. \`<header>\`), wrap it with \`<Box component="header">\`.

---
## Features
- Density via \`variant\`: \`'regular'\` | \`'dense'\`.
- Optional gutters removal with \`disableGutters\`.
- Full **\`sx\`** support for styling.
- Plays nicely inside **Bar** and custom layouts.

---
## Key Props
- \`variant?: 'regular' | 'dense'\`
- \`disableGutters?: boolean\`
- \`sx?: SxProps\` — theme-aware styling.

---
## Basic usage
~~~tsx
import { Toolbar } from '@/gui/atoms';

<Toolbar>
  <span>Left content</span>
</Toolbar>
~~~

## In an Bar
~~~tsx
import { Bar, Toolbar, Typography } from '@/gui/atoms';

<Bar position="static">
  <Toolbar>
    <Typography variant="h6">Title</Typography>
  </Toolbar>
</Bar>
~~~

## Change semantic element with Box
~~~tsx
import { Box, Toolbar } from '@/gui/atoms';

<Box component="header">
  <Toolbar variant="dense">Compact header</Toolbar>
</Box>
~~~
        `}},controls:{exclude:["component"]}},argTypes:{variant:{control:{type:"radio"},options:["regular","dense"]},disableGutters:{control:"boolean"}},args:{variant:"regular",disableGutters:!1,children:r.jsx("div",{style:{display:"flex",width:"100%",alignItems:"center",gap:12},children:r.jsx("strong",{children:"Toolbar content"})})}},a={},t={render:()=>r.jsxs("div",{style:{display:"grid",gap:12},children:[r.jsx(o,{children:r.jsx(e,{variant:"body2",children:"Regular Toolbar"})}),r.jsx(o,{variant:"dense",children:r.jsx(e,{variant:"body2",children:"Dense Toolbar"})})]})},s={render:()=>r.jsxs(o,{sx:{display:"flex",gap:8},children:[r.jsx(e,{sx:{flex:1},variant:"h6",children:"Title"}),r.jsx(l,{"aria-label":"search",children:r.jsx(d,{name:"search",fontSize:20})}),r.jsx(l,{"aria-label":"user",children:r.jsx(d,{name:"person",fontSize:20})}),r.jsx(C,{variant:"contained",size:"small",children:"Action"})]})},i={render:()=>r.jsx(D,{position:"static",children:r.jsxs(o,{children:[r.jsx(e,{variant:"h6",sx:{flex:1},children:"App Bar + Toolbar"}),r.jsx(C,{color:"inherit",size:"small",children:"Login"})]})})},n={render:()=>r.jsx(W,{component:"header",sx:{border:"1px solid",borderColor:"divider"},children:r.jsx(o,{variant:"dense",children:r.jsx(e,{variant:"body2",children:"Header Toolbar (wrapped by Box)"})})})},p={render:()=>r.jsx(o,{sx:{bgcolor:"background.paper",border:"1px dashed",borderColor:"divider",borderRadius:1},children:r.jsx(e,{variant:"body2",children:"Styled with sx"})})};var c,m,h;a.parameters={...a.parameters,docs:{...(c=a.parameters)==null?void 0:c.docs,source:{originalSource:"{}",...(h=(m=a.parameters)==null?void 0:m.docs)==null?void 0:h.source}}};var x,b,u;t.parameters={...t.parameters,docs:{...(x=t.parameters)==null?void 0:x.docs,source:{originalSource:`{
  render: () => <div style={{
    display: 'grid',
    gap: 12
  }}>
      <Toolbar>
        <Typography variant="body2">Regular Toolbar</Typography>
      </Toolbar>
      <Toolbar variant="dense">
        <Typography variant="body2">Dense Toolbar</Typography>
      </Toolbar>
    </div>
}`,...(u=(b=t.parameters)==null?void 0:b.docs)==null?void 0:u.source}}};var y,g,T;s.parameters={...s.parameters,docs:{...(y=s.parameters)==null?void 0:y.docs,source:{originalSource:`{
  render: () => <Toolbar sx={{
    display: 'flex',
    gap: 8
  }}>
      <Typography sx={{
      flex: 1
    }} variant="h6">Title</Typography>
      <IconButton aria-label="search">
        <Icon name="search" fontSize={20} />
      </IconButton>
      <IconButton aria-label="user">
        <Icon name="person" fontSize={20} />
      </IconButton>
      <Button variant="contained" size="small">Action</Button>
    </Toolbar>
}`,...(T=(g=s.parameters)==null?void 0:g.docs)==null?void 0:T.source}}};var B,v,f;i.parameters={...i.parameters,docs:{...(B=i.parameters)==null?void 0:B.docs,source:{originalSource:`{
  render: () => <Bar position="static">
      <Toolbar>
        <Typography variant="h6" sx={{
        flex: 1
      }}>App Bar + Toolbar</Typography>
        <Button color="inherit" size="small">Login</Button>
      </Toolbar>
    </Bar>
}`,...(f=(v=i.parameters)==null?void 0:v.docs)==null?void 0:f.source}}};var j,I,S;n.parameters={...n.parameters,docs:{...(j=n.parameters)==null?void 0:j.docs,source:{originalSource:`{
  render: () => <Box component="header" sx={{
    border: '1px solid',
    borderColor: 'divider'
  }}>
      <Toolbar variant="dense">
        <Typography variant="body2">Header Toolbar (wrapped by Box)</Typography>
      </Toolbar>
    </Box>
}`,...(S=(I=n.parameters)==null?void 0:I.docs)==null?void 0:S.source}}};var w,z,A;p.parameters={...p.parameters,docs:{...(w=p.parameters)==null?void 0:w.docs,source:{originalSource:`{
  render: () => <Toolbar sx={{
    bgcolor: 'background.paper',
    border: '1px dashed',
    borderColor: 'divider',
    borderRadius: 1
  }}>
      <Typography variant="body2">Styled with sx</Typography>
    </Toolbar>
}`,...(A=(z=p.parameters)==null?void 0:z.docs)==null?void 0:A.source}}};const Br=["Playground","DenseVsRegular","WithActions","InBar","WrappedInHeader","WithCustomSx"];export{t as DenseVsRegular,i as InBar,a as Playground,s as WithActions,p as WithCustomSx,n as WrappedInHeader,Br as __namedExportsOrder,Tr as default};
