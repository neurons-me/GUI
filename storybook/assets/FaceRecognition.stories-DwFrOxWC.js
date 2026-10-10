import{j as a}from"./iframe-q72FflWy.js";import{F as r}from"./FaceRecognition-cIWFPhhw.js";import"./preload-helper-Dp1pzeXC.js";import"./Button-DuvGvkXy.js";import"./Icon-Doq3uhPc.js";import"./Button-BpF6GA05.js";import"./ButtonBase-D2HnvhjV.js";import"./TransitionGroupContext-4zVEsxkP.js";import"./useForkRef-BR9zNRBO.js";import"./useEventCallback-BVb6jHPB.js";import"./CircularProgress-BunsQ8Ul.js";import"./Paper-9gdP3SeZ.js";import"./Paper-C4cHEfmg.js";import"./Dialog-o0j-FRf2.js";import"./Hero-BdzYVYxS.js";import"./Modal-XMQC5YcF.js";import"./IconButton-D9uKbFdE.js";import"./IconButton-0qTeMK6V.js";import"./SearchField-Dr-GPthT.js";import"./Drawer-DMbbDWRX.js";import"./dividerClasses-BXru1jN1.js";import"./useFormControl-BGm5bEiu.js";import"./useSlot-B3Bhjpe0.js";import"./resolveComponentProps-zf7BDQ8X.js";import"./mergeSlotProps-BtuGLXbb.js";import"./Grow-C-rRNj8l.js";import"./Menu-DFKCKfQm.js";import"./useSlotProps-DMFXOslT.js";import"./isHostComponent-DVu5iVWx.js";import"./List-DvvFCGIp.js";import"./Progress-CA1Hm4aa.js";import"./Toolbar-s_6dNoIJ.js";import"./Avatar-iGO_2OcD.js";import"./Avatar-kFT77iM6.js";import"./createSvgIcon-DOR6FtI1.js";import"./TextField-BSNRPa5x.js";import"./useControlled-DIH1o2g4.js";import"./isMuiElement-CKqkPfIO.js";import"./List-BSzaOevu.js";import"./ListItem-XTYGYKJx.js";import"./ListItemText-BjbJ233h.js";import"./listItemTextClasses-_6ucLlDF.js";import"./ListItemButton-kBcRpM-O.js";import"./ListItemIcon-lKzEdP8D.js";import"./listItemIconClasses-C8gmQhu6.js";import"./Menu-103suS3X.js";import"./MenuItem-COpnAg9l.js";import"./MenuItem-D5DHuw3h.js";import"./Stack-DHvmwf16.js";import"./getThemeProps-BMrl9x_3.js";import"./Gauge-DyVYa28g.js";const je={title:"Widgets/FaceRecognition",component:r,tags:["autodocs"],decorators:[e=>a.jsx("div",{style:{padding:16,minHeight:520,display:"grid",placeItems:"center",backgroundColor:"#f5f5f5"},children:a.jsx(e,{})})],parameters:{layout:"centered",docs:{description:{component:`
# FaceRecognition

## Overview

FaceRecognition is a versatile camera and face landmarks organism designed for React applications. It supports two distinct modes:

- \`modal\`: Renders inside a modal dialog, suitable for workflows requiring user focus.
- \`inline\`: Renders a square camera surface that can be embedded anywhere in your layout.

## Features

- Uses \`react-webcam\` for camera capture.
- Lazy-loads MediaPipe Tasks Vision for face landmark detection when \`showLandmarks\` is enabled.
- Falls back to a lightweight placeholder landmark set if the model fails to load.
- Mirrored preview and overlays by default for a natural selfie experience.
- Extracts stable face templates for verification workflows.
- Supports automatic verification via a configurable API endpoint.
- Allows external status control for integration with parent applications like Session.

## Key Props

- \`variant\` ("modal" | "inline"): Determines rendering mode.
- \`showLandmarks\` (boolean): Enables face landmark detection and mesh overlay.
- \`autoVerify\` (boolean): Automatically triggers verification when a stable template is extracted.
- \`verifyUrl\` (string): URL endpoint for face verification requests.
- \`mirrorPreview\` (boolean): Mirrors the camera preview and overlays.
- \`meshStep\` (number): Controls the detail level of the face mesh (1-6).
- \`verifyHttpStatus\` (number): External HTTP status to drive the HUD badge.
- \`verifyMessage\` (string): External message to display in the HUD badge.
- \`verifyPayload\` (any): External template payload to trigger verification.

## Basic usage (React)

\`\`\`jsx
<FaceRecognition
  open={true}
  variant="modal"
  showLandmarks={true}
  autoVerify={true}
  verifyUrl="/api/face/verify"
  onCapture={(imageDataUrl) => { /* handle capture */ }}
  onTemplate={(template) => { /* handle template */ }}
  onVerify={(result) => { /* handle verification result */ }}
  onStatus={({ httpStatus, message, busy }) => { /* handle status updates */ }}
/>
\`\`\`

## Session / external status usage

Parent applications can control the HUD badge externally by setting \`verifyHttpStatus\` and \`verifyMessage\` props, allowing verification state to be displayed even if performed outside this component.

## Notes

- Storybook will request camera permission when these stories render.
- Some browsers (e.g., Safari) may not support \`navigator.permissions\` for camera; the component handles this gracefully.
        `}}},args:{open:!0,title:"Face Scan",variant:"modal",showLandmarks:!1,autoVerify:!0,includeBlendshapes:!1,meshStep:1,mirrorPreview:!0},argTypes:{open:{control:"boolean",description:"Controls whether the modal or inline camera surface is open/visible."},title:{control:"text",description:"Title text shown in the modal header."},variant:{control:{type:"radio"},options:["modal","inline"],description:'Determines the rendering mode: "modal" for dialog or "inline" for embedded camera surface.'},showLandmarks:{control:"boolean",description:"Enables face landmark detection, mesh overlay, and template extraction."},verifyUrl:{control:"text",description:"URL endpoint used for face verification requests when autoVerify is enabled."},autoVerify:{control:"boolean",description:"Automatically triggers verification when a stable template is available."},includeBlendshapes:{control:"boolean",description:"Includes blendshape coefficients in the extracted face template data."},showMeshConnections:{control:"boolean",description:"Shows connections between face landmarks in the mesh overlay."},meshStep:{control:{type:"number",min:1,max:6,step:1},description:"Controls the detail level of the face mesh; lower values show more points."},mirrorPreview:{control:"boolean",description:"Mirrors the camera preview and overlays to match a selfie view."},verifyPayload:{control:!1,description:"External face template payload to trigger verification externally."},verifyHttpStatus:{control:{type:"number"},description:"Externally-driven HTTP status code to display HUD badge accordingly."},verifyMessage:{control:"text",description:"Externally-driven message to display in the HUD badge."},onClose:{action:"onClose",description:"Callback fired when the modal or camera surface is closed."},onCapture:{action:"onCapture",description:"Callback fired with captured image data URL in capture mode."},onVerify:{action:"onVerify",description:"Callback fired with verification result JSON."},onTemplate:{action:"onTemplate",description:"Callback fired with the latest stable face template."},onStatus:{action:"onStatus",description:"Callback fired with verification status updates."}}},n={name:"Playground",render:e=>e.variant==="inline"?a.jsx("div",{style:{width:360,border:"1px solid #ddd",borderRadius:8,overflow:"hidden"},children:a.jsx(r,{...e})}):a.jsx(r,{...e})},t={name:"Modal / Capture",args:{variant:"modal",showLandmarks:!1,open:!0},render:e=>a.jsx(r,{...e}),parameters:{docs:{description:{story:"Capture-only mode. Uses react-webcam screenshot (jpeg) and calls onCapture(imageDataUrl). Landmarks are OFF."}}}},o={name:"Modal / Landmarks + Verify",args:{variant:"modal",showLandmarks:!0,autoVerify:!0,open:!0},render:e=>a.jsx(r,{...e}),parameters:{docs:{description:{story:"Landmarks ON. Loads MediaPipe, draws mesh, extracts a stable template, and can auto-verify via verifyUrl."}}}},s={name:"Inline / Landmarks HUD",args:{variant:"inline",showLandmarks:!0,open:!0},render:e=>a.jsx("div",{style:{width:360,border:"1px solid #ddd",borderRadius:8,overflow:"hidden"},children:a.jsx(r,{...e})}),parameters:{layout:"padded",docs:{description:{story:"Inline surface intended for embedding in layouts. Shows the live mesh overlay + HUD badge when status is available."}}}},i={name:"Inline / Camera Only",args:{variant:"inline",showLandmarks:!1,open:!0},render:e=>a.jsx("div",{style:{width:360,border:"1px solid #ddd",borderRadius:8,overflow:"hidden"},children:a.jsx(r,{...e})}),parameters:{layout:"padded",docs:{description:{story:"Inline camera surface without landmarks. Useful for simple preview / capture flows."}}}},d={name:"External Status / 404",args:{variant:"inline",showLandmarks:!0,verifyHttpStatus:404,verifyMessage:"404 (Face Not Found)",open:!0},render:e=>a.jsx("div",{style:{width:360,border:"1px solid #ddd",borderRadius:8,overflow:"hidden"},children:a.jsx(r,{...e})}),parameters:{layout:"padded",docs:{description:{story:"Demonstrates externally-driven HUD badge (404). Parent can set verifyHttpStatus/verifyMessage without relying on internal fetch."}}}},l={name:"External Status / Match",args:{variant:"inline",showLandmarks:!0,verifyHttpStatus:200,verifyMessage:"Match",verifyPayload:void 0,open:!0},render:e=>a.jsx("div",{style:{width:360,border:"1px solid #ddd",borderRadius:8,overflow:"hidden"},children:a.jsx(r,{...e})}),parameters:{layout:"padded",docs:{description:{story:"Demonstrates externally-driven HUD badge (200/Match). Useful when verification happens in a parent module."}}}},c={name:"Closed",args:{open:!1},render:e=>a.jsx(r,{...e}),parameters:{docs:{description:{story:"Closed state. In modal variant, nothing is shown when open=false."}}}},Pe=["Playground","ModalCapture","ModalLandmarksVerify","InlineLandmarks","InlineNoLandmarks","ExternalStatusBadge404","ExternalStatusBadgeMatch","Closed"];var p,m,u;n.parameters={...n.parameters,docs:{...(p=n.parameters)==null?void 0:p.docs,source:{originalSource:`{
  name: 'Playground',
  render: args => {
    if (args.variant === 'inline') {
      return <div style={{
        width: 360,
        border: '1px solid #ddd',
        borderRadius: 8,
        overflow: 'hidden'
      }}>
          <FaceRecognition {...args} />
        </div>;
    }
    return <FaceRecognition {...args} />;
  }
}`,...(u=(m=n.parameters)==null?void 0:m.docs)==null?void 0:u.source}}};var f,h,y;t.parameters={...t.parameters,docs:{...(f=t.parameters)==null?void 0:f.docs,source:{originalSource:`{
  name: 'Modal / Capture',
  args: {
    variant: 'modal',
    showLandmarks: false,
    open: true
  },
  render: args => <FaceRecognition {...args} />,
  parameters: {
    docs: {
      description: {
        story: 'Capture-only mode. Uses react-webcam screenshot (jpeg) and calls onCapture(imageDataUrl). Landmarks are OFF.'
      }
    }
  }
}`,...(y=(h=t.parameters)==null?void 0:h.docs)==null?void 0:y.source}}};var g,v,w;o.parameters={...o.parameters,docs:{...(g=o.parameters)==null?void 0:g.docs,source:{originalSource:`{
  name: 'Modal / Landmarks + Verify',
  args: {
    variant: 'modal',
    showLandmarks: true,
    autoVerify: true,
    open: true
  },
  render: args => <FaceRecognition {...args} />,
  parameters: {
    docs: {
      description: {
        story: 'Landmarks ON. Loads MediaPipe, draws mesh, extracts a stable template, and can auto-verify via verifyUrl.'
      }
    }
  }
}`,...(w=(v=o.parameters)==null?void 0:v.docs)==null?void 0:w.source}}};var b,x,k;s.parameters={...s.parameters,docs:{...(b=s.parameters)==null?void 0:b.docs,source:{originalSource:`{
  name: 'Inline / Landmarks HUD',
  args: {
    variant: 'inline',
    showLandmarks: true,
    open: true
  },
  render: args => <div style={{
    width: 360,
    border: '1px solid #ddd',
    borderRadius: 8,
    overflow: 'hidden'
  }}>
      <FaceRecognition {...args} />
    </div>,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story: 'Inline surface intended for embedding in layouts. Shows the live mesh overlay + HUD badge when status is available.'
      }
    }
  }
}`,...(k=(x=s.parameters)==null?void 0:x.docs)==null?void 0:k.source}}};var S,L,M;i.parameters={...i.parameters,docs:{...(S=i.parameters)==null?void 0:S.docs,source:{originalSource:`{
  name: 'Inline / Camera Only',
  args: {
    variant: 'inline',
    showLandmarks: false,
    open: true
  },
  render: args => <div style={{
    width: 360,
    border: '1px solid #ddd',
    borderRadius: 8,
    overflow: 'hidden'
  }}>
      <FaceRecognition {...args} />
    </div>,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story: 'Inline camera surface without landmarks. Useful for simple preview / capture flows.'
      }
    }
  }
}`,...(M=(L=i.parameters)==null?void 0:L.docs)==null?void 0:M.source}}};var R,C,U;d.parameters={...d.parameters,docs:{...(R=d.parameters)==null?void 0:R.docs,source:{originalSource:`{
  name: 'External Status / 404',
  args: {
    variant: 'inline',
    showLandmarks: true,
    verifyHttpStatus: 404,
    verifyMessage: '404 (Face Not Found)',
    open: true
  },
  render: args => <div style={{
    width: 360,
    border: '1px solid #ddd',
    borderRadius: 8,
    overflow: 'hidden'
  }}>
      <FaceRecognition {...args} />
    </div>,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story: 'Demonstrates externally-driven HUD badge (404). Parent can set verifyHttpStatus/verifyMessage without relying on internal fetch.'
      }
    }
  }
}`,...(U=(C=d.parameters)==null?void 0:C.docs)==null?void 0:U.source}}};var F,H,D;l.parameters={...l.parameters,docs:{...(F=l.parameters)==null?void 0:F.docs,source:{originalSource:`{
  name: 'External Status / Match',
  args: {
    variant: 'inline',
    showLandmarks: true,
    verifyHttpStatus: 200,
    verifyMessage: 'Match',
    verifyPayload: undefined,
    open: true
  },
  render: args => <div style={{
    width: 360,
    border: '1px solid #ddd',
    borderRadius: 8,
    overflow: 'hidden'
  }}>
      <FaceRecognition {...args} />
    </div>,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story: 'Demonstrates externally-driven HUD badge (200/Match). Useful when verification happens in a parent module.'
      }
    }
  }
}`,...(D=(H=l.parameters)==null?void 0:H.docs)==null?void 0:D.source}}};var j,P,E;c.parameters={...c.parameters,docs:{...(j=c.parameters)==null?void 0:j.docs,source:{originalSource:`{
  name: 'Closed',
  args: {
    open: false
  },
  render: args => <FaceRecognition {...args} />,
  parameters: {
    docs: {
      description: {
        story: 'Closed state. In modal variant, nothing is shown when open=false.'
      }
    }
  }
}`,...(E=(P=c.parameters)==null?void 0:P.docs)==null?void 0:E.source}}};export{c as Closed,d as ExternalStatusBadge404,l as ExternalStatusBadgeMatch,s as InlineLandmarks,i as InlineNoLandmarks,t as ModalCapture,o as ModalLandmarksVerify,n as Playground,Pe as __namedExportsOrder,je as default};
