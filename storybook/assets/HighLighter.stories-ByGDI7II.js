import{r as y,j as e,k as r,n as a}from"./iframe-9xs7r-yC.js";import{D as h,H as o}from"./HighLighter-D5MWb9_b.js";import"./preload-helper-Dp1pzeXC.js";import"./IconButton-BTVRcgHZ.js";import"./IconButton-2EQKHUpt.js";import"./ButtonBase-CmaSafY6.js";import"./TransitionGroupContext-Ddsw9Vt9.js";import"./useForkRef-CY5C0zUu.js";import"./CircularProgress-Cc9H9qAL.js";import"./Icon-Coo2vCLK.js";import"./Tooltip-lv5D5rZR.js";import"./Tooltip-DsQxmgoN.js";import"./useSlot-Pi2X4fgs.js";import"./resolveComponentProps-Cy9ikCBM.js";import"./useControlled-CR8NUisP.js";import"./Grow-CkmZyC82.js";import"./useSlotProps-CEMoFeCz.js";import"./Drawer-cqwrOwxl.js";import"./dividerClasses-D5nEUdl6.js";import"./useFormControl-Daq17cxB.js";import"./mergeSlotProps-DRRQWfkx.js";import"./Menu-DcUO-yQz.js";import"./isHostComponent-DVu5iVWx.js";import"./Paper-BQJEQDIX.js";import"./List-QlunaKS6.js";import"./TextField-MYNk8PjL.js";import"./createSvgIcon-ApOObPh6.js";import"./isMuiElement-FUZCUFHm.js";import"./ClickAwayListener-Dj6xXrM9.js";const le={title:"Widgets/HighLighter",component:o,parameters:{layout:"centered"},argTypes:{onChange:{action:"change"},colors:{control:"object"},value:{control:"color"},defaultValue:{control:"color"},tooltipSize:{control:{type:"inline-radio"},options:["sm","md","lg","xl"]},placement:{control:{type:"select"},options:["bottom","bottom-end","bottom-start","left","left-end","left-start","right","right-end","right-start","top","top-end","top-start"]},iconName:{control:"text"},iconSize:{control:"text"},title:{control:"text"},disabled:{control:"boolean"},className:{table:{disable:!0}},style:{table:{disable:!0}}},args:{title:"Highlighter",tooltipSize:"md",placement:"right",iconName:"ink_marker",iconSize:22,colors:h,defaultValue:h[0],disabled:!1}},l={render:t=>e.jsxs(r,{sx:{display:"flex",alignItems:"center",gap:2},children:[e.jsx(o,{...t}),e.jsx(a,{variant:"body2",sx:{opacity:.7},children:"Click highlighter → pick a color"})]})},n={render:t=>e.jsxs(r,{sx:{display:"flex",alignItems:"center",gap:2},children:[e.jsx(o,{...t,tooltipSize:"sm",title:"sm"}),e.jsx(o,{...t,tooltipSize:"md",title:"md"}),e.jsx(o,{...t,tooltipSize:"lg",title:"lg"}),e.jsx(o,{...t,tooltipSize:"xl",title:"xl"})]}),parameters:{controls:{exclude:["tooltipSize","title"]}}},p={args:{title:"Pick a neon",colors:["#00F5D4","#F15BB5","#FEE440","#00BBF9","#9B5DE5"],defaultValue:"#FEE440"},render:t=>e.jsxs(r,{sx:{display:"flex",alignItems:"center",gap:2},children:[e.jsx(o,{...t}),e.jsx(a,{variant:"body2",sx:{opacity:.7},children:"Custom 5-color palette"})]})},c={render:t=>{const[g,m]=y.useState(h[2]);return y.useEffect(()=>{const s=i=>{var x;(x=i==null?void 0:i.detail)!=null&&x.color&&m(i.detail.color)};return window.addEventListener("gui:highlighter",s),()=>window.removeEventListener("gui:highlighter",s)},[]),e.jsxs(r,{sx:{display:"flex",flexDirection:"column",gap:1.5,minWidth:320},children:[e.jsxs(r,{sx:{display:"flex",alignItems:"center",gap:2},children:[e.jsx(o,{...t,value:g,onChange:s=>{var i;m(s),(i=t==null?void 0:t.onChange)==null||i.call(t,s)}}),e.jsx(a,{variant:"body2",sx:{opacity:.7},children:"Controlled color"})]}),e.jsxs(r,{sx:{display:"flex",alignItems:"center",gap:1},children:[e.jsx(a,{variant:"caption",sx:{opacity:.7},children:"Selected:"}),e.jsx(r,{sx:{width:14,height:14,borderRadius:999,bgcolor:g,border:"1px solid",borderColor:"divider"}}),e.jsx(a,{variant:"caption",sx:{fontFamily:"monospace"},children:g})]})]})},parameters:{controls:{exclude:["value","defaultValue"]}}},d={args:{disabled:!0},render:t=>e.jsxs(r,{sx:{display:"flex",alignItems:"center",gap:2},children:[e.jsx(o,{...t}),e.jsx(a,{variant:"body2",sx:{opacity:.7},children:"Disabled"})]})};var u,f,b;l.parameters={...l.parameters,docs:{...(u=l.parameters)==null?void 0:u.docs,source:{originalSource:`{
  render: args => <Box sx={{
    display: 'flex',
    alignItems: 'center',
    gap: 2
  }}>
      <HighLighter {...args as HighLighterProps} />
      <Typography variant="body2" sx={{
      opacity: 0.7
    }}>
        Click highlighter → pick a color
      </Typography>
    </Box>
}`,...(b=(f=l.parameters)==null?void 0:f.docs)==null?void 0:b.source}}};var L,S,B;n.parameters={...n.parameters,docs:{...(L=n.parameters)==null?void 0:L.docs,source:{originalSource:`{
  render: args => <Box sx={{
    display: 'flex',
    alignItems: 'center',
    gap: 2
  }}>
      <HighLighter {...args as HighLighterProps} tooltipSize="sm" title="sm" />
      <HighLighter {...args as HighLighterProps} tooltipSize="md" title="md" />
      <HighLighter {...args as HighLighterProps} tooltipSize="lg" title="lg" />
      <HighLighter {...args as HighLighterProps} tooltipSize="xl" title="xl" />
    </Box>,
  parameters: {
    controls: {
      exclude: ['tooltipSize', 'title']
    }
  }
}`,...(B=(S=n.parameters)==null?void 0:S.docs)==null?void 0:B.source}}};var j,v,H;p.parameters={...p.parameters,docs:{...(j=p.parameters)==null?void 0:j.docs,source:{originalSource:`{
  args: {
    title: 'Pick a neon',
    colors: ['#00F5D4', '#F15BB5', '#FEE440', '#00BBF9', '#9B5DE5'],
    defaultValue: '#FEE440'
  },
  render: args => <Box sx={{
    display: 'flex',
    alignItems: 'center',
    gap: 2
  }}>
      <HighLighter {...args as HighLighterProps} />
      <Typography variant="body2" sx={{
      opacity: 0.7
    }}>
        Custom 5-color palette
      </Typography>
    </Box>
}`,...(H=(v=p.parameters)==null?void 0:v.docs)==null?void 0:H.source}}};var C,E,z;c.parameters={...c.parameters,docs:{...(C=c.parameters)==null?void 0:C.docs,source:{originalSource:`{
  render: args => {
    const [color, setColor] = React.useState<string>(DEFAULT_COLORS[2]);
    React.useEffect(() => {
      const onHighLighter = (e: any) => {
        if (e?.detail?.color) setColor(e.detail.color);
      };
      window.addEventListener('gui:highlighter', onHighLighter as any);
      return () => window.removeEventListener('gui:highlighter', onHighLighter as any);
    }, []);
    return <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      gap: 1.5,
      minWidth: 320
    }}>
        <Box sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2
      }}>
          <HighLighter {...args as HighLighterProps} value={color} onChange={c => {
          setColor(c);
          (args as any)?.onChange?.(c);
        }} />
          <Typography variant="body2" sx={{
          opacity: 0.7
        }}>
            Controlled color
          </Typography>
        </Box>

        <Box sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1
      }}>
          <Typography variant="caption" sx={{
          opacity: 0.7
        }}>
            Selected:
          </Typography>
          <Box sx={{
          width: 14,
          height: 14,
          borderRadius: 999,
          bgcolor: color,
          border: '1px solid',
          borderColor: 'divider'
        }} />
          <Typography variant="caption" sx={{
          fontFamily: 'monospace'
        }}>
            {color}
          </Typography>
        </Box>
      </Box>;
  },
  parameters: {
    controls: {
      exclude: ['value', 'defaultValue']
    }
  }
}`,...(z=(E=c.parameters)==null?void 0:E.docs)==null?void 0:z.source}}};var T,F,P;d.parameters={...d.parameters,docs:{...(T=d.parameters)==null?void 0:T.docs,source:{originalSource:`{
  args: {
    disabled: true
  },
  render: args => <Box sx={{
    display: 'flex',
    alignItems: 'center',
    gap: 2
  }}>
      <HighLighter {...args as HighLighterProps} />
      <Typography variant="body2" sx={{
      opacity: 0.7
    }}>
        Disabled
      </Typography>
    </Box>
}`,...(P=(F=d.parameters)==null?void 0:F.docs)==null?void 0:P.source}}};const ne=["Playground","Sizes","CustomPalette","Controlled","Disabled"];export{c as Controlled,p as CustomPalette,d as Disabled,l as Playground,n as Sizes,ne as __namedExportsOrder,le as default};
