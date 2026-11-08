import{r as W,j as e}from"./iframe-Dgz0DvjP.js";import{M as X}from"./Me-BT-LrcBn.js";import{u as Y,O as a,a as pe}from"./OpenStreetMap-C8GiR64c.js";import{V as f,a as M,b as m}from"./OpenStreetMap.veracruz.fixture-CeecrMBD.js";import{u as ee,V as re,L as te}from"./OpenStreetMap.story.fixture-RiBKjfFx.js";import"./preload-helper-Dp1pzeXC.js";import"./me.es-Bc6mvw-6.js";import"./Icon-zhfCvvEA.js";const u=pe(m),se=["n-port","n-ship1","n-ship2","n-yard"];function h({live:r,listInMap:t=!0,selected:s,onSelectionChange:n,view:S,onViewChange:g,defaultView:ae,link:ne,defaultSelected:oe=se,controls:ie=!0,chips:le=!0}){const{me:ce,runtime:de}=ee(r);return e.jsx(X,{me:ce,runtime:de,children:e.jsxs(a,{...m,basemap:M,source:f,ariaLabel:"Port of Veracruz (OpenStreetMap basemap)",markerScale:"screen",...s!==void 0?{selected:s,onSelectionChange:n}:{defaultSelected:oe},view:S,onViewChange:g,defaultView:ae,link:ne,children:[e.jsx(re,{liveMeta:!0}),t?e.jsx(a.MarkerList,{width:264}):null,e.jsx(a.Legend,{mono:!0,width:214,items:te,footer:"kernel counts · 3 off-map (adapter)"}),ie?e.jsx(a.Controls,{}):null,le?e.jsxs(e.Fragment,{children:[e.jsx(a.Chip,{mono:!0,label:"import left",bind:"flows.importRemaining",unit:" t",tone:"ship",minValueCh:9,fx:!0}),e.jsx(a.Chip,{mono:!0,label:"trucks.working",bind:["trucks.working","trucks.fleet"],format:k=>`${k[0]??"—"} / ${k[1]??"—"}`,minValueCh:9,fx:!0}),e.jsx(a.Chip,{mono:!0,label:"simulation",value:"06:42 · ×4",variant:"adapter"})]}):null]})})}const xe={title:"Compounds/OpenStreetMap/Selection",tags:["autodocs"],decorators:[(r,t)=>{var s;return((s=t.parameters)==null?void 0:s.osmFrame)===!1?e.jsx(r,{}):e.jsx("div",{style:{height:460,width:"100%"},children:e.jsx(r,{})})}],args:{live:!0,listInMap:!0}},o={render:r=>e.jsx(h,{...r})},i={parameters:{osmFrame:!1},render:r=>{const t=Y(),[s,n]=W.useState(se);return e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"minmax(0, 1fr) 240px",gap:12,alignItems:"start"},children:[e.jsx("div",{style:{height:460},children:e.jsx(h,{...r,listInMap:!1,selected:s,onSelectionChange:n,link:t})}),e.jsxs("div",{style:{display:"grid",gap:8},children:[e.jsx(a.MarkerList,{link:t,width:"100%",title:"Pins (outside the map)"}),e.jsxs("code",{"data-testid":"selection-readout",style:{font:"11px ui-monospace, monospace",wordBreak:"break-all"},children:["selected = ",JSON.stringify(s)]})]})]})}},l={render:r=>{const[t,s]=W.useState(()=>({zoom:5,center:u.unproject(640,350)}));return e.jsx(h,{...r,view:t,onViewChange:s,defaultSelected:["n-port","n-ship1","n-ship2","n-ship3","n-yard","n-qimp","n-train"],chips:!1})}},x=Array.from({length:12},(r,t)=>{const s=t/12*Math.PI*2,n=t%2?26:14,{lat:S,lon:g}=u.unproject(600+Math.cos(s)*n,255+Math.sin(s)*n*.8);return{id:`c${t}`,lat:S,lon:g,label:`TRUCK[${100+t}] heavy`,meta:t%3?"en route":"loading",tone:["ship","train","yard","queue"][t%4]}}),c={args:{live:!1},render:()=>e.jsxs(a,{...m,basemap:M,source:f,markerScale:"screen",defaultView:{zoom:2.5,center:u.unproject(600,255)},defaultSelected:x.map(r=>r.id),ariaLabel:"Label collisions",children:[x.map(r=>e.jsx(a.Marker,{id:r.id,lat:r.lat,lon:r.lon,shape:"circle",size:12,tone:r.tone,label:r.label,meta:r.meta},r.id)),e.jsx(a.Controls,{})]})},d={parameters:{osmFrame:!1},render:r=>{const t=Y();return e.jsxs("div",{style:{width:360,display:"grid",gap:8},children:[e.jsx("div",{style:{height:420},children:e.jsx(h,{...r,listInMap:!1,link:t,chips:!1,defaultView:{zoom:1.4,center:u.unproject(660,300)}})}),e.jsx(a.MarkerList,{link:t,width:"100%"})]})}},p={render:({live:r})=>{const{me:t,runtime:s}=ee(r);return e.jsx(X,{me:t,runtime:s,children:e.jsxs(a,{...m,basemap:M,source:f,markerScale:"screen",ariaLabel:"Port of Veracruz",children:[e.jsx(re,{liveMeta:!0}),e.jsx(a.Legend,{mono:!0,width:214,items:te,footer:"kernel counts · 3 off-map (adapter)"}),e.jsx(a.Controls,{})]})})}};var j,w,C,v,y;o.parameters={...o.parameters,docs:{...(j=o.parameters)==null?void 0:j.docs,source:{originalSource:`{
  render: args => <VeracruzSelection {...args} />
}`,...(C=(w=o.parameters)==null?void 0:w.docs)==null?void 0:C.source},description:{story:`Port, the two active ships and the yard selected (uncontrolled), the list in
the map (top-left), live kernel values in the pins' second line and in the
list. SHIP[2] sits under the legend: it moves out with an arrow.`,...(y=(v=o.parameters)==null?void 0:v.docs)==null?void 0:y.description}}};var E,R,V,b,L;i.parameters={...i.parameters,docs:{...(E=i.parameters)==null?void 0:E.docs,source:{originalSource:`{
  parameters: {
    osmFrame: false
  },
  render: args => {
    const link = useOpenStreetMapLink();
    const [selected, setSelected] = React.useState<string[]>(DEFAULT_SELECTION);
    return <div style={{
      display: 'grid',
      gridTemplateColumns: 'minmax(0, 1fr) 240px',
      gap: 12,
      alignItems: 'start'
    }}>
        <div style={{
        height: 460
      }}>
          <VeracruzSelection {...args} listInMap={false} selected={selected} onSelectionChange={setSelected} link={link} />
        </div>
        <div style={{
        display: 'grid',
        gap: 8
      }}>
          <OpenStreetMap.MarkerList link={link} width="100%" title="Pins (outside the map)" />
          <code data-testid="selection-readout" style={{
          font: '11px ui-monospace, monospace',
          wordBreak: 'break-all'
        }}>
            selected = {JSON.stringify(selected)}
          </code>
        </div>
      </div>;
  }
}`,...(V=(R=i.parameters)==null?void 0:R.docs)==null?void 0:V.source},description:{story:"Controlled: the story owns `selected`; the list lives outside the map (shared through `link`).",...(L=(b=i.parameters)==null?void 0:b.docs)==null?void 0:L.description}}};var O,z,A,P,U;l.parameters={...l.parameters,docs:{...(O=l.parameters)==null?void 0:O.docs,source:{originalSource:`{
  render: args => {
    const [view, setView] = React.useState<Partial<OsmUserView>>(() => ({
      zoom: 5,
      center: PROJ.unproject(640, 350)
    }));
    return <VeracruzSelection {...args} view={view} onViewChange={setView} defaultSelected={['n-port', 'n-ship1', 'n-ship2', 'n-ship3', 'n-yard', 'n-qimp', 'n-train']} chips={false} />;
  }
}`,...(A=(z=l.parameters)==null?void 0:z.docs)==null?void 0:A.source},description:{story:"Zoomed in on Q.IMPORT: the port (above), ships (right), train (left) and yard (below) stick to the edges with arrows. Click one to pan there.",...(U=(P=l.parameters)==null?void 0:P.docs)==null?void 0:U.description}}};var _,I,T,Z,F;c.parameters={...c.parameters,docs:{...(_=c.parameters)==null?void 0:_.docs,source:{originalSource:`{
  args: {
    live: false
  },
  render: () => <OpenStreetMap {...VERACRUZ_FRAME} basemap={VERACRUZ_BASEMAP} source={VERACRUZ_SOURCE} markerScale="screen" defaultView={{
    zoom: 2.5,
    center: PROJ.unproject(600, 255)
  }} defaultSelected={CLUSTER.map(c => c.id)} ariaLabel="Label collisions">
      {CLUSTER.map(c => <OpenStreetMap.Marker key={c.id} id={c.id} lat={c.lat} lon={c.lon} shape="circle" size={12} tone={c.tone} label={c.label} meta={c.meta} />)}
      <OpenStreetMap.Controls />
    </OpenStreetMap>
}`,...(T=(I=c.parameters)==null?void 0:I.docs)==null?void 0:T.source},description:{story:"12 selected pins in a 50 px cluster: labels take free slots, then leader lines, then collapse (hover a pin to see its label).",...(F=(Z=c.parameters)==null?void 0:Z.docs)==null?void 0:F.description}}};var N,J,B,D,$;d.parameters={...d.parameters,docs:{...(N=d.parameters)==null?void 0:N.docs,source:{originalSource:`{
  parameters: {
    osmFrame: false
  },
  render: args => {
    const link = useOpenStreetMapLink();
    return <div style={{
      width: 360,
      display: 'grid',
      gap: 8
    }}>
        <div style={{
        height: 420
      }}>
          <VeracruzSelection {...args} listInMap={false} link={link} chips={false} defaultView={{
          zoom: 1.4,
          center: PROJ.unproject(660, 300)
        }} />
        </div>
        <OpenStreetMap.MarkerList link={link} width="100%" />
      </div>;
  }
}`,...(B=(J=d.parameters)==null?void 0:J.docs)==null?void 0:B.source},description:{story:"Phone-sized map with the list under it (outside the map, through `link`).",...($=(D=d.parameters)==null?void 0:D.docs)==null?void 0:$.description}}};var q,K,G,H,Q;p.parameters={...p.parameters,docs:{...(q=p.parameters)==null?void 0:q.docs,source:{originalSource:`{
  render: ({
    live
  }) => {
    const {
      me,
      runtime
    } = useKernel(live);
    return <Me me={me} runtime={runtime}>
        <OpenStreetMap {...VERACRUZ_FRAME} basemap={VERACRUZ_BASEMAP} source={VERACRUZ_SOURCE} markerScale="screen" ariaLabel="Port of Veracruz">
          <VeracruzMarkers liveMeta />
          <OpenStreetMap.Legend mono width={214} items={LEGEND_ITEMS} footer="kernel counts · 3 off-map (adapter)" />
          <OpenStreetMap.Controls />
        </OpenStreetMap>
      </Me>;
  }
}`,...(G=(K=p.parameters)==null?void 0:K.docs)==null?void 0:G.source},description:{story:"The same map without selection props: every pin full, exactly as before S5b.2 (for comparison).",...(Q=(H=p.parameters)==null?void 0:H.docs)==null?void 0:Q.description}}};const je=["Veracruz","Controlled","ZoomedEdgePins","LabelCollisions","NarrowList","NoSelection"];export{i as Controlled,c as LabelCollisions,d as NarrowList,p as NoSelection,o as Veracruz,l as ZoomedEdgePins,je as __namedExportsOrder,xe as default};
