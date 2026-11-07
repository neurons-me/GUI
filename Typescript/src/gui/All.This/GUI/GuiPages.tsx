// The GUI's own pages, inside the namespace's shell: `/GUI` (what is drawing this page), `/GUI/themes` (the active theme:
// palette, typography) and `/GUI/layout` (the tree the page declares). Declarative: GUI.document.json declares each page
// (`GUI.window.layout.content.gui…`, component `GuiPage`, its route) AND its content, as child parts with a `component`
// and `props`. `GuiPage` only draws what its node declares (guiDocumentPartSpecs + renderNode), in that order; the parts
// are the components registered below (GUI_PAGE_PARTS). Changing what a page shows is changing the tree.
// The theme settings used to be a dialog opened from the launcher's gear; the gear now comes here (themeSettings.ts),
// and the dialog stays only for hosts with no shell to open the page in.
// Where the pages navigate is the shell's (GuiNav): a router's location (netget's shell, the default inside a router), or
// AppShell's route in `.me`. The links are plain <a href> that the shell's `go` takes over, so they also open in a new tab.
import * as React from 'react';
import { useInRouterContext, useLocation, useNavigate } from 'react-router-dom';
import Box from '@/gui/Atoms/Box/Box';
import Typography from '@/gui/Atoms/Typography/Typography';
import Avatar from '@/gui/Atoms/Avatar/Avatar';
import { getGuiThemes } from '@/gui/Theme/utils/catalog';
import { useTheme } from '@mui/material/styles';
import { fontSizePx, relativeSubtitlePx } from '@/gui/Theme/utils/typeScale';
import { useThemeContext } from '@/gui-internals/Contexts/ThemeContext';
import ThemeModeToggle from '@/gui/Theme/ToggleMode/ToggleMode';
import { ThemeInspectorBody, type ThemeInspectorTab } from '@/gui/Theme/Inspector/ThemeInspector';
import { useAddressAxis } from '@/runtime/addressAxis';
import { renderNode } from '@/runtime/renderer';
import { flattenGuiDocument, guiDocumentPartSpecs, GUI_DOCUMENT, type GuiDocument, type GuiDocumentEntry } from '@/runtime/guiDocument';

export const GUI_HOME_ROUTE = '/GUI';
export const GUI_THEMES_ROUTE = '/GUI/themes';
export const GUI_THEMES_TYPOGRAPHY_ROUTE = '/GUI/themes/typography';
export const GUI_LAYOUT_ROUTE = '/GUI/layout';

declare const __GUI_VERSION__: string | undefined;
const GUI_VERSION = typeof __GUI_VERSION__ === 'string' ? __GUI_VERSION__ : '';

/** Where the GUI's pages are and how they move: the shell's own navigation, whatever it is. */
export type GuiNav = { pathname: string; go: (to: string) => void };
const GuiNavContext = React.createContext<GuiNav | null>(null);
/** A shell that does not route with react-router (AppShell routes in `.me`) provides its navigation here. */
export const GuiNavProvider = GuiNavContext.Provider;

/** Inside a react-router router with no GuiNavProvider: the router is the navigation (netget's shell). */
function RouterGuiNav({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const nav = React.useMemo<GuiNav>(() => ({ pathname, go: (to) => navigate(to) }), [pathname, navigate]);
  return <GuiNavContext.Provider value={nav}>{children}</GuiNavContext.Provider>;
}

function useGuiNav(): GuiNav {
  const nav = React.useContext(GuiNavContext);
  if (!nav) throw new Error('GUI pages need a GuiNavProvider or a router.');
  return nav;
}

/** A link between the GUI's pages: an ordinary <a href> (open in a new tab works), followed by the shell's `go`. */
const GuiLink = React.forwardRef<HTMLAnchorElement, React.AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }>(function GuiLink({ to, onClick, ...rest }, ref) {
  const nav = useGuiNav();
  return (
    <a
      ref={ref}
      href={to}
      {...rest}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        nav.go(to);
      }}
    />
  );
});

/** What a part may need from the page it is drawn in: the document (the whole tree, the GUI's plus the app's). */
const GuiPageContext = React.createContext<{ doc: GuiDocument }>({ doc: GUI_DOCUMENT });

