import{j as e,h as t,T as o,r as s,aG as z,d as ye,B as g}from"./iframe-D0caXraM.js";import"./Switch-C-3H6IVI.js";import"./Button-CXS3QqkH.js";import"./Paper-xXEET6BR.js";import"./Tooltip-DuFS0zf6.js";import{L as ve}from"./Layout-BCtHq1Ou.js";import{u as fe,m as be,a as xe}from"./launcherPopover-COAquagD.js";import{P as ke}from"./Tooltip-iopH_C2q.js";import{C as Ne}from"./ClickAwayListener-BF3zedw9.js";import"./preload-helper-Dp1pzeXC.js";import"./createSvgIcon-TkOxIDkm.js";import"./useSlot-Cy0-9XXJ.js";import"./useForkRef-XNQZmqk0.js";import"./Grow-DLLXf6dE.js";import"./TransitionGroupContext-yoRJhQyt.js";import"./useFormControl-CvrkDGak.js";import"./ButtonBase-Dn4a5hRT.js";import"./Icon-QhGitz5d.js";import"./Button-5KcQE1lk.js";import"./CircularProgress-9BrVdoMo.js";import"./Paper-Bk81HPwT.js";import"./LeftSidebarContext-B_lKXPeO.js";import"./TopBar-C__p-e2G.js";import"./Menu-Cb6wxuKw.js";import"./isHostComponent-DVu5iVWx.js";import"./List-Be7TWYSF.js";import"./MenuItem-DcITh2LE.js";import"./listItemIconClasses-DgbM6iS2.js";import"./listItemTextClasses-Dj5q713R.js";import"./dividerClasses-C69-NOzd.js";import"./useGuiMediaQuery-DIj0O0SY.js";import"./getThemeProps-DYfa67Lg.js";import"./useInsets-CiiXh2hL.js";import"./Avatar-DA2IiRv7.js";import"./AppBar-CCGMmm9R.js";import"./Toolbar-PZ12EgUX.js";import"./useLeftSidebar-DOBe_gaq.js";import"./Collapse-Dx5oIooG.js";import"./IconButton-C-DjN5NB.js";import"./Gauge-LzSFGwAb.js";import"./IconButton-3QKTNDRF.js";import"./Avatar-DpCE2P7T.js";import"./TextField-CBETVBGe.js";import"./isMuiElement-Bc5q4xEL.js";import"./Drawer-niTC23G5.js";import"./Progress-CCXLkOfw.js";import"./ListItemIcon-BDBP-lji.js";import"./ListItemText-BwbMCl6y.js";import"./guiNodeId-DVQruk1C.js";import"./AppBar-BPK1UGLw.js";import"./StickyOptionsTop-qYwiVun8.js";import"./expression-BDTpv4bP.js";const R={netget:"#4fc3f7",monad:"#81c784",direct:"#ffb74d",public:"#ce93d8"},q={netget:"NetGet",monad:"Monad",direct:"Direct",public:"Public"};function ee({rows:r}){return e.jsxs(t,{sx:{width:"100%"},children:[e.jsx(o,{variant:"caption",sx:{display:"block",mb:1.5,color:"text.secondary",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",fontSize:"0.7rem"},children:"Surface Access Points"}),e.jsxs(t,{sx:{width:"100%",borderRadius:2,border:"1px solid",borderColor:"divider",overflow:"hidden"},children:[e.jsx(t,{sx:{display:"grid",gridTemplateColumns:"1fr 1.4fr 1fr 28px",px:2,py:1,bgcolor:"action.hover",borderBottom:"1px solid",borderColor:"divider"},children:["Address","Endpoint","Kind",""].map(i=>e.jsx(o,{variant:"caption",sx:{fontWeight:700,color:"text.secondary",fontSize:"0.68rem",letterSpacing:"0.08em",textTransform:"uppercase"},children:i},i))}),r.length===0?e.jsx(t,{sx:{px:2,py:2},children:e.jsx(o,{variant:"caption",sx:{color:"text.secondary",fontStyle:"italic"},children:"No surfaces resolved."})}):r.map((i,x)=>e.jsxs(t,{sx:{display:"grid",gridTemplateColumns:"1fr 1.4fr 1fr 28px",px:2,py:1.25,borderBottom:x<r.length-1?"1px solid":"none",borderColor:"divider",transition:"background 120ms ease","&:hover":{bgcolor:"action.hover"}},children:[e.jsx(o,{variant:"caption",sx:{fontFamily:"monospace",fontWeight:700,fontSize:"0.78rem",color:R[i.kind]},children:i.namespace}),e.jsx(o,{variant:"caption",sx:{fontFamily:"monospace",fontSize:"0.75rem",color:"text.secondary"},children:i.endpoint||"—"}),e.jsx(o,{variant:"caption",sx:{fontSize:"0.75rem",fontWeight:600,color:R[i.kind]},children:q[i.kind]}),e.jsx(t,{sx:{display:"flex",justifyContent:"flex-end",alignItems:"center"},children:e.jsx(t,{title:i.online?"online":"offline",sx:{width:8,height:8,borderRadius:"50%",flexShrink:0,bgcolor:i.online?"#4caf50":"rgba(255,255,255,0.18)"}})})]},i.namespace))]}),e.jsx(t,{sx:{display:"flex",gap:2.5,mt:1.5,flexWrap:"wrap"},children:Object.keys(q).map(i=>e.jsxs(t,{sx:{display:"flex",alignItems:"center",gap:.75},children:[e.jsx(t,{sx:{width:8,height:8,borderRadius:"2px",bgcolor:R[i],flexShrink:0}}),e.jsx(o,{variant:"caption",sx:{fontSize:"0.7rem",color:"text.secondary"},children:q[i]})]},i))})]})}ee.__docgenInfo={description:"",methods:[],displayName:"SurfaceAccessTable",props:{rows:{required:!0,tsType:{name:"Array",elements:[{name:"Surface"}],raw:"Surface[]"},description:"Pure display: caller fetches (e.g. via netget's createMeNetgetClient) and passes rows in."}}};const ae="beatle:resolver-history",we=8;function je(){const r=ye();return s.useMemo(()=>({idle:r.palette.text.disabled,parsing:r.palette.warning.main,connecting:r.palette.warning.main,resolving:r.palette.warning.light,connected:r.palette.success.main,streaming:r.palette.info.main,error:r.palette.error.main,invalid:r.palette.error.main,disconnected:r.palette.text.disabled}),[r])}const K={idle:"no channel",parsing:"parsing…",connecting:"connecting…",resolving:"resolving…",connected:"connected",streaming:"streaming",error:"no server",invalid:"invalid domain",disconnected:"disconnected"},Re={local:"#81c784",public:"#ce93d8"},qe=["parsing","connecting","resolving"];function Pe(){try{return JSON.parse(localStorage.getItem(ae)??"[]")}catch{return[]}}function Se(r){try{localStorage.setItem(ae,JSON.stringify(r.slice(0,we)))}catch{}}function Te(r){return`wss://${r}/nrp`}function u({defaultExpression:r="",resolvers:i,nrpEndpoint:x,showResolver:ne=!0,onConnect:k,onMessage:re,onDisconnect:N,onStateChange:w,variant:P="bar",launcherId:te="beatle",sx:c}){var O,V;const[j,S]=s.useState(r),[ie,T]=s.useState(!1),B=s.useRef(null),E=s.useRef(null),[se,C]=fe(te),d=s.useMemo(()=>i??be(),[]),[I,le]=s.useState(Pe),oe=s.useMemo(()=>{const a=[...I,...d.map(l=>l.label)];return[...new Set(a)]},[I,d]),[m,ue]=s.useState(()=>{var a;return((a=d.find(l=>l.ws===x))==null?void 0:a.label)??d[0].label}),[h,de]=s.useState(""),ce=s.useMemo(()=>{const a=d.find(l=>l.label===m);return(a==null?void 0:a.ws)??Te(m)},[m,d]),pe=s.useMemo(()=>{var a;return((a=d.find(l=>l.label===m))==null?void 0:a.kind)??"public"},[m,d]),{channel:n,open:A,send:Ee,disconnect:y}=xe(ce,re),p=je()[n.state],D=qe.includes(n.state);s.useEffect(()=>{n.state==="connected"&&(k==null||k(n))},[n.state]),s.useEffect(()=>{n.state==="disconnected"&&(N==null||N())},[n.state]),s.useEffect(()=>{w==null||w(n.state)},[n.state]);const L=s.useCallback(a=>{const l=a.trim();l&&(ue(l),y(),le(ge=>{const _=[l,...ge.filter(he=>he!==l)];return Se(_),_}))},[y]),W=s.useCallback(()=>{A(j.trim())},[j,A]),me=a=>{var l;a.key==="Enter"&&W(),a.key==="Escape"&&(y(),S(""),(l=B.current)==null||l.blur())},M=((O=n.expression)==null?void 0:O.canonical)??((V=n.expression)==null?void 0:V.raw)??"",F=e.jsxs(t,{sx:[{display:"flex",alignItems:"center",gap:.75,width:"100%",height:44,px:1.5,borderRadius:2,border:"1px solid",borderColor:ie?p:"divider",bgcolor:"background.paper",transition:"border-color 0.2s ease"},...P==="bar"?Array.isArray(c)?c:[c]:[]],children:[e.jsx(t,{sx:{fontSize:18,lineHeight:1,color:p,flexShrink:0,transition:"color 0.3s ease",animation:D?"beatle-pulse 1s ease-in-out infinite":"none",cursor:"pointer",userSelect:"none"},onClick:()=>n.state==="connected"||n.state==="streaming"?y():W(),title:n.state==="connected"||n.state==="streaming"?"Disconnect":"Open channel",children:"𓆣"}),e.jsx(t,{ref:B,component:"input",value:j,onChange:a=>S(a.target.value),onKeyDown:me,onFocus:()=>T(!0),onBlur:()=>T(!1),placeholder:"username @ namespace [surface] / path",spellCheck:!1,autoComplete:"off",sx:{flex:1,border:"none",outline:"none",background:"transparent",color:"text.primary",fontFamily:"monospace",fontSize:"0.82rem",fontWeight:500,minWidth:0,"&::placeholder":{color:"text.disabled",fontStyle:"italic"}}}),ne&&e.jsxs(e.Fragment,{children:[e.jsx(t,{sx:{width:"1px",height:20,bgcolor:"divider",flexShrink:0}}),e.jsxs(t,{sx:{display:"flex",alignItems:"center",gap:.5,flexShrink:0},children:[e.jsx(t,{sx:{width:6,height:6,borderRadius:"50%",bgcolor:Re[pe],flexShrink:0}}),e.jsx(t,{component:"input",list:"beatle-resolvers",value:h,onChange:a=>de(a.target.value),onBlur:()=>{h.trim()&&L(h)},onKeyDown:a=>{a.key==="Enter"&&(L(h),a.currentTarget.blur())},placeholder:"namespace",spellCheck:!1,autoComplete:"off",sx:{border:"none",outline:"none",background:"transparent",color:"text.secondary",fontFamily:"monospace",fontSize:"0.68rem",fontWeight:500,width:120,"&::placeholder":{color:"text.disabled",fontStyle:"italic"}}}),e.jsx("datalist",{id:"beatle-resolvers",children:oe.map(a=>e.jsx("option",{value:a},a))})]})]}),n.state!=="idle"&&e.jsx(o,{variant:"caption",sx:{flexShrink:0,fontSize:"0.7rem",fontWeight:600,color:p,transition:"color 0.3s ease",whiteSpace:"nowrap"},children:K[n.state]}),(n.state==="connected"||n.state==="streaming")&&n.resolved.length>0&&e.jsx(t,{sx:{flexShrink:0,px:.75,py:.25,borderRadius:1,bgcolor:n.state==="streaming"?"rgba(79,195,247,0.12)":"rgba(102,187,106,0.12)",border:`1px solid ${n.state==="streaming"?"rgba(79,195,247,0.3)":"rgba(102,187,106,0.3)"}`},children:e.jsxs(o,{variant:"caption",sx:{fontSize:"0.65rem",color:p,fontFamily:"monospace"},children:[n.resolved.length," endpoint",n.resolved.length>1?"s":""]})})]});return P==="bubble"?e.jsxs(e.Fragment,{children:[e.jsx(z,{styles:{"@keyframes beatle-pulse":{"0%,100%":{opacity:.6},"50%":{opacity:1}}}}),e.jsx(t,{ref:E,title:M?`me://${M} — ${K[n.state]}`:"Beatle — NRP channel",onClick:()=>C(a=>!a),sx:[{display:"inline-flex",alignItems:"center",cursor:"pointer",userSelect:"none"},...Array.isArray(c)?c:[c]],children:e.jsx("span",{style:{fontSize:22,color:p,filter:`drop-shadow(0 0 4px ${p})`,lineHeight:1,animation:D?"beatle-pulse 1s ease-in-out infinite":"none"},children:"𓆣"})}),e.jsx(ke,{open:se,anchorEl:E.current,placement:"bottom-end",sx:{zIndex:a=>a.zIndex.drawer+3},children:e.jsx(Ne,{onClickAway:()=>C(!1),children:e.jsx(t,{sx:{mt:1,p:1,width:340,maxWidth:"90vw",borderRadius:1.5,border:"1px solid",borderColor:"divider",bgcolor:"background.paper",boxShadow:4},children:F})})})]}):e.jsxs(e.Fragment,{children:[e.jsx(z,{styles:{"@keyframes beatle-pulse":{"0%,100%":{opacity:.6},"50%":{opacity:1}}}}),F]})}u.__docgenInfo={description:"",methods:[],displayName:"Beatle",props:{defaultExpression:{required:!1,tsType:{name:"string"},description:"",defaultValue:{value:"''",computed:!1}},resolvers:{required:!1,tsType:{name:"Array",elements:[{name:"signature",type:"object",raw:`{
  /** Display label — the namespace identity of the resolver, e.g. "mymac.local" or "cleaker.me" */
  label: string;
  /** WebSocket URL for nrp.open */
  ws: string;
  kind: 'local' | 'public';
}`,signature:{properties:[{key:"label",value:{name:"string",required:!0},description:'Display label — the namespace identity of the resolver, e.g. "mymac.local" or "cleaker.me"'},{key:"ws",value:{name:"string",required:!0},description:"WebSocket URL for nrp.open"},{key:"kind",value:{name:"union",raw:"'local' | 'public'",elements:[{name:"literal",value:"'local'"},{name:"literal",value:"'public'"}],required:!0}}]}}],raw:"NRPResolver[]"},description:"Override the list of NRP resolver endpoints shown in the dropdown"},nrpEndpoint:{required:!1,tsType:{name:"string"},description:"Pre-select a resolver by ws URL"},showResolver:{required:!1,tsType:{name:"boolean"},description:`Show the resolver combobox (which server the channel connects to).
Default true — Beatle's own Storybook/standalone usage still wants it.
A host that already shows this elsewhere (e.g. Namespace's own
"here" badge, which answers exactly the same question — which server
you're actually on) should pass false: showing the same thing twice,
under two different labels ("here" vs. a bare "namespace" placeholder
here), reads as two different concepts when it's one. When false, the
channel still connects — to \`nrpEndpoint\` if given, else the first
(local) entry from the resolver list — just without a second control
for picking it.`,defaultValue:{value:"true",computed:!1}},onConnect:{required:!1,tsType:{name:"signature",type:"function",raw:"(channel: NamespaceChannel) => void",signature:{arguments:[{type:{name:"signature",type:"object",raw:`{
  expression: NRPExpression | null;
  resolved: string[];
  state: ResolutionState;
  channelId?: string;
  audience?: string[];
  /** Overlay/projection surface, not the NRP technical monad selector. */
  surface?: string;
  capabilities?: string[];
  /** Disclosure level reported by the NRP server for this channel */
  disclosure?: NRPDisclosure;
  error?: string;
}`,signature:{properties:[{key:"expression",value:{name:"union",raw:"NRPExpression | null",elements:[{name:"signature",type:"object",raw:`{
  raw: string;
  canonical: string;
  ast: NRPNode;
  /** Algebra parsed without syntax errors */
  syntaxValid: boolean;
  /** All namespace leaves passed Cleaker validation */
  namespaceValid: boolean;
  /**
   * All namespace leaves have real FQDN shape (2+ DNS-label-shaped segments —
   * cleaker's isValidDomainShape). A namespace can be namespaceValid (parses,
   * can be claimed/written to \`.me\`) without being domainShapeValid — that's
   * the "invalid claim, never resolves" case, not a parse error.
   */
  domainShapeValid: boolean;
  /** syntaxValid — safe to send to NRP server */
  valid: boolean;
  error?: string;
}`,signature:{properties:[{key:"raw",value:{name:"string",required:!0}},{key:"canonical",value:{name:"string",required:!0}},{key:"ast",value:{name:"union",raw:`| NamespaceLeaf
| { kind: 'complement';   operand: NRPNode }
| { kind: 'union';        left: NRPNode; right: NRPNode }
| { kind: 'intersection'; left: NRPNode; right: NRPNode }
/** Projection overlay. This is not the same as an NRP [monad] selector. */
| { kind: 'overlay';      namespace: NRPNode; surface: string }`,elements:[{name:"signature",type:"object",raw:`{
  kind: 'namespace';
  value: string;
  /** Cleaker-parsed result when valid */
  parsed?: ParsedNamespaceExpression;
  /** Reason Cleaker rejected this leaf */
  parseError?: string;
}`,signature:{properties:[{key:"kind",value:{name:"literal",value:"'namespace'",required:!0}},{key:"value",value:{name:"string",required:!0}},{key:"parsed",value:{name:"ParsedNamespaceExpression",required:!1},description:"Cleaker-parsed result when valid"},{key:"parseError",value:{name:"string",required:!1},description:"Reason Cleaker rejected this leaf"}]}},{name:"signature",type:"object",raw:"{ kind: 'complement';   operand: NRPNode }",signature:{properties:[{key:"kind",value:{name:"literal",value:"'complement'",required:!0}},{key:"operand",value:{name:"NRPNode",required:!0}}]}},{name:"signature",type:"object",raw:"{ kind: 'union';        left: NRPNode; right: NRPNode }",signature:{properties:[{key:"kind",value:{name:"literal",value:"'union'",required:!0}},{key:"left",value:{name:"NRPNode",required:!0}},{key:"right",value:{name:"NRPNode",required:!0}}]}},{name:"signature",type:"object",raw:"{ kind: 'intersection'; left: NRPNode; right: NRPNode }",signature:{properties:[{key:"kind",value:{name:"literal",value:"'intersection'",required:!0}},{key:"left",value:{name:"NRPNode",required:!0}},{key:"right",value:{name:"NRPNode",required:!0}}]}},{name:"signature",type:"object",raw:"{ kind: 'overlay';      namespace: NRPNode; surface: string }",signature:{properties:[{key:"kind",value:{name:"literal",value:"'overlay'",required:!0}},{key:"namespace",value:{name:"NRPNode",required:!0}},{key:"surface",value:{name:"string",required:!0}}]}}],required:!0}},{key:"syntaxValid",value:{name:"boolean",required:!0},description:"Algebra parsed without syntax errors"},{key:"namespaceValid",value:{name:"boolean",required:!0},description:"All namespace leaves passed Cleaker validation"},{key:"domainShapeValid",value:{name:"boolean",required:!0},description:`All namespace leaves have real FQDN shape (2+ DNS-label-shaped segments —
cleaker's isValidDomainShape). A namespace can be namespaceValid (parses,
can be claimed/written to \`.me\`) without being domainShapeValid — that's
the "invalid claim, never resolves" case, not a parse error.`},{key:"valid",value:{name:"boolean",required:!0},description:"syntaxValid — safe to send to NRP server"},{key:"error",value:{name:"string",required:!1}}]}},{name:"null"}],required:!0}},{key:"resolved",value:{name:"Array",elements:[{name:"string"}],raw:"string[]",required:!0}},{key:"state",value:{name:"union",raw:`| 'idle'
| 'parsing'
| 'connecting'
| 'resolving'
| 'connected'
| 'streaming'
| 'error'
/**
 * The expression parsed fine, but a namespace leaf doesn't have real FQDN
 * shape (2+ DNS-label-shaped segments — see cleaker's isValidDomainShape).
 * Distinct from 'error': this isn't a connection failure that a retry or a
 * live server could fix, it's a structural "this will never resolve
 * through NRP" answer. The namespace can still exist as a claim/branch in
 * \`.me\` — it just never derives, so it never joins NRP resolution.
 */
| 'invalid'
| 'disconnected'`,elements:[{name:"literal",value:"'idle'"},{name:"literal",value:"'parsing'"},{name:"literal",value:"'connecting'"},{name:"literal",value:"'resolving'"},{name:"literal",value:"'connected'"},{name:"literal",value:"'streaming'"},{name:"literal",value:"'error'"},{name:"literal",value:"'invalid'"},{name:"literal",value:"'disconnected'"}],required:!0}},{key:"channelId",value:{name:"string",required:!1}},{key:"audience",value:{name:"Array",elements:[{name:"string"}],raw:"string[]",required:!1}},{key:"surface",value:{name:"string",required:!1},description:"Overlay/projection surface, not the NRP technical monad selector."},{key:"capabilities",value:{name:"Array",elements:[{name:"string"}],raw:"string[]",required:!1}},{key:"disclosure",value:{name:"union",raw:"'public' | 'opened' | 'closed' | 'contested'",elements:[{name:"literal",value:"'public'"},{name:"literal",value:"'opened'"},{name:"literal",value:"'closed'"},{name:"literal",value:"'contested'"}],required:!1},description:"Disclosure level reported by the NRP server for this channel"},{key:"error",value:{name:"string",required:!1}}]}},name:"channel"}],return:{name:"void"}}},description:""},onMessage:{required:!1,tsType:{name:"signature",type:"function",raw:"(msg: BeatleMessage) => void",signature:{arguments:[{type:{name:"union",raw:`| MsgNrpOpen
| MsgResolved
| MsgData
| MsgStream
| MsgRead
| MsgSubscribe
| MsgUnsubscribe
| MsgError
| MsgPing
| MsgPong`,elements:[{name:"signature",type:"object",raw:`{
  type: 'nrp.open';
  expression: string;
  canonical: string;
  ast: NRPNode;
  client: ClientContext;
  timestamp: number;
}`,signature:{properties:[{key:"type",value:{name:"literal",value:"'nrp.open'",required:!0}},{key:"expression",value:{name:"string",required:!0}},{key:"canonical",value:{name:"string",required:!0}},{key:"ast",value:{name:"union",raw:`| NamespaceLeaf
| { kind: 'complement';   operand: NRPNode }
| { kind: 'union';        left: NRPNode; right: NRPNode }
| { kind: 'intersection'; left: NRPNode; right: NRPNode }
/** Projection overlay. This is not the same as an NRP [monad] selector. */
| { kind: 'overlay';      namespace: NRPNode; surface: string }`,elements:[{name:"signature",type:"object",raw:`{
  kind: 'namespace';
  value: string;
  /** Cleaker-parsed result when valid */
  parsed?: ParsedNamespaceExpression;
  /** Reason Cleaker rejected this leaf */
  parseError?: string;
}`,signature:{properties:[{key:"kind",value:{name:"literal",value:"'namespace'",required:!0}},{key:"value",value:{name:"string",required:!0}},{key:"parsed",value:{name:"ParsedNamespaceExpression",required:!1},description:"Cleaker-parsed result when valid"},{key:"parseError",value:{name:"string",required:!1},description:"Reason Cleaker rejected this leaf"}]}},{name:"signature",type:"object",raw:"{ kind: 'complement';   operand: NRPNode }",signature:{properties:[{key:"kind",value:{name:"literal",value:"'complement'",required:!0}},{key:"operand",value:{name:"NRPNode",required:!0}}]}},{name:"signature",type:"object",raw:"{ kind: 'union';        left: NRPNode; right: NRPNode }",signature:{properties:[{key:"kind",value:{name:"literal",value:"'union'",required:!0}},{key:"left",value:{name:"NRPNode",required:!0}},{key:"right",value:{name:"NRPNode",required:!0}}]}},{name:"signature",type:"object",raw:"{ kind: 'intersection'; left: NRPNode; right: NRPNode }",signature:{properties:[{key:"kind",value:{name:"literal",value:"'intersection'",required:!0}},{key:"left",value:{name:"NRPNode",required:!0}},{key:"right",value:{name:"NRPNode",required:!0}}]}},{name:"signature",type:"object",raw:"{ kind: 'overlay';      namespace: NRPNode; surface: string }",signature:{properties:[{key:"kind",value:{name:"literal",value:"'overlay'",required:!0}},{key:"namespace",value:{name:"NRPNode",required:!0}},{key:"surface",value:{name:"string",required:!0}}]}}],required:!0}},{key:"client",value:{name:"signature",type:"object",raw:`{
  /** Current browser/projection surface, not the NRP [monad] selector. */
  surface?: string;
  userAgent?: string;
  gui?: string;
}`,signature:{properties:[{key:"surface",value:{name:"string",required:!1},description:"Current browser/projection surface, not the NRP [monad] selector."},{key:"userAgent",value:{name:"string",required:!1}},{key:"gui",value:{name:"string",required:!1}}]},required:!0}},{key:"timestamp",value:{name:"number",required:!0}}]}},{name:"signature",type:"object",raw:`{
  type: 'resolved';
  channelId: string;
  payload: ResolvedPayload;
  timestamp: number;
}`,signature:{properties:[{key:"type",value:{name:"literal",value:"'resolved'",required:!0}},{key:"channelId",value:{name:"string",required:!0}},{key:"payload",value:{name:"signature",type:"object",raw:`{
  endpoints: string[];
  audience?: string[];
  capabilities?: string[];
  /**
   * Projection/overlay surface the channel is overlaid on (from @ operator).
   * This is distinct from an NRP [monad] selector.
   */
  surface?: string;
  disclosure: NRPDisclosure;
}`,signature:{properties:[{key:"endpoints",value:{name:"Array",elements:[{name:"string"}],raw:"string[]",required:!0}},{key:"audience",value:{name:"Array",elements:[{name:"string"}],raw:"string[]",required:!1}},{key:"capabilities",value:{name:"Array",elements:[{name:"string"}],raw:"string[]",required:!1}},{key:"surface",value:{name:"string",required:!1},description:`Projection/overlay surface the channel is overlaid on (from @ operator).
This is distinct from an NRP [monad] selector.`},{key:"disclosure",value:{name:"union",raw:"'public' | 'opened' | 'closed' | 'contested'",elements:[{name:"literal",value:"'public'"},{name:"literal",value:"'opened'"},{name:"literal",value:"'closed'"},{name:"literal",value:"'contested'"}],required:!0}}]},required:!0}},{key:"timestamp",value:{name:"number",required:!0}}]}},{name:"signature",type:"object",raw:`{
  type: 'data';
  channelId?: string;
  payload: unknown;
  timestamp: number;
}`,signature:{properties:[{key:"type",value:{name:"literal",value:"'data'",required:!0}},{key:"channelId",value:{name:"string",required:!1}},{key:"payload",value:{name:"unknown",required:!0}},{key:"timestamp",value:{name:"number",required:!0}}]}},{name:"signature",type:"object",raw:`{
  type: 'stream';
  channelId?: string;
  payload?: unknown;
  timestamp: number;
}`,signature:{properties:[{key:"type",value:{name:"literal",value:"'stream'",required:!0}},{key:"channelId",value:{name:"string",required:!1}},{key:"payload",value:{name:"unknown",required:!1}},{key:"timestamp",value:{name:"number",required:!0}}]}},{name:"signature",type:"object",raw:`{
  type: 'read';
  channelId?: string;
  namespace: string;
  path: string;
  timestamp: number;
}`,signature:{properties:[{key:"type",value:{name:"literal",value:"'read'",required:!0}},{key:"channelId",value:{name:"string",required:!1}},{key:"namespace",value:{name:"string",required:!0}},{key:"path",value:{name:"string",required:!0}},{key:"timestamp",value:{name:"number",required:!0}}]}},{name:"signature",type:"object",raw:`{
  type: 'subscribe';
  channelId?: string;
  namespace: string;
  path: string;
  timestamp: number;
}`,signature:{properties:[{key:"type",value:{name:"literal",value:"'subscribe'",required:!0}},{key:"channelId",value:{name:"string",required:!1}},{key:"namespace",value:{name:"string",required:!0}},{key:"path",value:{name:"string",required:!0}},{key:"timestamp",value:{name:"number",required:!0}}]}},{name:"signature",type:"object",raw:`{
  type: 'unsubscribe';
  channelId?: string;
  namespace: string;
  path: string;
  timestamp: number;
}`,signature:{properties:[{key:"type",value:{name:"literal",value:"'unsubscribe'",required:!0}},{key:"channelId",value:{name:"string",required:!1}},{key:"namespace",value:{name:"string",required:!0}},{key:"path",value:{name:"string",required:!0}},{key:"timestamp",value:{name:"number",required:!0}}]}},{name:"signature",type:"object",raw:`{
  type: 'error';
  channelId?: string;
  payload: string;
  /**
   * Present only for a small set of errors the client needs to react to
   * differently than a generic connection failure — currently just the
   * domain-shape gate (see ResolutionState's 'invalid' doc comment). Server
   * is the authority: the client already gates this itself before opening a
   * channel, but if that check is ever bypassed or stale, this code is what
   * lets the client still land on 'invalid' instead of 'error'.
   */
  code?: 'invalid_namespace_shape';
  timestamp: number;
}`,signature:{properties:[{key:"type",value:{name:"literal",value:"'error'",required:!0}},{key:"channelId",value:{name:"string",required:!1}},{key:"payload",value:{name:"string",required:!0}},{key:"code",value:{name:"literal",value:"'invalid_namespace_shape'",required:!1},description:`Present only for a small set of errors the client needs to react to
differently than a generic connection failure — currently just the
domain-shape gate (see ResolutionState's 'invalid' doc comment). Server
is the authority: the client already gates this itself before opening a
channel, but if that check is ever bypassed or stale, this code is what
lets the client still land on 'invalid' instead of 'error'.`},{key:"timestamp",value:{name:"number",required:!0}}]}},{name:"signature",type:"object",raw:"{ type: 'ping'; timestamp: number }",signature:{properties:[{key:"type",value:{name:"literal",value:"'ping'",required:!0}},{key:"timestamp",value:{name:"number",required:!0}}]}},{name:"signature",type:"object",raw:"{ type: 'pong'; timestamp: number }",signature:{properties:[{key:"type",value:{name:"literal",value:"'pong'",required:!0}},{key:"timestamp",value:{name:"number",required:!0}}]}}]},name:"msg"}],return:{name:"void"}}},description:""},onDisconnect:{required:!1,tsType:{name:"signature",type:"function",raw:"() => void",signature:{arguments:[],return:{name:"void"}}},description:""},onStateChange:{required:!1,tsType:{name:"signature",type:"function",raw:"(state: ResolutionState) => void",signature:{arguments:[{type:{name:"union",raw:`| 'idle'
| 'parsing'
| 'connecting'
| 'resolving'
| 'connected'
| 'streaming'
| 'error'
/**
 * The expression parsed fine, but a namespace leaf doesn't have real FQDN
 * shape (2+ DNS-label-shaped segments — see cleaker's isValidDomainShape).
 * Distinct from 'error': this isn't a connection failure that a retry or a
 * live server could fix, it's a structural "this will never resolve
 * through NRP" answer. The namespace can still exist as a claim/branch in
 * \`.me\` — it just never derives, so it never joins NRP resolution.
 */
| 'invalid'
| 'disconnected'`,elements:[{name:"literal",value:"'idle'"},{name:"literal",value:"'parsing'"},{name:"literal",value:"'connecting'"},{name:"literal",value:"'resolving'"},{name:"literal",value:"'connected'"},{name:"literal",value:"'streaming'"},{name:"literal",value:"'error'"},{name:"literal",value:"'invalid'"},{name:"literal",value:"'disconnected'"}]},name:"state"}],return:{name:"void"}}},description:`Fired on every channel.state transition (idle/parsing/connecting/
resolving/connected/streaming/error/invalid/disconnected) -- not just
the connected/disconnected edges onConnect/onDisconnect already cover.
For a host that wants to mirror Beatle's own connection state
elsewhere (e.g. recoloring a QR code by it) without opening a second,
independent channel to get it.`},variant:{required:!1,tsType:{name:"union",raw:"'bar' | 'bubble'",elements:[{name:"literal",value:"'bar'"},{name:"literal",value:"'bubble'"}]},description:"",defaultValue:{value:"'bar'",computed:!1}},launcherId:{required:!1,tsType:{name:"string"},description:`\`variant="bubble"\` only: id passed to \`useLauncherPopover\` so this
Beatle's expanded popover shares the same "only one launcher open at a
time" mutual exclusion as ThemeLauncher/DevToolsLauncher when several
sit in the same rail/bar. Defaults to \`'beatle'\` -- override only if
two independent Beatle bubbles are ever mounted on the same page.`,defaultValue:{value:"'beatle'",computed:!1}},sx:{required:!1,tsType:{name:"any"},description:""}}};const Be=[{namespace:"jabellae",kind:"monad",online:!0,endpoint:"http://127.0.0.1:4021",trust:"owner"},{namespace:"alex",kind:"monad",online:!0,endpoint:"http://127.0.0.1:4022"},{namespace:"team.acme",kind:"monad",online:!1,endpoint:"http://127.0.0.1:4023"},{namespace:"local.netget",kind:"netget",online:!0}],Ea={title:"Pieces/NRP/Beatle",component:u,parameters:{layout:"padded"}},v={render:()=>e.jsxs(g,{sx:{maxWidth:480,display:"flex",flexDirection:"column",gap:2},children:[e.jsx(o,{variant:"caption",sx:{color:"text.secondary"},children:"Type a .me expression and press Enter to open a WebSocket channel via NRP."}),e.jsx(u,{defaultExpression:"jabellae"}),e.jsx(u,{defaultExpression:"jabellae + alex"}),e.jsx(u,{})]})},f={render:()=>e.jsxs(g,{sx:{display:"flex",gap:3,alignItems:"center"},children:[e.jsx(u,{variant:"bubble",defaultExpression:"jabellae"}),e.jsx(u,{variant:"bubble"})]})},b={parameters:{layout:"fullscreen"},render:()=>e.jsx(ve,{TopBar:{title:"NRP",elementsRight:[{type:"action",props:{element:e.jsx(u,{variant:"bubble",defaultExpression:"jabellae"})}}]},LeftBar:{elements:[{type:"link",props:{label:"Namespaces",icon:"hub"}},{type:"link",props:{label:"Channels",icon:"bolt"}},{type:"link",props:{label:"Mesh",icon:"polyline"}}]},RightBar:!1,Footer:!1,children:e.jsxs(g,{sx:{p:4,maxWidth:680,display:"flex",flexDirection:"column",gap:4},children:[e.jsxs(g,{children:[e.jsx(o,{variant:"h5",sx:{fontWeight:700,mb:.5},children:"Beatle"}),e.jsx(o,{variant:"body2",color:"text.secondary",children:"The NRP channel interface. Type any .me expression — a single namespace, a union, an intersection — and Beatle opens a bidirectional WebSocket to the resolved endpoint(s). The browser URL stays independent."})]}),e.jsx(u,{defaultExpression:"jabellae"}),e.jsx(g,{sx:{display:"flex",flexDirection:"column",gap:.75},children:["me://jabellae","me://jabellae + alex","me://jabellae ∩ team.acme","me://jabellae @ wikipedia.com",'me://(jabellae + alex) @ "https://wikipedia.com/Scarab"'].map(r=>e.jsx(o,{variant:"caption",sx:{color:"text.secondary",fontFamily:"monospace",fontSize:"0.72rem"},children:r},r))}),e.jsx(ee,{rows:Be})]})})};var U,$,H;v.parameters={...v.parameters,docs:{...(U=v.parameters)==null?void 0:U.docs,source:{originalSource:`{
  render: () => <Box sx={{
    maxWidth: 480,
    display: 'flex',
    flexDirection: 'column',
    gap: 2
  }}>
      <Typography variant="caption" sx={{
      color: 'text.secondary'
    }}>
        Type a .me expression and press Enter to open a WebSocket channel via NRP.
      </Typography>
      <Beatle defaultExpression="jabellae" />
      <Beatle defaultExpression="jabellae + alex" />
      <Beatle />
    </Box>
}`,...(H=($=v.parameters)==null?void 0:$.docs)==null?void 0:H.source}}};var Q,G,J;f.parameters={...f.parameters,docs:{...(Q=f.parameters)==null?void 0:Q.docs,source:{originalSource:`{
  render: () => <Box sx={{
    display: 'flex',
    gap: 3,
    alignItems: 'center'
  }}>
      <Beatle variant="bubble" defaultExpression="jabellae" />
      <Beatle variant="bubble" />
    </Box>
}`,...(J=(G=f.parameters)==null?void 0:G.docs)==null?void 0:J.source}}};var Y,X,Z;b.parameters={...b.parameters,docs:{...(Y=b.parameters)==null?void 0:Y.docs,source:{originalSource:`{
  parameters: {
    layout: 'fullscreen'
  },
  render: () => <Layout TopBar={{
    title: 'NRP',
    elementsRight: [
    // variant="bubble", not "bar" -- this slot has to survive mobile,
    // where TopBar collapses to a ~375px width. A full 320px bar
    // wouldn't fit next to the hamburger; the bubble collapses to a
    // single glyph and expands its full bar in a Popper on click
    // (see Beatle.tsx) regardless of screen width.
    {
      type: 'action',
      props: {
        element: <Beatle variant="bubble" defaultExpression="jabellae" />
      }
    }]
  }} LeftBar={{
    elements: [{
      type: 'link',
      props: {
        label: 'Namespaces',
        icon: 'hub'
      }
    }, {
      type: 'link',
      props: {
        label: 'Channels',
        icon: 'bolt'
      }
    }, {
      type: 'link',
      props: {
        label: 'Mesh',
        icon: 'polyline'
      }
    }]
  }} RightBar={false} Footer={false}>
      <Box sx={{
      p: 4,
      maxWidth: 680,
      display: 'flex',
      flexDirection: 'column',
      gap: 4
    }}>
        <Box>
          <Typography variant="h5" sx={{
          fontWeight: 700,
          mb: 0.5
        }}>Beatle</Typography>
          <Typography variant="body2" color="text.secondary">
            The NRP channel interface. Type any .me expression — a single namespace,
            a union, an intersection — and Beatle opens a bidirectional WebSocket
            to the resolved endpoint(s). The browser URL stays independent.
          </Typography>
        </Box>

        <Beatle defaultExpression="jabellae" />

        <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 0.75
      }}>
          {['me://jabellae', 'me://jabellae + alex', 'me://jabellae ∩ team.acme', 'me://jabellae @ wikipedia.com', 'me://(jabellae + alex) @ "https://wikipedia.com/Scarab"'].map(expr => <Typography key={expr} variant="caption" sx={{
          color: 'text.secondary',
          fontFamily: 'monospace',
          fontSize: '0.72rem'
        }}>
              {expr}
            </Typography>)}
        </Box>

        <SurfaceAccessTable rows={MOCK_SURFACES} />
      </Box>
    </Layout>
}`,...(Z=(X=b.parameters)==null?void 0:X.docs)==null?void 0:Z.source}}};const Ca=["Bar","Bubble","InLayout"];export{v as Bar,f as Bubble,b as InLayout,Ca as __namedExportsOrder,Ea as default};
