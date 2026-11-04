import{j as n,B as h,a as d}from"./iframe-CWBlVoSh.js";import{L as m}from"./Layout-DpnqdKES.js";import"./preload-helper-Dp1pzeXC.js";import"./LeftSidebarContext-B69LxAcm.js";import"./TopBar-w93Dhc6b.js";import"./Icon-CB0Uj0Aw.js";import"./Menu-BJgpV-l7.js";import"./useSlot-JA-NOEOp.js";import"./resolveComponentProps-DrUC3lMZ.js";import"./useForkRef-q9ZWwCIp.js";import"./useSlotProps-DIYNG2by.js";import"./isHostComponent-DVu5iVWx.js";import"./Paper-B65CqUUw.js";import"./Grow-2bpzgjoW.js";import"./TransitionGroupContext-2-KL0BXO.js";import"./mergeSlotProps-mNPaLQem.js";import"./useEventCallback-JUhf_uGg.js";import"./List-Dd5EG-DP.js";import"./MenuItem-Ckf4fgp6.js";import"./ButtonBase-cYFfhQKG.js";import"./listItemIconClasses-DKVttrA8.js";import"./listItemTextClasses-DK6UpYXz.js";import"./dividerClasses-DZT7m9dR.js";import"./getThemeProps-XfRzqxji.js";import"./useInsets-QIN_82-_.js";import"./Avatar-B3DduiUj.js";import"./createSvgIcon-dmWuGQpH.js";import"./AppBar-CwqavI5n.js";import"./Toolbar-Pf6HJr2z.js";import"./Tooltip-DGbo-tbI.js";import"./Tooltip-C3vnz-2G.js";import"./useControlled-jbbdFfPX.js";import"./Collapse-CMX4Arn6.js";import"./IconButton-C2lrR_jq.js";import"./CircularProgress-Dbrgk4Dj.js";import"./Hero-AGVy1x6L.js";import"./Gauge-BVTw9lhs.js";import"./IconButton-DF0U6SfD.js";import"./Avatar-Dost7fiL.js";import"./TextField-RrvGFqK-.js";import"./useFormControl-DTAOBfdM.js";import"./isMuiElement-DyVPQdzo.js";import"./Drawer-krYI45FA.js";import"./Button-VJenj8r3.js";import"./Button-ZIPNMwuP.js";import"./Paper-wRFBAbAI.js";import"./Progress-DgCHdVis.js";import"./ListItemIcon-BlTIWdXj.js";import"./ListItemText-a3Msk-gG.js";import"./guiNodeId-10r0vfux.js";import"./AppBar-CJxo1YYk.js";import"./StickyOptionsTop-COMakjQ-.js";const dt={title:"Getting Started/Layout/Content",component:m,parameters:{layout:"fullscreen",docs:{description:{component:`The **Content** area is the main space of the layout.

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
`}}}},u=({text:o})=>n.jsx(h,{sx:{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",bgcolor:"background.default",color:"text.primary"},children:n.jsx(d,{variant:"h4",children:o})}),c=o=>n.jsx(m,{...o,children:n.jsx(u,{text:"This is the Content area"})}),t={render:c,args:{}},e={render:c,args:{TopBar:{title:"Full Layout"},LeftBar:{initialView:"rail",elements:[{type:"link",props:{label:"Dashboard",icon:"dashboard"}},{type:"link",props:{label:"Analytics",icon:"bar_chart"}}],footerElements:[{type:"link",props:{label:"Settings",icon:"settings"}}]},RightBar:{initialView:"expanded",elements:[{type:"link",props:{label:"Activity",icon:"history"}},{type:"menu",props:{label:"Views",icon:"view_cozy",items:[{label:"Timeline",icon:"timeline"}]}}],footerElements:[{type:"action",props:{label:"Help",icon:"help"}}]},Footer:{brandLabel:"neurons.me",position:"static",leftElements:[{type:"link",props:{label:"Docs",href:"/docs"}}],rightElements:[{type:"link",props:{label:"GitHub",href:"https://github.com/neurons-me"}}]}}};var r,i,a;t.parameters={...t.parameters,docs:{...(r=t.parameters)==null?void 0:r.docs,source:{originalSource:`{
  render: Template,
  args: {}
}`,...(a=(i=t.parameters)==null?void 0:i.docs)==null?void 0:a.source}}};var p,s,l;e.parameters={...e.parameters,docs:{...(p=e.parameters)==null?void 0:p.docs,source:{originalSource:`{
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
}`,...(l=(s=e.parameters)==null?void 0:s.docs)==null?void 0:l.source}}};const ut=["NoBars","FullShell"];export{e as FullShell,t as NoBars,ut as __namedExportsOrder,dt as default};
