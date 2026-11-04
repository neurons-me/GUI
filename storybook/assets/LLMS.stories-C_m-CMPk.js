import{j as e,r as b,k as s,n as K}from"./iframe-CWBlVoSh.js";import{L as a}from"./LLMS-CNQfKYMn.js";import{W as ee}from"./WithTheme.story-D3FonkJJ.js";import"./preload-helper-Dp1pzeXC.js";const o={phrase:"Bread now costs 25, the coffee stays at 45; what is the menu total?",ops:[{op:"set",path:"menu.bread.price",value:25},{op:"define",path:"menu",name:"total",expr:"coffee.price + bread.price"},{op:"query",paths:["menu.total"]}],graph:{nodes:[{path:"menu.coffee.price",value:45},{path:"menu.bread.price",value:25},{path:"menu.total",value:70,derived:!0}],edges:[{from:"menu.coffee.price",to:"menu.total"},{from:"menu.bread.price",to:"menu.total"}]},explain:{path:"menu.total",value:70,expr:"coffee.price + bread.price",derivation:{inputs:[{path:"menu.coffee.price",value:45,origin:"public",masked:!1,status:"ok"},{path:"menu.bread.price",value:25,origin:"public",masked:!1,status:"ok"}]},meta:{dependsOn:["menu.coffee.price","menu.bread.price"]}},changed:["menu.bread.price","menu.total"]},Q={phrase:"El pan ahora cuesta 25 y el café sigue en 45; ¿cuánto es el total del menú?",ops:[{op:"set",path:"menu.pan.precio",value:25},{op:"define",path:"menu",name:"total",expr:"cafe.precio + pan.precio"},{op:"query",paths:["menu.total"]}],graph:{nodes:[{path:"menu.cafe.precio",value:45},{path:"menu.pan.precio",value:25},{path:"menu.total",value:70,derived:!0}],edges:[{from:"menu.cafe.precio",to:"menu.total"},{from:"menu.pan.precio",to:"menu.total"}]},explain:{path:"menu.total",value:70,expr:"cafe.precio + pan.precio",derivation:{inputs:[{path:"menu.cafe.precio",value:45,origin:"public",masked:!1,status:"ok"},{path:"menu.pan.precio",value:25,origin:"public",masked:!1,status:"ok"}]},meta:{dependsOn:["menu.cafe.precio","menu.pan.precio"]}},changed:["menu.pan.precio","menu.total"],labels:{changed:"← lo acabas de cambiar",recomputed:(m,t)=>e.jsxs(e.Fragment,{children:["Cambiaste ",e.jsx("code",{children:m}),", así que ",e.jsx("code",{children:t})," se recalculó solo."]}),zoomIn:"Acercar",zoomOut:"Alejar",reset:"Restablecer vista",expand:"Ampliar",graph:"grafo de estado"}},Y={phrase:"The robot can proceed only when its battery is at least the minimum battery. Battery is 82, minimum battery 30.",ops:[{op:"set",path:"robot.battery",value:82},{op:"set",path:"robot.minimumBattery",value:30},{op:"define",path:"robot",name:"canProceed",expr:"battery >= minimumBattery"}],graph:{nodes:[{path:"robot.battery",value:82},{path:"robot.minimumBattery",value:30},{path:"robot.canProceed",value:!0,derived:!0}],edges:[{from:"robot.battery",to:"robot.canProceed"},{from:"robot.minimumBattery",to:"robot.canProceed"}]},explain:{path:"robot.canProceed",value:!0,expr:"battery >= minimumBattery",derivation:{inputs:[{path:"robot.battery",value:82,origin:"public",masked:!1,status:"ok"},{path:"robot.minimumBattery",value:30,origin:"public",masked:!1,status:"ok"}]},meta:{dependsOn:["robot.battery","robot.minimumBattery"]}},changed:["robot.battery","robot.minimumBattery","robot.canProceed"],aliases:{"can proceed":"robot.canProceed","minimum battery":"robot.minimumBattery"}},Z={nodes:[{path:"menu.coffee.price",value:45},{path:"menu.coffee.name",value:"Café de olla"},{path:"menu.bread.price",value:25},{path:"menu.bread.name",value:"Concha"},{path:"menu.total",value:70,derived:!0},{path:"cafe.name",value:"e24"},{path:"cafe.city",value:"CDMX"},{path:"staff[0].name",value:"Ana"},{path:"staff[1].name",value:"Luis"},{path:"wallet.key",value:"x",masked:!0}],edges:[{from:"menu.coffee.price",to:"menu.total"},{from:"menu.bread.price",to:"menu.total"}]},r=({themeId:m,mode:t,title:n,width:f,children:g})=>e.jsx(ee,{themeId:m,mode:t,children:e.jsxs(s,{sx:{p:2,bgcolor:"background.default",color:"text.primary",minHeight:"100%",width:f??"100%",maxWidth:"100%"},children:[n&&e.jsx(K,{variant:"overline",sx:{color:"text.secondary",display:"block",mb:1},children:n}),g]})}),ne={title:"LLMS/LLMS",component:a,parameters:{layout:"fullscreen",docs:{description:{component:"How a sentence becomes .me: the phrase, the ops as .me code, the state graph and me.explain(), sharing one active path. Hover (or tap) a word, a code token, a graph node or an explain row; everything that names the same path lights up. Graph: wheel / pinch to zoom, drag to pan, ⟲ resets, ⤢ expands."}}}},d={name:"Menu (e24) · dark",render:()=>e.jsx(r,{mode:"dark",title:"menu · bread 20 → 25",children:e.jsx(a,{...o,expandedGraph:Z})})},c={name:"Menu (e24) · light",render:()=>e.jsx(r,{mode:"light",children:e.jsx(a,{...o,expandedGraph:Z})})},l={name:"Menú (español)",render:()=>e.jsx(r,{mode:"dark",title:"menú · pan 20 → 25",children:e.jsx(a,{...Q})})},u={name:"Robot canProceed",render:()=>e.jsx(r,{mode:"dark",title:"robot.canProceed = battery >= minimumBattery",children:e.jsx(a,{...Y})})},h={name:"Three themes",render:()=>e.jsxs(s,{sx:{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(340px,1fr))"},children:[e.jsx(r,{themeId:"neurons.me",mode:"dark",title:"neurons.me · dark",children:e.jsx(a,{...o})}),e.jsx(r,{themeId:"ghost.shell",mode:"dark",title:"GhostShell · dark",children:e.jsx(a,{...o})}),e.jsx(r,{themeId:"prince-of-darkness",mode:"light",title:"PrinceOfDarkness · light",children:e.jsx(a,{...Y})})]})},x={name:"Mobile (360px)",parameters:{viewport:{defaultViewport:"mobile1"}},render:()=>e.jsx(r,{mode:"dark",width:360,children:e.jsx(a,{...Q,graphHeight:160})})},i={name:"Composed parts",render:function(){const[t,n]=b.useState(null);return e.jsxs(r,{mode:"dark",children:[e.jsx(a,{...o,onActivePath:n,children:e.jsxs(s,{sx:{display:"grid",gap:2,gridTemplateColumns:{xs:"1fr",md:"1fr 1fr"}},children:[e.jsxs(s,{children:[e.jsx(a.Phrase,{}),e.jsx(s,{sx:{mt:1},children:e.jsx(a.Syntax,{})}),e.jsx(a.Explain,{})]}),e.jsx(a.Graph,{height:260})]})}),e.jsxs(K,{variant:"caption",sx:{color:"text.secondary",fontFamily:"monospace"},children:["active: ",t??"—"]})]})}},p={name:"Controlled (two in sync)",render:function(){const[t,n]=b.useState(null),[f,g]=b.useState("menu.bread.price"),v={activePath:t??f,onHoverPath:n,onPinPath:y=>g($=>$===y?null:y)};return e.jsx(r,{mode:"dark",children:e.jsxs(s,{sx:{display:"grid",gap:2,gridTemplateColumns:{xs:"1fr",md:"1fr 1fr"}},children:[e.jsx(a,{...o,...v,parts:["phrase","syntax"]}),e.jsx(a,{...o,...v,parts:["graph","explain"]})]})})}};var M,L,k;d.parameters={...d.parameters,docs:{...(M=d.parameters)==null?void 0:M.docs,source:{originalSource:`{
  name: 'Menu (e24) · dark',
  render: () => <Frame mode="dark" title="menu · bread 20 → 25"><LLMS {...MENU_EN} expandedGraph={MENU_FULL} /></Frame>
}`,...(k=(L=d.parameters)==null?void 0:L.docs)==null?void 0:k.source}}};var S,j,E;c.parameters={...c.parameters,docs:{...(S=c.parameters)==null?void 0:S.docs,source:{originalSource:`{
  name: 'Menu (e24) · light',
  render: () => <Frame mode="light"><LLMS {...MENU_EN} expandedGraph={MENU_FULL} /></Frame>
}`,...(E=(j=c.parameters)==null?void 0:j.docs)==null?void 0:E.source}}};var P,B,F;l.parameters={...l.parameters,docs:{...(P=l.parameters)==null?void 0:P.docs,source:{originalSource:`{
  name: 'Menú (español)',
  render: () => <Frame mode="dark" title="menú · pan 20 → 25"><LLMS {...MENU_ES} /></Frame>
}`,...(F=(B=l.parameters)==null?void 0:B.docs)==null?void 0:F.source}}};var C,N,w;u.parameters={...u.parameters,docs:{...(C=u.parameters)==null?void 0:C.docs,source:{originalSource:`{
  name: 'Robot canProceed',
  render: () => <Frame mode="dark" title="robot.canProceed = battery >= minimumBattery"><LLMS {...ROBOT} /></Frame>
}`,...(w=(N=u.parameters)==null?void 0:N.docs)==null?void 0:w.source}}};var T,U,_;h.parameters={...h.parameters,docs:{...(T=h.parameters)==null?void 0:T.docs,source:{originalSource:`{
  name: 'Three themes',
  render: () => <Box sx={{
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit,minmax(340px,1fr))'
  }}>
      <Frame themeId="neurons.me" mode="dark" title="neurons.me · dark"><LLMS {...MENU_EN} /></Frame>
      <Frame themeId="ghost.shell" mode="dark" title="GhostShell · dark"><LLMS {...MENU_EN} /></Frame>
      <Frame themeId="prince-of-darkness" mode="light" title="PrinceOfDarkness · light"><LLMS {...ROBOT} /></Frame>
    </Box>
}`,...(_=(U=h.parameters)==null?void 0:U.docs)==null?void 0:_.source}}};var O,A,H;x.parameters={...x.parameters,docs:{...(O=x.parameters)==null?void 0:O.docs,source:{originalSource:`{
  name: 'Mobile (360px)',
  parameters: {
    viewport: {
      defaultViewport: 'mobile1'
    }
  },
  render: () => <Frame mode="dark" width={360}><LLMS {...MENU_ES} graphHeight={160} /></Frame>
}`,...(H=(A=x.parameters)==null?void 0:A.docs)==null?void 0:H.source}}};var G,R,I,D,q;i.parameters={...i.parameters,docs:{...(G=i.parameters)==null?void 0:G.docs,source:{originalSource:`{
  name: 'Composed parts',
  render: function Composed() {
    const [a, setA] = useState<string | null>(null);
    return <Frame mode="dark">
        <LLMS {...MENU_EN} onActivePath={setA}>
          <Box sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: {
            xs: '1fr',
            md: '1fr 1fr'
          }
        }}>
            <Box><LLMS.Phrase /><Box sx={{
              mt: 1
            }}><LLMS.Syntax /></Box><LLMS.Explain /></Box>
            <LLMS.Graph height={260} />
          </Box>
        </LLMS>
        <Typography variant="caption" sx={{
        color: 'text.secondary',
        fontFamily: 'monospace'
      }}>active: {a ?? '—'}</Typography>
      </Frame>;
  }
}`,...(I=(R=i.parameters)==null?void 0:R.docs)==null?void 0:I.source},description:{story:"compose the parts yourself: one Provider shares the active path; report it out with onActivePath",...(q=(D=i.parameters)==null?void 0:D.docs)==null?void 0:q.description}}};var z,W,V,X,J;p.parameters={...p.parameters,docs:{...(z=p.parameters)==null?void 0:z.docs,source:{originalSource:`{
  name: 'Controlled (two in sync)',
  render: function Controlled() {
    const [hov, setHov] = useState<string | null>(null),
      [pin, setPin] = useState<string | null>('menu.bread.price');
    const p = {
      activePath: hov ?? pin,
      onHoverPath: setHov,
      onPinPath: (k: string) => setPin(x => x === k ? null : k)
    };
    return <Frame mode="dark">
        <Box sx={{
        display: 'grid',
        gap: 2,
        gridTemplateColumns: {
          xs: '1fr',
          md: '1fr 1fr'
        }
      }}>
          <LLMS {...MENU_EN} {...p} parts={['phrase', 'syntax']} />
          <LLMS {...MENU_EN} {...p} parts={['graph', 'explain']} />
        </Box>
      </Frame>;
  }
}`,...(V=(W=p.parameters)==null?void 0:W.docs)==null?void 0:V.source},description:{story:"controlled: the page owns the active path (e.g. several LLMS on one page staying in sync)",...(J=(X=p.parameters)==null?void 0:X.docs)==null?void 0:J.description}}};const se=["MenuDark","MenuLight","MenuEspanol","Robot","Themes","Mobile","Composed","Controlled"];export{i as Composed,p as Controlled,d as MenuDark,l as MenuEspanol,c as MenuLight,x as Mobile,u as Robot,h as Themes,se as __namedExportsOrder,ne as default};
