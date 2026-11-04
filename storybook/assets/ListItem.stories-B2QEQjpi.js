import{j as e}from"./iframe-CWBlVoSh.js";import{L as t}from"./ListItem-e3AqpSIn.js";import{L as s}from"./ListItemIcon-BlTIWdXj.js";import{L as i}from"./ListItemText-a3Msk-gG.js";import{I as r}from"./Icon-CB0Uj0Aw.js";import{L as j}from"./List-Dd5EG-DP.js";import"./preload-helper-Dp1pzeXC.js";import"./ListItem-CvEEl90f.js";import"./isHostComponent-DVu5iVWx.js";import"./isMuiElement-DyVPQdzo.js";import"./useForkRef-q9ZWwCIp.js";import"./listItemIconClasses-DKVttrA8.js";import"./listItemTextClasses-DK6UpYXz.js";import"./useSlot-JA-NOEOp.js";import"./resolveComponentProps-DrUC3lMZ.js";const G={title:"Molecules/List/ListItem",component:t,tags:["autodocs"],decorators:[n=>e.jsx("div",{style:{padding:16,minHeight:260,maxWidth:560},children:e.jsx(n,{})})],parameters:{docs:{description:{component:`
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
        `}},controls:{exclude:["component","children"]}},argTypes:{dense:{control:"boolean"},divider:{control:"boolean"},disableGutters:{control:"boolean"},alignItems:{control:{type:"radio"},options:["center","flex-start"]},sx:{control:"object"}},args:{dense:!1,divider:!1,disableGutters:!1,alignItems:"center",sx:{},children:void 0}},d=({children:n})=>e.jsx(j,{dense:!0,sx:{bgcolor:"background.paper",borderRadius:1,overflow:"hidden",border:"1px solid",borderColor:"divider"},children:n}),o={render:n=>e.jsx(d,{children:e.jsxs(t,{...n,children:[e.jsx(s,{sx:{minWidth:36},children:e.jsx(r,{name:"lucide:inbox"})}),e.jsx(i,{primary:"Inbox",secondary:"Messages"})]})})},m={render:()=>e.jsxs(d,{children:[e.jsxs(t,{children:[e.jsx(s,{sx:{minWidth:36},children:e.jsx(r,{name:"lucide:mail"})}),e.jsx(i,{primary:"Default",secondary:"No props"})]}),e.jsxs(t,{dense:!0,children:[e.jsx(s,{sx:{minWidth:36},children:e.jsx(r,{name:"lucide:mail"})}),e.jsx(i,{primary:"Dense"})]}),e.jsxs(t,{divider:!0,children:[e.jsx(s,{sx:{minWidth:36},children:e.jsx(r,{name:"lucide:mail"})}),e.jsx(i,{primary:"With divider"})]}),e.jsxs(t,{children:[e.jsx(s,{sx:{minWidth:36},children:e.jsx(r,{name:"lucide:mail"})}),e.jsx(i,{primary:"Default (no selected on ListItem)"})]}),e.jsxs(t,{alignItems:"flex-start",children:[e.jsx(s,{sx:{minWidth:36},children:e.jsx(r,{name:"lucide:mail"})}),e.jsx(i,{primary:"Align start",secondary:"Secondary text that wraps onto multiple lines for demo."})]})]})},a={render:()=>e.jsx(d,{children:e.jsxs(t,{sx:{py:1.25,"&:hover":{bgcolor:"action.hover"}},children:[e.jsx(s,{sx:{minWidth:40},children:e.jsx(r,{name:"lucide:user"})}),e.jsx(i,{primary:"Profile",secondary:"Account",secondaryTypographyProps:{color:"text.secondary"}})]})})};var c,l,x;o.parameters={...o.parameters,docs:{...(c=o.parameters)==null?void 0:c.docs,source:{originalSource:`{
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
}`,...(x=(l=o.parameters)==null?void 0:l.docs)==null?void 0:x.source}}};var I,p,L;m.parameters={...m.parameters,docs:{...(I=m.parameters)==null?void 0:I.docs,source:{originalSource:`{
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
}`,...(L=(p=m.parameters)==null?void 0:p.docs)==null?void 0:L.source}}};var u,h,y;a.parameters={...a.parameters,docs:{...(u=a.parameters)==null?void 0:u.docs,source:{originalSource:`{
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
}`,...(y=(h=a.parameters)==null?void 0:h.docs)==null?void 0:y.source}}};const O=["Playground","Variants","WithSx"];export{o as Playground,m as Variants,a as WithSx,O as __namedExportsOrder,G as default};
