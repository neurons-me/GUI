import{j as e,r as b}from"./iframe-Dgz0DvjP.js";import{M as n}from"./MenuItem-Chv31nY7.js";import{M as f}from"./Menu-Dy9bCaac.js";import{I as D}from"./Icon-zhfCvvEA.js";import{B as C}from"./Button-BrwXx0gp.js";import"./preload-helper-Dp1pzeXC.js";import"./MenuItem-DVYWd6rG.js";import"./List-BZwm0z1v.js";import"./useForkRef-DhiyL1xF.js";import"./ButtonBase-DnPFUmZ4.js";import"./TransitionGroupContext-Bovk2g5c.js";import"./useEventCallback-CW9ai8zV.js";import"./listItemIconClasses-U7MvxmKI.js";import"./listItemTextClasses-CANx9uJI.js";import"./dividerClasses-BXzcgXwe.js";import"./Menu-D9ienzuU.js";import"./useSlot-CjwkB68v.js";import"./resolveComponentProps-C7RzSJ6V.js";import"./useSlotProps-D6FndUWw.js";import"./isHostComponent-DVu5iVWx.js";import"./Paper-DKRGBdYt.js";import"./Grow-D7g5qnif.js";import"./mergeSlotProps-DoPK-Muf.js";import"./CircularProgress-CRe5HlWG.js";const X={title:"Molecules/Menu/MenuItem",component:n,tags:["autodocs"],decorators:[t=>e.jsx("div",{style:{padding:16,minHeight:260},children:e.jsx(t,{})})],parameters:{docs:{description:{component:`
The **MenuItem** atom is a thin wrapper around MUI's \`MuiMenuItem\`.

In **declarative** mode (registry), the resolver supports:
- \`label\` / \`secondary\` → maps to \`<ListItemText primary/secondary />\`
- \`startIcon\` → token (e.g., \`"mui:Settings"\`, \`"lucide:mail"\`) or React node → renders inside \`<ListItemIcon />\`
- Granular styling via:
  - \`sx\` (root)
  - \`iconSx\` (ListItemIcon)
  - \`textSx\` (ListItemText)

---
## Declarative JSON / Resolver
~~~json
{
  "type": "MenuItem",
  "props": {
    "startIcon": "mui:Settings",
    "label": "Settings",
    "secondary": "Manage your preferences",
    "sx": { "py": 1 },
    "iconSx": { "minWidth": 36 },
    "textSx": { "my": 0 }
  }
}
~~~
        `}},controls:{exclude:["component"]}},argTypes:{dense:{control:"boolean"},divider:{control:"boolean"},disabled:{control:"boolean"},selected:{control:"boolean"},sx:{control:"object"}},args:{dense:!1,divider:!1,disabled:!1,selected:!1,sx:{},children:"Menu item"}},a=({children:t})=>{const[l,c]=b.useState(null),j=!!l,y=S=>c(S.currentTarget),r=()=>c(null);return e.jsxs(e.Fragment,{children:[e.jsx(C,{variant:"outlined",onClick:y,"data-testid":"open-menu",children:"Open Menu"}),e.jsx(f,{open:j,anchorEl:l,onClose:r,onClick:r,children:t??e.jsxs(e.Fragment,{children:[e.jsx(n,{onClick:r,children:"Profile"}),e.jsxs(n,{onClick:r,selected:!0,dense:!0,children:[e.jsx(D,{name:"settings",weight:400,fill:0,style:{marginRight:8}}),"Settings"]}),e.jsx(n,{onClick:r,disabled:!0,children:"Disabled"})]})})]})},s={render:t=>e.jsx(a,{children:e.jsx(n,{...t})})},o={render:()=>e.jsxs(a,{children:[e.jsx(n,{children:"Default"}),e.jsx(n,{selected:!0,children:"Selected"}),e.jsx(n,{disabled:!0,children:"Disabled"}),e.jsx(n,{dense:!0,children:"Dense"})]})},i={render:()=>e.jsxs(a,{children:[e.jsx(n,{children:e.jsx("strong",{children:"Custom node as children"})}),e.jsx(n,{children:e.jsx("span",{style:{opacity:.75},children:"With inline styling"})})]})};var d,m,u;s.parameters={...s.parameters,docs:{...(d=s.parameters)==null?void 0:d.docs,source:{originalSource:`{
  render: args => <DemoMenu>
      <MenuItem {...args} />
    </DemoMenu>
}`,...(u=(m=s.parameters)==null?void 0:m.docs)==null?void 0:u.source}}};var p,x,h;o.parameters={...o.parameters,docs:{...(p=o.parameters)==null?void 0:p.docs,source:{originalSource:`{
  render: () => <DemoMenu>
      <MenuItem>Default</MenuItem>
      <MenuItem selected>Selected</MenuItem>
      <MenuItem disabled>Disabled</MenuItem>
      <MenuItem dense>Dense</MenuItem>
    </DemoMenu>
}`,...(h=(x=o.parameters)==null?void 0:x.docs)==null?void 0:h.source}}};var M,g,I;i.parameters={...i.parameters,docs:{...(M=i.parameters)==null?void 0:M.docs,source:{originalSource:`{
  render: () => <DemoMenu>
      <MenuItem>
        <strong>Custom node as children</strong>
      </MenuItem>
      <MenuItem>
        <span style={{
        opacity: 0.75
      }}>With inline styling</span>
      </MenuItem>
    </DemoMenu>
}`,...(I=(g=i.parameters)==null?void 0:g.docs)==null?void 0:I.source}}};const Y=["Playground","States","WithCustomChildren"];export{s as Playground,o as States,i as WithCustomChildren,Y as __namedExportsOrder,X as default};
