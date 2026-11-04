import{j as t,a as B}from"./iframe-9xs7r-yC.js";import{B as o}from"./Button-BZ2a02w5.js";import"./Paper-D3ZYW61L.js";import{T as e}from"./Tooltip-lv5D5rZR.js";import"./preload-helper-Dp1pzeXC.js";import"./Icon-Coo2vCLK.js";import"./Button-2IZqaMH4.js";import"./ButtonBase-CmaSafY6.js";import"./TransitionGroupContext-Ddsw9Vt9.js";import"./useForkRef-CY5C0zUu.js";import"./CircularProgress-Cc9H9qAL.js";import"./Paper-BQJEQDIX.js";import"./Tooltip-DsQxmgoN.js";import"./useSlot-Pi2X4fgs.js";import"./resolveComponentProps-Cy9ikCBM.js";import"./useControlled-CR8NUisP.js";import"./Grow-CkmZyC82.js";import"./useSlotProps-CEMoFeCz.js";const q={title:"Atoms/Tooltip",component:e,tags:["autodocs"],parameters:{docs:{description:{component:"This Tooltip is a thin wrapper around MUI's Tooltip, supporting all MUI props and the `sx` prop for styling. Use it for helpful hover information, and configure it via JSON/config declaratively."}}}},r={args:{title:"Tooltip text",placement:"top",arrow:!1,size:"md",children:t.jsx(o,{variant:"contained",children:"Hover me"})},argTypes:{title:{control:"text"},placement:{control:"select",options:["top","bottom","left","right"]},arrow:{control:"boolean"},size:{control:"select",options:["sm","md","lg"]}},render:n=>t.jsx(e,{...n,size:n.size,children:n.children})},i={name:"Placement: right",render:()=>t.jsx(e,{title:"Right placed tooltip",placement:"right",children:t.jsx(o,{variant:"contained",children:"Hover right"})}),parameters:{docs:{description:{story:'Tooltip with `placement="right"` demonstrates MUI placement support.'}}}},a={name:"Arrow",render:()=>t.jsx(e,{title:"Tooltip with arrow",arrow:!0,children:t.jsx(o,{variant:"contained",children:"Hover arrow"})}),parameters:{docs:{description:{story:"Tooltip with `arrow={true}` prop shows the arrow, just like MUI."}}}},s={name:"Wrapped Typography",render:()=>t.jsx(e,{title:"Tooltip on text",children:t.jsx(B,{variant:"body1",sx:{cursor:"pointer",display:"inline-block"},children:"Hover this text"})}),parameters:{docs:{description:{story:"Tooltip wrapping a Typography element, showing flexibility and full MUI compatibility."}}}},p={name:"With Size",render:()=>t.jsxs("div",{style:{display:"flex",gap:24},children:[t.jsx(e,{title:"Small size tooltip",size:"sm",children:t.jsx(o,{variant:"contained",children:"Small (sm)"})}),t.jsx(e,{title:"Medium size tooltip",size:"md",children:t.jsx(o,{variant:"contained",children:"Medium (md)"})}),t.jsx(e,{title:"Large size tooltip",size:"lg",children:t.jsx(o,{variant:"contained",children:"Large (lg)"})})]}),parameters:{docs:{description:{story:"Demonstrates the Tooltip with different `size` props: small, medium, and large."}}}};var l,c,m;r.parameters={...r.parameters,docs:{...(l=r.parameters)==null?void 0:l.docs,source:{originalSource:`{
  args: {
    title: 'Tooltip text',
    placement: 'top',
    arrow: false,
    size: 'md',
    children: <Button variant="contained">Hover me</Button>
  },
  argTypes: {
    title: {
      control: 'text'
    },
    placement: {
      control: 'select',
      options: ['top', 'bottom', 'left', 'right']
    },
    arrow: {
      control: 'boolean'
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg']
    }
  },
  render: args => <Tooltip {...args} size={args.size}>{args.children}</Tooltip>
}`,...(m=(c=r.parameters)==null?void 0:c.docs)==null?void 0:m.source}}};var d,h,g;i.parameters={...i.parameters,docs:{...(d=i.parameters)==null?void 0:d.docs,source:{originalSource:`{
  name: 'Placement: right',
  render: () => <Tooltip title="Right placed tooltip" placement="right">
      <Button variant="contained">Hover right</Button>
    </Tooltip>,
  parameters: {
    docs: {
      description: {
        story: 'Tooltip with \`placement="right"\` demonstrates MUI placement support.'
      }
    }
  }
}`,...(g=(h=i.parameters)==null?void 0:h.docs)==null?void 0:g.source}}};var u,T,y;a.parameters={...a.parameters,docs:{...(u=a.parameters)==null?void 0:u.docs,source:{originalSource:`{
  name: 'Arrow',
  render: () => <Tooltip title="Tooltip with arrow" arrow>
      <Button variant="contained">Hover arrow</Button>
    </Tooltip>,
  parameters: {
    docs: {
      description: {
        story: 'Tooltip with \`arrow={true}\` prop shows the arrow, just like MUI.'
      }
    }
  }
}`,...(y=(T=a.parameters)==null?void 0:T.docs)==null?void 0:y.source}}};var x,w,v;s.parameters={...s.parameters,docs:{...(x=s.parameters)==null?void 0:x.docs,source:{originalSource:`{
  name: 'Wrapped Typography',
  render: () => <Tooltip title="Tooltip on text">
      <Typography variant="body1" sx={{
      cursor: 'pointer',
      display: 'inline-block'
    }}>
        Hover this text
      </Typography>
    </Tooltip>,
  parameters: {
    docs: {
      description: {
        story: 'Tooltip wrapping a Typography element, showing flexibility and full MUI compatibility.'
      }
    }
  }
}`,...(v=(w=s.parameters)==null?void 0:w.docs)==null?void 0:v.source}}};var z,f,j;p.parameters={...p.parameters,docs:{...(z=p.parameters)==null?void 0:z.docs,source:{originalSource:`{
  name: 'With Size',
  render: () => <div style={{
    display: 'flex',
    gap: 24
  }}>
      <Tooltip title="Small size tooltip" size="sm">
        <Button variant="contained">Small (sm)</Button>
      </Tooltip>
      <Tooltip title="Medium size tooltip" size="md">
        <Button variant="contained">Medium (md)</Button>
      </Tooltip>
      <Tooltip title="Large size tooltip" size="lg">
        <Button variant="contained">Large (lg)</Button>
      </Tooltip>
    </div>,
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates the Tooltip with different \`size\` props: small, medium, and large.'
      }
    }
  }
}`,...(j=(f=p.parameters)==null?void 0:f.docs)==null?void 0:j.source}}};const C=["Playground","PlacementRight","WithArrow","WithTypography","WithSize"];export{i as PlacementRight,r as Playground,a as WithArrow,p as WithSize,s as WithTypography,C as __namedExportsOrder,q as default};
