import{B as r,j as o,b as e,L as a}from"./iframe-q72FflWy.js";import"./Paper-9gdP3SeZ.js";import"./Dialog-o0j-FRf2.js";import"./Hero-BdzYVYxS.js";import"./Modal-XMQC5YcF.js";import"./SearchField-Dr-GPthT.js";import"./List-BSzaOevu.js";import"./ListItem-XTYGYKJx.js";import"./ListItemButton-kBcRpM-O.js";import"./ListItemIcon-lKzEdP8D.js";import"./ListItemText-BjbJ233h.js";import"./Drawer-DMbbDWRX.js";import"./Menu-103suS3X.js";import"./MenuItem-COpnAg9l.js";import{S as d}from"./Stack-DHvmwf16.js";import"./Gauge-DyVYa28g.js";import"./preload-helper-Dp1pzeXC.js";import"./Paper-C4cHEfmg.js";import"./IconButton-D9uKbFdE.js";import"./IconButton-0qTeMK6V.js";import"./ButtonBase-D2HnvhjV.js";import"./TransitionGroupContext-4zVEsxkP.js";import"./useForkRef-BR9zNRBO.js";import"./useEventCallback-BVb6jHPB.js";import"./CircularProgress-BunsQ8Ul.js";import"./Button-DuvGvkXy.js";import"./Icon-Doq3uhPc.js";import"./Button-BpF6GA05.js";import"./Progress-CA1Hm4aa.js";import"./Toolbar-s_6dNoIJ.js";import"./Avatar-iGO_2OcD.js";import"./Avatar-kFT77iM6.js";import"./createSvgIcon-DOR6FtI1.js";import"./useSlot-B3Bhjpe0.js";import"./resolveComponentProps-zf7BDQ8X.js";import"./TextField-BSNRPa5x.js";import"./useFormControl-BGm5bEiu.js";import"./isHostComponent-DVu5iVWx.js";import"./Menu-DFKCKfQm.js";import"./useSlotProps-DMFXOslT.js";import"./Grow-C-rRNj8l.js";import"./mergeSlotProps-BtuGLXbb.js";import"./List-DvvFCGIp.js";import"./useControlled-DIH1o2g4.js";import"./isMuiElement-CKqkPfIO.js";import"./listItemIconClasses-C8gmQhu6.js";import"./listItemTextClasses-_6ucLlDF.js";import"./dividerClasses-BXru1jN1.js";import"./MenuItem-D5DHuw3h.js";import"./getThemeProps-BMrl9x_3.js";const so={title:"Atoms/Box",component:r,tags:["autodocs"],decorators:[p=>o.jsx("div",{style:{padding:16,minHeight:240,width:"100%"},children:o.jsx(p,{})})],parameters:{docs:{description:{component:'\n**Box** is a thin wrapper around MUI\'s `Box` that preserves **polymorphism** and integrates with **This.GUI** theming.\nUse it as your default layout primitive: spacing, flex/grid, backgrounds, borders, etc.\n\n---\n## Features\n- **Polymorphic**: `component` (or `as`) can be an element tag (e.g. `\'section\'`, `\'img\'`, `\'a\'`) or a component (e.g. This.GUI `Link`).\n- **Routing-friendly**: when using `component={Link}` you can pass `to`; anchors use `href`.\n- **System props** & **sx**: use MUI system (p, m, display, gap, flex, grid, etc.) and the `sx` prop for deep styling.\n- **Image mode**: if `component="img"`, you can pass `src`, `alt`, `width`, `height`, `loading`, `decoding`, `referrerPolicy`, `sizes`, `srcSet`.\n\n---\n## Key Props\n- `component?: ElementType | string` / `as?: ElementType | string`\n- `to?: string` (when `component={Link}`)\n- `href?: string` (when `component="a"`)\n- `sx?: SxProps` + all MUI system props (e.g. `p`, `m`, `display`, `gap`)\n- **Image-only extras** (when `component="img"`): `src`, `alt`, `width`, `height`, `loading`, `decoding`, `referrerPolicy`, `sizes`, `srcSet`.\n\n> We don\'t expose `component`, `to`, `href` as Storybook controls—see the dedicated stories below.\n\n---\n## Basic usage\n~~~jsx\nimport { Box } from \'@/gui/atoms\';\n\n<Box p={2} sx={{ border: \'1px solid\', borderColor: \'divider\', borderRadius: 1 }}>\n  Content\n</Box>\n~~~\n\n## Polymorphic (as a section)\n~~~jsx\n<Box component="section" p={2}>Section content</Box>\n~~~\n\n## Router link target\n~~~jsx\nimport { Box, Link } from \'@/gui/atoms\';\n\n<Box component={Link} to="/docs" p={1} sx={{ display: \'inline-block\' }}>\n  Go to docs\n</Box>\n~~~\n\n## Image mode\n~~~jsx\n<Box component="img" src="/logo.png" alt="Logo" sx={{ width: 120, height: \'auto\' }} />\n~~~\n\n## Declarative JSON / Config usage\n~~~json\n{\n  "type": "Box",\n  "props": {\n    "component": "section",\n    "p": 2,\n    "sx": { "border": "1px solid", "borderColor": "divider", "borderRadius": 8 },\n    "children": "Section content"\n  }\n}\n~~~\n        '}},controls:{exclude:["component","as","to","href","sx"]}},argTypes:{p:{control:{type:"number"},description:"Padding (system prop)"},m:{control:{type:"number"},description:"Margin (system prop)"},display:{control:{type:"select"},options:["block","inline-block","flex","grid","inline-flex","inline","none"]},gap:{control:{type:"number"}}},args:{}},i={render:()=>o.jsxs(d,{spacing:4,sx:{width:"100%"},children:[o.jsx(e,{variant:"h6",children:"Basic Box"}),o.jsx(r,{p:2,sx:{border:"1px solid",borderColor:"divider",borderRadius:1},children:"A simple box with padding and a border."}),o.jsx(e,{variant:"h6",children:"Flex Layout"}),o.jsxs(r,{display:"flex",gap:2,children:[o.jsx(r,{p:2,sx:{border:"1px dashed",borderColor:"divider"},children:"Flex Item 1"}),o.jsx(r,{p:2,sx:{border:"1px dashed",borderColor:"divider"},children:"Flex Item 2"}),o.jsx(r,{p:2,sx:{border:"1px dashed",borderColor:"divider"},children:"Flex Item 3"})]}),o.jsx(e,{variant:"h6",children:"Polymorphic (as a section)"}),o.jsxs(r,{component:"section",p:2,sx:{borderLeft:"4px solid",borderColor:"primary.main",bgcolor:"action.hover"},children:[o.jsx(e,{variant:"h6",gutterBottom:!0,children:"Section Title"}),o.jsx(e,{children:"This is a Box rendered as a <section> element."})]}),o.jsx(e,{variant:"h6",children:"Polymorphic (as a link)"}),o.jsx(r,{component:a,to:"/docs",p:1,sx:{display:"inline-block",border:"1px solid",borderColor:"divider",borderRadius:1,"&:hover":{textDecoration:"none",bgcolor:"action.hover"}},children:"Go to docs"}),o.jsx(e,{variant:"h6",children:"Image Mode"}),o.jsx(r,{component:"img",src:"https://placekitten.com/320/160",alt:"Kitten",sx:{width:320,height:"auto",borderRadius:1,border:"1px solid",borderColor:"divider"},loading:"lazy"})]})},po=["Variants"];var t,n,s;i.parameters={...i.parameters,docs:{...(t=i.parameters)==null?void 0:t.docs,source:{originalSource:`{
  render: () => <Stack spacing={4} sx={{
    width: '100%'
  }}>
      <Typography variant="h6">Basic Box</Typography>
      <Box p={2} sx={{
      border: '1px solid',
      borderColor: 'divider',
      borderRadius: 1
    }}>
        A simple box with padding and a border.
      </Box>

      <Typography variant="h6">Flex Layout</Typography>
      <Box display="flex" gap={2}>
        <Box p={2} sx={{
        border: '1px dashed',
        borderColor: 'divider'
      }}>Flex Item 1</Box>
        <Box p={2} sx={{
        border: '1px dashed',
        borderColor: 'divider'
      }}>Flex Item 2</Box>
        <Box p={2} sx={{
        border: '1px dashed',
        borderColor: 'divider'
      }}>Flex Item 3</Box>
      </Box>

      <Typography variant="h6">Polymorphic (as a section)</Typography>
      <Box component="section" p={2} sx={{
      borderLeft: '4px solid',
      borderColor: 'primary.main',
      bgcolor: 'action.hover'
    }}>
        <Typography variant="h6" gutterBottom>Section Title</Typography>
        <Typography>This is a Box rendered as a &lt;section&gt; element.</Typography>
      </Box>

      <Typography variant="h6">Polymorphic (as a link)</Typography>
      <Box component={Link} to="/docs" p={1} sx={{
      display: 'inline-block',
      border: '1px solid',
      borderColor: 'divider',
      borderRadius: 1,
      '&:hover': {
        textDecoration: 'none',
        bgcolor: 'action.hover'
      }
    }}>
        Go to docs
      </Box>

      <Typography variant="h6">Image Mode</Typography>
      <Box component="img" src="https://placekitten.com/320/160" alt="Kitten" sx={{
      width: 320,
      height: 'auto',
      borderRadius: 1,
      border: '1px solid',
      borderColor: 'divider'
    }} loading="lazy" />
    </Stack>
}`,...(s=(n=i.parameters)==null?void 0:n.docs)==null?void 0:s.source}}};export{i as Variants,po as __namedExportsOrder,so as default};
