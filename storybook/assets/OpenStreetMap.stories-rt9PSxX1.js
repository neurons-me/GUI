import{j as a,t as B,A as h,w as D,x as Z,r as x}from"./iframe-q72FflWy.js";import{O as s,b as q,c as g,a as H}from"./OpenStreetMap-M4t07JUp.js";import{V as N,a as K,b as G,c as J}from"./OpenStreetMap.veracruz.fixture-CeecrMBD.js";import"./preload-helper-Dp1pzeXC.js";import"./Icon-Doq3uhPc.js";import"./MeRuntimeProvider-C3WCcVY6.js";const W={south:19.192,west:-96.142,north:19.205,east:-96.122},X={layers:[{id:"roads-primary",style:{strokeWidth:2,strokeLinecap:"round"},paths:["M24,700 L600,400 L1176,120","M300,24 L420,776"]},{id:"places",circles:[{cx:600,cy:400,r:3}]}]},ie={title:"Compounds/OpenStreetMap",component:s,tags:["autodocs"],decorators:[(e,r)=>{var t;return((t=r.parameters)==null?void 0:t.osmFrame)===!1?a.jsx(e,{}):a.jsx("div",{style:{height:420,width:"100%"},children:a.jsx(e,{})})}],args:{bbox:W,width:1200,height:800,pad:24,basemap:X,source:{dataSource:"demo strokes (not real OSM data)",license:"ODbL"}}},p={render:e=>a.jsxs(s,{...e,children:[a.jsx(s.Marker,{lat:19.1985,lon:-96.132,shape:"circle",size:20,tone:"primary",label:"circle",meta:"tone=primary"}),a.jsx(s.Marker,{lat:19.202,lon:-96.137,shape:"square",size:16,tone:"success",label:"square",meta:"tone=success"}),a.jsx(s.Marker,{lat:19.195,lon:-96.126,shape:"triangle",size:18,tone:"warning",label:"triangle",meta:"tone=warning",labelPlacement:"left"}),a.jsx(s.Marker,{lat:19.2,lon:-96.127,shape:"icon",icon:"directions_boat",size:22,tone:"info",label:"GUI.Icon",meta:"tone=info"}),a.jsx(s.Marker,{lat:19.1955,lon:-96.137,shape:"circle",size:14,color:"#c9b87e",label:"color=#c9b87e",meta:"explicit colour (legacy)"})]})},d={render:e=>a.jsx(s,{...e,children:a.jsx(s.Canvas,{onFrame:({ctx:r,now:t,project:n,palette:o,markerScale:u})=>{const m=n(19.1985+.004*Math.sin(t/900),-96.132+.006*Math.cos(t/900));r.fillStyle=o.tones.secondary,r.beginPath(),r.arc(m.x,m.y,6*u,0,Math.PI*2),r.fill()}})})},Q=H(G);function b(){return a.jsx(a.Fragment,{children:J.map(e=>{const{lat:r,lon:t}=Q.unproject(e.x,e.y);return a.jsx(s.Marker,{id:e.id,lat:r,lon:t,shape:e.shape,size:e.size,width:e.width,height:e.height,tone:e.tone,state:e.state,icon:e.icon,label:e.label,meta:e.meta,labelPlacement:e.place??"right",labelOffset:e.gap},e.id)})})}const M={...G,basemap:K,source:N,ariaLabel:"Port of Veracruz (OpenStreetMap basemap)",markerScale:"screen"},i={args:M,parameters:{docs:{description:{story:"Real data: a trimmed copy of the Veracruz port basemap (build_basemap.py output, © OpenStreetMap contributors, ODbL), about 12 KB, story-only. Basemap, markers and attribution take their colours from the theme (derived from existing tokens) and follow the toolbar Mode."}}},render:e=>a.jsx(s,{...e,children:a.jsx(b,{})})},Y=h.map(e=>e.themeId??"").filter(Boolean),$=(e,r)=>{var n;const t=h.find(o=>o.themeId===e)??h[0];return D(Z,((n=t.mode)==null?void 0:n[r])??{},r)},l={args:{...M,themeId:"neurons.me",mode:"light"},argTypes:{themeId:{control:"select",options:Y},mode:{control:"inline-radio",options:["light","dark"]}},render:({themeId:e,mode:r,...t})=>a.jsx(B,{theme:$(e,r),children:a.jsx(s,{...t,children:a.jsx(b,{})})})};function ee({themeId:e,themeName:r,mode:t}){const n=x.useMemo(()=>$(e,t),[e,t]),o=x.useMemo(()=>q(n),[n]),u=Math.min(...Object.values(o.domain).map(m=>g(m,o.land)));return a.jsx(B,{theme:n,children:a.jsxs("figure",{"data-theme-cell":`${e}/${t}`,style:{margin:0,background:n.palette.background.paper,border:`1px solid ${n.palette.divider}`,borderRadius:8,overflow:"hidden"},children:[a.jsx("div",{style:{height:190},children:a.jsx(s,{...M,markerScale:"fit",ariaLabel:`Veracruz in ${r} ${t}`,children:a.jsx(b,{})})}),a.jsxs("figcaption",{style:{font:"11px/1.4 system-ui, sans-serif",padding:"4px 8px",color:n.palette.text.primary},children:[a.jsx("b",{children:r})," · ",t,a.jsxs("span",{style:{color:n.palette.text.secondary},children:[" ","· label ",g(o.label,o.land).toFixed(1),":1 · tones ≥ ",u.toFixed(1),":1 · water ",g(o.water,o.land).toFixed(1),":1",o.accent?" · accent":""]})]})]})})}const c={parameters:{osmFrame:!1,layout:"fullscreen"},render:()=>a.jsx("div",{style:{display:"grid",gridTemplateColumns:"repeat(4, minmax(0, 1fr))",gap:10,padding:10},children:h.flatMap(e=>["light","dark"].map(r=>a.jsx(ee,{themeId:e.themeId??"",themeName:e.themeName??"",mode:r},`${e.themeId}/${r}`)))})},le=["Markers","CanvasLayer","Veracruz","ThemePicker","ThemesGrid"];var y,k,f;p.parameters={...p.parameters,docs:{...(y=p.parameters)==null?void 0:y.docs,source:{originalSource:`{
  render: args => <OpenStreetMap {...args}>
      <OpenStreetMap.Marker lat={19.1985} lon={-96.132} shape="circle" size={20} tone="primary" label="circle" meta="tone=primary" />
      <OpenStreetMap.Marker lat={19.202} lon={-96.137} shape="square" size={16} tone="success" label="square" meta="tone=success" />
      <OpenStreetMap.Marker lat={19.195} lon={-96.126} shape="triangle" size={18} tone="warning" label="triangle" meta="tone=warning" labelPlacement="left" />
      <OpenStreetMap.Marker lat={19.2} lon={-96.127} shape="icon" icon="directions_boat" size={22} tone="info" label="GUI.Icon" meta="tone=info" />
      <OpenStreetMap.Marker lat={19.1955} lon={-96.137} shape="circle" size={14} color="#c9b87e" label="color=#c9b87e" meta="explicit colour (legacy)" />
    </OpenStreetMap>
}`,...(f=(k=p.parameters)==null?void 0:k.docs)==null?void 0:f.source}}};var S,j,O;d.parameters={...d.parameters,docs:{...(S=d.parameters)==null?void 0:S.docs,source:{originalSource:`{
  render: args => <OpenStreetMap {...args}>
      <OpenStreetMap.Canvas onFrame={({
      ctx,
      now,
      project,
      palette,
      markerScale
    }) => {
      const p = project(19.1985 + 0.004 * Math.sin(now / 900), -96.132 + 0.006 * Math.cos(now / 900));
      ctx.fillStyle = palette.tones.secondary;
      ctx.beginPath();
      // markerScale keeps the dot the same on-screen size as markers at any zoom
      ctx.arc(p.x, p.y, 6 * markerScale, 0, Math.PI * 2);
      ctx.fill();
    }} />
    </OpenStreetMap>
}`,...(O=(j=d.parameters)==null?void 0:j.docs)==null?void 0:O.source}}};var T,R,w,z,I;i.parameters={...i.parameters,docs:{...(T=i.parameters)==null?void 0:T.docs,source:{originalSource:`{
  args: VERACRUZ_ARGS,
  parameters: {
    docs: {
      description: {
        story: 'Real data: a trimmed copy of the Veracruz port basemap (build_basemap.py output, © OpenStreetMap contributors, ODbL), about 12 KB, story-only. ' + 'Basemap, markers and attribution take their colours from the theme (derived from existing tokens) and follow the toolbar Mode.'
      }
    }
  },
  render: args => <OpenStreetMap {...args}>
      <VeracruzMarkers />
    </OpenStreetMap>
}`,...(w=(R=i.parameters)==null?void 0:R.docs)==null?void 0:w.source},description:{story:`The real Veracruz port basemap with the port page's main nodes, in the
colours of the theme in scope: switch the toolbar Mode to see light / dark.
Tones: port, ship, train, queue, yard. States: highlight (port), busy (SHIP[1]), done (SHIP[3]).`,...(I=(z=i.parameters)==null?void 0:z.docs)==null?void 0:I.description}}};var E,P,A,V,C;l.parameters={...l.parameters,docs:{...(E=l.parameters)==null?void 0:E.docs,source:{originalSource:`{
  args: {
    ...VERACRUZ_ARGS,
    themeId: 'neurons.me',
    mode: 'light'
  } as ThemedArgs,
  argTypes: {
    themeId: {
      control: 'select',
      options: THEME_IDS
    },
    mode: {
      control: 'inline-radio',
      options: ['light', 'dark']
    }
  },
  render: ({
    themeId,
    mode,
    ...args
  }) => <ThemeProvider theme={muiThemeFor(themeId, mode)}>
      <OpenStreetMap {...args as any}>
        <VeracruzMarkers />
      </OpenStreetMap>
    </ThemeProvider>
}`,...(A=(P=l.parameters)==null?void 0:P.docs)==null?void 0:A.source},description:{story:"The Veracruz map in one catalog theme and mode, chosen with the controls below.",...(C=(V=l.parameters)==null?void 0:V.docs)==null?void 0:C.description}}};var v,_,F,U,L;c.parameters={...c.parameters,docs:{...(v=c.parameters)==null?void 0:v.docs,source:{originalSource:`{
  parameters: {
    osmFrame: false,
    layout: 'fullscreen'
  },
  render: () => <div style={{
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    gap: 10,
    padding: 10
  }}>
      {GuiThemes.flatMap(t => (['light', 'dark'] as const).map(mode => <ThemeCell key={\`\${t.themeId}/\${mode}\`} themeId={t.themeId ?? ''} themeName={t.themeName ?? ''} mode={mode} />))}
    </div>
}`,...(F=(_=c.parameters)==null?void 0:_.docs)==null?void 0:F.source},description:{story:`All 8 catalog themes × light / dark, each map under its own theme (MUI
ThemeProvider built with the same makeMuiTheme as <Theme>). Captions show
label, marker-tone and water-line contrast against the land colour ("accent" = the
theme's color.accent took the primary/port/highlight role).`,...(L=(U=c.parameters)==null?void 0:U.docs)==null?void 0:L.description}}};export{d as CanvasLayer,p as Markers,l as ThemePicker,c as ThemesGrid,i as Veracruz,le as __namedExportsOrder,ie as default};
