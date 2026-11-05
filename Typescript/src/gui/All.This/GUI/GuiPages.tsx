// The GUI's own pages, inside the namespace's shell: `/GUI` (what is drawing this page), `/GUI/themes` (the active theme:
// palette, typography) and `/GUI/layout` (the tree the page declares). They are declared in GUI.document.json under
// `GUI.window.layout.content.gui`, like every other page, and have addresses: a refresh keeps you there and Back returns.
// The theme settings used to be a dialog opened from the launcher's gear; the gear now comes here (themeSettings.ts),
// and the dialog stays only for hosts with no router.
import * as React from 'react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import Box from '@/gui/Atoms/Box/Box';
import Typography from '@/gui/Atoms/Typography/Typography';
import { useThemeContext } from '@/gui-internals/Contexts/ThemeContext';
import ThemeModeToggle from '@/gui/Theme/ToggleMode/ToggleMode';
import { ThemeInspectorBody, type ThemeInspectorTab } from '@/gui/Theme/Inspector/ThemeInspector';
import { flattenGuiDocument, GUI_DOCUMENT, type GuiDocument, type GuiDocumentEntry } from '@/runtime/guiDocument';

export const GUI_HOME_ROUTE = '/GUI';
export const GUI_THEMES_ROUTE = '/GUI/themes';
export const GUI_THEMES_TYPOGRAPHY_ROUTE = '/GUI/themes/typography';
export const GUI_LAYOUT_ROUTE = '/GUI/layout';

type GuiPageProps = {
  'data-gui-node-id'?: string;
  'data-gui-component'?: string;
  /** The document this page belongs to (the GUI's plus the app's); the layout page draws it. */
  guiDocument?: GuiDocument;
};

declare const __GUI_VERSION__: string | undefined;
const GUI_VERSION = typeof __GUI_VERSION__ === 'string' ? __GUI_VERSION__ : '';

// The same air under the top bar as /users (~21px to the first line), not a hero's.
const pageSx = { px: { xs: 3, sm: 6 }, pt: 2.5, pb: { xs: 5, sm: 8 }, maxWidth: 820, mx: 'auto', boxSizing: 'border-box', width: '100%' } as const;
const monoSx = { fontFamily: 'monospace' } as const;

/** `GUI / Themes`: where this page sits under `/GUI`, each step a link but the last. */
function Trail({ steps, nodeId }: { steps: Array<{ label: string; to?: string }>; nodeId: string }) {
  return (
    <Typography variant="overline" data-gui-node-id={`${nodeId}.trail`} sx={{ opacity: 0.6, letterSpacing: '0.12em', display: 'block' }}>
      {steps.map((step, i) => (
        <React.Fragment key={step.label}>
          {i > 0 ? ' / ' : ''}
          {step.to ? (
            <Box component={RouterLink} to={step.to} sx={{ color: 'inherit' }}>{step.label}</Box>
          ) : (
            step.label
          )}
        </React.Fragment>
      ))}
    </Typography>
  );
}

function Row({ label, children, nodeId }: { label: string; children: React.ReactNode; nodeId: string }) {
  return (
    <Box data-gui-node-id={nodeId} sx={{ display: 'flex', gap: 2, alignItems: 'baseline', py: 0.75, borderBottom: '1px solid', borderColor: 'divider' }}>
      <Typography variant="body2" sx={{ width: 120, flexShrink: 0, color: 'text.secondary' }}>{label}</Typography>
      <Box sx={{ minWidth: 0 }}>{children}</Box>
    </Box>
  );
}

