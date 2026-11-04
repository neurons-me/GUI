import{j as e,B as n,a as o}from"./iframe-jME6TRyu.js";import{L as m}from"./Layout-Btydy1op.js";import{P as D}from"./Gauge-D4KJyjrU.js";import"./Button-ffxJjIdt.js";import"./Paper-D0AE__Fu.js";import{T as E}from"./ToggleMode-BqybOH1d.js";import"./preload-helper-Dp1pzeXC.js";import"./LeftSidebarContext-0nKdfSJy.js";import"./TopBar-B1alHL9F.js";import"./Icon-BtaMh9kU.js";import"./Menu-L0v-vIF4.js";import"./useSlot-C61ruhcO.js";import"./resolveComponentProps-BQXnF4aQ.js";import"./useForkRef-z1e785Ns.js";import"./useSlotProps-BeRtKzOs.js";import"./isHostComponent-DVu5iVWx.js";import"./Paper-Ndu2Ngkb.js";import"./Grow-CX1iIK_S.js";import"./TransitionGroupContext-BRZCH32N.js";import"./mergeSlotProps-Dul5GYdh.js";import"./List-PPc6luvu.js";import"./MenuItem-c5vDCIh9.js";import"./ButtonBase-BOSaDjG-.js";import"./listItemIconClasses-Drtk4guX.js";import"./listItemTextClasses-BTSdieEv.js";import"./dividerClasses-C2APwgbx.js";import"./getThemeProps-DE7h1-OS.js";import"./useInsets-CKXJqeOA.js";import"./Avatar-DUU9vCmx.js";import"./createSvgIcon-jWV4H6K5.js";import"./AppBar-BxWGBjFT.js";import"./Toolbar-DdnHZP3c.js";import"./Tooltip-B6C2EAF_.js";import"./Tooltip-Bce4NUBE.js";import"./useControlled-Cu8K_Z2u.js";import"./Collapse-BL-D4z3B.js";import"./IconButton-CwIzlmuT.js";import"./CircularProgress-DVHqJ1WQ.js";import"./ListItemIcon-o5ylfJzT.js";import"./ListItemText-CvGTrX3g.js";import"./Drawer-BTZ0yApO.js";import"./useFormControl-D8HjSUmZ.js";import"./guiNodeId-BzEceGv0.js";import"./AppBar-DqPSf1ZM.js";import"./Avatar-CMm04gBo.js";import"./StickyOptionsTop-0ltDjcW1.js";import"./IconButton-DRNOYwhc.js";import"./TextField-BFarGitF.js";import"./isMuiElement-DBbgm_fz.js";import"./Progress-C5lx_x92.js";import"./Button-CLDQrykt.js";import"./Switch-CuvxAeRe.js";const Ee={title:"Getting Started/Layout",component:m,tags:["autodocs"],parameters:{docs:{description:{component:`
Responsive shell used across ***.GUI***

It coordinates the TopBar left/right sidebars, and Footer so their insets remain in sync while content renders inside.

- Inset-aware shell — provides the layout context and automatically keeps TopBar/Footer/content aligned as sidebars open/close.
- **Composable regions** – optional \`TopBar\`, \`LeftBar\`, \`RightBar\`, and \`Footer\` let you enable only what you need.
- **Sticky actions** – \`stickyOptions\` uses the same GUI icon registry pattern as the rest of the shell, so config-driven quick actions stay consistent with sidebars and nav links.

## Declarative usage
~~~json
{
  "type": "Layout",
  "props": {
    "TopBar": {
      "title": "Workspace",
      "elementsRight": [
        {
          "type": "action",
          "props": {
            "element": "ThemeModeToggle"
          }
        }
      ]
    },
    "LeftBar": {
      "elements": [
        {
          "type": "link",
          "props": {
            "label": "Dashboard",
            "icon": "dashboard"
          }
        },
        {
          "type": "menu",
          "props": {
            "label": "Projects",
            "icon": "folder",
            "items": [
              {
                "label": "Project A",
                "icon": "work"
              },
              {
                "label": "Project B",
                "icon": "assignment"
              }
            ]
          }
        }
      ]
    },
    "RightBar": { "elements": [] },
    "stickyOptions": {
      "items": [
        { "icon": "insights", "label": "Insights", "href": "/insights" },
        { "icon": "menu_book", "label": "Docs", "href": "/docs" },
        { "icon": "help", "label": "Support", "href": "/support" }
      ]
    },
    "Footer": {
      "brandLabel": "neurons.me",
      "centerElements": [
        {
          "type": "link",
          "props": {
            "label": "Docs",
            "href": "/docs",
            "icon": "menu_book"
          }
        }
      ]
    }
  },
  "Content": [
    {
      "children": [
        {
          "type": "Section",
          "props": {
            "title": "Overview"
          }
        },
        {
          "type": "Card",
          "props": {
            "title": "AI Metrics"
          }
        }
      ]
    }
  ]
}
~~~

---
## React usage
Use the layout as a shell around your routes or dashboard pages. Pass config objects when you need a region; use \`false\` to omit it.
~~~tsx
function DashboardPage() {
  return (
    <Layout
      TopBar={{
        title: "Analytics",
        elementsRight: [
          { type: "action", props: { element: <ThemeModeToggle variant="minimal" /> } },
        ],
      }}
      LeftBar={{
        elements: [
          { type: "link", props: { label: "Overview", icon: "home" } },
          { type: "link", props: { label: "Reports", icon: "insights" } },
        ],
      }}
      RightBar={{
        elements: [
          { type: "link", props: { label: "Alerts", icon: "notifications" } },
        ],
      }}
      stickyOptions={{
        items: [
          { icon: "insights", label: "Insights", href: "/insights" },
          { icon: "menu_book", label: "Docs", href: "/docs" },
          { icon: "help", label: "Support", href: "/support" },
        ],
      }}
    >
      <Outlet />
    </Layout>
  );
}
~~~

---
## Notes
- Props objects mirror the props of the individual components (TopBar, LeftBar, RightBar, Footer). (Legacy \`*Config\` props are still supported.)
- \`stickyOptions.items\` should use GUI icon token strings, matching the registry pattern used by \`TopBar\`, \`LeftBar\`, \`RightBar\`, and \`Footer\`.
- Set a config to \`false\` (or omit it) to exclude that region entirely.
- Children render in document order beneath any enabled sidebars/top bar – for sticky layouts remember to add padding or section containers as shown below.
`}}},argTypes:{TopBar:{control:"object"},LeftBar:{control:"object"},RightBar:{control:"object"},Footer:{control:"object"}}},r=F=>e.jsx(m,{...F,children:e.jsxs(n,{sx:{minHeight:"120vh",p:3,display:"flex",flexDirection:"column",gap:2},children:[e.jsx(o,{variant:"h5",sx:{fontWeight:700},children:"Responsive Layout Demo"}),e.jsx(o,{variant:"body2",color:"text.secondary",sx:{maxWidth:720},children:"Resize the viewport or toggle sidebars to observe how insets are coordinated. This content is intentionally tall to show how fixed bars interact with scrolling."}),e.jsxs(n,{sx:{mt:1,display:"grid",gridTemplateColumns:{xs:"1fr",sm:"repeat(2, minmax(0, 1fr))",lg:"repeat(3, minmax(0, 1fr))"},gap:2},children:[e.jsxs(n,{sx:{p:2,borderRadius:2,border:"1px solid",borderColor:"divider",bgcolor:"background.paper"},children:[e.jsx(o,{variant:"subtitle2",sx:{fontWeight:700,mb:.5},children:"Insets-aware"}),e.jsx(o,{variant:"caption",color:"text.secondary",children:"This block uses theme tokens and lets Layout/Content handle spacing."})]}),e.jsxs(n,{sx:{p:2,borderRadius:2,border:"1px solid",borderColor:"divider",bgcolor:"background.paper"},children:[e.jsx(o,{variant:"subtitle2",sx:{fontWeight:700,mb:.5},children:"Sidebar coordination"}),e.jsx(o,{variant:"caption",color:"text.secondary",children:"Expand/collapse sidebars and confirm content stays aligned."})]}),e.jsxs(n,{sx:{p:2,borderRadius:2,border:"1px solid",borderColor:"divider",bgcolor:"background.paper"},children:[e.jsx(o,{variant:"subtitle2",sx:{fontWeight:700,mb:.5},children:"Scroll behavior"}),e.jsx(o,{variant:"caption",color:"text.secondary",children:"Layout keeps the main area scrollable without manual padding hacks."})]})]}),e.jsx(n,{sx:{mt:2},children:Array.from({length:18}).map((W,d)=>e.jsxs(o,{variant:"body2",color:"text.secondary",sx:{mb:1},children:["Row ",d+1," — filler content to demonstrate scrolling within the Layout content area."]},d))})]})}),s={render:r,args:{TopBar:{title:"neurons.me",elementsRight:[{type:"action",props:{element:e.jsx(E,{variant:"minimal",show:"icons",iconSize:"small"})}}]},LeftBar:!1,RightBar:!1,Footer:!1}},i={render:r,args:{...s.args,LeftBar:{elements:[{type:"link",props:{label:"Overview",icon:"dashboard"}},{type:"menu",props:{label:"Projects",icon:"folder",items:[{label:"Project Alpha",icon:"work"},{label:"Project Beta",icon:"assignment"}]}}],footerElements:[{type:"link",props:{label:"Settings",icon:"settings"}}]}}},t={render:r,args:{...i.args,RightBar:{elements:[{type:"link",props:{label:"Activity",icon:"history"}},{type:"action",props:{label:"Export",icon:"download"}}]}}},a={render:r,args:{...t.args,Footer:{brandLabel:"neurons.me",brandLogo:"https://neurons.me/neurons.me.png",centerElements:[{type:"link",props:{label:"Docs",href:"neurons-me.github.io/GUI/",icon:"menu_book",iconColor:"var(--gui-primary)"}},{type:"link",props:{label:"API",href:"/api",icon:"code",iconColor:"var(--gui-secondary)"}}],rightElements:[{type:"link",props:{label:"Community",href:"https://neurons.me",icon:"forum",iconColor:"var(--gui-info)",external:!0}},{type:"link",props:{label:"GitHub",href:"https://github.com",icon:"code",iconColor:"var(--gui-warning)",external:!0}}],position:"fixed"}}},l={render:r,args:{...t.args,stickyOptions:{items:[{icon:"insights",label:"Insights",href:"/insights",iconColor:"primary"},{icon:"menu_book",label:"Docs",href:"/docs",iconColor:"info"},{icon:"help",label:"Support",href:"/support",iconColor:"success"}],positioning:{mode:"sticky",topOffset:"0.55rem"},behavior:{iconOnlyOnMobile:!1}}},parameters:{docs:{description:{story:"Shell-level sticky actions using **GUI registry tokens** only. This is the recommended `Layout` configuration path for sticky quick actions."}}}},p={render:r,args:{TopBar:!1,LeftBar:!1,RightBar:!1,Footer:!1}},c={render:()=>e.jsx(m,{TopBar:{title:"neurons.me"},LeftBar:{elements:[{type:"link",props:{label:"Home",icon:"home"}},{type:"link",props:{label:"Analytics",icon:"insights"}}]},RightBar:{elements:[{type:"link",props:{label:"Chat",icon:"chat"}}]},stickyOptions:{items:[{icon:"insights",label:"Insights",href:"/insights",iconColor:"primary"},{icon:"menu_book",label:"Docs",href:"/docs",iconColor:"info"},{icon:"help",label:"Support",href:"/support",iconColor:"success"}],positioning:{mode:"sticky",topOffset:"0.55rem"}},Footer:{brandLabel:"neurons.me",centerElements:[{type:"link",props:{label:"Docs",icon:"menu_book"}}]},children:e.jsxs(D,{padding:4,children:[e.jsx(o,{variant:"h5",sx:{fontWeight:700,mb:2},children:"Page inside Layout"}),e.jsx(o,{variant:"body2",color:"text.secondary",sx:{maxWidth:720},children:"This example shows how a Page component can be used inside the responsive Layout, automatically adapting to inset updates from the TopBar, sidebars, Footer, and the sticky quick-actions bar."})]})}),parameters:{docs:{description:{story:"Preferred full-page example: `Layout` + `Page` + `stickyOptions`, all configured with the same declarative GUI icon tokens used across the rest of the shell."}}}};var h,g,u;s.parameters={...s.parameters,docs:{...(h=s.parameters)==null?void 0:h.docs,source:{originalSource:`{
  render: Template,
  args: {
    TopBar: {
      title: "neurons.me",
      elementsRight: [{
        type: "action",
        props: {
          element: <ThemeModeToggle variant="minimal" show="icons" iconSize="small" />
        }
      }]
    },
    LeftBar: false,
    RightBar: false,
    Footer: false
  }
}`,...(u=(g=s.parameters)==null?void 0:g.docs)==null?void 0:u.source}}};var y,b,f;i.parameters={...i.parameters,docs:{...(y=i.parameters)==null?void 0:y.docs,source:{originalSource:`{
  render: Template,
  args: {
    ...TopBar.args,
    LeftBar: {
      elements: [{
        type: "link",
        props: {
          label: "Overview",
          icon: "dashboard"
        }
      }, {
        type: "menu",
        props: {
          label: "Projects",
          icon: "folder",
          items: [{
            label: "Project Alpha",
            icon: "work"
          }, {
            label: "Project Beta",
            icon: "assignment"
          }]
        }
      }],
      footerElements: [{
        type: "link",
        props: {
          label: "Settings",
          icon: "settings"
        }
      }]
    }
  }
}`,...(f=(b=i.parameters)==null?void 0:b.docs)==null?void 0:f.source}}};var k,x,B;t.parameters={...t.parameters,docs:{...(k=t.parameters)==null?void 0:k.docs,source:{originalSource:`{
  render: Template,
  args: {
    ...TopAndLeftBar.args,
    RightBar: {
      elements: [{
        type: "link",
        props: {
          label: "Activity",
          icon: "history"
        }
      }, {
        type: "action",
        props: {
          label: "Export",
          icon: "download"
        }
      }]
    }
  }
}`,...(B=(x=t.parameters)==null?void 0:x.docs)==null?void 0:B.source}}};var v,T,L;a.parameters={...a.parameters,docs:{...(v=a.parameters)==null?void 0:v.docs,source:{originalSource:`{
  render: Template,
  args: {
    ...TopLeftAndRightBar.args,
    Footer: {
      brandLabel: "neurons.me",
      brandLogo: "https://neurons.me/neurons.me.png",
      centerElements: [{
        type: "link",
        props: {
          label: "Docs",
          href: "neurons-me.github.io/GUI/",
          icon: "menu_book",
          iconColor: "var(--gui-primary)"
        }
      }, {
        type: "link",
        props: {
          label: "API",
          href: "/api",
          icon: "code",
          iconColor: "var(--gui-secondary)"
        }
      }],
      rightElements: [{
        type: "link",
        props: {
          label: "Community",
          href: "https://neurons.me",
          icon: "forum",
          iconColor: "var(--gui-info)",
          external: true
        }
      }, {
        type: "link",
        props: {
          label: "GitHub",
          href: "https://github.com",
          icon: "code",
          iconColor: "var(--gui-warning)",
          external: true
        }
      }],
      position: "fixed"
    }
  }
}`,...(L=(T=a.parameters)==null?void 0:T.docs)==null?void 0:L.source}}};var j,C,w;l.parameters={...l.parameters,docs:{...(j=l.parameters)==null?void 0:j.docs,source:{originalSource:`{
  render: Template,
  args: {
    ...TopLeftAndRightBar.args,
    stickyOptions: {
      items: [{
        icon: 'insights',
        label: 'Insights',
        href: '/insights',
        iconColor: 'primary'
      }, {
        icon: 'menu_book',
        label: 'Docs',
        href: '/docs',
        iconColor: 'info'
      }, {
        icon: 'help',
        label: 'Support',
        href: '/support',
        iconColor: 'success'
      }],
      positioning: {
        mode: 'sticky',
        topOffset: '0.55rem'
      },
      behavior: {
        iconOnlyOnMobile: false
      }
    }
  },
  parameters: {
    docs: {
      description: {
        story: 'Shell-level sticky actions using **GUI registry tokens** only. This is the recommended \`Layout\` configuration path for sticky quick actions.'
      }
    }
  }
}`,...(w=(C=l.parameters)==null?void 0:C.docs)==null?void 0:w.source}}};var R,S,O;p.parameters={...p.parameters,docs:{...(R=p.parameters)==null?void 0:R.docs,source:{originalSource:`{
  render: Template,
  args: {
    TopBar: false,
    LeftBar: false,
    RightBar: false,
    Footer: false
  }
}`,...(O=(S=p.parameters)==null?void 0:S.docs)==null?void 0:O.source}}};var P,I,A;c.parameters={...c.parameters,docs:{...(P=c.parameters)==null?void 0:P.docs,source:{originalSource:`{
  render: () => <Layout TopBar={{
    title: 'neurons.me'
  }} LeftBar={{
    elements: [{
      type: 'link',
      props: {
        label: 'Home',
        icon: 'home'
      }
    }, {
      type: 'link',
      props: {
        label: 'Analytics',
        icon: 'insights'
      }
    }]
  }} RightBar={{
    elements: [{
      type: 'link',
      props: {
        label: 'Chat',
        icon: 'chat'
      }
    }]
  }} stickyOptions={{
    items: [{
      icon: 'insights',
      label: 'Insights',
      href: '/insights',
      iconColor: 'primary'
    }, {
      icon: 'menu_book',
      label: 'Docs',
      href: '/docs',
      iconColor: 'info'
    }, {
      icon: 'help',
      label: 'Support',
      href: '/support',
      iconColor: 'success'
    }],
    positioning: {
      mode: 'sticky',
      topOffset: '0.55rem'
    }
  }} Footer={{
    brandLabel: 'neurons.me',
    centerElements: [{
      type: 'link',
      props: {
        label: 'Docs',
        icon: 'menu_book'
      }
    }]
  }}>
      <Page padding={4}>
        <Typography variant="h5" sx={{
        fontWeight: 700,
        mb: 2
      }}>
          Page inside Layout
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{
        maxWidth: 720
      }}>
          This example shows how a Page component can be used inside the responsive Layout,
          automatically adapting to inset updates from the TopBar, sidebars, Footer, and the sticky quick-actions bar.
        </Typography>
      </Page>
    </Layout>,
  parameters: {
    docs: {
      description: {
        story: 'Preferred full-page example: \`Layout\` + \`Page\` + \`stickyOptions\`, all configured with the same declarative GUI icon tokens used across the rest of the shell.'
      }
    }
  }
}`,...(A=(I=c.parameters)==null?void 0:I.docs)==null?void 0:A.source}}};const We=["TopBar","TopAndLeftBar","TopLeftAndRightBar","FullShell","WithStickyOptions","ContentOnly","LayoutWithPage"];export{p as ContentOnly,a as FullShell,c as LayoutWithPage,i as TopAndLeftBar,s as TopBar,t as TopLeftAndRightBar,l as WithStickyOptions,We as __namedExportsOrder,Ee as default};
