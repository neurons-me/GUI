import{j as g}from"./iframe-CWBlVoSh.js";import{L as m}from"./Layout-DpnqdKES.js";import"./preload-helper-Dp1pzeXC.js";import"./LeftSidebarContext-B69LxAcm.js";import"./TopBar-w93Dhc6b.js";import"./Icon-CB0Uj0Aw.js";import"./Menu-BJgpV-l7.js";import"./useSlot-JA-NOEOp.js";import"./resolveComponentProps-DrUC3lMZ.js";import"./useForkRef-q9ZWwCIp.js";import"./useSlotProps-DIYNG2by.js";import"./isHostComponent-DVu5iVWx.js";import"./Paper-B65CqUUw.js";import"./Grow-2bpzgjoW.js";import"./TransitionGroupContext-2-KL0BXO.js";import"./mergeSlotProps-mNPaLQem.js";import"./useEventCallback-JUhf_uGg.js";import"./List-Dd5EG-DP.js";import"./MenuItem-Ckf4fgp6.js";import"./ButtonBase-cYFfhQKG.js";import"./listItemIconClasses-DKVttrA8.js";import"./listItemTextClasses-DK6UpYXz.js";import"./dividerClasses-DZT7m9dR.js";import"./getThemeProps-XfRzqxji.js";import"./useInsets-QIN_82-_.js";import"./Avatar-B3DduiUj.js";import"./createSvgIcon-dmWuGQpH.js";import"./AppBar-CwqavI5n.js";import"./Toolbar-Pf6HJr2z.js";import"./Tooltip-DGbo-tbI.js";import"./Tooltip-C3vnz-2G.js";import"./useControlled-jbbdFfPX.js";import"./Collapse-CMX4Arn6.js";import"./IconButton-C2lrR_jq.js";import"./CircularProgress-Dbrgk4Dj.js";import"./Hero-AGVy1x6L.js";import"./Gauge-BVTw9lhs.js";import"./IconButton-DF0U6SfD.js";import"./Avatar-Dost7fiL.js";import"./TextField-RrvGFqK-.js";import"./useFormControl-DTAOBfdM.js";import"./isMuiElement-DyVPQdzo.js";import"./Drawer-krYI45FA.js";import"./Button-VJenj8r3.js";import"./Button-ZIPNMwuP.js";import"./Paper-wRFBAbAI.js";import"./Progress-DgCHdVis.js";import"./ListItemIcon-BlTIWdXj.js";import"./ListItemText-a3Msk-gG.js";import"./guiNodeId-10r0vfux.js";import"./AppBar-CJxo1YYk.js";import"./StickyOptionsTop-COMakjQ-.js";const ci={title:"Getting Started/Layout/RightBar",component:m,tags:["autodocs"],parameters:{docs:{description:{component:`The **RightBar** is the right navigation bar.

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
`}}}},l=c=>g.jsx(m,{...c}),i=l.bind({});i.args={RightBar:{initialView:"rail",header:{title:"Inspector",icon:"insights",iconColor:"var(--gui-primary)"},elements:[{type:"link",props:{label:"Notifications",icon:"notifications",iconColor:"var(--gui-warning)"}},{type:"link",props:{label:"Activity",icon:"history",iconColor:"var(--gui-secondary)"}},{type:"menu",props:{label:"Views",icon:"view_cozy",iconColor:"var(--gui-primary)",items:[{label:"Timeline",icon:"timeline",iconColor:"var(--gui-success)"},{label:"JSON",icon:"code",iconColor:"var(--gui-info)"}]}}],footerElements:[{type:"link",props:{label:"Settings",icon:"settings",iconColor:"var(--gui-primary)"}},{type:"action",props:{label:"Help",icon:"help",iconColor:"var(--gui-success)"}}]}};const t=l.bind({});var o;t.args={RightBar:{...(o=i.args)!=null&&o.RightBar&&typeof i.args.RightBar=="object"?i.args.RightBar:{},initialView:"expanded"}};var e,r,a;i.parameters={...i.parameters,docs:{...(e=i.parameters)==null?void 0:e.docs,source:{originalSource:"args => <Layout {...args} />",...(a=(r=i.parameters)==null?void 0:r.docs)==null?void 0:a.source}}};var p,s,n;t.parameters={...t.parameters,docs:{...(p=t.parameters)==null?void 0:p.docs,source:{originalSource:"args => <Layout {...args} />",...(n=(s=t.parameters)==null?void 0:s.docs)==null?void 0:n.source}}};const gi=["RailView","ExpandedView"];export{t as ExpandedView,i as RailView,gi as __namedExportsOrder,ci as default};
