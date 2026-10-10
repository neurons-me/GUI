import{j as e,t as m,F as R}from"./iframe-q72FflWy.js";import i from"./RubiksCube-DXi0U9Ux.js";import"./preload-helper-Dp1pzeXC.js";const D={title:"Widgets/RubiksCube",component:i,tags:["autodocs"],args:{height:340,spin:!0,orbit:!0,borderRadius:16,palette:"classic"}},r={name:"Default (spinning, draggable)"},a={name:"Themed (neurons.me palette)",args:{palette:"themed"}},s={name:"No spin",args:{spin:!1}},t={name:"Orbit disabled",args:{orbit:!1}},S=R({palette:{mode:"dark",primary:{main:"#a855f7",dark:"#581c87"},info:{main:"#a855f7"},background:{default:"#1a0b2e"}}}),C=R({palette:{mode:"light",primary:{main:"#16a34a",dark:"#14532d"},info:{main:"#16a34a"},background:{default:"#f0fdf4"}}}),n={name:"Themed — reacts to whichever theme wraps it",args:{palette:"themed",spin:!1,orbit:!1},render:o=>e.jsxs("div",{style:{display:"flex",gap:16},children:[e.jsx(m,{theme:S,children:e.jsx("div",{style:{flex:1},children:e.jsx(i,{...o})})}),e.jsx(m,{theme:C,children:e.jsx("div",{style:{flex:1},children:e.jsx(i,{...o})})})]})},N=["Default","Themed","Static","NoOrbitControls","ThemeReactivity"];var d,c,l;r.parameters={...r.parameters,docs:{...(d=r.parameters)==null?void 0:d.docs,source:{originalSource:`{
  name: 'Default (spinning, draggable)'
}`,...(l=(c=r.parameters)==null?void 0:c.docs)==null?void 0:l.source}}};var p,u,h;a.parameters={...a.parameters,docs:{...(p=a.parameters)==null?void 0:p.docs,source:{originalSource:`{
  name: 'Themed (neurons.me palette)',
  args: {
    palette: 'themed'
  }
}`,...(h=(u=a.parameters)==null?void 0:u.docs)==null?void 0:h.source}}};var g,f,b;s.parameters={...s.parameters,docs:{...(g=s.parameters)==null?void 0:g.docs,source:{originalSource:`{
  name: 'No spin',
  args: {
    spin: false
  }
}`,...(b=(f=s.parameters)==null?void 0:f.docs)==null?void 0:b.source}}};var v,T,x;t.parameters={...t.parameters,docs:{...(v=t.parameters)==null?void 0:v.docs,source:{originalSource:`{
  name: 'Orbit disabled',
  args: {
    orbit: false
  }
}`,...(x=(T=t.parameters)==null?void 0:T.docs)==null?void 0:x.source}}};var y,j,k;n.parameters={...n.parameters,docs:{...(y=n.parameters)==null?void 0:y.docs,source:{originalSource:`{
  name: 'Themed — reacts to whichever theme wraps it',
  args: {
    palette: 'themed',
    spin: false,
    orbit: false
  },
  render: args => <div style={{
    display: 'flex',
    gap: 16
  }}>
      <ThemeProvider theme={purpleTheme}>
        <div style={{
        flex: 1
      }}>
          <RubiksCube {...args} />
        </div>
      </ThemeProvider>
      <ThemeProvider theme={greenTheme}>
        <div style={{
        flex: 1
      }}>
          <RubiksCube {...args} />
        </div>
      </ThemeProvider>
    </div>
}`,...(k=(j=n.parameters)==null?void 0:j.docs)==null?void 0:k.source}}};export{r as Default,t as NoOrbitControls,s as Static,n as ThemeReactivity,a as Themed,N as __namedExportsOrder,D as default};
