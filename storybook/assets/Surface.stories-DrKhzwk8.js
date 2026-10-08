import{j as e,b as a,T as p}from"./iframe-q72FflWy.js";import"./Paper-9gdP3SeZ.js";import{S as r}from"./Surface-D0uKYKJN.js";import"./Dialog-o0j-FRf2.js";import"./Hero-BdzYVYxS.js";import"./Modal-XMQC5YcF.js";import"./SearchField-Dr-GPthT.js";import"./List-BSzaOevu.js";import"./ListItem-XTYGYKJx.js";import"./ListItemButton-kBcRpM-O.js";import"./ListItemIcon-lKzEdP8D.js";import"./ListItemText-BjbJ233h.js";import"./Drawer-DMbbDWRX.js";import"./Menu-103suS3X.js";import"./MenuItem-COpnAg9l.js";import{S as c}from"./Stack-DHvmwf16.js";import"./Gauge-DyVYa28g.js";import"./preload-helper-Dp1pzeXC.js";import"./Paper-C4cHEfmg.js";import"./IconButton-D9uKbFdE.js";import"./IconButton-0qTeMK6V.js";import"./ButtonBase-D2HnvhjV.js";import"./TransitionGroupContext-4zVEsxkP.js";import"./useForkRef-BR9zNRBO.js";import"./useEventCallback-BVb6jHPB.js";import"./CircularProgress-BunsQ8Ul.js";import"./Button-DuvGvkXy.js";import"./Icon-Doq3uhPc.js";import"./Button-BpF6GA05.js";import"./Progress-CA1Hm4aa.js";import"./Toolbar-s_6dNoIJ.js";import"./Avatar-iGO_2OcD.js";import"./Avatar-kFT77iM6.js";import"./createSvgIcon-DOR6FtI1.js";import"./useSlot-B3Bhjpe0.js";import"./resolveComponentProps-zf7BDQ8X.js";import"./TextField-BSNRPa5x.js";import"./useFormControl-BGm5bEiu.js";import"./isHostComponent-DVu5iVWx.js";import"./Menu-DFKCKfQm.js";import"./useSlotProps-DMFXOslT.js";import"./Grow-C-rRNj8l.js";import"./mergeSlotProps-BtuGLXbb.js";import"./List-DvvFCGIp.js";import"./useControlled-DIH1o2g4.js";import"./isMuiElement-CKqkPfIO.js";import"./listItemIconClasses-C8gmQhu6.js";import"./listItemTextClasses-_6ucLlDF.js";import"./dividerClasses-BXru1jN1.js";import"./MenuItem-D5DHuw3h.js";import"./getThemeProps-BMrl9x_3.js";const se={title:"Atoms/Surface",component:r,tags:["autodocs"],parameters:{layout:"centered",decorators:[o=>e.jsx(p,{children:e.jsx(o,{})})],docs:{description:{component:`
The **Surface** atom is a fundamental container component, acting as a wrapper around MUI's \`Paper\`. It serves as the base "canvas" upon which other components and content are placed.
---
## Features
- Provides physical properties like elevation (shadow).
- Supports custom variants like \`glass\` for a blurred, semi-transparent effect, and \`outline\`.
- Can be configured to have square or rounded corners.
- Fully themeable and stylable via the \`sx\` prop.

---
## Key Props
- \`variant?: 'default' | 'glass' | 'outline'\`: The semantic preset for the surface style.
- \`elevation?: number\`: The shadow depth, from 0 to 24.
- \`square?: boolean\`: If \`true\`, the surface will have square corners.
- \`children\`: The content to be rendered inside the surface.
- \`sx?: object\`: For applying custom styles.

---
## Basic usage (React)
~~~tsx
import { Surface, Typography } from '@/gui/atoms';

<Surface elevation={3} sx={{ padding: 4, width: 300 }}>
  <Typography>This is a surface.</Typography>
</Surface>
~~~

---
## Declarative JSON / Config usage
The resolver can instantiate a Surface from a JSON spec, making it a core layout primitive.

~~~json
{
  "type": "Surface",
  "props": {
    "elevation": 1,
    "sx": { "padding": 2 },
    "children": {
      "type": "Typography",
      "props": {
        "children": "Content inside a resolved surface."
      }
    }
  }
}
~~~
`}}},argTypes:{variant:{control:{type:"select"},options:["default","glass","outline"],description:"The semantic style variant of the surface."},elevation:{control:{type:"range",min:0,max:24,step:1}},square:{control:{type:"boolean"}},color:{table:{disable:!0}}}},t={render:o=>e.jsxs(c,{spacing:4,sx:{padding:4,width:"50vw",minWidth:400,alignItems:"stretch"},children:[e.jsx(r,{variant:"default",elevation:2,sx:{p:2},children:e.jsx(a,{children:"Default Surface (elevation=2)"})}),e.jsx(r,{variant:"outline",elevation:3,sx:{p:2},children:e.jsx(a,{children:"Outline Variant (elevation=3)"})}),e.jsx(r,{variant:"glass",elevation:5,sx:{p:2,backgroundImage:"url(https://source.unsplash.com/random/400x200)",backgroundSize:"cover",backgroundPosition:"center"},children:e.jsx(a,{children:"Glass Variant (elevation=5)"})}),e.jsx(r,{variant:"default",elevation:8,sx:{p:2},children:e.jsx(a,{children:"Solid Variant (elevation=8)"})})]}),args:{}},pe=["Variants"];var n,i,s;t.parameters={...t.parameters,docs:{...(n=t.parameters)==null?void 0:n.docs,source:{originalSource:`{
  render: args => <Stack spacing={4} sx={{
    padding: 4,
    width: '50vw',
    minWidth: 400,
    alignItems: 'stretch'
  }}>
      <Surface variant="default" elevation={2} sx={{
      p: 2
    }}>
        <Typography>Default Surface (elevation=2)</Typography>
      </Surface>

      <Surface variant="outline" elevation={3} sx={{
      p: 2
    }}>
        <Typography>Outline Variant (elevation=3)</Typography>
      </Surface>

      <Surface variant="glass" elevation={5} sx={{
      p: 2,
      // Add a background for the glass effect to be visible in Storybook
      backgroundImage: 'url(https://source.unsplash.com/random/400x200)',
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    }}>
        <Typography>Glass Variant (elevation=5)</Typography>
      </Surface>

      <Surface variant="default" elevation={8} sx={{
      p: 2
    }}>
        <Typography>Solid Variant (elevation=8)</Typography>
      </Surface>
    </Stack>,
  args: {
    // Default args can be set here if needed
  }
}`,...(s=(i=t.parameters)==null?void 0:i.docs)==null?void 0:s.source}}};export{t as Variants,pe as __namedExportsOrder,se as default};
