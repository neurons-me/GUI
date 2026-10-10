import{j as t,b as B}from"./iframe-q72FflWy.js";import{B as o}from"./Button-DuvGvkXy.js";import"./Paper-9gdP3SeZ.js";import{T as e}from"./Tooltip-DrESC3lI.js";import"./preload-helper-Dp1pzeXC.js";import"./Icon-Doq3uhPc.js";import"./Button-BpF6GA05.js";import"./ButtonBase-D2HnvhjV.js";import"./TransitionGroupContext-4zVEsxkP.js";import"./useForkRef-BR9zNRBO.js";import"./useEventCallback-BVb6jHPB.js";import"./CircularProgress-BunsQ8Ul.js";import"./Paper-C4cHEfmg.js";import"./useSlot-B3Bhjpe0.js";import"./resolveComponentProps-zf7BDQ8X.js";import"./useControlled-DIH1o2g4.js";import"./Grow-C-rRNj8l.js";import"./useSlotProps-DMFXOslT.js";const q={title:"Atoms/Tooltip",component:e,tags:["autodocs"],parameters:{docs:{description:{component:"This Tooltip is a thin wrapper around MUI's Tooltip, supporting all MUI props and the `sx` prop for styling. Use it for helpful hover information, and configure it via JSON/config declaratively."}}}},r={args:{title:"Tooltip text",placement:"top",arrow:!1,size:"md",children:t.jsx(o,{variant:"contained",children:"Hover me"})},argTypes:{title:{control:"text"},placement:{control:"select",options:["top","bottom","left","right"]},arrow:{control:"boolean"},size:{control:"select",options:["sm","md","lg"]}},render:p=>t.jsx(e,{...p,size:p.size,children:p.children})},n={name:"Placement: right",render:()=>t.jsx(e,{title:"Right placed tooltip",placement:"right",children:t.jsx(o,{variant:"contained",children:"Hover right"})}),parameters:{docs:{description:{story:'Tooltip with `placement="right"` demonstrates MUI placement support.'}}}},i={name:"Arrow",render:()=>t.jsx(e,{title:"Tooltip with arrow",arrow:!0,children:t.jsx(o,{variant:"contained",children:"Hover arrow"})}),parameters:{docs:{description:{story:"Tooltip with `arrow={true}` prop shows the arrow, just like MUI."}}}},a={name:"Wrapped Typography",render:()=>t.jsx(e,{title:"Tooltip on text",children:t.jsx(B,{variant:"body1",sx:{cursor:"pointer",display:"inline-block"},children:"Hover this text"})}),parameters:{docs:{description:{story:"Tooltip wrapping a Typography element, showing flexibility and full MUI compatibility."}}}},s={name:"With Size",render:()=>t.jsxs("div",{style:{display:"flex",gap:24},children:[t.jsx(e,{title:"Small size tooltip",size:"sm",children:t.jsx(o,{variant:"contained",children:"Small (sm)"})}),t.jsx(e,{title:"Medium size tooltip",size:"md",children:t.jsx(o,{variant:"contained",children:"Medium (md)"})}),t.jsx(e,{title:"Large size tooltip",size:"lg",children:t.jsx(o,{variant:"contained",children:"Large (lg)"})})]}),parameters:{docs:{description:{story:"Demonstrates the Tooltip with different `size` props: small, medium, and large."}}}},C=["Playground","PlacementRight","WithArrow","WithTypography","WithSize"];var l,c,m;r.parameters={...r.parameters,docs:{...(l=r.parameters)==null?void 0:l.docs,source:{originalSource:`{
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
}`,...(m=(c=r.parameters)==null?void 0:c.docs)==null?void 0:m.source}}};var d,h,g;n.parameters={...n.parameters,docs:{...(d=n.parameters)==null?void 0:d.docs,source:{originalSource:`{
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
}`,...(g=(h=n.parameters)==null?void 0:h.docs)==null?void 0:g.source}}};var u,T,y;i.parameters={...i.parameters,docs:{...(u=i.parameters)==null?void 0:u.docs,source:{originalSource:`{
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
}`,...(y=(T=i.parameters)==null?void 0:T.docs)==null?void 0:y.source}}};var x,w,v;a.parameters={...a.parameters,docs:{...(x=a.parameters)==null?void 0:x.docs,source:{originalSource:`{
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
}`,...(v=(w=a.parameters)==null?void 0:w.docs)==null?void 0:v.source}}};var z,f,j;s.parameters={...s.parameters,docs:{...(z=s.parameters)==null?void 0:z.docs,source:{originalSource:`{
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
}`,...(j=(f=s.parameters)==null?void 0:f.docs)==null?void 0:j.source}}};export{n as PlacementRight,r as Playground,i as WithArrow,s as WithSize,a as WithTypography,C as __namedExportsOrder,q as default};
