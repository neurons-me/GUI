import{j as e,T as C}from"./iframe-q72FflWy.js";import{I as i}from"./Icon-Doq3uhPc.js";import"./preload-helper-Dp1pzeXC.js";const F={title:"Atoms/Icon",component:i,tags:["autodocs"],parameters:{decorators:[n=>e.jsx(C,{children:e.jsx(n,{})})],docs:{description:{component:`
The **Icon** component is a universal rendering adapter for multiple icon libraries, built on a **registry-driven pattern**.

Instead of being a simple wrapper for one icon type, it acts as a multiplexer that can resolve icon requests from different sources based on a prefixed name. This provides a consistent and powerful way to manage icons across your design system.

---
## Core Concept: The Icon Registry

The component uses an internal registry that maps a prefix to a specific rendering function. This makes the system extensible and modular.

This architecture means you can add more icon libraries in the future (e.g., \`fontawesome:\`) just by adding a new entry to the registry, without changing the component's core logic.

---
## How It Works

When you provide a \`name\` prop, the component follows this logic:

1.  **Parse the name**: It splits the name by the first colon (\`:\`). For example, \`"lucide:Menu"\` becomes \`prefix='lucide'\` and \`iconKey='Menu'\`.
2.  **Find the resolver**: It looks up the \`prefix\` in its internal icon registry.
3.  **Delegate rendering**: It calls the corresponding resolver function, passing it the \`iconKey\` and other props.
4.  **Render**: The resolver returns the appropriate component (\`<Menu />\` from Lucide, \`<Favorite />\` from MUI, or a \`<span>\` for Material Symbols).

---
## Usage Examples

### Material Symbols (Default)
~~~tsx
// These are equivalent
<Icon name="home" />
<Icon name="material:home" />
~~~

### Lucide Icons
~~~tsx
<Icon name="lucide:Menu" iconColor="var(--gui-primary)" />
~~~

### MUI Icons
~~~tsx
<Icon name="mui:Favorite" fontSize="large" iconColor="var(--gui-error)" />
~~~
`}}},argTypes:{name:{control:"text",description:"Icon name token. Use prefixes like `lucide:`, `mui:`, or just the name for Material Symbols."},iconColor:{control:"color",description:"CSS color value applied to the icon."},fontSize:{control:"text",description:"Font size (number treated as px; or any CSS size string)."},weight:{control:{type:"number",min:100,max:700,step:100},description:"Font variation setting: wght."},fill:{control:{type:"number",min:0,max:1,step:1},description:"Font variation setting: FILL (0 outlined, 1 filled)."},grade:{control:{type:"number",min:-25,max:200,step:25},description:"Font variation setting: GRAD."},opticalSize:{control:{type:"number",min:20,max:48,step:2},description:"Font variation setting: opsz."}}},r={args:{name:"palette",iconColor:"var(--gui-primary)",fontSize:28,weight:500,fill:0,grade:0,opticalSize:24},render:n=>e.jsxs("div",{style:{padding:24,display:"flex",alignItems:"center",gap:12},children:[e.jsx(i,{...n}),e.jsxs("div",{style:{opacity:.8,fontFamily:"ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"},children:[e.jsxs("div",{children:["name: ",String(n.name)]}),e.jsxs("div",{children:["fill: ",String(n.fill)," · wght: ",String(n.weight)," · GRAD: ",String(n.grade)," · opsz:"," ",String(n.opticalSize)]})]})]})},t={name:"Registry Showcase",parameters:{docs:{description:{story:"A quick grid showing how the component renders icons from all supported registries: Material (default), Lucide, and MUI."}}},render:()=>e.jsxs("div",{style:{padding:24,display:"flex",flexDirection:"column",gap:28,alignItems:"start"},children:[e.jsxs("div",{style:{display:"flex",gap:16,alignItems:"center"},children:[e.jsx(i,{name:"home",fontSize:34,iconColor:"var(--gui-primary)"}),e.jsx(i,{name:"lucide:Home",fontSize:34,iconColor:"var(--gui-secondary)"}),e.jsx(i,{name:"mui:Home",fontSize:34,iconColor:"var(--gui-success)"})]}),e.jsxs("div",{style:{display:"flex",gap:16,alignItems:"center"},children:[e.jsx(i,{name:"settings",fontSize:34,iconColor:"var(--gui-primary)"}),e.jsx(i,{name:"lucide:Settings",fontSize:34,iconColor:"var(--gui-secondary)"}),e.jsx(i,{name:"mui:Settings",fontSize:34,iconColor:"var(--gui-success)"})]})]})},a={parameters:{docs:{description:{story:"A quick grid of common glyph names to confirm the font is loading and rendering correctly."}}},render:()=>{const n=["home","palette","settings","menu","search","favorite","account_circle","dashboard","folder","insights","logout","help","code","menu_book"];return e.jsx("div",{style:{padding:24},children:e.jsx("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(140px, 1fr))",gap:14},children:n.map(o=>e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:10,padding:12,borderRadius:12,border:"1px solid rgba(255,255,255,0.10)",background:"rgba(255,255,255,0.03)"},children:[e.jsx(i,{name:o,fontSize:26,iconColor:"var(--gui-primary)"}),e.jsx("span",{style:{fontSize:12,opacity:.85},children:o})]},o))})})}},s={args:{name:"",iconColor:"#2d58a3"},parameters:{docs:{description:{story:"Compare **fill=0** (outlined) vs **fill=1** (filled) using the same glyph."}}},render:()=>e.jsxs("div",{style:{padding:24,display:"flex",gap:28,alignItems:"center"},children:[e.jsxs("div",{style:{display:"flex",gap:10,alignItems:"center"},children:[e.jsx(i,{name:"palette",fill:0,weight:500,fontSize:34,iconColor:"var(--gui-primary)"}),e.jsx("span",{style:{fontSize:12,opacity:.85},children:"fill=0"})]}),e.jsxs("div",{style:{display:"flex",gap:10,alignItems:"center"},children:[e.jsx(i,{name:"palette",fill:1,weight:500,fontSize:34,iconColor:"var(--gui-primary)"}),e.jsx("span",{style:{fontSize:12,opacity:.85},children:"fill=1"})]})]})},l={parameters:{docs:{description:{story:"Preview different **wght** values for the same glyph."}}},render:()=>{const n=[100,200,300,400,500,600,700];return e.jsx("div",{style:{padding:24,display:"flex",flexWrap:"wrap",gap:16,alignItems:"center"},children:n.map(o=>e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:10},children:[e.jsx(i,{name:"settings",weight:o,fill:0,fontSize:30,iconColor:"var(--gui-secondary)"}),e.jsxs("span",{style:{fontSize:12,opacity:.85},children:["wght=",o]})]},o))})}},R=["Playground","AllRegistries","CommonIcons","FilledVsOutlined","WeightRamp"];var c,d,p;r.parameters={...r.parameters,docs:{...(c=r.parameters)==null?void 0:c.docs,source:{originalSource:`{
  args: {
    name: 'palette',
    iconColor: 'var(--gui-primary)',
    fontSize: 28,
    weight: 500,
    fill: 0,
    grade: 0,
    opticalSize: 24
  },
  render: args => <div style={{
    padding: 24,
    display: 'flex',
    alignItems: 'center',
    gap: 12
  }}>
      <Icon {...args} />
      <div style={{
      opacity: 0.8,
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
    }}>
        <div>name: {String(args.name)}</div>
        <div>
          fill: {String(args.fill)} · wght: {String(args.weight)} · GRAD: {String(args.grade)} · opsz:{' '}
          {String(args.opticalSize)}
        </div>
      </div>
    </div>
}`,...(p=(d=r.parameters)==null?void 0:d.docs)==null?void 0:p.source}}};var m,g,u;t.parameters={...t.parameters,docs:{...(m=t.parameters)==null?void 0:m.docs,source:{originalSource:`{
  name: 'Registry Showcase',
  parameters: {
    docs: {
      description: {
        story: 'A quick grid showing how the component renders icons from all supported registries: Material (default), Lucide, and MUI.'
      }
    }
  },
  render: () => <div style={{
    padding: 24,
    display: 'flex',
    flexDirection: 'column',
    gap: 28,
    alignItems: 'start'
  }}>
      <div style={{
      display: 'flex',
      gap: 16,
      alignItems: 'center'
    }}>
        <Icon name="home" fontSize={34} iconColor="var(--gui-primary)" />
        <Icon name="lucide:Home" fontSize={34} iconColor="var(--gui-secondary)" />
        <Icon name="mui:Home" fontSize={34} iconColor="var(--gui-success)" />
      </div>
      <div style={{
      display: 'flex',
      gap: 16,
      alignItems: 'center'
    }}>
        <Icon name="settings" fontSize={34} iconColor="var(--gui-primary)" />
        <Icon name="lucide:Settings" fontSize={34} iconColor="var(--gui-secondary)" />
        <Icon name="mui:Settings" fontSize={34} iconColor="var(--gui-success)" />
      </div>
    </div>
}`,...(u=(g=t.parameters)==null?void 0:g.docs)==null?void 0:u.source}}};var y,f,h;a.parameters={...a.parameters,docs:{...(y=a.parameters)==null?void 0:y.docs,source:{originalSource:`{
  parameters: {
    docs: {
      description: {
        story: 'A quick grid of common glyph names to confirm the font is loading and rendering correctly.'
      }
    }
  },
  render: () => {
    const items = ['home', 'palette', 'settings', 'menu', 'search', 'favorite', 'account_circle', 'dashboard', 'folder', 'insights', 'logout', 'help', 'code', 'menu_book'];
    return <div style={{
      padding: 24
    }}>
        <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: 14
      }}>
          {items.map(name => <div key={name} style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: 12,
          borderRadius: 12,
          border: '1px solid rgba(255,255,255,0.10)',
          background: 'rgba(255,255,255,0.03)'
        }}>
              <Icon name={name} fontSize={26} iconColor="var(--gui-primary)" />
              <span style={{
            fontSize: 12,
            opacity: 0.85
          }}>{name}</span>
            </div>)}
        </div>
      </div>;
  }
}`,...(h=(f=a.parameters)==null?void 0:f.docs)==null?void 0:h.source}}};var v,x,S;s.parameters={...s.parameters,docs:{...(v=s.parameters)==null?void 0:v.docs,source:{originalSource:`{
  args: {
    name: "",
    iconColor: "#2d58a3"
  },
  parameters: {
    docs: {
      description: {
        story: 'Compare **fill=0** (outlined) vs **fill=1** (filled) using the same glyph.'
      }
    }
  },
  render: () => <div style={{
    padding: 24,
    display: 'flex',
    gap: 28,
    alignItems: 'center'
  }}>
      <div style={{
      display: 'flex',
      gap: 10,
      alignItems: 'center'
    }}>
        <Icon name="palette" fill={0} weight={500} fontSize={34} iconColor="var(--gui-primary)" />
        <span style={{
        fontSize: 12,
        opacity: 0.85
      }}>fill=0</span>
      </div>
      <div style={{
      display: 'flex',
      gap: 10,
      alignItems: 'center'
    }}>
        <Icon name="palette" fill={1} weight={500} fontSize={34} iconColor="var(--gui-primary)" />
        <span style={{
        fontSize: 12,
        opacity: 0.85
      }}>fill=1</span>
      </div>
    </div>
}`,...(S=(x=s.parameters)==null?void 0:x.docs)==null?void 0:S.source}}};var I,z,w;l.parameters={...l.parameters,docs:{...(I=l.parameters)==null?void 0:I.docs,source:{originalSource:`{
  parameters: {
    docs: {
      description: {
        story: 'Preview different **wght** values for the same glyph.'
      }
    }
  },
  render: () => {
    const weights = [100, 200, 300, 400, 500, 600, 700];
    return <div style={{
      padding: 24,
      display: 'flex',
      flexWrap: 'wrap',
      gap: 16,
      alignItems: 'center'
    }}>
        {weights.map(w => <div key={w} style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10
      }}>
            <Icon name="settings" weight={w} fill={0} fontSize={30} iconColor="var(--gui-secondary)" />
            <span style={{
          fontSize: 12,
          opacity: 0.85
        }}>wght={w}</span>
          </div>)}
      </div>;
  }
}`,...(w=(z=l.parameters)==null?void 0:z.docs)==null?void 0:w.source}}};export{t as AllRegistries,a as CommonIcons,s as FilledVsOutlined,r as Playground,l as WeightRamp,R as __namedExportsOrder,F as default};
