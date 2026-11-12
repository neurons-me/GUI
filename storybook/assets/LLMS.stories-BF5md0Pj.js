import{j as e,r as x,h as i,i as C}from"./iframe-D0caXraM.js";import{L as a}from"./LLMS-BQ7xs6rJ.js";import{W as Ae}from"./WithTheme.story-BtcFkwFk.js";import"./preload-helper-Dp1pzeXC.js";const o={phrase:"Bread now costs 25, the coffee stays at 45; what is the menu total?",ops:[{op:"set",path:"menu.bread.price",value:25},{op:"define",path:"menu",name:"total",expr:"coffee.price + bread.price"},{op:"query",paths:["menu.total"]}],graph:{nodes:[{path:"menu.coffee.price",value:45},{path:"menu.bread.price",value:25,before:20},{path:"menu.total",value:70,derived:!0}],edges:[{from:"menu.coffee.price",to:"menu.total"},{from:"menu.bread.price",to:"menu.total"}]},explain:{path:"menu.total",value:70,expr:"coffee.price + bread.price",derivation:{inputs:[{path:"menu.coffee.price",value:45,origin:"public",masked:!1,status:"ok"},{path:"menu.bread.price",value:25,origin:"public",masked:!1,status:"ok"}]},meta:{dependsOn:["menu.coffee.price","menu.bread.price"]}},changed:["menu.bread.price","menu.total"]},F={phrase:"El pan ahora cuesta 25 y el café sigue en 45; ¿cuánto es el total del menú?",ops:[{op:"set",path:"menu.pan.precio",value:25},{op:"define",path:"menu",name:"total",expr:"cafe.precio + pan.precio"},{op:"query",paths:["menu.total"]}],graph:{nodes:[{path:"menu.cafe.precio",value:45},{path:"menu.pan.precio",value:25,before:20},{path:"menu.total",value:70,derived:!0}],edges:[{from:"menu.cafe.precio",to:"menu.total"},{from:"menu.pan.precio",to:"menu.total"}]},explain:{path:"menu.total",value:70,expr:"cafe.precio + pan.precio",derivation:{inputs:[{path:"menu.cafe.precio",value:45,origin:"public",masked:!1,status:"ok"},{path:"menu.pan.precio",value:25,origin:"public",masked:!1,status:"ok"}]},meta:{dependsOn:["menu.cafe.precio","menu.pan.precio"]}},changed:["menu.pan.precio","menu.total"],labels:{changed:"← lo acabas de cambiar",recomputed:(n,t)=>e.jsxs(e.Fragment,{children:["Cambiaste ",e.jsx("code",{children:n}),", así que ",e.jsx("code",{children:t})," se recalculó solo."]}),zoomIn:"Acercar",zoomOut:"Alejar",reset:"Restablecer vista",expand:"Ampliar",graph:"grafo de estado"}},Be={phrase:"The robot can proceed only when its battery is at least the minimum battery. Battery is 82, minimum battery 30.",ops:[{op:"set",path:"robot.battery",value:82},{op:"set",path:"robot.minimumBattery",value:30},{op:"define",path:"robot",name:"canProceed",expr:"battery >= minimumBattery"}],graph:{nodes:[{path:"robot.battery",value:82},{path:"robot.minimumBattery",value:30},{path:"robot.canProceed",value:!0,derived:!0}],edges:[{from:"robot.battery",to:"robot.canProceed"},{from:"robot.minimumBattery",to:"robot.canProceed"}]},explain:{path:"robot.canProceed",value:!0,expr:"battery >= minimumBattery",derivation:{inputs:[{path:"robot.battery",value:82,origin:"public",masked:!1,status:"ok"},{path:"robot.minimumBattery",value:30,origin:"public",masked:!1,status:"ok"}]},meta:{dependsOn:["robot.battery","robot.minimumBattery"]}},changed:["robot.battery","robot.minimumBattery","robot.canProceed"],aliases:{"can proceed":"robot.canProceed","minimum battery":"robot.minimumBattery"}},Ue={nodes:[{path:"menu.coffee.price",value:45},{path:"menu.coffee.name",value:"Café de olla"},{path:"menu.bread.price",value:25},{path:"menu.bread.name",value:"Concha"},{path:"menu.total",value:70,derived:!0},{path:"cafe.name",value:"e24"},{path:"cafe.city",value:"CDMX"},{path:"staff[0].name",value:"Ana"},{path:"staff[1].name",value:"Luis"},{path:"wallet.key",value:"x",masked:!0}],edges:[{from:"menu.coffee.price",to:"menu.total"},{from:"menu.bread.price",to:"menu.total"}]},r=({themeId:n,mode:t,title:s,width:p,children:m})=>e.jsx(Ae,{themeId:n,mode:t,children:e.jsxs(i,{sx:{p:2,bgcolor:"background.default",color:"text.primary",minHeight:"100%",width:p??"100%",maxWidth:"100%"},children:[s&&e.jsx(C,{variant:"overline",sx:{color:"text.secondary",display:"block",mb:1},children:s}),m]})}),Re={title:"LLMS/LLMS",component:a,parameters:{layout:"fullscreen",docs:{description:{component:'How a sentence becomes .me: the phrase, the ops as .me code, the state graph and me.explain(), sharing one active path. Hover (or tap) a word, a code token, a graph node or an explain row; everything that names the same path lights up. Changes show inline in the code (faint old value →) and derived results at the end of their ["="] line. pending (before Confirm): dashed graph, no values. collapsed (after Confirm): code + output fold into a clickable ▸ ✓ n ops applied line. graphMode="static" + explainOnSelect: the per-message snapshot (no zoom; explain() opens on tap). Interactive graph: wheel / pinch to zoom, drag to pan, ⟲ resets, ⤢ expands.'}}}},d={graphMode:"static",explainOnSelect:!0,graphHeight:150},c={name:"Message (static snapshot)",render:()=>e.jsx(r,{mode:"dark",title:"tap a node or token to open explain()",children:e.jsx(a,{...F,...d})})},f={name:"Message · mobile",render:()=>e.jsx(r,{mode:"dark",width:360,children:e.jsx(a,{...o,...d})})},l={name:"Message · applied (collapsed)",render:()=>e.jsx(r,{mode:"dark",title:"hover a graph node: the summary lights up",children:e.jsx(a,{...o,...d,collapsed:!0,output:"Applied."})})},M={name:"Message · confirm → collapse",render:function(){const[t,s]=x.useState(!1);return e.jsxs(r,{mode:"dark",width:420,children:[e.jsx(a,{...o,...d,pending:!t,collapsed:t,output:t?"Applied.":void 0}),!t&&e.jsx(i,{sx:{mt:1},children:e.jsx("button",{type:"button",onClick:()=>s(!0),children:"Confirm"})})]})}},b={name:"Message · pending (before Confirm)",render:()=>e.jsx(r,{mode:"dark",title:"dashed, no values, no result until Confirm",children:e.jsx(a,{...o,...d,pending:!0})})},u={name:"Message · focus + inline edit",render:function(){const[t,s]=x.useState(null);return e.jsxs(r,{mode:"dark",width:460,title:"bread.price focused: edit 25 and press Enter",children:[e.jsx(a,{...o,...d,collapsed:!0,output:"Applied.",focusPath:"menu.bread.price",onEditValue:(p,m)=>s(`op ${p} → ${JSON.stringify(m)} (new proposal)`)}),e.jsx(C,{variant:"caption",sx:{color:"text.secondary",fontFamily:"monospace"},children:t??"—"})]})}},y={name:"Message · applied · mobile",render:()=>e.jsx(r,{mode:"dark",width:360,children:e.jsx(a,{...F,...d,collapsed:!0,output:"Aplicado.",labels:{applied:n=>`${n} ops aplicadas`}})})},v={name:"Menu (e24) · dark",render:()=>e.jsx(r,{mode:"dark",title:"menu · bread 20 → 25",children:e.jsx(a,{...o,expandedGraph:Ue})})},k={name:"Menu (e24) · light",render:()=>e.jsx(r,{mode:"light",children:e.jsx(a,{...o,expandedGraph:Ue})})},S={name:"Menú (español)",render:()=>e.jsx(r,{mode:"dark",title:"menú · pan 20 → 25",children:e.jsx(a,{...F})})},L={name:"Robot canProceed",render:()=>e.jsx(r,{mode:"dark",title:"robot.canProceed = battery >= minimumBattery",children:e.jsx(a,{...Be})})},E={name:"Three themes",render:()=>e.jsxs(i,{sx:{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(340px,1fr))"},children:[e.jsx(r,{themeId:"neurons.me",mode:"dark",title:"neurons.me · dark",children:e.jsx(a,{...o})}),e.jsx(r,{themeId:"ghost.shell",mode:"dark",title:"GhostShell · dark",children:e.jsx(a,{...o})}),e.jsx(r,{themeId:"prince-of-darkness",mode:"light",title:"PrinceOfDarkness · light",children:e.jsx(a,{...Be})})]})},j={name:"Mobile (360px)",parameters:{viewport:{defaultViewport:"mobile1"}},render:()=>e.jsx(r,{mode:"dark",width:360,children:e.jsx(a,{...F,graphHeight:160})})},h={name:"Composed parts",render:function(){const[t,s]=x.useState(null);return e.jsxs(r,{mode:"dark",children:[e.jsx(a,{...o,onActivePath:s,children:e.jsxs(i,{sx:{display:"grid",gap:2,gridTemplateColumns:{xs:"1fr",md:"1fr 1fr"}},children:[e.jsxs(i,{children:[e.jsx(a.Phrase,{}),e.jsx(i,{sx:{mt:1},children:e.jsx(a.Syntax,{})}),e.jsx(a.Explain,{})]}),e.jsx(a.Graph,{height:260})]})}),e.jsxs(C,{variant:"caption",sx:{color:"text.secondary",fontFamily:"monospace"},children:["active: ",t??"—"]})]})}},g={name:"Controlled (two in sync)",render:function(){const[t,s]=x.useState(null),[p,m]=x.useState("menu.bread.price"),N={activePath:t??p,onHoverPath:s,onPinPath:w=>m(_e=>_e===w?null:w)};return e.jsx(r,{mode:"dark",children:e.jsxs(i,{sx:{display:"grid",gap:2,gridTemplateColumns:{xs:"1fr",md:"1fr 1fr"}},children:[e.jsx(a,{...o,...N,parts:["phrase","syntax"]}),e.jsx(a,{...o,...N,parts:["graph","explain"]})]})})}};var P,B,U,_,A;c.parameters={...c.parameters,docs:{...(P=c.parameters)==null?void 0:P.docs,source:{originalSource:`{
  name: 'Message (static snapshot)',
  render: () => <Frame mode="dark" title="tap a node or token to open explain()"><LLMS {...MENU_ES} {...MSG} /></Frame>
}`,...(U=(B=c.parameters)==null?void 0:B.docs)==null?void 0:U.source},description:{story:"how a chat message shows it: static snapshot of the touched nodes; explain() appears when a node / token is tapped",...(A=(_=c.parameters)==null?void 0:_.docs)==null?void 0:A.description}}};var T,O,G;f.parameters={...f.parameters,docs:{...(T=f.parameters)==null?void 0:T.docs,source:{originalSource:`{
  name: 'Message · mobile',
  render: () => <Frame mode="dark" width={360}><LLMS {...MENU_EN} {...MSG} /></Frame>
}`,...(G=(O=f.parameters)==null?void 0:O.docs)==null?void 0:G.source}}};var H,R,I,$,D;l.parameters={...l.parameters,docs:{...(H=l.parameters)==null?void 0:H.docs,source:{originalSource:`{
  name: 'Message · applied (collapsed)',
  render: () => <Frame mode="dark" title="hover a graph node: the summary lights up"><LLMS {...MENU_EN} {...MSG} collapsed output="Applied." /></Frame>
}`,...(I=(R=l.parameters)==null?void 0:R.docs)==null?void 0:I.source},description:{story:"after Confirm: code + output fold into one muted summary line (▸ ✓ n ops applied); the static snapshot stays. Tap the line to expand.",...(D=($=l.parameters)==null?void 0:$.docs)==null?void 0:D.description}}};var z,V,q;M.parameters={...M.parameters,docs:{...(z=M.parameters)==null?void 0:z.docs,source:{originalSource:`{
  name: 'Message · confirm → collapse',
  render: function MessageConfirm() {
    const [ok, setOk] = useState(false);
    return <Frame mode="dark" width={420}>
        <LLMS {...MENU_EN} {...MSG} pending={!ok} collapsed={ok} output={ok ? 'Applied.' : undefined} />
        {!ok && <Box sx={{
        mt: 1
      }}><button type="button" onClick={() => setOk(true)}>Confirm</button></Box>}
      </Frame>;
  }
}`,...(q=(V=M.parameters)==null?void 0:V.docs)==null?void 0:q.source}}};var W,J,X;b.parameters={...b.parameters,docs:{...(W=b.parameters)==null?void 0:W.docs,source:{originalSource:`{
  name: 'Message · pending (before Confirm)',
  render: () => <Frame mode="dark" title="dashed, no values, no result until Confirm"><LLMS {...MENU_EN} {...MSG} pending /></Frame>
}`,...(X=(J=b.parameters)==null?void 0:J.docs)==null?void 0:X.source}}};var K,Q,Y,Z,ee;u.parameters={...u.parameters,docs:{...(K=u.parameters)==null?void 0:K.docs,source:{originalSource:`{
  name: 'Message · focus + inline edit',
  render: function MessageEdit() {
    const [ed, setEd] = useState<string | null>(null);
    return <Frame mode="dark" width={460} title="bread.price focused: edit 25 and press Enter">
        <LLMS {...MENU_EN} {...MSG} collapsed output="Applied." focusPath="menu.bread.price" onEditValue={(i, v) => setEd(\`op \${i} → \${JSON.stringify(v)} (new proposal)\`)} />
        <Typography variant="caption" sx={{
        color: 'text.secondary',
        fontFamily: 'monospace'
      }}>{ed ?? '—'}</Typography>
      </Frame>;
  }
}`,...(Y=(Q=u.parameters)==null?void 0:Q.docs)==null?void 0:Y.source},description:{story:"a graph node click focuses the op line that wrote it; its value edits inline (Enter) and becomes a new local proposal",...(ee=(Z=u.parameters)==null?void 0:Z.docs)==null?void 0:ee.description}}};var ae,re,te;y.parameters={...y.parameters,docs:{...(ae=y.parameters)==null?void 0:ae.docs,source:{originalSource:`{
  name: 'Message · applied · mobile',
  render: () => <Frame mode="dark" width={360}><LLMS {...MENU_ES} {...MSG} collapsed output="Aplicado." labels={{
      applied: n => \`\${n} ops aplicadas\`
    }} /></Frame>
}`,...(te=(re=y.parameters)==null?void 0:re.docs)==null?void 0:te.source}}};var oe,se,ne;v.parameters={...v.parameters,docs:{...(oe=v.parameters)==null?void 0:oe.docs,source:{originalSource:`{
  name: 'Menu (e24) · dark',
  render: () => <Frame mode="dark" title="menu · bread 20 → 25"><LLMS {...MENU_EN} expandedGraph={MENU_FULL} /></Frame>
}`,...(ne=(se=v.parameters)==null?void 0:se.docs)==null?void 0:ne.source}}};var ie,de,pe;k.parameters={...k.parameters,docs:{...(ie=k.parameters)==null?void 0:ie.docs,source:{originalSource:`{
  name: 'Menu (e24) · light',
  render: () => <Frame mode="light"><LLMS {...MENU_EN} expandedGraph={MENU_FULL} /></Frame>
}`,...(pe=(de=k.parameters)==null?void 0:de.docs)==null?void 0:pe.source}}};var me,ce,le;S.parameters={...S.parameters,docs:{...(me=S.parameters)==null?void 0:me.docs,source:{originalSource:`{
  name: 'Menú (español)',
  render: () => <Frame mode="dark" title="menú · pan 20 → 25"><LLMS {...MENU_ES} /></Frame>
}`,...(le=(ce=S.parameters)==null?void 0:ce.docs)==null?void 0:le.source}}};var ue,he,ge;L.parameters={...L.parameters,docs:{...(ue=L.parameters)==null?void 0:ue.docs,source:{originalSource:`{
  name: 'Robot canProceed',
  render: () => <Frame mode="dark" title="robot.canProceed = battery >= minimumBattery"><LLMS {...ROBOT} /></Frame>
}`,...(ge=(he=L.parameters)==null?void 0:he.docs)==null?void 0:ge.source}}};var xe,fe,Me;E.parameters={...E.parameters,docs:{...(xe=E.parameters)==null?void 0:xe.docs,source:{originalSource:`{
  name: 'Three themes',
  render: () => <Box sx={{
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit,minmax(340px,1fr))'
  }}>
      <Frame themeId="neurons.me" mode="dark" title="neurons.me · dark"><LLMS {...MENU_EN} /></Frame>
      <Frame themeId="ghost.shell" mode="dark" title="GhostShell · dark"><LLMS {...MENU_EN} /></Frame>
      <Frame themeId="prince-of-darkness" mode="light" title="PrinceOfDarkness · light"><LLMS {...ROBOT} /></Frame>
    </Box>
}`,...(Me=(fe=E.parameters)==null?void 0:fe.docs)==null?void 0:Me.source}}};var be,ye,ve;j.parameters={...j.parameters,docs:{...(be=j.parameters)==null?void 0:be.docs,source:{originalSource:`{
  name: 'Mobile (360px)',
  parameters: {
    viewport: {
      defaultViewport: 'mobile1'
    }
  },
  render: () => <Frame mode="dark" width={360}><LLMS {...MENU_ES} graphHeight={160} /></Frame>
}`,...(ve=(ye=j.parameters)==null?void 0:ye.docs)==null?void 0:ve.source}}};var ke,Se,Le,Ee,je;h.parameters={...h.parameters,docs:{...(ke=h.parameters)==null?void 0:ke.docs,source:{originalSource:`{
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
}`,...(Le=(Se=h.parameters)==null?void 0:Se.docs)==null?void 0:Le.source},description:{story:"compose the parts yourself: one Provider shares the active path; report it out with onActivePath",...(je=(Ee=h.parameters)==null?void 0:Ee.docs)==null?void 0:je.description}}};var Fe,Ce,Ne,we,Pe;g.parameters={...g.parameters,docs:{...(Fe=g.parameters)==null?void 0:Fe.docs,source:{originalSource:`{
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
}`,...(Ne=(Ce=g.parameters)==null?void 0:Ce.docs)==null?void 0:Ne.source},description:{story:"controlled: the page owns the active path (e.g. several LLMS on one page staying in sync)",...(Pe=(we=g.parameters)==null?void 0:we.docs)==null?void 0:Pe.description}}};const Ie=["Message","MessageMobile","MessageApplied","MessageConfirm","MessagePending","MessageEdit","MessageAppliedMobile","MenuDark","MenuLight","MenuEspanol","Robot","Themes","Mobile","Composed","Controlled"];export{h as Composed,g as Controlled,v as MenuDark,S as MenuEspanol,k as MenuLight,c as Message,l as MessageApplied,y as MessageAppliedMobile,M as MessageConfirm,u as MessageEdit,f as MessageMobile,b as MessagePending,j as Mobile,L as Robot,E as Themes,Ie as __namedExportsOrder,Re as default};
