import{j as o,r as C,b as a}from"./iframe-q72FflWy.js";import{C as i}from"./Collapse-sdA7RzmD.js";import"./Paper-9gdP3SeZ.js";import"./Dialog-o0j-FRf2.js";import"./Hero-BdzYVYxS.js";import"./Modal-XMQC5YcF.js";import"./SearchField-Dr-GPthT.js";import"./List-BSzaOevu.js";import"./ListItem-XTYGYKJx.js";import"./ListItemButton-kBcRpM-O.js";import"./ListItemIcon-lKzEdP8D.js";import"./ListItemText-BjbJ233h.js";import"./Drawer-DMbbDWRX.js";import"./Menu-103suS3X.js";import"./MenuItem-COpnAg9l.js";import{S as h}from"./Stack-DHvmwf16.js";import"./Gauge-DyVYa28g.js";import"./preload-helper-Dp1pzeXC.js";import"./Grow-C-rRNj8l.js";import"./useForkRef-BR9zNRBO.js";import"./TransitionGroupContext-4zVEsxkP.js";import"./Paper-C4cHEfmg.js";import"./IconButton-D9uKbFdE.js";import"./IconButton-0qTeMK6V.js";import"./ButtonBase-D2HnvhjV.js";import"./useEventCallback-BVb6jHPB.js";import"./CircularProgress-BunsQ8Ul.js";import"./Button-DuvGvkXy.js";import"./Icon-Doq3uhPc.js";import"./Button-BpF6GA05.js";import"./Progress-CA1Hm4aa.js";import"./Toolbar-s_6dNoIJ.js";import"./Avatar-iGO_2OcD.js";import"./Avatar-kFT77iM6.js";import"./createSvgIcon-DOR6FtI1.js";import"./useSlot-B3Bhjpe0.js";import"./resolveComponentProps-zf7BDQ8X.js";import"./TextField-BSNRPa5x.js";import"./useFormControl-BGm5bEiu.js";import"./isHostComponent-DVu5iVWx.js";import"./Menu-DFKCKfQm.js";import"./useSlotProps-DMFXOslT.js";import"./mergeSlotProps-BtuGLXbb.js";import"./List-DvvFCGIp.js";import"./useControlled-DIH1o2g4.js";import"./isMuiElement-CKqkPfIO.js";import"./listItemIconClasses-C8gmQhu6.js";import"./listItemTextClasses-_6ucLlDF.js";import"./dividerClasses-BXru1jN1.js";import"./MenuItem-D5DHuw3h.js";import"./getThemeProps-BMrl9x_3.js";const Co={title:"Molecules/Collapse",component:i,tags:["autodocs"],decorators:[r=>o.jsx("div",{style:{padding:16,minHeight:220},children:o.jsx(r,{})})],parameters:{docs:{description:{component:`
The **Collapse** atom is a thin wrapper around MUI's \`MuiCollapse\`, staying faithful to its API and polymorphism.

In **declarative** mode (resolver), it forwards MUI props as-is and supports granular styling via \`sx\` on the root.

---
## React usage
~~~jsx
const [open, setOpen] = React.useState(true);

<Collapse in={open}>
  <div style={{ padding: 12, border: '1px solid var(--mui-palette-divider)', borderRadius: 8 }}>
    Collapsible content
  </div>
</Collapse>
~~~

## Declarative JSON / Resolver
~~~json
{
  "type": "Collapse",
  "props": {
    "in": true,
    "orientation": "vertical",
    "sx": { "border": "1px dashed", "borderColor": "divider", "p": 1 }
  }
}
~~~
        `}},controls:{exclude:["component","children","as","timeout","easing"]}},argTypes:{in:{control:"boolean",description:"Show/Hide content"},orientation:{control:{type:"radio"},options:["vertical","horizontal"]},collapsedSize:{control:"text",description:"number or CSS size"},unmountOnExit:{control:"boolean"},mountOnEnter:{control:"boolean"},appear:{control:"boolean"},sx:{control:"object"}},args:{in:!0,orientation:"vertical",collapsedSize:0,unmountOnExit:!1,mountOnEnter:!1,appear:!1,sx:{},children:void 0}},n=({label:r="Collapsible content"})=>o.jsx("div",{style:{padding:12,border:"1px solid var(--mui-palette-divider)",borderRadius:8,background:"var(--mui-palette-background-paper)",width:200},children:r}),t={render:r=>o.jsx(i,{...r,children:o.jsx(n,{})})},e={render:()=>{const[r,u]=C.useState(!0);return o.jsxs(h,{spacing:2,children:[o.jsx(a,{variant:"h6",children:"Basic Collapse"}),o.jsx(i,{in:r,children:o.jsx(n,{label:"Basic Collapsible Content"})}),o.jsx("button",{onClick:()=>u(!r),children:"Toggle Collapse"}),o.jsx(a,{variant:"h6",children:"Horizontal Collapse"}),o.jsx(i,{orientation:"horizontal",in:r,children:o.jsx(n,{label:"Horizontal Collapsible Content"})})]})}},ho=["Playground","Variants"];var p,s,l;t.parameters={...t.parameters,docs:{...(p=t.parameters)==null?void 0:p.docs,source:{originalSource:`{
  render: args => <Collapse {...args}><DemoBlock /></Collapse>
}`,...(l=(s=t.parameters)==null?void 0:s.docs)==null?void 0:l.source}}};var m,c,d;e.parameters={...e.parameters,docs:{...(m=e.parameters)==null?void 0:m.docs,source:{originalSource:`{
  render: () => {
    const [open, setOpen] = React.useState(true);
    return <Stack spacing={2}>
        <Typography variant="h6">Basic Collapse</Typography>
        <Collapse in={open}>
          <DemoBlock label="Basic Collapsible Content" />
        </Collapse>
        <button onClick={() => setOpen(!open)}>
          Toggle Collapse
        </button>

        <Typography variant="h6">Horizontal Collapse</Typography>
        <Collapse orientation="horizontal" in={open}>
          <DemoBlock label="Horizontal Collapsible Content" />
        </Collapse>
      </Stack>;
  }
}`,...(d=(c=e.parameters)==null?void 0:c.docs)==null?void 0:d.source}}};export{t as Playground,e as Variants,ho as __namedExportsOrder,Co as default};
