import{j as V}from"./iframe-CWBlVoSh.js";import{L as _}from"./Layout-DpnqdKES.js";import"./preload-helper-Dp1pzeXC.js";import"./LeftSidebarContext-B69LxAcm.js";import"./TopBar-w93Dhc6b.js";import"./Icon-CB0Uj0Aw.js";import"./Menu-BJgpV-l7.js";import"./useSlot-JA-NOEOp.js";import"./resolveComponentProps-DrUC3lMZ.js";import"./useForkRef-q9ZWwCIp.js";import"./useSlotProps-DIYNG2by.js";import"./isHostComponent-DVu5iVWx.js";import"./Paper-B65CqUUw.js";import"./Grow-2bpzgjoW.js";import"./TransitionGroupContext-2-KL0BXO.js";import"./mergeSlotProps-mNPaLQem.js";import"./useEventCallback-JUhf_uGg.js";import"./List-Dd5EG-DP.js";import"./MenuItem-Ckf4fgp6.js";import"./ButtonBase-cYFfhQKG.js";import"./listItemIconClasses-DKVttrA8.js";import"./listItemTextClasses-DK6UpYXz.js";import"./dividerClasses-DZT7m9dR.js";import"./getThemeProps-XfRzqxji.js";import"./useInsets-QIN_82-_.js";import"./Avatar-B3DduiUj.js";import"./createSvgIcon-dmWuGQpH.js";import"./AppBar-CwqavI5n.js";import"./Toolbar-Pf6HJr2z.js";import"./Tooltip-DGbo-tbI.js";import"./Tooltip-C3vnz-2G.js";import"./useControlled-jbbdFfPX.js";import"./Collapse-CMX4Arn6.js";import"./IconButton-C2lrR_jq.js";import"./CircularProgress-Dbrgk4Dj.js";import"./Hero-AGVy1x6L.js";import"./Gauge-BVTw9lhs.js";import"./IconButton-DF0U6SfD.js";import"./Avatar-Dost7fiL.js";import"./TextField-RrvGFqK-.js";import"./useFormControl-DTAOBfdM.js";import"./isMuiElement-DyVPQdzo.js";import"./Drawer-krYI45FA.js";import"./Button-VJenj8r3.js";import"./Button-ZIPNMwuP.js";import"./Paper-wRFBAbAI.js";import"./Progress-DgCHdVis.js";import"./ListItemIcon-BlTIWdXj.js";import"./ListItemText-a3Msk-gG.js";import"./guiNodeId-10r0vfux.js";import"./AppBar-CJxo1YYk.js";import"./StickyOptionsTop-COMakjQ-.js";const{expect:e,userEvent:G,waitFor:u,within:g}=__STORYBOOK_MODULE_TEST__,Ge={title:"Getting Started/Layout/LeftBar",component:_,tags:["autodocs"],parameters:{docs:{description:{component:`The **LeftBar** is the left navigation bar.

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
`}}}},b=r=>V.jsx(_,{...r}),a=b.bind({});a.args={LeftBar:{initialView:"rail",header:{title:"Workspace",icon:"apps",iconColor:"var(--gui-primary)"},elements:[{type:"link",props:{label:"Dashboard",icon:"dashboard",iconColor:"var(--gui-primary)"}},{type:"link",props:{label:"Analytics",icon:"bar_chart",iconColor:"var(--gui-secondary)"}},{type:"menu",props:{label:"Projects",icon:"folder",iconColor:"var(--gui-warning)",items:[{label:"Project A",icon:"work",iconColor:"var(--gui-success)"},{label:"Project B",icon:"assignment",iconColor:"var(--gui-info)"}]}}],footerElements:[{type:"link",props:{label:"Settings",icon:"settings",iconColor:"var(--gui-primary)"}},{type:"action",props:{label:"Help",icon:"help",iconColor:"var(--gui-success)"}}]}};const c=b.bind({});var L;c.args={LeftBar:{...(L=a.args)!=null&&L.LeftBar&&typeof a.args.LeftBar=="object"?a.args.LeftBar:{},initialView:"expanded"}};let i=0;const l=b.bind({});var x;l.args={LeftBar:{...(x=a.args)!=null&&x.LeftBar&&typeof a.args.LeftBar=="object"?a.args.LeftBar:{},initialView:"rail",brand:V.jsx("a",{href:"/brand-home","aria-label":"Open the app home",onClick:r=>{r.preventDefault(),i+=1},style:{display:"flex",alignItems:"center",justifyContent:"center",width:"100%",color:"inherit",textDecoration:"none",fontWeight:700},children:"FT"})}};l.play=async({canvasElement:r})=>{const t=g(r),n=G.setup();i=0;const m=await t.findByRole("link",{name:"Open the app home"}),p=await t.findByRole("button",{name:"Expand sidebar"});e(m.contains(p)).toBe(!1);const D=r.querySelector("aside.LeftSidebar").getBoundingClientRect().right,B=p.getBoundingClientRect(),h=r.querySelector("aside.LeftSidebar header").getBoundingClientRect(),o=p.querySelector(".gui-edge-handle").getBoundingClientRect();e(o.width).toBeGreaterThanOrEqual(14),e(o.width).toBeLessThanOrEqual(15.2),e(o.height).toBeGreaterThan(o.width*2),e(o.height).toBeLessThan(h.height),e(B.height).toBeGreaterThanOrEqual(h.height-1),e(B.width).toBeLessThanOrEqual(o.width+2);const y=o.right-D;e(y/o.width).toBeGreaterThanOrEqual(.32),e(y/o.width).toBeLessThanOrEqual(.36);const f=p.querySelector(".gui-edge-handle .material-symbols-rounded").getBoundingClientRect(),s=d=>({x:(d.left+d.right)/2,y:(d.top+d.bottom)/2});e(Math.abs(s(o).y-s(h).y)).toBeLessThanOrEqual(.25),e(Math.abs(s(f).y-s(o).y)).toBeLessThanOrEqual(.25),e(Math.abs(s(f).x-s(o).x)).toBeLessThanOrEqual(.25);const w=document.createRange();w.selectNodeContents(m),e(o.left-w.getBoundingClientRect().right).toBeGreaterThanOrEqual(8),await n.click(m),e(i).toBe(1),e(t.queryByRole("button",{name:"Collapse sidebar"})).toBeNull(),e(t.getByRole("button",{name:"Expand sidebar"})).toHaveAttribute("aria-expanded","false"),await n.click(p),await u(()=>e(t.getByRole("button",{name:"Collapse sidebar"})).toHaveAttribute("aria-expanded","true")),e(i).toBe(1);const R=r.querySelector("aside.LeftSidebar header"),W=t.getByRole("button",{name:"Collapse sidebar"}).querySelector(".gui-edge-handle").getBoundingClientRect(),A=g(R).getByText("Workspace").getBoundingClientRect();e(A.right).toBeLessThanOrEqual(W.left),e(g(R).queryByText("apps")).toBeNull(),await n.click(t.getByRole("link",{name:"Open the app home"})),e(i).toBe(2),e(t.getByRole("button",{name:"Collapse sidebar"})).toBeInTheDocument(),t.getByRole("button",{name:"Collapse sidebar"}).focus(),await n.keyboard("{Enter}"),await u(()=>e(t.getByRole("button",{name:"Expand sidebar"})).toBeInTheDocument()),t.getByRole("button",{name:"Expand sidebar"}).focus(),await n.keyboard(" "),await u(()=>e(t.getByRole("button",{name:"Collapse sidebar"})).toBeInTheDocument()),e(i).toBe(2),t.getByRole("link",{name:"Open the app home"}).focus(),await n.keyboard("{Enter}"),e(i).toBe(3),e(t.getByRole("button",{name:"Collapse sidebar"})).toBeInTheDocument()};var C,T,k;a.parameters={...a.parameters,docs:{...(C=a.parameters)==null?void 0:C.docs,source:{originalSource:"args => <Layout {...args} />",...(k=(T=a.parameters)==null?void 0:T.docs)==null?void 0:k.source}}};var E,O,q;c.parameters={...c.parameters,docs:{...(E=c.parameters)==null?void 0:E.docs,source:{originalSource:"args => <Layout {...args} />",...(q=(O=c.parameters)==null?void 0:O.docs)==null?void 0:q.source}}};var v,S,j;l.parameters={...l.parameters,docs:{...(v=l.parameters)==null?void 0:v.docs,source:{originalSource:"args => <Layout {...args} />",...(j=(S=l.parameters)==null?void 0:S.docs)==null?void 0:j.source}}};const Ie=["RailView","ExpandedView","WithBrand"];export{c as ExpandedView,a as RailView,l as WithBrand,Ie as __namedExportsOrder,Ge as default};