type PartProps = { 'data-gui-node-id'?: string; children?: React.ReactNode };

// ── the page ─────────────────────────────────────────────────────────────────────────────────────────────────────────

// On the address axis (addressAxis.ts): the page starts on the same left line as the address in the top bar, as its
// continuation, and its first line sits close under the bar. The width is capped for reading, from the left.
// The heading line has lineHeight 1, so its glyph box starts ADDRESS_PAGE_TOP_PX under the bar; its ink (the title's
// capitals) ~2px lower. Both are measured by addressAxis.browser.test.mjs.
function usePageSx() {
  const axis = useAddressAxis();
  return React.useMemo(() => ({
    pl: `${axis.pagePl}px`,
    pr: 3,
    pt: `${axis.pagePt()}px`,
    pb: { xs: 5, sm: 8 },
    maxWidth: 820,
    mx: 0,
    boxSizing: 'border-box',
    width: '100%',
  }), [axis]);
}

/**
 * A page of the GUI: draws the parts its document node declares, in order. `partsOf` draws another node's parts (the
 * same page served on a second route: `/GUI/themes/typography` is `/GUI/themes` with its other tab open).
 */
export function GuiPage({ guiDocument, partsOf, 'data-gui-node-id': nodeId = 'GUI.window.layout.content.gui', 'data-gui-component': component = 'GuiPage' }: {
  guiDocument?: GuiDocument;
  partsOf?: string;
  'data-gui-node-id'?: string;
  'data-gui-component'?: string;
}) {
  const doc = guiDocument ?? GUI_DOCUMENT;
  const specs = React.useMemo(() => guiDocumentPartSpecs(partsOf || nodeId, doc), [partsOf, nodeId, doc]);
  const context = React.useMemo(() => ({ doc }), [doc]);
  const nav = React.useContext(GuiNavContext);
  const inRouter = useInRouterContext();
  const page = (
    <GuiPageContext.Provider value={context}>
      <Box data-gui-node-id={nodeId} data-gui-component={component} sx={usePageSx()}>
        {specs.map((spec) => <React.Fragment key={spec.props['data-gui-node-id']}>{renderNode(spec as any, { React, registry: GUI_PAGE_PARTS })}</React.Fragment>)}
      </Box>
    </GuiPageContext.Provider>
  );
  // the shell's navigation when it gave one; else the router's (netget's shell); else the page is not navigable
  if (nav) return page;
  if (inRouter) return <RouterGuiNav>{page}</RouterGuiNav>;
  throw new Error('GuiPage needs a GuiNavProvider or a router.');
}

// ── the parts ────────────────────────────────────────────────────────────────────────────────────────────────────────

const monoSx = { fontFamily: 'monospace' } as const;
const HEADING_VARIANT = 'h4' as const;
// Optical, not geometric: the trail's uppercase Roboto (`G`) carries ~1px less side bearing than the address's monospace
// `?`, so with equal boxes its ink started 1px left of the address's. Measured by the browser test (ink, dpr 1 and 2).
const TRAIL_INK_SHIFT_PX = 1;

/**
 * A subtitle that accompanies the heading: its size comes from the title's (typeScale.ts: √(title · body), halfway
 * between them), so a bigger title gets a bigger subtitle; the secondary text color and a compact, semibold setting make
 * it another kind of text, as the theme's subtitles are.
 */
function HeadingSubtitle({ children, nodeId }: { children: React.ReactNode; nodeId: string }) {
  const theme = useTheme() as any;
  const titlePx = fontSizePx(theme?.typography?.[HEADING_VARIANT]?.fontSize) ?? 21;
  const bodyPx = fontSizePx(theme?.typography?.body1?.fontSize) ?? 16;
  return (
    <Typography
      component="p"
      data-gui-node-id={`${nodeId}.subtitle`}
      sx={{
        m: 0,
        mt: 0.75,
        fontFamily: theme?.typography?.subtitle1?.fontFamily,
        fontSize: `${relativeSubtitlePx(titlePx, bodyPx).toFixed(2)}px`,
        fontWeight: 600,
        lineHeight: 1.25,
        letterSpacing: '-0.015em',
        color: 'text.secondary',
      }}
    >
      {children}
    </Typography>
  );
}

