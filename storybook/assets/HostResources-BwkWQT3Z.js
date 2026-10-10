import{r as o,j as r,B as a,b as s}from"./iframe-q72FflWy.js";import"./Paper-9gdP3SeZ.js";import{G as Q}from"./Gauge-DyVYa28g.js";import{u as X}from"./useGuiMediaQuery-BQeqdqN6.js";import{a as Y}from"./surfaceModel-CthRgv7q.js";import{f as K}from"./runtimeUsername-BPdXKL5Q.js";const Z="This is the current host/surface entry resolved by the monad.ai surface that answered the request.";function j(d,u){return String(d||"").trim().toLowerCase().replace(/[^a-z0-9._-]+/g,"-").replace(/^-+/,"").replace(/-+$/,"")||u}function ee(d,u,p){var f;return u?{...d,...u,capacity:{...d.capacity,...u.capacity||{}},status:{...d.status,...u.status||{}},monitor:{recentRequests:(f=u.monitor)!=null&&f.recentRequests&&u.monitor.recentRequests.length>0?u.monitor.recentRequests:p}}:{...d,monitor:{recentRequests:p}}}function re({endpoint:d,namespaceUrl:u="",namespaceHandle:p="",rootHostNamespace:f="",resolverHostName:R="",initialSurface:B=void 0,initialRequestEvents:V=void 0,sx:z,"data-gui-node-id":I="HostResources","data-gui-component":P="HostResources"}){var G,L,H;const c=String(d||"").trim().replace(/\/+$/,""),v=X("(max-width: 599.95px)"),[b,k]=o.useState(!1),[y,C]=o.useState(null),[E,M]=o.useState(B??null),[x,q]=o.useState(V??[]);o.useEffect(()=>{if(!c){C(null);return}let e=!1;const t=typeof AbortController<"u"?new AbortController:null;return(async()=>{const g=await K(c,t==null?void 0:t.signal);e||C(g)})(),()=>{e=!0,t==null||t.abort()}},[c]),o.useEffect(()=>{if(!c||typeof window>"u"||typeof EventSource>"u"){M(null),q([]),k(!1);return}const e=new EventSource(`${c}/__surface/events`),t=l=>{var h;const i=l&&typeof l=="object"&&l.telemetry?l.telemetry:l;if(!i||typeof i!="object")return;M(W=>({...W||{},...i}));const m=Array.isArray((h=i==null?void 0:i.monitor)==null?void 0:h.recentRequests)?i.monitor.recentRequests:null;m&&q(m)},g=l=>{try{t(JSON.parse(String(l.data||"null")))}catch{}},N=l=>{try{const i=JSON.parse(String(l.data||"null"));t(i);const m=i==null?void 0:i.request;m&&typeof m=="object"&&q(h=>[m,...h.filter(U=>U.id!==m.id)].slice(0,24))}catch{}};return e.addEventListener("surface",g),e.addEventListener("request",N),e.onopen=()=>k(!0),e.onerror=()=>k(!1),()=>{e.removeEventListener("surface",g),e.removeEventListener("request",N),e.close()}},[c]);const w=o.useMemo(()=>{const e=y==null?void 0:y.surfaceEntry;return e?{...e,status:{...e.status,availability:b?"online":e.status.availability,syncState:b?"current":e.status.syncState,lastSeen:b?Date.now():e.status.lastSeen}}:null},[y==null?void 0:y.surfaceEntry,b]),T=o.useMemo(()=>w||Y({namespaceUrl:u,endpoint:c,namespaceHandle:p,rootHostNamespace:f,resolverHostName:R,connected:b}),[b,w,p,u,R,f,c]),n=o.useMemo(()=>ee(T,E,x),[T,E,x]),S=(e,t,g)=>`${e}-row-${g+1}-${j(t,`${e}-item`)}`,D=(e,t)=>`surface-resource-${t+1}-${j(e,"resource")}`,_=[{label:"Host ID",value:n.hostId},{label:"Type",value:n.type},{label:"Trust",value:n.trust},{label:"Root Name",value:n.rootName}],O=[{label:"Namespace",value:n.namespace},{label:"Endpoint",value:n.endpoint}],F=[{label:"CPU",ratio:((G=n.usage)==null?void 0:G.cpu)??null,totalLabel:n.capacity.cpuCores==null?"—":`${n.capacity.cpuCores} cores`},{label:"RAM",ratio:((L=n.usage)==null?void 0:L.memory)??null,totalLabel:n.capacity.ramGb==null?"—":`${n.capacity.ramGb} GB`},{label:"Storage",ratio:((H=n.usage)==null?void 0:H.storage)??null,totalLabel:n.capacity.storageGb==null?"—":`${n.capacity.storageGb} GB`}],$=n.capacity.bandwidthMbps==null?null:`${n.capacity.bandwidthMbps} Mbps available`,J=[{label:"Availability",value:n.status.availability},{label:"Sync",value:n.status.syncState},{label:"Latency (ms)",value:n.status.latencyMs},{label:"Last Seen",value:n.status.lastSeen?new Date(n.status.lastSeen).toLocaleString():null}],A=n.resources.map((e,t)=>({key:j(e,`resource-${t+1}`),resource:e}));return r.jsxs(a,{"data-gui-node-id":I,"data-gui-component":P,sx:{border:"1px solid",borderColor:"divider",borderRadius:2,p:2,bgcolor:"background.default",...z},children:[r.jsx(s,{variant:"h6",sx:{mb:1},children:"Host Resources"}),r.jsx(s,{variant:"body2",sx:{color:"text.secondary",mb:1.5},children:Z}),r.jsxs(a,{sx:{display:"grid",gridTemplateColumns:v?"minmax(0, 1fr)":"repeat(2, minmax(0, 1fr))",gap:1.5,minWidth:0},children:[r.jsxs(a,{sx:{p:1.5,borderRadius:2,border:"1px solid",borderColor:"divider",bgcolor:"background.paper",minWidth:0},children:[r.jsx(s,{variant:"subtitle2",sx:{mb:1},children:"Identity"}),_.map((e,t)=>r.jsxs(a,{"data-gui-node-id":S("surface-identity",e.label,t),sx:{display:"flex",justifyContent:"space-between",gap:1,py:.35,minWidth:0},children:[r.jsx(s,{variant:"body2",sx:{color:"text.secondary",flexShrink:0},children:e.label}),r.jsx(s,{variant:"body2",title:String(e.value||"—"),sx:{textAlign:"right",minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"},children:String(e.value||"—")})]},e.label))]}),r.jsxs(a,{sx:{p:1.5,borderRadius:2,border:"1px solid",borderColor:"divider",bgcolor:"background.paper",minWidth:0},children:[r.jsx(s,{variant:"subtitle2",sx:{mb:1},children:"Access"}),O.map((e,t)=>r.jsxs(a,{"data-gui-node-id":S("surface-access",e.label,t),sx:{py:.35},children:[r.jsx(s,{variant:"body2",sx:{color:"text.secondary"},children:e.label}),r.jsx(s,{variant:"body2",sx:{wordBreak:"break-all",mt:.25},children:String(e.value||"—")})]},e.label))]}),r.jsxs(a,{sx:{p:1.5,borderRadius:2,border:"1px solid",borderColor:"divider",bgcolor:"background.paper",minWidth:0},children:[r.jsx(s,{variant:"subtitle2",sx:{mb:1},children:"Resources"}),r.jsx(a,{sx:{display:"flex",flexWrap:"wrap",gap:.75},children:A.length?A.map((e,t)=>r.jsx(a,{"data-gui-node-id":D(e.resource,t),sx:{px:1,py:.45,borderRadius:999,border:"1px solid",borderColor:"divider",bgcolor:"background.default"},children:r.jsx(s,{variant:"caption",children:e.resource})},e.key)):r.jsx(s,{variant:"body2",sx:{color:"text.secondary"},children:"No resources advertised yet."})})]}),r.jsxs(a,{sx:{p:1.5,borderRadius:2,border:"1px solid",borderColor:"divider",bgcolor:"background.paper",gridColumn:v?"auto":"1 / -1",minWidth:0},children:[r.jsx(s,{variant:"subtitle2",sx:{mb:1},children:"Capacity"}),r.jsx(a,{sx:{display:"flex",flexWrap:"wrap",gap:1.5},children:F.map(e=>r.jsx(Q,{label:e.label,ratio:e.ratio,totalLabel:e.totalLabel,size:84},e.label))}),$?r.jsx(s,{variant:"caption",sx:{display:"block",color:"text.secondary",mt:1.25},children:$}):null]}),r.jsxs(a,{sx:{p:1.5,borderRadius:2,border:"1px solid",borderColor:"divider",bgcolor:"background.paper",gridColumn:v?"auto":"1 / -1",minWidth:0},children:[r.jsx(s,{variant:"subtitle2",sx:{mb:1},children:"Status"}),r.jsx(a,{sx:{display:"grid",gridTemplateColumns:v?"minmax(0, 1fr)":"repeat(2, minmax(0, 1fr))",gap:1},children:J.map((e,t)=>r.jsxs(a,{"data-gui-node-id":S("surface-status",e.label,t),sx:{py:.35,minWidth:0},children:[r.jsx(s,{variant:"body2",sx:{color:"text.secondary"},children:e.label}),r.jsx(s,{variant:"body2",sx:{mt:.25,wordBreak:"break-word"},children:e.value==null||e.value===""?"—":String(e.value)})]},e.label))})]}),r.jsxs(a,{sx:{p:1.5,borderRadius:2,border:"1px solid",borderColor:"divider",bgcolor:"background.paper",gridColumn:v?"auto":"1 / -1"},children:[r.jsx(s,{variant:"subtitle2",sx:{mb:1},children:"Active Requests"}),x.length===0?r.jsx(s,{variant:"body2",sx:{color:"text.secondary"},children:"Waiting for request traffic..."}):r.jsx(a,{sx:{mt:.25,p:1,borderRadius:1.5,border:"1px solid",borderColor:"divider",bgcolor:"background.default",height:220,minHeight:140,resize:"vertical",overflowY:"auto",overflowX:"hidden",fontFamily:"monospace",fontSize:"0.76rem",lineHeight:1.45,fontVariantNumeric:"tabular-nums"},children:x.slice(0,40).map(e=>r.jsxs(s,{variant:"caption",title:`${e.method} ${e.status} ${e.durationMs}ms ${e.url} ${new Date(e.timestamp).toLocaleTimeString()} · ${e.namespace||"—"} · ${e.operation||"read"}`,sx:{display:"block",color:"text.primary",fontFamily:"inherit",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis","&:not(:last-child)":{mb:.45}},children:[r.jsxs(a,{component:"span",sx:{color:"primary.main",fontWeight:700},children:[e.method," ",e.status]})," ",r.jsxs(a,{component:"span",sx:{color:"text.secondary"},children:[e.durationMs,"ms"]})," ",r.jsx(a,{component:"span",sx:{color:"text.primary"},children:e.url})," ",r.jsxs(a,{component:"span",sx:{color:"text.secondary"},children:[new Date(e.timestamp).toLocaleTimeString()," · ",e.namespace||"—"," · ",e.operation||"read"]})]},e.id))})]})]})]})}re.__docgenInfo={description:"",methods:[],displayName:"HostResources",props:{endpoint:{required:!0,tsType:{name:"string"},description:"The monad endpoint to poll for this surface's resources/status."},namespaceUrl:{required:!1,tsType:{name:"string"},description:"",defaultValue:{value:"''",computed:!1}},namespaceHandle:{required:!1,tsType:{name:"string"},description:"",defaultValue:{value:"''",computed:!1}},rootHostNamespace:{required:!1,tsType:{name:"string"},description:"",defaultValue:{value:"''",computed:!1}},resolverHostName:{required:!1,tsType:{name:"string"},description:"",defaultValue:{value:"''",computed:!1}},initialSurface:{required:!1,tsType:{name:"Partial",elements:[{name:"signature",type:"object",raw:`{
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
}`,signature:{properties:[{key:"id",value:{name:"number",required:!0}},{key:"timestamp",value:{name:"number",required:!0}},{key:"method",value:{name:"string",required:!0}},{key:"url",value:{name:"string",required:!0}},{key:"status",value:{name:"number",required:!0}},{key:"durationMs",value:{name:"number",required:!0}},{key:"host",value:{name:"string",required:!0}},{key:"namespace",value:{name:"string",required:!0}},{key:"operation",value:{name:"string",required:!0}},{key:"nrp",value:{name:"string",required:!0}},{key:"lens",value:{name:"string",required:!0}},{key:"forwardedHost",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!0}}]}}],raw:"CleakerSurfaceRequestEvent[]",required:!1}}]},required:!1}}]}}],raw:"Partial<CleakerSurfaceEntry>"},description:"Storybook/demo only — seeds initial telemetry before any live event arrives.",defaultValue:{value:"undefined",computed:!0}},initialRequestEvents:{required:!1,tsType:{name:"Array",elements:[{name:"signature",type:"object",raw:`{
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
}`,signature:{properties:[{key:"id",value:{name:"number",required:!0}},{key:"timestamp",value:{name:"number",required:!0}},{key:"method",value:{name:"string",required:!0}},{key:"url",value:{name:"string",required:!0}},{key:"status",value:{name:"number",required:!0}},{key:"durationMs",value:{name:"number",required:!0}},{key:"host",value:{name:"string",required:!0}},{key:"namespace",value:{name:"string",required:!0}},{key:"operation",value:{name:"string",required:!0}},{key:"nrp",value:{name:"string",required:!0}},{key:"lens",value:{name:"string",required:!0}},{key:"forwardedHost",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!0}}]}}],raw:"CleakerSurfaceRequestEvent[]"},description:"Storybook/demo only — seeds the initial Active Requests list.",defaultValue:{value:"undefined",computed:!0}},sx:{required:!1,tsType:{name:"any"},description:""},"data-gui-node-id":{required:!1,tsType:{name:"string"},description:"",defaultValue:{value:"'HostResources'",computed:!1}},"data-gui-component":{required:!1,tsType:{name:"string"},description:"",defaultValue:{value:"'HostResources'",computed:!1}}}};export{re as H};
