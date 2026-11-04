import{j as o,r as C,a as i}from"./iframe-CWBlVoSh.js";import{C as n}from"./Collapse-CMX4Arn6.js";import"./Hero-AGVy1x6L.js";import"./Gauge-BVTw9lhs.js";import"./ListItemIcon-BlTIWdXj.js";import"./ListItemText-a3Msk-gG.js";import"./Drawer-krYI45FA.js";import{S as h}from"./Stack-BtIJUAdD.js";import"./preload-helper-Dp1pzeXC.js";import"./Grow-2bpzgjoW.js";import"./useForkRef-q9ZWwCIp.js";import"./TransitionGroupContext-2-KL0BXO.js";import"./Icon-CB0Uj0Aw.js";import"./IconButton-DF0U6SfD.js";import"./IconButton-C2lrR_jq.js";import"./ButtonBase-cYFfhQKG.js";import"./useEventCallback-JUhf_uGg.js";import"./CircularProgress-Dbrgk4Dj.js";import"./Avatar-Dost7fiL.js";import"./Avatar-B3DduiUj.js";import"./createSvgIcon-dmWuGQpH.js";import"./useSlot-JA-NOEOp.js";import"./resolveComponentProps-DrUC3lMZ.js";import"./TextField-RrvGFqK-.js";import"./useFormControl-DTAOBfdM.js";import"./isHostComponent-DVu5iVWx.js";import"./Menu-BJgpV-l7.js";import"./useSlotProps-DIYNG2by.js";import"./Paper-B65CqUUw.js";import"./mergeSlotProps-mNPaLQem.js";import"./List-Dd5EG-DP.js";import"./useControlled-jbbdFfPX.js";import"./isMuiElement-DyVPQdzo.js";import"./Button-VJenj8r3.js";import"./Button-ZIPNMwuP.js";import"./Paper-wRFBAbAI.js";import"./Progress-DgCHdVis.js";import"./Toolbar-Pf6HJr2z.js";import"./listItemIconClasses-DKVttrA8.js";import"./listItemTextClasses-DK6UpYXz.js";import"./dividerClasses-DZT7m9dR.js";import"./getThemeProps-XfRzqxji.js";const no={title:"Molecules/Collapse",component:n,tags:["autodocs"],decorators:[e=>o.jsx("div",{style:{padding:16,minHeight:220},children:o.jsx(e,{})})],parameters:{docs:{description:{component:`
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
        `}},controls:{exclude:["component","children","as","timeout","easing"]}},argTypes:{in:{control:"boolean",description:"Show/Hide content"},orientation:{control:{type:"radio"},options:["vertical","horizontal"]},collapsedSize:{control:"text",description:"number or CSS size"},unmountOnExit:{control:"boolean"},mountOnEnter:{control:"boolean"},appear:{control:"boolean"},sx:{control:"object"}},args:{in:!0,orientation:"vertical",collapsedSize:0,unmountOnExit:!1,mountOnEnter:!1,appear:!1,sx:{},children:void 0}},a=({label:e="Collapsible content"})=>o.jsx("div",{style:{padding:12,border:"1px solid var(--mui-palette-divider)",borderRadius:8,background:"var(--mui-palette-background-paper)",width:200},children:e}),r={render:e=>o.jsx(n,{...e,children:o.jsx(a,{})})},t={render:()=>{const[e,u]=C.useState(!0);return o.jsxs(h,{spacing:2,children:[o.jsx(i,{variant:"h6",children:"Basic Collapse"}),o.jsx(n,{in:e,children:o.jsx(a,{label:"Basic Collapsible Content"})}),o.jsx("button",{onClick:()=>u(!e),children:"Toggle Collapse"}),o.jsx(i,{variant:"h6",children:"Horizontal Collapse"}),o.jsx(n,{orientation:"horizontal",in:e,children:o.jsx(a,{label:"Horizontal Collapsible Content"})})]})}};var s,p,l;r.parameters={...r.parameters,docs:{...(s=r.parameters)==null?void 0:s.docs,source:{originalSource:`{
  render: args => <Collapse {...args}><DemoBlock /></Collapse>
}`,...(l=(p=r.parameters)==null?void 0:p.docs)==null?void 0:l.source}}};var c,m,d;t.parameters={...t.parameters,docs:{...(c=t.parameters)==null?void 0:c.docs,source:{originalSource:`{
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
}`,...(d=(m=t.parameters)==null?void 0:m.docs)==null?void 0:d.source}}};const ao=["Playground","Variants"];export{r as Playground,t as Variants,ao as __namedExportsOrder,no as default};
