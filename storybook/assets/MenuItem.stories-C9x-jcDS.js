import{j as e,r as b}from"./iframe-jME6TRyu.js";import{M as n}from"./MenuItem-DcP_Ub-O.js";import{M as f}from"./Menu-BfotP1nQ.js";import{I as D}from"./Icon-BtaMh9kU.js";import{B as C}from"./Button-CLDQrykt.js";import"./preload-helper-Dp1pzeXC.js";import"./MenuItem-c5vDCIh9.js";import"./List-PPc6luvu.js";import"./useForkRef-z1e785Ns.js";import"./ButtonBase-BOSaDjG-.js";import"./TransitionGroupContext-BRZCH32N.js";import"./listItemIconClasses-Drtk4guX.js";import"./listItemTextClasses-BTSdieEv.js";import"./dividerClasses-C2APwgbx.js";import"./Menu-L0v-vIF4.js";import"./useSlot-C61ruhcO.js";import"./resolveComponentProps-BQXnF4aQ.js";import"./useSlotProps-BeRtKzOs.js";import"./isHostComponent-DVu5iVWx.js";import"./Paper-Ndu2Ngkb.js";import"./Grow-CX1iIK_S.js";import"./mergeSlotProps-Dul5GYdh.js";import"./CircularProgress-DVHqJ1WQ.js";const V={title:"Molecules/Menu/MenuItem",component:n,tags:["autodocs"],decorators:[t=>e.jsx("div",{style:{padding:16,minHeight:260},children:e.jsx(t,{})})],parameters:{docs:{description:{component:`
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
}`,...(I=(g=i.parameters)==null?void 0:g.docs)==null?void 0:I.source}}};const X=["Playground","States","WithCustomChildren"];export{s as Playground,o as States,i as WithCustomChildren,X as __namedExportsOrder,V as default};
