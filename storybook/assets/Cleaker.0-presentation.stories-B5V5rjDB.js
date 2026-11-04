import{r as o,j as e,T as C}from"./iframe-jME6TRyu.js";import{M as v}from"./Me-BiMHlleP.js";import{C as s}from"./Cleaker-CFcuedBl.js";import{C as y}from"./Namespace-pLtMG_dk.js";import"./preload-helper-Dp1pzeXC.js";import"./me.es-Bc6mvw-6.js";import"./useMe-BLlmhYK8.js";import"./SeedSessionProvider-WgLw3Avs.js";import"./createSeedSession-IqPz_N66.js";import"./cleaker.es-CjbQ9B8Y.js";import"./sha3-BJbA_H_U.js";import"./localIdentityVault-s9IV2zl-.js";import"./namespaceExpression-SyapK5lK.js";import"./Router-Corsctrc.js";import"./Gauge-D4KJyjrU.js";import"./Icon-BtaMh9kU.js";import"./IconButton-DRNOYwhc.js";import"./IconButton-CwIzlmuT.js";import"./ButtonBase-BOSaDjG-.js";import"./TransitionGroupContext-BRZCH32N.js";import"./useForkRef-z1e785Ns.js";import"./CircularProgress-DVHqJ1WQ.js";import"./Avatar-CMm04gBo.js";import"./Avatar-DUU9vCmx.js";import"./createSvgIcon-jWV4H6K5.js";import"./useSlot-C61ruhcO.js";import"./resolveComponentProps-BQXnF4aQ.js";import"./TextField-BFarGitF.js";import"./useFormControl-D8HjSUmZ.js";import"./isHostComponent-DVu5iVWx.js";import"./Menu-L0v-vIF4.js";import"./useSlotProps-BeRtKzOs.js";import"./Paper-Ndu2Ngkb.js";import"./Grow-CX1iIK_S.js";import"./mergeSlotProps-Dul5GYdh.js";import"./List-PPc6luvu.js";import"./useControlled-Cu8K_Z2u.js";import"./isMuiElement-DBbgm_fz.js";import"./Drawer-BTZ0yApO.js";import"./dividerClasses-C2APwgbx.js";import"./Button-ffxJjIdt.js";import"./Button-CLDQrykt.js";import"./Paper-D0AE__Fu.js";import"./Progress-C5lx_x92.js";import"./Toolbar-DdnHZP3c.js";import"./QR.me-BP2QBDUV.js";import"./Tooltip-B6C2EAF_.js";import"./Tooltip-Bce4NUBE.js";import"./QR-BYa4MQd7.js";import"./PixelWordmark-BbsAJd6c.js";import"./Usernames-CoQsE7ms.js";import"./ListItemIcon-o5ylfJzT.js";import"./listItemIconClasses-Drtk4guX.js";import"./ListItemText-CvGTrX3g.js";import"./listItemTextClasses-BTSdieEv.js";import"./BlocksTable-CJvlEEo9.js";import"./Layout-Btydy1op.js";import"./LeftSidebarContext-0nKdfSJy.js";import"./TopBar-B1alHL9F.js";import"./MenuItem-c5vDCIh9.js";import"./getThemeProps-DE7h1-OS.js";import"./useInsets-CKXJqeOA.js";import"./AppBar-BxWGBjFT.js";import"./Collapse-BL-D4z3B.js";import"./guiNodeId-BzEceGv0.js";import"./AppBar-DqPSf1ZM.js";import"./StickyOptionsTop-0ltDjcW1.js";import"./CleakerKeychain-D8OIRV12.js";import"./monad0-BgFL_hps.js";import"./Beatle.types-AGXL34V0.js";import"./MainServerView-BaqpIyuA.js";import"./GatewaySetup-DLgLoaQS.js";import"./trustedOrigin-D_D34UBw.js";import"./MeLauncher-CO5nsctN.js";import"./ToggleMode-BqybOH1d.js";import"./Switch-CuvxAeRe.js";import"./Catalog-B8LgeKq2.js";import"./Grid-Brlr0zl3.js";import"./Card-etWH-ubF.js";import"./CardHeader-CTlE-lHx.js";import"./CardContent-DLedHnFw.js";import"./CardActions-B_8qZ23L.js";import"./Chip-DQ5bhbiN.js";import"./Chip-C8_TmJNg.js";import"./DialogContent-Div9ybpi.js";import"./launcherPopover-DZUUUYAU.js";import"./ClickAwayListener-CcqAauPL.js";import"./IdentityIconRow-DstK_fA9.js";import"./Claim-BKrWfeFb.js";import"./Passphrase-CvcQTBFg.js";import"./RecoverAccount-BCL6g5JQ.js";function S(r,k=900){return(p=>{const[g,a]=o.useState({expression:null,resolved:[],state:"idle"}),t=o.useRef(null),E=o.useCallback(m=>{t.current&&clearTimeout(t.current);const c=p.replace(/^wss?:\/\//,"").replace(/\/.*$/,""),l=r(c);a({expression:null,resolved:[],state:"connecting"}),l!=="hang"&&(t.current=setTimeout(()=>{a(l==="connect"?{expression:{raw:m,ast:{kind:"namespace",value:m}},resolved:[`https://${c}/${m}`],state:"connected"}:{expression:null,resolved:[],state:"error",error:"WebSocket error"})},k))},[p]);return o.useEffect(()=>()=>{t.current&&clearTimeout(t.current)},[]),{channel:g,open:E,send:()=>{},disconnect:()=>{}}})}const T=async()=>new Response("<!doctype html><title>no</title>",{status:200,headers:{"content-type":"text/html"}}),N={fetchImpl:T,useChannel:S(r=>r==="cleaker.me"?"connect":"error")},j={fetchImpl:T,useChannel:S(()=>"hang")},lr={title:"All.This/Cleaker",component:s,parameters:{layout:"fullscreen"}},n={render:()=>e.jsx(C,{children:e.jsx(v,{children:e.jsx(s,{namespace:"cleaker.me"})})})},i={args:{otherHost:"answers"},argTypes:{otherHost:{control:"inline-radio",options:["answers","never finishes"]}},render:({otherHost:r})=>e.jsx(y.Provider,{value:r==="answers"?N:j,children:e.jsx(C,{children:e.jsx(v,{children:e.jsx(s,{namespace:typeof window<"u"?window.location.hostname:"localhost"})})})},r)};var h,d,u;n.parameters={...n.parameters,docs:{...(h=n.parameters)==null?void 0:h.docs,source:{originalSource:`{
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
}`,...(w=(x=i.parameters)==null?void 0:x.docs)==null?void 0:w.source}}};const hr=["Default","Flow"];export{n as Default,i as Flow,hr as __namedExportsOrder,lr as default};
