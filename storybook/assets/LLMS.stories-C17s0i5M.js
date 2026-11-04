import{j as e,r as M,q as n,v as ne}from"./iframe-jME6TRyu.js";import{L as a}from"./LLMS-C38MYZgr.js";import{W as ce}from"./WithTheme.story-kcFTCcjb.js";import"./preload-helper-Dp1pzeXC.js";const t={phrase:"Bread now costs 25, the coffee stays at 45; what is the menu total?",ops:[{op:"set",path:"menu.bread.price",value:25},{op:"define",path:"menu",name:"total",expr:"coffee.price + bread.price"},{op:"query",paths:["menu.total"]}],graph:{nodes:[{path:"menu.coffee.price",value:45},{path:"menu.bread.price",value:25,before:20},{path:"menu.total",value:70,derived:!0}],edges:[{from:"menu.coffee.price",to:"menu.total"},{from:"menu.bread.price",to:"menu.total"}]},explain:{path:"menu.total",value:70,expr:"coffee.price + bread.price",derivation:{inputs:[{path:"menu.coffee.price",value:45,origin:"public",masked:!1,status:"ok"},{path:"menu.bread.price",value:25,origin:"public",masked:!1,status:"ok"}]},meta:{dependsOn:["menu.coffee.price","menu.bread.price"]}},changed:["menu.bread.price","menu.total"]},y={phrase:"El pan ahora cuesta 25 y el café sigue en 45; ¿cuánto es el total del menú?",ops:[{op:"set",path:"menu.pan.precio",value:25},{op:"define",path:"menu",name:"total",expr:"cafe.precio + pan.precio"},{op:"query",paths:["menu.total"]}],graph:{nodes:[{path:"menu.cafe.precio",value:45},{path:"menu.pan.precio",value:25,before:20},{path:"menu.total",value:70,derived:!0}],edges:[{from:"menu.cafe.precio",to:"menu.total"},{from:"menu.pan.precio",to:"menu.total"}]},explain:{path:"menu.total",value:70,expr:"cafe.precio + pan.precio",derivation:{inputs:[{path:"menu.cafe.precio",value:45,origin:"public",masked:!1,status:"ok"},{path:"menu.pan.precio",value:25,origin:"public",masked:!1,status:"ok"}]},meta:{dependsOn:["menu.cafe.precio","menu.pan.precio"]}},changed:["menu.pan.precio","menu.total"],labels:{changed:"← lo acabas de cambiar",recomputed:(i,o)=>e.jsxs(e.Fragment,{children:["Cambiaste ",e.jsx("code",{children:i}),", así que ",e.jsx("code",{children:o})," se recalculó solo."]}),zoomIn:"Acercar",zoomOut:"Alejar",reset:"Restablecer vista",expand:"Ampliar",graph:"grafo de estado"}},ie={phrase:"The robot can proceed only when its battery is at least the minimum battery. Battery is 82, minimum battery 30.",ops:[{op:"set",path:"robot.battery",value:82},{op:"set",path:"robot.minimumBattery",value:30},{op:"define",path:"robot",name:"canProceed",expr:"battery >= minimumBattery"}],graph:{nodes:[{path:"robot.battery",value:82},{path:"robot.minimumBattery",value:30},{path:"robot.canProceed",value:!0,derived:!0}],edges:[{from:"robot.battery",to:"robot.canProceed"},{from:"robot.minimumBattery",to:"robot.canProceed"}]},explain:{path:"robot.canProceed",value:!0,expr:"battery >= minimumBattery",derivation:{inputs:[{path:"robot.battery",value:82,origin:"public",masked:!1,status:"ok"},{path:"robot.minimumBattery",value:30,origin:"public",masked:!1,status:"ok"}]},meta:{dependsOn:["robot.battery","robot.minimumBattery"]}},changed:["robot.battery","robot.minimumBattery","robot.canProceed"],aliases:{"can proceed":"robot.canProceed","minimum battery":"robot.minimumBattery"}},me={nodes:[{path:"menu.coffee.price",value:45},{path:"menu.coffee.name",value:"Café de olla"},{path:"menu.bread.price",value:25},{path:"menu.bread.name",value:"Concha"},{path:"menu.total",value:70,derived:!0},{path:"cafe.name",value:"e24"},{path:"cafe.city",value:"CDMX"},{path:"staff[0].name",value:"Ana"},{path:"staff[1].name",value:"Luis"},{path:"wallet.key",value:"x",masked:!0}],edges:[{from:"menu.coffee.price",to:"menu.total"},{from:"menu.bread.price",to:"menu.total"}]},r=({themeId:i,mode:o,title:s,width:b,children:v})=>e.jsx(ce,{themeId:i,mode:o,children:e.jsxs(n,{sx:{p:2,bgcolor:"background.default",color:"text.primary",minHeight:"100%",width:b??"100%",maxWidth:"100%"},children:[s&&e.jsx(ne,{variant:"overline",sx:{color:"text.secondary",display:"block",mb:1},children:s}),v]})}),ge={title:"LLMS/LLMS",component:a,parameters:{layout:"fullscreen",docs:{description:{component:'How a sentence becomes .me: the phrase, the ops as .me code, the state graph and me.explain(), sharing one active path. Hover (or tap) a word, a code token, a graph node or an explain row; everything that names the same path lights up. Changes show inline in the code (faint old value →) and derived results at the end of their ["="] line. graphMode="static" + explainOnSelect: the per-message snapshot (no zoom; explain() opens on tap). Interactive graph: wheel / pinch to zoom, drag to pan, ⟲ resets, ⤢ expands.'}}}},pe={graphMode:"static",explainOnSelect:!0,graphHeight:150},m={name:"Message (static snapshot)",render:()=>e.jsx(r,{mode:"dark",title:"tap a node or token to open explain()",children:e.jsx(a,{...y,...pe})})},c={name:"Message · mobile",render:()=>e.jsx(r,{mode:"dark",width:360,children:e.jsx(a,{...t,...pe})})},l={name:"Menu (e24) · dark",render:()=>e.jsx(r,{mode:"dark",title:"menu · bread 20 → 25",children:e.jsx(a,{...t,expandedGraph:me})})},u={name:"Menu (e24) · light",render:()=>e.jsx(r,{mode:"light",children:e.jsx(a,{...t,expandedGraph:me})})},h={name:"Menú (español)",render:()=>e.jsx(r,{mode:"dark",title:"menú · pan 20 → 25",children:e.jsx(a,{...y})})},x={name:"Robot canProceed",render:()=>e.jsx(r,{mode:"dark",title:"robot.canProceed = battery >= minimumBattery",children:e.jsx(a,{...ie})})},g={name:"Three themes",render:()=>e.jsxs(n,{sx:{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(340px,1fr))"},children:[e.jsx(r,{themeId:"neurons.me",mode:"dark",title:"neurons.me · dark",children:e.jsx(a,{...t})}),e.jsx(r,{themeId:"ghost.shell",mode:"dark",title:"GhostShell · dark",children:e.jsx(a,{...t})}),e.jsx(r,{themeId:"prince-of-darkness",mode:"light",title:"PrinceOfDarkness · light",children:e.jsx(a,{...ie})})]})},f={name:"Mobile (360px)",parameters:{viewport:{defaultViewport:"mobile1"}},render:()=>e.jsx(r,{mode:"dark",width:360,children:e.jsx(a,{...y,graphHeight:160})})},p={name:"Composed parts",render:function(){const[o,s]=M.useState(null);return e.jsxs(r,{mode:"dark",children:[e.jsx(a,{...t,onActivePath:s,children:e.jsxs(n,{sx:{display:"grid",gap:2,gridTemplateColumns:{xs:"1fr",md:"1fr 1fr"}},children:[e.jsxs(n,{children:[e.jsx(a.Phrase,{}),e.jsx(n,{sx:{mt:1},children:e.jsx(a.Syntax,{})}),e.jsx(a.Explain,{})]}),e.jsx(a.Graph,{height:260})]})}),e.jsxs(ne,{variant:"caption",sx:{color:"text.secondary",fontFamily:"monospace"},children:["active: ",o??"—"]})]})}},d={name:"Controlled (two in sync)",render:function(){const[o,s]=M.useState(null),[b,v]=M.useState("menu.bread.price"),k={activePath:o??b,onHoverPath:s,onPinPath:L=>v(de=>de===L?null:L)};return e.jsx(r,{mode:"dark",children:e.jsxs(n,{sx:{display:"grid",gap:2,gridTemplateColumns:{xs:"1fr",md:"1fr 1fr"}},children:[e.jsx(a,{...t,...k,parts:["phrase","syntax"]}),e.jsx(a,{...t,...k,parts:["graph","explain"]})]})})}};var S,j,E,F,P;m.parameters={...m.parameters,docs:{...(S=m.parameters)==null?void 0:S.docs,source:{originalSource:`{
  name: 'Message (static snapshot)',
  render: () => <Frame mode="dark" title="tap a node or token to open explain()"><LLMS {...MENU_ES} {...MSG} /></Frame>
}`,...(E=(j=m.parameters)==null?void 0:j.docs)==null?void 0:E.source},description:{story:"how a chat message shows it: static snapshot of the touched nodes; explain() appears when a node / token is tapped",...(P=(F=m.parameters)==null?void 0:F.docs)==null?void 0:P.description}}};var B,w,N;c.parameters={...c.parameters,docs:{...(B=c.parameters)==null?void 0:B.docs,source:{originalSource:`{
  name: 'Message · mobile',
  render: () => <Frame mode="dark" width={360}><LLMS {...MENU_EN} {...MSG} /></Frame>
}`,...(N=(w=c.parameters)==null?void 0:w.docs)==null?void 0:N.source}}};var C,U,T;l.parameters={...l.parameters,docs:{...(C=l.parameters)==null?void 0:C.docs,source:{originalSource:`{
  name: 'Menu (e24) · dark',
  render: () => <Frame mode="dark" title="menu · bread 20 → 25"><LLMS {...MENU_EN} expandedGraph={MENU_FULL} /></Frame>
}`,...(T=(U=l.parameters)==null?void 0:U.docs)==null?void 0:T.source}}};var _,O,G;u.parameters={...u.parameters,docs:{...(_=u.parameters)==null?void 0:_.docs,source:{originalSource:`{
  name: 'Menu (e24) · light',
  render: () => <Frame mode="light"><LLMS {...MENU_EN} expandedGraph={MENU_FULL} /></Frame>
}`,...(G=(O=u.parameters)==null?void 0:O.docs)==null?void 0:G.source}}};var H,A,R;h.parameters={...h.parameters,docs:{...(H=h.parameters)==null?void 0:H.docs,source:{originalSource:`{
  name: 'Menú (español)',
  render: () => <Frame mode="dark" title="menú · pan 20 → 25"><LLMS {...MENU_ES} /></Frame>
}`,...(R=(A=h.parameters)==null?void 0:A.docs)==null?void 0:R.source}}};var I,D,q;x.parameters={...x.parameters,docs:{...(I=x.parameters)==null?void 0:I.docs,source:{originalSource:`{
  name: 'Robot canProceed',
  render: () => <Frame mode="dark" title="robot.canProceed = battery >= minimumBattery"><LLMS {...ROBOT} /></Frame>
}`,...(q=(D=x.parameters)==null?void 0:D.docs)==null?void 0:q.source}}};var z,W,V;g.parameters={...g.parameters,docs:{...(z=g.parameters)==null?void 0:z.docs,source:{originalSource:`{
  name: 'Three themes',
  render: () => <Box sx={{
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit,minmax(340px,1fr))'
  }}>
      <Frame themeId="neurons.me" mode="dark" title="neurons.me · dark"><LLMS {...MENU_EN} /></Frame>
      <Frame themeId="ghost.shell" mode="dark" title="GhostShell · dark"><LLMS {...MENU_EN} /></Frame>
      <Frame themeId="prince-of-darkness" mode="light" title="PrinceOfDarkness · light"><LLMS {...ROBOT} /></Frame>
    </Box>
}`,...(V=(W=g.parameters)==null?void 0:W.docs)==null?void 0:V.source}}};var X,J,K;f.parameters={...f.parameters,docs:{...(X=f.parameters)==null?void 0:X.docs,source:{originalSource:`{
  name: 'Mobile (360px)',
  parameters: {
    viewport: {
      defaultViewport: 'mobile1'
    }
  },
  render: () => <Frame mode="dark" width={360}><LLMS {...MENU_ES} graphHeight={160} /></Frame>
}`,...(K=(J=f.parameters)==null?void 0:J.docs)==null?void 0:K.source}}};var Q,Y,Z,$,ee;p.parameters={...p.parameters,docs:{...(Q=p.parameters)==null?void 0:Q.docs,source:{originalSource:`{
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
}`,...(Z=(Y=p.parameters)==null?void 0:Y.docs)==null?void 0:Z.source},description:{story:"compose the parts yourself: one Provider shares the active path; report it out with onActivePath",...(ee=($=p.parameters)==null?void 0:$.docs)==null?void 0:ee.description}}};var ae,re,te,oe,se;d.parameters={...d.parameters,docs:{...(ae=d.parameters)==null?void 0:ae.docs,source:{originalSource:`{
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
}`,...(te=(re=d.parameters)==null?void 0:re.docs)==null?void 0:te.source},description:{story:"controlled: the page owns the active path (e.g. several LLMS on one page staying in sync)",...(se=(oe=d.parameters)==null?void 0:oe.docs)==null?void 0:se.description}}};const fe=["Message","MessageMobile","MenuDark","MenuLight","MenuEspanol","Robot","Themes","Mobile","Composed","Controlled"];export{p as Composed,d as Controlled,l as MenuDark,h as MenuEspanol,u as MenuLight,m as Message,c as MessageMobile,f as Mobile,x as Robot,g as Themes,fe as __namedExportsOrder,ge as default};
