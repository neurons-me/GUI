import{j as r,g as u,b as T,r as m,G as ee}from"./iframe-q72FflWy.js";import{I as re}from"./Icon-Doq3uhPc.js";import"./preload-helper-Dp1pzeXC.js";function W({item:e,interaction:n,isDragSource:s,isDropTarget:d,onPointerDown:c,onPointerUp:p,onClick:x,onDragStart:w,onDragOver:f,onDrop:q,onDragLeave:v}){const y=n==="wiggle"||n==="dragging";return r.jsxs(u,{draggable:y,onPointerDown:()=>c(e.id),onPointerUp:p,onPointerCancel:p,onClick:()=>!y&&x(e),onDragStart:l=>w(e.id,l),onDragOver:l=>f(e.id,l),onDrop:()=>q(e.id),onDragLeave:v,sx:{display:"flex",flexDirection:"column",alignItems:"center",gap:.75,cursor:y?"grab":"pointer",userSelect:"none",WebkitUserSelect:"none",opacity:s?.3:1,transition:"opacity 0.15s ease, transform 0.15s ease",animation:y&&!s?"col-wiggle 0.22s ease-in-out infinite alternate":"none",outline:d?"2px solid":"none",outlineColor:"primary.main",borderRadius:2,p:.5},children:[r.jsx(u,{sx:{width:52,height:52,borderRadius:2.5,bgcolor:e.color??"action.selected",border:"1px solid",borderColor:"divider",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",flexShrink:0},children:e.image?r.jsx(u,{component:"img",src:e.image,alt:e.label,sx:{width:"100%",height:"100%",objectFit:"cover"}}):e.icon?r.jsx(u,{sx:{fontSize:26,lineHeight:1},children:e.icon}):r.jsx(re,{name:"crop_square",fontSize:"1.4rem"})}),r.jsx(T,{variant:"caption",sx:{fontSize:"0.7rem",fontWeight:500,textAlign:"center",lineHeight:1.2,maxWidth:60,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",color:"text.primary"},children:e.label})]})}W.__docgenInfo={description:"",methods:[],displayName:"CollectionItem",props:{item:{required:!0,tsType:{name:"signature",type:"object",raw:`{
  id: string;
  label: string;
  icon?: string;
  image?: string;
  color?: string;
  data?: unknown;
}`,signature:{properties:[{key:"id",value:{name:"string",required:!0}},{key:"label",value:{name:"string",required:!0}},{key:"icon",value:{name:"string",required:!1}},{key:"image",value:{name:"string",required:!1}},{key:"color",value:{name:"string",required:!1}},{key:"data",value:{name:"unknown",required:!1}}]}},description:""},interaction:{required:!0,tsType:{name:"union",raw:"'idle' | 'wiggle' | 'dragging' | 'expanded'",elements:[{name:"literal",value:"'idle'"},{name:"literal",value:"'wiggle'"},{name:"literal",value:"'dragging'"},{name:"literal",value:"'expanded'"}]},description:""},isDragSource:{required:!0,tsType:{name:"boolean"},description:""},isDropTarget:{required:!0,tsType:{name:"boolean"},description:""},onPointerDown:{required:!0,tsType:{name:"signature",type:"function",raw:"(id: string) => void",signature:{arguments:[{type:{name:"string"},name:"id"}],return:{name:"void"}}},description:""},onPointerUp:{required:!0,tsType:{name:"signature",type:"function",raw:"() => void",signature:{arguments:[],return:{name:"void"}}},description:""},onClick:{required:!0,tsType:{name:"signature",type:"function",raw:"(item: CollectionItemType) => void",signature:{arguments:[{type:{name:"signature",type:"object",raw:`{
  id: string;
  label: string;
  icon?: string;
  image?: string;
  color?: string;
  data?: unknown;
}`,signature:{properties:[{key:"id",value:{name:"string",required:!0}},{key:"label",value:{name:"string",required:!0}},{key:"icon",value:{name:"string",required:!1}},{key:"image",value:{name:"string",required:!1}},{key:"color",value:{name:"string",required:!1}},{key:"data",value:{name:"unknown",required:!1}}]}},name:"item"}],return:{name:"void"}}},description:""},onDragStart:{required:!0,tsType:{name:"signature",type:"function",raw:"(id: string, e: React.DragEvent) => void",signature:{arguments:[{type:{name:"string"},name:"id"},{type:{name:"ReactDragEvent",raw:"React.DragEvent"},name:"e"}],return:{name:"void"}}},description:""},onDragOver:{required:!0,tsType:{name:"signature",type:"function",raw:"(id: string, e: React.DragEvent) => void",signature:{arguments:[{type:{name:"string"},name:"id"},{type:{name:"ReactDragEvent",raw:"React.DragEvent"},name:"e"}],return:{name:"void"}}},description:""},onDrop:{required:!0,tsType:{name:"signature",type:"function",raw:"(id: string) => void",signature:{arguments:[{type:{name:"string"},name:"id"}],return:{name:"void"}}},description:""},onDragLeave:{required:!0,tsType:{name:"signature",type:"function",raw:"() => void",signature:{arguments:[],return:{name:"void"}}},description:""}}};function Y({group:e,items:n,interaction:s,isExpanded:d,isDropTarget:c,onClick:p,onDragOver:x,onDrop:w,onDragLeave:f,onLabelChange:q}){const v=s==="wiggle"||s==="dragging",y=n.slice(0,4);return r.jsxs(u,{onClick:()=>!v&&p(e.id),onDragOver:l=>x(e.id,l),onDrop:()=>w(e.id),onDragLeave:f,sx:{display:"flex",flexDirection:"column",alignItems:"center",gap:.75,cursor:v?"default":"pointer",userSelect:"none",animation:v?"col-wiggle 0.22s ease-in-out infinite alternate":"none",outline:c?"2px solid":"none",outlineColor:"primary.main",borderRadius:2,p:.5},children:[r.jsxs(u,{sx:{width:52,height:52,borderRadius:2.5,bgcolor:"action.selected",border:"1px solid",borderColor:c?"primary.main":"divider",display:"grid",gridTemplateColumns:"1fr 1fr",gridTemplateRows:"1fr 1fr",gap:"2px",p:"5px",overflow:"hidden",flexShrink:0,transition:"border-color 0.15s ease, transform 0.15s ease",...c&&{transform:"scale(1.06)"}},children:[y.map(l=>r.jsx(u,{sx:{borderRadius:.75,bgcolor:l.color??"background.default",border:"1px solid",borderColor:"divider",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.65rem",overflow:"hidden"},children:l.image?r.jsx(u,{component:"img",src:l.image,alt:"",sx:{width:"100%",height:"100%",objectFit:"cover"}}):r.jsx(u,{sx:{fontSize:"0.75rem",lineHeight:1},children:l.icon??"·"})},l.id)),Array.from({length:Math.max(0,4-y.length)}).map((l,S)=>r.jsx(u,{sx:{borderRadius:.75,bgcolor:"background.default",border:"1px solid",borderColor:"divider"}},`empty-${S}`))]}),v&&q?r.jsx(u,{component:"input",defaultValue:e.label,onBlur:l=>q(e.id,l.target.value),onClick:l=>l.stopPropagation(),sx:{fontSize:"0.7rem",fontWeight:500,textAlign:"center",border:"none",background:"transparent",color:"text.primary",width:64,outline:"none",borderBottom:"1px solid",borderColor:"divider",p:0}}):r.jsxs(T,{variant:"caption",sx:{fontSize:"0.7rem",fontWeight:500,textAlign:"center",lineHeight:1.2,maxWidth:64,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",color:"text.primary"},children:[e.label,n.length>4&&r.jsxs(u,{component:"span",sx:{color:"text.secondary"},children:[" +",n.length-4]})]})]})}Y.__docgenInfo={description:"",methods:[],displayName:"CollectionGroup",props:{group:{required:!0,tsType:{name:"signature",type:"object",raw:`{
  id: string;
  label: string;
  itemIds: string[];
}`,signature:{properties:[{key:"id",value:{name:"string",required:!0}},{key:"label",value:{name:"string",required:!0}},{key:"itemIds",value:{name:"Array",elements:[{name:"string"}],raw:"string[]",required:!0}}]}},description:""},items:{required:!0,tsType:{name:"Array",elements:[{name:"signature",type:"object",raw:`{
  id: string;
  label: string;
  icon?: string;
  image?: string;
  color?: string;
  data?: unknown;
}`,signature:{properties:[{key:"id",value:{name:"string",required:!0}},{key:"label",value:{name:"string",required:!0}},{key:"icon",value:{name:"string",required:!1}},{key:"image",value:{name:"string",required:!1}},{key:"color",value:{name:"string",required:!1}},{key:"data",value:{name:"unknown",required:!1}}]}}],raw:"CollectionItem[]"},description:""},interaction:{required:!0,tsType:{name:"union",raw:"'idle' | 'wiggle' | 'dragging' | 'expanded'",elements:[{name:"literal",value:"'idle'"},{name:"literal",value:"'wiggle'"},{name:"literal",value:"'dragging'"},{name:"literal",value:"'expanded'"}]},description:""},isExpanded:{required:!0,tsType:{name:"boolean"},description:""},isDropTarget:{required:!0,tsType:{name:"boolean"},description:""},onClick:{required:!0,tsType:{name:"signature",type:"function",raw:"(id: string) => void",signature:{arguments:[{type:{name:"string"},name:"id"}],return:{name:"void"}}},description:""},onDragOver:{required:!0,tsType:{name:"signature",type:"function",raw:"(id: string, e: React.DragEvent) => void",signature:{arguments:[{type:{name:"string"},name:"id"},{type:{name:"ReactDragEvent",raw:"React.DragEvent"},name:"e"}],return:{name:"void"}}},description:""},onDrop:{required:!0,tsType:{name:"signature",type:"function",raw:"(id: string) => void",signature:{arguments:[{type:{name:"string"},name:"id"}],return:{name:"void"}}},description:""},onDragLeave:{required:!0,tsType:{name:"signature",type:"function",raw:"() => void",signature:{arguments:[],return:{name:"void"}}},description:""},onLabelChange:{required:!1,tsType:{name:"signature",type:"function",raw:"(id: string, label: string) => void",signature:{arguments:[{type:{name:"string"},name:"id"},{type:{name:"string"},name:"label"}],return:{name:"void"}}},description:""}}};function ne(e,n){switch(n.type){case"WIGGLE_START":return{...e,interaction:"wiggle"};case"WIGGLE_STOP":return{...e,interaction:"idle",dragSourceId:null,dropTargetId:null};case"DRAG_START":return{...e,interaction:"dragging",dragSourceId:n.id};case"DRAG_OVER":return{...e,dropTargetId:n.id};case"DRAG_END":return{...e,interaction:"wiggle",dragSourceId:null,dropTargetId:null};case"GROUP_EXPAND":return{...e,expandedGroupId:n.id,interaction:"expanded"};case"GROUP_COLLAPSE":return{...e,expandedGroupId:null,interaction:"idle"};default:return e}}const ie=500;function te(e,n){const[s,d]=m.useReducer(ne,{interaction:"idle",dragSourceId:null,dropTargetId:null,expandedGroupId:null}),c=m.useRef(null),p=m.useCallback(()=>{c.current&&(clearTimeout(c.current),c.current=null)},[]),x=m.useCallback(a=>{s.interaction!=="wiggle"&&(c.current=setTimeout(()=>{d({type:"WIGGLE_START"})},ie))},[s.interaction]),w=m.useCallback(()=>{p()},[p]),f=m.useCallback(()=>{d({type:"WIGGLE_STOP"})},[]),q=m.useCallback((a,o)=>{o.dataTransfer.effectAllowed="move",d({type:"DRAG_START",id:a})},[]),v=m.useCallback((a,o)=>{o.preventDefault(),o.dataTransfer.dropEffect="move",a!==s.dragSourceId&&d({type:"DRAG_OVER",id:a})},[s.dragSourceId]),y=m.useCallback(a=>{const o=s.dragSourceId;if(!o||o===a){d({type:"DRAG_END"});return}const b=e.items.some(g=>g.id===o),D=e.items.some(g=>g.id===a);if((e.groups??[]).find(g=>g.id===a)){const g={...e,items:e.items.filter(t=>t.id!==o),groups:(e.groups??[]).map(t=>t.id===a?{...t,itemIds:[...t.itemIds,o]}:t)};n==null||n(g)}else if(b&&D){const g={id:`group-${Date.now()}`,label:"Group",itemIds:[o,a]},t={...e,items:e.items.filter(k=>k.id!==o&&k.id!==a),groups:[...e.groups??[],g]};n==null||n(t)}d({type:"DRAG_END"})},[s.dragSourceId,e,n]),l=m.useCallback(a=>{d({type:"GROUP_EXPAND",id:a})},[]),S=m.useCallback(()=>{d({type:"GROUP_COLLAPSE"})},[]),I=m.useCallback((a,o)=>{n==null||n({...e,groups:(e.groups??[]).map(b=>b.id===a?{...b,label:o}:b)})},[e,n]),P=m.useCallback((a,o)=>{var g;const b=(e.groups??[]).find(t=>t.id===a);if(!b)return;e.items.find(t=>t.id===o)??((g=e.groups)==null||g.flatMap(t=>t.itemIds).includes(o));const D=e.items.find(t=>t.id===o),h=b.itemIds.filter(t=>t!==o);if(h.length<2){const t=h;n==null||n({...e,items:[...e.items,...D?[D]:[],...e.items.filter(k=>t.includes(k.id))],groups:(e.groups??[]).filter(k=>k.id!==a)})}else n==null||n({...e,groups:(e.groups??[]).map(t=>t.id===a?{...t,itemIds:h}:t)})},[e,n]);return{interaction:s.interaction,dragSourceId:s.dragSourceId,dropTargetId:s.dropTargetId,expandedGroupId:s.expandedGroupId,handlePointerDown:x,handlePointerUp:w,cancelLongPress:p,stopWiggle:f,handleDragStart:q,handleDragOver:v,handleDrop:y,expandGroup:l,collapseGroup:S,renameGroup:I,removeFromGroup:P}}const ae={grid:4,rail:1,sidebar:2,mobile:3};function M({collection:e,surface:n="grid",columns:s,onSelect:d,onChange:c,renderItem:p,sx:x}){const w=s??ae[n]??4,{interaction:f,dragSourceId:q,dropTargetId:v,expandedGroupId:y,handlePointerDown:l,handlePointerUp:S,stopWiggle:I,handleDragStart:P,handleDragOver:a,handleDrop:o,expandGroup:b,collapseGroup:D,renameGroup:h}=te(e,c);m.useEffect(()=>{if(f!=="wiggle")return;const i=G=>{G.key==="Escape"&&I()};return window.addEventListener("keydown",i),()=>window.removeEventListener("keydown",i)},[f,I]);const g=()=>{},t=i=>{const G=(e.groups??[]).find(L=>L.id===i);return G?G.itemIds.map(L=>e.items.find(Z=>Z.id===L)).filter(Boolean):[]},k=i=>{d==null||d(i)},O=y?(e.groups??[]).find(i=>i.id===y):null;return r.jsxs(r.Fragment,{children:[r.jsx(ee,{styles:{"@keyframes col-wiggle":{from:{transform:"rotate(-1.5deg)"},to:{transform:"rotate(1.5deg)"}}}}),r.jsxs(u,{sx:{position:"relative",width:"100%",...x},onClick:i=>{f==="wiggle"&&i.target===i.currentTarget&&I()},children:[e.label&&r.jsx(T,{variant:"caption",sx:{display:"block",mb:1,color:"text.secondary",fontWeight:600,letterSpacing:"0.06em",textTransform:"uppercase",fontSize:"0.7rem"},children:e.label}),r.jsxs(u,{sx:{display:"grid",gridTemplateColumns:`repeat(${w}, 1fr)`,gap:1},children:[e.items.map(i=>p?r.jsx(u,{children:p(i)},i.id):r.jsx(W,{item:i,interaction:f,isDragSource:q===i.id,isDropTarget:v===i.id,onPointerDown:l,onPointerUp:S,onClick:k,onDragStart:P,onDragOver:a,onDrop:o,onDragLeave:g},i.id)),(e.groups??[]).map(i=>r.jsx(Y,{group:i,items:t(i.id),interaction:f,isExpanded:y===i.id,isDropTarget:v===i.id,onClick:b,onDragOver:a,onDrop:o,onDragLeave:g,onLabelChange:h},i.id))]}),f==="wiggle"&&r.jsx(T,{variant:"caption",onClick:I,sx:{display:"block",mt:1.5,textAlign:"center",color:"text.secondary",cursor:"pointer",fontSize:"0.7rem","&:hover":{color:"text.primary"}},children:"Drag to group · tap to finish"}),O&&r.jsxs(u,{onClick:D,sx:{position:"absolute",inset:0,bgcolor:"background.paper",borderRadius:2,border:"1px solid",borderColor:"divider",p:2,zIndex:10,display:"flex",flexDirection:"column",gap:1.5},children:[r.jsx(T,{variant:"body2",sx:{fontWeight:700,textAlign:"center"},children:O.label}),r.jsx(u,{sx:{display:"grid",gridTemplateColumns:`repeat(${Math.min(w,3)}, 1fr)`,gap:1},onClick:i=>i.stopPropagation(),children:t(O.id).map(i=>r.jsx(W,{item:i,interaction:"idle",isDragSource:!1,isDropTarget:!1,onPointerDown:()=>{},onPointerUp:()=>{},onClick:k,onDragStart:()=>{},onDragOver:()=>{},onDrop:()=>{},onDragLeave:()=>{}},i.id))}),r.jsx(T,{variant:"caption",sx:{textAlign:"center",color:"text.secondary",cursor:"pointer",fontSize:"0.7rem"},children:"tap outside to close"})]})]})]})}M.__docgenInfo={description:"",methods:[],displayName:"Collection",props:{collection:{required:!0,tsType:{name:"signature",type:"object",raw:`{
  id: string;
  label?: string;
  items: CollectionItem[];
  groups?: CollectionGroup[];
  selectedId?: string;
}`,signature:{properties:[{key:"id",value:{name:"string",required:!0}},{key:"label",value:{name:"string",required:!1}},{key:"items",value:{name:"Array",elements:[{name:"signature",type:"object",raw:`{
  id: string;
  label: string;
  icon?: string;
  image?: string;
  color?: string;
  data?: unknown;
}`,signature:{properties:[{key:"id",value:{name:"string",required:!0}},{key:"label",value:{name:"string",required:!0}},{key:"icon",value:{name:"string",required:!1}},{key:"image",value:{name:"string",required:!1}},{key:"color",value:{name:"string",required:!1}},{key:"data",value:{name:"unknown",required:!1}}]}}],raw:"CollectionItem[]",required:!0}},{key:"groups",value:{name:"Array",elements:[{name:"signature",type:"object",raw:`{
  id: string;
  label: string;
  itemIds: string[];
}`,signature:{properties:[{key:"id",value:{name:"string",required:!0}},{key:"label",value:{name:"string",required:!0}},{key:"itemIds",value:{name:"Array",elements:[{name:"string"}],raw:"string[]",required:!0}}]}}],raw:"CollectionGroup[]",required:!1}},{key:"selectedId",value:{name:"string",required:!1}}]}},description:""},surface:{required:!1,tsType:{name:"union",raw:"'grid' | 'rail' | 'sidebar' | 'mobile'",elements:[{name:"literal",value:"'grid'"},{name:"literal",value:"'rail'"},{name:"literal",value:"'sidebar'"},{name:"literal",value:"'mobile'"}]},description:"",defaultValue:{value:"'grid'",computed:!1}},columns:{required:!1,tsType:{name:"number"},description:""},onSelect:{required:!1,tsType:{name:"signature",type:"function",raw:"(item: CollectionItem) => void",signature:{arguments:[{type:{name:"signature",type:"object",raw:`{
  id: string;
  label: string;
  icon?: string;
  image?: string;
  color?: string;
  data?: unknown;
}`,signature:{properties:[{key:"id",value:{name:"string",required:!0}},{key:"label",value:{name:"string",required:!0}},{key:"icon",value:{name:"string",required:!1}},{key:"image",value:{name:"string",required:!1}},{key:"color",value:{name:"string",required:!1}},{key:"data",value:{name:"unknown",required:!1}}]}},name:"item"}],return:{name:"void"}}},description:""},onChange:{required:!1,tsType:{name:"signature",type:"function",raw:"(collection: CollectionData) => void",signature:{arguments:[{type:{name:"signature",type:"object",raw:`{
  id: string;
  label?: string;
  items: CollectionItem[];
  groups?: CollectionGroup[];
  selectedId?: string;
}`,signature:{properties:[{key:"id",value:{name:"string",required:!0}},{key:"label",value:{name:"string",required:!1}},{key:"items",value:{name:"Array",elements:[{name:"signature",type:"object",raw:`{
  id: string;
  label: string;
  icon?: string;
  image?: string;
  color?: string;
  data?: unknown;
}`,signature:{properties:[{key:"id",value:{name:"string",required:!0}},{key:"label",value:{name:"string",required:!0}},{key:"icon",value:{name:"string",required:!1}},{key:"image",value:{name:"string",required:!1}},{key:"color",value:{name:"string",required:!1}},{key:"data",value:{name:"unknown",required:!1}}]}}],raw:"CollectionItem[]",required:!0}},{key:"groups",value:{name:"Array",elements:[{name:"signature",type:"object",raw:`{
  id: string;
  label: string;
  itemIds: string[];
}`,signature:{properties:[{key:"id",value:{name:"string",required:!0}},{key:"label",value:{name:"string",required:!0}},{key:"itemIds",value:{name:"Array",elements:[{name:"string"}],raw:"string[]",required:!0}}]}}],raw:"CollectionGroup[]",required:!1}},{key:"selectedId",value:{name:"string",required:!1}}]}},name:"collection"}],return:{name:"void"}}},description:""},renderItem:{required:!1,tsType:{name:"signature",type:"function",raw:"(item: CollectionItem) => React.ReactNode",signature:{arguments:[{type:{name:"signature",type:"object",raw:`{
  id: string;
  label: string;
  icon?: string;
  image?: string;
  color?: string;
  data?: unknown;
}`,signature:{properties:[{key:"id",value:{name:"string",required:!0}},{key:"label",value:{name:"string",required:!0}},{key:"icon",value:{name:"string",required:!1}},{key:"image",value:{name:"string",required:!1}},{key:"color",value:{name:"string",required:!1}},{key:"data",value:{name:"unknown",required:!1}}]}},name:"item"}],return:{name:"ReactReactNode",raw:"React.ReactNode"}}},description:""},sx:{required:!1,tsType:{name:"any"},description:""}}};const de={title:"Molecules/Collection",component:M,parameters:{layout:"padded"}},j=[{id:"monad-1",label:"macbook",icon:"🖥️"},{id:"monad-2",label:"iphone",icon:"📱"},{id:"netget-1",label:"gateway",icon:"𓆣"},{id:"ns-1",label:"jabellae",icon:"◉",color:"rgba(79,195,247,0.15)"},{id:"claim-1",label:"is.human",icon:"✓",color:"rgba(102,187,106,0.15)"},{id:"surface-1",label:"local.netget",icon:"⚡"},{id:"link-1",label:"neurons.me",icon:"🌐"},{id:"monad-3",label:"server",icon:"🗄️"}],_=e=>{var d,c,p;const[n,s]=m.useState({id:"demo",label:(d=e.collection)==null?void 0:d.label,items:((c=e.collection)==null?void 0:c.items)??j,groups:((p=e.collection)==null?void 0:p.groups)??[]});return r.jsx(M,{...e,collection:n,onChange:s,onSelect:x=>console.log("selected",x)})},C={render:()=>r.jsx(_,{collection:{id:"demo",items:j,groups:[]}})},R={render:()=>r.jsx(_,{collection:{id:"demo",items:j.slice(4),groups:[{id:"g1",label:"Monads",itemIds:["monad-1","monad-2","monad-3"]},{id:"g2",label:"Identity",itemIds:["ns-1","claim-1"]}]}})},E={render:()=>r.jsx("div",{style:{width:200},children:r.jsx(_,{surface:"sidebar",collection:{id:"demo",items:j,groups:[]}})})},A={render:()=>r.jsx("div",{style:{width:320},children:r.jsx(_,{surface:"mobile",collection:{id:"demo",label:"My Collection",items:j,groups:[]}})}),parameters:{layout:"centered"}},ue=["Grid","WithGroups","Sidebar","Mobile"];var N,z,U;C.parameters={...C.parameters,docs:{...(N=C.parameters)==null?void 0:N.docs,source:{originalSource:`{
  render: () => <Controlled collection={{
    id: 'demo',
    items: ITEMS,
    groups: []
  }} />
}`,...(U=(z=C.parameters)==null?void 0:z.docs)==null?void 0:U.source}}};var B,F,H;R.parameters={...R.parameters,docs:{...(B=R.parameters)==null?void 0:B.docs,source:{originalSource:`{
  render: () => <Controlled collection={{
    id: 'demo',
    items: ITEMS.slice(4),
    groups: [{
      id: 'g1',
      label: 'Monads',
      itemIds: ['monad-1', 'monad-2', 'monad-3']
    }, {
      id: 'g2',
      label: 'Identity',
      itemIds: ['ns-1', 'claim-1']
    }]
  }} />
}`,...(H=(F=R.parameters)==null?void 0:F.docs)==null?void 0:H.source}}};var V,$,X;E.parameters={...E.parameters,docs:{...(V=E.parameters)==null?void 0:V.docs,source:{originalSource:`{
  render: () => <div style={{
    width: 200
  }}>
      <Controlled surface="sidebar" collection={{
      id: 'demo',
      items: ITEMS,
      groups: []
    }} />
    </div>
}`,...(X=($=E.parameters)==null?void 0:$.docs)==null?void 0:X.source}}};var J,K,Q;A.parameters={...A.parameters,docs:{...(J=A.parameters)==null?void 0:J.docs,source:{originalSource:`{
  render: () => <div style={{
    width: 320
  }}>
      <Controlled surface="mobile" collection={{
      id: 'demo',
      label: 'My Collection',
      items: ITEMS,
      groups: []
    }} />
    </div>,
  parameters: {
    layout: 'centered'
  }
}`,...(Q=(K=A.parameters)==null?void 0:K.docs)==null?void 0:Q.source}}};export{C as Grid,A as Mobile,E as Sidebar,R as WithGroups,ue as __namedExportsOrder,de as default};
