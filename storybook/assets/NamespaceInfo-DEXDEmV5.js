import{d as E,r as g,j as t,B as o,T as d}from"./iframe-Dgz0DvjP.js";import{B as H}from"./Button-B3yzBwnB.js";import{Q as P}from"./QR-BWW61rs2.js";function B(n){return String(n||"").trim().toLowerCase()}function p(n){const e=B(n);return e?e.replace(/:\d+$/,""):""}function S(n){const e=p(n);return/^(localhost|127(?:\.\d{1,3}){3}|0\.0\.0\.0)$/.test(e)}function T(n){const e=p(n);return!!e&&(S(e)||e.endsWith(".local"))}function A(n){const e=p(n);return e?/(iphone|ipad|android|pixel|mobile)/.test(e)?"mobile":/(tab|browser)/.test(e)?"browser-tab":/(macbook|imac|desktop|laptop|notebook|pc|workstation|\.local$)/.test(e)||S(e)?"desktop":"server":"node"}function F(n){return T(n)?"owner":"trusted-peer"}function $(n,e){const r=new Set(["public_ingress","keychain"]);return n==="desktop"?(r.add("filesystem"),r.add("gpu"),r.add("camera")):n==="mobile"?r.add("camera"):n==="server"&&r.add("filesystem"),T(e)&&r.add("local_lan"),Array.from(r)}function z(n){const e=p(n.namespaceHandle||"");if(e&&!S(e))return e;const r=p(n.resolverHostName||"");if(r&&!S(r))return r;const s=p(n.rootHostNamespace||"");return s||e||r||s}function C(n,e){const r=Number(n);return Number.isFinite(r)&&r>0?r:e}function G(n,e){const r=Number(n);return Number.isFinite(r)?r<0?0:r>1?1:r:e}function V(n){var f,y;const e=String((n==null?void 0:n.type)||"").trim().toLowerCase(),r=String(((f=n==null?void 0:n.status)==null?void 0:f.availability)||"").trim().toLowerCase(),s=String(((y=n==null?void 0:n.status)==null?void 0:y.syncState)||"").trim().toLowerCase(),u=r==="online"||s==="current";return e==="mobile"||e==="browser-tab"?{policyLimit:48,budgetRows:24,pressureCpu:u?.4:.65}:e==="server"||e==="node"?{policyLimit:100,budgetRows:60,pressureCpu:u?.2:.45}:{policyLimit:80,budgetRows:50,pressureCpu:u?.3:.55}}function U(n){var k,h,v,m,x,l,a;const e=n.surface||null,r=V(e||{}),s=C(n.meLimit,120),u=C((v=(h=(k=e==null?void 0:e.policy)==null?void 0:k.gui)==null?void 0:h.blockchain)==null?void 0:v.limit,r.policyLimit),f=C((l=(x=(m=e==null?void 0:e.budget)==null?void 0:m.gui)==null?void 0:x.blockchain)==null?void 0:l.rows,r.budgetRows),y=G((a=e==null?void 0:e.pressure)==null?void 0:a.cpu,r.pressureCpu),w=Math.min(s,u,f),j=Math.max(5,Math.floor(w*(1-y)));return{meLimit:s,policyLimit:u,budgetRows:f,pressureCpu:y,baseLimit:w,effectiveLimit:j}}function K(n){const e=p(n.resolverHostName||"")||p(n.rootHostNamespace||"")||p(n.namespaceHandle||"")||"unknown-host",r=A(e),s=F(e),u=n.connected?"online":"offline";return{monadName:"",hostId:e,type:r,trust:s,resources:$(r,e),capacity:{cpuCores:null,ramGb:null,storageGb:null,bandwidthMbps:null},status:{availability:u,latencyMs:null,syncState:n.connected?"current":"unknown",lastSeen:n.connected?Date.now():null},namespace:String(n.namespaceUrl||"").trim(),endpoint:String(n.endpoint||"").trim(),rootName:z(n),usage:{cpu:0,requestRatePer10s:0},pressure:{cpu:0},policy:{gui:{blockchain:{limit:80}}},budget:{gui:{blockchain:{rows:50}}},monitor:{recentRequests:[]}}}function _(n){const e=String(n||"").trim();return e?e.length<=18?e:`${e.slice(0,10)}…${e.slice(-8)}`:""}function D({endpoint:n="",qrValue:e="",monadLabel:r="",namespaceLabel:s="",rootNamespaceHash:u="",meLimit:f=120,surface:y=null,sx:w,"data-gui-node-id":j="NamespaceInfo","data-gui-component":k="NamespaceInfo"}){const h=E(),v=String(n||"").trim().replace(/\/+$/,""),[m,x]=g.useState(!1),l=g.useRef(null),a=U({meLimit:f,surface:y}),[R,L]=g.useState(a.effectiveLimit);g.useEffect(()=>{L(i=>!Number.isFinite(i)||i<=0?a.effectiveLimit:i)},[a.effectiveLimit]),g.useEffect(()=>{if(R===a.effectiveLimit)return;const i=window.setTimeout(()=>{L(c=>{const b=a.effectiveLimit;if(c===b)return c;const q=b-c,N=Math.max(1,Math.ceil(Math.abs(q)/3));return q>0?Math.min(b,c+N):Math.max(b,c-N)})},140);return()=>window.clearTimeout(i)},[R,a.effectiveLimit]),g.useEffect(()=>{if(l.current&&(window.clearInterval(l.current),l.current=null),!m||!v||typeof window>"u"||typeof fetch!="function")return;const i=()=>{const c=`${v}/__surface`;for(let b=0;b<3;b+=1){const q=`${Date.now()}-${b}`;fetch(`${c}?stress=${encodeURIComponent(q)}`,{method:"GET",cache:"no-store"}).catch(()=>{})}};return i(),l.current=window.setInterval(i,650),()=>{l.current&&(window.clearInterval(l.current),l.current=null)}},[v,m]),g.useEffect(()=>()=>{l.current&&window.clearInterval(l.current)},[]);const M=[[".me limit",a.meLimit],["Surface policy",a.policyLimit],["Surface budget",a.budgetRows],["CPU pressure",a.pressureCpu.toFixed(2)],["Base",a.baseLimit],["Target",a.effectiveLimit],["Applied",R]],I=!!(e||r||s||u);return t.jsxs(o,{"data-gui-node-id":j,"data-gui-component":k,sx:{border:"1px solid",borderColor:"divider",borderRadius:2,p:2,bgcolor:"background.default",...w},children:[I?t.jsxs(o,{sx:{mb:2,pb:2,borderBottom:"1px solid",borderColor:"divider",display:"grid",gridTemplateColumns:"96px minmax(0, 1fr)",gap:1.25,alignItems:"start"},children:[t.jsx(o,{sx:{width:96,height:96,borderRadius:2,overflow:"hidden",border:"1px solid",borderColor:"divider",bgcolor:"background.paper",display:"flex",alignItems:"center",justifyContent:"center"},children:e?t.jsx(P,{value:e,size:96,fg:h.palette.primary.main,ecc:"H",embedMode:"positive-overlay",embedScale:.32}):null}),t.jsxs(o,{sx:{display:"flex",flexDirection:"column",gap:.6,minWidth:0},children:[t.jsx(d,{variant:"h6",children:"Namespace"}),t.jsxs(d,{variant:"body2",sx:{color:"text.secondary"},children:["Monad: ",t.jsx(o,{component:"span",sx:{color:"text.primary",fontFamily:"monospace",wordBreak:"break-all"},children:r||"—"})]}),t.jsxs(d,{variant:"body2",sx:{color:"text.secondary"},children:["Namespace: ",t.jsx(o,{component:"span",sx:{color:"text.primary",fontFamily:"monospace"},children:s||"—"})]}),u?t.jsxs(d,{variant:"body2",sx:{color:"text.secondary"},children:["Root Hash: ",t.jsx(o,{component:"span",sx:{color:"text.primary",fontFamily:"monospace"},children:_(u)})]}):null]})]}):null,t.jsxs(o,{sx:{p:1.5,borderRadius:2,border:"1px solid",borderColor:"divider",bgcolor:"background.paper"},children:[t.jsx(d,{variant:"subtitle2",sx:{mb:1},children:"Effective Budget"}),t.jsx(d,{variant:"body2",sx:{color:"text.secondary",mb:1.25},children:"Namespace render is negotiated from `.me` intent, `surface` policy, assigned budget, and current CPU pressure."}),t.jsxs(o,{sx:{display:"flex",gap:.75,mb:1.25,flexWrap:"wrap"},children:[t.jsx(H,{size:"small",variant:m?"outlined":"text",color:m?"warning":"primary",onClick:()=>x(i=>!i),sx:{minHeight:30,px:1.1,fontSize:"0.78rem"},children:m?"Stop Stress":"Stress Test"}),t.jsx(d,{variant:"caption",sx:{color:"text.secondary",alignSelf:"center"},children:m?"Injecting request bursts into monad.ai":"Run a burst loop to watch budget collapse"})]}),M.map(([i,c])=>t.jsxs(o,{sx:{display:"flex",justifyContent:"space-between",gap:1,py:.35},children:[t.jsx(d,{variant:"body2",sx:{color:"text.secondary"},children:i}),t.jsx(d,{variant:"body2",sx:{textAlign:"right",fontFamily:i==="CPU pressure"?"monospace":"inherit"},children:String(c)})]},i))]})]})}D.__docgenInfo={description:"",methods:[],displayName:"NamespaceInfo",props:{endpoint:{required:!1,tsType:{name:"string"},description:"Endpoint the Stress Test burst is fired against.",defaultValue:{value:"''",computed:!1}},qrValue:{required:!1,tsType:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}]},description:"QR payload — the resolved namespace URL/hash to encode.",defaultValue:{value:"''",computed:!1}},monadLabel:{required:!1,tsType:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}]},description:'Formatted "name@host:port" label.',defaultValue:{value:"''",computed:!1}},namespaceLabel:{required:!1,tsType:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}]},description:"Compact root namespace name for display.",defaultValue:{value:"''",computed:!1}},rootNamespaceHash:{required:!1,tsType:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}]},description:"Full root namespace hash — masked for display.",defaultValue:{value:"''",computed:!1}},meLimit:{required:!1,tsType:{name:"number"},description:"`.me` render limit before policy/budget/pressure negotiation. Default 120.",defaultValue:{value:"120",computed:!1}},surface:{required:!1,tsType:{name:"union",raw:"Pick<CleakerSurfaceEntry, 'type' | 'status' | 'policy' | 'budget' | 'pressure'> | null",elements:[{name:"Pick",elements:[{name:"signature",type:"object",raw:`{
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
}`,signature:{properties:[{key:"id",value:{name:"number",required:!0}},{key:"timestamp",value:{name:"number",required:!0}},{key:"method",value:{name:"string",required:!0}},{key:"url",value:{name:"string",required:!0}},{key:"status",value:{name:"number",required:!0}},{key:"durationMs",value:{name:"number",required:!0}},{key:"host",value:{name:"string",required:!0}},{key:"namespace",value:{name:"string",required:!0}},{key:"operation",value:{name:"string",required:!0}},{key:"nrp",value:{name:"string",required:!0}},{key:"lens",value:{name:"string",required:!0}},{key:"forwardedHost",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!0}}]}}],raw:"CleakerSurfaceRequestEvent[]",required:!1}}]},required:!1}}]}},{name:"union",raw:"'type' | 'status' | 'policy' | 'budget' | 'pressure'",elements:[{name:"literal",value:"'type'"},{name:"literal",value:"'status'"},{name:"literal",value:"'policy'"},{name:"literal",value:"'budget'"},{name:"literal",value:"'pressure'"}]}],raw:"Pick<CleakerSurfaceEntry, 'type' | 'status' | 'policy' | 'budget' | 'pressure'>"},{name:"null"}]},description:"Surface fields the budget calc reads (type, status, policy, budget, pressure).",defaultValue:{value:"null",computed:!1}},sx:{required:!1,tsType:{name:"any"},description:""},"data-gui-node-id":{required:!1,tsType:{name:"string"},description:"",defaultValue:{value:"'NamespaceInfo'",computed:!1}},"data-gui-component":{required:!1,tsType:{name:"string"},description:"",defaultValue:{value:"'NamespaceInfo'",computed:!1}}}};export{D as N,U as a,K as c,S as i,z as r};