/** `/GUI`: what is drawing this page, and the way to each part. */
export function GuiHome({ 'data-gui-node-id': nodeId = 'GUI.window.layout.content.gui', 'data-gui-component': component = 'GuiHome' }: GuiPageProps) {
  const { themeName, mode } = useThemeContext();
  return (
    <Box data-gui-node-id={nodeId} data-gui-component={component} sx={pageSx}>
      <Trail steps={[{ label: 'GUI' }]} nodeId={nodeId} />
      <Typography variant="h4" component="h1" sx={{ fontWeight: 600, mb: 3 }}>
        <Box component="span" sx={{ ...monoSx, color: 'primary.main' }}>.GUI</Box>
      </Typography>
      {GUI_VERSION ? (
        <Row label="this.gui" nodeId={`${nodeId}.version`}>
          <Typography variant="body2" sx={monoSx}>{GUI_VERSION}</Typography>
        </Row>
      ) : null}
      <Row label="Theme" nodeId={`${nodeId}.theme`}>
        <Typography variant="body2">
          <Box component={RouterLink} to={GUI_THEMES_ROUTE} sx={{ color: 'primary.main' }}>{themeName || 'Theme'}</Box>
          <Box component="span" sx={{ color: 'text.secondary' }}> · {mode}</Box>
        </Typography>
      </Row>
      <Row label="Typography" nodeId={`${nodeId}.typography`}>
        <Typography variant="body2">
          <Box component={RouterLink} to={GUI_THEMES_TYPOGRAPHY_ROUTE} sx={{ color: 'primary.main' }}>the active theme's type scale</Box>
        </Typography>
      </Row>
      <Row label="Layout" nodeId={`${nodeId}.layout`}>
        <Typography variant="body2">
          <Box component={RouterLink} to={GUI_LAYOUT_ROUTE} sx={{ color: 'primary.main' }}>the tree this page declares</Box>
        </Typography>
      </Row>
    </Box>
  );
}

/** `/GUI/themes` and `/GUI/themes/typography`: the active theme. The tab is part of the address. */
export function GuiThemes({ 'data-gui-node-id': nodeId = 'GUI.window.layout.content.gui.themes', 'data-gui-component': component = 'GuiThemes' }: GuiPageProps) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const tab: ThemeInspectorTab = pathname.replace(/\/+$/, '').endsWith('/typography') ? 'typography' : 'palette';
  return (
    <Box data-gui-node-id={nodeId} data-gui-component={component} sx={pageSx}>
      <Trail steps={[{ label: 'GUI', to: GUI_HOME_ROUTE }, { label: 'Themes' }]} nodeId={nodeId} />
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600, flex: 1 }}>Themes</Typography>
        <ThemeModeToggle variant="minimal" iconSize="small" />
      </Box>
      <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
        <ThemeInspectorBody
          tab={tab}
          onTab={(next) => navigate(next === 'typography' ? GUI_THEMES_TYPOGRAPHY_ROUTE : GUI_THEMES_ROUTE)}
          nodeId={nodeId}
        />
      </Box>
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
            <Box component={RouterLink} to={entry.route} sx={{ color: 'primary.main' }}>{entry.route}</Box>
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
 * `/GUI/layout`: the tree the page declares (GUI.document.json plus what the app adds), every part with its name, the
 * component that implements it and its route. The same ids the Semantic Inspector reads; nothing is drawn here that the
 * document does not say.
 */
export function GuiLayout({ guiDocument, 'data-gui-node-id': nodeId = 'GUI.window.layout.content.gui.layout', 'data-gui-component': component = 'GuiLayout' }: GuiPageProps) {
  const entries = React.useMemo(() => flattenGuiDocument(guiDocument ?? GUI_DOCUMENT), [guiDocument]);
  const byId = React.useMemo(() => new Map(entries.map((e) => [e.id, e])), [entries]);
  const roots = entries.filter((e) => !e.parentId);
  return (
    <Box data-gui-node-id={nodeId} data-gui-component={component} sx={pageSx}>
      <Trail steps={[{ label: 'GUI', to: GUI_HOME_ROUTE }, { label: 'Layout' }]} nodeId={nodeId} />
      <Typography variant="h4" component="h1" sx={{ fontWeight: 600, mb: 1 }}>Layout</Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
        {entries.length} parts declared. Bold: a part with its own component.
      </Typography>
      <Box component="ul" data-gui-node-id={`${nodeId}.tree`} sx={{ m: 0, p: 0 }}>
        {roots.map((root) => <TreeNode key={root.id} entry={root} byId={byId} depth={0} />)}
      </Box>
    </Box>
  );
}
