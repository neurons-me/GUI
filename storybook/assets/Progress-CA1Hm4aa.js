import{m as B,n as I,r as q,a9 as R,av as z,j as l,o as N,af as t,aa as O,ab as m,ad as b,ag as c,a5 as M,a6 as A,ai as h,aj as x}from"./iframe-q72FflWy.js";import{C as D}from"./CircularProgress-BunsQ8Ul.js";function S(e){return B("MuiLinearProgress",e)}I("MuiLinearProgress",["root","colorPrimary","colorSecondary","determinate","indeterminate","buffer","query","dashed","dashedColorPrimary","dashedColorSecondary","bar","bar1","bar2","barColorPrimary","barColorSecondary","bar1Indeterminate","bar1Determinate","bar1Buffer","bar2Indeterminate","bar2Buffer"]);const P=4,v=x`
  0% {
    left: -35%;
    right: 100%;
  }

  60% {
    left: 100%;
    right: -90%;
  }

  100% {
    left: 100%;
    right: -90%;
  }
`,U=typeof v!="string"?h`
        animation: ${v} 2.1s cubic-bezier(0.65, 0.815, 0.735, 0.395) infinite;
      `:null,y=x`
  0% {
    left: -200%;
    right: 100%;
  }

  60% {
    left: 107%;
    right: -8%;
  }

  100% {
    left: 107%;
    right: -8%;
  }
`,G=typeof y!="string"?h`
        animation: ${y} 2.1s cubic-bezier(0.165, 0.84, 0.44, 1) 1.15s infinite;
      `:null,C=x`
  0% {
    opacity: 1;
    background-position: 0 -23px;
  }

  60% {
    opacity: 0;
    background-position: 0 -23px;
  }

  100% {
    opacity: 1;
    background-position: -200px -23px;
  }
`,K=typeof C!="string"?h`
        animation: ${C} 3s infinite linear;
      `:null,_=e=>{const{classes:r,variant:a,color:s}=e,o={root:["root",`color${t(s)}`,a],dashed:["dashed",`dashedColor${t(s)}`],bar1:["bar","bar1",`barColor${t(s)}`,(a==="indeterminate"||a==="query")&&"bar1Indeterminate",a==="determinate"&&"bar1Determinate",a==="buffer"&&"bar1Buffer"],bar2:["bar","bar2",a!=="buffer"&&`barColor${t(s)}`,a==="buffer"&&`color${t(s)}`,(a==="indeterminate"||a==="query")&&"bar2Indeterminate",a==="buffer"&&"bar2Buffer"]};return O(o,S,r)},L=(e,r)=>e.vars?e.vars.palette.LinearProgress[`${r}Bg`]:e.palette.mode==="light"?M(e.palette[r].main,.62):A(e.palette[r].main,.5),E=m("span",{name:"MuiLinearProgress",slot:"Root",overridesResolver:(e,r)=>{const{ownerState:a}=e;return[r.root,r[`color${t(a.color)}`],r[a.variant]]}})(b(({theme:e})=>({position:"relative",overflow:"hidden",display:"block",height:4,zIndex:0,"@media print":{colorAdjust:"exact"},variants:[...Object.entries(e.palette).filter(c()).map(([r])=>({props:{color:r},style:{backgroundColor:L(e,r)}})),{props:({ownerState:r})=>r.color==="inherit"&&r.variant!=="buffer",style:{"&::before":{content:'""',position:"absolute",left:0,top:0,right:0,bottom:0,backgroundColor:"currentColor",opacity:.3}}},{props:{variant:"buffer"},style:{backgroundColor:"transparent"}},{props:{variant:"query"},style:{transform:"rotate(180deg)"}}]}))),X=m("span",{name:"MuiLinearProgress",slot:"Dashed",overridesResolver:(e,r)=>{const{ownerState:a}=e;return[r.dashed,r[`dashedColor${t(a.color)}`]]}})(b(({theme:e})=>({position:"absolute",marginTop:0,height:"100%",width:"100%",backgroundSize:"10px 10px",backgroundPosition:"0 -23px",variants:[{props:{color:"inherit"},style:{opacity:.3,backgroundImage:"radial-gradient(currentColor 0%, currentColor 16%, transparent 42%)"}},...Object.entries(e.palette).filter(c()).map(([r])=>{const a=L(e,r);return{props:{color:r},style:{backgroundImage:`radial-gradient(${a} 0%, ${a} 16%, transparent 42%)`}}})]})),K||{animation:`${C} 3s infinite linear`}),F=m("span",{name:"MuiLinearProgress",slot:"Bar1",overridesResolver:(e,r)=>{const{ownerState:a}=e;return[r.bar,r.bar1,r[`barColor${t(a.color)}`],(a.variant==="indeterminate"||a.variant==="query")&&r.bar1Indeterminate,a.variant==="determinate"&&r.bar1Determinate,a.variant==="buffer"&&r.bar1Buffer]}})(b(({theme:e})=>({width:"100%",position:"absolute",left:0,bottom:0,top:0,transition:"transform 0.2s linear",transformOrigin:"left",variants:[{props:{color:"inherit"},style:{backgroundColor:"currentColor"}},...Object.entries(e.palette).filter(c()).map(([r])=>({props:{color:r},style:{backgroundColor:(e.vars||e).palette[r].main}})),{props:{variant:"determinate"},style:{transition:`transform .${P}s linear`}},{props:{variant:"buffer"},style:{zIndex:1,transition:`transform .${P}s linear`}},{props:({ownerState:r})=>r.variant==="indeterminate"||r.variant==="query",style:{width:"auto"}},{props:({ownerState:r})=>r.variant==="indeterminate"||r.variant==="query",style:U||{animation:`${v} 2.1s cubic-bezier(0.65, 0.815, 0.735, 0.395) infinite`}}]}))),V=m("span",{name:"MuiLinearProgress",slot:"Bar2",overridesResolver:(e,r)=>{const{ownerState:a}=e;return[r.bar,r.bar2,r[`barColor${t(a.color)}`],(a.variant==="indeterminate"||a.variant==="query")&&r.bar2Indeterminate,a.variant==="buffer"&&r.bar2Buffer]}})(b(({theme:e})=>({width:"100%",position:"absolute",left:0,bottom:0,top:0,transition:"transform 0.2s linear",transformOrigin:"left",variants:[...Object.entries(e.palette).filter(c()).map(([r])=>({props:{color:r},style:{"--LinearProgressBar2-barColor":(e.vars||e).palette[r].main}})),{props:({ownerState:r})=>r.variant!=="buffer"&&r.color!=="inherit",style:{backgroundColor:"var(--LinearProgressBar2-barColor, currentColor)"}},{props:({ownerState:r})=>r.variant!=="buffer"&&r.color==="inherit",style:{backgroundColor:"currentColor"}},{props:{color:"inherit"},style:{opacity:.3}},...Object.entries(e.palette).filter(c()).map(([r])=>({props:{color:r,variant:"buffer"},style:{backgroundColor:L(e,r),transition:`transform .${P}s linear`}})),{props:({ownerState:r})=>r.variant==="indeterminate"||r.variant==="query",style:{width:"auto"}},{props:({ownerState:r})=>r.variant==="indeterminate"||r.variant==="query",style:G||{animation:`${y} 2.1s cubic-bezier(0.165, 0.84, 0.44, 1) 1.15s infinite`}}]}))),H=q.forwardRef(function(r,a){const s=R({props:r,name:"MuiLinearProgress"}),{className:o,color:T="primary",value:g,valueBuffer:k,variant:n="indeterminate",...j}=s,p={...s,color:T,variant:n},u=_(p),$=z(),d={},f={bar1:{},bar2:{}};if((n==="determinate"||n==="buffer")&&g!==void 0){d["aria-valuenow"]=Math.round(g),d["aria-valuemin"]=0,d["aria-valuemax"]=100;let i=g-100;$&&(i=-i),f.bar1.transform=`translateX(${i}%)`}if(n==="buffer"&&k!==void 0){let i=(k||0)-100;$&&(i=-i),f.bar2.transform=`translateX(${i}%)`}return l.jsxs(E,{className:N(u.root,o),ownerState:p,role:"progressbar",...d,ref:a,...j,children:[n==="buffer"?l.jsx(X,{className:u.dashed,ownerState:p}):null,l.jsx(F,{className:u.bar1,ownerState:p,style:f.bar1}),n==="determinate"?null:l.jsx(V,{className:u.bar2,ownerState:p,style:f.bar2})]})}),w=q.forwardRef(function(r,a){const{kind:s="linear",...o}=r;return s==="circular"?l.jsx(D,{ref:a,...o}):l.jsx(H,{ref:a,...o})});w.displayName="Gui.Progress";w.__docgenInfo={description:`This.GUI — Progress (atom)
Abstracts a linear or circular progress indicator behind one component.`,methods:[],displayName:"Gui.Progress",props:{kind:{required:!1,tsType:{name:"union",raw:"'linear' | 'circular'",elements:[{name:"literal",value:"'linear'"},{name:"literal",value:"'circular'"}]},description:""},id:{required:!1,tsType:{name:"string"},description:""},className:{required:!1,tsType:{name:"string"},description:""},"data-testid":{required:!1,tsType:{name:"string"},description:""},color:{required:!1,tsType:{name:"union",raw:"CircularProgressProps['color'] | LinearProgressProps['color']",elements:[{name:"CircularProgressProps['color']",raw:"CircularProgressProps['color']"},{name:"LinearProgressProps['color']",raw:"LinearProgressProps['color']"}]},description:""},value:{required:!1,tsType:{name:"number"},description:""},valueBuffer:{required:!1,tsType:{name:"number"},description:""},variant:{required:!1,tsType:{name:"union",raw:"CircularProgressProps['variant'] | LinearProgressProps['variant']",elements:[{name:"CircularProgressProps['variant']",raw:"CircularProgressProps['variant']"},{name:"LinearProgressProps['variant']",raw:"LinearProgressProps['variant']"}]},description:""},size:{required:!1,tsType:{name:"CircularProgressProps['size']",raw:"CircularProgressProps['size']"},description:""},thickness:{required:!1,tsType:{name:"CircularProgressProps['thickness']",raw:"CircularProgressProps['thickness']"},description:""},sx:{required:!1,tsType:{name:"union",raw:"CircularProgressProps['sx'] | LinearProgressProps['sx']",elements:[{name:"CircularProgressProps['sx']",raw:"CircularProgressProps['sx']"},{name:"LinearProgressProps['sx']",raw:"LinearProgressProps['sx']"}]},description:""}}};export{w as P};
