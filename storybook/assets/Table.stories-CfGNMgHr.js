import{j as e,B,T as p}from"./iframe-D0caXraM.js";import{a as D,e as W,c as m,d as a,b as k}from"./Gauge-LzSFGwAb.js";import"./Switch-C-3H6IVI.js";import"./Button-CXS3QqkH.js";import"./Paper-xXEET6BR.js";import"./Tooltip-DuFS0zf6.js";import"./ListItemIcon-BDBP-lji.js";import"./ListItemText-BwbMCl6y.js";import"./Drawer-niTC23G5.js";import"./preload-helper-Dp1pzeXC.js";import"./Icon-QhGitz5d.js";import"./IconButton-3QKTNDRF.js";import"./IconButton-C-DjN5NB.js";import"./ButtonBase-Dn4a5hRT.js";import"./TransitionGroupContext-yoRJhQyt.js";import"./useForkRef-XNQZmqk0.js";import"./CircularProgress-9BrVdoMo.js";import"./Avatar-DpCE2P7T.js";import"./Avatar-DA2IiRv7.js";import"./createSvgIcon-TkOxIDkm.js";import"./useSlot-Cy0-9XXJ.js";import"./TextField-CBETVBGe.js";import"./useFormControl-CvrkDGak.js";import"./isHostComponent-DVu5iVWx.js";import"./Menu-Cb6wxuKw.js";import"./Grow-DLLXf6dE.js";import"./Paper-Bk81HPwT.js";import"./List-Be7TWYSF.js";import"./isMuiElement-Bc5q4xEL.js";import"./Progress-CCXLkOfw.js";import"./Toolbar-PZ12EgUX.js";import"./Button-5KcQE1lk.js";import"./Tooltip-iopH_C2q.js";import"./listItemIconClasses-DgbM6iS2.js";import"./listItemTextClasses-Dj5q713R.js";import"./dividerClasses-C69-NOzd.js";const be={title:"Molecules/Table",component:D,tags:["autodocs"],decorators:[r=>e.jsx("div",{style:{padding:16,minHeight:260,maxWidth:920},children:e.jsx(r,{})})],parameters:{docs:{description:{component:`
The **Table** atom is a thin wrapper around MUI's \`Table\`.  
It preserves MUI props and typing (faithful to the original), and fits naturally into This.GUI's declarative/resolver pattern.

---
## Features
- Fully preserves MUI Table API and typing.
- Supports \`sx\` styling via the system.
- Works with other Table atoms: \`TableHead\`, \`TableBody\`, \`TableRow\`, \`TableCell\`.
- Can be described declaratively via the **TableResolver**.

---
## Basic usage (React)
~~~tsx
import { Table, TableHead, TableBody, TableRow, TableCell } from '@/gui/components/atoms';

<Table size="small">
  <TableHead>
    <TableRow>
      <TableCell>ID</TableCell>
      <TableCell>Name</TableCell>
    </TableRow>
  </TableHead>
  <TableBody>
    <TableRow>
      <TableCell>1</TableCell>
      <TableCell>Alice</TableCell>
    </TableRow>
  </TableBody>
</Table>
~~~

---
## Declarative JSON / Resolver
~~~json
{
  "type": "Table",
  "props": {
    "size": "small",
    "sx": { "minWidth": 420 },
    "children": [
      { "type": "TableHead", "props": { "children": { "type": "TableRow", "props": { "children": [
        { "type": "TableCell", "props": { "children": "ID" } },
        { "type": "TableCell", "props": { "children": "Name" } }
      ]}}}},
      { "type": "TableBody", "props": { "children": { "type": "TableRow", "props": { "children": [
        { "type": "TableCell", "props": { "children": 1 } },
        { "type": "TableCell", "props": { "children": "Alice" } }
      ]}}}}
    ]
  }
}
~~~
        `}}},argTypes:{size:{control:{type:"radio"},options:["small","medium"]},padding:{control:{type:"select"},options:["default","checkbox","none"]},stickyHeader:{control:{type:"boolean"}},sx:{control:"object"}},args:{size:"small",padding:"default",stickyHeader:!1,sx:{}}},o=r=>e.jsx(B,{sx:{border:"1px solid",borderColor:"divider",borderRadius:2,overflow:"hidden",bgcolor:"background.paper"},children:e.jsx(D,{...r,children:r.children??e.jsxs(e.Fragment,{children:[e.jsx(W,{children:e.jsxs(m,{sx:{background:"background.nav"},children:[e.jsx(a,{children:e.jsx(p,{fontWeight:700,children:"ID"})}),e.jsx(a,{children:e.jsx(p,{fontWeight:700,children:"Name"})}),e.jsx(a,{align:"right",children:e.jsx(p,{fontWeight:700,children:"Score"})})]})}),e.jsx(k,{children:[{id:1,name:"Alice",score:98},{id:2,name:"Bob",score:84},{id:3,name:"Charlie",score:91}].map(s=>e.jsxs(m,{hover:!0,children:[e.jsx(a,{children:s.id}),e.jsx(a,{children:s.name}),e.jsx(a,{align:"right",children:s.score})]},s.id))})]})})}),i={render:r=>e.jsx(o,{...r})},l={args:{size:"medium"},render:r=>e.jsx(o,{...r})},t={args:{stickyHeader:!0,sx:{minWidth:520}},render:r=>e.jsx(B,{sx:{maxHeight:180,overflow:"auto",border:"1px solid",borderColor:"divider",borderRadius:2},children:e.jsx(o,{...r})})},n={args:{padding:"none",size:"small"},render:r=>e.jsx(o,{...r})},d={args:{sx:{minWidth:640}},render:r=>e.jsx(o,{...r})};var c,b,h;i.parameters={...i.parameters,docs:{...(c=i.parameters)==null?void 0:c.docs,source:{originalSource:`{
  render: args => <DemoTable {...args} />
}`,...(h=(b=i.parameters)==null?void 0:b.docs)==null?void 0:h.source}}};var T,g,x;l.parameters={...l.parameters,docs:{...(T=l.parameters)==null?void 0:T.docs,source:{originalSource:`{
  args: {
    size: 'medium'
  },
  render: args => <DemoTable {...args} />
}`,...(x=(g=l.parameters)==null?void 0:g.docs)==null?void 0:x.source}}};var u,y,j;t.parameters={...t.parameters,docs:{...(u=t.parameters)==null?void 0:u.docs,source:{originalSource:`{
  args: {
    stickyHeader: true,
    sx: {
      minWidth: 520
    }
  },
  render: args => <Box sx={{
    maxHeight: 180,
    overflow: 'auto',
    border: '1px solid',
    borderColor: 'divider',
    borderRadius: 2
  }}>
      <DemoTable {...args} />
    </Box>
}`,...(j=(y=t.parameters)==null?void 0:y.docs)==null?void 0:j.source}}};var C,v,f;n.parameters={...n.parameters,docs:{...(C=n.parameters)==null?void 0:C.docs,source:{originalSource:`{
  args: {
    padding: 'none' as any,
    size: 'small'
  },
  render: args => <DemoTable {...args} />
}`,...(f=(v=n.parameters)==null?void 0:v.docs)==null?void 0:f.source}}};var R,H,S;d.parameters={...d.parameters,docs:{...(R=d.parameters)==null?void 0:R.docs,source:{originalSource:`{
  args: {
    sx: {
      minWidth: 640
    }
  },
  render: args => <DemoTable {...args} />
}`,...(S=(H=d.parameters)==null?void 0:H.docs)==null?void 0:S.source}}};const he=["Playground","MediumSize","StickyHeader","DensePaddingNone","WithSx"];export{n as DensePaddingNone,l as MediumSize,i as Playground,t as StickyHeader,d as WithSx,he as __namedExportsOrder,be as default};
