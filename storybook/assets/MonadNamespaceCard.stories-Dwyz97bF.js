import{j as C,r as _}from"./iframe-Dgz0DvjP.js";import{M as B,u as I}from"./MonadNamespaceCard-Q3D4BSnK.js";import{r as K}from"./monad0-BS00-6A5.js";import"./preload-helper-Dp1pzeXC.js";import"./monad.ai-CRRJCTMv.js";import"./sha3-Bn30YVQW.js";import"./QR.me-BskVFbDs.js";import"./Avatar-BlQEDC2q.js";import"./Avatar-CRm8ZbT3.js";import"./createSvgIcon-BTgnJVyE.js";import"./useSlot-CjwkB68v.js";import"./resolveComponentProps-C7RzSJ6V.js";import"./useForkRef-DhiyL1xF.js";import"./Tooltip-Dxz6oaTn.js";import"./Tooltip-B13adE9r.js";import"./TransitionGroupContext-Bovk2g5c.js";import"./useControlled-DSrQ-lxT.js";import"./useEventCallback-CW9ai8zV.js";import"./Grow-D7g5qnif.js";import"./useSlotProps-D6FndUWw.js";import"./Icon-zhfCvvEA.js";import"./QR-BWW61rs2.js";import"./PixelWordmark-DlzTr5ww.js";const ke={title:"Pieces/Monad",component:B,parameters:{layout:"padded"}},r=[{name:"Haiku",port:4101,healthy:!0},{name:"Lisa",port:4102,healthy:!0}],s={args:{namespace:"suis-macbook-air.local",name:"Haiku",healthy:!0,apps:r,sleepingEntries:[{name:"Freddie"}],waking:{},restartStatus:"idle"}},n={args:{namespace:"suis-macbook-air.local",healthy:!1,apps:[],sleepingEntries:[],waking:{},restartStatus:"idle"}},t={args:{namespace:"suis-macbook-air.local",name:"Haiku",healthy:!0,apps:r,sleepingEntries:[{name:"Freddie"}],waking:{Freddie:!0},restartStatus:"restarting"}},o={args:{namespace:"suis-macbook-air.local",name:"Haiku",healthy:null,apps:r,sleepingEntries:[],waking:{},restartStatus:"idle"}},i={args:{namespace:"suis-macbook-air.local",name:"Haiku",healthy:!0,apps:r,sleepingEntries:[],waking:{},restartStatus:"error",restartError:"apps/restart-all failed: 502"}},m="http://localhost/apps/netget",U={monadId:"monad:abc",monadName:"Haiku",namespace:"netget.local",signature:"valid"},c={args:{namespace:"netget.local",name:"Haiku",healthy:!0,apps:r,detection:K({transport:m,answered:U,session:{transportOrigin:m,namespace:"ana.netget.local"}})}},p={args:{namespace:"netget.local",name:"Haiku",healthy:!0,apps:r,detection:K({transport:m,answered:U,session:null})}};function P(e){try{const a=new URL(e);return Number(a.port)||(a.protocol==="https:"?443:80)}catch{return 0}}function q(e){return e.lastUpdatedAt===null?null:e.monads.some(a=>a.healthy)}function z(e){return{name:e.name||e.id,port:P(e.endpoint),healthy:e.healthy}}function G(){const e=I({storage:null}),{rescan:a}=e;return _.useEffect(()=>a({mode:"normal",reason:"story:open"}),[a]),C.jsx(B,{namespace:"localhost",name:e.monads.map(u=>u.name||u.id).join(", ")||void 0,healthy:q(e),apps:e.monads.map(z),sleepingEntries:[],waking:{},restartStatus:"idle",meshDefaultOpen:!0})}const l={render:()=>C.jsx(G,{})};var d,g,h;s.parameters={...s.parameters,docs:{...(d=s.parameters)==null?void 0:d.docs,source:{originalSource:`{
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
}`,...(h=(g=s.parameters)==null?void 0:g.docs)==null?void 0:h.source}}};var k,y,f;n.parameters={...n.parameters,docs:{...(k=n.parameters)==null?void 0:k.docs,source:{originalSource:`{
  args: {
    namespace: 'suis-macbook-air.local',
    healthy: false,
    apps: [],
    sleepingEntries: [],
    waking: {},
    restartStatus: 'idle'
  }
}`,...(f=(y=n.parameters)==null?void 0:y.docs)==null?void 0:f.source}}};var S,E,M;t.parameters={...t.parameters,docs:{...(S=t.parameters)==null?void 0:S.docs,source:{originalSource:`{
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
}`,...(M=(E=t.parameters)==null?void 0:E.docs)==null?void 0:M.source}}};var w,H,b;o.parameters={...o.parameters,docs:{...(w=o.parameters)==null?void 0:w.docs,source:{originalSource:`{
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
}`,...(x=(R=i.parameters)==null?void 0:R.docs)==null?void 0:x.source}}};var N,L,T;c.parameters={...c.parameters,docs:{...(N=c.parameters)==null?void 0:N.docs,source:{originalSource:`{
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
}`,...(T=(L=c.parameters)==null?void 0:L.docs)==null?void 0:T.source}}};var j,O,v;p.parameters={...p.parameters,docs:{...(j=p.parameters)==null?void 0:j.docs,source:{originalSource:`{
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
}`,...(v=(O=p.parameters)==null?void 0:O.docs)==null?void 0:v.source}}};var D,Y,A;l.parameters={...l.parameters,docs:{...(D=l.parameters)==null?void 0:D.docs,source:{originalSource:`{
  render: () => <LocalhostMonads />
}`,...(A=(Y=l.parameters)==null?void 0:Y.docs)==null?void 0:A.source}}};const ye=["Default","NoMonadsRegistered","RestartingMesh","Checking","RestartFailed","YourMonad0","AMonadNotKnownToBeYours","Localhost"];export{p as AMonadNotKnownToBeYours,o as Checking,s as Default,l as Localhost,n as NoMonadsRegistered,i as RestartFailed,t as RestartingMesh,c as YourMonad0,ye as __namedExportsOrder,ke as default};
