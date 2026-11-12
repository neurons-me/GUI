import{j as r}from"./iframe-D0caXraM.js";import{L as t}from"./ListItemText-BwbMCl6y.js";import{L as p}from"./List-Be7TWYSF.js";import{L as s}from"./ListItem-CgwpFahM.js";import"./preload-helper-Dp1pzeXC.js";import"./listItemTextClasses-Dj5q713R.js";import"./useSlot-Cy0-9XXJ.js";import"./useForkRef-XNQZmqk0.js";import"./isHostComponent-DVu5iVWx.js";import"./isMuiElement-Bc5q4xEL.js";const C={title:"Molecules/List/ListItemText",component:t,tags:["autodocs"],decorators:[e=>r.jsx("div",{style:{padding:16,minHeight:260,maxWidth:520},children:r.jsx(e,{})})],parameters:{docs:{description:{component:`
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
        `}},controls:{exclude:["component","primaryTypographyProps","secondaryTypographyProps"]}},argTypes:{primary:{control:"text"},secondary:{control:"text"},inset:{control:"boolean"},disableTypography:{control:"boolean"},sx:{control:"object"}},args:{primary:"Primary",secondary:"Secondary",inset:!1,disableTypography:!1,sx:{}}},j=({children:e})=>r.jsx(p,{dense:!0,children:r.jsx(s,{children:e})}),o={render:e=>r.jsx(j,{children:r.jsx(t,{...e})})},a={args:{secondary:""},render:e=>r.jsx(j,{children:r.jsx(t,{...e})})},i={render:()=>r.jsxs(p,{children:[r.jsx(s,{children:r.jsx(t,{primary:"Custom primary",primaryTypographyProps:{variant:"subtitle1",sx:{fontWeight:600}}})}),r.jsx(s,{children:r.jsx(t,{primary:"Primary",secondary:"Secondary",secondaryTypographyProps:{color:"text.secondary",sx:{fontStyle:"italic"}}})})]})},n={render:()=>r.jsxs(p,{children:[r.jsx(s,{children:r.jsx(t,{primary:"Inset item",inset:!0})}),r.jsx(s,{children:r.jsx(t,{primary:r.jsx("strong",{children:"Disable Typography wrapper"}),disableTypography:!0})})]})};var m,y,c;o.parameters={...o.parameters,docs:{...(m=o.parameters)==null?void 0:m.docs,source:{originalSource:`{
  render: args => <DemoList>
      <ListItemText {...args} />
    </DemoList>
}`,...(c=(y=o.parameters)==null?void 0:y.docs)==null?void 0:c.source}}};var d,l,x;a.parameters={...a.parameters,docs:{...(d=a.parameters)==null?void 0:d.docs,source:{originalSource:`{
  args: {
    secondary: ''
  },
  render: args => <DemoList>
      <ListItemText {...args} />
    </DemoList>
}`,...(x=(l=a.parameters)==null?void 0:l.docs)==null?void 0:x.source}}};var g,L,h;i.parameters={...i.parameters,docs:{...(g=i.parameters)==null?void 0:g.docs,source:{originalSource:`{
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
}`,...(h=(L=i.parameters)==null?void 0:L.docs)==null?void 0:h.source}}};var I,T,u;n.parameters={...n.parameters,docs:{...(I=n.parameters)==null?void 0:I.docs,source:{originalSource:`{
  render: () => <List>
      <ListItem>
        <ListItemText primary="Inset item" inset />
      </ListItem>
      <ListItem>
        <ListItemText primary={<strong>Disable Typography wrapper</strong>} disableTypography />
      </ListItem>
    </List>
}`,...(u=(T=n.parameters)==null?void 0:T.docs)==null?void 0:u.source}}};const R=["Playground","PrimaryOnly","WithTypographyProps","InsetAndDisabledTypography"];export{n as InsetAndDisabledTypography,o as Playground,a as PrimaryOnly,i as WithTypographyProps,R as __namedExportsOrder,C as default};
