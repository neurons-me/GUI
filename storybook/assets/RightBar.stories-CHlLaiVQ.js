import{j as g}from"./iframe-q72FflWy.js";import{L as m}from"./Layout-BMKIslM6.js";import"./preload-helper-Dp1pzeXC.js";import"./LeftSidebarContext-DOlSL4Mw.js";import"./TopBar-D4C-tPuB.js";import"./Icon-Doq3uhPc.js";import"./Menu-DFKCKfQm.js";import"./useSlot-B3Bhjpe0.js";import"./resolveComponentProps-zf7BDQ8X.js";import"./useForkRef-BR9zNRBO.js";import"./useSlotProps-DMFXOslT.js";import"./isHostComponent-DVu5iVWx.js";import"./Paper-C4cHEfmg.js";import"./Grow-C-rRNj8l.js";import"./TransitionGroupContext-4zVEsxkP.js";import"./mergeSlotProps-BtuGLXbb.js";import"./useEventCallback-BVb6jHPB.js";import"./List-DvvFCGIp.js";import"./MenuItem-D5DHuw3h.js";import"./ButtonBase-D2HnvhjV.js";import"./listItemIconClasses-C8gmQhu6.js";import"./listItemTextClasses-_6ucLlDF.js";import"./dividerClasses-BXru1jN1.js";import"./useGuiMediaQuery-BQeqdqN6.js";import"./getThemeProps-BMrl9x_3.js";import"./useInsets-BdHRW95k.js";import"./Avatar-kFT77iM6.js";import"./createSvgIcon-DOR6FtI1.js";import"./AppBar-o6rXye4L.js";import"./Toolbar-s_6dNoIJ.js";import"./Paper-9gdP3SeZ.js";import"./Tooltip-DrESC3lI.js";import"./useControlled-DIH1o2g4.js";import"./Collapse-sdA7RzmD.js";import"./IconButton-0qTeMK6V.js";import"./CircularProgress-BunsQ8Ul.js";import"./Dialog-o0j-FRf2.js";import"./Hero-BdzYVYxS.js";import"./Modal-XMQC5YcF.js";import"./IconButton-D9uKbFdE.js";import"./SearchField-Dr-GPthT.js";import"./Button-DuvGvkXy.js";import"./Button-BpF6GA05.js";import"./Drawer-DMbbDWRX.js";import"./useFormControl-BGm5bEiu.js";import"./Progress-CA1Hm4aa.js";import"./Avatar-iGO_2OcD.js";import"./TextField-BSNRPa5x.js";import"./isMuiElement-CKqkPfIO.js";import"./List-BSzaOevu.js";import"./ListItem-XTYGYKJx.js";import"./ListItemText-BjbJ233h.js";import"./ListItemButton-kBcRpM-O.js";import"./ListItemIcon-lKzEdP8D.js";import"./Menu-103suS3X.js";import"./MenuItem-COpnAg9l.js";import"./Stack-DHvmwf16.js";import"./Gauge-DyVYa28g.js";import"./guiNodeId-D05pr1LX.js";import"./AppBar-Cw3w4B11.js";import"./StickyOptionsTop-CZ31mdWb.js";const fi={title:"Getting Started/Layout/RightBar",component:m,tags:["autodocs"],parameters:{docs:{description:{component:`The **RightBar** is the right navigation bar.

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
`}}}},l=c=>g.jsx(m,{...c}),i=l.bind({});i.args={RightBar:{initialView:"rail",header:{title:"Inspector",icon:"insights",iconColor:"var(--gui-primary)"},elements:[{type:"link",props:{label:"Notifications",icon:"notifications",iconColor:"var(--gui-warning)"}},{type:"link",props:{label:"Activity",icon:"history",iconColor:"var(--gui-secondary)"}},{type:"menu",props:{label:"Views",icon:"view_cozy",iconColor:"var(--gui-primary)",items:[{label:"Timeline",icon:"timeline",iconColor:"var(--gui-success)"},{label:"JSON",icon:"code",iconColor:"var(--gui-info)"}]}}],footerElements:[{type:"link",props:{label:"Settings",icon:"settings",iconColor:"var(--gui-primary)"}},{type:"action",props:{label:"Help",icon:"help",iconColor:"var(--gui-success)"}}]}};const t=l.bind({});var o;t.args={RightBar:{...(o=i.args)!=null&&o.RightBar&&typeof i.args.RightBar=="object"?i.args.RightBar:{},initialView:"expanded"}};const xi=["RailView","ExpandedView"];var r,e,p;i.parameters={...i.parameters,docs:{...(r=i.parameters)==null?void 0:r.docs,source:{originalSource:"args => <Layout {...args} />",...(p=(e=i.parameters)==null?void 0:e.docs)==null?void 0:p.source}}};var a,s,n;t.parameters={...t.parameters,docs:{...(a=t.parameters)==null?void 0:a.docs,source:{originalSource:"args => <Layout {...args} />",...(n=(s=t.parameters)==null?void 0:s.docs)==null?void 0:n.source}}};export{t as ExpandedView,i as RailView,xi as __namedExportsOrder,fi as default};
