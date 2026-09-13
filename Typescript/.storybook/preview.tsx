// .storybook/preview.tsx
import React from 'react'
import 'material-symbols/rounded.css';
import { DocsContainer } from '@storybook/addon-docs/blocks';
import { MemoryRouter } from 'react-router-dom';
import { MDXProvider } from '@mdx-js/react';
import { useGlobals } from 'storybook/preview-api';
import { Theme } from '../src/gui/Theme/Theme';
import { useThemeContext } from '../src/gui-internals/Contexts/ThemeContext';
import CodeBlock from '../src/gui/Molecules/CodeBlock/CodeBlock';
import Typography from '../src/gui/Atoms/Typography/Typography';
import Link from '../src/gui/Atoms/Link/Link';
import Box from '../src/gui/Atoms/Box/Box';
import { SelectionProvider, useSelection } from '../src/runtime/selection';
import { RuntimeInspector } from '../src/runtime/inspector';

// Bridges the "Inspector" toolbar global (below) to SelectionProvider's own
// state, so toggling it in the toolbar turns the Semantic Inspector on/off
// for the current story. Only has something to show for stories rendered
// through the declarative runtime (data-gui-node-id present) — plain
// hand-written example JSX (e.g. Quick Start) has nothing to select.
function InspectorGlobalSync({ enabled }: { enabled: boolean }) {
  const { setInspectorEnabled } = useSelection();
  React.useEffect(() => {
    setInspectorEnabled(enabled);
  }, [enabled, setInspectorEnabled]);
  return null;
}

// Bidirectional: the toolbar's "Mode" global and GUI's own Theme mode stay
// in sync regardless of which side changes it. Theme's `initialMode` prop
// only seeds usePersistentThemeMode's internal useState on first mount —
// React ignores a changed initializer on re-render, so a one-way "pass the
// global down as a prop" wiring silently stopped working after first mount.
// And a one-way "push the global down via setMode()" fix (the first pass at
// this) still left the toolbar stale whenever mode changed from *inside* a
// story instead — e.g. ThemeLauncher's own toggle, rendered inside a story,
// changing Theme's mode without touching the toolbar at all. Real
// bidirectionality needs both a live read of the toolbar and a way to push
// back to it. useGlobals() itself has a stricter call-site rule than a
// normal hook ("can only be called inside decorators and story functions"),
// so it's called once at the decorator's top level, not in here — this
// component only takes the result as props and talks to GUI's real Theme
// via useThemeContext() (an ordinary React context hook, no such
// restriction). Each direction only writes when the two sides actually
// differ, so a change on either side settles in one round trip, no loop.
function ThemeModeSync({
  globals,
  updateGlobals,
}: {
  globals: { mode?: string };
  updateGlobals: (next: { mode: 'light' | 'dark' }) => void;
}) {
  const { mode, setMode } = useThemeContext();
  const toolbarMode: 'light' | 'dark' = globals.mode === 'dark' ? 'dark' : 'light';

  React.useEffect(() => {
    if (mode !== toolbarMode) setMode(toolbarMode);
  }, [toolbarMode]);

  React.useEffect(() => {
    if (toolbarMode !== mode) updateGlobals({ mode });
  }, [mode]);

  return null;
}

const routerFuture = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
} as const;

const mdxComponents = {
  h1: (props: any) => <Typography variant="h3" sx={{ mt: 3, mb: 1.5, color: 'text.primary' }} {...props} />,
  h2: (props: any) => <Typography variant="h4" sx={{ mt: 3, mb: 1.5, color: 'text.primary' }} {...props} />,
  h3: (props: any) => <Typography variant="h5" sx={{ mt: 2.5, mb: 1.25, color: 'text.primary' }} {...props} />,
  h4: (props: any) => <Typography variant="h6" sx={{ mt: 2, mb: 1, color: 'text.primary' }} {...props} />,
  h5: (props: any) => <Typography variant="subtitle1" sx={{ mt: 2, mb: 0.75, color: 'text.primary' }} {...props} />,
  h6: (props: any) => <Typography variant="subtitle2" sx={{ mt: 2, mb: 0.5, color: 'text.primary' }} {...props} />,
  p: (props: any) => <Typography variant="body1" sx={{ mb: 1.5, color: 'text.primary' }} {...props} />,
  a: (props: any) => <Link {...props} />,
  ul: (props: any) => <Box component="ul" sx={{ pl: 3, mb: 2, color: 'text.primary' }} {...props} />,
  ol: (props: any) => <Box component="ol" sx={{ pl: 3, mb: 2, color: 'text.primary' }} {...props} />,
  li: (props: any) => (
    <Box component="li" sx={{ mb: 0.5, color: 'text.primary' }}>
      <Typography variant="body1" sx={{ color: 'text.primary' }} {...props} />
    </Box>
  ),
  code: (props: any) => (
    <Box
      component="code"
      sx={{
        fontFamily: 'monospace',
        fontSize: '0.9em',
        color: 'text.primary',
        backgroundColor: 'rgba(255,255,255,0.08)',
        padding: '2px 6px',
        borderRadius: 6,
      }}
      {...props}
    />
  ),
  pre: (props: any) => {
    const child = props?.children;
    const codeNode = Array.isArray(child) ? child[0] : child;
    const rawCode =
      codeNode && typeof codeNode === 'object'
        ? codeNode.props?.children
        : codeNode ?? '';
    const code = Array.isArray(rawCode) ? rawCode.join('') : String(rawCode ?? '');
    const language =
      (codeNode && codeNode.props?.className?.replace('language-', '')) ||
      props?.className?.replace('language-', '') ||
      'text';
    return (
      <CodeBlock
        language={language}
        title={language !== 'text' ? language.toUpperCase() : 'TEXT'}
        code={code.trimEnd()}
      />
    );
  },
};

