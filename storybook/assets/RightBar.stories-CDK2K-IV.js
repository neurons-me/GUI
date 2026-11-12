import{j as g}from"./iframe-D0caXraM.js";import{L as m}from"./Layout-BCtHq1Ou.js";import"./preload-helper-Dp1pzeXC.js";import"./LeftSidebarContext-B_lKXPeO.js";import"./TopBar-C__p-e2G.js";import"./Icon-QhGitz5d.js";import"./Menu-Cb6wxuKw.js";import"./useSlot-Cy0-9XXJ.js";import"./useForkRef-XNQZmqk0.js";import"./Grow-DLLXf6dE.js";import"./TransitionGroupContext-yoRJhQyt.js";import"./isHostComponent-DVu5iVWx.js";import"./Paper-Bk81HPwT.js";import"./List-Be7TWYSF.js";import"./MenuItem-DcITh2LE.js";import"./ButtonBase-Dn4a5hRT.js";import"./listItemIconClasses-DgbM6iS2.js";import"./listItemTextClasses-Dj5q713R.js";import"./dividerClasses-C69-NOzd.js";import"./useGuiMediaQuery-DIj0O0SY.js";import"./getThemeProps-DYfa67Lg.js";import"./useInsets-CiiXh2hL.js";import"./Avatar-DA2IiRv7.js";import"./createSvgIcon-TkOxIDkm.js";import"./AppBar-CCGMmm9R.js";import"./Toolbar-PZ12EgUX.js";import"./Switch-C-3H6IVI.js";import"./useFormControl-CvrkDGak.js";import"./Button-CXS3QqkH.js";import"./Button-5KcQE1lk.js";import"./CircularProgress-9BrVdoMo.js";import"./Paper-xXEET6BR.js";import"./Tooltip-DuFS0zf6.js";import"./Tooltip-iopH_C2q.js";import"./useLeftSidebar-DOBe_gaq.js";import"./Collapse-Dx5oIooG.js";import"./IconButton-C-DjN5NB.js";import"./Gauge-LzSFGwAb.js";import"./IconButton-3QKTNDRF.js";import"./Avatar-DpCE2P7T.js";import"./TextField-CBETVBGe.js";import"./isMuiElement-Bc5q4xEL.js";import"./Drawer-niTC23G5.js";import"./Progress-CCXLkOfw.js";import"./ListItemIcon-BDBP-lji.js";import"./ListItemText-BwbMCl6y.js";import"./guiNodeId-DVQruk1C.js";import"./AppBar-BPK1UGLw.js";import"./StickyOptionsTop-qYwiVun8.js";const ni={title:"Getting Started/Layout/RightBar",component:m,tags:["autodocs"],parameters:{docs:{description:{component:`The **RightBar** is the right navigation bar.

## What it expects
- \`elements\`: main items shown in the sidebar.
- \`footerElements\`: optional items shown at the bottom.
- \`initialView\`: \`rail\` or \`expanded\`.
- \`header\`: optional title or icon shown at the top.

## Item types
- \`link\`: navigation item.
- \`menu\`: item with nested options.
- \`action\`: clickable action.

## Basic shape
~~~tsx
<RightBar
  initialView="rail"
  header={{ title: 'Inspector', icon: 'insights' }}
  elements={[
    { type: 'link', props: { label: 'Notifications', icon: 'notifications' } },
    {
      type: 'menu',
      props: {
        label: 'Views',
        icon: 'view_cozy',
        items: [
          { label: 'Timeline', icon: 'timeline' },
        ],
      },
    },
  ]}
  footerElements={[
    { type: 'link', props: { label: 'Settings', icon: 'settings' } },
    { type: 'action', props: { label: 'Help', icon: 'help' } },
  ]}
/>
~~~

## Views
- \`rail\`: compact icon view.
- \`expanded\`: full view with labels.
`}}}},l=c=>g.jsx(m,{...c}),i=l.bind({});i.args={RightBar:{initialView:"rail",header:{title:"Inspector",icon:"insights",iconColor:"var(--gui-primary)"},elements:[{type:"link",props:{label:"Notifications",icon:"notifications",iconColor:"var(--gui-warning)"}},{type:"link",props:{label:"Activity",icon:"history",iconColor:"var(--gui-secondary)"}},{type:"menu",props:{label:"Views",icon:"view_cozy",iconColor:"var(--gui-primary)",items:[{label:"Timeline",icon:"timeline",iconColor:"var(--gui-success)"},{label:"JSON",icon:"code",iconColor:"var(--gui-info)"}]}}],footerElements:[{type:"link",props:{label:"Settings",icon:"settings",iconColor:"var(--gui-primary)"}},{type:"action",props:{label:"Help",icon:"help",iconColor:"var(--gui-success)"}}]}};const t=l.bind({});var o;t.args={RightBar:{...(o=i.args)!=null&&o.RightBar&&typeof i.args.RightBar=="object"?i.args.RightBar:{},initialView:"expanded"}};var e,r,a;i.parameters={...i.parameters,docs:{...(e=i.parameters)==null?void 0:e.docs,source:{originalSource:"args => <Layout {...args} />",...(a=(r=i.parameters)==null?void 0:r.docs)==null?void 0:a.source}}};var p,s,n;t.parameters={...t.parameters,docs:{...(p=t.parameters)==null?void 0:p.docs,source:{originalSource:"args => <Layout {...args} />",...(n=(s=t.parameters)==null?void 0:s.docs)==null?void 0:n.source}}};const mi=["RailView","ExpandedView"];export{t as ExpandedView,i as RailView,mi as __namedExportsOrder,ni as default};
