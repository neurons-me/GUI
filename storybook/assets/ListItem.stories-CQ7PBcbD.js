import{j as e}from"./iframe-q72FflWy.js";import{L as t}from"./ListItem-XTYGYKJx.js";import{L as s}from"./ListItemIcon-lKzEdP8D.js";import{a as n}from"./ListItemText-BjbJ233h.js";import{I as i}from"./Icon-Doq3uhPc.js";import{L as j}from"./List-DvvFCGIp.js";import"./preload-helper-Dp1pzeXC.js";import"./listItemIconClasses-C8gmQhu6.js";import"./isHostComponent-DVu5iVWx.js";import"./isMuiElement-CKqkPfIO.js";import"./useForkRef-BR9zNRBO.js";import"./listItemTextClasses-_6ucLlDF.js";import"./useSlot-B3Bhjpe0.js";import"./resolveComponentProps-zf7BDQ8X.js";const E={title:"Molecules/List/ListItem",component:t,tags:["autodocs"],decorators:[r=>e.jsx("div",{style:{padding:16,minHeight:260,maxWidth:560},children:e.jsx(r,{})})],parameters:{docs:{description:{component:`
The **ListItem** atom is a thin wrapper around MUI's \`MuiListItem\`, staying faithful to its API and polymorphism.
In **declarative** mode (resolver), it simply forwards MUI props and allows granular styling via \`sx\`.

---

## React usage
~~~jsx
<List dense>
  <ListItem divider>
    <ListItemIcon>
      <Icon name="lucide:inbox" />
    </ListItemIcon>
    <ListItemText primary="Inbox" secondary="Messages" />
  </ListItem>
</List>
~~~

## Declarative JSON / Resolver
~~~json
{
  "type": "ListItem",
  "props": {
    "dense": true,
    "divider": true,
    "selected": true,
    "sx": { "py": 1 }
  }
}
~~~
        `}},controls:{exclude:["component","children"]}},argTypes:{dense:{control:"boolean"},divider:{control:"boolean"},disableGutters:{control:"boolean"},alignItems:{control:{type:"radio"},options:["center","flex-start"]},sx:{control:"object"}},args:{dense:!1,divider:!1,disableGutters:!1,alignItems:"center",sx:{},children:void 0}},d=({children:r})=>e.jsx(j,{dense:!0,sx:{bgcolor:"background.paper",borderRadius:1,overflow:"hidden",border:"1px solid",borderColor:"divider"},children:r}),o={render:r=>e.jsx(d,{children:e.jsxs(t,{...r,children:[e.jsx(s,{sx:{minWidth:36},children:e.jsx(i,{name:"lucide:inbox"})}),e.jsx(n,{primary:"Inbox",secondary:"Messages"})]})})},a={render:()=>e.jsxs(d,{children:[e.jsxs(t,{children:[e.jsx(s,{sx:{minWidth:36},children:e.jsx(i,{name:"lucide:mail"})}),e.jsx(n,{primary:"Default",secondary:"No props"})]}),e.jsxs(t,{dense:!0,children:[e.jsx(s,{sx:{minWidth:36},children:e.jsx(i,{name:"lucide:mail"})}),e.jsx(n,{primary:"Dense"})]}),e.jsxs(t,{divider:!0,children:[e.jsx(s,{sx:{minWidth:36},children:e.jsx(i,{name:"lucide:mail"})}),e.jsx(n,{primary:"With divider"})]}),e.jsxs(t,{children:[e.jsx(s,{sx:{minWidth:36},children:e.jsx(i,{name:"lucide:mail"})}),e.jsx(n,{primary:"Default (no selected on ListItem)"})]}),e.jsxs(t,{alignItems:"flex-start",children:[e.jsx(s,{sx:{minWidth:36},children:e.jsx(i,{name:"lucide:mail"})}),e.jsx(n,{primary:"Align start",secondary:"Secondary text that wraps onto multiple lines for demo."})]})]})},m={render:()=>e.jsx(d,{children:e.jsxs(t,{sx:{py:1.25,"&:hover":{bgcolor:"action.hover"}},children:[e.jsx(s,{sx:{minWidth:40},children:e.jsx(i,{name:"lucide:user"})}),e.jsx(n,{primary:"Profile",secondary:"Account",secondaryTypographyProps:{color:"text.secondary"}})]})})},G=["Playground","Variants","WithSx"];var c,l,x;o.parameters={...o.parameters,docs:{...(c=o.parameters)==null?void 0:c.docs,source:{originalSource:`{
  render: args => <DemoList>
      <ListItem {...args}>
        <ListItemIcon sx={{
        minWidth: 36
      }}>
          <Icon name="lucide:inbox" />
        </ListItemIcon>
        <ListItemText primary="Inbox" secondary="Messages" />
      </ListItem>
    </DemoList>
}`,...(x=(l=o.parameters)==null?void 0:l.docs)==null?void 0:x.source}}};var I,p,L;a.parameters={...a.parameters,docs:{...(I=a.parameters)==null?void 0:I.docs,source:{originalSource:`{
  render: () => <DemoList>
      <ListItem>
        <ListItemIcon sx={{
        minWidth: 36
      }}>
          <Icon name="lucide:mail" />
        </ListItemIcon>
        <ListItemText primary="Default" secondary="No props" />
      </ListItem>
      <ListItem dense>
        <ListItemIcon sx={{
        minWidth: 36
      }}>
          <Icon name="lucide:mail" />
        </ListItemIcon>
        <ListItemText primary="Dense" />
      </ListItem>
      <ListItem divider>
        <ListItemIcon sx={{
        minWidth: 36
      }}>
          <Icon name="lucide:mail" />
        </ListItemIcon>
        <ListItemText primary="With divider" />
      </ListItem>
      <ListItem>
        <ListItemIcon sx={{
        minWidth: 36
      }}>
          <Icon name="lucide:mail" />
        </ListItemIcon>
        <ListItemText primary="Default (no selected on ListItem)" />
      </ListItem>
      <ListItem alignItems="flex-start">
        <ListItemIcon sx={{
        minWidth: 36
      }}>
          <Icon name="lucide:mail" />
        </ListItemIcon>
        <ListItemText primary="Align start" secondary="Secondary text that wraps onto multiple lines for demo." />
      </ListItem>
    </DemoList>
}`,...(L=(p=a.parameters)==null?void 0:p.docs)==null?void 0:L.source}}};var u,h,y;m.parameters={...m.parameters,docs:{...(u=m.parameters)==null?void 0:u.docs,source:{originalSource:`{
  render: () => <DemoList>
      <ListItem sx={{
      py: 1.25,
      '&:hover': {
        bgcolor: 'action.hover'
      }
    }}>
        <ListItemIcon sx={{
        minWidth: 40
      }}>
          <Icon name="lucide:user" />
        </ListItemIcon>
        <ListItemText primary="Profile" secondary="Account" secondaryTypographyProps={{
        color: 'text.secondary'
      }} />
      </ListItem>
    </DemoList>
}`,...(y=(h=m.parameters)==null?void 0:h.docs)==null?void 0:y.source}}};export{o as Playground,a as Variants,m as WithSx,G as __namedExportsOrder,E as default};
