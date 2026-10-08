import{j as e,L as D}from"./iframe-q72FflWy.js";import{S as s}from"./Stack-DHvmwf16.js";import{P as f}from"./Paper-9gdP3SeZ.js";import"./preload-helper-Dp1pzeXC.js";import"./getThemeProps-BMrl9x_3.js";import"./Paper-C4cHEfmg.js";const O={title:"Molecules/Stack",component:s,tags:["autodocs"],decorators:[r=>e.jsx("div",{style:{padding:16,minHeight:240},children:e.jsx(r,{})})],parameters:{docs:{description:{component:`
The **Stack** atom is a thin wrapper around MUI's \`MuiStack\` that preserves **polymorphism** and forwards all layout props.
It integrates with **This.GUI** theming and supports **declarative specs** through the Stack resolver.

---
## Features
- Direction: \`row\`, \`column\`, and reverse variants
- Spacing/gap via \`spacing\`
- Optional \`divider\`
- Alignment: \`alignItems\`, \`justifyContent\`, \`flexWrap\`
- **Polymorphic** via \`component\` (e.g. 'div', 'section', 'a')
- Full **system props** passthrough via \`sx\`

---
## Basic usage
~~~jsx
<Stack direction="row" spacing={2}>
  <Item />
  <Item />
</Stack>
~~~

## Declarative JSON / Resolver
~~~json
{
  "type": "Stack",
  "props": {
    "direction": "row",
    "spacing": 2,
    "sx": { "alignItems": "center" },
    "children": [
      { "type": "Paper", "props": { "sx": { "p": 1 }, "children": "A" } },
      { "type": "Paper", "props": { "sx": { "p": 1 }, "children": "B" } }
    ]
  }
}
~~~

*Note:* We demonstrate polymorphism in dedicated stories rather than Controls to avoid type-narrowing issues with MUI's OverridableComponent.
        `}},controls:{exclude:["component"]}},argTypes:{direction:{control:{type:"radio"},options:["row","row-reverse","column","column-reverse"]},spacing:{control:{type:"range",min:0,max:8,step:.5}},useFlexGap:{control:"boolean"},sx:{control:"object"}},args:{direction:"row",spacing:1.5,useFlexGap:!0,sx:{},children:void 0}},n=({children:r})=>e.jsx(f,{variant:"outlined",sx:{p:1.5,borderRadius:1},children:r}),t={render:r=>e.jsxs(s,{...r,children:[e.jsx(n,{children:"A"}),e.jsx(n,{children:"B"}),e.jsx(n,{children:"C"})]})},o={args:{direction:"row",spacing:2},render:r=>e.jsxs(s,{...r,children:[e.jsx(n,{children:"A"}),e.jsx(n,{children:"B"}),e.jsx(n,{children:"C"})]})},a={args:{direction:"column",spacing:1.5},render:r=>e.jsxs(s,{...r,sx:{width:240},children:[e.jsx(n,{children:"A"}),e.jsx(n,{children:"B"}),e.jsx(n,{children:"C"})]})},c={render:r=>e.jsxs(s,{...r,direction:"row",spacing:2,divider:e.jsx("span",{style:{opacity:.5},children:"|"}),children:[e.jsx(n,{children:"A"}),e.jsx(n,{children:"B"}),e.jsx(n,{children:"C"})]})},i={render:r=>e.jsxs(s,{...r,component:"section",spacing:1.5,children:[e.jsx(n,{children:"Section A"}),e.jsx(n,{children:"Section B"})]})},p={render:r=>e.jsx(D,{to:"/docs",style:{textDecoration:"none"},children:e.jsx(s,{...r,spacing:1.5,children:e.jsx(n,{children:"Go to Docs"})})})},W=["Playground","RowSpacing","ColumnSpacing","WithDivider","PolymorphicSection","PolymorphicRouterLink"];var d,m,l;t.parameters={...t.parameters,docs:{...(d=t.parameters)==null?void 0:d.docs,source:{originalSource:`{
  render: args => <Stack {...args}>
      <Item>A</Item>
      <Item>B</Item>
      <Item>C</Item>
    </Stack>
}`,...(l=(m=t.parameters)==null?void 0:m.docs)==null?void 0:l.source}}};var g,h,u;o.parameters={...o.parameters,docs:{...(g=o.parameters)==null?void 0:g.docs,source:{originalSource:`{
  args: {
    direction: 'row',
    spacing: 2
  },
  render: args => <Stack {...args}>
      <Item>A</Item>
      <Item>B</Item>
      <Item>C</Item>
    </Stack>
}`,...(u=(h=o.parameters)==null?void 0:h.docs)==null?void 0:u.source}}};var x,I,S;a.parameters={...a.parameters,docs:{...(x=a.parameters)==null?void 0:x.docs,source:{originalSource:`{
  args: {
    direction: 'column',
    spacing: 1.5
  },
  render: args => <Stack {...args} sx={{
    width: 240
  }}>
      <Item>A</Item>
      <Item>B</Item>
      <Item>C</Item>
    </Stack>
}`,...(S=(I=a.parameters)==null?void 0:I.docs)==null?void 0:S.source}}};var j,y,k;c.parameters={...c.parameters,docs:{...(j=c.parameters)==null?void 0:j.docs,source:{originalSource:`{
  render: args => <Stack {...args} direction="row" spacing={2} divider={<span style={{
    opacity: 0.5
  }}>|</span>}>
      <Item>A</Item>
      <Item>B</Item>
      <Item>C</Item>
    </Stack>
}`,...(k=(y=c.parameters)==null?void 0:y.docs)==null?void 0:k.source}}};var v,w,C;i.parameters={...i.parameters,docs:{...(v=i.parameters)==null?void 0:v.docs,source:{originalSource:`{
  render: args => <Stack {...args} component="section" spacing={1.5}>
      <Item>Section A</Item>
      <Item>Section B</Item>
    </Stack>
}`,...(C=(w=i.parameters)==null?void 0:w.docs)==null?void 0:C.source}}};var A,B,P;p.parameters={...p.parameters,docs:{...(A=p.parameters)==null?void 0:A.docs,source:{originalSource:`{
  render: args => <Link to="/docs" style={{
    textDecoration: 'none'
  }}>
      <Stack {...args} spacing={1.5}>
        <Item>Go to Docs</Item>
      </Stack>
    </Link>
}`,...(P=(B=p.parameters)==null?void 0:B.docs)==null?void 0:P.source}}};export{a as ColumnSpacing,t as Playground,p as PolymorphicRouterLink,i as PolymorphicSection,o as RowSpacing,c as WithDivider,W as __namedExportsOrder,O as default};
