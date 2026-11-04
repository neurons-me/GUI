import{j as V}from"./iframe-jME6TRyu.js";import{L as _}from"./Layout-Btydy1op.js";import"./preload-helper-Dp1pzeXC.js";import"./LeftSidebarContext-0nKdfSJy.js";import"./TopBar-B1alHL9F.js";import"./Icon-BtaMh9kU.js";import"./Menu-L0v-vIF4.js";import"./useSlot-C61ruhcO.js";import"./resolveComponentProps-BQXnF4aQ.js";import"./useForkRef-z1e785Ns.js";import"./useSlotProps-BeRtKzOs.js";import"./isHostComponent-DVu5iVWx.js";import"./Paper-Ndu2Ngkb.js";import"./Grow-CX1iIK_S.js";import"./TransitionGroupContext-BRZCH32N.js";import"./mergeSlotProps-Dul5GYdh.js";import"./List-PPc6luvu.js";import"./MenuItem-c5vDCIh9.js";import"./ButtonBase-BOSaDjG-.js";import"./listItemIconClasses-Drtk4guX.js";import"./listItemTextClasses-BTSdieEv.js";import"./dividerClasses-C2APwgbx.js";import"./getThemeProps-DE7h1-OS.js";import"./useInsets-CKXJqeOA.js";import"./Avatar-DUU9vCmx.js";import"./createSvgIcon-jWV4H6K5.js";import"./AppBar-BxWGBjFT.js";import"./Toolbar-DdnHZP3c.js";import"./Button-ffxJjIdt.js";import"./Button-CLDQrykt.js";import"./CircularProgress-DVHqJ1WQ.js";import"./Paper-D0AE__Fu.js";import"./Tooltip-B6C2EAF_.js";import"./Tooltip-Bce4NUBE.js";import"./useControlled-Cu8K_Z2u.js";import"./Collapse-BL-D4z3B.js";import"./IconButton-CwIzlmuT.js";import"./Gauge-D4KJyjrU.js";import"./IconButton-DRNOYwhc.js";import"./Avatar-CMm04gBo.js";import"./TextField-BFarGitF.js";import"./useFormControl-D8HjSUmZ.js";import"./isMuiElement-DBbgm_fz.js";import"./Drawer-BTZ0yApO.js";import"./Progress-C5lx_x92.js";import"./ListItemIcon-o5ylfJzT.js";import"./ListItemText-CvGTrX3g.js";import"./guiNodeId-BzEceGv0.js";import"./AppBar-DqPSf1ZM.js";import"./StickyOptionsTop-0ltDjcW1.js";const{expect:e,userEvent:G,waitFor:u,within:g}=__STORYBOOK_MODULE_TEST__,We={title:"Getting Started/Layout/LeftBar",component:_,tags:["autodocs"],parameters:{docs:{description:{component:`The **LeftBar** is the left navigation bar.

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
`}}}},b=r=>V.jsx(_,{...r}),a=b.bind({});a.args={LeftBar:{initialView:"rail",header:{title:"Workspace",icon:"apps",iconColor:"var(--gui-primary)"},elements:[{type:"link",props:{label:"Dashboard",icon:"dashboard",iconColor:"var(--gui-primary)"}},{type:"link",props:{label:"Analytics",icon:"bar_chart",iconColor:"var(--gui-secondary)"}},{type:"menu",props:{label:"Projects",icon:"folder",iconColor:"var(--gui-warning)",items:[{label:"Project A",icon:"work",iconColor:"var(--gui-success)"},{label:"Project B",icon:"assignment",iconColor:"var(--gui-info)"}]}}],footerElements:[{type:"link",props:{label:"Settings",icon:"settings",iconColor:"var(--gui-primary)"}},{type:"action",props:{label:"Help",icon:"help",iconColor:"var(--gui-success)"}}]}};const c=b.bind({});var L;c.args={LeftBar:{...(L=a.args)!=null&&L.LeftBar&&typeof a.args.LeftBar=="object"?a.args.LeftBar:{},initialView:"expanded"}};let i=0;const l=b.bind({});var x;l.args={LeftBar:{...(x=a.args)!=null&&x.LeftBar&&typeof a.args.LeftBar=="object"?a.args.LeftBar:{},initialView:"rail",brand:V.jsx("a",{href:"/brand-home","aria-label":"Open the app home",onClick:r=>{r.preventDefault(),i+=1},style:{display:"flex",alignItems:"center",justifyContent:"center",width:"100%",color:"inherit",textDecoration:"none",fontWeight:700},children:"FT"})}};l.play=async({canvasElement:r})=>{const t=g(r),n=G.setup();i=0;const m=await t.findByRole("link",{name:"Open the app home"}),p=await t.findByRole("button",{name:"Expand sidebar"});e(m.contains(p)).toBe(!1);const D=r.querySelector("aside.LeftSidebar").getBoundingClientRect().right,B=p.getBoundingClientRect(),h=r.querySelector("aside.LeftSidebar header").getBoundingClientRect(),o=p.querySelector(".gui-edge-handle").getBoundingClientRect();e(o.width).toBeGreaterThanOrEqual(14),e(o.width).toBeLessThanOrEqual(15.2),e(o.height).toBeGreaterThan(o.width*2),e(o.height).toBeLessThan(h.height),e(B.height).toBeGreaterThanOrEqual(h.height-1),e(B.width).toBeLessThanOrEqual(o.width+2);const y=o.right-D;e(y/o.width).toBeGreaterThanOrEqual(.32),e(y/o.width).toBeLessThanOrEqual(.36);const f=p.querySelector(".gui-edge-handle .material-symbols-rounded").getBoundingClientRect(),s=d=>({x:(d.left+d.right)/2,y:(d.top+d.bottom)/2});e(Math.abs(s(o).y-s(h).y)).toBeLessThanOrEqual(.25),e(Math.abs(s(f).y-s(o).y)).toBeLessThanOrEqual(.25),e(Math.abs(s(f).x-s(o).x)).toBeLessThanOrEqual(.25);const w=document.createRange();w.selectNodeContents(m),e(o.left-w.getBoundingClientRect().right).toBeGreaterThanOrEqual(8),await n.click(m),e(i).toBe(1),e(t.queryByRole("button",{name:"Collapse sidebar"})).toBeNull(),e(t.getByRole("button",{name:"Expand sidebar"})).toHaveAttribute("aria-expanded","false"),await n.click(p),await u(()=>e(t.getByRole("button",{name:"Collapse sidebar"})).toHaveAttribute("aria-expanded","true")),e(i).toBe(1);const R=r.querySelector("aside.LeftSidebar header"),W=t.getByRole("button",{name:"Collapse sidebar"}).querySelector(".gui-edge-handle").getBoundingClientRect(),A=g(R).getByText("Workspace").getBoundingClientRect();e(A.right).toBeLessThanOrEqual(W.left),e(g(R).queryByText("apps")).toBeNull(),await n.click(t.getByRole("link",{name:"Open the app home"})),e(i).toBe(2),e(t.getByRole("button",{name:"Collapse sidebar"})).toBeInTheDocument(),t.getByRole("button",{name:"Collapse sidebar"}).focus(),await n.keyboard("{Enter}"),await u(()=>e(t.getByRole("button",{name:"Expand sidebar"})).toBeInTheDocument()),t.getByRole("button",{name:"Expand sidebar"}).focus(),await n.keyboard(" "),await u(()=>e(t.getByRole("button",{name:"Collapse sidebar"})).toBeInTheDocument()),e(i).toBe(2),t.getByRole("link",{name:"Open the app home"}).focus(),await n.keyboard("{Enter}"),e(i).toBe(3),e(t.getByRole("button",{name:"Collapse sidebar"})).toBeInTheDocument()};var C,T,k;a.parameters={...a.parameters,docs:{...(C=a.parameters)==null?void 0:C.docs,source:{originalSource:"args => <Layout {...args} />",...(k=(T=a.parameters)==null?void 0:T.docs)==null?void 0:k.source}}};var E,O,q;c.parameters={...c.parameters,docs:{...(E=c.parameters)==null?void 0:E.docs,source:{originalSource:"args => <Layout {...args} />",...(q=(O=c.parameters)==null?void 0:O.docs)==null?void 0:q.source}}};var v,S,j;l.parameters={...l.parameters,docs:{...(v=l.parameters)==null?void 0:v.docs,source:{originalSource:"args => <Layout {...args} />",...(j=(S=l.parameters)==null?void 0:S.docs)==null?void 0:j.source}}};const Ae=["RailView","ExpandedView","WithBrand"];export{c as ExpandedView,a as RailView,l as WithBrand,Ae as __namedExportsOrder,We as default};
