import{j as r,T as i,B as n}from"./iframe-Dgz0DvjP.js";import{D as t}from"./Gauge-auIj8jG9.js";import"./ListItemIcon-Dk9aJ05I.js";import"./ListItemText-DCgrBkAM.js";import"./Drawer-YSKRlM1U.js";import{S as s}from"./Stack-CPORitL0.js";import"./preload-helper-Dp1pzeXC.js";import"./Icon-zhfCvvEA.js";import"./IconButton-HxKAscSc.js";import"./IconButton-D_VO_Lm6.js";import"./ButtonBase-DnPFUmZ4.js";import"./TransitionGroupContext-Bovk2g5c.js";import"./useForkRef-DhiyL1xF.js";import"./useEventCallback-CW9ai8zV.js";import"./CircularProgress-CRe5HlWG.js";import"./Avatar-BlQEDC2q.js";import"./Avatar-CRm8ZbT3.js";import"./createSvgIcon-BTgnJVyE.js";import"./useSlot-CjwkB68v.js";import"./resolveComponentProps-C7RzSJ6V.js";import"./TextField-ROcKb43U.js";import"./useFormControl-CTXUw6wt.js";import"./isHostComponent-DVu5iVWx.js";import"./Menu-D9ienzuU.js";import"./useSlotProps-D6FndUWw.js";import"./Paper-DKRGBdYt.js";import"./Grow-D7g5qnif.js";import"./mergeSlotProps-DoPK-Muf.js";import"./List-BZwm0z1v.js";import"./useControlled-DSrQ-lxT.js";import"./isMuiElement-BIZd4XRc.js";import"./Button-B3yzBwnB.js";import"./Button-BrwXx0gp.js";import"./Paper-DdBU6wUz.js";import"./Progress-ClTpsf_Z.js";import"./Toolbar-CvqahxVg.js";import"./listItemIconClasses-U7MvxmKI.js";import"./listItemTextClasses-CANx9uJI.js";import"./dividerClasses-BXzcgXwe.js";import"./getThemeProps-DPkTTLbc.js";const X={title:"Atoms/Divider",component:t,tags:["autodocs"],parameters:{docs:{description:{component:"The Divider component is a thin wrapper over MUI's `MuiDivider`. It preserves all props and allows styling via the `sx` prop.  \n\nUse it to divide content, lists or layouts."}}},argTypes:{orientation:{control:{type:"radio"},options:["horizontal","vertical"],description:"The orientation of the divider."},variant:{control:{type:"radio"},options:["fullWidth","inset","middle"],description:"The variant to use."},flexItem:{control:{type:"boolean"},description:"If true, the divider is a flex item."}},args:{orientation:"horizontal",variant:"fullWidth",flexItem:!1}},o={render:m=>r.jsxs(s,{spacing:2,sx:{width:300,display:"flex"},children:[r.jsx(i,{variant:"h6",children:"Horizontal Divider"}),r.jsx(i,{children:"Item One"}),r.jsx(t,{}),r.jsx(i,{children:"Item Two"}),r.jsx(i,{variant:"h6",children:"Vertical Divider"}),r.jsxs(n,{sx:{display:"flex",flexDirection:"row",gap:"20px",alignItems:"center",height:"100px"},children:[r.jsx(i,{children:"Left"}),r.jsx(t,{orientation:"vertical",flexItem:!0}),r.jsx(i,{children:"Right"})]}),r.jsx(i,{variant:"h6",children:"Inset Divider"}),r.jsx(i,{children:"First"}),r.jsx(t,{variant:"inset"}),r.jsx(i,{children:"Second"}),r.jsx(i,{variant:"h6",children:"Text Divider"}),r.jsx(t,{children:"Text Content"})]})};var e,p,a;o.parameters={...o.parameters,docs:{...(e=o.parameters)==null?void 0:e.docs,source:{originalSource:`{
  render: args => <Stack spacing={2} sx={{
    width: 300,
    display: 'flex'
  }}>
      <Typography variant="h6">Horizontal Divider</Typography>
       <Typography>Item One</Typography>
      <Divider />
       <Typography>Item Two</Typography>

      <Typography variant="h6">Vertical Divider</Typography>
      <Box sx={{
      display: "flex",
      flexDirection: "row",
      gap: "20px",
      alignItems: "center",
      height: "100px"
    }}>
        <Typography>Left</Typography>
        <Divider orientation="vertical" flexItem />
        <Typography>Right</Typography>
      </Box>

      <Typography variant="h6">Inset Divider</Typography>
       <Typography>First</Typography>
      <Divider variant="inset" />
       <Typography>Second</Typography>

      <Typography variant="h6">Text Divider</Typography>
      <Divider>Text Content</Divider>
    </Stack>
}`,...(a=(p=o.parameters)==null?void 0:p.docs)==null?void 0:a.source}}};const Y=["Variants"];export{o as Variants,Y as __namedExportsOrder,X as default};
