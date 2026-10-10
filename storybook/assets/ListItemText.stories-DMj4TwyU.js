import{j as r}from"./iframe-q72FflWy.js";import{a as t,L as s}from"./ListItemText-BjbJ233h.js";import{L as p}from"./List-DvvFCGIp.js";import"./preload-helper-Dp1pzeXC.js";import"./isHostComponent-DVu5iVWx.js";import"./isMuiElement-CKqkPfIO.js";import"./useForkRef-BR9zNRBO.js";import"./listItemTextClasses-_6ucLlDF.js";import"./useSlot-B3Bhjpe0.js";import"./resolveComponentProps-zf7BDQ8X.js";const C={title:"Molecules/List/ListItemText",component:t,tags:["autodocs"],decorators:[e=>r.jsx("div",{style:{padding:16,minHeight:260,maxWidth:520},children:r.jsx(e,{})})],parameters:{docs:{description:{component:`
The **ListItemText** atom is a thin wrapper around MUI's \`MuiListItemText\`.  
It preserves MUI props and typing (faithful to the original), and fits naturally into This.GUI's declarative/resolver pattern.

---
## Basic usage
~~~jsx
<List>
  <ListItem>
    <ListItemText primary="Single line" />
  </ListItem>
  <ListItem>
    <ListItemText primary="Primary" secondary="Secondary description" />
  </ListItem>
</List>
~~~

## Typography control
~~~jsx
<List>
  <ListItem>
    <ListItemText
      primary="Custom primary"
      primaryTypographyProps={{ variant: 'subtitle1', sx: { fontWeight: 600 } }}
    />
  </ListItem>
  <ListItem>
    <ListItemText
      primary="Primary"
      secondary="Secondary"
      secondaryTypographyProps={{ color: 'text.secondary', sx: { fontStyle: 'italic' } }}
    />
  </ListItem>
</List>
~~~

## Declarative JSON / Resolver
~~~json
{
  "type": "ListItemText",
  "props": {
    "primary": "Primary",
    "secondary": "Secondary",
    "primarySx": { "fontWeight": 600 },
    "secondarySx": { "color": "text.secondary", "fontStyle": "italic" }
  }
}
~~~

*Note:* In React usage, use \`primaryTypographyProps.sx\` / \`secondaryTypographyProps.sx\`.  
In declarative mode, you can also use \`primarySx\` / \`secondarySx\` and the resolver will merge them into the Typography slot props.
        `}},controls:{exclude:["component","primaryTypographyProps","secondaryTypographyProps"]}},argTypes:{primary:{control:"text"},secondary:{control:"text"},inset:{control:"boolean"},disableTypography:{control:"boolean"},sx:{control:"object"}},args:{primary:"Primary",secondary:"Secondary",inset:!1,disableTypography:!1,sx:{}}},j=({children:e})=>r.jsx(p,{dense:!0,children:r.jsx(s,{children:e})}),a={render:e=>r.jsx(j,{children:r.jsx(t,{...e})})},o={args:{secondary:""},render:e=>r.jsx(j,{children:r.jsx(t,{...e})})},i={render:()=>r.jsxs(p,{children:[r.jsx(s,{children:r.jsx(t,{primary:"Custom primary",primaryTypographyProps:{variant:"subtitle1",sx:{fontWeight:600}}})}),r.jsx(s,{children:r.jsx(t,{primary:"Primary",secondary:"Secondary",secondaryTypographyProps:{color:"text.secondary",sx:{fontStyle:"italic"}}})})]})},n={render:()=>r.jsxs(p,{children:[r.jsx(s,{children:r.jsx(t,{primary:"Inset item",inset:!0})}),r.jsx(s,{children:r.jsx(t,{primary:r.jsx("strong",{children:"Disable Typography wrapper"}),disableTypography:!0})})]})},R=["Playground","PrimaryOnly","WithTypographyProps","InsetAndDisabledTypography"];var m,y,c;a.parameters={...a.parameters,docs:{...(m=a.parameters)==null?void 0:m.docs,source:{originalSource:`{
  render: args => <DemoList>
      <ListItemText {...args} />
    </DemoList>
}`,...(c=(y=a.parameters)==null?void 0:y.docs)==null?void 0:c.source}}};var d,l,x;o.parameters={...o.parameters,docs:{...(d=o.parameters)==null?void 0:d.docs,source:{originalSource:`{
  args: {
    secondary: ''
  },
  render: args => <DemoList>
      <ListItemText {...args} />
    </DemoList>
}`,...(x=(l=o.parameters)==null?void 0:l.docs)==null?void 0:x.source}}};var g,h,L;i.parameters={...i.parameters,docs:{...(g=i.parameters)==null?void 0:g.docs,source:{originalSource:`{
  render: () => <List>
      <ListItem>
        <ListItemText primary="Custom primary" primaryTypographyProps={{
        variant: 'subtitle1',
        sx: {
          fontWeight: 600
        }
      }} />
      </ListItem>
      <ListItem>
        <ListItemText primary="Primary" secondary="Secondary" secondaryTypographyProps={{
        color: 'text.secondary',
        sx: {
          fontStyle: 'italic'
        }
      }} />
      </ListItem>
    </List>
}`,...(L=(h=i.parameters)==null?void 0:h.docs)==null?void 0:L.source}}};var I,T,u;n.parameters={...n.parameters,docs:{...(I=n.parameters)==null?void 0:I.docs,source:{originalSource:`{
  render: () => <List>
      <ListItem>
        <ListItemText primary="Inset item" inset />
      </ListItem>
      <ListItem>
        <ListItemText primary={<strong>Disable Typography wrapper</strong>} disableTypography />
      </ListItem>
    </List>
}`,...(u=(T=n.parameters)==null?void 0:T.docs)==null?void 0:u.source}}};export{n as InsetAndDisabledTypography,a as Playground,o as PrimaryOnly,i as WithTypographyProps,R as __namedExportsOrder,C as default};
