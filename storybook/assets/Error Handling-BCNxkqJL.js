import{j as e,r as s,h as N,B as l,T as t,u as D,M as O}from"./iframe-Dgz0DvjP.js";import{R as $}from"./Router-D1BGIWip.js";import{B as j}from"./Button-B3yzBwnB.js";import{P as h}from"./Paper-DdBU6wUz.js";import{P as m}from"./Gauge-auIj8jG9.js";import"./ListItemIcon-Dk9aJ05I.js";import"./ListItemText-DCgrBkAM.js";import"./Drawer-YSKRlM1U.js";import{S as B}from"./Stack-CPORitL0.js";import{u as K}from"./useDeferredPending-BuPjoZnS.js";import"./preload-helper-Dp1pzeXC.js";import"./Icon-zhfCvvEA.js";import"./Button-BrwXx0gp.js";import"./ButtonBase-DnPFUmZ4.js";import"./TransitionGroupContext-Bovk2g5c.js";import"./useForkRef-DhiyL1xF.js";import"./useEventCallback-CW9ai8zV.js";import"./CircularProgress-CRe5HlWG.js";import"./Paper-DKRGBdYt.js";import"./IconButton-HxKAscSc.js";import"./IconButton-D_VO_Lm6.js";import"./Avatar-BlQEDC2q.js";import"./Avatar-CRm8ZbT3.js";import"./createSvgIcon-BTgnJVyE.js";import"./useSlot-CjwkB68v.js";import"./resolveComponentProps-C7RzSJ6V.js";import"./TextField-ROcKb43U.js";import"./useFormControl-CTXUw6wt.js";import"./isHostComponent-DVu5iVWx.js";import"./Menu-D9ienzuU.js";import"./useSlotProps-D6FndUWw.js";import"./Grow-D7g5qnif.js";import"./mergeSlotProps-DoPK-Muf.js";import"./List-BZwm0z1v.js";import"./useControlled-DSrQ-lxT.js";import"./isMuiElement-BIZd4XRc.js";import"./Progress-ClTpsf_Z.js";import"./Toolbar-CvqahxVg.js";import"./listItemIconClasses-U7MvxmKI.js";import"./listItemTextClasses-CANx9uJI.js";import"./dividerClasses-BXzcgXwe.js";import"./getThemeProps-DPkTTLbc.js";function W(n,r){return new Promise((f,i)=>{const y=window.setTimeout(()=>{p(),f()},n),o=()=>{window.clearTimeout(y),p(),i(new DOMException("Aborted","AbortError"))},p=()=>{r==null||r.removeEventListener("abort",o)};if(r!=null&&r.aborted){o();return}r==null||r.addEventListener("abort",o,{once:!0})})}function k(){return e.jsxs(m,{padding:3,children:[e.jsx(t,{variant:"h4",children:"Dashboard"}),e.jsx(t,{variant:"body2",sx:{opacity:.78,mt:.5},children:"Stable home screen used as the fallback context."}),e.jsxs(h,{sx:{p:2,borderRadius:2,mt:2},children:[e.jsx(t,{variant:"body1",children:"Everything is healthy"}),e.jsx(t,{variant:"body2",sx:{opacity:.8},children:"Use this screen to test failed route transitions."})]})]})}function A(){return e.jsxs(m,{padding:3,children:[e.jsx(t,{variant:"h4",children:"Reports"}),e.jsx(t,{variant:"body2",sx:{opacity:.78,mt:.5},children:"The route resolved successfully."}),e.jsxs(h,{sx:{p:2,borderRadius:2,mt:2},children:[e.jsx(t,{variant:"body1",children:"Loaded latest report data"}),e.jsx(t,{variant:"body2",sx:{opacity:.8},children:"This is the successful version of the async route."})]})]})}function X(n){return e.jsxs(m,{padding:3,children:[e.jsx(t,{variant:"h4",children:"Loading route..."}),e.jsx(t,{variant:"body2",sx:{opacity:.78,mt:.5},children:`Preparing ${n}`}),e.jsxs(h,{sx:{p:2,borderRadius:2,mt:2,borderStyle:"dashed",borderWidth:1,borderColor:"divider"},children:[e.jsx(t,{variant:"body1",children:"Pending shell"}),e.jsx(t,{variant:"body2",sx:{opacity:.8},children:"The route transition is still in flight."})]})]})}function I(n,r){return e.jsxs(h,{sx:{p:2,borderRadius:2,mt:2,border:"1px solid",borderColor:"error.main"},children:[e.jsx(t,{variant:"body1",sx:{color:"error.main",fontWeight:700},children:"Route failed"}),e.jsx(t,{variant:"body2",sx:{opacity:.82,mt:.5},children:n}),r&&e.jsx(j,{sx:{mt:2},variant:"outlined",color:"error",onClick:r,children:"Retry"})]})}function P(n,r){return e.jsxs(m,{padding:3,children:[e.jsx(t,{variant:"h4",children:"Route failed"}),e.jsx(t,{variant:"body2",sx:{opacity:.78,mt:.5},children:"The next route could not be resolved."}),I(n,r)]})}function v({mode:n,title:r,subtitle:f}){const i=s.useMemo(()=>new $({useHistory:!1,notFound:(a,d)=>P(d instanceof Error?d.message:"Unknown route failure")}),[]),[y,o]=s.useState(()=>k()),[p,U]=s.useState("/dashboard"),[g,w]=s.useState(null),[b,R]=s.useState(null),{isRunning:_,showLoader:x,run:T,cancel:E}=K({threshold:180,onCancelPrevious:"abort"});s.useEffect(()=>{i.set("/dashboard",()=>k()),i.set("/reports",()=>A());const a=i.onChange((d,c)=>{o(d),U(c.path)});return i.navigate("/dashboard",{push:!1}),()=>{a(),E(),i.destroy()}},[E,i]),s.useEffect(()=>{n==="swap"&&x&&b&&o(X(b))},[n,b,x]);const u=s.useCallback(async(a,d)=>{R(a),w(null);try{await T(async({signal:c})=>{if(await W(240,c),d)throw new Error("The reports service is temporarily unavailable.");return i.navigate(a,{push:!1})})}catch(c){const S=c instanceof Error?c.message:"Unknown route failure";w(S),n==="swap"&&o(P(S,()=>void u(a,!1)))}finally{R(null)}},[n,i,T]),H=x&&n!=="swap";return e.jsx(N,{initialThemeId:"neurons.me",initialMode:"dark",children:e.jsxs(l,{sx:{p:3,display:"grid",gap:2},children:[e.jsxs(l,{children:[e.jsx(t,{sx:{fontSize:20,fontWeight:800},children:r}),e.jsx(t,{sx:{opacity:.8,mt:.5},children:f})]}),e.jsxs(B,{direction:{xs:"column",md:"row"},spacing:1.5,children:[e.jsx(j,{variant:"contained",onClick:()=>void u("/dashboard",!1),children:"Dashboard"}),e.jsx(j,{variant:"outlined",color:"success",onClick:()=>void u("/reports",!1),children:"Success Route"}),e.jsx(j,{variant:"outlined",color:"error",onClick:()=>void u("/reports",!0),children:"Fail Route"})]}),e.jsxs(h,{sx:{p:2},children:[e.jsxs(t,{variant:"body2",sx:{opacity:.78},children:["Current path: ",e.jsx(l,{component:"span",sx:{fontFamily:"monospace"},children:p})]}),e.jsx(t,{variant:"body2",sx:{opacity:.78,mt:.75},children:n==="keep"?"Recipe: preserve the previous screen and attach an error panel if the next route fails.":n==="swap"?"Recipe: move into a pending shell and then swap into an error shell if resolution fails.":"Recipe: show an inline error with a retry button that retries the same route."}),e.jsxs(t,{variant:"body2",sx:{opacity:.68,mt:.75},children:["Transition state: ",_?x?"showing loader":"waiting below threshold":"idle"]})]}),e.jsxs(l,{sx:{position:"relative",minHeight:320,borderRadius:2,overflow:"hidden",border:"1px solid",borderColor:"divider",backgroundColor:"background.default"},children:[e.jsxs(l,{sx:{minHeight:320},children:[y,g&&n!=="swap"&&I(g,n==="retry"?()=>void u("/reports",!1):void 0)]}),H&&e.jsx(l,{sx:{position:"absolute",inset:0,display:"grid",placeItems:"center",bgcolor:"rgba(12,14,18,0.32)",backdropFilter:"blur(6px)"},children:e.jsxs(h,{sx:{px:2,py:1.5,borderRadius:2},children:[e.jsx(t,{sx:{fontWeight:700},children:"Resolving route..."}),e.jsx(t,{variant:"body2",sx:{opacity:.78},children:"The transition is still in flight."})]})})]})]})})}function F(){return e.jsx(v,{mode:"keep",title:"Recipe 1: Keep Previous Screen On Error",subtitle:"When the next route fails, preserve the current screen and surface the failure locally."})}function L(){return e.jsx(v,{mode:"swap",title:"Recipe 2: Swap To Error Shell",subtitle:"Use this when the route itself owns the error state and deserves a full-screen failure shell."})}function M(){return e.jsx(v,{mode:"retry",title:"Recipe 3: Retry Failed Route",subtitle:"Inline retry works well when the user should stay anchored to the current screen."})}F.__docgenInfo={description:"",methods:[],displayName:"KeepPreviousScreenOnErrorDemo"};L.__docgenInfo={description:"",methods:[],displayName:"SwapToErrorShellDemo"};M.__docgenInfo={description:"",methods:[],displayName:"RetryFailedRouteDemo"};function C(n){const r={code:"code",h1:"h1",h2:"h2",h3:"h3",hr:"hr",li:"li",ol:"ol",p:"p",pre:"pre",ul:"ul",...D(),...n.components};return e.jsxs(e.Fragment,{children:[e.jsx(O,{title:"Router/Error Handling"}),`
`,e.jsx(r.h1,{id:"error-handling",children:"Error Handling"}),`
`,e.jsxs(r.p,{children:["Error handling in ",e.jsx(r.code,{children:"this.GUI"})," has three layers:"]}),`
`,e.jsxs(r.ol,{children:[`
`,e.jsx(r.li,{children:"the boundary where routes resolve"}),`
`,e.jsx(r.li,{children:"the experience of async transitions"}),`
`,e.jsx(r.li,{children:"the content layer where runtime expressions and actions can fail"}),`
`]}),`
`,e.jsx(r.hr,{}),`
`,e.jsx(r.h2,{id:"layer-1-the-boundary-router",children:"Layer 1: The Boundary (Router)"}),`
`,e.jsx(r.p,{children:"The Router should absorb route failures without collapsing the whole app."}),`
`,e.jsx(r.p,{children:"That means documenting two things clearly:"}),`
`,e.jsxs(r.ul,{children:[`
`,e.jsxs(r.li,{children:[e.jsx(r.code,{children:"notFound"})," configuration"]}),`
`,e.jsx(r.li,{children:"async factory rejections"}),`
`]}),`
`,e.jsx(r.pre,{children:e.jsx(r.code,{className:"language-ts",children:`const router = new Router({
  runtime,
  notFound: (context, error) => ({
    type: 'Page',
    props: {
      title: 'Route failed',
      subtitle: error instanceof Error ? error.message : 'Unknown route error',
    },
  }),
});
`})}),`
`,e.jsx(r.p,{children:"Use this when:"}),`
`,e.jsxs(r.ul,{children:[`
`,e.jsx(r.li,{children:"a route cannot resolve"}),`
`,e.jsx(r.li,{children:"a handler throws"}),`
`,e.jsx(r.li,{children:"an async factory rejects"}),`
`]}),`
`,e.jsx(r.p,{children:"The important goal is continuity: the shell stays alive even when a specific route fails."}),`
`,e.jsx(r.hr,{}),`
`,e.jsx(r.h2,{id:"layer-2-the-experience-transitions",children:"Layer 2: The Experience (Transitions)"}),`
`,e.jsxs(r.p,{children:["This is where ",e.jsx(r.code,{children:"useDeferredPending"})," helps."]}),`
`,e.jsx(r.p,{children:"It lets you keep loading and error policy outside the Router core:"}),`
`,e.jsx(r.pre,{children:e.jsx(r.code,{className:"language-ts",children:`const { showLoader, run } = useDeferredPending({ threshold: 180 });

const handleNav = async (path: string) => {
  try {
    await run(() => router.navigate(path));
  } catch (error) {
    setRouteError(error);
  }
};
`})}),`
`,e.jsx(r.p,{children:"That gives you a clean separation:"}),`
`,e.jsxs(r.ul,{children:[`
`,e.jsx(r.li,{children:"Router resolves screens"}),`
`,e.jsx(r.li,{children:"the hook decides when loading becomes visible"}),`
`,e.jsx(r.li,{children:"your app decides how to render failure"}),`
`]}),`
`,e.jsx(r.hr,{}),`
`,e.jsx(r.h2,{id:"recipe-retry-failed-route",children:"Recipe: Retry Failed Route"}),`
`,e.jsx(M,{}),`
`,e.jsx(r.hr,{}),`
`,e.jsx(r.h2,{id:"layer-3-the-content-runtime",children:"Layer 3: The Content (Runtime)"}),`
`,e.jsx(r.p,{children:"Inside the screen itself, failures can still happen in the runtime layer."}),`
`,e.jsx(r.p,{children:"Typical sources:"}),`
`,e.jsxs(r.ul,{children:[`
`,e.jsxs(r.li,{children:[e.jsx(r.code,{children:"$expr"})," cannot resolve"]}),`
`,e.jsxs(r.li,{children:[e.jsx(r.code,{children:"$action"})," throws"]}),`
`,e.jsx(r.li,{children:"an expression is blocked by security policy"}),`
`]}),`
`,e.jsx(r.p,{children:"Your goal here is graceful degradation, not silent collapse."}),`
`,e.jsx(r.p,{children:"Patterns to favor:"}),`
`,e.jsxs(r.ul,{children:[`
`,e.jsx(r.li,{children:"show a fallback value for failed reads"}),`
`,e.jsx(r.li,{children:"surface action failures near the control that triggered them"}),`
`,e.jsx(r.li,{children:"keep screen structure intact even when one expression fails"}),`
`]}),`
`,e.jsx(l,{sx:{p:2,my:3,bgcolor:"action.hover",borderRadius:1.5,borderLeft:"4px solid",borderColor:"primary.main"},children:e.jsxs(r.p,{children:[e.jsx("strong",{children:"Pro Tip: Runtime failures should degrade locally"}),e.jsx("br",{}),`
If one `,e.jsx(r.code,{children:"$expr"})," fails, that node should degrade. It should not take down the entire route."]})}),`
`,e.jsx(r.hr,{}),`
`,e.jsx(r.h2,{id:"recipes",children:"Recipes"}),`
`,e.jsx(r.h3,{id:"keep-previous-screen-on-error",children:"Keep Previous Screen On Error"}),`
`,e.jsx(F,{}),`
`,e.jsx(r.p,{children:"Use this when:"}),`
`,e.jsxs(r.ul,{children:[`
`,e.jsx(r.li,{children:"the old screen still provides orientation"}),`
`,e.jsx(r.li,{children:"the failed route is a contextual jump"}),`
`,e.jsx(r.li,{children:"you want the user to recover without losing place"}),`
`]}),`
`,e.jsx(r.h3,{id:"swap-to-error-shell",children:"Swap To Error Shell"}),`
`,e.jsx(L,{}),`
`,e.jsx(r.p,{children:"Use this when:"}),`
`,e.jsxs(r.ul,{children:[`
`,e.jsx(r.li,{children:"the route owns the entire workspace"}),`
`,e.jsx(r.li,{children:"the failure belongs to the target route itself"}),`
`,e.jsx(r.li,{children:"you want a clear “this route failed” message"}),`
`]}),`
`,e.jsx(r.hr,{}),`
`,e.jsx(r.h2,{id:"rules-of-thumb",children:"Rules Of Thumb"}),`
`,e.jsxs(r.ol,{children:[`
`,e.jsx(r.li,{children:"Handle route failures at the Router boundary"}),`
`,e.jsx(r.li,{children:"Handle loading and retry policy in transition logic"}),`
`,e.jsxs(r.li,{children:["Handle ",e.jsx(r.code,{children:"$expr"})," and ",e.jsx(r.code,{children:"$action"})," failures close to the failing node"]}),`
`,e.jsx(r.li,{children:"Keep the app shell alive whenever possible"}),`
`,e.jsx(r.li,{children:"Prefer retryable states over dead-end errors"}),`
`]})]})}function Me(n={}){const{wrapper:r}={...D(),...n.components};return r?e.jsx(r,{...n,children:e.jsx(C,{...n})}):C(n)}export{Me as default};
