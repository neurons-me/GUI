var Pe=Object.defineProperty;var Ve=(n,e,t)=>e in n?Pe(n,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):n[e]=t;var oe=(n,e,t)=>Ve(n,typeof e!="symbol"?e+"":e,t);import{r as l,aY as Be,aX as Se,R as H,x as y,j as N,w as ae,a7 as le,a9 as J,am as Q,v as we,aZ as ie,a8 as De}from"./iframe-Dgz0DvjP.js";import{_ as Le,T as se,a as je,u as ve}from"./TransitionGroupContext-Bovk2g5c.js";import{u as re}from"./useForkRef-DhiyL1xF.js";import{u as _}from"./useEventCallback-CW9ai8zV.js";function ke(n){if(n===void 0)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return n}function ee(n,e){var t=function(i){return e&&l.isValidElement(i)?e(i):i},a=Object.create(null);return n&&l.Children.map(n,function(o){return o}).forEach(function(o){a[o.key]=t(o)}),a}function Ne(n,e){n=n||{},e=e||{};function t(f){return f in e?e[f]:n[f]}var a=Object.create(null),o=[];for(var i in n)i in e?o.length&&(a[i]=o,o=[]):o.push(i);var s,p={};for(var u in e){if(a[u])for(s=0;s<a[u].length;s++){var d=a[u][s];p[a[u][s]]=t(d)}p[u]=t(u)}for(s=0;s<o.length;s++)p[o[s]]=t(o[s]);return p}function k(n,e,t){return t[e]!=null?t[e]:n.props[e]}function $e(n,e){return ee(n.children,function(t){return l.cloneElement(t,{onExited:e.bind(null,t),in:!0,appear:k(t,"appear",n),enter:k(t,"enter",n),exit:k(t,"exit",n)})})}function Fe(n,e,t){var a=ee(n.children),o=Ne(e,a);return Object.keys(o).forEach(function(i){var s=o[i];if(l.isValidElement(s)){var p=i in e,u=i in a,d=e[i],f=l.isValidElement(d)&&!d.props.in;u&&(!p||f)?o[i]=l.cloneElement(s,{onExited:t.bind(null,s),in:!0,exit:k(s,"exit",n),enter:k(s,"enter",n)}):!u&&p&&!f?o[i]=l.cloneElement(s,{in:!1}):u&&p&&l.isValidElement(d)&&(o[i]=l.cloneElement(s,{onExited:t.bind(null,s),in:d.props.in,exit:k(s,"exit",n),enter:k(s,"enter",n)}))}}),o}var Ie=Object.values||function(n){return Object.keys(n).map(function(e){return n[e]})},Ue={component:"div",childFactory:function(e){return e}},te=(function(n){Le(e,n);function e(a,o){var i;i=n.call(this,a,o)||this;var s=i.handleExited.bind(ke(i));return i.state={contextValue:{isMounting:!0},handleExited:s,firstRender:!0},i}var t=e.prototype;return t.componentDidMount=function(){this.mounted=!0,this.setState({contextValue:{isMounting:!1}})},t.componentWillUnmount=function(){this.mounted=!1},e.getDerivedStateFromProps=function(o,i){var s=i.children,p=i.handleExited,u=i.firstRender;return{children:u?$e(o,p):Fe(o,s,p),firstRender:!1}},t.handleExited=function(o,i){var s=ee(this.props.children);o.key in s||(o.props.onExited&&o.props.onExited(i),this.mounted&&this.setState(function(p){var u=Be({},p.children);return delete u[o.key],{children:u}}))},t.render=function(){var o=this.props,i=o.component,s=o.childFactory,p=Se(o,["component","childFactory"]),u=this.state.contextValue,d=Ie(this.state.children).map(s);return delete p.appear,delete p.enter,delete p.exit,i===null?H.createElement(se.Provider,{value:u},d):H.createElement(se.Provider,{value:u},H.createElement(i,p,d))},e})(H.Component);te.propTypes={};te.defaultProps=Ue;class G{constructor(){oe(this,"mountEffect",()=>{this.shouldMount&&!this.didMount&&this.ref.current!==null&&(this.didMount=!0,this.mounted.resolve())});this.ref={current:null},this.mounted=null,this.didMount=!1,this.shouldMount=!1,this.setShouldMount=null}static create(){return new G}static use(){const e=je(G.create).current,[t,a]=l.useState(!1);return e.shouldMount=t,e.setShouldMount=a,l.useEffect(e.mountEffect,[t]),e}mount(){return this.mounted||(this.mounted=Oe(),this.shouldMount=!0,this.setShouldMount(this.shouldMount)),this.mounted}start(...e){this.mount().then(()=>{var t;return(t=this.ref.current)==null?void 0:t.start(...e)})}stop(...e){this.mount().then(()=>{var t;return(t=this.ref.current)==null?void 0:t.stop(...e)})}pulsate(...e){this.mount().then(()=>{var t;return(t=this.ref.current)==null?void 0:t.pulsate(...e)})}}function ze(){return G.use()}function Oe(){let n,e;const t=new Promise((a,o)=>{n=a,e=o});return t.resolve=n,t.reject=e,t}function Xe(n){const{className:e,classes:t,pulsate:a=!1,rippleX:o,rippleY:i,rippleSize:s,in:p,onExited:u,timeout:d}=n,[f,h]=l.useState(!1),M=y(e,t.ripple,t.rippleVisible,a&&t.ripplePulsate),V={width:s,height:s,top:-(s/2)+i,left:-(s/2)+o},g=y(t.child,f&&t.childLeaving,a&&t.childPulsate);return!p&&!f&&h(!0),l.useEffect(()=>{if(!p&&u!=null){const D=setTimeout(u,d);return()=>{clearTimeout(D)}}},[u,p,d]),N.jsx("span",{className:M,style:V,children:N.jsx("span",{className:g})})}const b=ae("MuiTouchRipple",["root","ripple","rippleVisible","ripplePulsate","child","childLeaving","childPulsate"]),Z=550,Ye=80,Ae=Q`
  0% {
    transform: scale(0);
    opacity: 0.1;
  }

  100% {
    transform: scale(1);
    opacity: 0.3;
  }
`,Ke=Q`
  0% {
    opacity: 1;
  }

  100% {
    opacity: 0;
  }
`,We=Q`
  0% {
    transform: scale(1);
  }

  50% {
    transform: scale(0.92);
  }

  100% {
    transform: scale(1);
  }
`,He=J("span",{name:"MuiTouchRipple",slot:"Root"})({overflow:"hidden",pointerEvents:"none",position:"absolute",zIndex:0,top:0,right:0,bottom:0,left:0,borderRadius:"inherit"}),_e=J(Xe,{name:"MuiTouchRipple",slot:"Ripple"})`
  opacity: 0;
  position: absolute;

  &.${b.rippleVisible} {
    opacity: 0.3;
    transform: scale(1);
    animation-name: ${Ae};
    animation-duration: ${Z}ms;
    animation-timing-function: ${({theme:n})=>n.transitions.easing.easeInOut};
  }

  &.${b.ripplePulsate} {
    animation-duration: ${({theme:n})=>n.transitions.duration.shorter}ms;
  }

  & .${b.child} {
    opacity: 1;
    display: block;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background-color: currentColor;
  }

  & .${b.childLeaving} {
    opacity: 0;
    animation-name: ${Ke};
    animation-duration: ${Z}ms;
    animation-timing-function: ${({theme:n})=>n.transitions.easing.easeInOut};
  }

  & .${b.childPulsate} {
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
`,Ge=l.forwardRef(function(e,t){const a=le({props:e,name:"MuiTouchRipple"}),{center:o=!1,classes:i={},className:s,...p}=a,[u,d]=l.useState([]),f=l.useRef(0),h=l.useRef(null);l.useEffect(()=>{h.current&&(h.current(),h.current=null)},[u]);const M=l.useRef(!1),V=ve(),g=l.useRef(null),D=l.useRef(null),C=l.useCallback(c=>{const{pulsate:x,rippleX:R,rippleY:I,rippleSize:L,cb:U}=c;d(E=>[...E,N.jsx(_e,{classes:{ripple:y(i.ripple,b.ripple),rippleVisible:y(i.rippleVisible,b.rippleVisible),ripplePulsate:y(i.ripplePulsate,b.ripplePulsate),child:y(i.child,b.child),childLeaving:y(i.childLeaving,b.childLeaving),childPulsate:y(i.childPulsate,b.childPulsate)},timeout:Z,pulsate:x,rippleX:R,rippleY:I,rippleSize:L},f.current)]),f.current+=1,h.current=U},[i]),$=l.useCallback((c={},x={},R=()=>{})=>{const{pulsate:I=!1,center:L=o||x.pulsate,fakeElement:U=!1}=x;if((c==null?void 0:c.type)==="mousedown"&&M.current){M.current=!1;return}(c==null?void 0:c.type)==="touchstart"&&(M.current=!0);const E=U?null:D.current,B=E?E.getBoundingClientRect():{width:0,height:0,left:0,top:0};let S,T,w;if(L||c===void 0||c.clientX===0&&c.clientY===0||!c.clientX&&!c.touches)S=Math.round(B.width/2),T=Math.round(B.height/2);else{const{clientX:z,clientY:j}=c.touches&&c.touches.length>0?c.touches[0]:c;S=Math.round(z-B.left),T=Math.round(j-B.top)}if(L)w=Math.sqrt((2*B.width**2+B.height**2)/3),w%2===0&&(w+=1);else{const z=Math.max(Math.abs((E?E.clientWidth:0)-S),S)*2+2,j=Math.max(Math.abs((E?E.clientHeight:0)-T),T)*2+2;w=Math.sqrt(z**2+j**2)}c!=null&&c.touches?g.current===null&&(g.current=()=>{C({pulsate:I,rippleX:S,rippleY:T,rippleSize:w,cb:R})},V.start(Ye,()=>{g.current&&(g.current(),g.current=null)})):C({pulsate:I,rippleX:S,rippleY:T,rippleSize:w,cb:R})},[o,C,V]),A=l.useCallback(()=>{$({},{pulsate:!0})},[$]),F=l.useCallback((c,x)=>{if(V.clear(),(c==null?void 0:c.type)==="touchend"&&g.current){g.current(),g.current=null,V.start(0,()=>{F(c,x)});return}g.current=null,d(R=>R.length>0?R.slice(1):R),h.current=x},[V]);return l.useImperativeHandle(t,()=>({pulsate:A,start:$,stop:F}),[A,$,F]),N.jsx(He,{className:y(b.root,i.root,s),ref:D,...p,children:N.jsx(te,{component:null,exit:!0,children:u})})});function qe(n){return we("MuiButtonBase",n)}const Ze=ae("MuiButtonBase",["root","disabled","focusVisible"]),Je=n=>{const{disabled:e,focusVisible:t,focusVisibleClassName:a,classes:o}=n,s=De({root:["root",e&&"disabled",t&&"focusVisible"]},qe,o);return t&&a&&(s.root+=` ${a}`),s},Qe=J("button",{name:"MuiButtonBase",slot:"Root",overridesResolver:(n,e)=>e.root})({display:"inline-flex",alignItems:"center",justifyContent:"center",position:"relative",boxSizing:"border-box",WebkitTapHighlightColor:"transparent",backgroundColor:"transparent",outline:0,border:0,margin:0,borderRadius:0,padding:0,cursor:"pointer",userSelect:"none",verticalAlign:"middle",MozAppearance:"none",WebkitAppearance:"none",textDecoration:"none",color:"inherit","&::-moz-focus-inner":{borderStyle:"none"},[`&.${Ze.disabled}`]:{pointerEvents:"none",cursor:"default"},"@media print":{colorAdjust:"exact"}}),st=l.forwardRef(function(e,t){const a=le({props:e,name:"MuiButtonBase"}),{action:o,centerRipple:i=!1,children:s,className:p,component:u="button",disabled:d=!1,disableRipple:f=!1,disableTouchRipple:h=!1,focusRipple:M=!1,focusVisibleClassName:V,LinkComponent:g="a",onBlur:D,onClick:C,onContextMenu:$,onDragLeave:A,onFocus:F,onFocusVisible:c,onKeyDown:x,onKeyUp:R,onMouseDown:I,onMouseLeave:L,onMouseUp:U,onTouchEnd:E,onTouchMove:B,onTouchStart:S,tabIndex:T=0,TouchRippleProps:w,touchRippleRef:z,type:j,...O}=a,X=l.useRef(null),m=ze(),ue=re(m.ref,z),[v,K]=l.useState(!1);d&&v&&K(!1),l.useImperativeHandle(o,()=>({focusVisible:()=>{K(!0),X.current.focus()}}),[]);const ce=m.shouldMount&&!f&&!d;l.useEffect(()=>{v&&M&&!f&&m.pulsate()},[f,M,v,m]);const pe=P(m,"start",I,h),de=P(m,"stop",$,h),fe=P(m,"stop",A,h),he=P(m,"stop",U,h),me=P(m,"stop",r=>{v&&r.preventDefault(),L&&L(r)},h),ge=P(m,"start",S,h),be=P(m,"stop",E,h),Me=P(m,"stop",B,h),Re=P(m,"stop",r=>{ie(r.target)||K(!1),D&&D(r)},!1),xe=_(r=>{X.current||(X.current=r.currentTarget),ie(r.target)&&(K(!0),c&&c(r)),F&&F(r)}),q=()=>{const r=X.current;return u&&u!=="button"&&!(r.tagName==="A"&&r.href)},Ee=_(r=>{M&&!r.repeat&&v&&r.key===" "&&m.stop(r,()=>{m.start(r)}),r.target===r.currentTarget&&q()&&r.key===" "&&r.preventDefault(),x&&x(r),r.target===r.currentTarget&&q()&&r.key==="Enter"&&!d&&(r.preventDefault(),C&&C(r))}),ye=_(r=>{M&&r.key===" "&&v&&!r.defaultPrevented&&m.stop(r,()=>{m.pulsate(r)}),R&&R(r),C&&r.target===r.currentTarget&&q()&&r.key===" "&&!r.defaultPrevented&&C(r)});let W=u;W==="button"&&(O.href||O.to)&&(W=g);const Y={};W==="button"?(Y.type=j===void 0?"button":j,Y.disabled=d):(!O.href&&!O.to&&(Y.role="button"),d&&(Y["aria-disabled"]=d));const Ce=re(t,X),ne={...a,centerRipple:i,component:u,disabled:d,disableRipple:f,disableTouchRipple:h,focusRipple:M,tabIndex:T,focusVisible:v},Te=Je(ne);return N.jsxs(Qe,{as:W,className:y(Te.root,p),ownerState:ne,onBlur:Re,onClick:C,onContextMenu:de,onFocus:xe,onKeyDown:Ee,onKeyUp:ye,onMouseDown:pe,onMouseLeave:me,onMouseUp:he,onDragLeave:fe,onTouchEnd:be,onTouchMove:Me,onTouchStart:ge,ref:Ce,tabIndex:d?-1:T,type:j,...Y,...O,children:[s,ce?N.jsx(Ge,{ref:ue,center:i,...w}):null]})});function P(n,e,t,a=!1){return _(o=>(t&&t(o),a||n[e](o),!0))}export{st as B};
