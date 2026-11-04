import{j as r,a}from"./iframe-CWBlVoSh.js";import{C as o}from"./Card-BSR9sopz.js";import"./Hero-AGVy1x6L.js";import"./Gauge-BVTw9lhs.js";import"./ListItemIcon-BlTIWdXj.js";import"./ListItemText-a3Msk-gG.js";import"./Drawer-krYI45FA.js";import{S as p}from"./Stack-BtIJUAdD.js";import"./preload-helper-Dp1pzeXC.js";import"./Paper-B65CqUUw.js";import"./Icon-CB0Uj0Aw.js";import"./IconButton-DF0U6SfD.js";import"./IconButton-C2lrR_jq.js";import"./ButtonBase-cYFfhQKG.js";import"./TransitionGroupContext-2-KL0BXO.js";import"./useForkRef-q9ZWwCIp.js";import"./useEventCallback-JUhf_uGg.js";import"./CircularProgress-Dbrgk4Dj.js";import"./Avatar-Dost7fiL.js";import"./Avatar-B3DduiUj.js";import"./createSvgIcon-dmWuGQpH.js";import"./useSlot-JA-NOEOp.js";import"./resolveComponentProps-DrUC3lMZ.js";import"./TextField-RrvGFqK-.js";import"./useFormControl-DTAOBfdM.js";import"./isHostComponent-DVu5iVWx.js";import"./Menu-BJgpV-l7.js";import"./useSlotProps-DIYNG2by.js";import"./Grow-2bpzgjoW.js";import"./mergeSlotProps-mNPaLQem.js";import"./List-Dd5EG-DP.js";import"./useControlled-jbbdFfPX.js";import"./isMuiElement-DyVPQdzo.js";import"./Button-VJenj8r3.js";import"./Button-ZIPNMwuP.js";import"./Paper-wRFBAbAI.js";import"./Progress-DgCHdVis.js";import"./Toolbar-Pf6HJr2z.js";import"./listItemIconClasses-DKVttrA8.js";import"./listItemTextClasses-DK6UpYXz.js";import"./dividerClasses-DZT7m9dR.js";import"./getThemeProps-XfRzqxji.js";const X={title:"Atoms/Card",component:o,tags:["autodocs"],parameters:{layout:"centered",docs:{description:{component:`
The **Card** atom is a specialized surface for displaying content and actions about a single subject. It's a direct wrapper around MUI's \`Card\` component.

---
## Features
- Provides a clear container for grouped content.
- Supports an \`outlined\` variant for a bordered look.
- Can be visually lifted using the \`raised\` prop or by setting \`elevation\`.
- Fully themeable and stylable via the \`sx\` prop.

---
## Key Props
- \`variant?: 'elevation' | 'outlined'\`: The style of the card.
- \`raised?: boolean\`: If \`true\`, the card will have a higher elevation.
- \`elevation?: number\`: Controls the shadow depth.
- \`children\`: The content of the card, typically \`CardContent\`, \`CardActions\`, etc.
- \`sx?: object\`: For applying custom styles.

---
## Basic usage (React)
~~~tsx
import { Card, CardContent, Typography } from '@/gui/atoms';

<Card sx={{ minWidth: 275 }}>
  <CardContent>
    <Typography variant="h5">Card Title</Typography>
    <Typography variant="body2">
      Content inside the card.
    </Typography>
  </CardContent>
</Card>
~~~

---
## Declarative JSON / Config usage
The resolver can instantiate a Card from a JSON spec.

~~~json
{
  "type": "Card",
  "props": {
    "variant": "outlined",
    "children": {
      "type": "CardContent",
      "props": {
        "children": {
          "type": "Typography",
          "props": { "children": "Card content" }
        }
      }
    }
  }
}
~~~
`}}},argTypes:{variant:{control:{type:"select"},options:["elevation","outlined"]},raised:{control:{type:"boolean"}},elevation:{control:{type:"range",min:0,max:24,step:1}}}},t={render:()=>r.jsxs(p,{spacing:4,sx:{padding:4,width:"50vw",minWidth:300},children:[r.jsxs(o,{sx:{p:2},children:[r.jsx(a,{variant:"h6",children:"Basic Card"}),r.jsx(a,{variant:"body2",children:"Default elevation."})]}),r.jsxs(o,{variant:"outlined",sx:{p:2},children:[r.jsx(a,{variant:"h6",children:"Outlined Card"}),r.jsx(a,{variant:"body2",children:"Uses a border instead of shadow."})]}),r.jsxs(o,{raised:!0,sx:{p:2},children:[r.jsx(a,{variant:"h6",children:"Raised Card"}),r.jsx(a,{variant:"body2",children:"Uses the `raised` prop for higher elevation."})]})]})};var e,i,n;t.parameters={...t.parameters,docs:{...(e=t.parameters)==null?void 0:e.docs,source:{originalSource:`{
  render: () => <Stack spacing={4} sx={{
    padding: 4,
    width: '50vw',
    minWidth: 300
  }}>
      <Card sx={{
      p: 2
    }}>
        <Typography variant="h6">Basic Card</Typography>
        <Typography variant="body2">Default elevation.</Typography>
      </Card>
      <Card variant="outlined" sx={{
      p: 2
    }}>
        <Typography variant="h6">Outlined Card</Typography>
        <Typography variant="body2">Uses a border instead of shadow.</Typography>
      </Card>
      <Card raised sx={{
      p: 2
    }}>
        <Typography variant="h6">Raised Card</Typography>
        <Typography variant="body2">Uses the \`raised\` prop for higher elevation.</Typography>
      </Card>
    </Stack>
}`,...(n=(i=t.parameters)==null?void 0:i.docs)==null?void 0:n.source}}};const Y=["Variants"];export{t as Variants,Y as __namedExportsOrder,X as default};
