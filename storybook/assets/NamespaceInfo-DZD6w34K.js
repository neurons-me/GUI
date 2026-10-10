import{c as M,r as o,j as e,B as t,b as s}from"./iframe-q72FflWy.js";import{B as I}from"./Button-DuvGvkXy.js";import"./Paper-9gdP3SeZ.js";import{Q as L}from"./QR-COYDJpjt.js";import{c as E}from"./surfaceModel-CthRgv7q.js";function N(c){const a=String(c||"").trim();return a?a.length<=18?a:`${a.slice(0,10)}…${a.slice(-8)}`:""}function B({endpoint:c="",qrValue:a="",monadLabel:y="",namespaceLabel:g="",rootNamespaceHash:p="",meLimit:w=120,surface:h=null,sx:x,"data-gui-node-id":q="NamespaceInfo","data-gui-component":j="NamespaceInfo"}){const S=M(),f=String(c||"").trim().replace(/\/+$/,""),[m,R]=o.useState(!1),u=o.useRef(null),r=E({meLimit:w,surface:h}),[b,v]=o.useState(r.effectiveLimit);o.useEffect(()=>{v(n=>!Number.isFinite(n)||n<=0?r.effectiveLimit:n)},[r.effectiveLimit]),o.useEffect(()=>{if(b===r.effectiveLimit)return;const n=window.setTimeout(()=>{v(i=>{const l=r.effectiveLimit;if(i===l)return i;const d=l-i,k=Math.max(1,Math.ceil(Math.abs(d)/3));return d>0?Math.min(l,i+k):Math.max(l,i-k)})},140);return()=>window.clearTimeout(n)},[b,r.effectiveLimit]),o.useEffect(()=>{if(u.current&&(window.clearInterval(u.current),u.current=null),!m||!f||typeof window>"u"||typeof fetch!="function")return;const n=()=>{const i=`${f}/__surface`;for(let l=0;l<3;l+=1){const d=`${Date.now()}-${l}`;fetch(`${i}?stress=${encodeURIComponent(d)}`,{method:"GET",cache:"no-store"}).catch(()=>{})}};return n(),u.current=window.setInterval(n,650),()=>{u.current&&(window.clearInterval(u.current),u.current=null)}},[f,m]),o.useEffect(()=>()=>{u.current&&window.clearInterval(u.current)},[]);const C=[[".me limit",r.meLimit],["Surface policy",r.policyLimit],["Surface budget",r.budgetRows],["CPU pressure",r.pressureCpu.toFixed(2)],["Base",r.baseLimit],["Target",r.effectiveLimit],["Applied",b]],T=!!(a||y||g||p);return e.jsxs(t,{"data-gui-node-id":q,"data-gui-component":j,sx:{border:"1px solid",borderColor:"divider",borderRadius:2,p:2,bgcolor:"background.default",...x},children:[T?e.jsxs(t,{sx:{mb:2,pb:2,borderBottom:"1px solid",borderColor:"divider",display:"grid",gridTemplateColumns:"96px minmax(0, 1fr)",gap:1.25,alignItems:"start"},children:[e.jsx(t,{sx:{width:96,height:96,borderRadius:2,overflow:"hidden",border:"1px solid",borderColor:"divider",bgcolor:"background.paper",display:"flex",alignItems:"center",justifyContent:"center"},children:a?e.jsx(L,{value:a,size:96,fg:S.palette.primary.main,ecc:"H",embedMode:"positive-overlay",embedScale:.32}):null}),e.jsxs(t,{sx:{display:"flex",flexDirection:"column",gap:.6,minWidth:0},children:[e.jsx(s,{variant:"h6",children:"Namespace"}),e.jsxs(s,{variant:"body2",sx:{color:"text.secondary"},children:["Monad: ",e.jsx(t,{component:"span",sx:{color:"text.primary",fontFamily:"monospace",wordBreak:"break-all"},children:y||"—"})]}),e.jsxs(s,{variant:"body2",sx:{color:"text.secondary"},children:["Namespace: ",e.jsx(t,{component:"span",sx:{color:"text.primary",fontFamily:"monospace"},children:g||"—"})]}),p?e.jsxs(s,{variant:"body2",sx:{color:"text.secondary"},children:["Root Hash: ",e.jsx(t,{component:"span",sx:{color:"text.primary",fontFamily:"monospace"},children:N(p)})]}):null]})]}):null,e.jsxs(t,{sx:{p:1.5,borderRadius:2,border:"1px solid",borderColor:"divider",bgcolor:"background.paper"},children:[e.jsx(s,{variant:"subtitle2",sx:{mb:1},children:"Effective Budget"}),e.jsx(s,{variant:"body2",sx:{color:"text.secondary",mb:1.25},children:"Namespace render is negotiated from `.me` intent, `surface` policy, assigned budget, and current CPU pressure."}),e.jsxs(t,{sx:{display:"flex",gap:.75,mb:1.25,flexWrap:"wrap"},children:[e.jsx(I,{size:"small",variant:m?"outlined":"text",color:m?"warning":"primary",onClick:()=>R(n=>!n),sx:{minHeight:30,px:1.1,fontSize:"0.78rem"},children:m?"Stop Stress":"Stress Test"}),e.jsx(s,{variant:"caption",sx:{color:"text.secondary",alignSelf:"center"},children:m?"Injecting request bursts into monad.ai":"Run a burst loop to watch budget collapse"})]}),C.map(([n,i])=>e.jsxs(t,{sx:{display:"flex",justifyContent:"space-between",gap:1,py:.35},children:[e.jsx(s,{variant:"body2",sx:{color:"text.secondary"},children:n}),e.jsx(s,{variant:"body2",sx:{textAlign:"right",fontFamily:n==="CPU pressure"?"monospace":"inherit"},children:String(i)})]},n))]})]})}B.__docgenInfo={description:"",methods:[],displayName:"NamespaceInfo",props:{endpoint:{required:!1,tsType:{name:"string"},description:"Endpoint the Stress Test burst is fired against.",defaultValue:{value:"''",computed:!1}},qrValue:{required:!1,tsType:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}]},description:"QR payload — the resolved namespace URL/hash to encode.",defaultValue:{value:"''",computed:!1}},monadLabel:{required:!1,tsType:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}]},description:'Formatted "name@host:port" label.',defaultValue:{value:"''",computed:!1}},namespaceLabel:{required:!1,tsType:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}]},description:"Compact root namespace name for display.",defaultValue:{value:"''",computed:!1}},rootNamespaceHash:{required:!1,tsType:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}]},description:"Full root namespace hash — masked for display.",defaultValue:{value:"''",computed:!1}},meLimit:{required:!1,tsType:{name:"number"},description:"`.me` render limit before policy/budget/pressure negotiation. Default 120.",defaultValue:{value:"120",computed:!1}},surface:{required:!1,tsType:{name:"union",raw:"Pick<CleakerSurfaceEntry, 'type' | 'status' | 'policy' | 'budget' | 'pressure'> | null",elements:[{name:"Pick",elements:[{name:"signature",type:"object",raw:`{
  monadName?: string;
  hostId: string;
  type: CleakerSurfaceType;
  trust: CleakerSurfaceTrust;
  resources: string[];
  capacity: {
    cpuCores: number | null;
    ramGb: number | null;
    storageGb: number | null;
    bandwidthMbps: number | null;
  };
  status: {
    availability: CleakerSurfaceAvailability;
    latencyMs: number | null;
    syncState: 'current' | 'stale' | 'unknown';
    lastSeen: number | null;
  };
  namespace: string;
  endpoint: string;
  rootName: string;
  usage?: {
    cpu: number;
    /** 0-1 fraction of total RAM currently in use, when reported. */
    memory?: number;
    /** 0-1 fraction of the root filesystem currently in use, when reported. */
    storage?: number;
    requestRatePer10s?: number;
  };
  pressure?: {
    cpu: number;
  };
  policy?: {
    gui?: {
      blockchain?: {
        limit?: number;
      };
    };
  };
  budget?: {
    gui?: {
      blockchain?: {
        rows?: number;
      };
    };
  };
  monitor?: {
    recentRequests?: CleakerSurfaceRequestEvent[];
  };
}`,signature:{properties:[{key:"monadName",value:{name:"string",required:!1}},{key:"hostId",value:{name:"string",required:!0}},{key:"type",value:{name:"union",raw:"'desktop' | 'mobile' | 'server' | 'browser-tab' | 'node'",elements:[{name:"literal",value:"'desktop'"},{name:"literal",value:"'mobile'"},{name:"literal",value:"'server'"},{name:"literal",value:"'browser-tab'"},{name:"literal",value:"'node'"}],required:!0}},{key:"trust",value:{name:"union",raw:"'owner' | 'trusted-peer' | 'guest'",elements:[{name:"literal",value:"'owner'"},{name:"literal",value:"'trusted-peer'"},{name:"literal",value:"'guest'"}],required:!0}},{key:"resources",value:{name:"Array",elements:[{name:"string"}],raw:"string[]",required:!0}},{key:"capacity",value:{name:"signature",type:"object",raw:`{
  cpuCores: number | null;
  ramGb: number | null;
  storageGb: number | null;
  bandwidthMbps: number | null;
}`,signature:{properties:[{key:"cpuCores",value:{name:"union",raw:"number | null",elements:[{name:"number"},{name:"null"}],required:!0}},{key:"ramGb",value:{name:"union",raw:"number | null",elements:[{name:"number"},{name:"null"}],required:!0}},{key:"storageGb",value:{name:"union",raw:"number | null",elements:[{name:"number"},{name:"null"}],required:!0}},{key:"bandwidthMbps",value:{name:"union",raw:"number | null",elements:[{name:"number"},{name:"null"}],required:!0}}]},required:!0}},{key:"status",value:{name:"signature",type:"object",raw:`{
  availability: CleakerSurfaceAvailability;
  latencyMs: number | null;
  syncState: 'current' | 'stale' | 'unknown';
  lastSeen: number | null;
}`,signature:{properties:[{key:"availability",value:{name:"union",raw:"'online' | 'offline' | 'sleep' | 'unknown'",elements:[{name:"literal",value:"'online'"},{name:"literal",value:"'offline'"},{name:"literal",value:"'sleep'"},{name:"literal",value:"'unknown'"}],required:!0}},{key:"latencyMs",value:{name:"union",raw:"number | null",elements:[{name:"number"},{name:"null"}],required:!0}},{key:"syncState",value:{name:"union",raw:"'current' | 'stale' | 'unknown'",elements:[{name:"literal",value:"'current'"},{name:"literal",value:"'stale'"},{name:"literal",value:"'unknown'"}],required:!0}},{key:"lastSeen",value:{name:"union",raw:"number | null",elements:[{name:"number"},{name:"null"}],required:!0}}]},required:!0}},{key:"namespace",value:{name:"string",required:!0}},{key:"endpoint",value:{name:"string",required:!0}},{key:"rootName",value:{name:"string",required:!0}},{key:"usage",value:{name:"signature",type:"object",raw:`{
  cpu: number;
  /** 0-1 fraction of total RAM currently in use, when reported. */
  memory?: number;
  /** 0-1 fraction of the root filesystem currently in use, when reported. */
  storage?: number;
  requestRatePer10s?: number;
}`,signature:{properties:[{key:"cpu",value:{name:"number",required:!0}},{key:"memory",value:{name:"number",required:!1},description:"0-1 fraction of total RAM currently in use, when reported."},{key:"storage",value:{name:"number",required:!1},description:"0-1 fraction of the root filesystem currently in use, when reported."},{key:"requestRatePer10s",value:{name:"number",required:!1}}]},required:!1}},{key:"pressure",value:{name:"signature",type:"object",raw:`{
  cpu: number;
}`,signature:{properties:[{key:"cpu",value:{name:"number",required:!0}}]},required:!1}},{key:"policy",value:{name:"signature",type:"object",raw:`{
  gui?: {
    blockchain?: {
      limit?: number;
    };
  };
}`,signature:{properties:[{key:"gui",value:{name:"signature",type:"object",raw:`{
  blockchain?: {
    limit?: number;
  };
}`,signature:{properties:[{key:"blockchain",value:{name:"signature",type:"object",raw:`{
  limit?: number;
}`,signature:{properties:[{key:"limit",value:{name:"number",required:!1}}]},required:!1}}]},required:!1}}]},required:!1}},{key:"budget",value:{name:"signature",type:"object",raw:`{
  gui?: {
    blockchain?: {
      rows?: number;
    };
  };
}`,signature:{properties:[{key:"gui",value:{name:"signature",type:"object",raw:`{
  blockchain?: {
    rows?: number;
  };
}`,signature:{properties:[{key:"blockchain",value:{name:"signature",type:"object",raw:`{
  rows?: number;
}`,signature:{properties:[{key:"rows",value:{name:"number",required:!1}}]},required:!1}}]},required:!1}}]},required:!1}},{key:"monitor",value:{name:"signature",type:"object",raw:`{
  recentRequests?: CleakerSurfaceRequestEvent[];
}`,signature:{properties:[{key:"recentRequests",value:{name:"Array",elements:[{name:"signature",type:"object",raw:`{
  id: number;
  timestamp: number;
  method: string;
  url: string;
  status: number;
  durationMs: number;
  host: string;
  namespace: string;
  operation: string;
  nrp: string;
  lens: string;
  forwardedHost: string | null;
}`,signature:{properties:[{key:"id",value:{name:"number",required:!0}},{key:"timestamp",value:{name:"number",required:!0}},{key:"method",value:{name:"string",required:!0}},{key:"url",value:{name:"string",required:!0}},{key:"status",value:{name:"number",required:!0}},{key:"durationMs",value:{name:"number",required:!0}},{key:"host",value:{name:"string",required:!0}},{key:"namespace",value:{name:"string",required:!0}},{key:"operation",value:{name:"string",required:!0}},{key:"nrp",value:{name:"string",required:!0}},{key:"lens",value:{name:"string",required:!0}},{key:"forwardedHost",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!0}}]}}],raw:"CleakerSurfaceRequestEvent[]",required:!1}}]},required:!1}}]}},{name:"union",raw:"'type' | 'status' | 'policy' | 'budget' | 'pressure'",elements:[{name:"literal",value:"'type'"},{name:"literal",value:"'status'"},{name:"literal",value:"'policy'"},{name:"literal",value:"'budget'"},{name:"literal",value:"'pressure'"}]}],raw:"Pick<CleakerSurfaceEntry, 'type' | 'status' | 'policy' | 'budget' | 'pressure'>"},{name:"null"}]},description:"Surface fields the budget calc reads (type, status, policy, budget, pressure).",defaultValue:{value:"null",computed:!1}},sx:{required:!1,tsType:{name:"any"},description:""},"data-gui-node-id":{required:!1,tsType:{name:"string"},description:"",defaultValue:{value:"'NamespaceInfo'",computed:!1}},"data-gui-component":{required:!1,tsType:{name:"string"},description:"",defaultValue:{value:"'NamespaceInfo'",computed:!1}}}};export{B as N};
