import{j as s,T as p,r as g}from"./iframe-q72FflWy.js";import{L as u}from"./LogsView-DsdfsJcC.js";import"./preload-helper-Dp1pzeXC.js";import"./trustedOrigin-D_D34UBw.js";import"./Paper-9gdP3SeZ.js";import"./Paper-C4cHEfmg.js";const U={title:"All.This/netget/Main Server/Logs",component:u,parameters:{layout:"fullscreen"}};function $(c){const e=["GET","GET","GET","POST","PUT","DELETE"],t=["/gateway-identity","/openresty-status","/domains","/logs","/add-domain","/entrypoints","/ip-info"],o=[200,200,200,200,304,404,500],n=["127.0.0.1","192.168.68.104","10.0.0.5"];return Array.from({length:c},(i,r)=>{const a=o[r%o.length];return{id:r,timestamp:new Date(Date.now()-r*45e3).toISOString(),level:a>=500?"ERROR":a>=400?"WARN":"INFO",method:e[r%e.length],path:t[r%t.length],status:a,ip:n[r%n.length],message:`${e[r%e.length]} ${t[r%t.length]} - ${a}`,fullLine:`${n[r%n.length]} - - [${new Date(Date.now()-r*45e3).toUTCString()}] "${e[r%e.length]} ${t[r%t.length]} HTTP/1.1" ${a} 512 "-" "Mozilla/5.0"`}})}function k(c){const e=["upstream timed out (110: Connection timed out) while reading response header from upstream","could not build server_names_hash, you should increase server_names_hash_bucket_size","*1234 connect() failed (111: Connection refused) while connecting to upstream"];return Array.from({length:c},(t,o)=>({id:o,timestamp:new Date(Date.now()-o*12e4).toISOString(),level:o%4===0?"WARN":"ERROR",pid:21831+o%3,message:e[o%e.length],fullLine:`2026/09/11 0${o%9+1}:22:1${o%10} [error] ${21831+o%3}#0: ${e[o%e.length]}`}))}function N(c){const e=["GET","POST"],t=["/gateway-identity","/setup/verify-code","/openresty/install/progress","/domains/metadata"];return Array.from({length:c},(o,n)=>({id:n,timestamp:new Date(Date.now()-n*6e4).toISOString(),level:"INFO",method:e[n%e.length],path:t[n%t.length],message:`${e[n%e.length]} ${t[n%t.length]}`,fullLine:`${new Date(Date.now()-n*6e4).toISOString()} - ${e[n%e.length]} ${t[n%t.length]}`}))}const A={access:$(140),error:k(37),server:N(58)};function M(){return function({children:e}){const t=g.useRef(null);return t.current===null&&(t.current=window.fetch,window.fetch=async o=>{const n=new URL(String(o),"http://stubbed.local");if(!n.pathname.endsWith("/logs"))return new Response("",{status:404});const i=n.searchParams.get("type")||"access",r=Number(n.searchParams.get("limit")||50),a=Number(n.searchParams.get("offset")||0),w=A[i]||[],F={logs:w.slice(a,a+r),total:w.length,fileSize:i==="access"?"2.4 MB":i==="error"?"186 KB":"640 KB",truncated:!1,logType:i};return new Response(JSON.stringify(F),{status:200,headers:{"content-type":"application/json"}})}),g.useEffect(()=>()=>{t.current&&(window.fetch=t.current)},[]),s.jsx(s.Fragment,{children:e})}}const S=M(),f="netget:admin-session-token";function K(){return function({children:e}){const t=g.useRef(!1);if(!t.current){t.current=!0;try{window.localStorage.setItem(f,"story-mock-session-token")}catch{}}return g.useEffect(()=>()=>{try{window.localStorage.removeItem(f)}catch{}},[]),s.jsx(s.Fragment,{children:e})}}const D=K(),l=()=>s.jsx(p,{children:s.jsx(D,{children:s.jsx(S,{children:s.jsx(u,{endpoint:"http://stubbed.local"})})})}),d=()=>s.jsx(p,{children:s.jsx(D,{children:s.jsx(S,{children:s.jsx(u,{endpoint:"http://stubbed.local",initialSearch:"add-domain"})})})}),m=()=>{try{window.localStorage.removeItem(f)}catch{}return s.jsx(p,{children:s.jsx(S,{children:s.jsx(u,{endpoint:"http://stubbed.local"})})})},h=()=>s.jsx(p,{children:s.jsx(u,{endpoint:"http://local.netget"})});l.__docgenInfo={description:"",methods:[],displayName:"Default"};d.__docgenInfo={description:"",methods:[],displayName:"FilteredByDomain"};m.__docgenInfo={description:"",methods:[],displayName:"SignInRequired"};h.__docgenInfo={description:"",methods:[],displayName:"Live"};const W=["Default","FilteredByDomain","SignInRequired","Live"];var y,b,L;l.parameters={...l.parameters,docs:{...(y=l.parameters)==null?void 0:y.docs,source:{originalSource:`() => <Theme>
    <MockAdminSession>
      <LogsFetchStub>
        <LogsView endpoint="http://stubbed.local" />
      </LogsFetchStub>
    </MockAdminSession>
  </Theme>`,...(L=(b=l.parameters)==null?void 0:b.docs)==null?void 0:L.source}}};var T,_,E;d.parameters={...d.parameters,docs:{...(T=d.parameters)==null?void 0:T.docs,source:{originalSource:`() => <Theme>
    <MockAdminSession>
      <LogsFetchStub>
        <LogsView endpoint="http://stubbed.local" initialSearch="add-domain" />
      </LogsFetchStub>
    </MockAdminSession>
  </Theme>`,...(E=(_=d.parameters)==null?void 0:_.docs)==null?void 0:E.source}}};var x,I,O;m.parameters={...m.parameters,docs:{...(x=m.parameters)==null?void 0:x.docs,source:{originalSource:`() => {
  // Cleared here, in the render body itself (not an unmount-cleanup
  // effect) so this runs every time THIS story is rendered, regardless of
  // whether Storybook's canvas fully unmounted whatever story was showing
  // before it.
  try {
    window.localStorage.removeItem(MOCK_SESSION_TOKEN_KEY);
  } catch {/* ignore */}
  return <Theme>
      <LogsFetchStub>
        <LogsView endpoint="http://stubbed.local" />
      </LogsFetchStub>
    </Theme>;
}`,...(O=(I=m.parameters)==null?void 0:I.docs)==null?void 0:O.source}}};var R,j,v;h.parameters={...h.parameters,docs:{...(R=h.parameters)==null?void 0:R.docs,source:{originalSource:`() => <Theme>
    <LogsView endpoint="http://local.netget" />
  </Theme>`,...(v=(j=h.parameters)==null?void 0:j.docs)==null?void 0:v.source}}};export{l as Default,d as FilteredByDomain,h as Live,m as SignInRequired,W as __namedExportsOrder,U as default};
