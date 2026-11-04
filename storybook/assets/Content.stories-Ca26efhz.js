import{j as n,B as h,a as d}from"./iframe-jME6TRyu.js";import{L as m}from"./Layout-Btydy1op.js";import"./preload-helper-Dp1pzeXC.js";import"./LeftSidebarContext-0nKdfSJy.js";import"./TopBar-B1alHL9F.js";import"./Icon-BtaMh9kU.js";import"./Menu-L0v-vIF4.js";import"./useSlot-C61ruhcO.js";import"./resolveComponentProps-BQXnF4aQ.js";import"./useForkRef-z1e785Ns.js";import"./useSlotProps-BeRtKzOs.js";import"./isHostComponent-DVu5iVWx.js";import"./Paper-Ndu2Ngkb.js";import"./Grow-CX1iIK_S.js";import"./TransitionGroupContext-BRZCH32N.js";import"./mergeSlotProps-Dul5GYdh.js";import"./List-PPc6luvu.js";import"./MenuItem-c5vDCIh9.js";import"./ButtonBase-BOSaDjG-.js";import"./listItemIconClasses-Drtk4guX.js";import"./listItemTextClasses-BTSdieEv.js";import"./dividerClasses-C2APwgbx.js";import"./getThemeProps-DE7h1-OS.js";import"./useInsets-CKXJqeOA.js";import"./Avatar-DUU9vCmx.js";import"./createSvgIcon-jWV4H6K5.js";import"./AppBar-BxWGBjFT.js";import"./Toolbar-DdnHZP3c.js";import"./Button-ffxJjIdt.js";import"./Button-CLDQrykt.js";import"./CircularProgress-DVHqJ1WQ.js";import"./Paper-D0AE__Fu.js";import"./Tooltip-B6C2EAF_.js";import"./Tooltip-Bce4NUBE.js";import"./useControlled-Cu8K_Z2u.js";import"./Collapse-BL-D4z3B.js";import"./IconButton-CwIzlmuT.js";import"./Gauge-D4KJyjrU.js";import"./IconButton-DRNOYwhc.js";import"./Avatar-CMm04gBo.js";import"./TextField-BFarGitF.js";import"./useFormControl-D8HjSUmZ.js";import"./isMuiElement-DBbgm_fz.js";import"./Drawer-BTZ0yApO.js";import"./Progress-C5lx_x92.js";import"./ListItemIcon-o5ylfJzT.js";import"./ListItemText-CvGTrX3g.js";import"./guiNodeId-BzEceGv0.js";import"./AppBar-DqPSf1ZM.js";import"./StickyOptionsTop-0ltDjcW1.js";const ct={title:"Getting Started/Layout/Content",component:m,parameters:{layout:"fullscreen",docs:{description:{component:`The **Content** area is the main space of the layout.

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
}`,...(l=(s=e.parameters)==null?void 0:s.docs)==null?void 0:l.source}}};const ht=["NoBars","FullShell"];export{e as FullShell,t as NoBars,ht as __namedExportsOrder,ct as default};
