import{M}from"./MonadMesh-FUfwbC99.js";import"./iframe-q72FflWy.js";import"./preload-helper-Dp1pzeXC.js";const _={title:"All.This/monad.ai/MonadMesh",component:M,parameters:{layout:"padded"}},n=[{name:"monad:cleaker",port:4101,healthy:!0},{name:"monad:netget",port:4102,healthy:!0}],e={args:{apps:n,sleepingEntries:[{name:"monad:cold-store"}]}},r={args:{apps:n,sleepingEntries:[{name:"monad:cold-store"}],defaultOpen:!0}},a={args:{apps:[],sleepingEntries:[],defaultOpen:!0}},s={args:{apps:n,sleepingEntries:[],defaultOpen:!0,restartStatus:"restarting"}},t={args:{apps:n,sleepingEntries:[],defaultOpen:!0,restartStatus:"error",restartError:"apps/restart-all failed: 502"}},k=["Collapsed","Expanded","Empty","Restarting","RestartError"];var o,p,d;e.parameters={...e.parameters,docs:{...(o=e.parameters)==null?void 0:o.docs,source:{originalSource:`{
  args: {
    apps,
    sleepingEntries: [{
      name: 'monad:cold-store'
    }]
  }
}`,...(d=(p=e.parameters)==null?void 0:p.docs)==null?void 0:d.source}}};var l,c,m;r.parameters={...r.parameters,docs:{...(l=r.parameters)==null?void 0:l.docs,source:{originalSource:`{
  args: {
    apps,
    sleepingEntries: [{
      name: 'monad:cold-store'
    }],
    defaultOpen: true
  }
}`,...(m=(c=r.parameters)==null?void 0:c.docs)==null?void 0:m.source}}};var i,u,g;a.parameters={...a.parameters,docs:{...(i=a.parameters)==null?void 0:i.docs,source:{originalSource:`{
  args: {
    apps: [],
    sleepingEntries: [],
    defaultOpen: true
  }
}`,...(g=(u=a.parameters)==null?void 0:u.docs)==null?void 0:g.source}}};var E,f,O;s.parameters={...s.parameters,docs:{...(E=s.parameters)==null?void 0:E.docs,source:{originalSource:`{
  args: {
    apps,
    sleepingEntries: [],
    defaultOpen: true,
    restartStatus: 'restarting'
  }
}`,...(O=(f=s.parameters)==null?void 0:f.docs)==null?void 0:O.source}}};var S,h,y;t.parameters={...t.parameters,docs:{...(S=t.parameters)==null?void 0:S.docs,source:{originalSource:`{
  args: {
    apps,
    sleepingEntries: [],
    defaultOpen: true,
    restartStatus: 'error',
    restartError: 'apps/restart-all failed: 502'
  }
}`,...(y=(h=t.parameters)==null?void 0:h.docs)==null?void 0:y.source}}};export{e as Collapsed,a as Empty,r as Expanded,t as RestartError,s as Restarting,k as __namedExportsOrder,_ as default};
