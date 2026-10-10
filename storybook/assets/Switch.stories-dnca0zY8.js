import{j as e,B as i,b as o,r as b}from"./iframe-q72FflWy.js";import"./Paper-9gdP3SeZ.js";import{S as t}from"./Switch-VWqKB610.js";import"./Dialog-o0j-FRf2.js";import"./Hero-BdzYVYxS.js";import"./Modal-XMQC5YcF.js";import"./SearchField-Dr-GPthT.js";import"./List-BSzaOevu.js";import"./ListItem-XTYGYKJx.js";import"./ListItemButton-kBcRpM-O.js";import"./ListItemIcon-lKzEdP8D.js";import"./ListItemText-BjbJ233h.js";import"./Drawer-DMbbDWRX.js";import"./Menu-103suS3X.js";import"./MenuItem-COpnAg9l.js";import{S as r}from"./Stack-DHvmwf16.js";import"./Gauge-DyVYa28g.js";import{F as a}from"./FormControlLabel-DdOqk_Cb.js";import"./preload-helper-Dp1pzeXC.js";import"./Paper-C4cHEfmg.js";import"./useFormControl-BGm5bEiu.js";import"./useSlot-B3Bhjpe0.js";import"./resolveComponentProps-zf7BDQ8X.js";import"./useForkRef-BR9zNRBO.js";import"./useControlled-DIH1o2g4.js";import"./ButtonBase-D2HnvhjV.js";import"./TransitionGroupContext-4zVEsxkP.js";import"./useEventCallback-BVb6jHPB.js";import"./IconButton-D9uKbFdE.js";import"./IconButton-0qTeMK6V.js";import"./CircularProgress-BunsQ8Ul.js";import"./Button-DuvGvkXy.js";import"./Icon-Doq3uhPc.js";import"./Button-BpF6GA05.js";import"./Progress-CA1Hm4aa.js";import"./Toolbar-s_6dNoIJ.js";import"./Avatar-iGO_2OcD.js";import"./Avatar-kFT77iM6.js";import"./createSvgIcon-DOR6FtI1.js";import"./TextField-BSNRPa5x.js";import"./isHostComponent-DVu5iVWx.js";import"./Menu-DFKCKfQm.js";import"./useSlotProps-DMFXOslT.js";import"./Grow-C-rRNj8l.js";import"./mergeSlotProps-BtuGLXbb.js";import"./List-DvvFCGIp.js";import"./isMuiElement-CKqkPfIO.js";import"./listItemIconClasses-C8gmQhu6.js";import"./listItemTextClasses-_6ucLlDF.js";import"./dividerClasses-BXru1jN1.js";import"./MenuItem-D5DHuw3h.js";import"./getThemeProps-BMrl9x_3.js";const ye={title:"Atoms/Switch",component:t,tags:["autodocs"],decorators:[l=>e.jsx(i,{sx:{p:2},children:e.jsx(l,{})})],parameters:{docs:{description:{component:`
**Switch (This.GUI atom)** is a thin wrapper around MUI's \`Switch\`.
It keeps MUI behavior, styling, and typing, but you import it from \`@/gui/atoms\` to keep your app decoupled from MUI.

---

# Usage

## React (imperative)
~~~tsx
import { Switch } from '@/gui/atoms';

export function Example() {
  const [enabled, setEnabled] = React.useState(false);
  return (
    <Switch
      checked={enabled}
      onChange={(_, v) => setEnabled(v)}
      color="primary"
      size="medium"
    />
  );
}
~~~

With an accessible label (MUI way):
~~~tsx
import { FormControlLabel } from '@mui/material';

<FormControlLabel control={<Switch defaultChecked />} label="Enable notifications" />
~~~

---

## Declarative (resolver)
If you’re rendering via a JSON/registry resolver, you can pass the same props:

~~~json
{
  "type": "Switch",
  "props": {
    "label": "Enable feature",
    "defaultChecked": true,
    "color": "primary",
    "size": "small",
    "id": "feat-toggle",
    "sx": { "ml": 1 }
  }
}
~~~

The resolver supports:
- All native MUI Switch props (\`checked\`, \`defaultChecked\`, \`onChange\`, \`color\`, \`size\`, \`disabled\`, \`edge\`, \`inputProps\`, \`sx\`, etc.).
- \`label?: ReactNode\` and \`labelPlacement?: 'start' | 'end' | 'top' | 'bottom'\` (wraps in \`FormControlLabel\` when present).
- \`id\`, \`className\`, \`data-testid\` passthrough for testing and DOM hooks.

---
        `}}},argTypes:{checked:{control:"boolean",description:"Controlled state. Use with onChange.",table:{category:"Behavior"}},defaultChecked:{control:"boolean",description:"Uncontrolled initial state.",table:{category:"Behavior"}},disabled:{control:"boolean",table:{category:"Behavior"}},color:{control:"select",options:["primary","secondary","default"],table:{category:"Appearance"}},size:{control:"radio",options:["small","medium"],description:"Same as MUI Switch (no large by default).",table:{category:"Appearance"}},edge:{control:"radio",options:[!1,"start","end"],table:{category:"Appearance"}},sx:{table:{category:"Style"}},id:{table:{category:"DOM"}},className:{table:{category:"DOM"}},onChange:{table:{disable:!0}},inputProps:{table:{disable:!0}}},args:{defaultChecked:!1,color:"primary",size:"medium",edge:!1}};function y(){const[l,g]=b.useState(!1);return e.jsxs(r,{spacing:1.5,children:[e.jsxs(o,{variant:"body2",children:["Value: ",e.jsx("b",{children:l?"true":"false"})]}),e.jsx(a,{control:e.jsx(t,{checked:l,onChange:(f,x)=>g(x),color:l?"primary":"secondary"}),label:"Controlled switch"})]})}const s={},n={render:()=>e.jsxs(r,{spacing:4,sx:{width:"100%"},children:[e.jsxs(i,{children:[e.jsx(o,{variant:"h6",gutterBottom:!0,children:"With label & placement"}),e.jsxs(r,{spacing:2,children:[e.jsx(a,{control:e.jsx(t,{defaultChecked:!0}),label:"End (default)"}),e.jsx(a,{control:e.jsx(t,{defaultChecked:!0}),label:"Start",labelPlacement:"start"}),e.jsx(a,{control:e.jsx(t,{}),label:"Top",labelPlacement:"top"}),e.jsx(a,{control:e.jsx(t,{}),label:"Bottom",labelPlacement:"bottom"})]})]}),e.jsxs(i,{children:[e.jsx(o,{variant:"h6",gutterBottom:!0,children:"Sizes & colors"}),e.jsxs(r,{spacing:2,children:[e.jsxs(r,{direction:"row",spacing:2,alignItems:"center",children:[e.jsx(o,{variant:"body2",sx:{minWidth:88},children:"small"}),e.jsx(t,{size:"small",color:"default",defaultChecked:!0}),e.jsx(t,{size:"small",color:"primary",defaultChecked:!0}),e.jsx(t,{size:"small",color:"secondary",defaultChecked:!0})]}),e.jsxs(r,{direction:"row",spacing:2,alignItems:"center",children:[e.jsx(o,{variant:"body2",sx:{minWidth:88},children:"medium"}),e.jsx(t,{size:"medium",color:"default",defaultChecked:!0}),e.jsx(t,{size:"medium",color:"primary",defaultChecked:!0}),e.jsx(t,{size:"medium",color:"secondary",defaultChecked:!0})]})]})]}),e.jsxs(i,{children:[e.jsx(o,{variant:"h6",gutterBottom:!0,children:"Controlled"}),e.jsx(y,{})]}),e.jsxs(i,{children:[e.jsx(o,{variant:"h6",gutterBottom:!0,children:"Edge & custom sx"}),e.jsxs(r,{spacing:2,children:[e.jsx(a,{control:e.jsx(t,{edge:"start",defaultChecked:!0}),label:"Edge start"}),e.jsx(a,{control:e.jsx(t,{defaultChecked:!0,sx:{"& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track":{opacity:.7}}}),label:"Custom sx"})]})]})]})},fe=["Playground","Variants"];var c,d,m;s.parameters={...s.parameters,docs:{...(c=s.parameters)==null?void 0:c.docs,source:{originalSource:"{}",...(m=(d=s.parameters)==null?void 0:d.docs)==null?void 0:m.source}}};var p,h,u;n.parameters={...n.parameters,docs:{...(p=n.parameters)==null?void 0:p.docs,source:{originalSource:`{
  render: () => <Stack spacing={4} sx={{
    width: '100%'
  }}>
      <Box>
        <Typography variant="h6" gutterBottom>With label & placement</Typography>
        <Stack spacing={2}>
          <FormControlLabel control={<Switch defaultChecked />} label="End (default)" />
          <FormControlLabel control={<Switch defaultChecked />} label="Start" labelPlacement="start" />
          <FormControlLabel control={<Switch />} label="Top" labelPlacement="top" />
          <FormControlLabel control={<Switch />} label="Bottom" labelPlacement="bottom" />
        </Stack>
      </Box>

      <Box>
        <Typography variant="h6" gutterBottom>Sizes & colors</Typography>
        <Stack spacing={2}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography variant="body2" sx={{
            minWidth: 88
          }}>small</Typography>
            <Switch size="small" color="default" defaultChecked />
            <Switch size="small" color="primary" defaultChecked />
            <Switch size="small" color="secondary" defaultChecked />
          </Stack>
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography variant="body2" sx={{
            minWidth: 88
          }}>medium</Typography>
            <Switch size="medium" color="default" defaultChecked />
            <Switch size="medium" color="primary" defaultChecked />
            <Switch size="medium" color="secondary" defaultChecked />
          </Stack>
        </Stack>
      </Box>

      <Box>
        <Typography variant="h6" gutterBottom>Controlled</Typography>
        <ControlledDemo />
      </Box>

      <Box>
        <Typography variant="h6" gutterBottom>Edge & custom sx</Typography>
        <Stack spacing={2}>
          <FormControlLabel control={<Switch edge="start" defaultChecked />} label="Edge start" />
          <FormControlLabel control={<Switch defaultChecked sx={{
          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
            opacity: 0.7
          }
        }} />} label="Custom sx" />
        </Stack>
      </Box>
    </Stack>
}`,...(u=(h=n.parameters)==null?void 0:h.docs)==null?void 0:u.source}}};export{s as Playground,n as Variants,fe as __namedExportsOrder,ye as default};
