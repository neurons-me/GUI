import{j as r,b as o}from"./iframe-q72FflWy.js";import{A as t}from"./AppBar-Cw3w4B11.js";import{B as i}from"./Button-DuvGvkXy.js";import"./Paper-9gdP3SeZ.js";import"./Dialog-o0j-FRf2.js";import"./Hero-BdzYVYxS.js";import"./Modal-XMQC5YcF.js";import{T as a}from"./SearchField-Dr-GPthT.js";import"./List-BSzaOevu.js";import"./ListItem-XTYGYKJx.js";import"./ListItemButton-kBcRpM-O.js";import"./ListItemIcon-lKzEdP8D.js";import"./ListItemText-BjbJ233h.js";import"./Drawer-DMbbDWRX.js";import"./Menu-103suS3X.js";import"./MenuItem-COpnAg9l.js";import{S as c}from"./Stack-DHvmwf16.js";import"./Gauge-DyVYa28g.js";import"./preload-helper-Dp1pzeXC.js";import"./AppBar-o6rXye4L.js";import"./Paper-C4cHEfmg.js";import"./Icon-Doq3uhPc.js";import"./Button-BpF6GA05.js";import"./ButtonBase-D2HnvhjV.js";import"./TransitionGroupContext-4zVEsxkP.js";import"./useForkRef-BR9zNRBO.js";import"./useEventCallback-BVb6jHPB.js";import"./CircularProgress-BunsQ8Ul.js";import"./IconButton-D9uKbFdE.js";import"./IconButton-0qTeMK6V.js";import"./Progress-CA1Hm4aa.js";import"./Toolbar-s_6dNoIJ.js";import"./Avatar-iGO_2OcD.js";import"./Avatar-kFT77iM6.js";import"./createSvgIcon-DOR6FtI1.js";import"./useSlot-B3Bhjpe0.js";import"./resolveComponentProps-zf7BDQ8X.js";import"./TextField-BSNRPa5x.js";import"./useFormControl-BGm5bEiu.js";import"./isHostComponent-DVu5iVWx.js";import"./Menu-DFKCKfQm.js";import"./useSlotProps-DMFXOslT.js";import"./Grow-C-rRNj8l.js";import"./mergeSlotProps-BtuGLXbb.js";import"./List-DvvFCGIp.js";import"./useControlled-DIH1o2g4.js";import"./isMuiElement-CKqkPfIO.js";import"./listItemIconClasses-C8gmQhu6.js";import"./listItemTextClasses-_6ucLlDF.js";import"./dividerClasses-BXru1jN1.js";import"./MenuItem-D5DHuw3h.js";import"./getThemeProps-BMrl9x_3.js";const lr={title:"Atoms/Bars",component:t,tags:["autodocs"],decorators:[l=>r.jsx("div",{style:{padding:0,width:"100%",minHeight:240},children:r.jsx(l,{})})],parameters:{docs:{description:{component:`
The **Bar** atom is a thin wrapper around MUI's \`Bar\` that keeps the original API while letting you style it with \`sx\` and use it declaratively through the **resolver**.

---
## Features
- Positions: \`fixed\`, \`absolute\`, \`sticky\`, \`static\`, \`relative\`.
- Colors: \`default\`, \`inherit\`, \`primary\`, \`secondary\`, \`transparent\`. Bar **only supports** these colors for the \`color\` prop.
- Note: \`success\`, \`info\`, \`warning\`, and \`error\` are **not supported** by the \`color\` prop. Use \`sx={{ bgcolor: '...' }}\` for these colors.
- Additional theme colors can be applied via \`sx={{ bgcolor: 'success.main' }}\` etc.
- Elevation & dark-mode override with \`enableColorOnDark\`.
- Accepts any children (e.g., \`<Toolbar/>\`, actions, brand, etc.).
- Fully themeable via **This.GUI** tokens and \`sx\`.
- Variant semantic presets: \`mui\` (default) behaves like MUI Bar, \`glass\` for floating blurred panel style.

---
## Key Props
- \`variant?: 'mui' | 'glass'\` — semantic preset.
- \`position?: 'fixed' | 'absolute' | 'sticky' | 'static' | 'relative'\`.
- \`color?: 'default' | 'inherit' | 'primary' | 'secondary' | 'transparent'\` — Bar **only supports** these values.
- \`success\`, \`info\`, \`warning\`, and \`error\` are **not supported** by \`color\`; use \`sx={{ bgcolor: '...' }}\` instead.
- \`elevation?: number\`.
- \`enableColorOnDark?: boolean\`.
- \`sx?: object\` — granular styling via the system.

---
## Basic usage (React)
~~~tsx
import { Bar, Toolbar, Typography, Button, Box } from '@/gui/atoms';

<Bar position="fixed" color="default" sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
  <Toolbar variant="dense">
    <Typography variant="h6" sx={{ flexGrow: 1 }}>My App</Typography>
    <Button variant="text">Login</Button>
  </Toolbar>
</Bar>
~~~

---
## Declarative JSON / Config usage
This GUI's **resolver** lets you describe an app bar via a config object. Example payload for the \`BarResolver\`:

~~~json
{
  "type": "Bar",
  "props": {
    "position": "fixed",
    "color": "default",
    "sx": { "borderBottom": "1px solid", "borderColor": "divider" },
    "children": {
      "type": "Toolbar",
      "props": {
        "variant": "dense",
        "children": [
          { "type": "Typography", "props": { "variant": "h6", "sx": { "flexGrow": 1 }, "children": "My App" } },
          { "type": "Button", "props": { "variant": "text", "children": "Login" } }
        ]
      }
    }
  }
}
~~~

> The resolver maps this spec to real React elements, preserving polymorphism and \`sx\` styling.
        `}}},argTypes:{variant:{control:{type:"select"},options:["mui","glass"],description:"Semantic preset. mui (default): behaves like MUI Bar. glass: floating blurred panel style."},position:{control:{type:"select"},options:["fixed","absolute","sticky","static","relative"]},color:{control:{type:"select"},options:["default","inherit","primary","secondary","transparent"]},elevation:{control:{type:"number"}},enableColorOnDark:{control:{type:"boolean"}},component:{table:{disable:!0}}}},e={render:()=>r.jsxs(c,{spacing:2,sx:{width:"100%"},children:[r.jsx(o,{variant:"h6",children:"Default Bar"}),r.jsx(t,{position:"static",color:"default",sx:{borderBottom:"1px solid",borderColor:"divider"},children:r.jsxs(a,{children:[r.jsx(o,{variant:"h6",sx:{flexGrow:1},children:"Default"}),r.jsx(i,{color:"inherit",children:"Action"})]})}),r.jsx(o,{variant:"h6",sx:{mt:2},children:"Primary Color"}),r.jsx(t,{position:"static",color:"primary",children:r.jsxs(a,{children:[r.jsx(o,{variant:"h6",sx:{flexGrow:1},children:"Primary"}),r.jsx(i,{color:"inherit",children:"Action"})]})}),r.jsx(o,{variant:"h6",sx:{mt:2},children:"Glass Variant"}),r.jsx(t,{position:"static",variant:"glass",children:r.jsxs(a,{children:[r.jsx(o,{variant:"h6",sx:{flexGrow:1},children:"Glass"}),r.jsx(i,{color:"inherit",children:"Action"})]})}),r.jsx(o,{variant:"h6",sx:{mt:2},children:"With Elevation"}),r.jsx(t,{position:"static",color:"default",elevation:4,children:r.jsxs(a,{children:[r.jsx(o,{variant:"h6",sx:{flexGrow:1},children:"Elevation"}),r.jsx(i,{color:"inherit",children:"Action"})]})})]})},cr=["Variants"];var n,s,p;e.parameters={...e.parameters,docs:{...(n=e.parameters)==null?void 0:n.docs,source:{originalSource:`{
  render: () => <Stack spacing={2} sx={{
    width: '100%'
  }}>
      <Typography variant="h6">Default Bar</Typography>
      <Bar position="static" color="default" sx={{
      borderBottom: '1px solid',
      borderColor: 'divider'
    }}>
        <Toolbar>
          <Typography variant="h6" sx={{
          flexGrow: 1
        }}>Default</Typography>
          <Button color="inherit">Action</Button>
        </Toolbar>
      </Bar>

      <Typography variant="h6" sx={{
      mt: 2
    }}>Primary Color</Typography>
      <Bar position="static" color="primary">
        <Toolbar>
          <Typography variant="h6" sx={{
          flexGrow: 1
        }}>Primary</Typography>
          <Button color="inherit">Action</Button>
        </Toolbar>
      </Bar>

      <Typography variant="h6" sx={{
      mt: 2
    }}>Glass Variant</Typography>
      <Bar position="static" variant={'glass' as any}>
        <Toolbar>
          <Typography variant="h6" sx={{
          flexGrow: 1
        }}>Glass</Typography>
          <Button color="inherit">Action</Button>
        </Toolbar>
      </Bar>

      <Typography variant="h6" sx={{
      mt: 2
    }}>With Elevation</Typography>
      <Bar position="static" color="default" elevation={4}>
        <Toolbar>
          <Typography variant="h6" sx={{
          flexGrow: 1
        }}>Elevation</Typography>
          <Button color="inherit">Action</Button>
        </Toolbar>
      </Bar>
    </Stack>
}`,...(p=(s=e.parameters)==null?void 0:s.docs)==null?void 0:p.source}}};export{e as Variants,cr as __namedExportsOrder,lr as default};
