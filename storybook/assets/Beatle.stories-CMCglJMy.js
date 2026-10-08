import{j as e,g as r,b as l,r as s,G as F,B as y}from"./iframe-q72FflWy.js";import"./Paper-9gdP3SeZ.js";import{L as de}from"./Layout-BMKIslM6.js";import{m as pe,u as me}from"./Beatle.types-Ccwuy08N.js";import"./preload-helper-Dp1pzeXC.js";import"./Paper-C4cHEfmg.js";import"./LeftSidebarContext-DOlSL4Mw.js";import"./TopBar-D4C-tPuB.js";import"./Icon-Doq3uhPc.js";import"./Menu-DFKCKfQm.js";import"./useSlot-B3Bhjpe0.js";import"./resolveComponentProps-zf7BDQ8X.js";import"./useForkRef-BR9zNRBO.js";import"./useSlotProps-DMFXOslT.js";import"./isHostComponent-DVu5iVWx.js";import"./Grow-C-rRNj8l.js";import"./TransitionGroupContext-4zVEsxkP.js";import"./mergeSlotProps-BtuGLXbb.js";import"./useEventCallback-BVb6jHPB.js";import"./List-DvvFCGIp.js";import"./MenuItem-D5DHuw3h.js";import"./ButtonBase-D2HnvhjV.js";import"./listItemIconClasses-C8gmQhu6.js";import"./listItemTextClasses-_6ucLlDF.js";import"./dividerClasses-BXru1jN1.js";import"./useGuiMediaQuery-BQeqdqN6.js";import"./getThemeProps-BMrl9x_3.js";import"./useInsets-BdHRW95k.js";import"./Avatar-kFT77iM6.js";import"./createSvgIcon-DOR6FtI1.js";import"./AppBar-o6rXye4L.js";import"./Toolbar-s_6dNoIJ.js";import"./Tooltip-DrESC3lI.js";import"./useControlled-DIH1o2g4.js";import"./Collapse-sdA7RzmD.js";import"./IconButton-0qTeMK6V.js";import"./CircularProgress-BunsQ8Ul.js";import"./Dialog-o0j-FRf2.js";import"./Hero-BdzYVYxS.js";import"./Modal-XMQC5YcF.js";import"./IconButton-D9uKbFdE.js";import"./SearchField-Dr-GPthT.js";import"./Button-DuvGvkXy.js";import"./Button-BpF6GA05.js";import"./Drawer-DMbbDWRX.js";import"./useFormControl-BGm5bEiu.js";import"./Progress-CA1Hm4aa.js";import"./Avatar-iGO_2OcD.js";import"./TextField-BSNRPa5x.js";import"./isMuiElement-CKqkPfIO.js";import"./List-BSzaOevu.js";import"./ListItem-XTYGYKJx.js";import"./ListItemText-BjbJ233h.js";import"./ListItemButton-kBcRpM-O.js";import"./ListItemIcon-lKzEdP8D.js";import"./Menu-103suS3X.js";import"./MenuItem-COpnAg9l.js";import"./Stack-DHvmwf16.js";import"./Gauge-DyVYa28g.js";import"./guiNodeId-D05pr1LX.js";import"./AppBar-Cw3w4B11.js";import"./StickyOptionsTop-CZ31mdWb.js";import"./cleaker.es-Dsn4jCGX.js";const R={netget:"#4fc3f7",monad:"#81c784",direct:"#ffb74d",public:"#ce93d8"},S={netget:"NetGet",monad:"Monad",direct:"Direct",public:"Public"};function J({rows:o}){return e.jsxs(r,{sx:{width:"100%"},children:[e.jsx(l,{variant:"caption",sx:{display:"block",mb:1.5,color:"text.secondary",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",fontSize:"0.7rem"},children:"Surface Access Points"}),e.jsxs(r,{sx:{width:"100%",borderRadius:2,border:"1px solid",borderColor:"divider",overflow:"hidden"},children:[e.jsx(r,{sx:{display:"grid",gridTemplateColumns:"1fr 1.4fr 1fr 28px",px:2,py:1,bgcolor:"action.hover",borderBottom:"1px solid",borderColor:"divider"},children:["Address","Endpoint","Kind",""].map(t=>e.jsx(l,{variant:"caption",sx:{fontWeight:700,color:"text.secondary",fontSize:"0.68rem",letterSpacing:"0.08em",textTransform:"uppercase"},children:t},t))}),o.length===0?e.jsx(r,{sx:{px:2,py:2},children:e.jsx(l,{variant:"caption",sx:{color:"text.secondary",fontStyle:"italic"},children:"No surfaces resolved."})}):o.map((t,x)=>e.jsxs(r,{sx:{display:"grid",gridTemplateColumns:"1fr 1.4fr 1fr 28px",px:2,py:1.25,borderBottom:x<o.length-1?"1px solid":"none",borderColor:"divider",transition:"background 120ms ease","&:hover":{bgcolor:"action.hover"}},children:[e.jsx(l,{variant:"caption",sx:{fontFamily:"monospace",fontWeight:700,fontSize:"0.78rem",color:R[t.kind]},children:t.namespace}),e.jsx(l,{variant:"caption",sx:{fontFamily:"monospace",fontSize:"0.75rem",color:"text.secondary"},children:t.endpoint||"—"}),e.jsx(l,{variant:"caption",sx:{fontSize:"0.75rem",fontWeight:600,color:R[t.kind]},children:S[t.kind]}),e.jsx(r,{sx:{display:"flex",justifyContent:"flex-end",alignItems:"center"},children:e.jsx(r,{title:t.online?"online":"offline",sx:{width:8,height:8,borderRadius:"50%",flexShrink:0,bgcolor:t.online?"#4caf50":"rgba(255,255,255,0.18)"}})})]},t.namespace))]}),e.jsx(r,{sx:{display:"flex",gap:2.5,mt:1.5,flexWrap:"wrap"},children:Object.keys(S).map(t=>e.jsxs(r,{sx:{display:"flex",alignItems:"center",gap:.75},children:[e.jsx(r,{sx:{width:8,height:8,borderRadius:"2px",bgcolor:R[t],flexShrink:0}}),e.jsx(l,{variant:"caption",sx:{fontSize:"0.7rem",color:"text.secondary"},children:S[t]})]},t))})]})}J.__docgenInfo={description:"",methods:[],displayName:"SurfaceAccessTable",props:{rows:{required:!0,tsType:{name:"Array",elements:[{name:"Surface"}],raw:"Surface[]"},description:"Pure display: caller fetches (e.g. via netget's createMeNetgetClient) and passes rows in."}}};const Y="beatle:resolver-history",ge=8,ye={idle:"#555e66",parsing:"#ffb74d",connecting:"#ffb74d",resolving:"#ffcc02",connected:"#66bb6a",streaming:"#4fc3f7",error:"#666",invalid:"#e57373",disconnected:"#555e66"},V={idle:"no channel",parsing:"parsing…",connecting:"connecting…",resolving:"resolving…",connected:"connected",streaming:"streaming",error:"no server",invalid:"invalid domain",disconnected:"disconnected"},he={local:"#81c784",public:"#ce93d8"},ve=["parsing","connecting","resolving"];function fe(){try{return JSON.parse(localStorage.getItem(Y)??"[]")}catch{return[]}}function be(o){try{localStorage.setItem(Y,JSON.stringify(o.slice(0,ge)))}catch{}}function xe(o){return`wss://${o}/nrp`}function u({defaultExpression:o="",resolvers:t,nrpEndpoint:x,showResolver:X=!0,onConnect:k,onMessage:Z,onDisconnect:N,onStateChange:j,variant:ee="bar",sx:d}){var L,W;const[w,P]=s.useState(o),[ne,T]=s.useState(!1),B=s.useRef(null),c=s.useMemo(()=>t??pe(),[]),[E,ae]=s.useState(fe),re=s.useMemo(()=>{const a=[...E,...c.map(i=>i.label)];return[...new Set(a)]},[E,c]),[m,te]=s.useState(()=>{var a;return((a=c.find(i=>i.ws===x))==null?void 0:a.label)??c[0].label}),[h,ie]=s.useState(""),se=s.useMemo(()=>{const a=c.find(i=>i.label===m);return(a==null?void 0:a.ws)??xe(m)},[m,c]),le=s.useMemo(()=>{var a;return((a=c.find(i=>i.label===m))==null?void 0:a.kind)??"public"},[m,c]),{channel:n,open:C,disconnect:g}=me(se,Z),p=ye[n.state],I=ve.includes(n.state);s.useEffect(()=>{n.state==="connected"&&(k==null||k(n))},[n.state]),s.useEffect(()=>{n.state==="disconnected"&&(N==null||N())},[n.state]),s.useEffect(()=>{j==null||j(n.state)},[n.state]);const A=s.useCallback(a=>{const i=a.trim();i&&(te(i),g(),ae(ue=>{const M=[i,...ue.filter(ce=>ce!==i)];return be(M),M}))},[g]),q=s.useCallback(()=>{C(w.trim())},[w,C]),oe=a=>{var i;a.key==="Enter"&&q(),a.key==="Escape"&&(g(),P(""),(i=B.current)==null||i.blur())},D=((L=n.expression)==null?void 0:L.canonical)??((W=n.expression)==null?void 0:W.raw)??"";return ee==="bubble"?e.jsxs(e.Fragment,{children:[e.jsx(F,{styles:{"@keyframes beatle-pulse":{"0%,100%":{opacity:.6},"50%":{opacity:1}}}}),e.jsx(r,{title:D?`me://${D} — ${V[n.state]}`:"Beatle — NRP channel",onClick:()=>n.state==="connected"||n.state==="streaming"?g():q(),sx:[{display:"inline-flex",alignItems:"center",cursor:"pointer",userSelect:"none"},...Array.isArray(d)?d:[d]],children:e.jsx("span",{style:{fontSize:22,color:p,filter:`drop-shadow(0 0 4px ${p})`,lineHeight:1,animation:I?"beatle-pulse 1s ease-in-out infinite":"none"},children:"𓆣"})})]}):e.jsxs(e.Fragment,{children:[e.jsx(F,{styles:{"@keyframes beatle-pulse":{"0%,100%":{opacity:.6},"50%":{opacity:1}}}}),e.jsxs(r,{sx:[{display:"flex",alignItems:"center",gap:.75,width:"100%",height:44,px:1.5,borderRadius:2,border:"1px solid",borderColor:ne?p:"divider",bgcolor:"background.paper",transition:"border-color 0.2s ease"},...Array.isArray(d)?d:[d]],children:[e.jsx(r,{sx:{fontSize:18,lineHeight:1,color:p,flexShrink:0,transition:"color 0.3s ease",animation:I?"beatle-pulse 1s ease-in-out infinite":"none",cursor:"pointer",userSelect:"none"},onClick:()=>n.state==="connected"||n.state==="streaming"?g():q(),title:n.state==="connected"||n.state==="streaming"?"Disconnect":"Open channel",children:"𓆣"}),e.jsx(r,{ref:B,component:"input",value:w,onChange:a=>P(a.target.value),onKeyDown:oe,onFocus:()=>T(!0),onBlur:()=>T(!1),placeholder:"username @ namespace [surface] / path",spellCheck:!1,autoComplete:"off",sx:{flex:1,border:"none",outline:"none",background:"transparent",color:"text.primary",fontFamily:"monospace",fontSize:"0.82rem",fontWeight:500,minWidth:0,"&::placeholder":{color:"text.disabled",fontStyle:"italic"}}}),X&&e.jsxs(e.Fragment,{children:[e.jsx(r,{sx:{width:"1px",height:20,bgcolor:"divider",flexShrink:0}}),e.jsxs(r,{sx:{display:"flex",alignItems:"center",gap:.5,flexShrink:0},children:[e.jsx(r,{sx:{width:6,height:6,borderRadius:"50%",bgcolor:he[le],flexShrink:0}}),e.jsx(r,{component:"input",list:"beatle-resolvers",value:h,onChange:a=>ie(a.target.value),onBlur:()=>{h.trim()&&A(h)},onKeyDown:a=>{a.key==="Enter"&&(A(h),a.currentTarget.blur())},placeholder:"namespace",spellCheck:!1,autoComplete:"off",sx:{border:"none",outline:"none",background:"transparent",color:"text.secondary",fontFamily:"monospace",fontSize:"0.68rem",fontWeight:500,width:120,"&::placeholder":{color:"text.disabled",fontStyle:"italic"}}}),e.jsx("datalist",{id:"beatle-resolvers",children:re.map(a=>e.jsx("option",{value:a},a))})]})]}),n.state!=="idle"&&e.jsx(l,{variant:"caption",sx:{flexShrink:0,fontSize:"0.7rem",fontWeight:600,color:p,transition:"color 0.3s ease",whiteSpace:"nowrap"},children:V[n.state]}),(n.state==="connected"||n.state==="streaming")&&n.resolved.length>0&&e.jsx(r,{sx:{flexShrink:0,px:.75,py:.25,borderRadius:1,bgcolor:n.state==="streaming"?"rgba(79,195,247,0.12)":"rgba(102,187,106,0.12)",border:`1px solid ${n.state==="streaming"?"rgba(79,195,247,0.3)":"rgba(102,187,106,0.3)"}`},children:e.jsxs(l,{variant:"caption",sx:{fontSize:"0.65rem",color:p,fontFamily:"monospace"},children:[n.resolved.length," endpoint",n.resolved.length>1?"s":""]})})]})]})}u.__docgenInfo={description:"",methods:[],displayName:"Beatle",props:{defaultExpression:{required:!1,tsType:{name:"string"},description:"",defaultValue:{value:"''",computed:!1}},resolvers:{required:!1,tsType:{name:"Array",elements:[{name:"signature",type:"object",raw:`{
  /** Display label — the namespace identity of the resolver, e.g. "mymac.local" or "cleaker.me" */
  label: string;
  /** WebSocket URL for nrp.open */
  ws: string;
  kind: 'local' | 'public';
}`,signature:{properties:[{key:"label",value:{name:"string",required:!0},description:'Display label — the namespace identity of the resolver, e.g. "mymac.local" or "cleaker.me"'},{key:"ws",value:{name:"string",required:!0},description:"WebSocket URL for nrp.open"},{key:"kind",value:{name:"union",raw:"'local' | 'public'",elements:[{name:"literal",value:"'local'"},{name:"literal",value:"'public'"}],required:!0}}]}}],raw:"NRPResolver[]"},description:"Override the list of NRP resolver endpoints shown in the dropdown"},nrpEndpoint:{required:!1,tsType:{name:"string"},description:"Pre-select a resolver by ws URL"},showResolver:{required:!1,tsType:{name:"boolean"},description:`Show the resolver combobox (which server the channel connects to).
Default true — Beatle's own Storybook/standalone usage still wants it.
A host that already shows this elsewhere (e.g. CleakerLanding's own
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
independent channel to get it.`},variant:{required:!1,tsType:{name:"union",raw:"'bar' | 'bubble'",elements:[{name:"literal",value:"'bar'"},{name:"literal",value:"'bubble'"}]},description:"",defaultValue:{value:"'bar'",computed:!1}},sx:{required:!1,tsType:{name:"any"},description:""}}};const ke=[{namespace:"jabellae",kind:"monad",online:!0,endpoint:"http://127.0.0.1:4021",trust:"owner"},{namespace:"alex",kind:"monad",online:!0,endpoint:"http://127.0.0.1:4022"},{namespace:"team.acme",kind:"monad",online:!1,endpoint:"http://127.0.0.1:4023"},{namespace:"local.netget",kind:"netget",online:!0}],Cn={title:"All.This/NRP/Beatle",component:u,parameters:{layout:"padded"}},v={render:()=>e.jsxs(y,{sx:{maxWidth:480,display:"flex",flexDirection:"column",gap:2},children:[e.jsx(l,{variant:"caption",sx:{color:"text.secondary"},children:"Type a .me expression and press Enter to open a WebSocket channel via NRP."}),e.jsx(u,{defaultExpression:"jabellae"}),e.jsx(u,{defaultExpression:"jabellae + alex"}),e.jsx(u,{})]})},f={render:()=>e.jsxs(y,{sx:{display:"flex",gap:3,alignItems:"center"},children:[e.jsx(u,{variant:"bubble",defaultExpression:"jabellae"}),e.jsx(u,{variant:"bubble"})]})},b={parameters:{layout:"fullscreen"},render:()=>e.jsx(de,{TopBar:{title:"NRP",elementsRight:[{type:"action",props:{element:e.jsx(u,{sx:{width:320}})}}]},LeftBar:{elements:[{type:"link",props:{label:"Namespaces",icon:"hub"}},{type:"link",props:{label:"Channels",icon:"bolt"}},{type:"link",props:{label:"Mesh",icon:"polyline"}}]},RightBar:!1,Footer:!1,children:e.jsxs(y,{sx:{p:4,maxWidth:680,display:"flex",flexDirection:"column",gap:4},children:[e.jsxs(y,{children:[e.jsx(l,{variant:"h5",sx:{fontWeight:700,mb:.5},children:"Beatle"}),e.jsx(l,{variant:"body2",color:"text.secondary",children:"The NRP channel interface. Type any .me expression — a single namespace, a union, an intersection — and Beatle opens a bidirectional WebSocket to the resolved endpoint(s). The browser URL stays independent."})]}),e.jsx(u,{defaultExpression:"jabellae"}),e.jsx(y,{sx:{display:"flex",flexDirection:"column",gap:.75},children:["me://jabellae","me://jabellae + alex","me://jabellae ∩ team.acme","me://jabellae @ wikipedia.com",'me://(jabellae + alex) @ "https://wikipedia.com/Scarab"'].map(o=>e.jsx(l,{variant:"caption",sx:{color:"text.secondary",fontFamily:"monospace",fontSize:"0.72rem"},children:o},o))}),e.jsx(J,{rows:ke})]})})},In=["Bar","Bubble","InLayout"];var _,O,z;v.parameters={...v.parameters,docs:{...(_=v.parameters)==null?void 0:_.docs,source:{originalSource:`{
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
}`,...(z=(O=v.parameters)==null?void 0:O.docs)==null?void 0:z.source}}};var K,U,$;f.parameters={...f.parameters,docs:{...(K=f.parameters)==null?void 0:K.docs,source:{originalSource:`{
  render: () => <Box sx={{
    display: 'flex',
    gap: 3,
    alignItems: 'center'
  }}>
      <Beatle variant="bubble" defaultExpression="jabellae" />
      <Beatle variant="bubble" />
    </Box>
}`,...($=(U=f.parameters)==null?void 0:U.docs)==null?void 0:$.source}}};var H,Q,G;b.parameters={...b.parameters,docs:{...(H=b.parameters)==null?void 0:H.docs,source:{originalSource:`{
  parameters: {
    layout: 'fullscreen'
  },
  render: () => <Layout TopBar={{
    title: 'NRP',
    elementsRight: [{
      type: 'action',
      props: {
        element: <Beatle sx={{
          width: 320
        }} />
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
}`,...(G=(Q=b.parameters)==null?void 0:Q.docs)==null?void 0:G.source}}};export{v as Bar,f as Bubble,b as InLayout,In as __namedExportsOrder,Cn as default};
