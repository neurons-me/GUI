import{m as G,n as E,r as F,a9 as H,j as e,o as O,af as T,aa as _,ab as $,ad as J}from"./iframe-q72FflWy.js";import{L as o}from"./List-BSzaOevu.js";import{L as b}from"./ListItem-XTYGYKJx.js";import{L as h}from"./ListItemIcon-lKzEdP8D.js";import{a as g}from"./ListItemText-BjbJ233h.js";import{I as x}from"./Icon-Doq3uhPc.js";import"./preload-helper-Dp1pzeXC.js";import"./List-DvvFCGIp.js";import"./listItemIconClasses-C8gmQhu6.js";import"./isHostComponent-DVu5iVWx.js";import"./isMuiElement-CKqkPfIO.js";import"./useForkRef-BR9zNRBO.js";import"./listItemTextClasses-_6ucLlDF.js";import"./useSlot-B3Bhjpe0.js";import"./resolveComponentProps-zf7BDQ8X.js";function q(s){return G("MuiListSubheader",s)}E("MuiListSubheader",["root","colorPrimary","colorInherit","gutters","inset","sticky"]);const B=s=>{const{classes:r,color:t,disableGutters:a,inset:u,disableSticky:m}=s,i={root:["root",t!=="default"&&`color${T(t)}`,!a&&"gutters",u&&"inset",!m&&"sticky"]};return _(i,q,r)},K=$("li",{name:"MuiListSubheader",slot:"Root",overridesResolver:(s,r)=>{const{ownerState:t}=s;return[r.root,t.color!=="default"&&r[`color${T(t.color)}`],!t.disableGutters&&r.gutters,t.inset&&r.inset,!t.disableSticky&&r.sticky]}})(J(({theme:s})=>({boxSizing:"border-box",lineHeight:"48px",listStyle:"none",color:(s.vars||s).palette.text.secondary,fontFamily:s.typography.fontFamily,fontWeight:s.typography.fontWeightMedium,fontSize:s.typography.pxToRem(14),variants:[{props:{color:"primary"},style:{color:(s.vars||s).palette.primary.main}},{props:{color:"inherit"},style:{color:"inherit"}},{props:({ownerState:r})=>!r.disableGutters,style:{paddingLeft:16,paddingRight:16}},{props:({ownerState:r})=>r.inset,style:{paddingLeft:72}},{props:({ownerState:r})=>!r.disableSticky,style:{position:"sticky",top:0,zIndex:1,backgroundColor:(s.vars||s).palette.background.paper}}]}))),y=F.forwardRef(function(r,t){const a=H({props:r,name:"MuiListSubheader"}),{className:u,color:m="default",component:i="li",disableGutters:C=!1,disableSticky:N=!1,inset:z=!1,...A}=a,S={...a,color:m,component:i,disableGutters:C,disableSticky:N,inset:z},D=B(S);return e.jsx(K,{as:i,className:O(D.root,u),ref:t,ownerState:S,...A})});y&&(y.muiSkipListHighlight=!0);const ce={title:"Molecules/List/List",component:o,tags:["autodocs"],decorators:[s=>e.jsx("div",{style:{padding:16,minHeight:260,maxWidth:560},children:e.jsx(s,{})})],parameters:{docs:{description:{component:`
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
        `}},controls:{exclude:["component","children","subheader"]}},argTypes:{dense:{control:"boolean"},disablePadding:{control:"boolean"},sx:{control:"object",table:{category:"Style"}}},args:{dense:!1,disablePadding:!1,sx:{bgcolor:"background.paper",borderRadius:1,border:"1px solid",borderColor:"divider"}}},p=()=>e.jsxs(e.Fragment,{children:[e.jsxs(b,{children:[e.jsx(h,{children:e.jsx(x,{name:"lucide:inbox"})}),e.jsx(g,{primary:"Inbox"})]}),e.jsxs(b,{children:[e.jsx(h,{children:e.jsx(x,{name:"lucide:send"})}),e.jsx(g,{primary:"Sent"})]}),e.jsxs(b,{children:[e.jsx(h,{children:e.jsx(x,{name:"lucide:star"})}),e.jsx(g,{primary:"Starred"})]})]}),n={render:s=>e.jsx(o,{...s,children:e.jsx(p,{})})},d={name:"With subheader (MUI prop)",render:()=>e.jsx(o,{subheader:e.jsx(y,{component:"div",sx:{fontWeight:600},children:"Shortcuts"}),children:e.jsx(p,{})})},l={args:{dense:!0,disablePadding:!0},render:s=>e.jsx(o,{...s,children:e.jsx(p,{})})},c={args:{sx:{bgcolor:"background.paper",borderRadius:2,boxShadow:1}},render:s=>e.jsx(o,{...s,children:e.jsx(p,{})})},pe=["Playground","WithSubheader","DenseAndNoPadding","StyledWithSx"];var L,f,j;n.parameters={...n.parameters,docs:{...(L=n.parameters)==null?void 0:L.docs,source:{originalSource:`{
  render: args => <List {...args}>
      <SampleRows />
    </List>
}`,...(j=(f=n.parameters)==null?void 0:f.docs)==null?void 0:j.source}}};var I,R,v;d.parameters={...d.parameters,docs:{...(I=d.parameters)==null?void 0:I.docs,source:{originalSource:`{
  name: 'With subheader (MUI prop)',
  render: () => <List subheader={<ListSubheader component="div" sx={{
    fontWeight: 600
  }}>Shortcuts</ListSubheader>}>
      <SampleRows />
    </List>
}`,...(v=(R=d.parameters)==null?void 0:R.docs)==null?void 0:v.source}}};var k,w,M;l.parameters={...l.parameters,docs:{...(k=l.parameters)==null?void 0:k.docs,source:{originalSource:`{
  args: {
    dense: true,
    disablePadding: true
  },
  render: args => <List {...args}>
      <SampleRows />
    </List>
}`,...(M=(w=l.parameters)==null?void 0:w.docs)==null?void 0:M.source}}};var P,W,U;c.parameters={...c.parameters,docs:{...(P=c.parameters)==null?void 0:P.docs,source:{originalSource:`{
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
}`,...(U=(W=c.parameters)==null?void 0:W.docs)==null?void 0:U.source}}};export{l as DenseAndNoPadding,n as Playground,c as StyledWithSx,d as WithSubheader,pe as __namedExportsOrder,ce as default};
