import{j as g}from"./iframe-9xs7r-yC.js";import{L as m}from"./Layout-QLLA4hI-.js";import"./preload-helper-Dp1pzeXC.js";import"./LeftSidebarContext-BrhIWWPt.js";import"./TopBar-Do5biIaO.js";import"./Icon-Coo2vCLK.js";import"./Menu-DcUO-yQz.js";import"./useSlot-Pi2X4fgs.js";import"./resolveComponentProps-Cy9ikCBM.js";import"./useForkRef-CY5C0zUu.js";import"./useSlotProps-CEMoFeCz.js";import"./isHostComponent-DVu5iVWx.js";import"./Paper-BQJEQDIX.js";import"./Grow-CkmZyC82.js";import"./TransitionGroupContext-Ddsw9Vt9.js";import"./mergeSlotProps-DRRQWfkx.js";import"./List-QlunaKS6.js";import"./MenuItem-BkjhmDcg.js";import"./ButtonBase-CmaSafY6.js";import"./listItemIconClasses-Cdc3Z4Nj.js";import"./listItemTextClasses-BzoRJwRN.js";import"./dividerClasses-D5nEUdl6.js";import"./getThemeProps-CazJCMyU.js";import"./useInsets-22zt3sYs.js";import"./Avatar-CHOZ5ucK.js";import"./createSvgIcon-ApOObPh6.js";import"./AppBar-DPKQgtSA.js";import"./Toolbar-DWHH-c6u.js";import"./Button-BZ2a02w5.js";import"./Button-2IZqaMH4.js";import"./CircularProgress-Cc9H9qAL.js";import"./Paper-D3ZYW61L.js";import"./Tooltip-lv5D5rZR.js";import"./Tooltip-DsQxmgoN.js";import"./useControlled-CR8NUisP.js";import"./Collapse-odiP-9li.js";import"./IconButton-2EQKHUpt.js";import"./Hero-DtS3rAl9.js";import"./Gauge-b94eazVZ.js";import"./IconButton-BTVRcgHZ.js";import"./Avatar-CYaJ7BCk.js";import"./TextField-MYNk8PjL.js";import"./useFormControl-Daq17cxB.js";import"./isMuiElement-FUZCUFHm.js";import"./Drawer-cqwrOwxl.js";import"./Progress-BGC2gmP_.js";import"./ListItemIcon-B7hmZwSO.js";import"./ListItemText-CYWXZB3q.js";import"./guiNodeId-DJ3aagPX.js";import"./AppBar-Dmb1gXWb.js";import"./StickyOptionsTop-kiA05J4G.js";const li={title:"Getting Started/Layout/RightBar",component:m,tags:["autodocs"],parameters:{docs:{description:{component:`The **RightBar** is the right navigation bar.

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
`}}}},l=c=>g.jsx(m,{...c}),i=l.bind({});i.args={RightBar:{initialView:"rail",header:{title:"Inspector",icon:"insights",iconColor:"var(--gui-primary)"},elements:[{type:"link",props:{label:"Notifications",icon:"notifications",iconColor:"var(--gui-warning)"}},{type:"link",props:{label:"Activity",icon:"history",iconColor:"var(--gui-secondary)"}},{type:"menu",props:{label:"Views",icon:"view_cozy",iconColor:"var(--gui-primary)",items:[{label:"Timeline",icon:"timeline",iconColor:"var(--gui-success)"},{label:"JSON",icon:"code",iconColor:"var(--gui-info)"}]}}],footerElements:[{type:"link",props:{label:"Settings",icon:"settings",iconColor:"var(--gui-primary)"}},{type:"action",props:{label:"Help",icon:"help",iconColor:"var(--gui-success)"}}]}};const t=l.bind({});var o;t.args={RightBar:{...(o=i.args)!=null&&o.RightBar&&typeof i.args.RightBar=="object"?i.args.RightBar:{},initialView:"expanded"}};var e,r,a;i.parameters={...i.parameters,docs:{...(e=i.parameters)==null?void 0:e.docs,source:{originalSource:"args => <Layout {...args} />",...(a=(r=i.parameters)==null?void 0:r.docs)==null?void 0:a.source}}};var p,s,n;t.parameters={...t.parameters,docs:{...(p=t.parameters)==null?void 0:p.docs,source:{originalSource:"args => <Layout {...args} />",...(n=(s=t.parameters)==null?void 0:s.docs)==null?void 0:n.source}}};const ci=["RailView","ExpandedView"];export{t as ExpandedView,i as RailView,ci as __namedExportsOrder,li as default};
