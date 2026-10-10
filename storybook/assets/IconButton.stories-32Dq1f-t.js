import{j as e}from"./iframe-q72FflWy.js";import{I as n}from"./IconButton-D9uKbFdE.js";import{I as r}from"./Icon-Doq3uhPc.js";import"./preload-helper-Dp1pzeXC.js";import"./IconButton-0qTeMK6V.js";import"./ButtonBase-D2HnvhjV.js";import"./TransitionGroupContext-4zVEsxkP.js";import"./useForkRef-BR9zNRBO.js";import"./useEventCallback-BVb6jHPB.js";import"./CircularProgress-BunsQ8Ul.js";const A={title:"Atoms/IconButton",component:n,tags:["autodocs"],decorators:[o=>e.jsx("div",{style:{padding:16,minHeight:200},children:e.jsx(o,{})})],parameters:{docs:{description:{component:`
The **IconButton** atom is a thin wrapper around MUI's \`MuiIconButton\`, staying faithful to its API and polymorphism (\`component\`).

In **declarative** mode (resolver), you can pass an \`icon\` token (e.g., \`"lucide:menu"\`, \`"mui:Close"\`) and it will render through the Icon registry. You can also style the icon with \`iconSx\` while using \`sx\` for the button root.

---
## React usage
~~~jsx
<IconButton color="primary" size="medium" aria-label="open menu">
  <Icon name="lucide:menu" />
</IconButton>
~~~

## Declarative JSON / Resolver
~~~json
{
  "type": "IconButton",
  "props": {
    "color": "primary",
    "size": "medium",
    "icon": "lucide:Menu",
    "sx": { "border": "1px solid", "borderColor": "divider" },
    "iconSx": { "opacity": 0.9 }
  }
}
~~~
        `}},controls:{exclude:["component","children"]}},argTypes:{color:{control:{type:"select"},options:["inherit","default","primary","secondary","success","error","info","warning"]},size:{control:{type:"radio"},options:["small","medium","large"]},edge:{control:{type:"radio"},options:["start","end",!1]},disabled:{control:"boolean"},sx:{control:"object"}},args:{color:"default",size:"medium",edge:!1,disabled:!1,sx:{},children:void 0}},a={render:o=>e.jsx(n,{...o,"aria-label":"menu",children:e.jsx(r,{name:"lucide:Menu"})})},s={render:()=>e.jsx("div",{style:{display:"flex",gap:12,alignItems:"center",flexWrap:"wrap"},children:["default","primary","secondary","success","info","warning","error"].map(o=>e.jsx(n,{color:o,"aria-label":o,children:e.jsx(r,{name:"mui:Favorite"})},o))})},t={render:()=>e.jsxs("div",{style:{display:"flex",gap:12,alignItems:"center"},children:[e.jsx(n,{size:"small","aria-label":"small",children:e.jsx(r,{name:"lucide:Bell"})}),e.jsx(n,{size:"medium","aria-label":"medium",children:e.jsx(r,{name:"lucide:Bell"})}),e.jsx(n,{size:"large","aria-label":"large",children:e.jsx(r,{name:"lucide:Bell"})})]})},i={render:()=>e.jsxs("div",{style:{display:"flex",gap:12,alignItems:"center"},children:[e.jsx(n,{edge:"start","aria-label":"start",children:e.jsx(r,{name:"lucide:ChevronLeft"})}),e.jsx(n,{edge:"end","aria-label":"end",children:e.jsx(r,{name:"lucide:ChevronRight"})})]})},l={render:()=>e.jsx(n,{sx:{border:"1px solid",borderColor:"divider"},"aria-label":"styled",children:e.jsx(r,{name:"mui:Close"})})},F=["Playground","Colors","Sizes","WithEdge","WithSx"];var c,d,m;a.parameters={...a.parameters,docs:{...(c=a.parameters)==null?void 0:c.docs,source:{originalSource:`{
  render: args => <IconButton {...args} aria-label="menu">
      <Icon name="lucide:Menu" />
    </IconButton>
}`,...(m=(d=a.parameters)==null?void 0:d.docs)==null?void 0:m.source}}};var u,p,g;s.parameters={...s.parameters,docs:{...(u=s.parameters)==null?void 0:u.docs,source:{originalSource:`{
  render: () => <div style={{
    display: 'flex',
    gap: 12,
    alignItems: 'center',
    flexWrap: 'wrap'
  }}>
      {(['default', 'primary', 'secondary', 'success', 'info', 'warning', 'error'] as const).map(c => <IconButton key={c} color={c} aria-label={c}>
          <Icon name="mui:Favorite" />
        </IconButton>)}
    </div>
}`,...(g=(p=s.parameters)==null?void 0:p.docs)==null?void 0:g.source}}};var x,I,h;t.parameters={...t.parameters,docs:{...(x=t.parameters)==null?void 0:x.docs,source:{originalSource:`{
  render: () => <div style={{
    display: 'flex',
    gap: 12,
    alignItems: 'center'
  }}>
      <IconButton size="small" aria-label="small">
        <Icon name="lucide:Bell" />
      </IconButton>
      <IconButton size="medium" aria-label="medium">
        <Icon name="lucide:Bell" />
      </IconButton>
      <IconButton size="large" aria-label="large">
        <Icon name="lucide:Bell" />
      </IconButton>
    </div>
}`,...(h=(I=t.parameters)==null?void 0:I.docs)==null?void 0:h.source}}};var y,B,b;i.parameters={...i.parameters,docs:{...(y=i.parameters)==null?void 0:y.docs,source:{originalSource:`{
  render: () => <div style={{
    display: 'flex',
    gap: 12,
    alignItems: 'center'
  }}>
      <IconButton edge="start" aria-label="start">
        <Icon name="lucide:ChevronLeft" />
      </IconButton>
      <IconButton edge="end" aria-label="end">
        <Icon name="lucide:ChevronRight" />
      </IconButton>
    </div>
}`,...(b=(B=i.parameters)==null?void 0:B.docs)==null?void 0:b.source}}};var f,j,v;l.parameters={...l.parameters,docs:{...(f=l.parameters)==null?void 0:f.docs,source:{originalSource:`{
  render: () => <IconButton sx={{
    border: '1px solid',
    borderColor: 'divider'
  }} aria-label="styled">
      <Icon name="mui:Close" />
    </IconButton>
}`,...(v=(j=l.parameters)==null?void 0:j.docs)==null?void 0:v.source}}};export{s as Colors,a as Playground,t as Sizes,i as WithEdge,l as WithSx,F as __namedExportsOrder,A as default};
