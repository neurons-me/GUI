import{j as e}from"./iframe-q72FflWy.js";import{L as s}from"./ListItemButton-kBcRpM-O.js";import{L as m}from"./ListItemIcon-lKzEdP8D.js";import{a as c,L as B}from"./ListItemText-BjbJ233h.js";import{I as n}from"./Icon-Doq3uhPc.js";import{L as S}from"./List-DvvFCGIp.js";import"./preload-helper-Dp1pzeXC.js";import"./useForkRef-BR9zNRBO.js";import"./ButtonBase-D2HnvhjV.js";import"./TransitionGroupContext-4zVEsxkP.js";import"./useEventCallback-BVb6jHPB.js";import"./listItemIconClasses-C8gmQhu6.js";import"./isHostComponent-DVu5iVWx.js";import"./isMuiElement-CKqkPfIO.js";import"./listItemTextClasses-_6ucLlDF.js";import"./useSlot-B3Bhjpe0.js";import"./resolveComponentProps-zf7BDQ8X.js";const J={title:"Molecules/List/ListItemButton",component:s,tags:["autodocs"],decorators:[t=>e.jsx("div",{style:{padding:16,minHeight:260,maxWidth:560},children:e.jsx(t,{})})],parameters:{docs:{description:{component:`
The **ListItemButton** atom is a thin wrapper around MUI's \`MuiListItemButton\`, staying faithful to its API and polymorphism.

In **declarative** mode, the resolver adds sugar:
- \`startIcon\` / \`endIcon\`: token (e.g., \`"lucide:mail"\`, \`"mui:settings"\`) or ReactNode — rendered via the icon registry
- \`label\` / \`secondary\` → mapped to \`<ListItemText primary/secondary />\`
- Granular styling:
  - \`sx\` (root), \`iconSx\` (leading \`ListItemIcon\`), \`textSx\` (text), \`endIconSx\` (trailing icon container)

---
## React usage
~~~jsx
<List>
  <ListItem disablePadding>
    <ListItemButton selected>
      <ListItemIcon>
        <Icon name="lucide:mail" />
      </ListItemIcon>
      <ListItemText primary="Inbox" secondary="Messages" />
    </ListItemButton>
  </ListItem>
</List>
~~~

## Declarative JSON / Resolver
~~~json
{
  "type": "ListItemButton",
  "props": {
    "startIcon": "lucide:mail",
    "label": "Inbox",
    "secondary": "Messages",
    "sx": { "py": 1 },
    "iconSx": { "minWidth": 36 },
    "textSx": { "my": 0 }
  }
}
~~~
        `}},controls:{exclude:["component","children"]}},argTypes:{selected:{control:"boolean"},disabled:{control:"boolean"},dense:{control:"boolean"},divider:{control:"boolean"},alignItems:{control:{type:"radio"},options:["center","flex-start"]},sx:{control:"object"}},args:{selected:!1,disabled:!1,dense:!1,divider:!1,alignItems:"center",sx:{},children:void 0}},d=({children:t})=>e.jsx(S,{dense:!0,sx:{bgcolor:"background.paper",borderRadius:1,overflow:"hidden",border:"1px solid",borderColor:"divider"},children:e.jsx(B,{disablePadding:!0,children:t})}),r={render:t=>e.jsx(d,{children:e.jsxs(s,{...t,children:[e.jsx(m,{children:e.jsx(n,{name:"mail"})}),e.jsx(c,{primary:"Inbox",secondary:"Messages"})]})})},o={render:()=>e.jsx(d,{children:e.jsxs(s,{children:[e.jsx(m,{children:e.jsx(n,{name:"settings"})}),e.jsx(c,{primary:"Settings",secondary:"Preferences"}),e.jsx("span",{style:{marginLeft:"auto",display:"inline-flex"},children:e.jsx(n,{name:"chevron_right"})})]})})},i={render:()=>e.jsx(d,{children:e.jsxs(s,{component:"a",href:"https://neurons.me",children:[e.jsx(m,{children:e.jsx(n,{name:"link"})}),e.jsx(c,{primary:"neurons.me",secondary:"External link"})]})})},a={render:()=>e.jsx(d,{children:e.jsxs(s,{sx:{py:1.25},children:[e.jsx(m,{sx:{minWidth:40},children:e.jsx(n,{name:"person"})}),e.jsx(c,{primary:"Profile",secondary:"Account",slotProps:{secondary:{sx:{color:"text.secondary"}}}})]})})},U=["Playground","WithTrailingIcon","AsAnchorLink","WithSx"];var l,p,x;r.parameters={...r.parameters,docs:{...(l=r.parameters)==null?void 0:l.docs,source:{originalSource:`{
  render: args => <DemoList>
      <ListItemButton {...args}>
        <ListItemIcon>
          <Icon name="mail" />
        </ListItemIcon>
        <ListItemText primary="Inbox" secondary="Messages" />
      </ListItemButton>
    </DemoList>
}`,...(x=(p=r.parameters)==null?void 0:p.docs)==null?void 0:x.source}}};var I,L,u;o.parameters={...o.parameters,docs:{...(I=o.parameters)==null?void 0:I.docs,source:{originalSource:`{
  render: () => <DemoList>
      <ListItemButton>
        <ListItemIcon>
          <Icon name="settings" />
        </ListItemIcon>
        <ListItemText primary="Settings" secondary="Preferences" />
        <span style={{
        marginLeft: 'auto',
        display: 'inline-flex'
      }}>
          <Icon name="chevron_right" />
        </span>
      </ListItemButton>
    </DemoList>
}`,...(u=(L=o.parameters)==null?void 0:L.docs)==null?void 0:u.source}}};var y,h,g;i.parameters={...i.parameters,docs:{...(y=i.parameters)==null?void 0:y.docs,source:{originalSource:`{
  render: () => <DemoList>
      <ListItemButton component="a" href="https://neurons.me">
        <ListItemIcon>
          <Icon name="link" />
        </ListItemIcon>
        <ListItemText primary="neurons.me" secondary="External link" />
      </ListItemButton>
    </DemoList>
}`,...(g=(h=i.parameters)==null?void 0:h.docs)==null?void 0:g.source}}};var j,f,b;a.parameters={...a.parameters,docs:{...(j=a.parameters)==null?void 0:j.docs,source:{originalSource:`{
  render: () => <DemoList>
      <ListItemButton sx={{
      py: 1.25
    }}>
        <ListItemIcon sx={{
        minWidth: 40
      }}>
          <Icon name="person" />
        </ListItemIcon>
        <ListItemText primary="Profile" secondary="Account" slotProps={{
        secondary: {
          sx: {
            color: 'text.secondary'
          }
        }
      }} />
      </ListItemButton>
    </DemoList>
}`,...(b=(f=a.parameters)==null?void 0:f.docs)==null?void 0:b.source}}};export{i as AsAnchorLink,r as Playground,a as WithSx,o as WithTrailingIcon,U as __namedExportsOrder,J as default};
