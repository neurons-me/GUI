import{j as e,r as o,h as L,B as a,T as r,u as k,M}from"./iframe-Dgz0DvjP.js";import{R as W}from"./Router-D1BGIWip.js";import{B as b}from"./Button-B3yzBwnB.js";import{P as l}from"./Paper-DdBU6wUz.js";import{P as x}from"./Gauge-auIj8jG9.js";import"./ListItemIcon-Dk9aJ05I.js";import"./ListItemText-DCgrBkAM.js";import"./Drawer-YSKRlM1U.js";import{S as _}from"./Stack-CPORitL0.js";import{u as I}from"./useDeferredPending-BuPjoZnS.js";import"./preload-helper-Dp1pzeXC.js";import"./Icon-zhfCvvEA.js";import"./Button-BrwXx0gp.js";import"./ButtonBase-DnPFUmZ4.js";import"./TransitionGroupContext-Bovk2g5c.js";import"./useForkRef-DhiyL1xF.js";import"./useEventCallback-CW9ai8zV.js";import"./CircularProgress-CRe5HlWG.js";import"./Paper-DKRGBdYt.js";import"./IconButton-HxKAscSc.js";import"./IconButton-D_VO_Lm6.js";import"./Avatar-BlQEDC2q.js";import"./Avatar-CRm8ZbT3.js";import"./createSvgIcon-BTgnJVyE.js";import"./useSlot-CjwkB68v.js";import"./resolveComponentProps-C7RzSJ6V.js";import"./TextField-ROcKb43U.js";import"./useFormControl-CTXUw6wt.js";import"./isHostComponent-DVu5iVWx.js";import"./Menu-D9ienzuU.js";import"./useSlotProps-D6FndUWw.js";import"./Grow-D7g5qnif.js";import"./mergeSlotProps-DoPK-Muf.js";import"./List-BZwm0z1v.js";import"./useControlled-DSrQ-lxT.js";import"./isMuiElement-BIZd4XRc.js";import"./Progress-ClTpsf_Z.js";import"./Toolbar-CvqahxVg.js";import"./listItemIconClasses-U7MvxmKI.js";import"./listItemTextClasses-CANx9uJI.js";import"./dividerClasses-BXzcgXwe.js";import"./getThemeProps-DPkTTLbc.js";function S(i,n){return new Promise((u,t)=>{const m=window.setTimeout(()=>{h(),u()},i),c=()=>{window.clearTimeout(m),h(),t(new DOMException("Aborted","AbortError"))},h=()=>{n==null||n.removeEventListener("abort",c)};if(n!=null&&n.aborted){c();return}n==null||n.addEventListener("abort",c,{once:!0})})}const U=120,B=140;function R(){return e.jsxs(x,{padding:3,children:[e.jsx(r,{variant:"h4",children:"Dashboard"}),e.jsx(r,{variant:"body2",sx:{opacity:.78,mt:.5},children:"Fast route. Good baseline before navigating into async screens."}),e.jsxs(l,{sx:{p:2,borderRadius:2,mt:2},children:[e.jsx(r,{variant:"body1",children:"Current status"}),e.jsx(r,{variant:"body2",sx:{opacity:.8},children:"Ready"})]})]})}function $(i){return e.jsxs(x,{padding:3,children:[e.jsx(r,{variant:"h4",children:`Shop ${i}`}),e.jsx(r,{variant:"body2",sx:{opacity:.78,mt:.5},children:`Async route resolved for id=${i}`}),e.jsxs(l,{sx:{p:2,borderRadius:2,mt:2},children:[e.jsx(r,{variant:"body1",children:`Loaded record ${i}`}),e.jsx(r,{variant:"body2",sx:{opacity:.8},children:"This route simulates a delayed factory before returning the final screen."})]})]})}function H(i){return e.jsxs(x,{padding:3,children:[e.jsx(r,{variant:"h4",children:"Docs"}),e.jsx(r,{variant:"body2",sx:{opacity:.78,mt:.5},children:`Wildcard section=${i}`}),e.jsxs(l,{sx:{p:2,borderRadius:2,mt:2},children:[e.jsx(r,{variant:"body1",children:`Showing ${i}`}),e.jsx(r,{variant:"body2",sx:{opacity:.8},children:"Wildcards are useful for docs trees, explorers, and nested knowledge spaces."})]})]})}function K(i){return e.jsxs(x,{padding:3,children:[e.jsx(r,{variant:"h4",children:"Loading next route..."}),e.jsx(r,{variant:"body2",sx:{opacity:.78,mt:.5},children:`Preparing ${i}`}),e.jsxs(l,{sx:{p:2,borderRadius:2,mt:2,borderStyle:"dashed",borderWidth:1,borderColor:"divider"},children:[e.jsx(r,{variant:"body1",children:"Pending shell"}),e.jsx(r,{variant:"body2",sx:{opacity:.8},children:"Use this pattern when you want the route transition itself to communicate loading."})]})]})}function T({mode:i,title:n,subtitle:u}){const t=o.useMemo(()=>new W({useHistory:!1}),[]),[m,c]=o.useState("/dashboard"),[h,y]=o.useState(()=>R()),[j,f]=o.useState(null),{isRunning:E,showLoader:p,run:v,cancel:w}=I({threshold:180,onCancelPrevious:"abort"});o.useEffect(()=>{t.set("/dashboard",()=>R()),t.set("/shops/:id",async({ctx:s})=>$(s.params.id)),t.set("/docs/*",async({ctx:s})=>H(s.wildcard||"index"));const d=t.onChange((s,A)=>{y(s),c(A.path)});return t.navigate("/dashboard",{push:!1}),()=>{d(),w(),t.destroy()}},[w,t]),o.useEffect(()=>{i==="swap"&&p&&j&&y(K(j))},[i,j,p]);const g=o.useCallback(async d=>{f(d),await v(async({signal:s})=>(d.startsWith("/shops/")?await S(U,s):d.startsWith("/docs/")&&await S(B,s),t.navigate(d,{push:!1}))),f(null)},[t,v]);return e.jsx(L,{initialThemeId:"neurons.me",initialMode:"dark",children:e.jsxs(a,{sx:{p:3,display:"grid",gap:2},children:[e.jsxs(a,{children:[e.jsx(r,{sx:{fontSize:20,fontWeight:800},children:n}),e.jsx(r,{sx:{opacity:.8,mt:.5},children:u})]}),e.jsxs(_,{direction:{xs:"column",md:"row"},spacing:1.5,children:[e.jsx(b,{variant:"contained",onClick:()=>void g("/dashboard"),children:"Dashboard"}),e.jsx(b,{variant:"outlined",onClick:()=>void g("/shops/42"),children:"Async Param Route"}),e.jsx(b,{variant:"outlined",onClick:()=>void g("/docs/getting-started"),children:"Async Wildcard Route"})]}),e.jsxs(l,{sx:{p:2},children:[e.jsxs(r,{variant:"body2",sx:{opacity:.78},children:["Current path: ",e.jsx(a,{component:"span",sx:{fontFamily:"monospace"},children:m})]}),e.jsx(r,{variant:"body2",sx:{opacity:.78,mt:.75},children:i==="overlay"?"Recipe: keep the previous screen visible while the next route resolves.":"Recipe: replace the current screen with a pending shell before the async route finishes."}),e.jsxs(r,{variant:"body2",sx:{opacity:.68,mt:.75},children:["Transition state: ",E?p?"showing loader":"waiting below threshold":"idle"]})]}),e.jsxs(a,{sx:{position:"relative",minHeight:320,borderRadius:2,overflow:"hidden",border:"1px solid",borderColor:"divider",backgroundColor:"background.default"},children:[e.jsx(a,{sx:{minHeight:320},children:h}),p&&i==="overlay"&&e.jsx(a,{sx:{position:"absolute",inset:0,display:"grid",placeItems:"center",bgcolor:"rgba(12,14,18,0.32)",backdropFilter:"blur(6px)"},children:e.jsxs(l,{sx:{px:2,py:1.5,borderRadius:2},children:[e.jsx(r,{sx:{fontWeight:700},children:"Loading next route..."}),e.jsx(r,{variant:"body2",sx:{opacity:.78},children:"Suspense-like overlay while the previous page stays mounted."})]})})]})]})})}function C(){return e.jsx(T,{mode:"overlay",title:"Recipe 1: Keep Previous Screen Visible",subtitle:"Use this when the old screen still provides context and you want loading to feel light."})}function D(){return e.jsx(T,{mode:"swap",title:"Recipe 2: Swap To Pending Shell",subtitle:"Use this when route transitions should feel explicit, like entering a new workspace or document."})}C.__docgenInfo={description:"",methods:[],displayName:"KeepPreviousScreenVisibleDemo"};D.__docgenInfo={description:"",methods:[],displayName:"SwapToPendingShellDemo"};function P(i){const n={code:"code",h1:"h1",h2:"h2",hr:"hr",li:"li",ol:"ol",p:"p",pre:"pre",strong:"strong",ul:"ul",...k(),...i.components};return e.jsxs(e.Fragment,{children:[e.jsx(M,{title:"Router/Examples & Recipes"}),`
`,e.jsx(n.h1,{id:"examples--recipes",children:"Examples & Recipes"}),`
`,e.jsx(n.p,{children:"This page focuses on practical combinations."}),`
`,e.jsx(n.p,{children:`Here the goal is not to explain every API from first principles, but to show
how pieces work together in patterns you can reuse.`}),`
`,e.jsx(n.hr,{}),`
`,e.jsx(n.h2,{id:"router--loading-states",children:"Router + Loading States"}),`
`,e.jsxs(n.p,{children:["Async route factories are supported by ",e.jsx(n.code,{children:"Router"}),`.
That means route transitions can behave a bit like Suspense, as long as you decide
what the user should see while the next spec is resolving.`]}),`
`,e.jsx(n.p,{children:"There are two strong patterns:"}),`
`,e.jsxs(n.ol,{children:[`
`,e.jsx(n.li,{children:"Keep the previous screen visible and place a loading overlay on top"}),`
`,e.jsx(n.li,{children:"Swap immediately to a pending shell and then replace it with the final route"}),`
`]}),`
`,e.jsx(n.hr,{}),`
`,e.jsx(n.h2,{id:"recipe-1-keep-previous-screen-visible",children:"Recipe 1: Keep Previous Screen Visible"}),`
`,e.jsx(n.p,{children:"Use this when the current screen still helps the user stay oriented."}),`
`,e.jsxs(n.ul,{children:[`
`,e.jsx(n.li,{children:"good for dashboards"}),`
`,e.jsx(n.li,{children:"good for detail panels"}),`
`,e.jsx(n.li,{children:"good when the next route is only a small contextual jump"}),`
`]}),`
`,e.jsx(C,{}),`
`,e.jsx(n.p,{children:"Why this works:"}),`
`,e.jsxs(n.ul,{children:[`
`,e.jsx(n.li,{children:"the app feels responsive immediately"}),`
`,e.jsx(n.li,{children:"the user keeps context"}),`
`,e.jsx(n.li,{children:"loading becomes a lightweight state, not a hard interruption"}),`
`]}),`
`,e.jsx(n.hr,{}),`
`,e.jsx(n.h2,{id:"recipe-2-swap-to-pending-shell",children:"Recipe 2: Swap To Pending Shell"}),`
`,e.jsx(n.p,{children:"Use this when navigation should feel explicit and staged."}),`
`,e.jsxs(n.ul,{children:[`
`,e.jsx(n.li,{children:"good for docs spaces"}),`
`,e.jsx(n.li,{children:"good for editors"}),`
`,e.jsx(n.li,{children:"good for routes that represent a whole new working surface"}),`
`]}),`
`,e.jsx(D,{}),`
`,e.jsx(n.p,{children:"Why this works:"}),`
`,e.jsxs(n.ul,{children:[`
`,e.jsx(n.li,{children:"the transition feels intentional"}),`
`,e.jsx(n.li,{children:"the loading state belongs to the new route, not the old one"}),`
`,e.jsx(n.li,{children:"it communicates “we are entering a new screen”"}),`
`]}),`
`,e.jsx(n.hr,{}),`
`,e.jsx(n.h2,{id:"minimal-wiring-pattern",children:"Minimal Wiring Pattern"}),`
`,e.jsx(n.p,{children:"Both recipes are variations of the same idea:"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-ts",children:`const router = new Router({ runtime });

router.onChange((spec, meta) => {
  GUI.mount(spec, '#root', {
    runtime,
    ctx: meta.ctx,
  });
});
`})}),`
`,e.jsxs(n.p,{children:["The only difference is what you render ",e.jsx(n.strong,{children:"before"})," the async route finishes."]}),`
`,e.jsx(n.hr,{}),`
`,e.jsx(n.h2,{id:"choosing-the-pattern",children:"Choosing The Pattern"}),`
`,e.jsx(a,{sx:{p:2,my:3,bgcolor:"action.hover",borderRadius:1.5,borderLeft:"4px solid",borderColor:"primary.main"},children:e.jsxs(n.p,{children:[e.jsx("strong",{children:"Rule of thumb"}),e.jsx("br",{}),`
If the previous screen still helps orientation, keep it and overlay loading.
If the next route is a full context switch, render a pending shell immediately.`]})}),`
`,e.jsx(n.hr,{}),`
`,e.jsx(n.h2,{id:"what-to-build-next",children:"What To Build Next"}),`
`,e.jsx(n.p,{children:"Natural follow-ups:"}),`
`,e.jsxs(n.ol,{children:[`
`,e.jsx(n.li,{children:"Add route-level error states next to loading states"}),`
`,e.jsxs(n.li,{children:["Add optimistic params-based transitions (",e.jsx(n.code,{children:"/shops/41"})," -> ",e.jsx(n.code,{children:"/shops/42"}),`)
Since `,e.jsx(n.code,{children:"this.GUI"})," is a runtime, you can render a skeleton using only ",e.jsx(n.code,{children:"ctx.params"}),`
before the full data resolves.`]}),`
`,e.jsxs(n.li,{children:["Add prefetching with ",e.jsx(n.code,{children:"resolve()"})," before calling ",e.jsx(n.code,{children:"navigate()"})]}),`
`]})]})}function Ee(i={}){const{wrapper:n}={...k(),...i.components};return n?e.jsx(n,{...i,children:e.jsx(P,{...i})}):P(i)}export{Ee as default};
