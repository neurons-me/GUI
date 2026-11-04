import{j as e,r as g}from"./iframe-CWBlVoSh.js";import{b as c,C as J,c as Z,r as $,s as ee}from"./CleakerKeychain-Dcvxk4nD.js";import{I as r}from"./IdentityIconRow-Bc49wfu4.js";import"./preload-helper-Dp1pzeXC.js";import"./localIdentityVault-s9IV2zl-.js";import"./me.es-Bc6mvw-6.js";import"./Icon-CB0Uj0Aw.js";const ne={title:"Pieces/Keychain/Service keys",component:c,parameters:{layout:"fullscreen"}},a="storybook.demo",oe="storybook-demo-passphrase";function s({saved:y,children:U}){const[X,Y]=g.useState(!1);return g.useEffect(()=>{let u=!0;return(async()=>{for(const o of Z)$(a,o);for(const o of y)await ee(a,o,o==="meta"||o==="openai"||o==="grok"?{apiKey:"demo-not-a-real-key"}:o==="github"?{token:"demo-token"}:o==="facebook"?{appId:"demo-app",appSecret:"demo-secret"}:o==="whatsapp"?{accessToken:"demo-token",phoneNumberId:"000"}:o==="sms"?{accountSid:"ACdemo",authToken:"demo",fromNumber:"+10000000000"}:o==="google"?{clientId:"demo-id.apps.example",clientSecret:"demo-secret"}:{clientId:"demo-id",clientSecret:"demo-secret",channel:"demo"},oe);u&&Y(!0)})(),()=>{u=!1}},[y.join(",")]),X?e.jsx(e.Fragment,{children:U()}):null}const d=()=>e.jsx(s,{saved:[],children:()=>e.jsx(t,{children:e.jsx(c,{namespace:a})})}),n=()=>e.jsx(s,{saved:["twitch"],children:()=>e.jsx(t,{children:e.jsx(c,{namespace:a})})}),i=()=>e.jsx(s,{saved:[],children:()=>e.jsx(t,{children:e.jsx(c,{namespace:a,focusedService:"twitch"})})}),l=()=>e.jsx(s,{saved:["paypal"],children:()=>e.jsx(t,{children:e.jsx(c,{namespace:a,focusedService:"paypal"})})}),p=()=>e.jsx(s,{saved:["google"],children:()=>e.jsx(t,{children:e.jsx(c,{namespace:a,focusedService:"google"})})}),m=()=>e.jsx(s,{saved:["github"],children:()=>e.jsx("div",{style:{height:600,overflow:"auto"},children:e.jsx(J,{handle:"jabellae",keys:[{keyId:"key-laptop",label:"This laptop",admin:!0,authorization:"active",localAvailability:"available-unlocked",addedAt:Date.now()-864e5}],serviceKeysNamespace:a,focusServiceKeys:!0})})}),v=()=>e.jsx(s,{saved:["twitch","meta","google","openai","linkedin","grok","github","facebook","whatsapp","sms"],children:()=>e.jsx(J,{handle:"jabellae",keys:[{keyId:"key-laptop",label:"This laptop",admin:!0,authorization:"active",localAvailability:"available-unlocked",addedAt:Date.now()-864e5}],serviceKeysNamespace:a})}),S=()=>e.jsx(t,{children:e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:24,alignItems:"center",paddingTop:16},children:[e.jsx(r,{nodeId:"story.qr",savedServices:[],onNavigate:()=>{}}),e.jsx(r,{nodeId:"story.qr",savedServices:["twitch"],onNavigate:()=>{}}),e.jsx(r,{nodeId:"story.qr",savedServices:["openai","linkedin"],onNavigate:()=>{}}),e.jsx(r,{nodeId:"story.qr",savedServices:["twitch","paypal","meta","google","openai","linkedin"],onNavigate:()=>{}})]})}),h=()=>e.jsx(t,{children:e.jsx("div",{style:{display:"flex",justifyContent:"center",paddingTop:16},children:e.jsx(r,{nodeId:"story.qr",savedServices:["twitch","google","linkedin","grok","github","whatsapp"],maxServiceIcons:99,onNavigate:()=>{}})})});function t({children:y}){return e.jsx("div",{style:{maxWidth:440,margin:"0 auto",padding:24},children:y})}d.__docgenInfo={description:"",methods:[],displayName:"NoneSaved"};n.__docgenInfo={description:"",methods:[],displayName:"TwitchSaved"};i.__docgenInfo={description:"Twitch card with the optional OBS WebSocket subsection focused (#twitch).",methods:[],displayName:"TwitchObsWebSocket"};l.__docgenInfo={description:"",methods:[],displayName:"FocusedFromQrIcon"};p.__docgenInfo={description:"",methods:[],displayName:"GoogleFocused"};m.__docgenInfo={description:"",methods:[],displayName:"ScrolledToSection"};v.__docgenInfo={description:"",methods:[],displayName:"InKeychainList"};S.__docgenInfo={description:"",methods:[],displayName:"QrIconRow"};h.__docgenInfo={description:"",methods:[],displayName:"QrIconRowAllVisible"};var x,I,f;d.parameters={...d.parameters,docs:{...(x=d.parameters)==null?void 0:x.docs,source:{originalSource:"() => <Seeded saved={[]}>{() => <Box440><ServiceKeysSection namespace={NS} /></Box440>}</Seeded>",...(f=(I=d.parameters)==null?void 0:I.docs)==null?void 0:f.source}}};var k,w,b;n.parameters={...n.parameters,docs:{...(k=n.parameters)==null?void 0:k.docs,source:{originalSource:"() => <Seeded saved={['twitch']}>{() => <Box440><ServiceKeysSection namespace={NS} /></Box440>}</Seeded>",...(b=(w=n.parameters)==null?void 0:w.docs)==null?void 0:b.source}}};var j,N,K,_,T;i.parameters={...i.parameters,docs:{...(j=i.parameters)==null?void 0:j.docs,source:{originalSource:'() => <Seeded saved={[]}>{() => <Box440><ServiceKeysSection namespace={NS} focusedService="twitch" /></Box440>}</Seeded>',...(K=(N=i.parameters)==null?void 0:N.docs)==null?void 0:K.source},description:{story:"Twitch card with the optional OBS WebSocket subsection focused (#twitch).",...(T=(_=i.parameters)==null?void 0:_.docs)==null?void 0:T.description}}};var B,R,A;l.parameters={...l.parameters,docs:{...(B=l.parameters)==null?void 0:B.docs,source:{originalSource:`() => <Seeded saved={['paypal']}>{() => <Box440><ServiceKeysSection namespace={NS} focusedService="paypal" /></Box440>}</Seeded>`,...(A=(R=l.parameters)==null?void 0:R.docs)==null?void 0:A.source}}};var q,F,Q;p.parameters={...p.parameters,docs:{...(q=p.parameters)==null?void 0:q.docs,source:{originalSource:`() => <Seeded saved={['google']}>{() => <Box440><ServiceKeysSection namespace={NS} focusedService="google" /></Box440>}</Seeded>`,...(Q=(F=p.parameters)==null?void 0:F.docs)==null?void 0:Q.source}}};var C,D,E;m.parameters={...m.parameters,docs:{...(C=m.parameters)==null?void 0:C.docs,source:{originalSource:`() => <Seeded saved={['github']}>
    {() => <div style={{
    height: 600,
    overflow: 'auto'
  }}>
        <CleakerKeychain handle="jabellae" keys={[{
      keyId: 'key-laptop',
      label: 'This laptop',
      admin: true,
      authorization: 'active',
      localAvailability: 'available-unlocked',
      addedAt: Date.now() - 864e5
    }]} serviceKeysNamespace={NS} focusServiceKeys />
      </div>}
  </Seeded>`,...(E=(D=m.parameters)==null?void 0:D.docs)==null?void 0:E.source}}};var O,W,z;v.parameters={...v.parameters,docs:{...(O=v.parameters)==null?void 0:O.docs,source:{originalSource:`() => <Seeded saved={['twitch', 'meta', 'google', 'openai', 'linkedin', 'grok', 'github', 'facebook', 'whatsapp', 'sms']}>
    {() => <CleakerKeychain handle="jabellae" keys={[{
    keyId: 'key-laptop',
    label: 'This laptop',
    admin: true,
    authorization: 'active',
    localAvailability: 'available-unlocked',
    addedAt: Date.now() - 864e5
  }]} serviceKeysNamespace={NS} />}
  </Seeded>`,...(z=(W=v.parameters)==null?void 0:W.docs)==null?void 0:z.source}}};var V,G,L;S.parameters={...S.parameters,docs:{...(V=S.parameters)==null?void 0:V.docs,source:{originalSource:`() => <Box440>
    <div style={{
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
    alignItems: 'center',
    paddingTop: 16
  }}>
      <IdentityIconRow nodeId="story.qr" savedServices={[]} onNavigate={() => {}} />
      <IdentityIconRow nodeId="story.qr" savedServices={['twitch']} onNavigate={() => {}} />
      <IdentityIconRow nodeId="story.qr" savedServices={['openai', 'linkedin']} onNavigate={() => {}} />
      <IdentityIconRow nodeId="story.qr" savedServices={['twitch', 'paypal', 'meta', 'google', 'openai', 'linkedin']} onNavigate={() => {}} />
    </div>
  </Box440>`,...(L=(G=S.parameters)==null?void 0:G.docs)==null?void 0:L.source}}};var P,M,H;h.parameters={...h.parameters,docs:{...(P=h.parameters)==null?void 0:P.docs,source:{originalSource:`() => <Box440>
    <div style={{
    display: 'flex',
    justifyContent: 'center',
    paddingTop: 16
  }}>
      <IdentityIconRow nodeId="story.qr" savedServices={['twitch', 'google', 'linkedin', 'grok', 'github', 'whatsapp']} maxServiceIcons={99} onNavigate={() => {}} />
    </div>
  </Box440>`,...(H=(M=h.parameters)==null?void 0:M.docs)==null?void 0:H.source}}};const le=["NoneSaved","TwitchSaved","TwitchObsWebSocket","FocusedFromQrIcon","GoogleFocused","ScrolledToSection","InKeychainList","QrIconRow","QrIconRowAllVisible"];export{l as FocusedFromQrIcon,p as GoogleFocused,v as InKeychainList,d as NoneSaved,S as QrIconRow,h as QrIconRowAllVisible,m as ScrolledToSection,i as TwitchObsWebSocket,n as TwitchSaved,le as __namedExportsOrder,ne as default};
