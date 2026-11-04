import{M as B}from"./MonadNamespaceCard-BTlsY5XO.js";import{r as x}from"./monad0-BgFL_hps.js";import"./iframe-jME6TRyu.js";import"./preload-helper-Dp1pzeXC.js";import"./monad.ai-w1SLzpU8.js";import"./sha3-BJbA_H_U.js";import"./QR.me-BP2QBDUV.js";import"./Avatar-CMm04gBo.js";import"./Avatar-DUU9vCmx.js";import"./createSvgIcon-jWV4H6K5.js";import"./useSlot-C61ruhcO.js";import"./resolveComponentProps-BQXnF4aQ.js";import"./useForkRef-z1e785Ns.js";import"./Button-ffxJjIdt.js";import"./Icon-BtaMh9kU.js";import"./Button-CLDQrykt.js";import"./ButtonBase-BOSaDjG-.js";import"./TransitionGroupContext-BRZCH32N.js";import"./CircularProgress-DVHqJ1WQ.js";import"./Paper-D0AE__Fu.js";import"./Paper-Ndu2Ngkb.js";import"./Tooltip-B6C2EAF_.js";import"./Tooltip-Bce4NUBE.js";import"./useControlled-Cu8K_Z2u.js";import"./Grow-CX1iIK_S.js";import"./useSlotProps-BeRtKzOs.js";import"./QR-BYa4MQd7.js";import"./PixelWordmark-BbsAJd6c.js";const ie={title:"Pieces/Monad",component:B,parameters:{layout:"padded"}},e=[{name:"monad:cleaker",port:4101,healthy:!0},{name:"monad:netget",port:4102,healthy:!0}],a={args:{namespace:"suis-macbook-air.local",healthy:!0,apps:e,sleepingEntries:[{name:"monad:cold-store"}],waking:{},restartStatus:"idle"}},r={args:{namespace:"suis-macbook-air.local",healthy:!1,apps:[],sleepingEntries:[],waking:{},restartStatus:"idle"}},t={args:{namespace:"suis-macbook-air.local",healthy:!0,apps:e,sleepingEntries:[{name:"monad:cold-store"}],waking:{"monad:cold-store":!0},restartStatus:"restarting"}},s={args:{namespace:"suis-macbook-air.local",healthy:null,apps:e,sleepingEntries:[],waking:{},restartStatus:"idle"}},n={args:{namespace:"suis-macbook-air.local",healthy:!0,apps:e,sleepingEntries:[],waking:{},restartStatus:"error",restartError:"apps/restart-all failed: 502"}},p="http://localhost/apps/netget",A={monadId:"monad:abc",monadName:"netget",namespace:"netget.local",signature:"valid"},o={args:{namespace:"netget.local",healthy:!0,apps:e,detection:x({transport:p,answered:A,session:{transportOrigin:p,namespace:"ana.netget.local"}})}},i={args:{namespace:"netget.local",healthy:!0,apps:e,detection:x({transport:p,answered:A,session:null})}};var c,m,l;a.parameters={...a.parameters,docs:{...(c=a.parameters)==null?void 0:c.docs,source:{originalSource:`{
  args: {
    namespace: 'suis-macbook-air.local',
    healthy: true,
    apps,
    sleepingEntries: [{
      name: 'monad:cold-store'
    }],
    waking: {},
    restartStatus: 'idle'
  }
}`,...(l=(m=a.parameters)==null?void 0:m.docs)==null?void 0:l.source}}};var d,u,g;r.parameters={...r.parameters,docs:{...(d=r.parameters)==null?void 0:d.docs,source:{originalSource:`{
  args: {
    namespace: 'suis-macbook-air.local',
    healthy: false,
    apps: [],
    sleepingEntries: [],
    waking: {},
    restartStatus: 'idle'
  }
}`,...(g=(u=r.parameters)==null?void 0:u.docs)==null?void 0:g.source}}};var h,k,y;t.parameters={...t.parameters,docs:{...(h=t.parameters)==null?void 0:h.docs,source:{originalSource:`{
  args: {
    namespace: 'suis-macbook-air.local',
    healthy: true,
    apps,
    sleepingEntries: [{
      name: 'monad:cold-store'
    }],
    waking: {
      'monad:cold-store': true
    },
    restartStatus: 'restarting'
  }
}`,...(y=(k=t.parameters)==null?void 0:k.docs)==null?void 0:y.source}}};var S,w,M;s.parameters={...s.parameters,docs:{...(S=s.parameters)==null?void 0:S.docs,source:{originalSource:`{
  args: {
    namespace: 'suis-macbook-air.local',
    healthy: null,
    apps,
    sleepingEntries: [],
    waking: {},
    restartStatus: 'idle'
  }
}`,...(M=(w=s.parameters)==null?void 0:w.docs)==null?void 0:M.source}}};var E,b,f;n.parameters={...n.parameters,docs:{...(E=n.parameters)==null?void 0:E.docs,source:{originalSource:`{
  args: {
    namespace: 'suis-macbook-air.local',
    healthy: true,
    apps,
    sleepingEntries: [],
    waking: {},
    restartStatus: 'error',
    restartError: 'apps/restart-all failed: 502'
  }
}`,...(f=(b=n.parameters)==null?void 0:b.docs)==null?void 0:f.source}}};var N,R,T;o.parameters={...o.parameters,docs:{...(N=o.parameters)==null?void 0:N.docs,source:{originalSource:`{
  args: {
    namespace: 'netget.local',
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
}`,...(T=(R=o.parameters)==null?void 0:R.docs)==null?void 0:T.source}}};var Y,C,O;i.parameters={...i.parameters,docs:{...(Y=i.parameters)==null?void 0:Y.docs,source:{originalSource:`{
  args: {
    namespace: 'netget.local',
    healthy: true,
    apps,
    detection: readMonad0({
      transport: T,
      answered,
      session: null
    })
  }
}`,...(O=(C=i.parameters)==null?void 0:C.docs)==null?void 0:O.source}}};const pe=["Default","NoMonadsRegistered","RestartingMesh","Checking","RestartFailed","YourMonad0","AMonadNotKnownToBeYours"];export{i as AMonadNotKnownToBeYours,s as Checking,a as Default,r as NoMonadsRegistered,n as RestartFailed,t as RestartingMesh,o as YourMonad0,pe as __namedExportsOrder,ie as default};
