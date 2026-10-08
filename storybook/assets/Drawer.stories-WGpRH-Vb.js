import{j as e,b as r,r as i,B as o}from"./iframe-q72FflWy.js";import{B as s}from"./Button-DuvGvkXy.js";import"./Paper-9gdP3SeZ.js";import"./Dialog-o0j-FRf2.js";import"./Hero-BdzYVYxS.js";import"./Modal-XMQC5YcF.js";import"./SearchField-Dr-GPthT.js";import"./List-BSzaOevu.js";import"./ListItem-XTYGYKJx.js";import"./ListItemButton-kBcRpM-O.js";import"./ListItemIcon-lKzEdP8D.js";import"./ListItemText-BjbJ233h.js";import{D as n}from"./Drawer-DMbbDWRX.js";import"./Menu-103suS3X.js";import"./MenuItem-COpnAg9l.js";import{S as x}from"./Stack-DHvmwf16.js";import"./Gauge-DyVYa28g.js";import"./preload-helper-Dp1pzeXC.js";import"./Icon-Doq3uhPc.js";import"./Button-BpF6GA05.js";import"./ButtonBase-D2HnvhjV.js";import"./TransitionGroupContext-4zVEsxkP.js";import"./useForkRef-BR9zNRBO.js";import"./useEventCallback-BVb6jHPB.js";import"./CircularProgress-BunsQ8Ul.js";import"./Paper-C4cHEfmg.js";import"./IconButton-D9uKbFdE.js";import"./IconButton-0qTeMK6V.js";import"./Progress-CA1Hm4aa.js";import"./Toolbar-s_6dNoIJ.js";import"./Avatar-iGO_2OcD.js";import"./Avatar-kFT77iM6.js";import"./createSvgIcon-DOR6FtI1.js";import"./useSlot-B3Bhjpe0.js";import"./resolveComponentProps-zf7BDQ8X.js";import"./TextField-BSNRPa5x.js";import"./useFormControl-BGm5bEiu.js";import"./isHostComponent-DVu5iVWx.js";import"./Menu-DFKCKfQm.js";import"./useSlotProps-DMFXOslT.js";import"./Grow-C-rRNj8l.js";import"./mergeSlotProps-BtuGLXbb.js";import"./List-DvvFCGIp.js";import"./useControlled-DIH1o2g4.js";import"./isMuiElement-CKqkPfIO.js";import"./listItemIconClasses-C8gmQhu6.js";import"./listItemTextClasses-_6ucLlDF.js";import"./dividerClasses-BXru1jN1.js";import"./MenuItem-D5DHuw3h.js";import"./getThemeProps-BMrl9x_3.js";const fe={title:"Molecules/Drawer",component:n,tags:["autodocs"],decorators:[t=>e.jsx("div",{style:{padding:16,minHeight:320},children:e.jsx(t,{})})],parameters:{docs:{description:{component:`
The **Drawer** primitive is a thin wrapper over MUI's \`MuiDrawer\`. It preserves all of MUI's props and behavior, while keeping the import surface stable via \`@/gui/primitives\`.

---
## Features
- Variants: \`temporary\`, \`persistent\`, \`permanent\`.
- Anchors: \`left\`, \`right\`, \`top\`, \`bottom\`.
- Works with This.GUI theme (via the \`Theme\` provider).
- Accepts \`sx\` and \`PaperProps\` for styling the surface.

> Note: For \`temporary\` drawers, you control visibility with the \`open\` prop and \`onClose\`.  
> For \`permanent\` drawers, \`open\` is ignored by MUI; the drawer is always visible.

---
## Basic usage
~~~tsx
import { Drawer } from '@/gui/primitives';

<Drawer anchor="left" variant="temporary" open={open} onClose={() => setOpen(false)}>
  <div style={{ width: 260, padding: 16 }}>Content</div>
</Drawer>
~~~

## Permanent sidebar
~~~tsx
<Drawer anchor="left" variant="permanent" PaperProps={{ sx: { width: 260 } }}>
  <div style={{ width: 260, padding: 16 }}>Navigation</div>
</Drawer>
~~~

## Declarative JSON / Config
~~~json
{
  "type": "Drawer",
  "props": {
    "variant": "temporary",
    "anchor": "right",
    "PaperProps": { "sx": { "width": 300 } },
    "children": "<YourMenu />"
  }
}
~~~

When used via your registry/resolver, the object above is resolved into a live Drawer with the provided props.
        `}}},argTypes:{variant:{control:{type:"radio"},options:["temporary","persistent","permanent"]},anchor:{control:{type:"radio"},options:["left","right","top","bottom"]},open:{control:{type:"boolean"},description:"Only relevant for temporary/persistent variants."},container:{table:{disable:!0}}},args:{variant:"temporary",anchor:"left",open:!1}},a=({label:t="Menu"})=>e.jsxs(o,{sx:{width:260,p:2},children:[e.jsx(r,{variant:"subtitle1",sx:{mb:1.5},children:t}),e.jsxs("ul",{style:{margin:0,paddingLeft:16,lineHeight:1.9},children:[e.jsx("li",{children:e.jsx("a",{href:"#",children:"Item one"})}),e.jsx("li",{children:e.jsx("a",{href:"#",children:"Item two"})}),e.jsx("li",{children:e.jsx("a",{href:"#",children:"Item three"})})]})]}),p={name:"Playground",render:t=>e.jsxs(e.Fragment,{children:[e.jsx(r,{variant:"body1",sx:{mb:1},children:"Use controls to test props. Note: `open` only affects `temporary` or `persistent` variants."}),e.jsx(n,{...t,children:e.jsx(a,{})})]}),args:{children:e.jsx(a,{})}},l={name:"Variants Showcase",render:()=>{const[t,d]=i.useState(!1),[b,m]=i.useState(!1),[j,h]=i.useState(!1),[D,c]=i.useState(!1);return e.jsxs(x,{spacing:4,sx:{width:"100%"},children:[e.jsx(r,{variant:"h6",children:"Temporary Drawers"}),e.jsxs(x,{direction:"row",spacing:2,sx:{flexWrap:"wrap"},children:[e.jsx(s,{variant:"contained",color:"primary",onClick:()=>d(!0),children:"Open Left"}),e.jsx(s,{variant:"outlined",onClick:()=>m(!0),children:"Open Right"}),e.jsx(s,{variant:"outlined",onClick:()=>h(!0),children:"Open top"}),e.jsx(s,{variant:"outlined",onClick:()=>c(!0),children:"Open bottom"})]}),e.jsx(r,{variant:"h6",children:"Permanent Drawer"}),e.jsxs(o,{sx:{display:"flex",height:240,border:"1px solid",borderColor:"divider",borderRadius:1,overflow:"hidden"},children:[e.jsx(n,{anchor:"left",variant:"permanent",PaperProps:{sx:{width:240,position:"relative",borderRight:"1px solid",borderColor:"divider"}},children:e.jsx(a,{label:"Permanent"})}),e.jsxs(o,{sx:{flex:1,p:2},children:[e.jsx(r,{variant:"h6",sx:{mb:1},children:"Content Area"}),e.jsx(r,{variant:"body2",children:"A permanent drawer remains visible within its container."})]})]}),e.jsx(n,{anchor:"left",variant:"temporary",open:t,onClose:()=>d(!1),ModalProps:{keepMounted:!0},children:e.jsx(a,{label:"Left Drawer"})}),e.jsx(n,{anchor:"right",variant:"temporary",open:b,onClose:()=>m(!1),PaperProps:{sx:{width:300}},children:e.jsx(a,{label:"Right Drawer"})}),e.jsx(n,{anchor:"top",variant:"temporary",open:j,onClose:()=>h(!1),PaperProps:{sx:{height:"auto"}},children:e.jsx(o,{sx:{p:2},children:e.jsx(r,{variant:"subtitle1",children:"Top drawer"})})}),e.jsx(n,{anchor:"bottom",variant:"temporary",open:D,onClose:()=>c(!1),PaperProps:{sx:{height:"auto"}},children:e.jsx(o,{sx:{p:2},children:e.jsx(r,{variant:"subtitle1",children:"Bottom drawer"})})})]})}},be=["Playground","Variants"];var y,u,v;p.parameters={...p.parameters,docs:{...(y=p.parameters)==null?void 0:y.docs,source:{originalSource:`{
  name: 'Playground',
  render: args => <>
      <Typography variant="body1" sx={{
      mb: 1
    }}>
        Use controls to test props. Note: \`open\` only affects \`temporary\` or \`persistent\` variants.
      </Typography>
      <Drawer {...args}>
        <DemoList />
      </Drawer>
    </>,
  args: {
    children: <DemoList />
  }
}`,...(v=(u=p.parameters)==null?void 0:u.docs)==null?void 0:v.source}}};var g,w,f;l.parameters={...l.parameters,docs:{...(g=l.parameters)==null?void 0:g.docs,source:{originalSource:`{
  name: 'Variants Showcase',
  render: () => {
    const [openLeft, setOpenLeft] = React.useState(false);
    const [openRight, setOpenRight] = React.useState(false);
    const [openTop, setOpenTop] = React.useState(false);
    const [openBottom, setOpenBottom] = React.useState(false);
    return <Stack spacing={4} sx={{
      width: '100%'
    }}>
        <Typography variant="h6">Temporary Drawers</Typography>
        <Stack direction="row" spacing={2} sx={{
        flexWrap: 'wrap'
      }}>
          <Button variant="contained" color="primary" onClick={() => setOpenLeft(true)}>
            Open Left
          </Button>
          <Button variant="outlined" onClick={() => setOpenRight(true)}>
            Open Right
          </Button>
          <Button variant="outlined" onClick={() => setOpenTop(true)}>Open top</Button>
          <Button variant="outlined" onClick={() => setOpenBottom(true)}>Open bottom</Button>
        </Stack>

        <Typography variant="h6">Permanent Drawer</Typography>
        <Box sx={{
        display: 'flex',
        height: 240,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        overflow: 'hidden'
      }}>
          <Drawer anchor="left" variant="permanent" PaperProps={{
          sx: {
            width: 240,
            position: 'relative',
            borderRight: '1px solid',
            borderColor: 'divider'
          }
        }}>
            <DemoList label="Permanent" />
          </Drawer>
          <Box sx={{
          flex: 1,
          p: 2
        }}>
            <Typography variant="h6" sx={{
            mb: 1
          }}>Content Area</Typography>
            <Typography variant="body2">
              A permanent drawer remains visible within its container.
            </Typography>
          </Box>
        </Box>

        {/* Drawer instances for temporary examples */}
        <Drawer anchor="left" variant="temporary" open={openLeft} onClose={() => setOpenLeft(false)} ModalProps={{
        keepMounted: true
      }}>
          <DemoList label="Left Drawer" />
        </Drawer>
        <Drawer anchor="right" variant="temporary" open={openRight} onClose={() => setOpenRight(false)} PaperProps={{
        sx: {
          width: 300
        }
      }}>
          <DemoList label="Right Drawer" />
        </Drawer>
        <Drawer anchor="top" variant="temporary" open={openTop} onClose={() => setOpenTop(false)} PaperProps={{
        sx: {
          height: 'auto'
        }
      }}>
          <Box sx={{
          p: 2
        }}>
            <Typography variant="subtitle1">Top drawer</Typography>
          </Box>
        </Drawer>
        <Drawer anchor="bottom" variant="temporary" open={openBottom} onClose={() => setOpenBottom(false)} PaperProps={{
        sx: {
          height: 'auto'
        }
      }}>
          <Box sx={{
          p: 2
        }}>
            <Typography variant="subtitle1">Bottom drawer</Typography>
          </Box>
        </Drawer>
      </Stack>;
  }
}`,...(f=(w=l.parameters)==null?void 0:w.docs)==null?void 0:f.source}}};export{p as Playground,l as Variants,be as __namedExportsOrder,fe as default};
