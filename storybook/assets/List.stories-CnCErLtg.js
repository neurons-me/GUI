import{j as e}from"./iframe-D0caXraM.js";import{L as s,a as R}from"./List-BO7PmArh.js";import{L as i}from"./ListItem-DoU_CFhl.js";import{L as c}from"./ListItemIcon-BDBP-lji.js";import{L as p}from"./ListItemText-BwbMCl6y.js";import{I as m}from"./Icon-QhGitz5d.js";import"./preload-helper-Dp1pzeXC.js";import"./List-Be7TWYSF.js";import"./ListItem-CgwpFahM.js";import"./isHostComponent-DVu5iVWx.js";import"./isMuiElement-Bc5q4xEL.js";import"./useForkRef-XNQZmqk0.js";import"./listItemIconClasses-DgbM6iS2.js";import"./listItemTextClasses-Dj5q713R.js";import"./useSlot-Cy0-9XXJ.js";const F={title:"Molecules/List/List",component:s,tags:["autodocs"],decorators:[r=>e.jsx("div",{style:{padding:16,minHeight:260,maxWidth:560},children:e.jsx(r,{})})],parameters:{docs:{description:{component:`
The **List** atom is a thin wrapper around MUI's \`MuiList\`, staying faithful to its API and polymorphism.

In **declarative** mode (resolver), it forwards MUI props and supports granular styling via \`sx\`.
It also provides sugar: \`subheaderText\` (and \`subheaderSx\`) to easily render a \`<ListSubheader/>\` when you don't pass \`subheader\` explicitly.

---
## React usage
~~~jsx
<List dense subheader={<li />}> // arbitrary subheader (from MUI API)
  <ListItem>
    <ListItemIcon>
      <Icon name="lucide:inbox" />
    </ListItemIcon>
    <ListItemText primary="Inbox" />
  </ListItem>
</List>
~~~

## Declarative JSON / Resolver
~~~json
{
  "type": "List",
  "props": {
    "dense": true,
    "disablePadding": false,
    "subheaderText": "Shortcuts",
    "subheaderSx": { "fontWeight": 600 },
    "sx": { "bgcolor": "background.paper", "borderRadius": 8 }
  }
}
~~~
*Note:* \`subheaderText\`/\`subheaderSx\` are **resolver-only** sugar; they are not MUI props.
        `}},controls:{exclude:["component","children","subheader"]}},argTypes:{dense:{control:"boolean"},disablePadding:{control:"boolean"},sx:{control:"object",table:{category:"Style"}}},args:{dense:!1,disablePadding:!1,sx:{bgcolor:"background.paper",borderRadius:1,border:"1px solid",borderColor:"divider"}}},d=()=>e.jsxs(e.Fragment,{children:[e.jsxs(i,{children:[e.jsx(c,{children:e.jsx(m,{name:"lucide:inbox"})}),e.jsx(p,{primary:"Inbox"})]}),e.jsxs(i,{children:[e.jsx(c,{children:e.jsx(m,{name:"lucide:send"})}),e.jsx(p,{primary:"Sent"})]}),e.jsxs(i,{children:[e.jsx(c,{children:e.jsx(m,{name:"lucide:star"})}),e.jsx(p,{primary:"Starred"})]})]}),a={render:r=>e.jsx(s,{...r,children:e.jsx(d,{})})},o={name:"With subheader (MUI prop)",render:()=>e.jsx(s,{subheader:e.jsx(R,{component:"div",sx:{fontWeight:600},children:"Shortcuts"}),children:e.jsx(d,{})})},t={args:{dense:!0,disablePadding:!0},render:r=>e.jsx(s,{...r,children:e.jsx(d,{})})},n={args:{sx:{bgcolor:"background.paper",borderRadius:2,boxShadow:1}},render:r=>e.jsx(s,{...r,children:e.jsx(d,{})})};var l,u,x;a.parameters={...a.parameters,docs:{...(l=a.parameters)==null?void 0:l.docs,source:{originalSource:`{
  render: args => <List {...args}>
      <SampleRows />
    </List>
}`,...(x=(u=a.parameters)==null?void 0:u.docs)==null?void 0:x.source}}};var h,b,g;o.parameters={...o.parameters,docs:{...(h=o.parameters)==null?void 0:h.docs,source:{originalSource:`{
  name: 'With subheader (MUI prop)',
  render: () => <List subheader={<ListSubheader component="div" sx={{
    fontWeight: 600
  }}>Shortcuts</ListSubheader>}>
      <SampleRows />
    </List>
}`,...(g=(b=o.parameters)==null?void 0:b.docs)==null?void 0:g.source}}};var L,S,j;t.parameters={...t.parameters,docs:{...(L=t.parameters)==null?void 0:L.docs,source:{originalSource:`{
  args: {
    dense: true,
    disablePadding: true
  },
  render: args => <List {...args}>
      <SampleRows />
    </List>
}`,...(j=(S=t.parameters)==null?void 0:S.docs)==null?void 0:j.source}}};var I,y,f;n.parameters={...n.parameters,docs:{...(I=n.parameters)==null?void 0:I.docs,source:{originalSource:`{
  args: {
    sx: {
      bgcolor: 'background.paper',
      borderRadius: 2,
      boxShadow: 1
    }
  },
  render: args => <List {...args}>
      <SampleRows />
    </List>
}`,...(f=(y=n.parameters)==null?void 0:y.docs)==null?void 0:f.source}}};const H=["Playground","WithSubheader","DenseAndNoPadding","StyledWithSx"];export{t as DenseAndNoPadding,a as Playground,n as StyledWithSx,o as WithSubheader,H as __namedExportsOrder,F as default};
