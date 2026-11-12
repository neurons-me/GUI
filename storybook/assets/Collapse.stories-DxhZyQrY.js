import{j as o,r as C,T as i}from"./iframe-D0caXraM.js";import{C as n}from"./Collapse-Dx5oIooG.js";import"./Switch-C-3H6IVI.js";import"./Button-CXS3QqkH.js";import"./Paper-xXEET6BR.js";import"./Tooltip-DuFS0zf6.js";import"./Gauge-LzSFGwAb.js";import"./ListItemIcon-BDBP-lji.js";import"./ListItemText-BwbMCl6y.js";import"./Drawer-niTC23G5.js";import{S as h}from"./Stack-_tFB7k9F.js";import"./preload-helper-Dp1pzeXC.js";import"./Grow-DLLXf6dE.js";import"./useSlot-Cy0-9XXJ.js";import"./useForkRef-XNQZmqk0.js";import"./TransitionGroupContext-yoRJhQyt.js";import"./createSvgIcon-TkOxIDkm.js";import"./useFormControl-CvrkDGak.js";import"./ButtonBase-Dn4a5hRT.js";import"./Icon-QhGitz5d.js";import"./Button-5KcQE1lk.js";import"./CircularProgress-9BrVdoMo.js";import"./Paper-Bk81HPwT.js";import"./Tooltip-iopH_C2q.js";import"./IconButton-3QKTNDRF.js";import"./IconButton-C-DjN5NB.js";import"./Avatar-DpCE2P7T.js";import"./Avatar-DA2IiRv7.js";import"./TextField-CBETVBGe.js";import"./isHostComponent-DVu5iVWx.js";import"./Menu-Cb6wxuKw.js";import"./List-Be7TWYSF.js";import"./isMuiElement-Bc5q4xEL.js";import"./Progress-CCXLkOfw.js";import"./Toolbar-PZ12EgUX.js";import"./listItemIconClasses-DgbM6iS2.js";import"./listItemTextClasses-Dj5q713R.js";import"./dividerClasses-C69-NOzd.js";import"./getThemeProps-DYfa67Lg.js";const eo={title:"Molecules/Collapse",component:n,tags:["autodocs"],decorators:[e=>o.jsx("div",{style:{padding:16,minHeight:220},children:o.jsx(e,{})})],parameters:{docs:{description:{component:`
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
        `}},controls:{exclude:["component","children","as","timeout","easing"]}},argTypes:{in:{control:"boolean",description:"Show/Hide content"},orientation:{control:{type:"radio"},options:["vertical","horizontal"]},collapsedSize:{control:"text",description:"number or CSS size"},unmountOnExit:{control:"boolean"},mountOnEnter:{control:"boolean"},appear:{control:"boolean"},sx:{control:"object"}},args:{in:!0,orientation:"vertical",collapsedSize:0,unmountOnExit:!1,mountOnEnter:!1,appear:!1,sx:{},children:void 0}},a=({label:e="Collapsible content"})=>o.jsx("div",{style:{padding:12,border:"1px solid var(--mui-palette-divider)",borderRadius:8,background:"var(--mui-palette-background-paper)",width:200},children:e}),r={render:e=>o.jsx(n,{...e,children:o.jsx(a,{})})},t={render:()=>{const[e,u]=C.useState(!0);return o.jsxs(h,{spacing:2,children:[o.jsx(i,{variant:"h6",children:"Basic Collapse"}),o.jsx(n,{in:e,children:o.jsx(a,{label:"Basic Collapsible Content"})}),o.jsx("button",{onClick:()=>u(!e),children:"Toggle Collapse"}),o.jsx(i,{variant:"h6",children:"Horizontal Collapse"}),o.jsx(n,{orientation:"horizontal",in:e,children:o.jsx(a,{label:"Horizontal Collapsible Content"})})]})}};var s,l,p;r.parameters={...r.parameters,docs:{...(s=r.parameters)==null?void 0:s.docs,source:{originalSource:`{
  render: args => <Collapse {...args}><DemoBlock /></Collapse>
}`,...(p=(l=r.parameters)==null?void 0:l.docs)==null?void 0:p.source}}};var c,d,m;t.parameters={...t.parameters,docs:{...(c=t.parameters)==null?void 0:c.docs,source:{originalSource:`{
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
}`,...(m=(d=t.parameters)==null?void 0:d.docs)==null?void 0:m.source}}};const ro=["Playground","Variants"];export{r as Playground,t as Variants,ro as __namedExportsOrder,eo as default};
