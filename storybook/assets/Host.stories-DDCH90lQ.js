import{c as R,j as e,B as t,r as h}from"./iframe-q72FflWy.js";import{B as O}from"./Button-DuvGvkXy.js";import{M as N}from"./Modal-XMQC5YcF.js";import"./preload-helper-Dp1pzeXC.js";import"./Icon-Doq3uhPc.js";import"./Button-BpF6GA05.js";import"./ButtonBase-D2HnvhjV.js";import"./TransitionGroupContext-4zVEsxkP.js";import"./useForkRef-BR9zNRBO.js";import"./useEventCallback-BVb6jHPB.js";import"./CircularProgress-BunsQ8Ul.js";import"./IconButton-D9uKbFdE.js";import"./IconButton-0qTeMK6V.js";import"./Paper-9gdP3SeZ.js";import"./Paper-C4cHEfmg.js";function m({open:a,onClose:r,label:u="localhost:8161",description:o}){const n=R();return e.jsx(N,{open:a,onClose:r,children:e.jsxs(t,{sx:{display:"flex",flexDirection:"column",gap:2,minWidth:320,maxWidth:420},children:[e.jsxs(t,{sx:{borderRadius:"14px",border:`1px solid ${n.palette.divider}`,background:n.palette.mode==="dark"?n.palette.section.default:n.palette.section.subtle,p:1.5,display:"flex",flexDirection:"column",gap:1.25,position:"relative"},children:[e.jsx(t,{sx:{fontSize:"11px",textTransform:"uppercase",letterSpacing:1.2,color:n.palette.text.secondary},children:"Cleaker"}),e.jsx(t,{sx:{alignSelf:"flex-end",borderRadius:"999px",border:`1px solid ${n.palette.divider}`,px:1.1,py:.55,fontSize:"10px",fontFamily:'"IBM Plex Mono", "SFMono-Regular", Consolas, monospace',color:n.palette.text.secondary,background:n.palette.mode==="dark"?`linear-gradient(180deg, ${n.palette.common.black}66 0%, ${n.palette.section.default}cc 100%)`:`linear-gradient(180deg, ${n.palette.background.paper}cc 0%, ${n.palette.section.subtle}e6 100%)`,backdropFilter:"blur(8px)"},children:u})]}),e.jsx(t,{sx:{color:n.palette.text.secondary,fontSize:"12px",lineHeight:1.5},children:o})]})})}m.__docgenInfo={description:"",methods:[],displayName:"HostModal",props:{open:{required:!0,tsType:{name:"boolean"},description:""},onClose:{required:!0,tsType:{name:"signature",type:"function",raw:"() => void",signature:{arguments:[],return:{name:"void"}}},description:""},label:{required:!1,tsType:{name:"string"},description:"",defaultValue:{value:"'localhost:8161'",computed:!1}},description:{required:!1,tsType:{name:"ReactReactNode",raw:"React.ReactNode"},description:""}}};const A=a=>{switch(a){case"online":return"Local daemon reachable";case"offline":return"No local daemon detected";case"checking":return"Checking local host";default:return"Local host state unknown"}};function z({label:a="localhost:8161",status:r="unknown",title:u}){const o=R(),[n,f]=h.useState(!1),D=u||a,_=h.useMemo(()=>A(r),[r]);return e.jsxs(e.Fragment,{children:[e.jsx(O,{variant:"text",onClick:()=>f(!0),title:D,sx:{display:"inline-flex",alignItems:"center",justifyContent:"flex-end",maxWidth:"100%",minWidth:0,width:"fit-content",borderRadius:"999px",border:`1px solid ${o.palette.divider}`,background:o.palette.mode==="dark"?`linear-gradient(180deg, ${o.palette.common.black}66 0%, ${o.palette.section.default}cc 100%)`:`linear-gradient(180deg, ${o.palette.background.paper}cc 0%, ${o.palette.section.subtle}e6 100%)`,boxShadow:`inset 0 1px 0 ${o.palette.common.white}08`,overflow:"hidden",backdropFilter:"blur(10px) saturate(110%)",opacity:.82,px:.7,py:.42,textAlign:"right",textTransform:"none"},children:e.jsx(t,{sx:{minWidth:0,fontSize:"8px",fontWeight:500,color:o.palette.text.secondary,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",lineHeight:1,letterSpacing:.18,textTransform:"lowercase",fontFamily:'"IBM Plex Mono", "SFMono-Regular", Consolas, monospace',opacity:.82},children:a})}),e.jsx(m,{open:n,onClose:()=>f(!1),label:a,description:_})]})}z.__docgenInfo={description:"",methods:[],displayName:"HostCompact",props:{label:{required:!1,tsType:{name:"string"},description:"",defaultValue:{value:"'localhost:8161'",computed:!1}},status:{required:!1,tsType:{name:"union",raw:"'online' | 'offline' | 'checking' | 'unknown'",elements:[{name:"literal",value:"'online'"},{name:"literal",value:"'offline'"},{name:"literal",value:"'checking'"},{name:"literal",value:"'unknown'"}]},description:"",defaultValue:{value:"'unknown'",computed:!1}},title:{required:!1,tsType:{name:"string"},description:""},variant:{required:!1,tsType:{name:"union",raw:"'compact' | 'modal'",elements:[{name:"literal",value:"'compact'"},{name:"literal",value:"'modal'"}]},description:""}}};function x({variant:a="compact",...r}){return a==="modal"?e.jsx(m,{open:!1,onClose:function(){throw new Error("Function not implemented.")},...r}):e.jsx(z,{...r})}x.__docgenInfo={description:"",methods:[],displayName:"Host",props:{label:{required:!1,tsType:{name:"string"},description:""},status:{required:!1,tsType:{name:"union",raw:"'online' | 'offline' | 'checking' | 'unknown'",elements:[{name:"literal",value:"'online'"},{name:"literal",value:"'offline'"},{name:"literal",value:"'checking'"},{name:"literal",value:"'unknown'"}]},description:""},title:{required:!1,tsType:{name:"string"},description:""},variant:{required:!1,tsType:{name:"union",raw:"'compact' | 'modal'",elements:[{name:"literal",value:"'compact'"},{name:"literal",value:"'modal'"}]},description:"",defaultValue:{value:"'compact'",computed:!1}}}};const ae={title:"All.This/monad.ai/Host/Status",component:x,parameters:{layout:"centered"},args:{label:"Suis-MacBook-Air.local:8161",status:"online",variant:"compact"}},i={args:{variant:"compact"}},l={args:{variant:"modal"}},s={args:{label:"localhost:8161",status:"offline",variant:"compact"}},c={args:{label:"localhost:8161",status:"checking",variant:"compact"}},p={args:{label:"resolver.local",status:"unknown",variant:"compact"}},d={render:a=>e.jsx(t,{sx:{width:"300px",borderRadius:"12px",p:1.5},children:e.jsxs(t,{sx:{display:"flex",flexDirection:"column",gap:.35,minWidth:0},children:[e.jsx("pre",{style:{margin:0,padding:0,lineHeight:"12px",fontSize:"12px"},children:`
   ┓   ┏┓
┓┏┏┣┓┏┓┏┛
•┗┻┛┛┗┗┛•
          `}),e.jsxs(t,{sx:{display:"flex",flexDirection:"column",alignItems:"stretch",gap:.45,minWidth:0},children:[e.jsxs(t,{sx:{display:"flex",alignItems:"baseline",gap:0,minWidth:0,fontSize:"11px",fontWeight:700,lineHeight:1.2},children:[e.jsx(t,{sx:{minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"},children:"sui"}),e.jsx(t,{sx:{pl:.55,whiteSpace:"nowrap",opacity:.9},children:".cleaker.me"})]}),e.jsx(t,{sx:{display:"flex",justifyContent:"flex-end",width:"100%"},children:e.jsx(x,{...a,variant:"compact"})})]})]})}),args:{label:"Suis-MacBook-Air.local:8161",status:"online",variant:"compact"}},oe=["Default","Modal","Offline","Checking","Unknown","InCleakerShell"];var g,v,w;i.parameters={...i.parameters,docs:{...(g=i.parameters)==null?void 0:g.docs,source:{originalSource:`{
  args: {
    variant: 'compact'
  }
}`,...(w=(v=i.parameters)==null?void 0:v.docs)==null?void 0:w.source}}};var y,k,b;l.parameters={...l.parameters,docs:{...(y=l.parameters)==null?void 0:y.docs,source:{originalSource:`{
  args: {
    variant: 'modal'
  }
}`,...(b=(k=l.parameters)==null?void 0:k.docs)==null?void 0:b.source}}};var S,B,j;s.parameters={...s.parameters,docs:{...(S=s.parameters)==null?void 0:S.docs,source:{originalSource:`{
  args: {
    label: 'localhost:8161',
    status: 'offline',
    variant: 'compact'
  }
}`,...(j=(B=s.parameters)==null?void 0:B.docs)==null?void 0:j.source}}};var T,C,M;c.parameters={...c.parameters,docs:{...(T=c.parameters)==null?void 0:T.docs,source:{originalSource:`{
  args: {
    label: 'localhost:8161',
    status: 'checking',
    variant: 'compact'
  }
}`,...(M=(C=c.parameters)==null?void 0:C.docs)==null?void 0:M.source}}};var W,H,F;p.parameters={...p.parameters,docs:{...(W=p.parameters)==null?void 0:W.docs,source:{originalSource:`{
  args: {
    label: 'resolver.local',
    status: 'unknown',
    variant: 'compact'
  }
}`,...(F=(H=p.parameters)==null?void 0:H.docs)==null?void 0:F.source}}};var I,$,q;d.parameters={...d.parameters,docs:{...(I=d.parameters)==null?void 0:I.docs,source:{originalSource:`{
  render: args => <Box sx={{
    width: '300px',
    borderRadius: '12px',
    p: 1.5
  }}>
      <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      gap: 0.35,
      minWidth: 0
    }}>
        <pre style={{
        margin: 0,
        padding: 0,
        lineHeight: '12px',
        fontSize: '12px'
      }}>
          {\`
   ┓   ┏┓
┓┏┏┣┓┏┓┏┛
•┗┻┛┛┗┗┛•
          \`}
        </pre>

        <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        gap: 0.45,
        minWidth: 0
      }}>
          <Box sx={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 0,
          minWidth: 0,
          fontSize: '11px',
          fontWeight: 700,
          lineHeight: 1.2
        }}>
            <Box sx={{
            minWidth: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
              sui
            </Box>
            <Box sx={{
            pl: 0.55,
            whiteSpace: 'nowrap',
            opacity: 0.9
          }}>
              .cleaker.me
            </Box>
          </Box>

          <Box sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          width: '100%'
        }}>
            <Host {...args} variant="compact" />
          </Box>
        </Box>
      </Box>
    </Box>,
  args: {
    label: 'Suis-MacBook-Air.local:8161',
    status: 'online',
    variant: 'compact'
  }
}`,...(q=($=d.parameters)==null?void 0:$.docs)==null?void 0:q.source}}};export{c as Checking,i as Default,d as InCleakerShell,l as Modal,s as Offline,p as Unknown,oe as __namedExportsOrder,ae as default};
