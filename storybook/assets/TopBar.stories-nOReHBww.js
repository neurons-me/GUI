import{j as e}from"./iframe-q72FflWy.js";import{T as a}from"./TopBar-D4C-tPuB.js";import"./preload-helper-Dp1pzeXC.js";import"./Icon-Doq3uhPc.js";import"./Menu-DFKCKfQm.js";import"./useSlot-B3Bhjpe0.js";import"./resolveComponentProps-zf7BDQ8X.js";import"./useForkRef-BR9zNRBO.js";import"./useSlotProps-DMFXOslT.js";import"./isHostComponent-DVu5iVWx.js";import"./Paper-C4cHEfmg.js";import"./Grow-C-rRNj8l.js";import"./TransitionGroupContext-4zVEsxkP.js";import"./mergeSlotProps-BtuGLXbb.js";import"./useEventCallback-BVb6jHPB.js";import"./List-DvvFCGIp.js";import"./MenuItem-D5DHuw3h.js";import"./ButtonBase-D2HnvhjV.js";import"./listItemIconClasses-C8gmQhu6.js";import"./listItemTextClasses-_6ucLlDF.js";import"./dividerClasses-BXru1jN1.js";import"./useGuiMediaQuery-BQeqdqN6.js";import"./getThemeProps-BMrl9x_3.js";import"./useInsets-BdHRW95k.js";import"./LeftSidebarContext-DOlSL4Mw.js";import"./Avatar-kFT77iM6.js";import"./createSvgIcon-DOR6FtI1.js";import"./AppBar-o6rXye4L.js";import"./Toolbar-s_6dNoIJ.js";const se={title:"Getting Started/Layout/TopBar",component:a,tags:["autodocs"],decorators:[D=>e.jsx(D,{})],parameters:{docs:{description:{component:`The **TopBar** component provides a responsive, application top bar for navigation, branding and other actions.
---
## Features
- **Branding:** Display a logo and title.
- **Navigation Links:** With optional icons and dropdown menus (nested children).
- **Custom actions:** Theme toggle, etc.
- **Responsive:** Adapts to mobile layouts.
- **Inset-aware:** Reads global left/right/nav insets from the theme to align with permanent drawers.
- **Icon support:** Via the This.GUI icon registry (declarative strings).

---

### Position Modes
- \`position="static"\`: The TopBar scrolls with the content, part of the normal document flow.
- \`position="fixed"\`: The TopBar stays pinned to the top of the viewport, remaining visible during scrolling.
- Ergonomically, \`static\` feels fluid and natural for reading layouts, while \`fixed\` provides stability and quick access to main navigation.

---

### Props
Each element can specify:
  - \`type\` (string): Element type, e.g. 'link' or 'menu'.
  - \`props\` (object): Properties for the element.
    - For \`link\`: \`label\` (string), \`href\` (string), \`icon\` (string), \`iconColor\` (string).
    - For \`menu\`: \`label\` (string), \`icon\` (string), \`iconColor\` (string), \`children\` (array of elements).
---

**Example:**
~~~jsx
<TopBar
  logo="https://neurons.me/neurons.me.png"
  elementsCenter={[
    { type: 'link', props: { label: 'Home', href: '/', icon: 'home', iconColor: 'primary' } },
    { type: 'link', props: { label: 'Docs', href: '/docs', icon: 'insights', iconColor: 'secondary' } },
    {
      type: 'menu',
      props: {
        label: 'More',
        icon: 'info',
        iconColor: '#00aa96',
        items: [
          { label: 'About', href: '/about', icon: 'message', iconColor: 'info' },
          { label: 'Contact', href: '/contact', icon: 'mail', iconColor: '#4caf50' },
        ],
      },
    },
  ]}
  showThemeToggle
  position="fixed"
/>
~~~

---

#### Dropdown Menus
- To create a dropdown, provide a \`children\` array with elements of type \`link\` inside a \`menu\` element.

~~~jsx
<TopBar
  elementsCenter={[
    {
      type: 'menu',
      props: {
        label: 'More',
        icon: 'info',
        items: [
          { label: 'About', href: '/about' },
          { label: 'Contact', href: '/contact' },
        ],
      },
    },
  ]}
/>
~~~

---

#### Icon Usage
- **Material Symbols:** Use icon names directly (e.g. \`bar_chart\`, \`mail\`, \`insights\`). See [Material Symbols Catalog](https://fonts.google.com/icons?icon.set=Material+Symbols).
- Icon rendering is handled by the \`<Icon />\` component, which supports font variation settings like \`weight\`, \`fill\`, \`grade\`, \`opticalSize\`, and standard props like \`iconColor\` and \`fontSize\`.

---
### React Component Mode (Advanced)
You may also use TopBar as a React component and pass elements as arrays of objects with \`type\` and \`props\`:

~~~jsx
import TopBar from './TopBar';

<TopBar
  elementsCenter={[
    { type: 'link', props: { label: 'Home', href: '/', icon: 'bar_chart', iconColor: 'primary' } },
    { type: 'link', props: { label: 'Docs', href: '/docs', icon: 'insights', iconColor: '#f50057' } },
    {
      type: 'menu',
      props: {
        label: 'More',
        icon: 'info',
       items: [
          { label: 'About', href: '/about', icon: 'mail', iconColor: '#4caf50' },
        ],
      },
    },
  ]}
  position="static"
/>
~~~
- **Note:** The \`props.icon\` property accepts icon names as strings. Color and style are controlled via \`iconColor\` and other props handled by the \`<Icon />\` component.

---

## Notes
- TopBar uses \`react-router-dom\` internally. Stories wrap it in a \`MemoryRouter\` for demo purposes.
- Dropdown menus are created by providing a \`children\` array for any menu element.
- Icon colors can be set with theme color keys (\`primary\`, \`secondary\`, \`info\`, etc.) or any valid CSS color string.
- \`elementsCenter\` and \`elementsRight\` accept objects with \`type\` and \`props\`, supporting nested menus.
- Toggles like showThemeToggle and homeTo/position.
Inset handling:
  - Measure Toolbar with toolbarRef, call theme.updateInsets({ nav: h }), and clean up in return → this updates theme.layout.insets.nav in Theme and also the CSS vars (--gui-nav-height).
Theme integration:
  - Use useTheme()/useMediaQuery(). In Theme, inject updateInsets and layout.insets into the memoized MUI theme, so TopBar sees them correctly.
  
        `}}},argTypes:{title:{description:"Title text displayed next to the logo.",control:"text"},logo:{description:"Logo image URL shown in the top-left.",control:"text"},elementsCenter:{description:'Array of navigation elements for center alignment, e.g. [{ type: "link", props: { label: string, href?: string, icon?: string, iconColor?: string } }, { type: "menu", props: { label: string, icon?: string, iconColor?: string, children: elements[] } }]. Supports nested dropdown menus.',control:"object"},elementsRight:{description:"Array of navigation elements for right alignment, similar structure as elementsCenter.",control:"object"},homeTo:{description:"Router path for clicking on logo/title.",control:"text"}}},t={args:{title:"neurons.me",logo:"https://neurons.me/neurons.me.png",elementsCenter:[{type:"link",props:{label:"Home",href:"/",icon:"home"}},{type:"link",props:{label:"Docs",href:"/docs",icon:"insights"}},{type:"menu",props:{label:"More",icon:"info",items:[{label:"About",href:"/about",icon:"message"},{label:"Contact",href:"/contact",icon:"mail"}]}}],homeTo:"/"}},o=()=>e.jsxs(e.Fragment,{children:[e.jsx(a,{title:"neurons.me",logo:"https://neurons.me/neurons.me.png",elementsCenter:[{type:"link",props:{label:"Home",href:"/",icon:"home"}},{type:"link",props:{label:"Docs",href:"/docs",icon:"insights"}},{type:"menu",props:{label:"More",icon:"info",items:[{label:"About",href:"/about",icon:"message"},{label:"Contact",href:"/contact",icon:"mail"}]}}],homeTo:"/",position:"fixed"}),e.jsx("div",{style:{marginTop:80,padding:20,height:"200vh"},children:Array(100).fill("Lorem ipsum dolor sit amet, consectetur adipiscing elit. ").join("")})]});o.storyName="Fixed TopBar";o.parameters={docs:{description:{story:'Demonstrates the TopBar with `position="fixed"`. Scroll down to see the TopBar stay fixed at the top.'}}};const n=()=>e.jsxs(e.Fragment,{children:[e.jsx(a,{title:"neurons.me",logo:"https://neurons.me/neurons.me.png",elementsCenter:[{type:"link",props:{label:"Home",href:"/",icon:"home"}},{type:"link",props:{label:"Docs",href:"/docs",icon:"insights"}},{type:"menu",props:{label:"More",icon:"info",items:[{label:"About",href:"/about",icon:"message"},{label:"Contact",href:"/contact",icon:"mail"}]}}],homeTo:"/",position:"static"}),e.jsx("div",{style:{padding:20,height:"200vh"},children:Array(100).fill("Lorem ipsum dolor sit amet, consectetur adipiscing elit. ").join("")})]});n.storyName="Static TopBar";n.parameters={docs:{description:{story:'Demonstrates the TopBar with `position="static"`. Scroll down to see the TopBar scroll with the page.'}}};const r={args:{title:"neurons.me",logo:"https://neurons.me/neurons.me.png",elementsCenter:[{type:"link",props:{label:"Home",href:"/",icon:"home",iconColor:"primary"}},{type:"link",props:{label:"Blog",href:"/blog",icon:"article",iconColor:"secondary"}},{type:"menu",props:{label:"Services",icon:"build",iconColor:"#00796b",items:[{label:"Consulting",href:"/consulting",icon:"support_agent",iconColor:"info"},{label:"Development",href:"/development",icon:"code",iconColor:"#4caf50"}]}}],homeTo:"/"}},i={args:{title:"neurons.me",logo:"https://neurons.me/neurons.me.png",elementsRight:[{type:"link",props:{label:"Login",href:"/login",icon:"login",iconColor:"primary"}},{type:"link",props:{label:"Register",href:"/register",icon:"person_add",iconColor:"secondary"}},{type:"menu",props:{label:"Profile",icon:"account_circle",iconColor:"#3f51b5",items:[{label:"Settings",href:"/settings",icon:"settings",iconColor:"info"},{label:"Logout",href:"/logout",icon:"logout",iconColor:"#f44336"}]}}],homeTo:"/"}},s={args:{title:"neurons.me",logo:"https://neurons.me/neurons.me.png",elementsCenter:[{type:"link",props:{label:"Dashboard",href:"/dashboard",icon:"dashboard",iconColor:"primary"}},{type:"link",props:{label:"Reports",href:"/reports",icon:"bar_chart",iconColor:"secondary"}}],elementsRight:[{type:"menu",props:{label:"User",icon:"account_circle",iconColor:"#3f51b5",items:[{label:"Profile",href:"/profile",icon:"person",iconColor:"info"},{label:"Logout",href:"/logout",icon:"logout",iconColor:"#f44336"}]}}],homeTo:"/"}},l={args:{title:"neurons.me",logo:"https://neurons.me/neurons.me.png",elementsCenter:[],elementsRight:[],homeTo:"/"}};o.__docgenInfo={description:"",methods:[],displayName:"FixedTopBar"};n.__docgenInfo={description:"",methods:[],displayName:"StaticTopBar"};const le=["Default","FixedTopBar","StaticTopBar","CenterElements","RightElements","CenterAndRightElements","NoElements"];var p,c,m;t.parameters={...t.parameters,docs:{...(p=t.parameters)==null?void 0:p.docs,source:{originalSource:`{
  args: {
    title: 'neurons.me',
    logo: 'https://neurons.me/neurons.me.png',
    elementsCenter: [{
      type: 'link',
      props: {
        label: 'Home',
        href: '/',
        icon: 'home'
      }
    }, {
      type: 'link',
      props: {
        label: 'Docs',
        href: '/docs',
        icon: 'insights'
      }
    }, {
      type: 'menu',
      props: {
        label: 'More',
        icon: 'info',
        items: [{
          label: 'About',
          href: '/about',
          icon: 'message'
        }, {
          label: 'Contact',
          href: '/contact',
          icon: 'mail'
        }]
      }
    }],
    homeTo: '/'
  }
}`,...(m=(c=t.parameters)==null?void 0:c.docs)==null?void 0:m.source}}};var h,g,d;o.parameters={...o.parameters,docs:{...(h=o.parameters)==null?void 0:h.docs,source:{originalSource:`() => <>
    <TopBar title="neurons.me" logo="https://neurons.me/neurons.me.png" elementsCenter={[{
    type: 'link',
    props: {
      label: 'Home',
      href: '/',
      icon: 'home'
    }
  }, {
    type: 'link',
    props: {
      label: 'Docs',
      href: '/docs',
      icon: 'insights'
    }
  }, {
    type: 'menu',
    props: {
      label: 'More',
      icon: 'info',
      items: [{
        label: 'About',
        href: '/about',
        icon: 'message'
      }, {
        label: 'Contact',
        href: '/contact',
        icon: 'mail'
      }]
    }
  }]} homeTo="/" position="fixed" />
    <div style={{
    marginTop: 80,
    padding: 20,
    height: '200vh'
  }}>
      {Array(100).fill('Lorem ipsum dolor sit amet, consectetur adipiscing elit. ').join('')}
    </div>
  </>`,...(d=(g=o.parameters)==null?void 0:g.docs)==null?void 0:d.source}}};var u,f,b;n.parameters={...n.parameters,docs:{...(u=n.parameters)==null?void 0:u.docs,source:{originalSource:`() => <>
    <TopBar title="neurons.me" logo="https://neurons.me/neurons.me.png" elementsCenter={[{
    type: 'link',
    props: {
      label: 'Home',
      href: '/',
      icon: 'home'
    }
  }, {
    type: 'link',
    props: {
      label: 'Docs',
      href: '/docs',
      icon: 'insights'
    }
  }, {
    type: 'menu',
    props: {
      label: 'More',
      icon: 'info',
      items: [{
        label: 'About',
        href: '/about',
        icon: 'message'
      }, {
        label: 'Contact',
        href: '/contact',
        icon: 'mail'
      }]
    }
  }]} homeTo="/" position="static" />
    <div style={{
    padding: 20,
    height: '200vh'
  }}>
      {Array(100).fill('Lorem ipsum dolor sit amet, consectetur adipiscing elit. ').join('')}
    </div>
  </>`,...(b=(f=n.parameters)==null?void 0:f.docs)==null?void 0:b.source}}};var y,C,T;r.parameters={...r.parameters,docs:{...(y=r.parameters)==null?void 0:y.docs,source:{originalSource:`{
  args: {
    title: 'neurons.me',
    logo: 'https://neurons.me/neurons.me.png',
    elementsCenter: [{
      type: 'link',
      props: {
        label: 'Home',
        href: '/',
        icon: 'home',
        iconColor: 'primary'
      }
    }, {
      type: 'link',
      props: {
        label: 'Blog',
        href: '/blog',
        icon: 'article',
        iconColor: 'secondary'
      }
    }, {
      type: 'menu',
      props: {
        label: 'Services',
        icon: 'build',
        iconColor: '#00796b',
        items: [{
          label: 'Consulting',
          href: '/consulting',
          icon: 'support_agent',
          iconColor: 'info'
        }, {
          label: 'Development',
          href: '/development',
          icon: 'code',
          iconColor: '#4caf50'
        }]
      }
    }],
    homeTo: '/'
  }
}`,...(T=(C=r.parameters)==null?void 0:C.docs)==null?void 0:T.source}}};var k,v,x;i.parameters={...i.parameters,docs:{...(k=i.parameters)==null?void 0:k.docs,source:{originalSource:`{
  args: {
    title: 'neurons.me',
    logo: 'https://neurons.me/neurons.me.png',
    elementsRight: [{
      type: 'link',
      props: {
        label: 'Login',
        href: '/login',
        icon: 'login',
        iconColor: 'primary'
      }
    }, {
      type: 'link',
      props: {
        label: 'Register',
        href: '/register',
        icon: 'person_add',
        iconColor: 'secondary'
      }
    }, {
      type: 'menu',
      props: {
        label: 'Profile',
        icon: 'account_circle',
        iconColor: '#3f51b5',
        items: [{
          label: 'Settings',
          href: '/settings',
          icon: 'settings',
          iconColor: 'info'
        }, {
          label: 'Logout',
          href: '/logout',
          icon: 'logout',
          iconColor: '#f44336'
        }]
      }
    }],
    homeTo: '/'
  }
}`,...(x=(v=i.parameters)==null?void 0:v.docs)==null?void 0:x.source}}};var B,S,w;s.parameters={...s.parameters,docs:{...(B=s.parameters)==null?void 0:B.docs,source:{originalSource:`{
  args: {
    title: 'neurons.me',
    logo: 'https://neurons.me/neurons.me.png',
    elementsCenter: [{
      type: 'link',
      props: {
        label: 'Dashboard',
        href: '/dashboard',
        icon: 'dashboard',
        iconColor: 'primary'
      }
    }, {
      type: 'link',
      props: {
        label: 'Reports',
        href: '/reports',
        icon: 'bar_chart',
        iconColor: 'secondary'
      }
    }],
    elementsRight: [{
      type: 'menu',
      props: {
        label: 'User',
        icon: 'account_circle',
        iconColor: '#3f51b5',
        items: [{
          label: 'Profile',
          href: '/profile',
          icon: 'person',
          iconColor: 'info'
        }, {
          label: 'Logout',
          href: '/logout',
          icon: 'logout',
          iconColor: '#f44336'
        }]
      }
    }],
    homeTo: '/'
  }
}`,...(w=(S=s.parameters)==null?void 0:S.docs)==null?void 0:w.source}}};var R,j,A;l.parameters={...l.parameters,docs:{...(R=l.parameters)==null?void 0:R.docs,source:{originalSource:`{
  args: {
    title: 'neurons.me',
    logo: 'https://neurons.me/neurons.me.png',
    elementsCenter: [],
    elementsRight: [],
    homeTo: '/'
  }
}`,...(A=(j=l.parameters)==null?void 0:j.docs)==null?void 0:A.source}}};export{s as CenterAndRightElements,r as CenterElements,t as Default,o as FixedTopBar,l as NoElements,i as RightElements,n as StaticTopBar,le as __namedExportsOrder,se as default};
