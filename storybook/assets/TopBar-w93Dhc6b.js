import{aO as he,z as ye,r as f,o as fe,aP as ge,f as be,j as r,L as Y,n as J,R as xe,v as ve,e as Te,k as S,aQ as ke}from"./iframe-CWBlVoSh.js";import{I as A}from"./Icon-CB0Uj0Aw.js";import{M as we}from"./Menu-BJgpV-l7.js";import{M as H}from"./MenuItem-Ckf4fgp6.js";import{g as qe}from"./getThemeProps-XfRzqxji.js";import{u as Be,a as Se}from"./useInsets-QIN_82-_.js";import{A as Ie}from"./Avatar-B3DduiUj.js";import{A as Ce}from"./AppBar-CwqavI5n.js";import{T as je}from"./Toolbar-Pf6HJr2z.js";function Pe(n,t,e,o,i){const[s,p]=f.useState(()=>i&&e?e(n).matches:o?o(n).matches:t);return fe(()=>{if(!e)return;const u=e(n),d=()=>{p(u.matches)};return d(),u.addEventListener("change",d),()=>{u.removeEventListener("change",d)}},[n,e]),s}const Le={...ye},K=Le.useSyncExternalStore;function Me(n,t,e,o,i){const s=f.useCallback(()=>t,[t]),p=f.useMemo(()=>{if(i&&e)return()=>e(n).matches;if(o!==null){const{matches:m}=o(n);return()=>m}return s},[s,n,o,i,e]),[u,d]=f.useMemo(()=>{if(e===null)return[s,()=>()=>{}];const m=e(n);return[()=>m.matches,c=>(m.addEventListener("change",c),()=>{m.removeEventListener("change",c)})]},[s,e,n]);return K(d,u,p)}function Z(n={}){const{themeId:t}=n;return function(o,i={}){let s=he();s&&t&&(s=s[t]||s);const p=typeof window<"u"&&typeof window.matchMedia<"u",{defaultMatches:u=!1,matchMedia:d=p?window.matchMedia:null,ssrMatchMedia:g=null,noSsr:m=!1}=qe({name:"MuiUseMediaQuery",props:i,theme:s});let c=typeof o=="function"?o(s):o;return c=c.replace(/^@media( ?)/m,""),c.includes("print")&&console.warn(["MUI: You have provided a `print` query to the `useMediaQuery` hook.","Using the print media query to modify print styles can lead to unexpected results.","Consider using the `displayPrint` field in the `sx` prop instead.","More information about `displayPrint` on our docs: https://mui.com/system/display/#display-in-print."].join(`
`)),(K!==void 0?Me:Pe)(c,u,d,g,m)}}Z();const Re=Z({themeId:ge});function O(n){const t=be(),e=typeof n=="function"?n(t):n;return Re(e)}const N=({label:n,href:t,icon:e,iconColor:o,external:i,showLabel:s=!0,"data-gui-node-id":p})=>{const u=r.jsxs(r.Fragment,{children:[e&&r.jsx(A,{name:e,iconColor:o||"currentColor",style:{marginRight:3,fontSize:20,position:"relative",top:-1}}),s&&r.jsx("span",{children:n})]});return r.jsx(Y,{href:t??"#",target:i?"_blank":"_self","data-gui-node-id":p||void 0,style:{display:"inline-flex",alignItems:"center",color:"inherit",textDecoration:"none"},children:u})};N.__docgenInfo={description:"",methods:[],displayName:"TopBarLink",props:{label:{required:!0,tsType:{name:"string"},description:""},href:{required:!0,tsType:{name:"string"},description:""},icon:{required:!1,tsType:{name:"string"},description:""},external:{required:!1,tsType:{name:"boolean"},description:""},iconColor:{required:!1,tsType:{name:"string"},description:""},showLabel:{required:!1,tsType:{name:"boolean"},description:"Whether to display the label next to the icon. Defaults to true.",defaultValue:{value:"true",computed:!1}},"data-gui-node-id":{required:!1,tsType:{name:"string"},description:"Names the link as a GUI node (Semantic Inspector / Layout Grid)."}}};const ee=(n,t,e,o)=>n.map(({label:i,href:s,icon:p,iconColor:u,external:d,items:g},m)=>{const c=i??s??m,h=e.has(i),v=r.jsxs(Y,{to:d?void 0:s,href:d?s:void 0,target:d?"_blank":void 0,style:{display:"inline-flex",alignItems:"center",color:"inherit",textDecoration:"none",flexGrow:1},children:[p&&r.jsx(A,{name:typeof p=="string"?p:"info",iconColor:u||"currentColor",style:{marginRight:2,fontSize:20,position:"relative",top:-1}}),i]});return g&&g.length>0?r.jsxs(xe.Fragment,{children:[r.jsxs(H,{onClick:()=>o(i),sx:{color:"inherit",display:"flex",alignItems:"center",justifyContent:"space-between"},children:[v,r.jsx(A,{name:h?"expand_less":"expand_more",iconColor:"currentColor",style:{fontSize:20,position:"relative",top:-1,marginLeft:1}})]}),r.jsx("div",{style:{maxHeight:h?"500px":"0px",opacity:h?1:0,overflow:"hidden",transition:"max-height 0.2s ease-out, opacity 0.2s ease-out",paddingLeft:16},children:ee(g,t,e,o)})]},c):r.jsx(H,{onClick:t,sx:{color:"inherit"},children:v},c)}),I=({label:n,icon:t,iconColor:e,items:o,showLabel:i=!0})=>{const[s,p]=f.useState(null),[u,d]=f.useState(new Set),g=h=>{p(h.currentTarget)},m=()=>{p(null),d(new Set)},c=h=>{d(v=>{const k=new Set(v);return k.has(h)?k.delete(h):k.add(h),k})};return r.jsxs(r.Fragment,{children:[r.jsxs(J,{onClick:g,sx:{cursor:"pointer",px:1,display:"inline-flex",alignItems:"center",color:"inherit"},children:[t&&r.jsx(A,{name:typeof t=="string"?t:"info",iconColor:e||"currentColor",style:{marginRight:i?2:0,fontSize:20,position:"relative",top:-1}}),i&&r.jsx("span",{children:n})]}),r.jsx(we,{anchorEl:s,open:!!s,onClose:m,sx:{color:"inherit"},children:o&&ee(o,m,u,c)})]})};I.__docgenInfo={description:"",methods:[],displayName:"TopBarMenu",props:{label:{required:!0,tsType:{name:"string"},description:""},icon:{required:!1,tsType:{name:"ReactNode"},description:""},iconColor:{required:!1,tsType:{name:"string"},description:""},showLabel:{required:!1,tsType:{name:"boolean"},description:"Whether to display the label next to the icon in the top-level menu trigger. Defaults to true.",defaultValue:{value:"true",computed:!1}},items:{required:!1,tsType:{name:"Array",elements:[{name:"signature",type:"object",raw:`{
  label: string;
  href: string;
  icon?: ReactNode;
  iconColor?: string;
  external?: boolean;
  items?: TopBarMenuItemProps[]; 
}`,signature:{properties:[{key:"label",value:{name:"string",required:!0}},{key:"href",value:{name:"string",required:!0}},{key:"icon",value:{name:"ReactNode",required:!1}},{key:"iconColor",value:{name:"string",required:!1}},{key:"external",value:{name:"boolean",required:!1}},{key:"items",value:{name:"Array",elements:[{name:"TopBarMenuItemProps"}],raw:"TopBarMenuItemProps[]",required:!1}}]}}],raw:"TopBarMenuItemProps[]"},description:""}}};const C=({element:n,className:t,style:e})=>r.jsx("div",{className:ve("TopBarAction",t),style:e,children:n});C.__docgenInfo={description:"",methods:[],displayName:"TopBarAction",props:{element:{required:!0,tsType:{name:"ReactNode"},description:""},className:{required:!1,tsType:{name:"string"},description:""},style:{required:!1,tsType:{name:"ReactCSSProperties",raw:"React.CSSProperties"},description:""}}};function Ne(n){return!Array.isArray(n)||n.length===0?[]:n.filter(Boolean)}function j(n,t,e){return Ne(n).flatMap(o=>{const i=o[t];if(!i)return[];const s=typeof i=="function"?i({slot:e,collectionId:o.id}):i;return Array.isArray(s)?s.filter(Boolean):[]})}function Fe(n,t,e){return[...n??[],...j(t,e,e)]}function He(n,t,e){const o=e==="rightBar"?"rightSidebar":"rightSidebarFooter";return[...n??[],...j(t,e,e),...j(t,o,o)]}function V(n,t,e){return[...n??[],...j(t,e,e)]}function Oe(n,t,e){return[...n??[],...j(t,e,e)]}const x=(...n)=>n.filter(Boolean),X=n=>{const t=[];return n.forEach(e=>{if(e.type==="link"){const{label:o,href:i,icon:s,iconColor:p,external:u}=e.props;o&&i&&t.push({label:o,href:i,icon:s,iconColor:p,external:u})}else if(e.type==="menu"){const{items:o}=e.props;Array.isArray(o)&&o.forEach(i=>t.push(i))}}),t};function Ae(n){var $,F;const{title:t="",logo:e="",elementsCenter:o=[],elementsRight:i=[],collectionsCenter:s=[],collectionsRight:p=[],homeTo:u,noBorder:d=!1,elementsLeft:g=[],hideBrand:m=!1,position:c="fixed",sx:h,appBarSx:v,toolbarSx:k,elementsLeftSx:ne,brandSx:re,logoSx:U,titleSx:te,linksSx:ae,id:oe,className:se,collapsedIconCenter:ie="settings",collapsedIconRight:le="more_horiz"}=n,y=Te(),P=O(y.breakpoints.down("sm")),w=O(y.breakpoints.up("md")),E=f.useRef(null),D=f.useRef(null),b=Be(),L=Se(),G=Math.max(0,Number((b==null?void 0:b.left)??0)),z=Math.max(0,Number((b==null?void 0:b.right)??0)),W=G+z,Q=!P,M=f.useMemo(()=>V(o,s,"topBarCenter"),[s,o]),q=f.useMemo(()=>V(i,p,"topBarRight"),[p,i]),pe=(($=String(t??"").trim().charAt(0))==null?void 0:$.toUpperCase())||"",R=u!==null,T=R?u??"/":void 0,ue=e?r.jsx(S,{component:"img",src:e,alt:t?`${t} logo`:"Brand logo",sx:x({height:28},U)}):r.jsx(Ie,{sx:x({width:28,height:28,fontSize:"0.875rem"},U),children:pe||"?"});f.useEffect(()=>{if(typeof L!="function")return;const a=()=>{const B=D.current??E.current,me=(B==null?void 0:B.offsetHeight)??48;L({nav:me},"top-bar")};a();let l;if(typeof ResizeObserver<"u"){const B=D.current??E.current;B&&(l=new ResizeObserver(()=>a()),l.observe(B))}return()=>{l&&l.disconnect(),L({top:0,nav:0},"top-bar")}},[P,L]),f.useEffect(()=>{b&&typeof b.left=="number"&&document.documentElement.style.setProperty("--gui-inset-left",`${b.left}px`)},[b.left]);const _=c==="fixed"||c==="sticky",de={minHeight:48,backgroundColor:y.palette.background.nav,...d?{}:{borderBottom:"1px solid",borderColor:y.palette.divider},zIndex:((F=y==null?void 0:y.zIndex)==null?void 0:F.appBar)??1100,..._&&{top:0,left:`${G}px`,right:`${z}px`,width:`calc(100% - ${W}px)`,transition:"left 0.3s ease, right 0.3s ease, width 0.3s ease"},boxSizing:"border-box"},ce=_?void 0:{ml:`${G}px`,mr:`${z}px`,width:`calc(100% - ${W}px)`,transition:"margin-left 0.3s ease, margin-right 0.3s ease, width 0.3s ease"};return r.jsx(Ce,{id:oe,"data-gui-node-id":"GUI.window.layout.bars.top","data-gui-component":"top",className:se,position:c,elevation:0,ref:D,sx:x(de,{"--has-topbar":1},ce,h,v),children:r.jsxs(je,{ref:E,variant:"dense",disableGutters:!0,sx:x(_?{minHeight:48,pl:1.5,pr:1.5,py:0,display:"flex",alignItems:"center",gap:1.25,position:"relative"}:{minHeight:48,pl:1.5,pr:1.5,py:.5,display:"flex",alignItems:"center",gap:1.25,position:"relative"},k),children:[!m&&r.jsxs(S,{sx:x({display:"flex",alignItems:"center",flexShrink:0,textDecoration:"none",ml:0,pl:1.5,gap:Q?1.25:.75,"&:hover":{textDecoration:"none"},cursor:R?"pointer":"default"},re),component:R?typeof T=="string"&&/^(https?:)?\/\//.test(T)?"a":ke:"div",...R&&T?typeof T=="string"&&/^(https?:)?\/\//.test(T)?{href:T}:{to:T}:{},children:[ue,Q&&t&&r.jsx(J,{variant:"h6",noWrap:!0,component:"div",sx:x({color:y.palette.text.secondary,fontWeight:500},te),children:t})]}),g.length>0&&r.jsx(S,{sx:x({display:"flex",alignItems:"center",gap:1.25,minWidth:0,flex:"0 1 auto",overflow:"hidden",pl:m?1.5:0,color:y.palette.text.secondary},ne),children:g.map((a,l)=>a.type==="link"?r.jsx(N,{showLabel:w,...a.props},a.props.label??l):a.type==="menu"?r.jsx(I,{showLabel:w,...a.props},a.props.label??l):a.type==="action"?r.jsx(C,{...a.props},l):null)}),!P&&r.jsx(S,{sx:{position:"absolute",left:"50%",transform:"translateX(-50%)",pointerEvents:"none",color:y.palette.text.secondary},children:r.jsx(S,{sx:{display:"flex",alignItems:"center",gap:1.25,pointerEvents:"auto"},children:M.map((a,l)=>a.type==="link"?r.jsx(N,{showLabel:w,...a.props},a.props.label??l):a.type==="menu"?r.jsx(I,{showLabel:w,...a.props},a.props.label??l):a.type==="action"?r.jsx(C,{...a.props},l):null)})}),r.jsx(S,{sx:x({display:"flex",alignItems:"center",flexShrink:0,marginLeft:"auto",gap:1.25,pr:1.5,color:y.palette.text.secondary,transition:"color 0.2s ease","&:hover":{color:y.palette.text.primary}},ae),children:P?r.jsxs(r.Fragment,{children:[M.filter(a=>a.type==="action").map((a,l)=>r.jsx(C,{...a.props},`center-action-${l}`)),M.some(a=>a.type!=="action")&&r.jsx(I,{label:"",icon:ie,items:X(M),showLabel:!1}),q.filter(a=>a.type==="action").map((a,l)=>r.jsx(C,{...a.props},`right-action-${l}`)),q.some(a=>a.type!=="action")&&r.jsx(I,{label:"",icon:le,items:X(q),showLabel:!1})]}):q==null?void 0:q.map((a,l)=>a.type==="link"?r.jsx(N,{showLabel:w,...a.props},a.props.label??l):a.type==="menu"?r.jsx(I,{showLabel:w,...a.props},a.props.label??l):a.type==="action"?r.jsx(C,{...a.props},l):null)})]})})}Ae.__docgenInfo={description:`## TopBar Layout Overview

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
  href: string;
  icon?: string;
  external?: boolean;
  iconColor?: string;
  /** Whether to display the label next to the icon. Defaults to true. */
  showLabel?: boolean;
  /** Names the link as a GUI node (Semantic Inspector / Layout Grid). */
  'data-gui-node-id'?: string;
}`,signature:{properties:[{key:"label",value:{name:"string",required:!0}},{key:"href",value:{name:"string",required:!0}},{key:"icon",value:{name:"string",required:!1}},{key:"external",value:{name:"boolean",required:!1}},{key:"iconColor",value:{name:"string",required:!1}},{key:"showLabel",value:{name:"boolean",required:!1},description:"Whether to display the label next to the icon. Defaults to true."},{key:"data-gui-node-id",value:{name:"string",required:!1},description:"Names the link as a GUI node (Semantic Inspector / Layout Grid)."}]},required:!0}}]}},{name:"signature",type:"object",raw:"{ type: 'menu'; props: TopBarMenuProps }",signature:{properties:[{key:"type",value:{name:"literal",value:"'menu'",required:!0}},{key:"props",value:{name:"signature",type:"object",raw:`{
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
  href: string;
  icon?: string;
  external?: boolean;
  iconColor?: string;
  /** Whether to display the label next to the icon. Defaults to true. */
  showLabel?: boolean;
  /** Names the link as a GUI node (Semantic Inspector / Layout Grid). */
  'data-gui-node-id'?: string;
}`,signature:{properties:[{key:"label",value:{name:"string",required:!0}},{key:"href",value:{name:"string",required:!0}},{key:"icon",value:{name:"string",required:!1}},{key:"external",value:{name:"boolean",required:!1}},{key:"iconColor",value:{name:"string",required:!1}},{key:"showLabel",value:{name:"boolean",required:!1},description:"Whether to display the label next to the icon. Defaults to true."},{key:"data-gui-node-id",value:{name:"string",required:!1},description:"Names the link as a GUI node (Semantic Inspector / Layout Grid)."}]},required:!0}}]}},{name:"signature",type:"object",raw:"{ type: 'menu'; props: TopBarMenuProps }",signature:{properties:[{key:"type",value:{name:"literal",value:"'menu'",required:!0}},{key:"props",value:{name:"signature",type:"object",raw:`{
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
  href: string;
  icon?: string;
  external?: boolean;
  iconColor?: string;
  /** Whether to display the label next to the icon. Defaults to true. */
  showLabel?: boolean;
  /** Names the link as a GUI node (Semantic Inspector / Layout Grid). */
  'data-gui-node-id'?: string;
}`,signature:{properties:[{key:"label",value:{name:"string",required:!0}},{key:"href",value:{name:"string",required:!0}},{key:"icon",value:{name:"string",required:!1}},{key:"external",value:{name:"boolean",required:!1}},{key:"iconColor",value:{name:"string",required:!1}},{key:"showLabel",value:{name:"boolean",required:!1},description:"Whether to display the label next to the icon. Defaults to true."},{key:"data-gui-node-id",value:{name:"string",required:!1},description:"Names the link as a GUI node (Semantic Inspector / Layout Grid)."}]},required:!0}}]}},{name:"signature",type:"object",raw:"{ type: 'menu'; props: TopBarMenuProps }",signature:{properties:[{key:"type",value:{name:"literal",value:"'menu'",required:!0}},{key:"props",value:{name:"signature",type:"object",raw:`{
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
}`,signature:{properties:[{key:"element",value:{name:"ReactNode",required:!0}}]},required:!0}}]}}]}],raw:"TopBarElement[]"},description:""},collectionsCenter:{required:!1,tsType:{name:"Array",elements:[{name:"SideBarsCollectionInput"}],raw:"SideBarsCollectionInput[]"},description:""},collectionsRight:{required:!1,tsType:{name:"Array",elements:[{name:"SideBarsCollectionInput"}],raw:"SideBarsCollectionInput[]"},description:""},collapsedIconCenter:{required:!1,tsType:{name:"string"},description:'Icon name used when center elements are collapsed (mobile). Default: "settings".'},collapsedIconRight:{required:!1,tsType:{name:"string"},description:'Icon name used when right elements are collapsed (mobile). Default: "more_horiz".'},homeTo:{required:!1,tsType:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}]},description:""},noBorder:{required:!1,tsType:{name:"boolean"},description:"Drops the AppBar's own `borderBottom`/`borderColor` (the divider line\nunder the bar) — everything else about `baseAppBarSx` stays. Default:\nfalse (the line renders, same as before this prop existed)."},hideBrand:{required:!1,tsType:{name:"boolean"},description:'Skips rendering the brand area entirely (the `logo` image, or the\ntitle-initial/"?" `Avatar` fallback when no `logo` is given, plus its\nhome-link wrapper) — for a caller that only wants `elementsCenter`/\n`elementsRight` and no brand mark at all. Default: false (the brand\narea renders, same as before this prop existed).'},sx:{required:!1,tsType:{name:"SxProps",elements:[{name:"Theme"}],raw:"SxProps<Theme>"},description:""},appBarSx:{required:!1,tsType:{name:"SxProps",elements:[{name:"Theme"}],raw:"SxProps<Theme>"},description:""},toolbarSx:{required:!1,tsType:{name:"SxProps",elements:[{name:"Theme"}],raw:"SxProps<Theme>"},description:""},elementsLeftSx:{required:!1,tsType:{name:"SxProps",elements:[{name:"Theme"}],raw:"SxProps<Theme>"},description:"Styles for the box holding `elementsLeft` (e.g. to bring them closer to the bar they hang from)."},brandSx:{required:!1,tsType:{name:"SxProps",elements:[{name:"Theme"}],raw:"SxProps<Theme>"},description:""},logoSx:{required:!1,tsType:{name:"SxProps",elements:[{name:"Theme"}],raw:"SxProps<Theme>"},description:""},titleSx:{required:!1,tsType:{name:"SxProps",elements:[{name:"Theme"}],raw:"SxProps<Theme>"},description:""},linksSx:{required:!1,tsType:{name:"SxProps",elements:[{name:"Theme"}],raw:"SxProps<Theme>"},description:""},linkSx:{required:!1,tsType:{name:"SxProps",elements:[{name:"Theme"}],raw:"SxProps<Theme>"},description:""},menuSx:{required:!1,tsType:{name:"SxProps",elements:[{name:"Theme"}],raw:"SxProps<Theme>"},description:""},menuItemSx:{required:!1,tsType:{name:"SxProps",elements:[{name:"Theme"}],raw:"SxProps<Theme>"},description:""},id:{required:!1,tsType:{name:"string"},description:""},className:{required:!1,tsType:{name:"string"},description:""}},composes:["AppBarProps"]};export{Ae as T,He as a,Oe as b,Fe as m,O as u};
