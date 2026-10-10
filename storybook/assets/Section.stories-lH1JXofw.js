import{j as t,b as o,B as e}from"./iframe-q72FflWy.js";import"./Paper-9gdP3SeZ.js";import{S as r}from"./Section-CAdMlm0g.js";import"./preload-helper-Dp1pzeXC.js";import"./Paper-C4cHEfmg.js";import"./useInsets-BdHRW95k.js";import"./LeftSidebarContext-DOlSL4Mw.js";const f={title:"Atoms/Section",component:r,tags:["autodocs"],decorators:[n=>t.jsx("div",{style:{padding:0,minHeight:400},children:t.jsx(n,{})})],parameters:{docs:{description:{component:`
The **Section** atom is a responsive container designed to create consistent layout sections that respect This.GUI’s **layout insets** and **theme palette**.

It supports theming via the \`section\` palette keys (\`default\`, \`subtle\`, \`strong\`) and allows custom background colors for flexibility.

---
## Features
- Reacts to global layout insets for responsive spacing.
- Provides unified paddings with theme scaling.
- Accepts **custom backgroundColor**, or one from \`theme.palette.section\`.
- Supports responsive padding, height, and alignment.
- Can wrap any children content.

---
## Margin Props
Section supports **margin props** for controlling the outer spacing around the section:

- \`marginTop\`
- \`marginBottom\`
- \`marginLeft\`
- \`marginRight\`

Each of these can be a \`number\`, \`string\`, or a **breakpoint object** (e.g. \`{ xs: 2, sm: 4, md: 6 }\`) for responsive margins.

If not provided, Section will use the layout insets as fallback margins to ensure consistent spacing with the overall layout.

---
## Key Props
- \`colorVariant?: 'default' | 'subtle' | 'strong'\` — Selects section background color from theme.
- \`bgcolor?: string\` — Overrides the background with a custom color.
- \`padding?: number | string | object\` — Adjusts inner spacing responsively.
- \`height?: number | string\` — Sets the vertical height.
- \`sx?: object\` — MUI system style overrides.
- \`marginTop?: number | string | object\`
- \`marginBottom?: number | string | object\`
- \`marginLeft?: number | string | object\`
- \`marginRight?: number | string | object\`

---
## Basic usage (React)
~~~tsx
import { Section, Typography } from '@/gui/atoms';

<Section colorVariant="default" padding={4}>
  <Typography variant="h4">Welcome</Typography>
  <Typography>Section content goes here.</Typography>
</Section>

// Example with margin props
<Section colorVariant="subtle" padding={4} marginTop={2} marginBottom={3}>
  <Typography variant="h5">Section with Margins</Typography>
  <Typography>Section content with custom top and bottom margins.</Typography>
</Section>
~~~

---
## Declarative JSON / Config usage
~~~json
{
  "type": "Section",
  "props": {
    "colorVariant": "subtle",
    "padding": 4,
    "marginTop": 2,
    "marginBottom": 3,
    "children": [
      { "type": "Typography", "props": { "variant": "h5", "children": "Hello world" } },
      { "type": "Typography", "props": { "children": "This is a declarative section example." } }
    ]
  }
}
~~~
        `}}},argTypes:{colorVariant:{control:{type:"select"},options:["default","subtle","strong"],description:"Predefined section variant based on theme.palette.section"},bgcolor:{control:"color",description:"Custom background color override"},padding:{control:{type:"number"},description:"Internal padding"},height:{control:{type:"text"},description:"Height (px, %, vh, etc.)"}},args:{colorVariant:"default",padding:4,height:"auto"}},i={render:n=>t.jsxs(r,{...n,children:[t.jsx(o,{variant:"h5",sx:{mb:1},children:"Playground Section"}),t.jsx(o,{variant:"body2",children:"Easily tweak padding, background, and height."})]})},s={render:n=>t.jsxs(e,{sx:{display:"flex",flexDirection:"column",gap:4},children:[t.jsxs(e,{children:[t.jsx(o,{variant:"h6",gutterBottom:!0,children:"Color Variants"}),t.jsx(e,{sx:{display:"grid",gap:2},children:["default","subtle","strong"].map(a=>t.jsxs(r,{...n,colorVariant:a,padding:3,children:[t.jsx(o,{variant:"subtitle1",children:a}),t.jsxs(o,{variant:"body2",children:["theme.palette.section.",a]})]},a))})]}),t.jsxs(e,{children:[t.jsx(o,{variant:"h6",gutterBottom:!0,children:"Custom Background"}),t.jsxs(r,{...n,bgcolor:"#2fb0a3ff",padding:4,children:[t.jsx(o,{variant:"subtitle1",children:"Custom bgcolor"}),t.jsx(o,{variant:"body2",children:"Manual background override"})]})]}),t.jsxs(e,{children:[t.jsx(o,{variant:"h6",gutterBottom:!0,children:"Responsive"}),t.jsxs(r,{...n,padding:{xs:2,sm:4,md:6},marginTop:{xs:1,sm:2,md:4},marginBottom:{xs:1,sm:3,md:5},children:[t.jsx(o,{variant:"subtitle1",children:"Responsive spacing"}),t.jsx(o,{variant:"body2",children:"Resize viewport to test"})]})]})]})},j=["Playground","Variants"];var p,c,g;i.parameters={...i.parameters,docs:{...(p=i.parameters)==null?void 0:p.docs,source:{originalSource:`{
  render: args => <Section {...args}>
      <Typography variant="h5" sx={{
      mb: 1
    }}>Playground Section</Typography>
      <Typography variant="body2">Easily tweak padding, background, and height.</Typography>
    </Section>
}`,...(g=(c=i.parameters)==null?void 0:c.docs)==null?void 0:g.source}}};var d,l,h;s.parameters={...s.parameters,docs:{...(d=s.parameters)==null?void 0:d.docs,source:{originalSource:`{
  render: args => <Box sx={{
    display: 'flex',
    flexDirection: 'column',
    gap: 4
  }}>
      <Box>
        <Typography variant="h6" gutterBottom>Color Variants</Typography>
        <Box sx={{
        display: 'grid',
        gap: 2
      }}>
          {(['default', 'subtle', 'strong'] as const).map(variant => <Section key={variant} {...args} colorVariant={variant} padding={3}>
              <Typography variant="subtitle1">{variant}</Typography>
              <Typography variant="body2">
                theme.palette.section.{variant}
              </Typography>
            </Section>)}
        </Box>
      </Box>

      <Box>
        <Typography variant="h6" gutterBottom>Custom Background</Typography>
        <Section {...args} bgcolor="#2fb0a3ff" padding={4}>
          <Typography variant="subtitle1">Custom bgcolor</Typography>
          <Typography variant="body2">Manual background override</Typography>
        </Section>
      </Box>

      <Box>
        <Typography variant="h6" gutterBottom>Responsive</Typography>
        <Section {...args} padding={{
        xs: 2,
        sm: 4,
        md: 6
      }} marginTop={{
        xs: 1,
        sm: 2,
        md: 4
      }} marginBottom={{
        xs: 1,
        sm: 3,
        md: 5
      }}>
          <Typography variant="subtitle1">Responsive spacing</Typography>
          <Typography variant="body2">Resize viewport to test</Typography>
        </Section>
      </Box>
    </Box>
}`,...(h=(l=s.parameters)==null?void 0:l.docs)==null?void 0:h.source}}};export{i as Playground,s as Variants,j as __namedExportsOrder,f as default};
