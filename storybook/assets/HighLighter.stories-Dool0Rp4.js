import{r as y,j as e,q as r,v as a}from"./iframe-jME6TRyu.js";import{D as h,H as o}from"./HighLighter-9hlmU1EY.js";import"./preload-helper-Dp1pzeXC.js";import"./IconButton-DRNOYwhc.js";import"./IconButton-CwIzlmuT.js";import"./ButtonBase-BOSaDjG-.js";import"./TransitionGroupContext-BRZCH32N.js";import"./useForkRef-z1e785Ns.js";import"./CircularProgress-DVHqJ1WQ.js";import"./Icon-BtaMh9kU.js";import"./Tooltip-B6C2EAF_.js";import"./Tooltip-Bce4NUBE.js";import"./useSlot-C61ruhcO.js";import"./resolveComponentProps-BQXnF4aQ.js";import"./useControlled-Cu8K_Z2u.js";import"./Grow-CX1iIK_S.js";import"./useSlotProps-BeRtKzOs.js";import"./Drawer-BTZ0yApO.js";import"./dividerClasses-C2APwgbx.js";import"./useFormControl-D8HjSUmZ.js";import"./mergeSlotProps-Dul5GYdh.js";import"./Menu-L0v-vIF4.js";import"./isHostComponent-DVu5iVWx.js";import"./Paper-Ndu2Ngkb.js";import"./List-PPc6luvu.js";import"./TextField-BFarGitF.js";import"./createSvgIcon-jWV4H6K5.js";import"./isMuiElement-DBbgm_fz.js";import"./ClickAwayListener-CcqAauPL.js";const le={title:"Widgets/HighLighter",component:o,parameters:{layout:"centered"},argTypes:{onChange:{action:"change"},colors:{control:"object"},value:{control:"color"},defaultValue:{control:"color"},tooltipSize:{control:{type:"inline-radio"},options:["sm","md","lg","xl"]},placement:{control:{type:"select"},options:["bottom","bottom-end","bottom-start","left","left-end","left-start","right","right-end","right-start","top","top-end","top-start"]},iconName:{control:"text"},iconSize:{control:"text"},title:{control:"text"},disabled:{control:"boolean"},className:{table:{disable:!0}},style:{table:{disable:!0}}},args:{title:"Highlighter",tooltipSize:"md",placement:"right",iconName:"ink_marker",iconSize:22,colors:h,defaultValue:h[0],disabled:!1}},l={render:t=>e.jsxs(r,{sx:{display:"flex",alignItems:"center",gap:2},children:[e.jsx(o,{...t}),e.jsx(a,{variant:"body2",sx:{opacity:.7},children:"Click highlighter → pick a color"})]})},n={render:t=>e.jsxs(r,{sx:{display:"flex",alignItems:"center",gap:2},children:[e.jsx(o,{...t,tooltipSize:"sm",title:"sm"}),e.jsx(o,{...t,tooltipSize:"md",title:"md"}),e.jsx(o,{...t,tooltipSize:"lg",title:"lg"}),e.jsx(o,{...t,tooltipSize:"xl",title:"xl"})]}),parameters:{controls:{exclude:["tooltipSize","title"]}}},p={args:{title:"Pick a neon",colors:["#00F5D4","#F15BB5","#FEE440","#00BBF9","#9B5DE5"],defaultValue:"#FEE440"},render:t=>e.jsxs(r,{sx:{display:"flex",alignItems:"center",gap:2},children:[e.jsx(o,{...t}),e.jsx(a,{variant:"body2",sx:{opacity:.7},children:"Custom 5-color palette"})]})},c={render:t=>{const[g,m]=y.useState(h[2]);return y.useEffect(()=>{const s=i=>{var x;(x=i==null?void 0:i.detail)!=null&&x.color&&m(i.detail.color)};return window.addEventListener("gui:highlighter",s),()=>window.removeEventListener("gui:highlighter",s)},[]),e.jsxs(r,{sx:{display:"flex",flexDirection:"column",gap:1.5,minWidth:320},children:[e.jsxs(r,{sx:{display:"flex",alignItems:"center",gap:2},children:[e.jsx(o,{...t,value:g,onChange:s=>{var i;m(s),(i=t==null?void 0:t.onChange)==null||i.call(t,s)}}),e.jsx(a,{variant:"body2",sx:{opacity:.7},children:"Controlled color"})]}),e.jsxs(r,{sx:{display:"flex",alignItems:"center",gap:1},children:[e.jsx(a,{variant:"caption",sx:{opacity:.7},children:"Selected:"}),e.jsx(r,{sx:{width:14,height:14,borderRadius:999,bgcolor:g,border:"1px solid",borderColor:"divider"}}),e.jsx(a,{variant:"caption",sx:{fontFamily:"monospace"},children:g})]})]})},parameters:{controls:{exclude:["value","defaultValue"]}}},d={args:{disabled:!0},render:t=>e.jsxs(r,{sx:{display:"flex",alignItems:"center",gap:2},children:[e.jsx(o,{...t}),e.jsx(a,{variant:"body2",sx:{opacity:.7},children:"Disabled"})]})};var u,f,b;l.parameters={...l.parameters,docs:{...(u=l.parameters)==null?void 0:u.docs,source:{originalSource:`{
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
}`,...(b=(f=l.parameters)==null?void 0:f.docs)==null?void 0:b.source}}};var L,S,v;n.parameters={...n.parameters,docs:{...(L=n.parameters)==null?void 0:L.docs,source:{originalSource:`{
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
}`,...(v=(S=n.parameters)==null?void 0:S.docs)==null?void 0:v.source}}};var B,j,H;p.parameters={...p.parameters,docs:{...(B=p.parameters)==null?void 0:B.docs,source:{originalSource:`{
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
}`,...(H=(j=p.parameters)==null?void 0:j.docs)==null?void 0:H.source}}};var C,E,z;c.parameters={...c.parameters,docs:{...(C=c.parameters)==null?void 0:C.docs,source:{originalSource:`{
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
