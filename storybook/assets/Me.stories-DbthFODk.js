import{j as n,T as h,B as s,a as m,r as u}from"./iframe-9xs7r-yC.js";import{U as g}from"./me.es-Bc6mvw-6.js";import"./Button-BZ2a02w5.js";import"./Paper-D3ZYW61L.js";import{M as o,r as y,w as f}from"./Me-ZtnEgqM2.js";import{a as B}from"./useMe-DHtk1syU.js";import"./preload-helper-Dp1pzeXC.js";import"./Icon-Coo2vCLK.js";import"./Button-2IZqaMH4.js";import"./ButtonBase-CmaSafY6.js";import"./TransitionGroupContext-Ddsw9Vt9.js";import"./useForkRef-CY5C0zUu.js";import"./CircularProgress-Cc9H9qAL.js";import"./Paper-BQJEQDIX.js";const{expect:r,within:j}=__STORYBOOK_MODULE_TEST__,W={title:"All.This/Me",component:o,parameters:{layout:"padded"}};function T({id:e}){const t=B();return n.jsxs(s,{"data-testid":`${e}.reading`,sx:{display:"grid",gridTemplateColumns:"auto 1fr",columnGap:2,fontFamily:"monospace",fontSize:13},children:[n.jsx("span",{style:{opacity:.55},children:"found"}),n.jsx("span",{"data-testid":`${e}.found`,children:t?"yes":"no"}),n.jsx("span",{style:{opacity:.55},children:"username"}),n.jsx("span",{"data-testid":`${e}.username`,children:y(t==null?void 0:t.me)||"—"})]})}class b extends u.Component{constructor(){super(...arguments),this.state={error:null}}static getDerivedStateFromError(t){return{error:t}}render(){return this.state.error?n.jsxs(s,{"data-testid":`${this.props.id}.error`,sx:{fontFamily:"monospace",fontSize:13,color:"error.main"},children:["throws: ",this.state.error.message]}):this.props.children}}const d=new g;f(d,"robot-1");const M=[{id:"bare",code:"<Me>",note:"a local runtime: made here, no handle, no permission, no network",render:e=>n.jsx(o,{children:e})},{id:"handle",code:'<Me username="Ana">',note:"the handle is normalized; it proves nothing about who is here",render:e=>n.jsx(o,{username:"Ana",children:e})},{id:"existing",code:"<Me me={kernel}>",note:"a .me that already exists, provided as it is",render:e=>n.jsx(o,{me:d,children:e})},{id:"through",code:'<Me username="outer"><Me me={null}>',note:"null provides nothing here: what sits above passes through",render:e=>n.jsx(o,{username:"outer",children:n.jsx(o,{me:null,children:e})})},{id:"both",code:'<Me me={kernel} username="ana">',note:"two sources for one .me: an error, not a precedence rule",render:e=>n.jsx(o,{me:d,username:"ana",children:e})},{id:"none",code:"(no <Me>)",note:"nothing is found, nothing is invented",render:e=>e}],i={render:()=>n.jsx(h,{children:n.jsx(s,{sx:{display:"flex",flexDirection:"column",gap:2.5,maxWidth:760},children:M.map(e=>n.jsxs(s,{sx:{display:"grid",gridTemplateColumns:"minmax(0, 1fr) minmax(0, 1fr)",gap:3,alignItems:"start"},children:[n.jsxs(s,{children:[n.jsx(m,{component:"code",sx:{fontFamily:"monospace",fontSize:13},children:e.code}),n.jsx(m,{variant:"caption",sx:{display:"block",opacity:.65,mt:.5},children:e.note})]}),n.jsx(b,{id:e.id,children:e.render(n.jsx(T,{id:e.id}))})]},e.id))})}),play:async({canvasElement:e})=>{const t=j(e),a=x=>t.getByTestId(x).textContent;r(a("bare.found")).toBe("yes"),r(a("bare.username")).toBe("—"),r(a("handle.username")).toBe("ana"),r(a("existing.username")).toBe("robot-1"),r(a("through.username")).toBe("outer"),r(t.getByTestId("both.error").textContent).toMatch(/either `me` or `username`, not both/),r(a("none.found")).toBe("no")}};var c,p,l;i.parameters={...i.parameters,docs:{...(c=i.parameters)==null?void 0:c.docs,source:{originalSource:`{
  render: () => <Theme>
      <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      gap: 2.5,
      maxWidth: 760
    }}>
        {ROWS.map(row => <Box key={row.id} sx={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
        gap: 3,
        alignItems: 'start'
      }}>
            <Box>
              <Typography component="code" sx={{
            fontFamily: 'monospace',
            fontSize: 13
          }}>{row.code}</Typography>
              <Typography variant="caption" sx={{
            display: 'block',
            opacity: 0.65,
            mt: 0.5
          }}>{row.note}</Typography>
            </Box>
            <Catch id={row.id}>{row.render(<Reading id={row.id} />)}</Catch>
          </Box>)}
      </Box>
    </Theme>,
  play: async ({
    canvasElement
  }: {
    canvasElement: HTMLElement;
  }) => {
    const c = within(canvasElement);
    const text = (id: string) => c.getByTestId(id).textContent;
    expect(text('bare.found')).toBe('yes');
    expect(text('bare.username')).toBe('—');
    expect(text('handle.username')).toBe('ana');
    expect(text('existing.username')).toBe('robot-1');
    expect(text('through.username')).toBe('outer');
    expect(c.getByTestId('both.error').textContent).toMatch(/either \`me\` or \`username\`, not both/);
    expect(text('none.found')).toBe('no');
  }
}`,...(l=(p=i.parameters)==null?void 0:p.docs)==null?void 0:l.source}}};const $=["Contract"];export{i as Contract,$ as __namedExportsOrder,W as default};
