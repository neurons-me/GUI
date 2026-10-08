import{j as e,l as U}from"./iframe-q72FflWy.js";import{T as G}from"./Catalog-DMgAWuYE.js";import"./preload-helper-Dp1pzeXC.js";import"./Grid-BO83D8-E.js";import"./Card-DTaiXsiG.js";import"./Paper-C4cHEfmg.js";import"./CardHeader-B85Y3Sot.js";import"./useSlot-B3Bhjpe0.js";import"./resolveComponentProps-zf7BDQ8X.js";import"./useForkRef-BR9zNRBO.js";import"./CardContent-Cvz75zDw.js";import"./CardActions-CR5S64PM.js";import"./Avatar-iGO_2OcD.js";import"./Avatar-kFT77iM6.js";import"./createSvgIcon-DOR6FtI1.js";import"./Switch-VWqKB610.js";import"./useFormControl-BGm5bEiu.js";import"./useControlled-DIH1o2g4.js";import"./ButtonBase-D2HnvhjV.js";import"./TransitionGroupContext-4zVEsxkP.js";import"./useEventCallback-BVb6jHPB.js";import"./mergeSlotProps-BtuGLXbb.js";import"./Tooltip-DrESC3lI.js";import"./Grow-C-rRNj8l.js";import"./useSlotProps-DMFXOslT.js";import"./Icon-Doq3uhPc.js";import"./LeftSidebarContext-DOlSL4Mw.js";const ne={title:"Getting Started/Theme/Catalog",component:G,tags:["autodocs"],decorators:[L=>{const z=()=>{try{const m=U("Getting Started/Theme/Palette","Default");if(typeof m=="function")return m()}catch{}window.location.hash="#/story/theme-palette--default"};return e.jsxs("div",{style:{minHeight:"100vh",display:"flex",flexDirection:"column",background:"var(--mui-palette-background-default, #0b0f14)"},children:[e.jsxs("div",{style:{position:"sticky",top:0,zIndex:10,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 12px",borderBottom:"1px solid var(--mui-palette-divider, rgba(255,255,255,0.08))",backdropFilter:"blur(10px)",background:"color-mix(in srgb, var(--mui-palette-background-paper, #0a0e14) 72%, transparent)",color:"var(--mui-palette-text-primary, #fff)"},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:10},children:[e.jsx("div",{style:{fontWeight:700,letterSpacing:-.2},children:"Themes Catalog"}),e.jsx("div",{style:{opacity:.7,fontSize:12},children:"Browse & select GUI themes"})]}),e.jsx("button",{type:"button",onClick:z,title:"Open Palette stories","aria-label":"Open Palette stories",style:{display:"inline-flex",alignItems:"center",justifyContent:"center",width:36,height:36,borderRadius:10,border:"1px solid var(--mui-palette-divider, rgba(255,255,255,0.12))",background:"var(--mui-palette-action-hover, rgba(255,255,255,0.04))",color:"var(--mui-palette-text-primary, rgba(255,255,255,0.92))",cursor:"pointer"},children:e.jsx("svg",{width:"18",height:"18",viewBox:"0 0 24 24",fill:"currentColor","aria-hidden":"true",children:e.jsx("path",{d:"M12 3c-4.97 0-9 3.58-9 8c0 2.76 1.66 5.2 4.26 6.67c.58.33.94.95.94 1.61V21c0 .55.45 1 1 1h3c.55 0 1-.45 1-1v-1.18c0-.66.36-1.28.94-1.61C19.34 16.2 21 13.76 21 11c0-4.42-4.03-8-9-8zm2.5 7c.83 0 1.5.67 1.5 1.5S15.33 13 14.5 13S13 12.33 13 11.5S13.67 10 14.5 10zM7.5 13C6.67 13 6 12.33 6 11.5S6.67 10 7.5 10S9 10.67 9 11.5S8.33 13 7.5 13zm2-4.5C8.67 8.5 8 7.83 8 7s.67-1.5 1.5-1.5S11 6.17 11 7s-.67 1.5-1.5 1.5zm5 0C13.67 8.5 13 7.83 13 7s.67-1.5 1.5-1.5S16 6.17 16 7s-.67 1.5-1.5 1.5z"})})})]}),e.jsx("div",{style:{padding:16,minHeight:320,flex:1},children:e.jsx(L,{})})]})}],parameters:{docs:{description:{component:`
The **ThemesCatalog** is a *state-aware theme selector* that renders available GUI themes as interactive cards.

Think of it as a **visual controller over your ThemeContext**, not just a list.

---
## Mental Model

The component operates across **three layers**:

1. **Data Layer**
   - Sources themes from \`getGuiThemes()\`
   - Each theme is a \`ThemeManifest\`

2. **State Layer**
   - Reads and writes from \`useThemeContext()\`
   - Controls:
     - \`themeId\`
     - \`mode\` (light / dark)

3. **Presentation Layer**
   - Renders themes as cards
   - Supports layout + density variants

---
## Variants (Layout vs Density)

### Layout Variants
- \`grid\` → visual gallery (default)
- \`list\` → vertical stack

### Density Modifiers
These *override layout behavior*:

- \`minimal\`
  - Hides author + description
  - Keeps structure

- \`compact\`
  - Forces grid layout
  - Reduces spacing, typography, and sizing
  - Optimized for dashboards / side panels

👉 **Important:**
\`compact\` is not just visual — it *changes layout rules*.

---
## Behavior

- Selecting a card:
  - Updates global theme (\`themeId\`)
  - Syncs mode (light/dark)
  - Stores history via \`meRef\`

- Active theme:
  - Highlighted
  - Shows mode toggle (unless disabled)

---
## Usage

### Basic
~~~jsx
<ThemesCatalog />
~~~

### List View
~~~jsx
<ThemesCatalog variant="list" />
~~~

### Minimal UI
~~~jsx
<ThemesCatalog minimal />
~~~

### Compact (Dense Grid)
~~~jsx
<ThemesCatalog compact />
~~~

---
## Declarative
~~~json
{
  "type": "ThemesCatalog",
  "props": {
    "compact": true
  }
}
~~~

---
## When to use

- Theme pickers (user settings)
- Design system previews
- Admin / dev tools
- Embedded UI panels

---
## Key Insight

This is not just a component.

It is a **bridge between theme data, global state, and UI representation**.

That’s why it supports both:
- Imperative React usage
- Declarative GUI specs
        `}}},argTypes:{variant:{control:{type:"radio"},options:["grid","list"],description:"Choose layout variant"},hideDescription:{control:{type:"boolean"},description:"Hide the theme description text inside each card"},hideAuthor:{control:{type:"boolean"},description:"Hide the theme author text inside each card"},minimal:{control:{type:"boolean"},description:"Compact view (hides both author and description)"}},args:{variant:"grid",hideDescription:!1,hideAuthor:!1,minimal:!1}},t={args:{variant:"grid"}},a={name:"List layout",args:{variant:"list"}},r={name:"No descriptions",args:{variant:"grid",hideDescription:!0}},i={name:"Minimal (no author, no description)",args:{variant:"grid",minimal:!0}},s={name:"Compact (dense grid)",args:{compact:!0}},o={name:"Compact + Minimal",args:{compact:!0,minimal:!0}},n={name:"List + Minimal",args:{variant:"list",minimal:!0}},me=["Playground","ListVariant","NoDescriptions","Minimal","Compact","CompactMinimal","ListMinimal"];var c,l,p;t.parameters={...t.parameters,docs:{...(c=t.parameters)==null?void 0:c.docs,source:{originalSource:`{
  args: {
    variant: 'grid'
  }
}`,...(p=(l=t.parameters)==null?void 0:l.docs)==null?void 0:p.source}}};var d,u,h;a.parameters={...a.parameters,docs:{...(d=a.parameters)==null?void 0:d.docs,source:{originalSource:`{
  name: 'List layout',
  args: {
    variant: 'list'
  }
}`,...(h=(u=a.parameters)==null?void 0:u.docs)==null?void 0:h.source}}};var g,v,y;r.parameters={...r.parameters,docs:{...(g=r.parameters)==null?void 0:g.docs,source:{originalSource:`{
  name: 'No descriptions',
  args: {
    variant: 'grid',
    hideDescription: true
  }
}`,...(y=(v=r.parameters)==null?void 0:v.docs)==null?void 0:y.source}}};var x,f,b;i.parameters={...i.parameters,docs:{...(x=i.parameters)==null?void 0:x.docs,source:{originalSource:`{
  name: 'Minimal (no author, no description)',
  args: {
    variant: 'grid',
    minimal: true
  }
}`,...(b=(f=i.parameters)==null?void 0:f.docs)==null?void 0:b.source}}};var C,S,T;s.parameters={...s.parameters,docs:{...(C=s.parameters)==null?void 0:C.docs,source:{originalSource:`{
  name: 'Compact (dense grid)',
  args: {
    compact: true
  }
}`,...(T=(S=s.parameters)==null?void 0:S.docs)==null?void 0:T.source}}};var j,M,I;o.parameters={...o.parameters,docs:{...(j=o.parameters)==null?void 0:j.docs,source:{originalSource:`{
  name: 'Compact + Minimal',
  args: {
    compact: true,
    minimal: true
  }
}`,...(I=(M=o.parameters)==null?void 0:M.docs)==null?void 0:I.source}}};var w,D,k;n.parameters={...n.parameters,docs:{...(w=n.parameters)==null?void 0:w.docs,source:{originalSource:`{
  name: 'List + Minimal',
  args: {
    variant: 'list',
    minimal: true
  }
}`,...(k=(D=n.parameters)==null?void 0:D.docs)==null?void 0:k.source}}};export{s as Compact,o as CompactMinimal,n as ListMinimal,a as ListVariant,i as Minimal,r as NoDescriptions,t as Playground,me as __namedExportsOrder,ne as default};
