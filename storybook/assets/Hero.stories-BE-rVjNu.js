import{j as e}from"./iframe-q72FflWy.js";import{H as F}from"./Hero-BdzYVYxS.js";import{B as d}from"./Button-BpF6GA05.js";import{T as R}from"./TextField-BSNRPa5x.js";import"./preload-helper-Dp1pzeXC.js";import"./ButtonBase-D2HnvhjV.js";import"./TransitionGroupContext-4zVEsxkP.js";import"./useForkRef-BR9zNRBO.js";import"./useEventCallback-BVb6jHPB.js";import"./CircularProgress-BunsQ8Ul.js";import"./useSlot-B3Bhjpe0.js";import"./resolveComponentProps-zf7BDQ8X.js";import"./useFormControl-BGm5bEiu.js";import"./isHostComponent-DVu5iVWx.js";import"./Menu-DFKCKfQm.js";import"./useSlotProps-DMFXOslT.js";import"./Paper-C4cHEfmg.js";import"./Grow-C-rRNj8l.js";import"./mergeSlotProps-BtuGLXbb.js";import"./List-DvvFCGIp.js";import"./useControlled-DIH1o2g4.js";import"./createSvgIcon-DOR6FtI1.js";import"./isMuiElement-CKqkPfIO.js";const ie={title:"Molecules/Display/Hero",component:F,tags:["autodocs"],decorators:[r=>e.jsx("div",{style:{height:"100vh",overflow:"hidden"},children:e.jsx(r,{})})],parameters:{docs:{description:{component:"\n**HeroSection** is a full-screen display component that supports image, GIF, video, or color backgrounds with overlay and blur options.\n\n---\n## Features\n- Background types: `image`, `gif`, `video`, `color`.\n- Overlay color and opacity control.\n- Theme-aware blur effects: `light`, `medium`, `heavy`, `all`.\n- Fully responsive and fills viewport (100vh).\n- Structured content helpers: brand image, header, subheader, description, options.\n\n---\n## Props\n- `backgroundSrc`: Media URL (image, gif, or video).\n- `backgroundType`: Type of background media ('image', 'gif', 'video', or 'color').\n- `backgroundColor`: Color when backgroundType = 'color'.\n- `overlayColor`: Color of overlay.\n- `blur`: Theme-based blur intensity (`light`, `medium`, `heavy`, `all`).\n- `accent`: Optional `theme.visuals.accents` key (`aurora` | `ember` | `monolith` | `neutral`) for overlay/background.\n        "}}}},o={args:{backgroundSrc:"https://images.unsplash.com/photo-1507525428034-b723cf961d3e",backgroundType:"image",blur:"none",layout:"fixed",children:e.jsx("div",{style:{color:"white",fontSize:"2rem",fontWeight:600,textAlign:"center",marginTop:"40vh"},children:"Example: Image Background, Blur none"})}},n={args:{backgroundSrc:"https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif",backgroundType:"gif",blur:"light",layout:"fixed",children:e.jsx("div",{style:{color:"white",fontSize:"2rem",fontWeight:600,textAlign:"center",marginTop:"40vh"},children:"Example: GIF Background, Blur light"})}},a={args:{backgroundSrc:"https://www.neurons.me/media/neurons.mp4",backgroundType:"video",blur:"medium",layout:"fixed",children:e.jsx("div",{style:{color:"white",fontSize:"2rem",fontWeight:600,textAlign:"center",marginTop:"40vh"},children:"Example: Video Background, Blur medium"})}},t={args:{backgroundType:"color",backgroundColor:"#0b1114",overlayColor:"rgba(8, 14, 24, 0.55)",brand:{src:"https://res.cloudinary.com/dkwnxf6gm/image/upload/v1760629119/this.gui.neurons.me_mkapde.png",alt:"this.GUI",width:220,maxWidth:"70vw"},header:"this.GUI Runtime",subheader:"Hero Section",typography:"Runtime overview and quick links for the GUI toolchain.",options:e.jsxs(e.Fragment,{children:[e.jsx(d,{variant:"contained",color:"primary",children:"Get Started"}),e.jsx(d,{variant:"outlined",color:"inherit",children:"Docs"}),e.jsx(R,{size:"small",placeholder:"Search..."})]}),mode:"left"}},i={args:{backgroundSrc:"https://images.unsplash.com/photo-1507525428034-b723cf961d3e",backgroundType:"image",blur:"heavy",children:e.jsx("div",{style:{color:"white",fontSize:"2rem",fontWeight:600,textAlign:"center",marginTop:"40vh"},children:"Example: Heavy blur overlay (theme preset)"})}},c={render:()=>e.jsx("div",{style:{display:"grid",gridTemplateColumns:"repeat(2, 1fr)",gap:16},children:["none","light","medium","heavy","all"].map(r=>e.jsx(F,{backgroundSrc:"https://images.unsplash.com/photo-1507525428034-b723cf961d3e",backgroundType:"image",blur:r,children:e.jsxs("div",{style:{color:"white",fontSize:"1.5rem",fontWeight:600,textAlign:"center",marginTop:"40vh"},children:["Blur = ",r]})},r))})},s={args:{backgroundSrc:"https://images.unsplash.com/photo-1507525428034-b723cf961d3e",backgroundType:"image",overlayColor:"rgba(15, 21, 37, 0.89)",children:e.jsx("div",{style:{color:"white",fontSize:"2rem",fontWeight:600,textAlign:"center",marginTop:"40vh"},children:"Example: Custom Color Overlay"})}},l={args:{backgroundType:"color",accent:"aurora",layout:"flow",height:"40vh",mode:"center",header:"Accent: aurora",typography:"Hero maps accent → theme.visuals.accents[accent] (soft overlay / strong color bg)."},argTypes:{accent:{control:"select",options:["aurora","ember","monolith","neutral"]}}},ce=["ImageBackground","GifBackground","VideoBackground","StructuredHero","HeavyExample","BlurVariants","CustomColorExample","AccentPresets"];var m,p,u;o.parameters={...o.parameters,docs:{...(m=o.parameters)==null?void 0:m.docs,source:{originalSource:`{
  args: {
    backgroundSrc: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e',
    backgroundType: 'image',
    blur: 'none',
    layout: 'fixed',
    children: <div style={{
      color: 'white',
      fontSize: '2rem',
      fontWeight: 600,
      textAlign: 'center',
      marginTop: '40vh'
    }}>
        Example: Image Background, Blur none
      </div>
  }
}`,...(u=(p=o.parameters)==null?void 0:p.docs)==null?void 0:u.source}}};var g,h,y;n.parameters={...n.parameters,docs:{...(g=n.parameters)==null?void 0:g.docs,source:{originalSource:`{
  args: {
    backgroundSrc: 'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif',
    backgroundType: 'gif',
    blur: 'light',
    layout: 'fixed',
    children: <div style={{
      color: 'white',
      fontSize: '2rem',
      fontWeight: 600,
      textAlign: 'center',
      marginTop: '40vh'
    }}>
        Example: GIF Background, Blur light
      </div>
  }
}`,...(y=(h=n.parameters)==null?void 0:h.docs)==null?void 0:y.source}}};var v,b,f;a.parameters={...a.parameters,docs:{...(v=a.parameters)==null?void 0:v.docs,source:{originalSource:`{
  args: {
    backgroundSrc: 'https://www.neurons.me/media/neurons.mp4',
    backgroundType: 'video',
    blur: 'medium',
    layout: 'fixed',
    children: <div style={{
      color: 'white',
      fontSize: '2rem',
      fontWeight: 600,
      textAlign: 'center',
      marginTop: '40vh'
    }}>
        Example: Video Background, Blur medium
      </div>
  }
}`,...(f=(b=a.parameters)==null?void 0:b.docs)==null?void 0:f.source}}};var k,x,S;t.parameters={...t.parameters,docs:{...(k=t.parameters)==null?void 0:k.docs,source:{originalSource:`{
  args: {
    backgroundType: 'color',
    backgroundColor: '#0b1114',
    overlayColor: 'rgba(8, 14, 24, 0.55)',
    brand: {
      src: 'https://res.cloudinary.com/dkwnxf6gm/image/upload/v1760629119/this.gui.neurons.me_mkapde.png',
      alt: 'this.GUI',
      width: 220,
      maxWidth: '70vw'
    },
    header: 'this.GUI Runtime',
    subheader: 'Hero Section',
    typography: 'Runtime overview and quick links for the GUI toolchain.',
    options: <>
        <Button variant="contained" color="primary">Get Started</Button>
        <Button variant="outlined" color="inherit">Docs</Button>
        <TextField size="small" placeholder="Search..." />
      </>,
    mode: 'left'
  }
}`,...(S=(x=t.parameters)==null?void 0:x.docs)==null?void 0:S.source}}};var T,w,B;i.parameters={...i.parameters,docs:{...(T=i.parameters)==null?void 0:T.docs,source:{originalSource:`{
  args: {
    backgroundSrc: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e',
    backgroundType: 'image',
    blur: 'heavy',
    children: <div style={{
      color: 'white',
      fontSize: '2rem',
      fontWeight: 600,
      textAlign: 'center',
      marginTop: '40vh'
    }}>
        Example: Heavy blur overlay (theme preset)
      </div>
  }
}`,...(B=(w=i.parameters)==null?void 0:w.docs)==null?void 0:B.source}}};var C,j,A;c.parameters={...c.parameters,docs:{...(C=c.parameters)==null?void 0:C.docs,source:{originalSource:`{
  render: () => <div style={{
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 16
  }}>
      {(['none', 'light', 'medium', 'heavy', 'all'] as const).map(b => <Hero key={b} backgroundSrc="https://images.unsplash.com/photo-1507525428034-b723cf961d3e" backgroundType="image" blur={b} children={<div style={{
      color: 'white',
      fontSize: '1.5rem',
      fontWeight: 600,
      textAlign: 'center',
      marginTop: '40vh'
    }}>
              Blur = {b}
            </div>} />)}
    </div>
}`,...(A=(j=c.parameters)==null?void 0:j.docs)==null?void 0:A.source}}};var E,H,z;s.parameters={...s.parameters,docs:{...(E=s.parameters)==null?void 0:E.docs,source:{originalSource:`{
  args: {
    backgroundSrc: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e',
    backgroundType: 'image',
    overlayColor: 'rgba(15, 21, 37, 0.89)',
    // Semi-transparent dark overlay
    children: <div style={{
      color: 'white',
      fontSize: '2rem',
      fontWeight: 600,
      textAlign: 'center',
      marginTop: '40vh'
    }}>
        Example: Custom Color Overlay
      </div>
  }
}`,...(z=(H=s.parameters)==null?void 0:H.docs)==null?void 0:z.source}}};var W,G,I;l.parameters={...l.parameters,docs:{...(W=l.parameters)==null?void 0:W.docs,source:{originalSource:`{
  args: {
    backgroundType: 'color',
    accent: 'aurora',
    layout: 'flow',
    height: '40vh',
    mode: 'center',
    header: 'Accent: aurora',
    typography: 'Hero maps accent → theme.visuals.accents[accent] (soft overlay / strong color bg).'
  },
  argTypes: {
    accent: {
      control: 'select',
      options: ['aurora', 'ember', 'monolith', 'neutral']
    }
  }
}`,...(I=(G=l.parameters)==null?void 0:G.docs)==null?void 0:I.source}}};export{l as AccentPresets,c as BlurVariants,s as CustomColorExample,n as GifBackground,i as HeavyExample,o as ImageBackground,t as StructuredHero,a as VideoBackground,ce as __namedExportsOrder,ie as default};
