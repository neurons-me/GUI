import{j as g}from"./iframe-Dgz0DvjP.js";import{L as m}from"./Layout-eUWfEUDJ.js";import"./preload-helper-Dp1pzeXC.js";import"./LeftSidebarContext-COW4ZKa6.js";import"./TopBar-B-O3jfYe.js";import"./Icon-zhfCvvEA.js";import"./Menu-D9ienzuU.js";import"./useSlot-CjwkB68v.js";import"./resolveComponentProps-C7RzSJ6V.js";import"./useForkRef-DhiyL1xF.js";import"./useSlotProps-D6FndUWw.js";import"./isHostComponent-DVu5iVWx.js";import"./Paper-DKRGBdYt.js";import"./Grow-D7g5qnif.js";import"./TransitionGroupContext-Bovk2g5c.js";import"./mergeSlotProps-DoPK-Muf.js";import"./useEventCallback-CW9ai8zV.js";import"./List-BZwm0z1v.js";import"./MenuItem-DVYWd6rG.js";import"./ButtonBase-DnPFUmZ4.js";import"./listItemIconClasses-U7MvxmKI.js";import"./listItemTextClasses-CANx9uJI.js";import"./dividerClasses-BXzcgXwe.js";import"./getThemeProps-DPkTTLbc.js";import"./useInsets-Cl1hGTb2.js";import"./Avatar-CRm8ZbT3.js";import"./createSvgIcon-BTgnJVyE.js";import"./AppBar-DeyLG5Ky.js";import"./Toolbar-CvqahxVg.js";import"./Tooltip-Dxz6oaTn.js";import"./Tooltip-B13adE9r.js";import"./useControlled-DSrQ-lxT.js";import"./Collapse-DfTvU6GR.js";import"./IconButton-D_VO_Lm6.js";import"./CircularProgress-CRe5HlWG.js";import"./Gauge-auIj8jG9.js";import"./IconButton-HxKAscSc.js";import"./Avatar-BlQEDC2q.js";import"./TextField-ROcKb43U.js";import"./useFormControl-CTXUw6wt.js";import"./isMuiElement-BIZd4XRc.js";import"./Drawer-YSKRlM1U.js";import"./Button-B3yzBwnB.js";import"./Button-BrwXx0gp.js";import"./Paper-DdBU6wUz.js";import"./Progress-ClTpsf_Z.js";import"./ListItemIcon-Dk9aJ05I.js";import"./ListItemText-DCgrBkAM.js";import"./guiNodeId-Dhpdk8uV.js";import"./AppBar-DPYXXQh5.js";import"./StickyOptionsTop-D26zHUmd.js";const li={title:"Getting Started/Layout/RightBar",component:m,tags:["autodocs"],parameters:{docs:{description:{component:`The **RightBar** is the right navigation bar.

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
