import{M as B}from"./MonadNamespaceCard-BMBshUZ1.js";import{r as x}from"./monad0-DERkp9hZ.js";import"./iframe-9xs7r-yC.js";import"./preload-helper-Dp1pzeXC.js";import"./monad.ai-Ch60oneH.js";import"./sha3-B6us4W0r.js";import"./QR.me-Bvj1XMys.js";import"./Avatar-CYaJ7BCk.js";import"./Avatar-CHOZ5ucK.js";import"./createSvgIcon-ApOObPh6.js";import"./useSlot-Pi2X4fgs.js";import"./resolveComponentProps-Cy9ikCBM.js";import"./useForkRef-CY5C0zUu.js";import"./Button-BZ2a02w5.js";import"./Icon-Coo2vCLK.js";import"./Button-2IZqaMH4.js";import"./ButtonBase-CmaSafY6.js";import"./TransitionGroupContext-Ddsw9Vt9.js";import"./CircularProgress-Cc9H9qAL.js";import"./Paper-D3ZYW61L.js";import"./Paper-BQJEQDIX.js";import"./Tooltip-lv5D5rZR.js";import"./Tooltip-DsQxmgoN.js";import"./useControlled-CR8NUisP.js";import"./Grow-CkmZyC82.js";import"./useSlotProps-CEMoFeCz.js";import"./QR-zlQ_2wL-.js";import"./PixelWordmark-B2V_vzxG.js";const ie={title:"Pieces/Monad",component:B,parameters:{layout:"padded"}},e=[{name:"monad:cleaker",port:4101,healthy:!0},{name:"monad:netget",port:4102,healthy:!0}],a={args:{namespace:"suis-macbook-air.local",healthy:!0,apps:e,sleepingEntries:[{name:"monad:cold-store"}],waking:{},restartStatus:"idle"}},r={args:{namespace:"suis-macbook-air.local",healthy:!1,apps:[],sleepingEntries:[],waking:{},restartStatus:"idle"}},t={args:{namespace:"suis-macbook-air.local",healthy:!0,apps:e,sleepingEntries:[{name:"monad:cold-store"}],waking:{"monad:cold-store":!0},restartStatus:"restarting"}},s={args:{namespace:"suis-macbook-air.local",healthy:null,apps:e,sleepingEntries:[],waking:{},restartStatus:"idle"}},n={args:{namespace:"suis-macbook-air.local",healthy:!0,apps:e,sleepingEntries:[],waking:{},restartStatus:"error",restartError:"apps/restart-all failed: 502"}},p="http://localhost/apps/netget",A={monadId:"monad:abc",monadName:"netget",namespace:"netget.local",signature:"valid"},o={args:{namespace:"netget.local",healthy:!0,apps:e,detection:x({transport:p,answered:A,session:{transportOrigin:p,namespace:"ana.netget.local"}})}},i={args:{namespace:"netget.local",healthy:!0,apps:e,detection:x({transport:p,answered:A,session:null})}};var c,m,l;a.parameters={...a.parameters,docs:{...(c=a.parameters)==null?void 0:c.docs,source:{originalSource:`{
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
