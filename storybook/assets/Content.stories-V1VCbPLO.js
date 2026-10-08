import{j as o,B as h,b as d}from"./iframe-q72FflWy.js";import{L as m}from"./Layout-BMKIslM6.js";import"./preload-helper-Dp1pzeXC.js";import"./LeftSidebarContext-DOlSL4Mw.js";import"./TopBar-D4C-tPuB.js";import"./Icon-Doq3uhPc.js";import"./Menu-DFKCKfQm.js";import"./useSlot-B3Bhjpe0.js";import"./resolveComponentProps-zf7BDQ8X.js";import"./useForkRef-BR9zNRBO.js";import"./useSlotProps-DMFXOslT.js";import"./isHostComponent-DVu5iVWx.js";import"./Paper-C4cHEfmg.js";import"./Grow-C-rRNj8l.js";import"./TransitionGroupContext-4zVEsxkP.js";import"./mergeSlotProps-BtuGLXbb.js";import"./useEventCallback-BVb6jHPB.js";import"./List-DvvFCGIp.js";import"./MenuItem-D5DHuw3h.js";import"./ButtonBase-D2HnvhjV.js";import"./listItemIconClasses-C8gmQhu6.js";import"./listItemTextClasses-_6ucLlDF.js";import"./dividerClasses-BXru1jN1.js";import"./useGuiMediaQuery-BQeqdqN6.js";import"./getThemeProps-BMrl9x_3.js";import"./useInsets-BdHRW95k.js";import"./Avatar-kFT77iM6.js";import"./createSvgIcon-DOR6FtI1.js";import"./AppBar-o6rXye4L.js";import"./Toolbar-s_6dNoIJ.js";import"./Paper-9gdP3SeZ.js";import"./Tooltip-DrESC3lI.js";import"./useControlled-DIH1o2g4.js";import"./Collapse-sdA7RzmD.js";import"./IconButton-0qTeMK6V.js";import"./CircularProgress-BunsQ8Ul.js";import"./Dialog-o0j-FRf2.js";import"./Hero-BdzYVYxS.js";import"./Modal-XMQC5YcF.js";import"./IconButton-D9uKbFdE.js";import"./SearchField-Dr-GPthT.js";import"./Button-DuvGvkXy.js";import"./Button-BpF6GA05.js";import"./Drawer-DMbbDWRX.js";import"./useFormControl-BGm5bEiu.js";import"./Progress-CA1Hm4aa.js";import"./Avatar-iGO_2OcD.js";import"./TextField-BSNRPa5x.js";import"./isMuiElement-CKqkPfIO.js";import"./List-BSzaOevu.js";import"./ListItem-XTYGYKJx.js";import"./ListItemText-BjbJ233h.js";import"./ListItemButton-kBcRpM-O.js";import"./ListItemIcon-lKzEdP8D.js";import"./Menu-103suS3X.js";import"./MenuItem-COpnAg9l.js";import"./Stack-DHvmwf16.js";import"./Gauge-DyVYa28g.js";import"./guiNodeId-D05pr1LX.js";import"./AppBar-Cw3w4B11.js";import"./StickyOptionsTop-CZ31mdWb.js";const kt={title:"Getting Started/Layout/Content",component:m,parameters:{layout:"fullscreen",docs:{description:{component:`The **Content** area is the main space of the layout.

## What it does
- Shows the main page content.
- Adds padding automatically when bars are present.
- Works with \`TopBar\`, \`LeftBar\`, \`RightBar\`, and \`Footer\`.

## What to pass
- Put your page UI inside \`<Layout>...</Layout>\`.
- Turn bars on by passing \`TopBar\`, \`LeftBar\`, \`RightBar\`, and \`Footer\` props.
- If you pass no bars, Content fills the page by itself.

## Basic shape
~~~tsx
<Layout>
  <YourPage />
</Layout>
~~~

## With bars
~~~tsx
<Layout
  TopBar={{ title: 'App' }}
  LeftBar={{ initialView: 'rail' }}
  RightBar={{ initialView: 'expanded' }}
  Footer={{ brandLabel: 'neurons.me' }}
>
  <YourPage />
</Layout>
~~~
`}}}},u=({text:n})=>o.jsx(h,{sx:{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",bgcolor:"background.default",color:"text.primary"},children:o.jsx(d,{variant:"h4",children:n})}),c=n=>o.jsx(m,{...n,children:o.jsx(u,{text:"This is the Content area"})}),t={render:c,args:{}},e={render:c,args:{TopBar:{title:"Full Layout"},LeftBar:{initialView:"rail",elements:[{type:"link",props:{label:"Dashboard",icon:"dashboard"}},{type:"link",props:{label:"Analytics",icon:"bar_chart"}}],footerElements:[{type:"link",props:{label:"Settings",icon:"settings"}}]},RightBar:{initialView:"expanded",elements:[{type:"link",props:{label:"Activity",icon:"history"}},{type:"menu",props:{label:"Views",icon:"view_cozy",items:[{label:"Timeline",icon:"timeline"}]}}],footerElements:[{type:"action",props:{label:"Help",icon:"help"}}]},Footer:{brandLabel:"neurons.me",position:"static",leftElements:[{type:"link",props:{label:"Docs",href:"/docs"}}],rightElements:[{type:"link",props:{label:"GitHub",href:"https://github.com/neurons-me"}}]}}},Tt=["NoBars","FullShell"];var r,i,p;t.parameters={...t.parameters,docs:{...(r=t.parameters)==null?void 0:r.docs,source:{originalSource:`{
  render: Template,
  args: {}
}`,...(p=(i=t.parameters)==null?void 0:i.docs)==null?void 0:p.source}}};var a,s,l;e.parameters={...e.parameters,docs:{...(a=e.parameters)==null?void 0:a.docs,source:{originalSource:`{
  render: Template,
  args: {
    TopBar: {
      title: 'Full Layout'
    },
    LeftBar: {
      initialView: 'rail',
      elements: [{
        type: 'link',
        props: {
          label: 'Dashboard',
          icon: 'dashboard'
        }
      }, {
        type: 'link',
        props: {
          label: 'Analytics',
          icon: 'bar_chart'
        }
      }],
      footerElements: [{
        type: 'link',
        props: {
          label: 'Settings',
          icon: 'settings'
        }
      }]
    },
    RightBar: {
      initialView: 'expanded',
      elements: [{
        type: 'link',
        props: {
          label: 'Activity',
          icon: 'history'
        }
      }, {
        type: 'menu',
        props: {
          label: 'Views',
          icon: 'view_cozy',
          items: [{
            label: 'Timeline',
            icon: 'timeline'
          }]
        }
      }],
      footerElements: [{
        type: 'action',
        props: {
          label: 'Help',
          icon: 'help'
        }
      }]
    },
    Footer: {
      brandLabel: 'neurons.me',
      position: 'static',
      leftElements: [{
        type: 'link',
        props: {
          label: 'Docs',
          href: '/docs'
        }
      }],
      rightElements: [{
        type: 'link',
        props: {
          label: 'GitHub',
          href: 'https://github.com/neurons-me'
        }
      }]
    }
  }
}`,...(l=(s=e.parameters)==null?void 0:s.docs)==null?void 0:l.source}}};export{e as FullShell,t as NoBars,Tt as __namedExportsOrder,kt as default};