/**
 * The page's heading, ONE line: where it sits (`parents`: small, dim, each a link) and its name at title size, on one
 * baseline -- `GUI / Themes`. `version` puts this.gui's version beside the name; `subtitle` goes under it (`{parts}` is
 * the number of parts the document declares); `titleStyle: brand` sets the name in the brand's mono and color. Its child
 * parts (a mode control) sit at the end of the line. `spacing` is the space under it (theme spacing units).
 */
function GuiHeading({ title, parents = [], version, subtitle, titleStyle, spacing = 3, children, 'data-gui-node-id': nodeId = 'heading' }: PartProps & {
  title?: string;
  parents?: Array<{ label: string; to: string }>;
  version?: boolean;
  subtitle?: string;
  titleStyle?: 'brand';
  spacing?: number;
}) {
  const { doc } = React.useContext(GuiPageContext);
  const parts = React.useMemo(() => flattenGuiDocument(doc).length, [doc]);
  const titleSx = titleStyle === 'brand' ? { ...monoSx, color: 'primary.main' } : undefined;
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: spacing }}>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant={HEADING_VARIANT}
          component="h1"
          data-gui-node-id={nodeId}
          sx={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', columnGap: 1, fontWeight: 600, lineHeight: 1, m: 0, ml: parents.length ? `${TRAIL_INK_SHIFT_PX}px` : 0 }}
        >
          {parents.length ? (
            <Typography component="span" variant="overline" data-gui-node-id={`${nodeId}.trail`} sx={{ opacity: 0.6, letterSpacing: '0.12em', lineHeight: 1, fontWeight: 400 }}>
              {parents.map((step) => (
                <React.Fragment key={step.to}>
                  <Box component={GuiLink} to={step.to} sx={{ color: 'inherit' }}>{step.label}</Box>
                  {' /'}
                </React.Fragment>
              ))}
            </Typography>
          ) : null}
          <Box component="span" data-gui-node-id={`${nodeId}.title`} sx={titleSx}>{title}</Box>
          {version && GUI_VERSION ? (
            <Typography component="span" variant="caption" data-gui-node-id={`${nodeId}.version`} sx={{ ...monoSx, color: 'text.secondary', fontWeight: 400, lineHeight: 1 }}>
              {GUI_VERSION}
            </Typography>
          ) : null}
        </Typography>
        {subtitle ? <HeadingSubtitle nodeId={nodeId}>{subtitle.replace('{parts}', String(parts))}</HeadingSubtitle> : null}
      </Box>
      {children}
    </Box>
  );
}

/** A labelled row: the label, then its child parts on one line. */
function GuiRow({ label, children, 'data-gui-node-id': nodeId }: PartProps & { label?: string }) {
  return (
    <Box data-gui-node-id={nodeId} sx={{ display: 'flex', gap: 2, alignItems: 'center', py: 0.75, borderBottom: '1px solid', borderColor: 'divider' }}>
      <Typography variant="body2" sx={{ width: 120, flexShrink: 0, color: 'text.secondary' }}>{label}</Typography>
      <Box sx={{ minWidth: 0, flex: 1, display: 'flex', alignItems: 'center', gap: 1.25 }}>{children}</Box>
    </Box>
  );
}

/** The active theme, its avatar and name, as a link (`to`). */
function ActiveTheme({ to = GUI_THEMES_ROUTE, 'data-gui-node-id': nodeId }: PartProps & { to?: string }) {
  const { themeId, themeName } = useThemeContext();
  const theme = React.useMemo(() => getGuiThemes().find((t) => t.themeId === themeId), [themeId]);
  return (
    <Box
      component={GuiLink}
      to={to}
      data-gui-node-id={nodeId}
      sx={{ display: 'flex', alignItems: 'center', gap: 1.25, color: 'inherit', textDecoration: 'none', '&:hover .gui-theme-name': { textDecoration: 'underline' } }}
    >
      {theme?.badgeUrl ? (
        <Avatar src={theme.badgeUrl} alt={themeName} sx={{ width: 24, height: 24 }} />
      ) : (
        <Avatar sx={{ width: 24, height: 24, fontSize: 12 }}>{themeName?.[0] ?? 'T'}</Avatar>
      )}
      <Typography variant="body2">
        <Box component="span" className="gui-theme-name" sx={{ color: 'primary.main' }}>{themeName || 'Theme'}</Box>
      </Typography>
    </Box>
  );
}

