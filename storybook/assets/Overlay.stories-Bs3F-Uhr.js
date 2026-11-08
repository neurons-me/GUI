import{j as r}from"./iframe-Dgz0DvjP.js";import{S as p}from"./StreamStage-CuAJY45q.js";import{W as D}from"./WithTheme.story-BXScLere.js";import{S as F}from"./SampleGuiLayer.story-Da0vnRoI.js";import"./preload-helper-Dp1pzeXC.js";import"./OverlaySwatch-Bmcc1Las.js";const M={title:"Twitch/Overlay",component:p,tags:["autodocs"],parameters:{layout:"fullscreen",docs:{description:{component:'Stream layer, bottom to top: camera (PLACEHOLDER gradient/sample video) → tint overlay (opacity 0 = clean camera, 100 = full cover) → .GUI components. fit="fill" (default) covers the container width+height; fit="contain" / transparent = fixed 1920x1080 scaled (OBS).'}}},argTypes:{hue:{control:{type:"range",min:0,max:360}},opacity:{control:{type:"range",min:0,max:100}},fit:{control:"inline-radio",options:["fill","contain"]}},args:{hue:210,opacity:50},render:i=>r.jsx(D,{mode:"dark",children:r.jsx("div",{style:{background:"#111",height:"100vh",boxSizing:"border-box"},children:r.jsx(p,{...i,children:r.jsx(F,{})})})})},e={},s={args:{opacity:0}},c={args:{opacity:50}},n={args:{opacity:100}},a={args:{fit:"contain"}},t={args:{transparent:!0,opacity:30},render:i=>r.jsx(D,{mode:"dark",children:r.jsx("div",{style:{background:"transparent"},children:r.jsx(p,{...i,children:r.jsx(F,{})})})})},o={args:{controls:!0,opacity:50,storageKey:"storybook:twitch-overlay"}};var d,m,l,u,y;e.parameters={...e.parameters,docs:{...(d=e.parameters)==null?void 0:d.docs,source:{originalSource:"{}",...(l=(m=e.parameters)==null?void 0:m.docs)==null?void 0:l.source},description:{story:"Stage driven by args (hue/opacity) over the placeholder camera.",...(y=(u=e.parameters)==null?void 0:u.docs)==null?void 0:y.description}}};var g,h,S;s.parameters={...s.parameters,docs:{...(g=s.parameters)==null?void 0:g.docs,source:{originalSource:`{
  args: {
    opacity: 0
  }
}`,...(S=(h=s.parameters)==null?void 0:h.docs)==null?void 0:S.source}}};var x,v,f;c.parameters={...c.parameters,docs:{...(x=c.parameters)==null?void 0:x.docs,source:{originalSource:`{
  args: {
    opacity: 50
  }
}`,...(f=(v=c.parameters)==null?void 0:v.docs)==null?void 0:f.source}}};var b,O,j;n.parameters={...n.parameters,docs:{...(b=n.parameters)==null?void 0:b.docs,source:{originalSource:`{
  args: {
    opacity: 100
  }
}`,...(j=(O=n.parameters)==null?void 0:O.docs)==null?void 0:j.source}}};var w,k,C,T,W;a.parameters={...a.parameters,docs:{...(w=a.parameters)==null?void 0:w.docs,source:{originalSource:`{
  args: {
    fit: 'contain'
  }
}`,...(C=(k=a.parameters)==null?void 0:k.docs)==null?void 0:C.source},description:{story:"Fixed 1920x1080 scaled to width (letterboxed by the container).",...(W=(T=a.parameters)==null?void 0:T.docs)==null?void 0:W.description}}};var B,E,L,G,K;t.parameters={...t.parameters,docs:{...(B=t.parameters)==null?void 0:B.docs,source:{originalSource:`{
  args: {
    transparent: true,
    opacity: 30
  },
  render: args => <WithTheme mode="dark">
      <div style={{
      background: 'transparent'
    }}>
        <StreamStage {...args}><SampleGuiLayer /></StreamStage>
      </div>
    </WithTheme>
}`,...(L=(E=t.parameters)==null?void 0:E.docs)==null?void 0:L.source},description:{story:"What OBS loads as a browser source: transparent, no camera, no controls; args drive hue/opacity.",...(K=(G=t.parameters)==null?void 0:G.docs)==null?void 0:K.description}}};var R,V,_,z,A;o.parameters={...o.parameters,docs:{...(R=o.parameters)==null?void 0:R.docs,source:{originalSource:`{
  args: {
    controls: true,
    opacity: 50,
    storageKey: 'storybook:twitch-overlay'
  }
}`,...(_=(V=o.parameters)==null?void 0:V.docs)==null?void 0:_.source},description:{story:"Control view: theme-bound OverlaySwatch on the stage (drag ↔ hue, ↕ opacity, double-click = theme).",...(A=(z=o.parameters)==null?void 0:z.docs)==null?void 0:A.description}}};const N=["Stage","Opacity0","Opacity50","Opacity100","Contain","OBSSource","ControlView"];export{a as Contain,o as ControlView,t as OBSSource,s as Opacity0,n as Opacity100,c as Opacity50,e as Stage,N as __namedExportsOrder,M as default};
