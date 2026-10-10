import{j as e,r as U}from"./iframe-q72FflWy.js";import{M as _}from"./MeRuntimeProvider-C3WCcVY6.js";import{O as t}from"./OpenStreetMap-M4t07JUp.js";import{V as R,a as S,b as V}from"./OpenStreetMap.veracruz.fixture-CeecrMBD.js";import{u as P,V as F,L as N}from"./OpenStreetMap.story.fixture-BfhRGvZA.js";import"./preload-helper-Dp1pzeXC.js";import"./Icon-Doq3uhPc.js";import"./me.es-DjYxsJnm.js";function E({live:r,attribution:i,mono:a}){const{me:M,runtime:A}=P(r),[s,z]=U.useState(null),d=o=>()=>z(L=>L===o?null:o);return e.jsx(_,{me:M,runtime:A,children:e.jsxs(t,{...V,basemap:S,source:R,attribution:{position:i},ariaLabel:"Port of Veracruz (OpenStreetMap basemap)",markerScale:"screen",children:[e.jsx(F,{}),e.jsx(t.Legend,{mono:a,width:214,items:N,footer:"kernel counts · 3 off-map (adapter)"}),e.jsx(t.Overlay,{position:"top-left",hideBelow:640,interactive:!1,children:e.jsx("span",{style:{font:"10px/20px ui-monospace, monospace",padding:"0 7px",borderRadius:4,background:"var(--gui-osm-overlay-bg)",border:"1px solid var(--gui-osm-overlay-border)",color:"var(--gui-osm-overlay-text)"},children:"click a truck dot → me.trucks.unit[n]"})}),s?e.jsx(t.Overlay,{position:"bottom",style:{flexBasis:"100%"},role:"region","aria-label":`${s}: .me expression`,children:e.jsxs("div",{id:"osm-expr",style:{font:"10px/1.5 ui-monospace, monospace",padding:"6px 8px",maxWidth:480,borderRadius:4,background:"var(--gui-osm-overlay-bg)",border:"1px solid var(--gui-osm-highlight)",color:"var(--gui-osm-overlay-text)"},children:[e.jsx("b",{style:{color:"var(--gui-osm-overlay-strong)"},children:s})," = Σ ships[i].remainingTons · kernel rule (story text)"]})}):null,e.jsx(t.Chip,{mono:a,label:"import left",bind:"flows.importRemaining",unit:" t",tone:"ship",minValueCh:9,fx:!0,active:s==="import",onClick:d("import"),"aria-controls":"osm-expr"}),e.jsx(t.Chip,{mono:a,label:"export left",bind:"flows.exportRemaining",unit:" t",tone:"train",minValueCh:8,fx:!0,active:s==="export",onClick:d("export"),"aria-controls":"osm-expr"}),e.jsx(t.Chip,{mono:a,label:"trucks.working",bind:["trucks.working","trucks.fleet"],format:o=>`${o[0]??"—"} / ${o[1]??"—"}`,minValueCh:9,fx:!0,active:s==="working",onClick:d("working")}),e.jsx(t.Chip,{mono:a,label:"trucks.balanced",bind:"trucks.balanced",fx:!0}),e.jsx(t.Chip,{mono:a,label:"avg km/h",bind:"trucks.speed.avg",format:o=>typeof o=="number"?o.toFixed(1):"—",minValueCh:4,hideBelow:520}),e.jsx(t.Chip,{mono:a,label:"simulation",value:"06:42 · ×4",variant:"adapter",title:"simulator clock: adapter, not a kernel path"})]})})}const K={title:"Compounds/OpenStreetMap/Overlays",tags:["autodocs"],decorators:[(r,i)=>{var a;return((a=i.parameters)==null?void 0:a.osmFrame)===!1?e.jsx(r,{}):e.jsx("div",{style:{height:460,width:"100%"},children:e.jsx(r,{})})}],args:{live:!0,attribution:"bottom-right",mono:!0},argTypes:{attribution:{control:"select",options:["bottom-right","bottom-left","top-right","top-left"]}}},n={render:r=>e.jsx(E,{...r})},l={parameters:{osmFrame:!1},render:r=>e.jsx("div",{style:{width:360,height:560},children:e.jsx(E,{...r})})},T=["top-left","top","top-right","left","right","bottom-left","bottom","bottom-right"],p={args:{live:!1},render:({attribution:r})=>e.jsxs(t,{...V,basemap:S,source:R,attribution:{position:r},children:[T.map(i=>e.jsx(t.Chip,{position:i,label:"position",value:i},i)),e.jsx(t.Legend,{position:"top-right",title:"Legend",items:[{label:"ship",tone:"ship",value:3},{label:"train",tone:"train",value:1},{label:"yard",tone:"yard",swatch:"square",value:2}]}),e.jsx(t.Chip,{position:"bottom",label:"adapter",value:"dashed",variant:"adapter"})]})},W=["Veracruz","Narrow","Positions"];var c,m,u,h,b;n.parameters={...n.parameters,docs:{...(c=n.parameters)==null?void 0:c.docs,source:{originalSource:`{
  render: args => <VeracruzOverlays {...args} />
}`,...(u=(m=n.parameters)==null?void 0:m.docs)==null?void 0:u.source},description:{story:`Legend (top-right), HUD chips (bottom edge, wrapping above the attribution)
and a hint overlay (top-left, hidden below 640 px), on the Veracruz fixture.
Follows the toolbar Mode. Click a chip with ƒ: its explanation opens as a
full-width row above the chips, still inside the bottom dock.`,...(b=(h=n.parameters)==null?void 0:h.docs)==null?void 0:b.description}}};var g,x,v,f,y;l.parameters={...l.parameters,docs:{...(g=l.parameters)==null?void 0:g.docs,source:{originalSource:`{
  parameters: {
    osmFrame: false
  },
  render: args => <div style={{
    width: 360,
    height: 560
  }}>
      <VeracruzOverlays {...args} />
    </div>
}`,...(v=(x=l.parameters)==null?void 0:x.docs)==null?void 0:v.source},description:{story:"The same map in a phone-sized frame: the hint and the km/h chip hide, chips wrap, the legend fits.",...(y=(f=l.parameters)==null?void 0:f.docs)==null?void 0:y.description}}};var k,C,j,w,O;p.parameters={...p.parameters,docs:{...(k=p.parameters)==null?void 0:k.docs,source:{originalSource:`{
  args: {
    live: false
  },
  render: ({
    attribution
  }) => <OpenStreetMap {...VERACRUZ_FRAME} basemap={VERACRUZ_BASEMAP} source={VERACRUZ_SOURCE} attribution={{
    position: attribution
  }}>
      {POSITIONS.map(p => <OpenStreetMap.Chip key={p} position={p} label="position" value={p} />)}
      <OpenStreetMap.Legend position="top-right" title="Legend" items={[{
      label: 'ship',
      tone: 'ship',
      value: 3
    }, {
      label: 'train',
      tone: 'train',
      value: 1
    }, {
      label: 'yard',
      tone: 'yard',
      swatch: 'square',
      value: 2
    }]} />
      <OpenStreetMap.Chip position="bottom" label="adapter" value="dashed" variant="adapter" />
    </OpenStreetMap>
}`,...(j=(C=p.parameters)==null?void 0:C.docs)==null?void 0:j.source},description:{story:"Every dock filled; pick the attribution corner in Controls. Nothing overlaps at any size.",...(O=(w=p.parameters)==null?void 0:w.docs)==null?void 0:O.description}}};export{l as Narrow,p as Positions,n as Veracruz,W as __namedExportsOrder,K as default};
