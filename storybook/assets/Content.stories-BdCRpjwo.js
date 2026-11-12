import{j as n,B as d,T as h}from"./iframe-D0caXraM.js";import{L as m}from"./Layout-BCtHq1Ou.js";import"./preload-helper-Dp1pzeXC.js";import"./LeftSidebarContext-B_lKXPeO.js";import"./TopBar-C__p-e2G.js";import"./Icon-QhGitz5d.js";import"./Menu-Cb6wxuKw.js";import"./useSlot-Cy0-9XXJ.js";import"./useForkRef-XNQZmqk0.js";import"./Grow-DLLXf6dE.js";import"./TransitionGroupContext-yoRJhQyt.js";import"./isHostComponent-DVu5iVWx.js";import"./Paper-Bk81HPwT.js";import"./List-Be7TWYSF.js";import"./MenuItem-DcITh2LE.js";import"./ButtonBase-Dn4a5hRT.js";import"./listItemIconClasses-DgbM6iS2.js";import"./listItemTextClasses-Dj5q713R.js";import"./dividerClasses-C69-NOzd.js";import"./useGuiMediaQuery-DIj0O0SY.js";import"./getThemeProps-DYfa67Lg.js";import"./useInsets-CiiXh2hL.js";import"./Avatar-DA2IiRv7.js";import"./createSvgIcon-TkOxIDkm.js";import"./AppBar-CCGMmm9R.js";import"./Toolbar-PZ12EgUX.js";import"./Switch-C-3H6IVI.js";import"./useFormControl-CvrkDGak.js";import"./Button-CXS3QqkH.js";import"./Button-5KcQE1lk.js";import"./CircularProgress-9BrVdoMo.js";import"./Paper-xXEET6BR.js";import"./Tooltip-DuFS0zf6.js";import"./Tooltip-iopH_C2q.js";import"./useLeftSidebar-DOBe_gaq.js";import"./Collapse-Dx5oIooG.js";import"./IconButton-C-DjN5NB.js";import"./Gauge-LzSFGwAb.js";import"./IconButton-3QKTNDRF.js";import"./Avatar-DpCE2P7T.js";import"./TextField-CBETVBGe.js";import"./isMuiElement-Bc5q4xEL.js";import"./Drawer-niTC23G5.js";import"./Progress-CCXLkOfw.js";import"./ListItemIcon-BDBP-lji.js";import"./ListItemText-BwbMCl6y.js";import"./guiNodeId-DVQruk1C.js";import"./AppBar-BPK1UGLw.js";import"./StickyOptionsTop-qYwiVun8.js";const me={title:"Getting Started/Layout/Content",component:m,parameters:{layout:"fullscreen",docs:{description:{component:`The **Content** area is the main space of the layout.

## What it does
- Shows the main page content.
- Adds padding automatically when bars are present.
- Keeps a shared page column centered on the window (maxWidth, minWidth and height come from \`GUI.window.layout.content\` in the document), so expanding a rail does not stretch the page edge-to-edge.
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
`}}}},u=({text:o})=>n.jsx(d,{sx:{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",bgcolor:"background.default",color:"text.primary"},children:n.jsx(h,{variant:"h4",children:o})}),c=o=>n.jsx(m,{...o,children:n.jsx(u,{text:"This is the Content area"})}),e={render:c,args:{}},t={render:c,args:{TopBar:{title:"Full Layout"},LeftBar:{initialView:"rail",elements:[{type:"link",props:{label:"Dashboard",icon:"dashboard"}},{type:"link",props:{label:"Analytics",icon:"bar_chart"}}],footerElements:[{type:"link",props:{label:"Settings",icon:"settings"}}]},RightBar:{initialView:"expanded",elements:[{type:"link",props:{label:"Activity",icon:"history"}},{type:"menu",props:{label:"Views",icon:"view_cozy",items:[{label:"Timeline",icon:"timeline"}]}}],footerElements:[{type:"action",props:{label:"Help",icon:"help"}}]},Footer:{brandLabel:"neurons.me",position:"static",leftElements:[{type:"link",props:{label:"Docs",href:"/docs"}}],rightElements:[{type:"link",props:{label:"GitHub",href:"https://github.com/neurons-me"}}]}}};var r,i,a;e.parameters={...e.parameters,docs:{...(r=e.parameters)==null?void 0:r.docs,source:{originalSource:`{
  render: Template,
  args: {}
}`,...(a=(i=e.parameters)==null?void 0:i.docs)==null?void 0:a.source}}};var p,s,l;t.parameters={...t.parameters,docs:{...(p=t.parameters)==null?void 0:p.docs,source:{originalSource:`{
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
}`,...(l=(s=t.parameters)==null?void 0:s.docs)==null?void 0:l.source}}};const ce=["NoBars","FullShell"];export{t as FullShell,e as NoBars,ce as __namedExportsOrder,me as default};
