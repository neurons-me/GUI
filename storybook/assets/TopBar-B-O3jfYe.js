import{aU as he,q as ye,r as f,y as ge,aV as fe,e as be,j as t,L as Y,k as J,R as ve,x as xe,d as ke,i as S,aW as Te}from"./iframe-Dgz0DvjP.js";import{I as N}from"./Icon-zhfCvvEA.js";import{M as we}from"./Menu-D9ienzuU.js";import{M as H}from"./MenuItem-DVYWd6rG.js";import{g as qe}from"./getThemeProps-DPkTTLbc.js";import{u as Be,a as Se}from"./useInsets-Cl1hGTb2.js";import{A as Ce}from"./Avatar-CRm8ZbT3.js";import{A as Ie}from"./AppBar-DeyLG5Ky.js";import{T as je}from"./Toolbar-CvqahxVg.js";function Pe(n,r,e,a,i){const[s,p]=f.useState(()=>i&&e?e(n).matches:a?a(n).matches:r);return ge(()=>{if(!e)return;const u=e(n),d=()=>{p(u.matches)};return d(),u.addEventListener("change",d),()=>{u.removeEventListener("change",d)}},[n,e]),s}const Le={...ye},K=Le.useSyncExternalStore;function Me(n,r,e,a,i){const s=f.useCallback(()=>r,[r]),p=f.useMemo(()=>{if(i&&e)return()=>e(n).matches;if(a!==null){const{matches:m}=a(n);return()=>m}return s},[s,n,a,i,e]),[u,d]=f.useMemo(()=>{if(e===null)return[s,()=>()=>{}];const m=e(n);return[()=>m.matches,c=>(m.addEventListener("change",c),()=>{m.removeEventListener("change",c)})]},[s,e,n]);return K(d,u,p)}function Z(n={}){const{themeId:r}=n;return function(a,i={}){let s=he();s&&r&&(s=s[r]||s);const p=typeof window<"u"&&typeof window.matchMedia<"u",{defaultMatches:u=!1,matchMedia:d=p?window.matchMedia:null,ssrMatchMedia:h=null,noSsr:m=!1}=qe({name:"MuiUseMediaQuery",props:i,theme:s});let c=typeof a=="function"?a(s):a;return c=c.replace(/^@media( ?)/m,""),c.includes("print")&&console.warn(["MUI: You have provided a `print` query to the `useMediaQuery` hook.","Using the print media query to modify print styles can lead to unexpected results.","Consider using the `displayPrint` field in the `sx` prop instead.","More information about `displayPrint` on our docs: https://mui.com/system/display/#display-in-print."].join(`
`)),(K!==void 0?Me:Pe)(c,u,d,h,m)}}Z();const Re=Z({themeId:fe});function O(n){const r=be(),e=typeof n=="function"?n(r):n;return Re(e)}const A=({label:n,href:r,onClick:e,active:a,icon:i,iconColor:s,external:p,showLabel:u=!0,"data-gui-node-id":d})=>{const h=t.jsxs(t.Fragment,{children:[i&&t.jsx(N,{name:i,iconColor:s||"currentColor",style:{marginRight:3,fontSize:20,position:"relative",top:-1}}),u&&t.jsx("span",{children:n})]});return!r&&e?t.jsx("button",{type:"button",onClick:e,title:u?void 0:n,"aria-label":n,"aria-current":a?"page":void 0,"data-gui-node-id":d||void 0,style:{display:"inline-flex",alignItems:"center",color:"inherit",font:"inherit",background:"none",border:0,padding:0,cursor:"pointer"},children:h}):t.jsx(Y,{href:r??"#",target:p?"_blank":"_self","data-gui-node-id":d||void 0,style:{display:"inline-flex",alignItems:"center",color:"inherit",textDecoration:"none"},children:h})};A.__docgenInfo={description:"",methods:[],displayName:"TopBarLink",props:{label:{required:!0,tsType:{name:"string"},description:""},href:{required:!1,tsType:{name:"string"},description:"Where the link goes. Without one, `onClick` is what it does (a button, not a link)."},onClick:{required:!1,tsType:{name:"signature",type:"function",raw:"() => void",signature:{arguments:[],return:{name:"void"}}},description:""},active:{required:!1,tsType:{name:"boolean"},description:"The place it opens is the one showing."},icon:{required:!1,tsType:{name:"string"},description:""},external:{required:!1,tsType:{name:"boolean"},description:""},iconColor:{required:!1,tsType:{name:"string"},description:""},showLabel:{required:!1,tsType:{name:"boolean"},description:"Whether to display the label next to the icon. Defaults to true.",defaultValue:{value:"true",computed:!1}},"data-gui-node-id":{required:!1,tsType:{name:"string"},description:"Names the link as a GUI node (Semantic Inspector / Layout Grid)."}}};const ee=(n,r,e,a)=>n.map(({label:i,href:s,icon:p,iconColor:u,external:d,items:h},m)=>{const c=i??s??m,y=e.has(i),x=t.jsxs(Y,{to:d?void 0:s,href:d?s:void 0,target:d?"_blank":void 0,style:{display:"inline-flex",alignItems:"center",color:"inherit",textDecoration:"none",flexGrow:1},children:[p&&t.jsx(N,{name:typeof p=="string"?p:"info",iconColor:u||"currentColor",style:{marginRight:2,fontSize:20,position:"relative",top:-1}}),i]});return h&&h.length>0?t.jsxs(ve.Fragment,{children:[t.jsxs(H,{onClick:()=>a(i),sx:{color:"inherit",display:"flex",alignItems:"center",justifyContent:"space-between"},children:[x,t.jsx(N,{name:y?"expand_less":"expand_more",iconColor:"currentColor",style:{fontSize:20,position:"relative",top:-1,marginLeft:1}})]}),t.jsx("div",{style:{maxHeight:y?"500px":"0px",opacity:y?1:0,overflow:"hidden",transition:"max-height 0.2s ease-out, opacity 0.2s ease-out",paddingLeft:16},children:ee(h,r,e,a)})]},c):t.jsx(H,{onClick:r,sx:{color:"inherit"},children:x},c)}),C=({label:n,icon:r,iconColor:e,items:a,showLabel:i=!0})=>{const[s,p]=f.useState(null),[u,d]=f.useState(new Set),h=y=>{p(y.currentTarget)},m=()=>{p(null),d(new Set)},c=y=>{d(x=>{const T=new Set(x);return T.has(y)?T.delete(y):T.add(y),T})};return t.jsxs(t.Fragment,{children:[t.jsxs(J,{onClick:h,sx:{cursor:"pointer",px:1,display:"inline-flex",alignItems:"center",color:"inherit"},children:[r&&t.jsx(N,{name:typeof r=="string"?r:"info",iconColor:e||"currentColor",style:{marginRight:i?2:0,fontSize:20,position:"relative",top:-1}}),i&&t.jsx("span",{children:n})]}),t.jsx(we,{anchorEl:s,open:!!s,onClose:m,sx:{color:"inherit"},children:a&&ee(a,m,u,c)})]})};C.__docgenInfo={description:"",methods:[],displayName:"TopBarMenu",props:{label:{required:!0,tsType:{name:"string"},description:""},icon:{required:!1,tsType:{name:"ReactNode"},description:""},iconColor:{required:!1,tsType:{name:"string"},description:""},showLabel:{required:!1,tsType:{name:"boolean"},description:"Whether to display the label next to the icon in the top-level menu trigger. Defaults to true.",defaultValue:{value:"true",computed:!1}},items:{required:!1,tsType:{name:"Array",elements:[{name:"signature",type:"object",raw:`{
  label: string;
  href: string;
  icon?: ReactNode;
  iconColor?: string;
  external?: boolean;
  items?: TopBarMenuItemProps[]; 
}`,signature:{properties:[{key:"label",value:{name:"string",required:!0}},{key:"href",value:{name:"string",required:!0}},{key:"icon",value:{name:"ReactNode",required:!1}},{key:"iconColor",value:{name:"string",required:!1}},{key:"external",value:{name:"boolean",required:!1}},{key:"items",value:{name:"Array",elements:[{name:"TopBarMenuItemProps"}],raw:"TopBarMenuItemProps[]",required:!1}}]}}],raw:"TopBarMenuItemProps[]"},description:""}}};const I=({element:n,className:r,style:e})=>t.jsx("div",{className:xe("TopBarAction",r),style:e,children:n});I.__docgenInfo={description:"",methods:[],displayName:"TopBarAction",props:{element:{required:!0,tsType:{name:"ReactNode"},description:""},className:{required:!1,tsType:{name:"string"},description:""},style:{required:!1,tsType:{name:"ReactCSSProperties",raw:"React.CSSProperties"},description:""}}};function Ae(n){return!Array.isArray(n)||n.length===0?[]:n.filter(Boolean)}function j(n,r,e){return Ae(n).flatMap(a=>{const i=a[r];if(!i)return[];const s=typeof i=="function"?i({slot:e,collectionId:a.id}):i;return Array.isArray(s)?s.filter(Boolean):[]})}function Fe(n,r,e){return[...n??[],...j(r,e,e)]}function He(n,r,e){const a=e==="rightBar"?"rightSidebar":"rightSidebarFooter";return[...n??[],...j(r,e,e),...j(r,a,a)]}function V(n,r,e){return[...n??[],...j(r,e,e)]}function Oe(n,r,e){return[...n??[],...j(r,e,e)]}const v=(...n)=>n.filter(Boolean),X=n=>{const r=[];return n.forEach(e=>{if(e.type==="link"){const{label:a,href:i,icon:s,iconColor:p,external:u}=e.props;a&&i&&r.push({label:a,href:i,icon:s,iconColor:p,external:u})}else if(e.type==="menu"){const{items:a}=e.props;Array.isArray(a)&&a.forEach(i=>r.push(i))}}),r};function Ne(n){var Q,F;const{title:r="",logo:e="",elementsCenter:a=[],elementsRight:i=[],collectionsCenter:s=[],collectionsRight:p=[],homeTo:u,noBorder:d=!1,elementsLeft:h=[],hideBrand:m=!1,position:c="fixed",sx:y,appBarSx:x,toolbarSx:T,elementsLeftSx:ne,brandSx:te,logoSx:_,titleSx:re,linksSx:oe,id:ae,className:ie,collapsedIconCenter:se="settings",collapsedIconRight:le="more_horiz"}=n,g=ke(),P=O(g.breakpoints.down("sm")),w=O(g.breakpoints.up("md")),W=f.useRef(null),E=f.useRef(null),b=Be(),L=Se(),D=Math.max(0,Number((b==null?void 0:b.left)??0)),G=Math.max(0,Number((b==null?void 0:b.right)??0)),z=D+G,$=!P,M=f.useMemo(()=>V(a,s,"topBarCenter"),[s,a]),q=f.useMemo(()=>V(i,p,"topBarRight"),[p,i]),pe=((Q=String(r??"").trim().charAt(0))==null?void 0:Q.toUpperCase())||"",R=u!==null,k=R?u??"/":void 0,ue=e?t.jsx(S,{component:"img",src:e,alt:r?`${r} logo`:"Brand logo",sx:v({height:28},_)}):t.jsx(Ce,{sx:v({width:28,height:28,fontSize:"0.875rem"},_),children:pe||"?"});f.useEffect(()=>{if(typeof L!="function")return;const o=()=>{const B=E.current??W.current,me=(B==null?void 0:B.offsetHeight)??48;L({nav:me},"top-bar")};o();let l;if(typeof ResizeObserver<"u"){const B=E.current??W.current;B&&(l=new ResizeObserver(()=>o()),l.observe(B))}return()=>{l&&l.disconnect(),L({top:0,nav:0},"top-bar")}},[P,L]),f.useEffect(()=>{b&&typeof b.left=="number"&&document.documentElement.style.setProperty("--gui-inset-left",`${b.left}px`)},[b.left]);const U=c==="fixed"||c==="sticky",de={minHeight:48,backgroundColor:g.palette.background.nav,...d?{}:{borderBottom:"1px solid",borderColor:g.palette.divider},zIndex:((F=g==null?void 0:g.zIndex)==null?void 0:F.appBar)??1100,...U&&{top:0,left:`${D}px`,right:`${G}px`,width:`calc(100% - ${z}px)`,transition:"left 0.3s ease, right 0.3s ease, width 0.3s ease"},boxSizing:"border-box"},ce=U?void 0:{ml:`${D}px`,mr:`${G}px`,width:`calc(100% - ${z}px)`,transition:"margin-left 0.3s ease, margin-right 0.3s ease, width 0.3s ease"};return t.jsx(Ie,{id:ae,"data-gui-node-id":"GUI.window.layout.bars.top","data-gui-component":"top",className:ie,position:c,elevation:0,ref:E,sx:v(de,{"--has-topbar":1},ce,y,x),children:t.jsxs(je,{ref:W,variant:"dense",disableGutters:!0,sx:v(U?{minHeight:48,pl:1.5,pr:1.5,py:0,display:"flex",alignItems:"center",gap:1.25,position:"relative"}:{minHeight:48,pl:1.5,pr:1.5,py:.5,display:"flex",alignItems:"center",gap:1.25,position:"relative"},T),children:[!m&&t.jsxs(S,{sx:v({display:"flex",alignItems:"center",flexShrink:0,textDecoration:"none",ml:0,pl:1.5,gap:$?1.25:.75,"&:hover":{textDecoration:"none"},cursor:R?"pointer":"default"},te),component:R?typeof k=="string"&&/^(https?:)?\/\//.test(k)?"a":Te:"div",...R&&k?typeof k=="string"&&/^(https?:)?\/\//.test(k)?{href:k}:{to:k}:{},children:[ue,$&&r&&t.jsx(J,{variant:"h6",noWrap:!0,component:"div",sx:v({color:g.palette.text.secondary,fontWeight:500},re),children:r})]}),h.length>0&&t.jsx(S,{sx:v({display:"flex",alignItems:"center",gap:1.25,minWidth:0,flex:"0 1 auto",overflow:"hidden",pl:m?1.5:0,color:g.palette.text.secondary},ne),children:h.map((o,l)=>o.type==="link"?t.jsx(A,{showLabel:w,...o.props},o.props.label??l):o.type==="menu"?t.jsx(C,{showLabel:w,...o.props},o.props.label??l):o.type==="action"?t.jsx(I,{...o.props},l):null)}),!P&&t.jsx(S,{sx:{position:"absolute",left:"50%",transform:"translateX(-50%)",pointerEvents:"none",color:g.palette.text.secondary},children:t.jsx(S,{sx:{display:"flex",alignItems:"center",gap:1.25,pointerEvents:"auto"},children:M.map((o,l)=>o.type==="link"?t.jsx(A,{showLabel:w,...o.props},o.props.label??l):o.type==="menu"?t.jsx(C,{showLabel:w,...o.props},o.props.label??l):o.type==="action"?t.jsx(I,{...o.props},l):null)})}),t.jsx(S,{sx:v({display:"flex",alignItems:"center",flexShrink:0,marginLeft:"auto",gap:1.25,pr:1.5,color:g.palette.text.secondary,transition:"color 0.2s ease","&:hover":{color:g.palette.text.primary}},oe),children:P?t.jsxs(t.Fragment,{children:[M.filter(o=>o.type==="action").map((o,l)=>t.jsx(I,{...o.props},`center-action-${l}`)),M.some(o=>o.type!=="action")&&t.jsx(C,{label:"",icon:se,items:X(M),showLabel:!1}),q.filter(o=>o.type==="action").map((o,l)=>t.jsx(I,{...o.props},`right-action-${l}`)),q.some(o=>o.type!=="action")&&t.jsx(C,{label:"",icon:le,items:X(q),showLabel:!1})]}):q==null?void 0:q.map((o,l)=>o.type==="link"?t.jsx(A,{showLabel:w,...o.props},o.props.label??l):o.type==="menu"?t.jsx(C,{showLabel:w,...o.props},o.props.label??l):o.type==="action"?t.jsx(I,{...o.props},l):null)})]})})}Ne.__docgenInfo={description:`## TopBar Layout Overview

The TopBar is divided into three main sections:
- **Brand (Left)** → Displays the logo and title, linking to \`homeTo\`.
- **Center Elements** → Typically used for navigation links or menus, centered horizontally.
- **Right Elements** → Used for actions, user menus, or secondary navigation.

---

## Responsiveness Behavior

The TopBar adapts dynamically to screen width using MUI breakpoints:

| Viewport        | Breakpoint Range     | Behavior                                 |
|-----------------|----------------------|-------------------------------------------|
| **Desktop**     | ≥ 900px (\`md\` and up) | Shows icons **and** labels (full view).   |
| **Tablet**      | 600–899px (\`sm\`–\`md\`) | Shows **icons only** (labels hidden).     |
| **Mobile**      | < 600px (\`sm\` down)   | Collapses into two grouped menus.         |

- The **center section** and **right section** each collapse into a single \`TopBarMenu\` trigger in mobile view.
- The **collapsed menus** show their corresponding grouped elements as dropdown items.

---

## Collapsed Icons

The props \`collapsedIconCenter\` and \`collapsedIconRight\` define the icons used when the TopBar collapses into mobile view:

\`\`\`tsx
<TopBar
  collapsedIconCenter="settings"   // default
  collapsedIconRight="more_horiz"  // default
/>
\`\`\`

These determine which icons appear for the two grouped mobile dropdown triggers.
The values should correspond to names supported by the \`Icon\` component (e.g., Material Symbols).

---

## Notes

- The TopBar ensures real visual centering of \`elementsCenter\` using absolute positioning.
- Padding and insets automatically adjust based on AppBar position (\`fixed\`, \`static\`, or \`sticky\`).
- \`TopBarLink\` and \`TopBarMenu\` each accept \`showLabel\` for tablet responsiveness (icons-only view).`,methods:[],displayName:"TopBar",props:{title:{required:!1,tsType:{name:"string"},description:""},logo:{required:!1,tsType:{name:"string"},description:""},elementsLeft:{required:!1,tsType:{name:"Array",elements:[{name:"union",raw:`| { type: 'link'; props: TopBarLinkProps }
| { type: 'menu'; props: TopBarMenuProps }
| { type: 'action'; props: TopBarActionProps }`,elements:[{name:"signature",type:"object",raw:"{ type: 'link'; props: TopBarLinkProps }",signature:{properties:[{key:"type",value:{name:"literal",value:"'link'",required:!0}},{key:"props",value:{name:"signature",type:"object",raw:`{
  label: string;
  /** Where the link goes. Without one, \`onClick\` is what it does (a button, not a link). */
  href?: string;
  onClick?: () => void;
  /** The place it opens is the one showing. */
  active?: boolean;
  icon?: string;
  external?: boolean;
  iconColor?: string;
  /** Whether to display the label next to the icon. Defaults to true. */
  showLabel?: boolean;
  /** Names the link as a GUI node (Semantic Inspector / Layout Grid). */
  'data-gui-node-id'?: string;
}`,signature:{properties:[{key:"label",value:{name:"string",required:!0}},{key:"href",value:{name:"string",required:!1},description:"Where the link goes. Without one, `onClick` is what it does (a button, not a link)."},{key:"onClick",value:{name:"signature",type:"function",raw:"() => void",signature:{arguments:[],return:{name:"void"}},required:!1}},{key:"active",value:{name:"boolean",required:!1},description:"The place it opens is the one showing."},{key:"icon",value:{name:"string",required:!1}},{key:"external",value:{name:"boolean",required:!1}},{key:"iconColor",value:{name:"string",required:!1}},{key:"showLabel",value:{name:"boolean",required:!1},description:"Whether to display the label next to the icon. Defaults to true."},{key:"data-gui-node-id",value:{name:"string",required:!1},description:"Names the link as a GUI node (Semantic Inspector / Layout Grid)."}]},required:!0}}]}},{name:"signature",type:"object",raw:"{ type: 'menu'; props: TopBarMenuProps }",signature:{properties:[{key:"type",value:{name:"literal",value:"'menu'",required:!0}},{key:"props",value:{name:"signature",type:"object",raw:`{
  label: string;
  icon?: ReactNode;
  iconColor?: string;
  /** Whether to display the label next to the icon in the top-level menu trigger. Defaults to true. */
  showLabel?: boolean;
  items?: TopBarMenuItemProps[];
}`,signature:{properties:[{key:"label",value:{name:"string",required:!0}},{key:"icon",value:{name:"ReactNode",required:!1}},{key:"iconColor",value:{name:"string",required:!1}},{key:"showLabel",value:{name:"boolean",required:!1},description:"Whether to display the label next to the icon in the top-level menu trigger. Defaults to true."},{key:"items",value:{name:"Array",elements:[{name:"signature",type:"object",raw:`{
  label: string;
  href: string;
  icon?: ReactNode;
  iconColor?: string;
  external?: boolean;
  items?: TopBarMenuItemProps[]; 
}`,signature:{properties:[{key:"label",value:{name:"string",required:!0}},{key:"href",value:{name:"string",required:!0}},{key:"icon",value:{name:"ReactNode",required:!1}},{key:"iconColor",value:{name:"string",required:!1}},{key:"external",value:{name:"boolean",required:!1}},{key:"items",value:{name:"Array",elements:[{name:"TopBarMenuItemProps"}],raw:"TopBarMenuItemProps[]",required:!1}}]}}],raw:"TopBarMenuItemProps[]",required:!1}}]},required:!0}}]}},{name:"signature",type:"object",raw:"{ type: 'action'; props: TopBarActionProps }",signature:{properties:[{key:"type",value:{name:"literal",value:"'action'",required:!0}},{key:"props",value:{name:"signature",type:"object",raw:`{
  element: ReactNode;
}`,signature:{properties:[{key:"element",value:{name:"ReactNode",required:!0}}]},required:!0}}]}}]}],raw:"TopBarElement[]"},description:"Elements on the LEFT, after the brand (or at the bar's start when `hideBrand`): what names where you are, not an\naction. The lane shrinks and ellipsizes before it ever pushes the right elements out."},elementsCenter:{required:!1,tsType:{name:"Array",elements:[{name:"union",raw:`| { type: 'link'; props: TopBarLinkProps }
| { type: 'menu'; props: TopBarMenuProps }
| { type: 'action'; props: TopBarActionProps }`,elements:[{name:"signature",type:"object",raw:"{ type: 'link'; props: TopBarLinkProps }",signature:{properties:[{key:"type",value:{name:"literal",value:"'link'",required:!0}},{key:"props",value:{name:"signature",type:"object",raw:`{
  label: string;
  /** Where the link goes. Without one, \`onClick\` is what it does (a button, not a link). */
  href?: string;
  onClick?: () => void;
  /** The place it opens is the one showing. */
  active?: boolean;
  icon?: string;
  external?: boolean;
  iconColor?: string;
  /** Whether to display the label next to the icon. Defaults to true. */
  showLabel?: boolean;
  /** Names the link as a GUI node (Semantic Inspector / Layout Grid). */
  'data-gui-node-id'?: string;
}`,signature:{properties:[{key:"label",value:{name:"string",required:!0}},{key:"href",value:{name:"string",required:!1},description:"Where the link goes. Without one, `onClick` is what it does (a button, not a link)."},{key:"onClick",value:{name:"signature",type:"function",raw:"() => void",signature:{arguments:[],return:{name:"void"}},required:!1}},{key:"active",value:{name:"boolean",required:!1},description:"The place it opens is the one showing."},{key:"icon",value:{name:"string",required:!1}},{key:"external",value:{name:"boolean",required:!1}},{key:"iconColor",value:{name:"string",required:!1}},{key:"showLabel",value:{name:"boolean",required:!1},description:"Whether to display the label next to the icon. Defaults to true."},{key:"data-gui-node-id",value:{name:"string",required:!1},description:"Names the link as a GUI node (Semantic Inspector / Layout Grid)."}]},required:!0}}]}},{name:"signature",type:"object",raw:"{ type: 'menu'; props: TopBarMenuProps }",signature:{properties:[{key:"type",value:{name:"literal",value:"'menu'",required:!0}},{key:"props",value:{name:"signature",type:"object",raw:`{
  label: string;
  icon?: ReactNode;
  iconColor?: string;
  /** Whether to display the label next to the icon in the top-level menu trigger. Defaults to true. */
  showLabel?: boolean;
  items?: TopBarMenuItemProps[];
}`,signature:{properties:[{key:"label",value:{name:"string",required:!0}},{key:"icon",value:{name:"ReactNode",required:!1}},{key:"iconColor",value:{name:"string",required:!1}},{key:"showLabel",value:{name:"boolean",required:!1},description:"Whether to display the label next to the icon in the top-level menu trigger. Defaults to true."},{key:"items",value:{name:"Array",elements:[{name:"signature",type:"object",raw:`{
  label: string;
  href: string;
  icon?: ReactNode;
  iconColor?: string;
  external?: boolean;
  items?: TopBarMenuItemProps[]; 
}`,signature:{properties:[{key:"label",value:{name:"string",required:!0}},{key:"href",value:{name:"string",required:!0}},{key:"icon",value:{name:"ReactNode",required:!1}},{key:"iconColor",value:{name:"string",required:!1}},{key:"external",value:{name:"boolean",required:!1}},{key:"items",value:{name:"Array",elements:[{name:"TopBarMenuItemProps"}],raw:"TopBarMenuItemProps[]",required:!1}}]}}],raw:"TopBarMenuItemProps[]",required:!1}}]},required:!0}}]}},{name:"signature",type:"object",raw:"{ type: 'action'; props: TopBarActionProps }",signature:{properties:[{key:"type",value:{name:"literal",value:"'action'",required:!0}},{key:"props",value:{name:"signature",type:"object",raw:`{
  element: ReactNode;
}`,signature:{properties:[{key:"element",value:{name:"ReactNode",required:!0}}]},required:!0}}]}}]}],raw:"TopBarElement[]"},description:""},elementsRight:{required:!1,tsType:{name:"Array",elements:[{name:"union",raw:`| { type: 'link'; props: TopBarLinkProps }
| { type: 'menu'; props: TopBarMenuProps }
| { type: 'action'; props: TopBarActionProps }`,elements:[{name:"signature",type:"object",raw:"{ type: 'link'; props: TopBarLinkProps }",signature:{properties:[{key:"type",value:{name:"literal",value:"'link'",required:!0}},{key:"props",value:{name:"signature",type:"object",raw:`{
  label: string;
  /** Where the link goes. Without one, \`onClick\` is what it does (a button, not a link). */
  href?: string;
  onClick?: () => void;
  /** The place it opens is the one showing. */
  active?: boolean;
  icon?: string;
  external?: boolean;
  iconColor?: string;
  /** Whether to display the label next to the icon. Defaults to true. */
  showLabel?: boolean;
  /** Names the link as a GUI node (Semantic Inspector / Layout Grid). */
  'data-gui-node-id'?: string;
}`,signature:{properties:[{key:"label",value:{name:"string",required:!0}},{key:"href",value:{name:"string",required:!1},description:"Where the link goes. Without one, `onClick` is what it does (a button, not a link)."},{key:"onClick",value:{name:"signature",type:"function",raw:"() => void",signature:{arguments:[],return:{name:"void"}},required:!1}},{key:"active",value:{name:"boolean",required:!1},description:"The place it opens is the one showing."},{key:"icon",value:{name:"string",required:!1}},{key:"external",value:{name:"boolean",required:!1}},{key:"iconColor",value:{name:"string",required:!1}},{key:"showLabel",value:{name:"boolean",required:!1},description:"Whether to display the label next to the icon. Defaults to true."},{key:"data-gui-node-id",value:{name:"string",required:!1},description:"Names the link as a GUI node (Semantic Inspector / Layout Grid)."}]},required:!0}}]}},{name:"signature",type:"object",raw:"{ type: 'menu'; props: TopBarMenuProps }",signature:{properties:[{key:"type",value:{name:"literal",value:"'menu'",required:!0}},{key:"props",value:{name:"signature",type:"object",raw:`{
  label: string;
  icon?: ReactNode;
  iconColor?: string;
  /** Whether to display the label next to the icon in the top-level menu trigger. Defaults to true. */
  showLabel?: boolean;
  items?: TopBarMenuItemProps[];
}`,signature:{properties:[{key:"label",value:{name:"string",required:!0}},{key:"icon",value:{name:"ReactNode",required:!1}},{key:"iconColor",value:{name:"string",required:!1}},{key:"showLabel",value:{name:"boolean",required:!1},description:"Whether to display the label next to the icon in the top-level menu trigger. Defaults to true."},{key:"items",value:{name:"Array",elements:[{name:"signature",type:"object",raw:`{
  label: string;
  href: string;
  icon?: ReactNode;
  iconColor?: string;
  external?: boolean;
  items?: TopBarMenuItemProps[]; 
}`,signature:{properties:[{key:"label",value:{name:"string",required:!0}},{key:"href",value:{name:"string",required:!0}},{key:"icon",value:{name:"ReactNode",required:!1}},{key:"iconColor",value:{name:"string",required:!1}},{key:"external",value:{name:"boolean",required:!1}},{key:"items",value:{name:"Array",elements:[{name:"TopBarMenuItemProps"}],raw:"TopBarMenuItemProps[]",required:!1}}]}}],raw:"TopBarMenuItemProps[]",required:!1}}]},required:!0}}]}},{name:"signature",type:"object",raw:"{ type: 'action'; props: TopBarActionProps }",signature:{properties:[{key:"type",value:{name:"literal",value:"'action'",required:!0}},{key:"props",value:{name:"signature",type:"object",raw:`{
  element: ReactNode;
}`,signature:{properties:[{key:"element",value:{name:"ReactNode",required:!0}}]},required:!0}}]}}]}],raw:"TopBarElement[]"},description:""},collectionsCenter:{required:!1,tsType:{name:"Array",elements:[{name:"SideBarsCollectionInput"}],raw:"SideBarsCollectionInput[]"},description:""},collectionsRight:{required:!1,tsType:{name:"Array",elements:[{name:"SideBarsCollectionInput"}],raw:"SideBarsCollectionInput[]"},description:""},collapsedIconCenter:{required:!1,tsType:{name:"string"},description:'Icon name used when center elements are collapsed (mobile). Default: "settings".'},collapsedIconRight:{required:!1,tsType:{name:"string"},description:'Icon name used when right elements are collapsed (mobile). Default: "more_horiz".'},homeTo:{required:!1,tsType:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}]},description:""},noBorder:{required:!1,tsType:{name:"boolean"},description:"Drops the AppBar's own `borderBottom`/`borderColor` (the divider line\nunder the bar) — everything else about `baseAppBarSx` stays. Default:\nfalse (the line renders, same as before this prop existed)."},hideBrand:{required:!1,tsType:{name:"boolean"},description:'Skips rendering the brand area entirely (the `logo` image, or the\ntitle-initial/"?" `Avatar` fallback when no `logo` is given, plus its\nhome-link wrapper) — for a caller that only wants `elementsCenter`/\n`elementsRight` and no brand mark at all. Default: false (the brand\narea renders, same as before this prop existed).'},sx:{required:!1,tsType:{name:"SxProps",elements:[{name:"Theme"}],raw:"SxProps<Theme>"},description:""},appBarSx:{required:!1,tsType:{name:"SxProps",elements:[{name:"Theme"}],raw:"SxProps<Theme>"},description:""},toolbarSx:{required:!1,tsType:{name:"SxProps",elements:[{name:"Theme"}],raw:"SxProps<Theme>"},description:""},elementsLeftSx:{required:!1,tsType:{name:"SxProps",elements:[{name:"Theme"}],raw:"SxProps<Theme>"},description:"Styles for the box holding `elementsLeft` (e.g. to bring them closer to the bar they hang from)."},brandSx:{required:!1,tsType:{name:"SxProps",elements:[{name:"Theme"}],raw:"SxProps<Theme>"},description:""},logoSx:{required:!1,tsType:{name:"SxProps",elements:[{name:"Theme"}],raw:"SxProps<Theme>"},description:""},titleSx:{required:!1,tsType:{name:"SxProps",elements:[{name:"Theme"}],raw:"SxProps<Theme>"},description:""},linksSx:{required:!1,tsType:{name:"SxProps",elements:[{name:"Theme"}],raw:"SxProps<Theme>"},description:""},linkSx:{required:!1,tsType:{name:"SxProps",elements:[{name:"Theme"}],raw:"SxProps<Theme>"},description:""},menuSx:{required:!1,tsType:{name:"SxProps",elements:[{name:"Theme"}],raw:"SxProps<Theme>"},description:""},menuItemSx:{required:!1,tsType:{name:"SxProps",elements:[{name:"Theme"}],raw:"SxProps<Theme>"},description:""},id:{required:!1,tsType:{name:"string"},description:""},className:{required:!1,tsType:{name:"string"},description:""}},composes:["AppBarProps"]};export{Ne as T,He as a,Oe as b,Fe as m,O as u};
