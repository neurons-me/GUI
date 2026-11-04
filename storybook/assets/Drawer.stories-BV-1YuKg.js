import{j as e,a as r,r as i,B as a}from"./iframe-jME6TRyu.js";import{B as s}from"./Button-ffxJjIdt.js";import"./Paper-D0AE__Fu.js";import"./Gauge-D4KJyjrU.js";import"./ListItemIcon-o5ylfJzT.js";import"./ListItemText-CvGTrX3g.js";import{D as o}from"./Drawer-BTZ0yApO.js";import{S as x}from"./Stack-1aseDDAr.js";import"./preload-helper-Dp1pzeXC.js";import"./Icon-BtaMh9kU.js";import"./Button-CLDQrykt.js";import"./ButtonBase-BOSaDjG-.js";import"./TransitionGroupContext-BRZCH32N.js";import"./useForkRef-z1e785Ns.js";import"./CircularProgress-DVHqJ1WQ.js";import"./Paper-Ndu2Ngkb.js";import"./IconButton-DRNOYwhc.js";import"./IconButton-CwIzlmuT.js";import"./Avatar-CMm04gBo.js";import"./Avatar-DUU9vCmx.js";import"./createSvgIcon-jWV4H6K5.js";import"./useSlot-C61ruhcO.js";import"./resolveComponentProps-BQXnF4aQ.js";import"./TextField-BFarGitF.js";import"./useFormControl-D8HjSUmZ.js";import"./isHostComponent-DVu5iVWx.js";import"./Menu-L0v-vIF4.js";import"./useSlotProps-BeRtKzOs.js";import"./Grow-CX1iIK_S.js";import"./mergeSlotProps-Dul5GYdh.js";import"./List-PPc6luvu.js";import"./useControlled-Cu8K_Z2u.js";import"./isMuiElement-DBbgm_fz.js";import"./Progress-C5lx_x92.js";import"./Toolbar-DdnHZP3c.js";import"./listItemIconClasses-Drtk4guX.js";import"./listItemTextClasses-BTSdieEv.js";import"./dividerClasses-C2APwgbx.js";import"./getThemeProps-DE7h1-OS.js";const le={title:"Molecules/Drawer",component:o,tags:["autodocs"],decorators:[t=>e.jsx("div",{style:{padding:16,minHeight:320},children:e.jsx(t,{})})],parameters:{docs:{description:{component:`
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
        `}}},argTypes:{variant:{control:{type:"radio"},options:["temporary","persistent","permanent"]},anchor:{control:{type:"radio"},options:["left","right","top","bottom"]},open:{control:{type:"boolean"},description:"Only relevant for temporary/persistent variants."},container:{table:{disable:!0}}},args:{variant:"temporary",anchor:"left",open:!1}},n=({label:t="Menu"})=>e.jsxs(a,{sx:{width:260,p:2},children:[e.jsx(r,{variant:"subtitle1",sx:{mb:1.5},children:t}),e.jsxs("ul",{style:{margin:0,paddingLeft:16,lineHeight:1.9},children:[e.jsx("li",{children:e.jsx("a",{href:"#",children:"Item one"})}),e.jsx("li",{children:e.jsx("a",{href:"#",children:"Item two"})}),e.jsx("li",{children:e.jsx("a",{href:"#",children:"Item three"})})]})]}),p={name:"Playground",render:t=>e.jsxs(e.Fragment,{children:[e.jsx(r,{variant:"body1",sx:{mb:1},children:"Use controls to test props. Note: `open` only affects `temporary` or `persistent` variants."}),e.jsx(o,{...t,children:e.jsx(n,{})})]}),args:{children:e.jsx(n,{})}},l={name:"Variants Showcase",render:()=>{const[t,d]=i.useState(!1),[b,h]=i.useState(!1),[j,m]=i.useState(!1),[D,c]=i.useState(!1);return e.jsxs(x,{spacing:4,sx:{width:"100%"},children:[e.jsx(r,{variant:"h6",children:"Temporary Drawers"}),e.jsxs(x,{direction:"row",spacing:2,sx:{flexWrap:"wrap"},children:[e.jsx(s,{variant:"contained",color:"primary",onClick:()=>d(!0),children:"Open Left"}),e.jsx(s,{variant:"outlined",onClick:()=>h(!0),children:"Open Right"}),e.jsx(s,{variant:"outlined",onClick:()=>m(!0),children:"Open top"}),e.jsx(s,{variant:"outlined",onClick:()=>c(!0),children:"Open bottom"})]}),e.jsx(r,{variant:"h6",children:"Permanent Drawer"}),e.jsxs(a,{sx:{display:"flex",height:240,border:"1px solid",borderColor:"divider",borderRadius:1,overflow:"hidden"},children:[e.jsx(o,{anchor:"left",variant:"permanent",PaperProps:{sx:{width:240,position:"relative",borderRight:"1px solid",borderColor:"divider"}},children:e.jsx(n,{label:"Permanent"})}),e.jsxs(a,{sx:{flex:1,p:2},children:[e.jsx(r,{variant:"h6",sx:{mb:1},children:"Content Area"}),e.jsx(r,{variant:"body2",children:"A permanent drawer remains visible within its container."})]})]}),e.jsx(o,{anchor:"left",variant:"temporary",open:t,onClose:()=>d(!1),ModalProps:{keepMounted:!0},children:e.jsx(n,{label:"Left Drawer"})}),e.jsx(o,{anchor:"right",variant:"temporary",open:b,onClose:()=>h(!1),PaperProps:{sx:{width:300}},children:e.jsx(n,{label:"Right Drawer"})}),e.jsx(o,{anchor:"top",variant:"temporary",open:j,onClose:()=>m(!1),PaperProps:{sx:{height:"auto"}},children:e.jsx(a,{sx:{p:2},children:e.jsx(r,{variant:"subtitle1",children:"Top drawer"})})}),e.jsx(o,{anchor:"bottom",variant:"temporary",open:D,onClose:()=>c(!1),PaperProps:{sx:{height:"auto"}},children:e.jsx(a,{sx:{p:2},children:e.jsx(r,{variant:"subtitle1",children:"Bottom drawer"})})})]})}};var y,u,v;p.parameters={...p.parameters,docs:{...(y=p.parameters)==null?void 0:y.docs,source:{originalSource:`{
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
}`,...(f=(w=l.parameters)==null?void 0:w.docs)==null?void 0:f.source}}};const de=["Playground","Variants"];export{p as Playground,l as Variants,de as __namedExportsOrder,le as default};
