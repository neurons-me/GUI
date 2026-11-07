// A route of the namespace opened where the namespace is not the page (Roles-and-Territories.md §3; the rule: on the
// namespace's own page its routes render in the content area; on any other page -- with .GUI (AppShell) or without
// (Cleaker on a page) -- they open in the content area's place, over the page, which stays as it is underneath).
import React from 'react';
import type { Theme as MuiTheme } from '@mui/material/styles';
import { Box, Button, Typography } from '@/gui/Atoms';
import IconButton from '@/gui/Atoms/IconButton/IconButton';
import Icon from '@/gui/Atoms/Icon/Icon';
import { GuiPage, GuiNavProvider, type GuiNav } from '@/gui/All.This/GUI/GuiPages';
import { flattenGuiDocument, renderGuiDocumentPage, GUI_DOCUMENT } from '@/runtime/guiDocument';

/** What a view of a namespace route is given when it opens over a page. */
export type NamespaceRouteProps = { namespace: string | null; route: string; go: (route: string) => void };

/** A route of the namespace as a bar draws it: where it goes in the namespace, its name, its icon. */
export type NamespaceRouteItem = { route: string; label: string; icon?: string };

// The GUI's own pages, by route (`/GUI/themes`), as GUI.document.json declares them: the same pages the shell serves.
const GUI_PAGES_ID = 'GUI.window.layout.content.gui';
const GUI_PAGE_BY_ROUTE = new Map(
  flattenGuiDocument(GUI_DOCUMENT)
    .filter((e) => (e.id === GUI_PAGES_ID || e.id.startsWith(`${GUI_PAGES_ID}.`)) && e.component && e.route)
    .map((e) => [String(e.route), { id: e.id, label: e.label ?? String(e.route) }] as const),
);
// Every route the document declares a page for, with its label (the modal's title).
const ROUTE_LABELS = new Map(
  flattenGuiDocument(GUI_DOCUMENT).filter((e) => e.route && e.label).map((e) => [String(e.route), String(e.label)] as const),
);
const normalRoute = (to: string) => `/${to.replace(/^\/+/, '').replace(/\/+$/, '')}`;

/**
 * A route of the namespace, opened over the author's page: on the namespace's own page it renders in the content area;
 * here it takes the content area's place (between the bars) over the author's page, which stays as it is underneath.
 */
export function NamespaceRoutePanel({ route, label, namespace, pages, go, onClose }: {
  route: string | null;
  label?: string;
  namespace: string | null;
  pages?: Record<string, React.ComponentType<NamespaceRouteProps>>;
  go: (route: string) => void;
  onClose: () => void;
}) {
  const nav = React.useMemo<GuiNav>(() => ({ pathname: route ?? '/', go: (to) => go(normalRoute(to)) }), [route, go]);
  React.useEffect(() => {
    if (!route) return undefined;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [route, onClose]);
  if (!route) return null;
  const guiPage = GUI_PAGE_BY_ROUTE.get(route);
  const View = pages?.[route];
  const title = label ?? guiPage?.label ?? ROUTE_LABELS.get(route) ?? route;
  const door = namespace ? `https://${namespace}${route}` : null;
  return (
    // In the content area's place: between the bars, by the sizes they publish on the document (--gui-*), so it
    // follows a bar that expands, collapses or becomes a drawer. Under the bars (their menus stay usable, another item
    // switches the route), over the author's page, which is untouched and back as it was when this closes.
    <Box
      component="section"
      role="dialog"
      aria-label={title}
      data-cleaker-route={route}
      data-gui-node-id="GUI.window.layout.marks.identity.route"
      sx={{
        position: 'fixed',
        // the top bar publishes its height as the nav height (--gui-nav-height: nav, else the top inset)
        top: 'var(--gui-nav-height, var(--gui-inset-top, 0px))',
        left: 'var(--gui-inset-left, 0px)',
        right: 'var(--gui-inset-right, 0px)',
        bottom: 'var(--gui-inset-bottom, 0px)',
        zIndex: (t: MuiTheme) => t.zIndex.appBar - 1,
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.default',
        color: 'text.primary',
        overflow: 'hidden',
      }}
    >
      {/* phone width: the left bar is a drawer whose button hangs at the top-left of the content area; the title starts past it */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, pl: { xs: 7, sm: 2 }, py: 1.25, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, lineHeight: 1.2 }}>{title}</Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'monospace' }}>{`${namespace ?? ''}${route}`}</Typography>
        </Box>
        <IconButton aria-label="Close" onClick={onClose} size="small"><Icon name="close" /></IconButton>
      </Box>
      <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
        {guiPage ? (
          <GuiNavProvider value={nav}>
            {renderGuiDocumentPage(guiPage.id, { React, registry: { GuiPage }, doc: GUI_DOCUMENT, props: { guiDocument: GUI_DOCUMENT } })}
          </GuiNavProvider>
        ) : View ? (
          <View namespace={namespace} route={route} go={go} />
        ) : (
          <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2 }} data-cleaker-route-missing="">
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {namespace ? `This page does not draw ${title} of ${namespace}. At ${namespace} it opens in its content area.` : `No namespace is chosen: ${title} has nowhere to come from.`}
            </Typography>
            {door && <Button variant="outlined" component="a" href={door} target="_blank" rel="noopener noreferrer">{`Open at ${namespace}`}</Button>}
          </Box>
        )}
      </Box>
    </Box>
  );
}
