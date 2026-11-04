import{j as r,a as i,B as n}from"./iframe-9xs7r-yC.js";import"./Button-BZ2a02w5.js";import{D as t}from"./Gauge-b94eazVZ.js";import"./Paper-D3ZYW61L.js";import"./Hero-DtS3rAl9.js";import"./ListItemIcon-B7hmZwSO.js";import"./ListItemText-CYWXZB3q.js";import"./Drawer-cqwrOwxl.js";import{S as s}from"./Stack-CSFYgcUl.js";import"./preload-helper-Dp1pzeXC.js";import"./Icon-Coo2vCLK.js";import"./Button-2IZqaMH4.js";import"./ButtonBase-CmaSafY6.js";import"./TransitionGroupContext-Ddsw9Vt9.js";import"./useForkRef-CY5C0zUu.js";import"./CircularProgress-Cc9H9qAL.js";import"./IconButton-BTVRcgHZ.js";import"./IconButton-2EQKHUpt.js";import"./Avatar-CYaJ7BCk.js";import"./Avatar-CHOZ5ucK.js";import"./createSvgIcon-ApOObPh6.js";import"./useSlot-Pi2X4fgs.js";import"./resolveComponentProps-Cy9ikCBM.js";import"./TextField-MYNk8PjL.js";import"./useFormControl-Daq17cxB.js";import"./isHostComponent-DVu5iVWx.js";import"./Menu-DcUO-yQz.js";import"./useSlotProps-CEMoFeCz.js";import"./Paper-BQJEQDIX.js";import"./Grow-CkmZyC82.js";import"./mergeSlotProps-DRRQWfkx.js";import"./List-QlunaKS6.js";import"./useControlled-CR8NUisP.js";import"./isMuiElement-FUZCUFHm.js";import"./Progress-BGC2gmP_.js";import"./Toolbar-DWHH-c6u.js";import"./listItemIconClasses-Cdc3Z4Nj.js";import"./listItemTextClasses-BzoRJwRN.js";import"./dividerClasses-D5nEUdl6.js";import"./getThemeProps-CazJCMyU.js";const X={title:"Atoms/Divider",component:t,tags:["autodocs"],parameters:{docs:{description:{component:"The Divider component is a thin wrapper over MUI's `MuiDivider`. It preserves all props and allows styling via the `sx` prop.  \n\nUse it to divide content, lists or layouts."}}},argTypes:{orientation:{control:{type:"radio"},options:["horizontal","vertical"],description:"The orientation of the divider."},variant:{control:{type:"radio"},options:["fullWidth","inset","middle"],description:"The variant to use."},flexItem:{control:{type:"boolean"},description:"If true, the divider is a flex item."}},args:{orientation:"horizontal",variant:"fullWidth",flexItem:!1}},o={render:m=>r.jsxs(s,{spacing:2,sx:{width:300,display:"flex"},children:[r.jsx(i,{variant:"h6",children:"Horizontal Divider"}),r.jsx(i,{children:"Item One"}),r.jsx(t,{}),r.jsx(i,{children:"Item Two"}),r.jsx(i,{variant:"h6",children:"Vertical Divider"}),r.jsxs(n,{sx:{display:"flex",flexDirection:"row",gap:"20px",alignItems:"center",height:"100px"},children:[r.jsx(i,{children:"Left"}),r.jsx(t,{orientation:"vertical",flexItem:!0}),r.jsx(i,{children:"Right"})]}),r.jsx(i,{variant:"h6",children:"Inset Divider"}),r.jsx(i,{children:"First"}),r.jsx(t,{variant:"inset"}),r.jsx(i,{children:"Second"}),r.jsx(i,{variant:"h6",children:"Text Divider"}),r.jsx(t,{children:"Text Content"})]})};var e,p,a;o.parameters={...o.parameters,docs:{...(e=o.parameters)==null?void 0:e.docs,source:{originalSource:`{
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
