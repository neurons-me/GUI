import{j as a}from"./iframe-CWBlVoSh.js";import{Q as r}from"./QR.me-BG6k3Cys.js";import"./preload-helper-Dp1pzeXC.js";import"./Avatar-Dost7fiL.js";import"./Avatar-B3DduiUj.js";import"./createSvgIcon-dmWuGQpH.js";import"./useSlot-JA-NOEOp.js";import"./resolveComponentProps-DrUC3lMZ.js";import"./useForkRef-q9ZWwCIp.js";import"./Tooltip-DGbo-tbI.js";import"./Tooltip-C3vnz-2G.js";import"./TransitionGroupContext-2-KL0BXO.js";import"./useControlled-jbbdFfPX.js";import"./useEventCallback-JUhf_uGg.js";import"./Grow-2bpzgjoW.js";import"./useSlotProps-DIYNG2by.js";import"./Icon-CB0Uj0Aw.js";import"./QR-Ci_OdyxM.js";import"./PixelWordmark-_MmbvlM4.js";const G={title:"Pieces/QR.me",component:r,args:{value:"https://jabellae.cleaker.me",username:"jabellae",avatarSrc:"https://neurons.me/media/neurons-grey.png",diameter:124,variant:"md",defaultFace:"qr",hoverFlip:!0,clickFlip:!0,showAvatarLabel:!1}},t={},s={args:{defaultFace:"avatar"}},o={args:{avatarSrc:"",avatarFallback:"JB",showAvatarLabel:!0}},i={args:{variant:"topbar",diameter:40},render:e=>a.jsxs("div",{style:{display:"flex",alignItems:"center",gap:20,flexWrap:"wrap"},children:[a.jsx(r,{...e,status:"checking",statusLabel:"Checking…"}),a.jsx(r,{...e,status:"confirmed",statusLabel:"Connected"}),a.jsx(r,{...e,status:"error",statusLabel:"Could not connect"})]})},m={render:e=>a.jsxs("div",{style:{display:"flex",alignItems:"center",gap:20,flexWrap:"wrap"},children:[a.jsx(r,{...e,variant:"xs",diameter:72}),a.jsx(r,{...e,variant:"sm",diameter:96}),a.jsx(r,{...e,variant:"md",diameter:112}),a.jsx(r,{...e,variant:"lg",diameter:148}),a.jsx(r,{...e,variant:"xl",diameter:184})]})};var n,c,l;t.parameters={...t.parameters,docs:{...(n=t.parameters)==null?void 0:n.docs,source:{originalSource:"{}",...(l=(c=t.parameters)==null?void 0:c.docs)==null?void 0:l.source}}};var p,d,u;s.parameters={...s.parameters,docs:{...(p=s.parameters)==null?void 0:p.docs,source:{originalSource:`{
  args: {
    defaultFace: 'avatar'
  }
}`,...(u=(d=s.parameters)==null?void 0:d.docs)==null?void 0:u.source}}};var v,g,x;o.parameters={...o.parameters,docs:{...(v=o.parameters)==null?void 0:v.docs,source:{originalSource:`{
  args: {
    avatarSrc: '',
    avatarFallback: 'JB',
    showAvatarLabel: true
  }
}`,...(x=(g=o.parameters)==null?void 0:g.docs)==null?void 0:x.source}}};var f,b,j;i.parameters={...i.parameters,docs:{...(f=i.parameters)==null?void 0:f.docs,source:{originalSource:`{
  args: {
    variant: 'topbar',
    diameter: 40
  },
  render: args => <div style={{
    display: 'flex',
    alignItems: 'center',
    gap: 20,
    flexWrap: 'wrap'
  }}>
      <QRme {...args} status="checking" statusLabel="Checking…" />
      <QRme {...args} status="confirmed" statusLabel="Connected" />
      <QRme {...args} status="error" statusLabel="Could not connect" />
    </div>
}`,...(j=(b=i.parameters)==null?void 0:b.docs)==null?void 0:j.source}}};var h,S,y;m.parameters={...m.parameters,docs:{...(h=m.parameters)==null?void 0:h.docs,source:{originalSource:`{
  render: args => <div style={{
    display: 'flex',
    alignItems: 'center',
    gap: 20,
    flexWrap: 'wrap'
  }}>
      <QRme {...args} variant="xs" diameter={72} />
      <QRme {...args} variant="sm" diameter={96} />
      <QRme {...args} variant="md" diameter={112} />
      <QRme {...args} variant="lg" diameter={148} />
      <QRme {...args} variant="xl" diameter={184} />
    </div>
}`,...(y=(S=m.parameters)==null?void 0:S.docs)==null?void 0:y.source}}};const H=["Default","AvatarFirst","FallbackOnly","ConnectionStatus","Sizes"];export{s as AvatarFirst,i as ConnectionStatus,t as Default,o as FallbackOnly,m as Sizes,H as __namedExportsOrder,G as default};
