import{j as V}from"./iframe-Dgz0DvjP.js";import{L as _}from"./Layout-eUWfEUDJ.js";import"./preload-helper-Dp1pzeXC.js";import"./LeftSidebarContext-COW4ZKa6.js";import"./TopBar-B-O3jfYe.js";import"./Icon-zhfCvvEA.js";import"./Menu-D9ienzuU.js";import"./useSlot-CjwkB68v.js";import"./resolveComponentProps-C7RzSJ6V.js";import"./useForkRef-DhiyL1xF.js";import"./useSlotProps-D6FndUWw.js";import"./isHostComponent-DVu5iVWx.js";import"./Paper-DKRGBdYt.js";import"./Grow-D7g5qnif.js";import"./TransitionGroupContext-Bovk2g5c.js";import"./mergeSlotProps-DoPK-Muf.js";import"./useEventCallback-CW9ai8zV.js";import"./List-BZwm0z1v.js";import"./MenuItem-DVYWd6rG.js";import"./ButtonBase-DnPFUmZ4.js";import"./listItemIconClasses-U7MvxmKI.js";import"./listItemTextClasses-CANx9uJI.js";import"./dividerClasses-BXzcgXwe.js";import"./getThemeProps-DPkTTLbc.js";import"./useInsets-Cl1hGTb2.js";import"./Avatar-CRm8ZbT3.js";import"./createSvgIcon-BTgnJVyE.js";import"./AppBar-DeyLG5Ky.js";import"./Toolbar-CvqahxVg.js";import"./Tooltip-Dxz6oaTn.js";import"./Tooltip-B13adE9r.js";import"./useControlled-DSrQ-lxT.js";import"./Collapse-DfTvU6GR.js";import"./IconButton-D_VO_Lm6.js";import"./CircularProgress-CRe5HlWG.js";import"./Gauge-auIj8jG9.js";import"./IconButton-HxKAscSc.js";import"./Avatar-BlQEDC2q.js";import"./TextField-ROcKb43U.js";import"./useFormControl-CTXUw6wt.js";import"./isMuiElement-BIZd4XRc.js";import"./Drawer-YSKRlM1U.js";import"./Button-B3yzBwnB.js";import"./Button-BrwXx0gp.js";import"./Paper-DdBU6wUz.js";import"./Progress-ClTpsf_Z.js";import"./ListItemIcon-Dk9aJ05I.js";import"./ListItemText-DCgrBkAM.js";import"./guiNodeId-Dhpdk8uV.js";import"./AppBar-DPYXXQh5.js";import"./StickyOptionsTop-D26zHUmd.js";const{expect:e,userEvent:G,waitFor:u,within:g}=__STORYBOOK_MODULE_TEST__,Ae={title:"Getting Started/Layout/LeftBar",component:_,tags:["autodocs"],parameters:{docs:{description:{component:`The **LeftBar** is the left navigation bar.

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
