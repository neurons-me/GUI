import{r as H,j as e}from"./iframe-q72FflWy.js";import{M as te}from"./MeRuntimeProvider-C3WCcVY6.js";import{O as n,a as se}from"./OpenStreetMap-M4t07JUp.js";import{c as x,V as oe,a as ne,b as q}from"./OpenStreetMap.veracruz.fixture-CeecrMBD.js";import{u as ae,V as ie,L as ce}from"./OpenStreetMap.story.fixture-BfhRGvZA.js";import"./preload-helper-Dp1pzeXC.js";import"./Icon-Doq3uhPc.js";import"./me.es-DjYxsJnm.js";function a({live:r,layers:t,defaultLayersOpen:s,position:g,step:o,maxZoom:f,markerScale:w,zoomPan:Q,view:X,onViewChange:Y}){const{me:ee,runtime:re}=ae(r);return e.jsx(te,{me:ee,runtime:re,children:e.jsxs(n,{...q,basemap:ne,source:oe,ariaLabel:"Port of Veracruz (OpenStreetMap basemap)",maxZoom:f,markerScale:w,zoomPan:Q,view:X,onViewChange:Y,children:[e.jsx(ie,{}),e.jsx(n.Legend,{mono:!0,width:214,items:ce,footer:"kernel counts · 3 off-map (adapter)"}),e.jsx(n.Controls,{position:g,layers:t,defaultLayersOpen:s,step:o},`${g}-${s}`),e.jsx(n.Chip,{mono:!0,label:"import left",bind:"flows.importRemaining",unit:" t",tone:"ship",minValueCh:9,fx:!0}),e.jsx(n.Chip,{mono:!0,label:"trucks.working",bind:["trucks.working","trucks.fleet"],format:i=>`${i[0]??"—"} / ${i[1]??"—"}`,minValueCh:9,fx:!0}),e.jsx(n.Chip,{mono:!0,label:"avg km/h",bind:"trucks.speed.avg",format:i=>typeof i=="number"?i.toFixed(1):"—",minValueCh:4,hideBelow:520}),e.jsx(n.Chip,{mono:!0,label:"simulation",value:"06:42 · ×4",variant:"adapter"})]})})}const we={title:"Compounds/OpenStreetMap/Controls",tags:["autodocs"],decorators:[(r,t)=>{var s;return((s=t.parameters)==null?void 0:s.osmFrame)===!1?e.jsx(r,{}):e.jsx("div",{style:{height:460,width:"100%"},children:e.jsx(r,{})})}],args:{live:!0,layers:!0,defaultLayersOpen:!1,position:"right",step:2,maxZoom:16,markerScale:"screen",zoomPan:!0},argTypes:{position:{control:"select",options:["top-left","top","top-right","left","right","bottom-left","bottom","bottom-right"]},step:{control:{type:"number",min:1.1,max:4,step:.1}},maxZoom:{control:{type:"number",min:1,max:32,step:1}},markerScale:{control:"inline-radio",options:["fit","screen"]}}},c={render:r=>e.jsx(a,{...r})},d={args:{defaultLayersOpen:!0},render:r=>e.jsx(a,{...r})},h=se(q),m={parameters:{osmFrame:!1},render:r=>{const[t,s]=H.useState({zoom:1}),g=o=>{const f=x.find(w=>w.id===o);s({zoom:3,center:h.unproject(f.x,f.y)})};return e.jsxs("div",{style:{display:"grid",gap:8},children:[e.jsx("div",{style:{height:420},children:e.jsx(a,{...r,view:t,onViewChange:s})}),e.jsxs("div",{style:{display:"flex",gap:8,alignItems:"center",font:"12px system-ui, sans-serif",flexWrap:"wrap"},children:[x.slice(0,4).map(o=>e.jsx("button",{type:"button",onClick:()=>g(o.id),children:o.label??o.id},o.id)),e.jsx("button",{type:"button",onClick:()=>s({zoom:1,center:h.unproject(h.width/2,h.height/2)}),children:"fit"}),e.jsxs("code",{"data-testid":"view-readout",children:["zoom ",Number(t.zoom??1).toFixed(2),t.center?` · ${t.center.lat.toFixed(4)}, ${t.center.lon.toFixed(4)}`:""]})]})]})}},l={parameters:{osmFrame:!1},render:r=>e.jsx("div",{style:{width:360,height:560},children:e.jsx(a,{...r})})},p={render:r=>{const[t,s]=H.useState(()=>({zoom:3,center:h.unproject(700,280)}));return e.jsx(a,{...r,view:t,onViewChange:s})}},u={parameters:{osmFrame:!1},args:{markerScale:"fit"},render:r=>e.jsx("div",{style:{width:360,height:560},children:e.jsx(a,{...r})})},xe=["Veracruz","LayersOpen","Controlled","Narrow","ZoomPan","FitSizedMarkers"];var y,v,b,C,V;c.parameters={...c.parameters,docs:{...(y=c.parameters)==null?void 0:y.docs,source:{originalSource:`{
  render: args => <VeracruzControls {...args} />
}`,...(b=(v=c.parameters)==null?void 0:v.docs)==null?void 0:b.source},description:{story:"Controls (right edge) with the legend and HUD chips on the Veracruz fixture; follows the toolbar Mode.",...(V=(C=c.parameters)==null?void 0:C.docs)==null?void 0:V.description}}};var j,z,k,S,R;d.parameters={...d.parameters,docs:{...(j=d.parameters)==null?void 0:j.docs,source:{originalSource:`{
  args: {
    defaultLayersOpen: true
  },
  render: args => <VeracruzControls {...args} />
}`,...(k=(z=d.parameters)==null?void 0:z.docs)==null?void 0:k.source},description:{story:"The layer panel open: uncheck a layer to hide it (roads, water, places).",...(R=(S=d.parameters)==null?void 0:S.docs)==null?void 0:R.description}}};var O,E,F,P,M;m.parameters={...m.parameters,docs:{...(O=m.parameters)==null?void 0:O.docs,source:{originalSource:`{
  parameters: {
    osmFrame: false
  },
  render: args => {
    const [view, setView] = React.useState<Partial<OsmUserView>>({
      zoom: 1
    });
    const focus = (id: string) => {
      const n = VERACRUZ_NODES.find(x => x.id === id)!;
      setView({
        zoom: 3,
        center: PROJ.unproject(n.x, n.y)
      });
    };
    return <div style={{
      display: 'grid',
      gap: 8
    }}>
        <div style={{
        height: 420
      }}>
          <VeracruzControls {...args} view={view} onViewChange={setView} />
        </div>
        <div style={{
        display: 'flex',
        gap: 8,
        alignItems: 'center',
        font: '12px system-ui, sans-serif',
        flexWrap: 'wrap'
      }}>
          {VERACRUZ_NODES.slice(0, 4).map(n => <button key={n.id} type="button" onClick={() => focus(n.id)}>{n.label ?? n.id}</button>)}
          <button type="button" onClick={() => setView({
          zoom: 1,
          center: PROJ.unproject(PROJ.width / 2, PROJ.height / 2)
        })}>fit</button>
          <code data-testid="view-readout">
            zoom {Number(view.zoom ?? 1).toFixed(2)}
            {view.center ? \` · \${view.center.lat.toFixed(4)}, \${view.center.lon.toFixed(4)}\` : ''}
          </code>
        </div>
      </div>;
  }
}`,...(F=(E=m.parameters)==null?void 0:E.docs)==null?void 0:F.source},description:{story:"Controlled view: the story owns `view` and gets every change (buttons,\nreset) through onViewChange; the buttons below the map set it from outside.",...(M=(P=m.parameters)==null?void 0:P.docs)==null?void 0:M.description}}};var Z,U,A,_,L;l.parameters={...l.parameters,docs:{...(Z=l.parameters)==null?void 0:Z.docs,source:{originalSource:`{
  parameters: {
    osmFrame: false
  },
  render: args => <div style={{
    width: 360,
    height: 560
  }}>
      <VeracruzControls {...args} />
    </div>
}`,...(A=(U=l.parameters)==null?void 0:U.docs)==null?void 0:A.source},description:{story:"Phone-sized frame: controls keep their dock on the right edge, chips wrap below.",...(L=(_=l.parameters)==null?void 0:_.docs)==null?void 0:L.description}}};var N,$,J,D,B;p.parameters={...p.parameters,docs:{...(N=p.parameters)==null?void 0:N.docs,source:{originalSource:`{
  render: args => {
    const [view, setView] = React.useState<Partial<OsmUserView>>(() => ({
      zoom: 3,
      center: PROJ.unproject(700, 280)
    }));
    return <VeracruzControls {...args} view={view} onViewChange={setView} />;
  }
}`,...(J=($=p.parameters)==null?void 0:$.docs)==null?void 0:J.source},description:{story:`Zoom / pan with constant-size markers: Ctrl/⌘ + scroll (or click the map, then scroll), pinch, drag,
or focus it and use the arrow keys / + / − / 0. Kernel values stay live.
Starts zoomed in on the terminal so the effect is visible right away.`,...(B=(D=p.parameters)==null?void 0:D.docs)==null?void 0:B.description}}};var I,T,K,W,G;u.parameters={...u.parameters,docs:{...(I=u.parameters)==null?void 0:I.docs,source:{originalSource:`{
  parameters: {
    osmFrame: false
  },
  args: {
    markerScale: 'fit'
  },
  render: args => <div style={{
    width: 360,
    height: 560
  }}>
      <VeracruzControls {...args} />
    </div>
}`,...(K=(T=u.parameters)==null?void 0:T.docs)==null?void 0:K.source},description:{story:'markerScale="fit" (the library default): pins keep the size they have at the fit, so a phone-sized map shows small pins.',...(G=(W=u.parameters)==null?void 0:W.docs)==null?void 0:G.description}}};export{m as Controlled,u as FitSizedMarkers,d as LayersOpen,l as Narrow,c as Veracruz,p as ZoomPan,xe as __namedExportsOrder,we as default};
