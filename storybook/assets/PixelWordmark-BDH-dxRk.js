import{j as l}from"./iframe-q72FflWy.js";function y({bitmap:a,pixelSize:d=2,pixelAspect:u=1,fg:p="currentColor",ariaLabel:h=".me",className:f,style:g,"data-gui-node-id":w}){const s=a.length,m=s?Math.max(...a.map(e=>e.length)):0,r=d*u,i=d,n=m*r,o=s*i;if(!n||!o)return null;const c=[];for(let e=0;e<s;e++){const x=a[e]??"";for(let t=0;t<m;t++)x[t]==="1"&&c.push(l.jsx("rect",{x:t*r,y:e*i,width:r,height:i},`${t}-${e}`))}return l.jsx("svg",{"data-gui-node-id":w||"PixelWordmark",className:f,style:g,width:n,height:o,viewBox:`0 0 ${n} ${o}`,role:"img","aria-label":h,shapeRendering:"crispEdges",children:l.jsx("g",{fill:p,children:c})})}y.__docgenInfo={description:`Draws a bitmap as its own small, fixed-resolution pixel grid — no
connection to a QR's module count at all. Where QR.tsx's embedBitmap
mechanism must quantize a shape down to however many modules a safe
embedScale allows (a handful, for anything meant to stay scannable),
this renders at whatever pixelSize is asked for, so a full "m"/"e"/"."
wordmark stays legible at a size far smaller than embedding it into the
code ever could. Meant to sit on top of a QR that's cleared a blank
negative-space area for it (see QR.me.tsx) — this component draws
nothing about the QR itself.`,methods:[],displayName:"PixelWordmark",props:{bitmap:{required:!0,tsType:{name:"Array",elements:[{name:"string"}],raw:"string[]"},description:`Rows of "0"/"1" — same bitmap format QR.tsx's embedBitmap uses.`},pixelSize:{required:!1,tsType:{name:"number"},description:"Real screen px per bitmap cell (height) — this is what stays crisp at any size.",defaultValue:{value:"2",computed:!1}},pixelAspect:{required:!1,tsType:{name:"number"},description:"Multiplier on pixelSize for cell width — >1 widens the whole glyph set without redrawing the bitmap.",defaultValue:{value:"1",computed:!1}},fg:{required:!1,tsType:{name:"string"},description:"",defaultValue:{value:"'currentColor'",computed:!1}},ariaLabel:{required:!1,tsType:{name:"string"},description:`Defaults to ".me" — this component started as the .me mark's own
 renderer (see meMark.ts) before any other bitmap used it; a caller
 drawing a different wordmark (e.g. NetGetMark.tsx's "NETGET") should
 pass its own label so the accessible name matches what's actually
 drawn.`,defaultValue:{value:"'.me'",computed:!1}},className:{required:!1,tsType:{name:"string"},description:""},style:{required:!1,tsType:{name:"ReactCSSProperties",raw:"React.CSSProperties"},description:""},"data-gui-node-id":{required:!1,tsType:{name:"string"},description:""}}};export{y as P};
