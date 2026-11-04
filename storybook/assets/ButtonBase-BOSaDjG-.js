var Pe=Object.defineProperty;var Ve=(n,e,t)=>e in n?Pe(n,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):n[e]=t;var oe=(n,e,t)=>Ve(n,typeof e!="symbol"?e+"":e,t);import{r as l,cX as Be,aR as Se,R as H,o as y,j as N,k as ae,ac as le,ae as Q,ak as Z,n as we,cY as ie,ad as De}from"./iframe-jME6TRyu.js";import{_ as Le,T as se,b as ke,a as je,u as _}from"./TransitionGroupContext-BRZCH32N.js";import{u as re}from"./useForkRef-z1e785Ns.js";function ve(n){if(n===void 0)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return n}function ee(n,e){var t=function(i){return e&&l.isValidElement(i)?e(i):i},a=Object.create(null);return n&&l.Children.map(n,function(o){return o}).forEach(function(o){a[o.key]=t(o)}),a}function Ne(n,e){n=n||{},e=e||{};function t(f){return f in e?e[f]:n[f]}var a=Object.create(null),o=[];for(var i in n)i in e?o.length&&(a[i]=o,o=[]):o.push(i);var s,p={};for(var u in e){if(a[u])for(s=0;s<a[u].length;s++){var d=a[u][s];p[a[u][s]]=t(d)}p[u]=t(u)}for(s=0;s<o.length;s++)p[o[s]]=t(o[s]);return p}function v(n,e,t){return t[e]!=null?t[e]:n.props[e]}function $e(n,e){return ee(n.children,function(t){return l.cloneElement(t,{onExited:e.bind(null,t),in:!0,appear:v(t,"appear",n),enter:v(t,"enter",n),exit:v(t,"exit",n)})})}function Fe(n,e,t){var a=ee(n.children),o=Ne(e,a);return Object.keys(o).forEach(function(i){var s=o[i];if(l.isValidElement(s)){var p=i in e,u=i in a,d=e[i],f=l.isValidElement(d)&&!d.props.in;u&&(!p||f)?o[i]=l.cloneElement(s,{onExited:t.bind(null,s),in:!0,exit:v(s,"exit",n),enter:v(s,"enter",n)}):!u&&p&&!f?o[i]=l.cloneElement(s,{in:!1}):u&&p&&l.isValidElement(d)&&(o[i]=l.cloneElement(s,{onExited:t.bind(null,s),in:d.props.in,exit:v(s,"exit",n),enter:v(s,"enter",n)}))}}),o}var Ie=Object.values||function(n){return Object.keys(n).map(function(e){return n[e]})},Ue={component:"div",childFactory:function(e){return e}},te=(function(n){Le(e,n);function e(a,o){var i;i=n.call(this,a,o)||this;var s=i.handleExited.bind(ve(i));return i.state={contextValue:{isMounting:!0},handleExited:s,firstRender:!0},i}var t=e.prototype;return t.componentDidMount=function(){this.mounted=!0,this.setState({contextValue:{isMounting:!1}})},t.componentWillUnmount=function(){this.mounted=!1},e.getDerivedStateFromProps=function(o,i){var s=i.children,p=i.handleExited,u=i.firstRender;return{children:u?$e(o,p):Fe(o,s,p),firstRender:!1}},t.handleExited=function(o,i){var s=ee(this.props.children);o.key in s||(o.props.onExited&&o.props.onExited(i),this.mounted&&this.setState(function(p){var u=Be({},p.children);return delete u[o.key],{children:u}}))},t.render=function(){var o=this.props,i=o.component,s=o.childFactory,p=Se(o,["component","childFactory"]),u=this.state.contextValue,d=Ie(this.state.children).map(s);return delete p.appear,delete p.enter,delete p.exit,i===null?H.createElement(se.Provider,{value:u},d):H.createElement(se.Provider,{value:u},H.createElement(i,p,d))},e})(H.Component);te.propTypes={};te.defaultProps=Ue;class G{constructor(){oe(this,"mountEffect",()=>{this.shouldMount&&!this.didMount&&this.ref.current!==null&&(this.didMount=!0,this.mounted.resolve())});this.ref={current:null},this.mounted=null,this.didMount=!1,this.shouldMount=!1,this.setShouldMount=null}static create(){return new G}static use(){const e=ke(G.create).current,[t,a]=l.useState(!1);return e.shouldMount=t,e.setShouldMount=a,l.useEffect(e.mountEffect,[t]),e}mount(){return this.mounted||(this.mounted=Oe(),this.shouldMount=!0,this.setShouldMount(this.shouldMount)),this.mounted}start(...e){this.mount().then(()=>{var t;return(t=this.ref.current)==null?void 0:t.start(...e)})}stop(...e){this.mount().then(()=>{var t;return(t=this.ref.current)==null?void 0:t.stop(...e)})}pulsate(...e){this.mount().then(()=>{var t;return(t=this.ref.current)==null?void 0:t.pulsate(...e)})}}function ze(){return G.use()}function Oe(){let n,e;const t=new Promise((a,o)=>{n=a,e=o});return t.resolve=n,t.reject=e,t}function Xe(n){const{className:e,classes:t,pulsate:a=!1,rippleX:o,rippleY:i,rippleSize:s,in:p,onExited:u,timeout:d}=n,[f,h]=l.useState(!1),M=y(e,t.ripple,t.rippleVisible,a&&t.ripplePulsate),V={width:s,height:s,top:-(s/2)+i,left:-(s/2)+o},b=y(t.child,f&&t.childLeaving,a&&t.childPulsate);return!p&&!f&&h(!0),l.useEffect(()=>{if(!p&&u!=null){const D=setTimeout(u,d);return()=>{clearTimeout(D)}}},[u,p,d]),N.jsx("span",{className:M,style:V,children:N.jsx("span",{className:b})})}const g=ae("MuiTouchRipple",["root","ripple","rippleVisible","ripplePulsate","child","childLeaving","childPulsate"]),J=550,Ye=80,Ae=Z`
  0% {
    transform: scale(0);
    opacity: 0.1;
  }

  100% {
    transform: scale(1);
    opacity: 0.3;
  }
`,Ke=Z`
  0% {
    opacity: 1;
  }

  100% {
    opacity: 0;
  }
`,We=Z`
  0% {
    transform: scale(1);
  }

  50% {
    transform: scale(0.92);
  }

  100% {
    transform: scale(1);
  }
`,He=Q("span",{name:"MuiTouchRipple",slot:"Root"})({overflow:"hidden",pointerEvents:"none",position:"absolute",zIndex:0,top:0,right:0,bottom:0,left:0,borderRadius:"inherit"}),_e=Q(Xe,{name:"MuiTouchRipple",slot:"Ripple"})`
  opacity: 0;
  position: absolute;

  &.${g.rippleVisible} {
    opacity: 0.3;
    transform: scale(1);
    animation-name: ${Ae};
    animation-duration: ${J}ms;
    animation-timing-function: ${({theme:n})=>n.transitions.easing.easeInOut};
  }

  &.${g.ripplePulsate} {
    animation-duration: ${({theme:n})=>n.transitions.duration.shorter}ms;
  }

  & .${g.child} {
    opacity: 1;
    display: block;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background-color: currentColor;
  }

  & .${g.childLeaving} {
    opacity: 0;
    animation-name: ${Ke};
    animation-duration: ${J}ms;
    animation-timing-function: ${({theme:n})=>n.transitions.easing.easeInOut};
  }

  & .${g.childPulsate} {
    position: absolute;
    /* @noflip */
    left: 0px;
    top: 0;
    animation-name: ${We};
    animation-duration: 2500ms;
    animation-timing-function: ${({theme:n})=>n.transitions.easing.easeInOut};
    animation-iteration-count: infinite;
    animation-delay: 200ms;
  }
`,Ge=l.forwardRef(function(e,t){const a=le({props:e,name:"MuiTouchRipple"}),{center:o=!1,classes:i={},className:s,...p}=a,[u,d]=l.useState([]),f=l.useRef(0),h=l.useRef(null);l.useEffect(()=>{h.current&&(h.current(),h.current=null)},[u]);const M=l.useRef(!1),V=je(),b=l.useRef(null),D=l.useRef(null),C=l.useCallback(c=>{const{pulsate:E,rippleX:R,rippleY:I,rippleSize:L,cb:U}=c;d(x=>[...x,N.jsx(_e,{classes:{ripple:y(i.ripple,g.ripple),rippleVisible:y(i.rippleVisible,g.rippleVisible),ripplePulsate:y(i.ripplePulsate,g.ripplePulsate),child:y(i.child,g.child),childLeaving:y(i.childLeaving,g.childLeaving),childPulsate:y(i.childPulsate,g.childPulsate)},timeout:J,pulsate:E,rippleX:R,rippleY:I,rippleSize:L},f.current)]),f.current+=1,h.current=U},[i]),$=l.useCallback((c={},E={},R=()=>{})=>{const{pulsate:I=!1,center:L=o||E.pulsate,fakeElement:U=!1}=E;if((c==null?void 0:c.type)==="mousedown"&&M.current){M.current=!1;return}(c==null?void 0:c.type)==="touchstart"&&(M.current=!0);const x=U?null:D.current,B=x?x.getBoundingClientRect():{width:0,height:0,left:0,top:0};let S,T,w;if(L||c===void 0||c.clientX===0&&c.clientY===0||!c.clientX&&!c.touches)S=Math.round(B.width/2),T=Math.round(B.height/2);else{const{clientX:z,clientY:k}=c.touches&&c.touches.length>0?c.touches[0]:c;S=Math.round(z-B.left),T=Math.round(k-B.top)}if(L)w=Math.sqrt((2*B.width**2+B.height**2)/3),w%2===0&&(w+=1);else{const z=Math.max(Math.abs((x?x.clientWidth:0)-S),S)*2+2,k=Math.max(Math.abs((x?x.clientHeight:0)-T),T)*2+2;w=Math.sqrt(z**2+k**2)}c!=null&&c.touches?b.current===null&&(b.current=()=>{C({pulsate:I,rippleX:S,rippleY:T,rippleSize:w,cb:R})},V.start(Ye,()=>{b.current&&(b.current(),b.current=null)})):C({pulsate:I,rippleX:S,rippleY:T,rippleSize:w,cb:R})},[o,C,V]),A=l.useCallback(()=>{$({},{pulsate:!0})},[$]),F=l.useCallback((c,E)=>{if(V.clear(),(c==null?void 0:c.type)==="touchend"&&b.current){b.current(),b.current=null,V.start(0,()=>{F(c,E)});return}b.current=null,d(R=>R.length>0?R.slice(1):R),h.current=E},[V]);return l.useImperativeHandle(t,()=>({pulsate:A,start:$,stop:F}),[A,$,F]),N.jsx(He,{className:y(g.root,i.root,s),ref:D,...p,children:N.jsx(te,{component:null,exit:!0,children:u})})});function qe(n){return we("MuiButtonBase",n)}const Je=ae("MuiButtonBase",["root","disabled","focusVisible"]),Qe=n=>{const{disabled:e,focusVisible:t,focusVisibleClassName:a,classes:o}=n,s=De({root:["root",e&&"disabled",t&&"focusVisible"]},qe,o);return t&&a&&(s.root+=` ${a}`),s},Ze=Q("button",{name:"MuiButtonBase",slot:"Root",overridesResolver:(n,e)=>e.root})({display:"inline-flex",alignItems:"center",justifyContent:"center",position:"relative",boxSizing:"border-box",WebkitTapHighlightColor:"transparent",backgroundColor:"transparent",outline:0,border:0,margin:0,borderRadius:0,padding:0,cursor:"pointer",userSelect:"none",verticalAlign:"middle",MozAppearance:"none",WebkitAppearance:"none",textDecoration:"none",color:"inherit","&::-moz-focus-inner":{borderStyle:"none"},[`&.${Je.disabled}`]:{pointerEvents:"none",cursor:"default"},"@media print":{colorAdjust:"exact"}}),it=l.forwardRef(function(e,t){const a=le({props:e,name:"MuiButtonBase"}),{action:o,centerRipple:i=!1,children:s,className:p,component:u="button",disabled:d=!1,disableRipple:f=!1,disableTouchRipple:h=!1,focusRipple:M=!1,focusVisibleClassName:V,LinkComponent:b="a",onBlur:D,onClick:C,onContextMenu:$,onDragLeave:A,onFocus:F,onFocusVisible:c,onKeyDown:E,onKeyUp:R,onMouseDown:I,onMouseLeave:L,onMouseUp:U,onTouchEnd:x,onTouchMove:B,onTouchStart:S,tabIndex:T=0,TouchRippleProps:w,touchRippleRef:z,type:k,...O}=a,X=l.useRef(null),m=ze(),ue=re(m.ref,z),[j,K]=l.useState(!1);d&&j&&K(!1),l.useImperativeHandle(o,()=>({focusVisible:()=>{K(!0),X.current.focus()}}),[]);const ce=m.shouldMount&&!f&&!d;l.useEffect(()=>{j&&M&&!f&&m.pulsate()},[f,M,j,m]);const pe=P(m,"start",I,h),de=P(m,"stop",$,h),fe=P(m,"stop",A,h),he=P(m,"stop",U,h),me=P(m,"stop",r=>{j&&r.preventDefault(),L&&L(r)},h),be=P(m,"start",S,h),ge=P(m,"stop",x,h),Me=P(m,"stop",B,h),Re=P(m,"stop",r=>{ie(r.target)||K(!1),D&&D(r)},!1),Ee=_(r=>{X.current||(X.current=r.currentTarget),ie(r.target)&&(K(!0),c&&c(r)),F&&F(r)}),q=()=>{const r=X.current;return u&&u!=="button"&&!(r.tagName==="A"&&r.href)},xe=_(r=>{M&&!r.repeat&&j&&r.key===" "&&m.stop(r,()=>{m.start(r)}),r.target===r.currentTarget&&q()&&r.key===" "&&r.preventDefault(),E&&E(r),r.target===r.currentTarget&&q()&&r.key==="Enter"&&!d&&(r.preventDefault(),C&&C(r))}),ye=_(r=>{M&&r.key===" "&&j&&!r.defaultPrevented&&m.stop(r,()=>{m.pulsate(r)}),R&&R(r),C&&r.target===r.currentTarget&&q()&&r.key===" "&&!r.defaultPrevented&&C(r)});let W=u;W==="button"&&(O.href||O.to)&&(W=b);const Y={};W==="button"?(Y.type=k===void 0?"button":k,Y.disabled=d):(!O.href&&!O.to&&(Y.role="button"),d&&(Y["aria-disabled"]=d));const Ce=re(t,X),ne={...a,centerRipple:i,component:u,disabled:d,disableRipple:f,disableTouchRipple:h,focusRipple:M,tabIndex:T,focusVisible:j},Te=Qe(ne);return N.jsxs(Ze,{as:W,className:y(Te.root,p),ownerState:ne,onBlur:Re,onClick:C,onContextMenu:de,onFocus:Ee,onKeyDown:xe,onKeyUp:ye,onMouseDown:pe,onMouseLeave:me,onMouseUp:he,onDragLeave:fe,onTouchEnd:ge,onTouchMove:Me,onTouchStart:be,ref:Ce,tabIndex:d?-1:T,type:k,...Y,...O,children:[s,ce?N.jsx(Ge,{ref:ue,center:i,...w}):null]})});function P(n,e,t,a=!1){return _(o=>(t&&t(o),a||n[e](o),!0))}export{it as B};
