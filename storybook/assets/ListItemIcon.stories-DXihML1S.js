import{j as e,T as v}from"./iframe-q72FflWy.js";import{a,L as S}from"./ListItemText-BjbJ233h.js";import{L as i}from"./ListItemIcon-lKzEdP8D.js";import{I as m}from"./Icon-Doq3uhPc.js";import{L as f}from"./List-DvvFCGIp.js";import"./preload-helper-Dp1pzeXC.js";import"./isHostComponent-DVu5iVWx.js";import"./isMuiElement-CKqkPfIO.js";import"./useForkRef-BR9zNRBO.js";import"./listItemTextClasses-_6ucLlDF.js";import"./useSlot-B3Bhjpe0.js";import"./resolveComponentProps-zf7BDQ8X.js";import"./listItemIconClasses-C8gmQhu6.js";const O={title:"Molecules/List/ListItemIcon",component:i,tags:["autodocs"],decorators:[t=>e.jsx(v,{children:e.jsx("div",{style:{padding:16,minHeight:260,maxWidth:520},children:e.jsx(t,{})})})],parameters:{docs:{description:{component:`
The **ListItemIcon** atom is a thin wrapper around MUI's \`MuiListItemIcon\` and remains faithful to its API.

In **declarative** mode, the resolver adds sugar to render icons by **token** via the registry:
- \`icon\`: string token (e.g., \`"lucide:mail"\`, \`"mui:settings"\`) or React node
- \`iconProps\`: forwarded to the registry \`<Icon />\` when \`icon\` is a token
- \`iconColor\`: convenience color for the registry icon
- \`size\`: icon size (default 20)

Tokens are **normalized** (lowercased & trimmed) to avoid missing icons due to casing.

---
## React usage
~~~jsx
<List>
  <ListItem>
    <ListItemIcon sx={{ minWidth: 36 }}>
      <Icon name="lucide:mail" size={20} />
    </ListItemIcon>
    <ListItemText primary="Inbox" />
  </ListItem>
</List>
~~~

## Declarative JSON / Resolver
~~~json
{
  "type": "ListItemIcon",
  "props": {
    "icon": "lucide:mail",
    "sx": { "minWidth": 36 },
    "iconProps": { "strokeWidth": 1.5 }
  }
}
~~~
        `}},controls:{exclude:["children"]}},argTypes:{sx:{control:"object",table:{category:"Style"}},className:{control:"text"}},args:{sx:{},children:void 0}},c=({children:t})=>e.jsx(f,{dense:!0,children:e.jsx(S,{children:t})}),s={render:t=>e.jsxs(c,{children:[e.jsx(i,{...t,sx:{minWidth:36},children:e.jsx(m,{name:"lucide:mail"})}),e.jsx(a,{primary:"Item with icon slot"})]})},n={name:"Declarative token (doc example)",render:()=>e.jsxs(c,{children:[e.jsx(i,{sx:{minWidth:36},children:e.jsx(m,{name:"lucide:Mail",fontSize:20})}),e.jsx(a,{primary:"Inbox (token)"})]})},r={render:()=>e.jsxs(c,{children:[e.jsx(i,{sx:{minWidth:40},children:e.jsx(m,{name:"mui:Settings"})}),e.jsx(a,{primary:"Settings (React child)"})]})},o={render:()=>e.jsxs(c,{children:[e.jsx(i,{sx:{minWidth:48},children:e.jsx(m,{name:"lucide:User"})}),e.jsx(a,{primary:"Custom minWidth via sx"})]})},V=["Playground","WithTokenViaResolverExample","WithReactChild","WithSx"];var d,l,p;s.parameters={...s.parameters,docs:{...(d=s.parameters)==null?void 0:d.docs,source:{originalSource:`{
  render: args => <DemoList>
      <ListItemIcon {...args} sx={{
      minWidth: 36
    }}>
        <Icon name="lucide:mail" />
      </ListItemIcon>
      <ListItemText primary="Item with icon slot" />
    </DemoList>
}`,...(p=(l=s.parameters)==null?void 0:l.docs)==null?void 0:p.source}}};var x,I,h;n.parameters={...n.parameters,docs:{...(x=n.parameters)==null?void 0:x.docs,source:{originalSource:`{
  name: 'Declarative token (doc example)',
  render: () => <DemoList>
      {/* Emula el resultado del resolver al usar icon="lucide:mail" */}
      <ListItemIcon sx={{
      minWidth: 36
    }}>
        <Icon name="lucide:Mail" fontSize={20} />
      </ListItemIcon>
      <ListItemText primary="Inbox (token)" />
    </DemoList>
}`,...(h=(I=n.parameters)==null?void 0:I.docs)==null?void 0:h.source}}};var u,L,g;r.parameters={...r.parameters,docs:{...(u=r.parameters)==null?void 0:u.docs,source:{originalSource:`{
  render: () => <DemoList>
      <ListItemIcon sx={{
      minWidth: 40
    }}>
        <Icon name="mui:Settings" />
      </ListItemIcon>
      <ListItemText primary="Settings (React child)" />
    </DemoList>
}`,...(g=(L=r.parameters)==null?void 0:L.docs)==null?void 0:g.source}}};var j,y,W;o.parameters={...o.parameters,docs:{...(j=o.parameters)==null?void 0:j.docs,source:{originalSource:`{
  render: () => <DemoList>
      <ListItemIcon sx={{
      minWidth: 48
    }}>
        <Icon name="lucide:User" />
      </ListItemIcon>
      <ListItemText primary="Custom minWidth via sx" />
    </DemoList>
}`,...(W=(y=o.parameters)==null?void 0:y.docs)==null?void 0:W.source}}};export{s as Playground,r as WithReactChild,o as WithSx,n as WithTokenViaResolverExample,V as __namedExportsOrder,O as default};
