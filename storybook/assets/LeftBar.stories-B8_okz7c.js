import{j as V}from"./iframe-9xs7r-yC.js";import{L as _}from"./Layout-QLLA4hI-.js";import"./preload-helper-Dp1pzeXC.js";import"./LeftSidebarContext-BrhIWWPt.js";import"./TopBar-Do5biIaO.js";import"./Icon-Coo2vCLK.js";import"./Menu-DcUO-yQz.js";import"./useSlot-Pi2X4fgs.js";import"./resolveComponentProps-Cy9ikCBM.js";import"./useForkRef-CY5C0zUu.js";import"./useSlotProps-CEMoFeCz.js";import"./isHostComponent-DVu5iVWx.js";import"./Paper-BQJEQDIX.js";import"./Grow-CkmZyC82.js";import"./TransitionGroupContext-Ddsw9Vt9.js";import"./mergeSlotProps-DRRQWfkx.js";import"./List-QlunaKS6.js";import"./MenuItem-BkjhmDcg.js";import"./ButtonBase-CmaSafY6.js";import"./listItemIconClasses-Cdc3Z4Nj.js";import"./listItemTextClasses-BzoRJwRN.js";import"./dividerClasses-D5nEUdl6.js";import"./getThemeProps-CazJCMyU.js";import"./useInsets-22zt3sYs.js";import"./Avatar-CHOZ5ucK.js";import"./createSvgIcon-ApOObPh6.js";import"./AppBar-DPKQgtSA.js";import"./Toolbar-DWHH-c6u.js";import"./Button-BZ2a02w5.js";import"./Button-2IZqaMH4.js";import"./CircularProgress-Cc9H9qAL.js";import"./Paper-D3ZYW61L.js";import"./Tooltip-lv5D5rZR.js";import"./Tooltip-DsQxmgoN.js";import"./useControlled-CR8NUisP.js";import"./Collapse-odiP-9li.js";import"./IconButton-2EQKHUpt.js";import"./Hero-DtS3rAl9.js";import"./Gauge-b94eazVZ.js";import"./IconButton-BTVRcgHZ.js";import"./Avatar-CYaJ7BCk.js";import"./TextField-MYNk8PjL.js";import"./useFormControl-Daq17cxB.js";import"./isMuiElement-FUZCUFHm.js";import"./Drawer-cqwrOwxl.js";import"./Progress-BGC2gmP_.js";import"./ListItemIcon-B7hmZwSO.js";import"./ListItemText-CYWXZB3q.js";import"./guiNodeId-DJ3aagPX.js";import"./AppBar-Dmb1gXWb.js";import"./StickyOptionsTop-kiA05J4G.js";const{expect:e,userEvent:G,waitFor:u,within:g}=__STORYBOOK_MODULE_TEST__,Ae={title:"Getting Started/Layout/LeftBar",component:_,tags:["autodocs"],parameters:{docs:{description:{component:`The **LeftBar** is the left navigation bar.

## What it expects
- \`elements\`: main items shown in the sidebar.
- \`footerElements\`: optional items shown at the bottom.
- \`initialView\`: \`rail\` or \`expanded\`.
- \`header\`: optional title or icon shown at the top.
- \`brand\`: the app's mark (a logo, a QR) leading the header. Wrap it in a link and it navigates; it never expands the bar.

## Item types
- \`link\`: navigation item.
- \`menu\`: item with nested options.
- \`action\`: clickable action.

## Basic shape
~~~tsx
<LeftBar
  initialView="rail"
  header={{ title: 'Workspace', icon: 'apps' }}
  elements={[
    { type: 'link', props: { label: 'Dashboard', icon: 'dashboard' } },
    {
      type: 'menu',
      props: {
        label: 'Projects',
        icon: 'folder',
        items: [
          { label: 'Project A', icon: 'work' },
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
`}}}},b=r=>V.jsx(_,{...r}),a=b.bind({});a.args={LeftBar:{initialView:"rail",header:{title:"Workspace",icon:"apps",iconColor:"var(--gui-primary)"},elements:[{type:"link",props:{label:"Dashboard",icon:"dashboard",iconColor:"var(--gui-primary)"}},{type:"link",props:{label:"Analytics",icon:"bar_chart",iconColor:"var(--gui-secondary)"}},{type:"menu",props:{label:"Projects",icon:"folder",iconColor:"var(--gui-warning)",items:[{label:"Project A",icon:"work",iconColor:"var(--gui-success)"},{label:"Project B",icon:"assignment",iconColor:"var(--gui-info)"}]}}],footerElements:[{type:"link",props:{label:"Settings",icon:"settings",iconColor:"var(--gui-primary)"}},{type:"action",props:{label:"Help",icon:"help",iconColor:"var(--gui-success)"}}]}};const c=b.bind({});var L;c.args={LeftBar:{...(L=a.args)!=null&&L.LeftBar&&typeof a.args.LeftBar=="object"?a.args.LeftBar:{},initialView:"expanded"}};let i=0;const l=b.bind({});var x;l.args={LeftBar:{...(x=a.args)!=null&&x.LeftBar&&typeof a.args.LeftBar=="object"?a.args.LeftBar:{},initialView:"rail",brand:V.jsx("a",{href:"/brand-home","aria-label":"Open the app home",onClick:r=>{r.preventDefault(),i+=1},style:{display:"flex",alignItems:"center",justifyContent:"center",width:"100%",color:"inherit",textDecoration:"none",fontWeight:700},children:"FT"})}};l.play=async({canvasElement:r})=>{const t=g(r),n=G.setup();i=0;const m=await t.findByRole("link",{name:"Open the app home"}),p=await t.findByRole("button",{name:"Expand sidebar"});e(m.contains(p)).toBe(!1);const D=r.querySelector("aside.LeftSidebar").getBoundingClientRect().right,B=p.getBoundingClientRect(),h=r.querySelector("aside.LeftSidebar header").getBoundingClientRect(),o=p.querySelector(".gui-edge-handle").getBoundingClientRect();e(o.width).toBeGreaterThanOrEqual(14),e(o.width).toBeLessThanOrEqual(15.2),e(o.height).toBeGreaterThan(o.width*2),e(o.height).toBeLessThan(h.height),e(B.height).toBeGreaterThanOrEqual(h.height-1),e(B.width).toBeLessThanOrEqual(o.width+2);const y=o.right-D;e(y/o.width).toBeGreaterThanOrEqual(.32),e(y/o.width).toBeLessThanOrEqual(.36);const f=p.querySelector(".gui-edge-handle .material-symbols-rounded").getBoundingClientRect(),s=d=>({x:(d.left+d.right)/2,y:(d.top+d.bottom)/2});e(Math.abs(s(o).y-s(h).y)).toBeLessThanOrEqual(.25),e(Math.abs(s(f).y-s(o).y)).toBeLessThanOrEqual(.25),e(Math.abs(s(f).x-s(o).x)).toBeLessThanOrEqual(.25);const w=document.createRange();w.selectNodeContents(m),e(o.left-w.getBoundingClientRect().right).toBeGreaterThanOrEqual(8),await n.click(m),e(i).toBe(1),e(t.queryByRole("button",{name:"Collapse sidebar"})).toBeNull(),e(t.getByRole("button",{name:"Expand sidebar"})).toHaveAttribute("aria-expanded","false"),await n.click(p),await u(()=>e(t.getByRole("button",{name:"Collapse sidebar"})).toHaveAttribute("aria-expanded","true")),e(i).toBe(1);const R=r.querySelector("aside.LeftSidebar header"),W=t.getByRole("button",{name:"Collapse sidebar"}).querySelector(".gui-edge-handle").getBoundingClientRect(),A=g(R).getByText("Workspace").getBoundingClientRect();e(A.right).toBeLessThanOrEqual(W.left),e(g(R).queryByText("apps")).toBeNull(),await n.click(t.getByRole("link",{name:"Open the app home"})),e(i).toBe(2),e(t.getByRole("button",{name:"Collapse sidebar"})).toBeInTheDocument(),t.getByRole("button",{name:"Collapse sidebar"}).focus(),await n.keyboard("{Enter}"),await u(()=>e(t.getByRole("button",{name:"Expand sidebar"})).toBeInTheDocument()),t.getByRole("button",{name:"Expand sidebar"}).focus(),await n.keyboard(" "),await u(()=>e(t.getByRole("button",{name:"Collapse sidebar"})).toBeInTheDocument()),e(i).toBe(2),t.getByRole("link",{name:"Open the app home"}).focus(),await n.keyboard("{Enter}"),e(i).toBe(3),e(t.getByRole("button",{name:"Collapse sidebar"})).toBeInTheDocument()};var C,T,k;a.parameters={...a.parameters,docs:{...(C=a.parameters)==null?void 0:C.docs,source:{originalSource:"args => <Layout {...args} />",...(k=(T=a.parameters)==null?void 0:T.docs)==null?void 0:k.source}}};var E,O,q;c.parameters={...c.parameters,docs:{...(E=c.parameters)==null?void 0:E.docs,source:{originalSource:"args => <Layout {...args} />",...(q=(O=c.parameters)==null?void 0:O.docs)==null?void 0:q.source}}};var v,S,j;l.parameters={...l.parameters,docs:{...(v=l.parameters)==null?void 0:v.docs,source:{originalSource:"args => <Layout {...args} />",...(j=(S=l.parameters)==null?void 0:S.docs)==null?void 0:j.source}}};const Ge=["RailView","ExpandedView","WithBrand"];export{c as ExpandedView,a as RailView,l as WithBrand,Ge as __namedExportsOrder,Ae as default};