/** Light or dark, as the theme's own control (its icon is the mode), at the end of the line it is in. */
function ThemeMode({ 'data-gui-node-id': nodeId }: PartProps) {
  return (
    <Box data-gui-node-id={nodeId} sx={{ ml: 'auto', display: 'flex' }}>
      <ThemeModeToggle variant="minimal" iconSize="small" />
    </Box>
  );
}

/** A link to a route, with its text. */
function RouteLink({ to = '/', text, 'data-gui-node-id': nodeId }: PartProps & { to?: string; text?: string }) {
  return (
    <Typography variant="body2" data-gui-node-id={nodeId}>
      <Box component={GuiLink} to={to} sx={{ color: 'primary.main' }}>{text ?? to}</Box>
    </Typography>
  );
}

/** The active theme's strip, palette and typography; the open tab is part of the address (`routes`). */
function ThemeInspectorPanel({ routes = { palette: GUI_THEMES_ROUTE, typography: GUI_THEMES_TYPOGRAPHY_ROUTE }, 'data-gui-node-id': nodeId }: PartProps & {
  routes?: { palette: string; typography: string };
}) {
  const { pathname, go: navigate } = useGuiNav();
  const tab: ThemeInspectorTab = pathname.replace(/\/+$/, '') === routes.typography.replace(/\/+$/, '') ? 'typography' : 'palette';
  return (
    <Box data-gui-node-id={nodeId} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
      <ThemeInspectorBody tab={tab} onTab={(next) => navigate(routes[next])} nodeId={nodeId} />
    </Box>
  );
}

/** One part of the tree and the parts under it. */
function TreeNode({ entry, byId, depth }: { entry: GuiDocumentEntry; byId: Map<string, GuiDocumentEntry>; depth: number }) {
  return (
    <Box component="li" sx={{ listStyle: 'none' }}>
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'baseline', py: 0.25, pl: depth * 2 }} title={entry.note || undefined}>
        <Typography variant="body2" sx={{ ...monoSx, fontWeight: entry.component ? 700 : 400 }}>{entry.type}</Typography>
        {entry.component ? <Typography variant="caption" sx={{ color: 'text.secondary' }}>{entry.component}</Typography> : null}
        {entry.route ? (
          <Typography variant="caption" sx={monoSx}>
            <Box component={GuiLink} to={entry.route} sx={{ color: 'primary.main' }}>{entry.route}</Box>
          </Typography>
        ) : null}
      </Box>
      {entry.childIds.length ? (
        <Box component="ul" sx={{ m: 0, p: 0 }}>
          {entry.childIds.map((id) => {
            const child = byId.get(id);
            return child ? <TreeNode key={id} entry={child} byId={byId} depth={depth + 1} /> : null;
          })}
        </Box>
      ) : null}
    </Box>
  );
}

/**
 * The tree the page declares (GUI.document.json plus what the app adds), every part with its name, the component that
 * implements it and its route. The same ids the Semantic Inspector reads; nothing is drawn that the document does not say.
 */
function DocumentTree({ 'data-gui-node-id': nodeId }: PartProps) {
  const { doc } = React.useContext(GuiPageContext);
  const entries = React.useMemo(() => flattenGuiDocument(doc), [doc]);
  const byId = React.useMemo(() => new Map(entries.map((e) => [e.id, e])), [entries]);
  const roots = entries.filter((e) => !e.parentId);
  return (
    <Box component="ul" data-gui-node-id={nodeId} sx={{ m: 0, p: 0 }}>
      {roots.map((root) => <TreeNode key={root.id} entry={root} byId={byId} depth={0} />)}
    </Box>
  );
}

/** The components the GUI pages' parts may name (`component` in the document), by that name. */
export const GUI_PAGE_PARTS: Record<string, React.ComponentType<any>> = {
  GuiHeading,
  GuiRow,
  ActiveTheme,
  ThemeMode,
  RouteLink,
  ThemeInspectorPanel,
  DocumentTree,
};
