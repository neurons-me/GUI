import{j as e,L as J,r as b,i as K,p as ce,a4 as me,c as he,h as S,aR as ye}from"./iframe-D0caXraM.js";import{I as N}from"./Icon-QhGitz5d.js";import{M as ge}from"./Menu-Cb6wxuKw.js";import{M as O}from"./MenuItem-DcITh2LE.js";import{u as V}from"./useGuiMediaQuery-DIj0O0SY.js";import{u as fe,a as be}from"./useInsets-CiiXh2hL.js";import{A as xe}from"./Avatar-DA2IiRv7.js";import{A as ve}from"./AppBar-CCGMmm9R.js";import{T as ke}from"./Toolbar-PZ12EgUX.js";const A=({label:a,href:r,onClick:t,active:i,icon:o,iconColor:l,external:p,showLabel:d=!0,"data-gui-node-id":c})=>{const m=e.jsxs(e.Fragment,{children:[o&&e.jsx(N,{name:o,iconColor:l||"currentColor",style:{marginRight:3,fontSize:20,position:"relative",top:-1}}),d&&e.jsx("span",{children:a})]});return!r&&t?e.jsx("button",{type:"button",onClick:t,title:d?void 0:a,"aria-label":a,"aria-current":i?"page":void 0,"data-gui-node-id":c||void 0,style:{display:"inline-flex",alignItems:"center",color:"inherit",font:"inherit",background:"none",border:0,padding:0,cursor:"pointer"},children:m}):e.jsx(J,{href:r??"#",target:p?"_blank":"_self","data-gui-node-id":c||void 0,style:{display:"inline-flex",alignItems:"center",color:"inherit",textDecoration:"none"},children:m})};A.__docgenInfo={description:"",methods:[],displayName:"TopBarLink",props:{label:{required:!0,tsType:{name:"string"},description:""},href:{required:!1,tsType:{name:"string"},description:"Where the link goes. Without one, `onClick` is what it does (a button, not a link)."},onClick:{required:!1,tsType:{name:"signature",type:"function",raw:"() => void",signature:{arguments:[],return:{name:"void"}}},description:""},active:{required:!1,tsType:{name:"boolean"},description:"The place it opens is the one showing."},icon:{required:!1,tsType:{name:"string"},description:""},external:{required:!1,tsType:{name:"boolean"},description:""},iconColor:{required:!1,tsType:{name:"string"},description:""},showLabel:{required:!1,tsType:{name:"boolean"},description:"Whether to display the label next to the icon. Defaults to true.",defaultValue:{value:"true",computed:!1}},"data-gui-node-id":{required:!1,tsType:{name:"string"},description:"Names the link as a GUI node (Semantic Inspector / Layout Grid)."}}};const Y=(a,r,t,i)=>a.map(({label:o,href:l,icon:p,iconColor:d,external:c,items:m},x)=>{const g=o??l??x,h=t.has(o),k=e.jsxs(J,{to:c?void 0:l,href:c?l:void 0,target:c?"_blank":void 0,style:{display:"inline-flex",alignItems:"center",color:"inherit",textDecoration:"none",flexGrow:1},children:[p&&e.jsx(N,{name:typeof p=="string"?p:"info",iconColor:d||"currentColor",style:{marginRight:2,fontSize:20,position:"relative",top:-1}}),o]});return m&&m.length>0?e.jsxs(ce.Fragment,{children:[e.jsxs(O,{onClick:()=>i(o),sx:{color:"inherit",display:"flex",alignItems:"center",justifyContent:"space-between"},children:[k,e.jsx(N,{name:h?"expand_less":"expand_more",iconColor:"currentColor",style:{fontSize:20,position:"relative",top:-1,marginLeft:1}})]}),e.jsx("div",{style:{maxHeight:h?"500px":"0px",opacity:h?1:0,overflow:"hidden",transition:"max-height 0.2s ease-out, opacity 0.2s ease-out",paddingLeft:16},children:Y(m,r,t,i)})]},g):e.jsx(O,{onClick:r,sx:{color:"inherit"},children:k},g)}),C=({label:a,icon:r,iconColor:t,items:i,showLabel:o=!0})=>{const[l,p]=b.useState(null),[d,c]=b.useState(new Set),m=h=>{p(h.currentTarget)},x=()=>{p(null),c(new Set)},g=h=>{c(k=>{const T=new Set(k);return T.has(h)?T.delete(h):T.add(h),T})};return e.jsxs(e.Fragment,{children:[e.jsxs(K,{onClick:m,sx:{cursor:"pointer",px:1,display:"inline-flex",alignItems:"center",color:"inherit"},children:[r&&e.jsx(N,{name:typeof r=="string"?r:"info",iconColor:t||"currentColor",style:{marginRight:o?2:0,fontSize:20,position:"relative",top:-1}}),o&&e.jsx("span",{children:a})]}),e.jsx(ge,{anchorEl:l,open:!!l,onClose:x,sx:{color:"inherit"},children:i&&Y(i,x,d,g)})]})};C.__docgenInfo={description:"",methods:[],displayName:"TopBarMenu",props:{label:{required:!0,tsType:{name:"string"},description:""},icon:{required:!1,tsType:{name:"ReactNode"},description:""},iconColor:{required:!1,tsType:{name:"string"},description:""},showLabel:{required:!1,tsType:{name:"boolean"},description:"Whether to display the label next to the icon in the top-level menu trigger. Defaults to true.",defaultValue:{value:"true",computed:!1}},items:{required:!1,tsType:{name:"Array",elements:[{name:"signature",type:"object",raw:`{
  label: string;
  href: string;
  icon?: ReactNode;
  iconColor?: string;
  external?: boolean;
  items?: TopBarMenuItemProps[]; 
}`,signature:{properties:[{key:"label",value:{name:"string",required:!0}},{key:"href",value:{name:"string",required:!0}},{key:"icon",value:{name:"ReactNode",required:!1}},{key:"iconColor",value:{name:"string",required:!1}},{key:"external",value:{name:"boolean",required:!1}},{key:"items",value:{name:"Array",elements:[{name:"TopBarMenuItemProps"}],raw:"TopBarMenuItemProps[]",required:!1}}]}}],raw:"TopBarMenuItemProps[]"},description:""}}};const I=({element:a,className:r,style:t})=>e.jsx("div",{className:me("TopBarAction",r),style:t,children:a});I.__docgenInfo={description:"",methods:[],displayName:"TopBarAction",props:{element:{required:!0,tsType:{name:"ReactNode"},description:""},className:{required:!1,tsType:{name:"string"},description:""},style:{required:!1,tsType:{name:"ReactCSSProperties",raw:"React.CSSProperties"},description:""}}};function Te(a){return!Array.isArray(a)||a.length===0?[]:a.filter(Boolean)}function j(a,r,t){return Te(a).flatMap(i=>{const o=i[r];if(!o)return[];const l=typeof o=="function"?o({slot:t,collectionId:i.id}):o;return Array.isArray(l)?l.filter(Boolean):[]})}function Me(a,r,t){return[...a??[],...j(r,t,t)]}function Ae(a,r,t){const i=t==="rightBar"?"rightSidebar":"rightSidebarFooter";return[...a??[],...j(r,t,t),...j(r,i,i)]}function Q(a,r,t){return[...a??[],...j(r,t,t)]}function Ne(a,r,t){return[...a??[],...j(r,t,t)]}const f=(...a)=>a.filter(Boolean),X=a=>{const r=[];return a.forEach(t=>{if(t.type==="link"){const{label:i,href:o,icon:l,iconColor:p,external:d}=t.props;i&&o&&r.push({label:i,href:o,icon:l,iconColor:p,external:d})}else if(t.type==="menu"){const{items:i}=t.props;Array.isArray(i)&&i.forEach(o=>r.push(o))}}),r};function we(a){var F,H;const{title:r="",logo:t="",elementsCenter:i=[],elementsRight:o=[],collectionsCenter:l=[],collectionsRight:p=[],homeTo:d,noBorder:c=!1,elementsLeft:m=[],hideBrand:x=!1,position:g="fixed",sx:h,appBarSx:k,toolbarSx:T,elementsLeftSx:Z,brandSx:ee,logoSx:_,titleSx:ne,linksSx:re,id:te,className:ae,collapsedIconCenter:oe="settings",collapsedIconRight:ie="more_horiz"}=a,u=he(),P=V(u.breakpoints.down("sm")),w=V(u.breakpoints.up("md")),W=b.useRef(null),D=b.useRef(null),y=fe(),L=be(),E=Math.max(0,Number((y==null?void 0:y.left)??0)),G=Math.max(0,Number((y==null?void 0:y.right)??0)),U=E+G,$=!P,R=b.useMemo(()=>Q(i,l,"topBarCenter"),[l,i]),q=b.useMemo(()=>Q(o,p,"topBarRight"),[p,o]),se=((F=String(r??"").trim().charAt(0))==null?void 0:F.toUpperCase())||"",M=d!==null,v=M?d??"/":void 0,le=t?e.jsx(S,{component:"img",src:t,alt:r?`${r} logo`:"Brand logo",sx:f({height:28},_)}):e.jsx(xe,{sx:f({width:28,height:28,fontSize:"0.875rem"},_),children:se||"?"});b.useEffect(()=>{if(typeof L!="function")return;const n=()=>{const B=D.current??W.current,de=(B==null?void 0:B.offsetHeight)??48;L({nav:de},"top-bar")};n();let s;if(typeof ResizeObserver<"u"){const B=D.current??W.current;B&&(s=new ResizeObserver(()=>n()),s.observe(B))}return()=>{s&&s.disconnect(),L({top:0,nav:0},"top-bar")}},[P,L]),b.useEffect(()=>{y&&typeof y.left=="number"&&document.documentElement.style.setProperty("--gui-inset-left",`${y.left}px`)},[y.left]);const z=g==="fixed"||g==="sticky",pe={minHeight:48,backgroundColor:u.palette.background.nav,...c?{}:{borderBottom:"1px solid",borderColor:u.palette.divider},zIndex:((H=u==null?void 0:u.zIndex)==null?void 0:H.appBar)??1100,...z&&{top:0,left:`${E}px`,right:`${G}px`,width:`calc(100% - ${U}px)`,transition:"left 0.3s ease, right 0.3s ease, width 0.3s ease"},boxSizing:"border-box"},ue=z?void 0:{ml:`${E}px`,mr:`${G}px`,width:`calc(100% - ${U}px)`,transition:"margin-left 0.3s ease, margin-right 0.3s ease, width 0.3s ease"};return e.jsx(ve,{id:te,"data-gui-node-id":"GUI.window.layout.bars.top","data-gui-component":"top",className:ae,position:g,elevation:0,ref:D,sx:f(pe,{"--has-topbar":1},ue,h,k),children:e.jsxs(ke,{ref:W,variant:"dense",disableGutters:!0,sx:f(z?{minHeight:48,pl:1.5,pr:1.5,py:0,display:"flex",alignItems:"center",gap:1.25,position:"relative"}:{minHeight:48,pl:1.5,pr:1.5,py:.5,display:"flex",alignItems:"center",gap:1.25,position:"relative"},T),children:[!x&&e.jsxs(S,{sx:f({display:"flex",alignItems:"center",flexShrink:0,textDecoration:"none",ml:0,pl:1.5,gap:$?1.25:.75,"&:hover":{textDecoration:"none"},cursor:M?"pointer":"default"},ee),component:M?typeof v=="string"&&/^(https?:)?\/\//.test(v)?"a":ye:"div",...M&&v?typeof v=="string"&&/^(https?:)?\/\//.test(v)?{href:v}:{to:v}:{},children:[le,$&&r&&e.jsx(K,{variant:"h6",noWrap:!0,component:"div",sx:f({color:u.palette.text.secondary,fontWeight:500},ne),children:r})]}),m.length>0&&e.jsx(S,{sx:f({display:"flex",alignItems:"center",gap:1.25,minWidth:0,flex:"0 1 auto",overflow:"hidden",pl:x?1.5:0,color:u.palette.text.secondary},Z),children:m.map((n,s)=>n.type==="link"?e.jsx(A,{showLabel:w,...n.props},n.props.label??s):n.type==="menu"?e.jsx(C,{showLabel:w,...n.props},n.props.label??s):n.type==="action"?e.jsx(I,{...n.props},s):null)}),!P&&e.jsx(S,{sx:{position:"absolute",left:"50%",transform:"translateX(-50%)",pointerEvents:"none",color:u.palette.text.secondary},children:e.jsx(S,{sx:{display:"flex",alignItems:"center",gap:1.25,pointerEvents:"auto"},children:R.map((n,s)=>n.type==="link"?e.jsx(A,{showLabel:w,...n.props},n.props.label??s):n.type==="menu"?e.jsx(C,{showLabel:w,...n.props},n.props.label??s):n.type==="action"?e.jsx(I,{...n.props},s):null)})}),e.jsx(S,{sx:f({display:"flex",alignItems:"center",flexShrink:0,marginLeft:"auto",gap:1.25,pr:1.5,color:u.palette.text.secondary,transition:"color 0.2s ease","&:hover":{color:u.palette.text.primary}},re),children:P?e.jsxs(e.Fragment,{children:[R.filter(n=>n.type==="action").map((n,s)=>e.jsx(I,{...n.props},`center-action-${s}`)),R.some(n=>n.type!=="action")&&e.jsx(C,{label:"",icon:oe,items:X(R),showLabel:!1}),q.filter(n=>n.type==="action").map((n,s)=>e.jsx(I,{...n.props},`right-action-${s}`)),q.some(n=>n.type!=="action")&&e.jsx(C,{label:"",icon:ie,items:X(q),showLabel:!1})]}):q==null?void 0:q.map((n,s)=>n.type==="link"?e.jsx(A,{showLabel:w,...n.props},n.props.label??s):n.type==="menu"?e.jsx(C,{showLabel:w,...n.props},n.props.label??s):n.type==="action"?e.jsx(I,{...n.props},s):null)})]})})}we.__docgenInfo={description:`## TopBar Layout Overview

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
}`,signature:{properties:[{key:"element",value:{name:"ReactNode",required:!0}}]},required:!0}}]}}]}],raw:"TopBarElement[]"},description:""},collectionsCenter:{required:!1,tsType:{name:"Array",elements:[{name:"SideBarsCollectionInput"}],raw:"SideBarsCollectionInput[]"},description:""},collectionsRight:{required:!1,tsType:{name:"Array",elements:[{name:"SideBarsCollectionInput"}],raw:"SideBarsCollectionInput[]"},description:""},collapsedIconCenter:{required:!1,tsType:{name:"string"},description:'Icon name used when center elements are collapsed (mobile). Default: "settings".'},collapsedIconRight:{required:!1,tsType:{name:"string"},description:'Icon name used when right elements are collapsed (mobile). Default: "more_horiz".'},homeTo:{required:!1,tsType:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}]},description:""},noBorder:{required:!1,tsType:{name:"boolean"},description:"Drops the AppBar's own `borderBottom`/`borderColor` (the divider line\nunder the bar) — everything else about `baseAppBarSx` stays. Default:\nfalse (the line renders, same as before this prop existed)."},hideBrand:{required:!1,tsType:{name:"boolean"},description:'Skips rendering the brand area entirely (the `logo` image, or the\ntitle-initial/"?" `Avatar` fallback when no `logo` is given, plus its\nhome-link wrapper) — for a caller that only wants `elementsCenter`/\n`elementsRight` and no brand mark at all. Default: false (the brand\narea renders, same as before this prop existed).'},sx:{required:!1,tsType:{name:"SxProps",elements:[{name:"Theme"}],raw:"SxProps<Theme>"},description:""},appBarSx:{required:!1,tsType:{name:"SxProps",elements:[{name:"Theme"}],raw:"SxProps<Theme>"},description:""},toolbarSx:{required:!1,tsType:{name:"SxProps",elements:[{name:"Theme"}],raw:"SxProps<Theme>"},description:""},elementsLeftSx:{required:!1,tsType:{name:"SxProps",elements:[{name:"Theme"}],raw:"SxProps<Theme>"},description:"Styles for the box holding `elementsLeft` (e.g. to bring them closer to the bar they hang from)."},brandSx:{required:!1,tsType:{name:"SxProps",elements:[{name:"Theme"}],raw:"SxProps<Theme>"},description:""},logoSx:{required:!1,tsType:{name:"SxProps",elements:[{name:"Theme"}],raw:"SxProps<Theme>"},description:""},titleSx:{required:!1,tsType:{name:"SxProps",elements:[{name:"Theme"}],raw:"SxProps<Theme>"},description:""},linksSx:{required:!1,tsType:{name:"SxProps",elements:[{name:"Theme"}],raw:"SxProps<Theme>"},description:""},linkSx:{required:!1,tsType:{name:"SxProps",elements:[{name:"Theme"}],raw:"SxProps<Theme>"},description:""},menuSx:{required:!1,tsType:{name:"SxProps",elements:[{name:"Theme"}],raw:"SxProps<Theme>"},description:""},menuItemSx:{required:!1,tsType:{name:"SxProps",elements:[{name:"Theme"}],raw:"SxProps<Theme>"},description:""},id:{required:!1,tsType:{name:"string"},description:""},className:{required:!1,tsType:{name:"string"},description:""}},composes:["AppBarProps"]};export{we as T,Ae as a,Ne as b,Me as m};
