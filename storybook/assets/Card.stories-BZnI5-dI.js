import{j as r,T as a}from"./iframe-D0caXraM.js";import{C as o}from"./Card-DYKAAIPW.js";import"./Switch-C-3H6IVI.js";import"./Button-CXS3QqkH.js";import"./Paper-xXEET6BR.js";import"./Tooltip-DuFS0zf6.js";import"./Gauge-LzSFGwAb.js";import"./ListItemIcon-BDBP-lji.js";import"./ListItemText-BwbMCl6y.js";import"./Drawer-niTC23G5.js";import{S as p}from"./Stack-_tFB7k9F.js";import"./preload-helper-Dp1pzeXC.js";import"./Paper-Bk81HPwT.js";import"./createSvgIcon-TkOxIDkm.js";import"./useSlot-Cy0-9XXJ.js";import"./useForkRef-XNQZmqk0.js";import"./Grow-DLLXf6dE.js";import"./TransitionGroupContext-yoRJhQyt.js";import"./useFormControl-CvrkDGak.js";import"./ButtonBase-Dn4a5hRT.js";import"./Icon-QhGitz5d.js";import"./Button-5KcQE1lk.js";import"./CircularProgress-9BrVdoMo.js";import"./Tooltip-iopH_C2q.js";import"./IconButton-3QKTNDRF.js";import"./IconButton-C-DjN5NB.js";import"./Avatar-DpCE2P7T.js";import"./Avatar-DA2IiRv7.js";import"./TextField-CBETVBGe.js";import"./isHostComponent-DVu5iVWx.js";import"./Menu-Cb6wxuKw.js";import"./List-Be7TWYSF.js";import"./isMuiElement-Bc5q4xEL.js";import"./Progress-CCXLkOfw.js";import"./Toolbar-PZ12EgUX.js";import"./listItemIconClasses-DgbM6iS2.js";import"./listItemTextClasses-Dj5q713R.js";import"./dividerClasses-C69-NOzd.js";import"./getThemeProps-DYfa67Lg.js";const H={title:"Atoms/Card",component:o,tags:["autodocs"],parameters:{layout:"centered",docs:{description:{component:`
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
}`,...(n=(i=t.parameters)==null?void 0:i.docs)==null?void 0:n.source}}};const L=["Variants"];export{t as Variants,L as __namedExportsOrder,H as default};
