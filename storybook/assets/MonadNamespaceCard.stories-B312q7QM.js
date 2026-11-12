import{j as C,r as _}from"./iframe-D0caXraM.js";import{M as B,u as I}from"./MonadNamespaceCard-B0bwxtPn.js";import{r as K}from"./monad0-a_Xwvs2i.js";import"./preload-helper-Dp1pzeXC.js";import"./monad.ai-kaQw1Tbg.js";import"./sha3-Cdf6muM1.js";import"./QR.me-BFxfwB3W.js";import"./Avatar-DpCE2P7T.js";import"./Avatar-DA2IiRv7.js";import"./createSvgIcon-TkOxIDkm.js";import"./useSlot-Cy0-9XXJ.js";import"./useForkRef-XNQZmqk0.js";import"./Switch-C-3H6IVI.js";import"./Grow-DLLXf6dE.js";import"./TransitionGroupContext-yoRJhQyt.js";import"./useFormControl-CvrkDGak.js";import"./ButtonBase-Dn4a5hRT.js";import"./Button-CXS3QqkH.js";import"./Icon-QhGitz5d.js";import"./Button-5KcQE1lk.js";import"./CircularProgress-9BrVdoMo.js";import"./Paper-xXEET6BR.js";import"./Paper-Bk81HPwT.js";import"./Tooltip-DuFS0zf6.js";import"./Tooltip-iopH_C2q.js";import"./QR-CGlSa-7g.js";import"./PixelWordmark-TWm0y5_J.js";const Ee={title:"Pieces/Monad",component:B,parameters:{layout:"padded"}},r=[{name:"Haiku",port:4101,healthy:!0},{name:"Lisa",port:4102,healthy:!0}],s={args:{namespace:"suis-macbook-air.local",name:"Haiku",healthy:!0,apps:r,sleepingEntries:[{name:"Freddie"}],waking:{},restartStatus:"idle"}},t={args:{namespace:"suis-macbook-air.local",healthy:!1,apps:[],sleepingEntries:[],waking:{},restartStatus:"idle"}},n={args:{namespace:"suis-macbook-air.local",name:"Haiku",healthy:!0,apps:r,sleepingEntries:[{name:"Freddie"}],waking:{Freddie:!0},restartStatus:"restarting"}},o={args:{namespace:"suis-macbook-air.local",name:"Haiku",healthy:null,apps:r,sleepingEntries:[],waking:{},restartStatus:"idle"}},i={args:{namespace:"suis-macbook-air.local",name:"Haiku",healthy:!0,apps:r,sleepingEntries:[],waking:{},restartStatus:"error",restartError:"apps/restart-all failed: 502"}},l="http://localhost/apps/netget",U={monadId:"monad:abc",monadName:"Haiku",namespace:"netget.local",signature:"valid"},p={args:{namespace:"netget.local",name:"Haiku",healthy:!0,apps:r,detection:K({transport:l,answered:U,session:{transportOrigin:l,namespace:"ana.netget.local"}})}},c={args:{namespace:"netget.local",name:"Haiku",healthy:!0,apps:r,detection:K({transport:l,answered:U,session:null})}};function P(e){try{const a=new URL(e);return Number(a.port)||(a.protocol==="https:"?443:80)}catch{return 0}}function q(e){return e.lastUpdatedAt===null?null:e.monads.some(a=>a.healthy)}function z(e){return{name:e.name||e.id,port:P(e.endpoint),healthy:e.healthy}}function G(){const e=I({storage:null}),{rescan:a}=e;return _.useEffect(()=>a({mode:"normal",reason:"story:open"}),[a]),C.jsx(B,{namespace:"localhost",name:e.monads.map(u=>u.name||u.id).join(", ")||void 0,healthy:q(e),apps:e.monads.map(z),sleepingEntries:[],waking:{},restartStatus:"idle",meshDefaultOpen:!0})}const m={render:()=>C.jsx(G,{})};var d,g,h;s.parameters={...s.parameters,docs:{...(d=s.parameters)==null?void 0:d.docs,source:{originalSource:`{
  args: {
    namespace: 'suis-macbook-air.local',
    name: 'Haiku',
    healthy: true,
    apps,
    sleepingEntries: [{
      name: 'Freddie'
    }],
    waking: {},
    restartStatus: 'idle'
  }
}`,...(h=(g=s.parameters)==null?void 0:g.docs)==null?void 0:h.source}}};var k,y,f;t.parameters={...t.parameters,docs:{...(k=t.parameters)==null?void 0:k.docs,source:{originalSource:`{
  args: {
    namespace: 'suis-macbook-air.local',
    healthy: false,
    apps: [],
    sleepingEntries: [],
    waking: {},
    restartStatus: 'idle'
  }
}`,...(f=(y=t.parameters)==null?void 0:y.docs)==null?void 0:f.source}}};var S,E,M;n.parameters={...n.parameters,docs:{...(S=n.parameters)==null?void 0:S.docs,source:{originalSource:`{
  args: {
    namespace: 'suis-macbook-air.local',
    name: 'Haiku',
    healthy: true,
    apps,
    sleepingEntries: [{
      name: 'Freddie'
    }],
    waking: {
      'Freddie': true
    },
    restartStatus: 'restarting'
  }
}`,...(M=(E=n.parameters)==null?void 0:E.docs)==null?void 0:M.source}}};var w,H,b;o.parameters={...o.parameters,docs:{...(w=o.parameters)==null?void 0:w.docs,source:{originalSource:`{
  args: {
    namespace: 'suis-macbook-air.local',
    name: 'Haiku',
    healthy: null,
    apps,
    sleepingEntries: [],
    waking: {},
    restartStatus: 'idle'
  }
}`,...(b=(H=o.parameters)==null?void 0:H.docs)==null?void 0:b.source}}};var F,R,x;i.parameters={...i.parameters,docs:{...(F=i.parameters)==null?void 0:F.docs,source:{originalSource:`{
  args: {
    namespace: 'suis-macbook-air.local',
    name: 'Haiku',
    healthy: true,
    apps,
    sleepingEntries: [],
    waking: {},
    restartStatus: 'error',
    restartError: 'apps/restart-all failed: 502'
  }
}`,...(x=(R=i.parameters)==null?void 0:R.docs)==null?void 0:x.source}}};var N,L,T;p.parameters={...p.parameters,docs:{...(N=p.parameters)==null?void 0:N.docs,source:{originalSource:`{
  args: {
    namespace: 'netget.local',
    name: 'Haiku',
    healthy: true,
    apps,
    detection: readMonad0({
      transport: T,
      answered,
      session: {
        transportOrigin: T,
        namespace: 'ana.netget.local'
      }
    })
  }
}`,...(T=(L=p.parameters)==null?void 0:L.docs)==null?void 0:T.source}}};var j,O,v;c.parameters={...c.parameters,docs:{...(j=c.parameters)==null?void 0:j.docs,source:{originalSource:`{
  args: {
    namespace: 'netget.local',
    name: 'Haiku',
    healthy: true,
    apps,
    detection: readMonad0({
      transport: T,
      answered,
      session: null
    })
  }
}`,...(v=(O=c.parameters)==null?void 0:O.docs)==null?void 0:v.source}}};var D,Y,A;m.parameters={...m.parameters,docs:{...(D=m.parameters)==null?void 0:D.docs,source:{originalSource:`{
  render: () => <LocalhostMonads />
}`,...(A=(Y=m.parameters)==null?void 0:Y.docs)==null?void 0:A.source}}};const Me=["Default","NoMonadsRegistered","RestartingMesh","Checking","RestartFailed","YourMonad0","AMonadNotKnownToBeYours","Localhost"];export{c as AMonadNotKnownToBeYours,o as Checking,s as Default,m as Localhost,t as NoMonadsRegistered,i as RestartFailed,n as RestartingMesh,p as YourMonad0,Me as __namedExportsOrder,Ee as default};
