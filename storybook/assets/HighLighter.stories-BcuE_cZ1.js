import{r as y,j as e,g as r,h as i}from"./iframe-q72FflWy.js";import{D as h,H as o}from"./HighLighter-BmTx7Rq_.js";import"./preload-helper-Dp1pzeXC.js";import"./IconButton-D9uKbFdE.js";import"./IconButton-0qTeMK6V.js";import"./ButtonBase-D2HnvhjV.js";import"./TransitionGroupContext-4zVEsxkP.js";import"./useForkRef-BR9zNRBO.js";import"./useEventCallback-BVb6jHPB.js";import"./CircularProgress-BunsQ8Ul.js";import"./Icon-Doq3uhPc.js";import"./Tooltip-DrESC3lI.js";import"./useSlot-B3Bhjpe0.js";import"./resolveComponentProps-zf7BDQ8X.js";import"./useControlled-DIH1o2g4.js";import"./Grow-C-rRNj8l.js";import"./useSlotProps-DMFXOslT.js";import"./Drawer-DMbbDWRX.js";import"./dividerClasses-BXru1jN1.js";import"./useFormControl-BGm5bEiu.js";import"./mergeSlotProps-BtuGLXbb.js";import"./Menu-DFKCKfQm.js";import"./isHostComponent-DVu5iVWx.js";import"./Paper-C4cHEfmg.js";import"./List-DvvFCGIp.js";import"./TextField-BSNRPa5x.js";import"./createSvgIcon-DOR6FtI1.js";import"./isMuiElement-CKqkPfIO.js";import"./ClickAwayListener-BSxDORVV.js";const se={title:"Widgets/HighLighter",component:o,parameters:{layout:"centered"},argTypes:{onChange:{action:"change"},colors:{control:"object"},value:{control:"color"},defaultValue:{control:"color"},tooltipSize:{control:{type:"inline-radio"},options:["sm","md","lg","xl"]},placement:{control:{type:"select"},options:["bottom","bottom-end","bottom-start","left","left-end","left-start","right","right-end","right-start","top","top-end","top-start"]},iconName:{control:"text"},iconSize:{control:"text"},title:{control:"text"},disabled:{control:"boolean"},className:{table:{disable:!0}},style:{table:{disable:!0}}},args:{title:"Highlighter",tooltipSize:"md",placement:"right",iconName:"ink_marker",iconSize:22,colors:h,defaultValue:h[0],disabled:!1}},s={render:t=>e.jsxs(r,{sx:{display:"flex",alignItems:"center",gap:2},children:[e.jsx(o,{...t}),e.jsx(i,{variant:"body2",sx:{opacity:.7},children:"Click highlighter → pick a color"})]})},l={render:t=>e.jsxs(r,{sx:{display:"flex",alignItems:"center",gap:2},children:[e.jsx(o,{...t,tooltipSize:"sm",title:"sm"}),e.jsx(o,{...t,tooltipSize:"md",title:"md"}),e.jsx(o,{...t,tooltipSize:"lg",title:"lg"}),e.jsx(o,{...t,tooltipSize:"xl",title:"xl"})]}),parameters:{controls:{exclude:["tooltipSize","title"]}}},p={args:{title:"Pick a neon",colors:["#00F5D4","#F15BB5","#FEE440","#00BBF9","#9B5DE5"],defaultValue:"#FEE440"},render:t=>e.jsxs(r,{sx:{display:"flex",alignItems:"center",gap:2},children:[e.jsx(o,{...t}),e.jsx(i,{variant:"body2",sx:{opacity:.7},children:"Custom 5-color palette"})]})},c={render:t=>{const[g,m]=y.useState(h[2]);return y.useEffect(()=>{const a=n=>{var x;(x=n==null?void 0:n.detail)!=null&&x.color&&m(n.detail.color)};return window.addEventListener("gui:highlighter",a),()=>window.removeEventListener("gui:highlighter",a)},[]),e.jsxs(r,{sx:{display:"flex",flexDirection:"column",gap:1.5,minWidth:320},children:[e.jsxs(r,{sx:{display:"flex",alignItems:"center",gap:2},children:[e.jsx(o,{...t,value:g,onChange:a=>{var n;m(a),(n=t==null?void 0:t.onChange)==null||n.call(t,a)}}),e.jsx(i,{variant:"body2",sx:{opacity:.7},children:"Controlled color"})]}),e.jsxs(r,{sx:{display:"flex",alignItems:"center",gap:1},children:[e.jsx(i,{variant:"caption",sx:{opacity:.7},children:"Selected:"}),e.jsx(r,{sx:{width:14,height:14,borderRadius:999,bgcolor:g,border:"1px solid",borderColor:"divider"}}),e.jsx(i,{variant:"caption",sx:{fontFamily:"monospace"},children:g})]})]})},parameters:{controls:{exclude:["value","defaultValue"]}}},d={args:{disabled:!0},render:t=>e.jsxs(r,{sx:{display:"flex",alignItems:"center",gap:2},children:[e.jsx(o,{...t}),e.jsx(i,{variant:"body2",sx:{opacity:.7},children:"Disabled"})]})},le=["Playground","Sizes","CustomPalette","Controlled","Disabled"];var u,f,b;s.parameters={...s.parameters,docs:{...(u=s.parameters)==null?void 0:u.docs,source:{originalSource:`{
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
}`,...(b=(f=s.parameters)==null?void 0:f.docs)==null?void 0:b.source}}};var L,S,B;l.parameters={...l.parameters,docs:{...(L=l.parameters)==null?void 0:L.docs,source:{originalSource:`{
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
}`,...(B=(S=l.parameters)==null?void 0:S.docs)==null?void 0:B.source}}};var j,v,H;p.parameters={...p.parameters,docs:{...(j=p.parameters)==null?void 0:j.docs,source:{originalSource:`{
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
}`,...(P=(F=d.parameters)==null?void 0:F.docs)==null?void 0:P.source}}};export{c as Controlled,p as CustomPalette,d as Disabled,s as Playground,l as Sizes,le as __namedExportsOrder,se as default};
