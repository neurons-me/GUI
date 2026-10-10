import{b as n,j as r,L as d}from"./iframe-q72FflWy.js";import"./preload-helper-Dp1pzeXC.js";const c={title:"Atoms/Typography",component:n,tags:["autodocs"],decorators:[s=>r.jsx("div",{style:{padding:24},children:r.jsx(s,{})})],parameters:{docs:{description:{component:`
**Typography** is a thin, polymorphic wrapper around MUI's Typography that keeps the full API
while exposing it through This.GUI. Import it from **@/gui/primitives** instead of @mui/material so
you can swap render engines in the future without breaking consumers.

### Key points
- Preserves MUI's polymorphism (\`component\`, \`as\`, \`variantMapping\`).
- Works with routers and anchors: \`component={Link}\` + \`to\`, or \`component="a"\` + \`href\`.
- Styled by your This.GUI theme (typography, palette, spacing).

### Common variants
MUI variants like \`h1..h6\`, \`subtitle1/2\`, \`body1/2\`, \`caption\`, \`overline\` are supported.

### Declarative JSON example
You can describe text nodes in JSON and hydrate them in a renderer:

~~~json
{
  "type": "Typography",
  "props": {
    "variant": "h4",
    "component": "h2",
    "gutterBottom": true
  },
  "children": "Section Title"
}
~~~

A naive hydration would look like:

~~~tsx
const spec = {
  type: 'Typography',
  props: { variant: 'h4', component: 'h2', gutterBottom: true },
  children: 'Section Title'
};

<Typography {...spec.props}>{spec.children}</Typography>
~~~
        `}},controls:{exclude:["component","to","href","variantMapping","ref"]}}},a={args:{variant:"body1",children:"Hello from Typography"}},e={render:()=>r.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:32},children:[r.jsxs("div",{children:[r.jsx(n,{variant:"h6",gutterBottom:!0,children:"Variants"}),r.jsxs("div",{style:{display:"grid",gap:8},children:[r.jsx(n,{variant:"h1",children:"h1. Heading"}),r.jsx(n,{variant:"h2",children:"h2. Heading"}),r.jsx(n,{variant:"h3",children:"h3. Heading"}),r.jsx(n,{variant:"h4",children:"h4. Heading"}),r.jsx(n,{variant:"h5",children:"h5. Heading"}),r.jsx(n,{variant:"h6",children:"h6. Heading"}),r.jsx(n,{variant:"subtitle1",children:"subtitle1"}),r.jsx(n,{variant:"subtitle2",children:"subtitle2"}),r.jsx(n,{variant:"body1",children:"body1"}),r.jsx(n,{variant:"body2",children:"body2"}),r.jsx(n,{variant:"caption",children:"caption"}),r.jsx(n,{variant:"overline",children:"overline"})]})]}),r.jsxs("div",{children:[r.jsx(n,{variant:"h6",gutterBottom:!0,children:"Alignment"}),r.jsxs("div",{style:{display:"grid",gap:8},children:[r.jsx(n,{align:"left",children:"Left aligned"}),r.jsx(n,{align:"center",children:"Center aligned"}),r.jsx(n,{align:"right",children:"Right aligned"})]})]}),r.jsxs("div",{children:[r.jsx(n,{variant:"h6",gutterBottom:!0,children:"Colors"}),r.jsxs("div",{style:{display:"grid",gap:8},children:[r.jsx(n,{color:"text.primary",children:"text.primary"}),r.jsx(n,{color:"text.secondary",children:"text.secondary"}),r.jsx(n,{color:"primary",children:"primary"}),r.jsx(n,{color:"#00aa96",children:"#00aa96 (custom)"})]})]}),r.jsxs("div",{children:[r.jsx(n,{variant:"h6",gutterBottom:!0,children:"Usage"}),r.jsxs("div",{style:{display:"grid",gap:12},children:[r.jsx(n,{variant:"h4",component:"h2",gutterBottom:!0,children:"Section title (rendered as h2)"}),r.jsx(n,{variant:"body1",children:"Body text below the title. The gutterBottom adds spacing."}),r.jsx(n,{component:d,to:"/docs",underline:"none",children:"Router link"}),r.jsx(n,{component:"a",href:"https://neurons.me",target:"_blank",rel:"noopener noreferrer",children:"External link"})]})]})]})},v=["Playground","Variants"];var t,o,i;a.parameters={...a.parameters,docs:{...(t=a.parameters)==null?void 0:t.docs,source:{originalSource:`{
  args: {
    variant: 'body1',
    children: 'Hello from Typography'
  }
}`,...(i=(o=a.parameters)==null?void 0:o.docs)==null?void 0:i.source}}};var p,y,h;e.parameters={...e.parameters,docs:{...(p=e.parameters)==null?void 0:p.docs,source:{originalSource:`{
  render: () => <div style={{
    display: 'flex',
    flexDirection: 'column',
    gap: 32
  }}>
      <div>
        <Typography variant="h6" gutterBottom>Variants</Typography>
        <div style={{
        display: 'grid',
        gap: 8
      }}>
          <Typography variant="h1">h1. Heading</Typography>
          <Typography variant="h2">h2. Heading</Typography>
          <Typography variant="h3">h3. Heading</Typography>
          <Typography variant="h4">h4. Heading</Typography>
          <Typography variant="h5">h5. Heading</Typography>
          <Typography variant="h6">h6. Heading</Typography>
          <Typography variant="subtitle1">subtitle1</Typography>
          <Typography variant="subtitle2">subtitle2</Typography>
          <Typography variant="body1">body1</Typography>
          <Typography variant="body2">body2</Typography>
          <Typography variant="caption">caption</Typography>
          <Typography variant="overline">overline</Typography>
        </div>
      </div>

      <div>
        <Typography variant="h6" gutterBottom>Alignment</Typography>
        <div style={{
        display: 'grid',
        gap: 8
      }}>
          <Typography align="left">Left aligned</Typography>
          <Typography align="center">Center aligned</Typography>
          <Typography align="right">Right aligned</Typography>
        </div>
      </div>

      <div>
        <Typography variant="h6" gutterBottom>Colors</Typography>
        <div style={{
        display: 'grid',
        gap: 8
      }}>
          <Typography color="text.primary">text.primary</Typography>
          <Typography color="text.secondary">text.secondary</Typography>
          <Typography color="primary">primary</Typography>
          <Typography color="#00aa96">#00aa96 (custom)</Typography>
        </div>
      </div>

      <div>
        <Typography variant="h6" gutterBottom>Usage</Typography>
        <div style={{
        display: 'grid',
        gap: 12
      }}>
          <Typography variant="h4" component="h2" gutterBottom>
            Section title (rendered as h2)
          </Typography>
          <Typography variant="body1">
            Body text below the title. The gutterBottom adds spacing.
          </Typography>
          <Typography component={Link as any} to="/docs" underline="none">
            Router link
          </Typography>
          <Typography component="a" href="https://neurons.me" target="_blank" rel="noopener noreferrer">
            External link
          </Typography>
        </div>
      </div>
    </div>
}`,...(h=(y=e.parameters)==null?void 0:y.docs)==null?void 0:h.source}}};export{a as Playground,e as Variants,v as __namedExportsOrder,c as default};
