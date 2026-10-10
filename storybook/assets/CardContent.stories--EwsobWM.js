import{j as n,h as r}from"./iframe-q72FflWy.js";import{C as t}from"./CardContent-Cvz75zDw.js";import"./preload-helper-Dp1pzeXC.js";const y={title:"Molecules/Cards/Card/CardContent",component:t,tags:["autodocs"]},a={render:()=>n.jsx(t,{children:n.jsx(r,{variant:"body1",children:"This is the main content area inside a card. You can place any children here."})}),name:"Basic CardContent"},e={render:()=>n.jsxs(t,{sx:{p:4},children:[n.jsx(r,{variant:"h6",children:"Custom Padding"}),n.jsx(r,{variant:"body2",children:"This CardContent component has extra padding applied via the `sx` prop."})]}),name:"CardContent with sx"},x=["BasicContent","WithPaddingAndText"];var o,s,d;a.parameters={...a.parameters,docs:{...(o=a.parameters)==null?void 0:o.docs,source:{originalSource:`{
  render: () => <CardContent>
      <Typography variant="body1">
        This is the main content area inside a card. You can place any children here.
      </Typography>
    </CardContent>,
  name: 'Basic CardContent'
}`,...(d=(s=a.parameters)==null?void 0:s.docs)==null?void 0:d.source}}};var i,p,c;e.parameters={...e.parameters,docs:{...(i=e.parameters)==null?void 0:i.docs,source:{originalSource:`{
  render: () => <CardContent sx={{
    p: 4
  }}>
      <Typography variant="h6">Custom Padding</Typography>
      <Typography variant="body2">
        This CardContent component has extra padding applied via the \`sx\` prop.
      </Typography>
    </CardContent>,
  name: 'CardContent with sx'
}`,...(c=(p=e.parameters)==null?void 0:p.docs)==null?void 0:c.source}}};export{a as BasicContent,e as WithPaddingAndText,x as __namedExportsOrder,y as default};
