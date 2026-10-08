import{a as p,d as l,j as o}from"./iframe-q72FflWy.js";import{u}from"./useInsets-BdHRW95k.js";import"./preload-helper-Dp1pzeXC.js";import"./LeftSidebarContext-DOlSL4Mw.js";const e=()=>{var n;const t=p(),{mode:m,themeId:c}=l(),h=u();return o.jsx("pre",{style:{padding:16},children:o.jsx("code",{children:JSON.stringify({mode:m,themeId:c,palette:t.palette,fontFamily:(n=t.typography)==null?void 0:n.fontFamily,typography:t.typography,insets:h},null,2)})})},x={title:"Getting Started/Theme/Viewer",component:e,tags:["autodocs"],parameters:{docs:{description:{component:`
This story renders the **active theme state** used throughout your app.

### What you will see:
- \`mode\`: Current light/dark mode from ThemeContext
- \`palette\`: Full MUI palette object generated from createTheme(), including:
  - primary, secondary, error, warning, success, info colors
  - background and text colors
  - action states (hover, focus, selected, etc.)
- \`insets\`: Safe area layout padding (top/right/bottom/left) from InsetsContext (useful for notch-aware design)

### Why this is useful:
- Debug whether the correct theme is being used
- Inspect how palette tokens resolve dynamically
- Verify how inset values change (iOS, Android, desktop)
- Helps debug dynamic theme toggles and token propagation

Ideal for inspecting changes in real-time while modifying theme-related code or tokens.
          `}}}};e.__docgenInfo={description:"Story: CurrentThemeState\n\nThis Storybook story displays the current theme state injected via MUI's ThemeProvider\nalong with custom context values such as `mode` (from ThemeContext) and `insets` (from InsetsContext).\n\nThe output includes:\n- `mode`: Light/dark mode from the app's ThemeContext\n- `palette`: Full palette object from MUI's `createTheme`, including color tokens and UI actions\n- `insets`: Safe area insets (top/right/bottom/left) for layout padding/margin\n\nUseful for debugging how the current theme looks, understanding the applied color system,\nand ensuring injected context values are correctly picked up across the app.",methods:[],displayName:"CurrentThemeState"};const I=["CurrentThemeState"];var s,r,a,i,d;e.parameters={...e.parameters,docs:{...(s=e.parameters)==null?void 0:s.docs,source:{originalSource:`() => {
  const theme = useTheme();
  const {
    mode,
    themeId
  } = useThemeContext();
  const insets = useInsets();
  return <pre style={{
    padding: 16
  }}>
      <code>
        {JSON.stringify({
        mode,
        themeId,
        palette: theme.palette,
        fontFamily: theme.typography?.fontFamily,
        typography: theme.typography,
        insets
      }, null, 2)}
      </code>
    </pre>;
}`,...(a=(r=e.parameters)==null?void 0:r.docs)==null?void 0:a.source},description:{story:"Story: CurrentThemeState\n\nThis Storybook story displays the current theme state injected via MUI's ThemeProvider\nalong with custom context values such as `mode` (from ThemeContext) and `insets` (from InsetsContext).\n\nThe output includes:\n- `mode`: Light/dark mode from the app's ThemeContext\n- `palette`: Full palette object from MUI's `createTheme`, including color tokens and UI actions\n- `insets`: Safe area insets (top/right/bottom/left) for layout padding/margin\n\nUseful for debugging how the current theme looks, understanding the applied color system,\nand ensuring injected context values are correctly picked up across the app.",...(d=(i=e.parameters)==null?void 0:i.docs)==null?void 0:d.description}}};export{e as CurrentThemeState,I as __namedExportsOrder,x as default};
