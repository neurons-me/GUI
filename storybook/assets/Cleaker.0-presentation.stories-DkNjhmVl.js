import{r as o,j as e,T as C}from"./iframe-9xs7r-yC.js";import{M as v}from"./Me-ZtnEgqM2.js";import{C as s}from"./Cleaker-DikeGFn3.js";import{C as y}from"./Namespace-D9gkYb_H.js";import"./preload-helper-Dp1pzeXC.js";import"./me.es-Bc6mvw-6.js";import"./useMe-DHtk1syU.js";import"./SeedSessionProvider-CJYajgaO.js";import"./createSeedSession-Cnw1UJ_Z.js";import"./cleaker.es-CjbQ9B8Y.js";import"./sha3-B6us4W0r.js";import"./localIdentityVault-s9IV2zl-.js";import"./namespaceExpression-BVgbVshn.js";import"./Router-CtcOA8u9.js";import"./Gauge-b94eazVZ.js";import"./Icon-Coo2vCLK.js";import"./IconButton-BTVRcgHZ.js";import"./IconButton-2EQKHUpt.js";import"./ButtonBase-CmaSafY6.js";import"./TransitionGroupContext-Ddsw9Vt9.js";import"./useForkRef-CY5C0zUu.js";import"./CircularProgress-Cc9H9qAL.js";import"./Avatar-CYaJ7BCk.js";import"./Avatar-CHOZ5ucK.js";import"./createSvgIcon-ApOObPh6.js";import"./useSlot-Pi2X4fgs.js";import"./resolveComponentProps-Cy9ikCBM.js";import"./TextField-MYNk8PjL.js";import"./useFormControl-Daq17cxB.js";import"./isHostComponent-DVu5iVWx.js";import"./Menu-DcUO-yQz.js";import"./useSlotProps-CEMoFeCz.js";import"./Paper-BQJEQDIX.js";import"./Grow-CkmZyC82.js";import"./mergeSlotProps-DRRQWfkx.js";import"./List-QlunaKS6.js";import"./useControlled-CR8NUisP.js";import"./isMuiElement-FUZCUFHm.js";import"./Drawer-cqwrOwxl.js";import"./dividerClasses-D5nEUdl6.js";import"./Button-BZ2a02w5.js";import"./Button-2IZqaMH4.js";import"./Paper-D3ZYW61L.js";import"./Progress-BGC2gmP_.js";import"./Toolbar-DWHH-c6u.js";import"./QR.me-Bvj1XMys.js";import"./Tooltip-lv5D5rZR.js";import"./Tooltip-DsQxmgoN.js";import"./QR-zlQ_2wL-.js";import"./PixelWordmark-B2V_vzxG.js";import"./Usernames-BFt9--96.js";import"./Hero-DtS3rAl9.js";import"./ListItemIcon-B7hmZwSO.js";import"./listItemIconClasses-Cdc3Z4Nj.js";import"./ListItemText-CYWXZB3q.js";import"./listItemTextClasses-BzoRJwRN.js";import"./BlocksTable-8EIpsTSt.js";import"./Layout-QLLA4hI-.js";import"./LeftSidebarContext-BrhIWWPt.js";import"./TopBar-Do5biIaO.js";import"./MenuItem-BkjhmDcg.js";import"./getThemeProps-CazJCMyU.js";import"./useInsets-22zt3sYs.js";import"./AppBar-DPKQgtSA.js";import"./Collapse-odiP-9li.js";import"./guiNodeId-DJ3aagPX.js";import"./AppBar-Dmb1gXWb.js";import"./StickyOptionsTop-kiA05J4G.js";import"./CleakerKeychain-3Ch3zwnT.js";import"./monad0-DERkp9hZ.js";import"./Beatle.types-TpO9Dang.js";import"./MainServerView-CdJ2qdMM.js";import"./GatewaySetup-C7iXrAE6.js";import"./trustedOrigin-D_D34UBw.js";import"./MeLauncher-34EzHg0V.js";import"./ToggleMode-CzfRQfpo.js";import"./Switch-mRDlh_NQ.js";import"./Catalog-pnXTJw_c.js";import"./Grid-BU7vnbbY.js";import"./Card-sdbIOuu5.js";import"./CardHeader-DWSck0li.js";import"./CardContent-C5vdOauO.js";import"./CardActions-6DgZnnbm.js";import"./Chip-BidilwWo.js";import"./Chip-B6SWnBIe.js";import"./DialogContent-JK0j1kKi.js";import"./launcherPopover-3_4gpU-8.js";import"./ClickAwayListener-Dj6xXrM9.js";import"./IdentityIconRow-zOvSJbV0.js";import"./Claim-pc_wwVn8.js";import"./Passphrase-Dipj0EKH.js";import"./RecoverAccount-DYRqaOnL.js";function S(r,k=900){return(p=>{const[g,a]=o.useState({expression:null,resolved:[],state:"idle"}),t=o.useRef(null),E=o.useCallback(m=>{t.current&&clearTimeout(t.current);const c=p.replace(/^wss?:\/\//,"").replace(/\/.*$/,""),l=r(c);a({expression:null,resolved:[],state:"connecting"}),l!=="hang"&&(t.current=setTimeout(()=>{a(l==="connect"?{expression:{raw:m,ast:{kind:"namespace",value:m}},resolved:[`https://${c}/${m}`],state:"connected"}:{expression:null,resolved:[],state:"error",error:"WebSocket error"})},k))},[p]);return o.useEffect(()=>()=>{t.current&&clearTimeout(t.current)},[]),{channel:g,open:E,send:()=>{},disconnect:()=>{}}})}const T=async()=>new Response("<!doctype html><title>no</title>",{status:200,headers:{"content-type":"text/html"}}),N={fetchImpl:T,useChannel:S(r=>r==="cleaker.me"?"connect":"error")},j={fetchImpl:T,useChannel:S(()=>"hang")},hr={title:"All.This/Cleaker",component:s,parameters:{layout:"fullscreen"}},n={render:()=>e.jsx(C,{children:e.jsx(v,{children:e.jsx(s,{namespace:"cleaker.me"})})})},i={args:{otherHost:"answers"},argTypes:{otherHost:{control:"inline-radio",options:["answers","never finishes"]}},render:({otherHost:r})=>e.jsx(y.Provider,{value:r==="answers"?N:j,children:e.jsx(C,{children:e.jsx(v,{children:e.jsx(s,{namespace:typeof window<"u"?window.location.hostname:"localhost"})})})},r)};var h,d,u;n.parameters={...n.parameters,docs:{...(h=n.parameters)==null?void 0:h.docs,source:{originalSource:`{
  render: () => <Theme>
      <Me>
        <Cleaker namespace="cleaker.me" />
      </Me>
    </Theme>
}`,...(u=(d=n.parameters)==null?void 0:d.docs)==null?void 0:u.source}}};var f,x,w;i.parameters={...i.parameters,docs:{...(f=i.parameters)==null?void 0:f.docs,source:{originalSource:`{
  args: {
    otherHost: "answers"
  },
  argTypes: {
    otherHost: {
      control: "inline-radio",
      options: ["answers", "never finishes"]
    }
  },
  render: ({
    otherHost
  }) =>
  // keyed: changing the control starts the flow over, with the other channel
  <ConnectionSeamsContext.Provider key={otherHost} value={otherHost === "answers" ? NOTHING_ANSWERS : NEVER_ANSWERS}>
      <Theme>
        <Me>
          <Cleaker namespace={typeof window !== "undefined" ? window.location.hostname : "localhost"} />
        </Me>
      </Theme>
    </ConnectionSeamsContext.Provider>
}`,...(w=(x=i.parameters)==null?void 0:x.docs)==null?void 0:w.source}}};const dr=["Default","Flow"];export{n as Default,i as Flow,dr as __namedExportsOrder,hr as default};