const docsTheme = {
  base: 'dark',
  brandTitle: '.GUI',
  brandUrl: 'https://neurons-me.github.io/GUI',
  brandImage: 'GUI.png',
  appBg: 'var(--mui-palette-background-default, #121214)',
  appContentBg: 'var(--mui-palette-background-default, #121214)',
  appPreviewBg: 'var(--docs-surface, #191b20)',
  appBorderColor: 'var(--mui-palette-divider, rgba(255,255,255,0.14))',
  appBorderRadius: 16,
  colorPrimary: 'var(--mui-palette-primary-main, #90caf9)',
  colorSecondary: 'var(--mui-palette-secondary-main, #6FC7B5)',
  textColor: 'var(--mui-palette-text-primary, #ffffff)',
  textInverseColor: 'var(--mui-palette-primary-contrastText, #111111)',
  textMutedColor: 'var(--mui-palette-text-secondary, rgba(255,255,255,0.75))',
  barTextColor: 'var(--mui-palette-text-secondary, rgba(255,255,255,0.75))',
  barSelectedColor: 'var(--mui-palette-primary-main, #90caf9)',
  barBg: 'var(--docs-surface, #191b20)',
  inputBg: 'var(--docs-surface, #191b20)',
  inputBorder: 'var(--mui-palette-divider, rgba(255,255,255,0.14))',
  inputTextColor: 'var(--mui-palette-text-primary, #ffffff)',
  fontBase:
    'var(--mui-typography-fontFamily, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif)',
  fontCode:
    'ui-monospace, SFMono-Regular, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, monospace',
} as const;

export const globalTypes = {
  inspector: {
    description: 'Semantic Inspector — click any declaratively-rendered node to see its spec, resolved props, and kernel provenance',
    defaultValue: 'off',
    toolbar: {
      title: 'Inspector',
      icon: 'cog',
      items: [
        { value: 'off', icon: 'cog', title: 'Inspector Off' },
        { value: 'on', icon: 'wrench', title: 'Inspector On' },
      ],
      dynamicTitle: true,
    },
  },
  mode: {
    description: 'Color mode',
    defaultValue: 'light',
    toolbar: {
      title: 'Mode',
      icon: 'circlehollow',
      items: [
        { value: 'light', icon: 'sun', title: 'Light' },
        { value: 'dark', icon: 'moon', title: 'Dark' },
      ],
      dynamicTitle: true,
    },
  },
};

export const decorators = [
  (Story: React.FC, context: any) => {
    const [globals, updateGlobals] = useGlobals();
    return (
      <Theme initialThemeId="neurons.me" initialMode={globals.mode === 'dark' ? 'dark' : 'light'}>
        <ThemeModeSync globals={globals} updateGlobals={updateGlobals} />
        <MemoryRouter initialEntries={['/']} future={routerFuture}>
          <MDXProvider components={mdxComponents}>
            <SelectionProvider>
              <InspectorGlobalSync enabled={context.globals?.inspector === 'on'} />
              <RuntimeInspector />
              <Story />
            </SelectionProvider>
          </MDXProvider>
        </MemoryRouter>
      </Theme>
    );
  },
];

export const parameters = {
  controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
  backgrounds: { disabled: true },
  docs: {
    page: null,
    theme: docsTheme,
    container: ({ children, context }: any) => {
      // Not a valid useGlobals() call site (Storybook's own restriction —
      // confirmed live: it throws here, unlike the regular decorator above).
      // Docs pages don't render an interactive theme toggle, so falling
      // back to the plain `context` prop (read-only, one-way) loses nothing
      // real — only the decorator's story canvases need the write-back half.
      const globals = context.globals ?? {};
      return (
        <Theme initialThemeId="neurons.me" initialMode={globals.mode === 'dark' ? 'dark' : 'light'}>
          <ThemeModeSync globals={globals} updateGlobals={() => {}} />
          <Box
            sx={{
              minHeight: '100vh',
              bgcolor: 'background.default',
              color: 'text.primary',
              fontFamily:
                'var(--mui-typography-fontFamily, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif)',
            }}
          >
            <Box
              sx={{
                width: '100%',
                maxWidth: 1440,
                mx: 'auto',
                px: { xs: 2, md: 3 },
                py: { xs: 3, md: 4 },
                boxSizing: 'border-box',
              }}
            >
              <MDXProvider components={mdxComponents}>
                <DocsContainer context={context}>{children}</DocsContainer>
              </MDXProvider>
            </Box>
          </Box>
        </Theme>
      );
    },
  },
  // Sidebar ordering
  options: {
    storySort: {
      order: [
        'Docs',
        'Getting Started',
        ['Quick Start', 'GUI Overview', 'Using This Docs'],
        'Router',
        ['Router', 'Examples & Recipes'],
        'Users',
        ['Users', '.me', ['cleaker', 'monad.ai']],
        'All.This',
        ['Cleaker', ['.me', 'Register']],
        'gui',
        'Layout',
        'Theme',
        'atoms',
        'molecules',
        'components',
      ],
    },
  },

  a11y: {
    // 'todo' - show a11y violations in the test UI only
    // 'error' - fail CI on a11y violations
    // 'off' - skip a11y checks entirely
    test: 'todo'
  }
};
