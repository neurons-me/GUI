// LeftBar.tsx
import clsx from 'clsx';
import React, { useEffect, useMemo, useState, useRef } from 'react';
import IconButton from '@mui/material/IconButton';
import Icon from '@/gui/Atoms/Icon/Icon';
import { LeftSidebarElement, LeftSidebarProps } from './LeftBar.types';
import LeftSidebarLink from './components/LeftSidebarLink/LeftSidebarLink';
import LeftSidebarMenu from './components/LeftSidebarMenu/LeftSidebarMenu';
import LeftSidebarAction from './components/LeftSidebarAction/LeftSidebarAction';
import LeftSidebarToggleButton, { EDGE_TAB_SPACE } from './components/LeftSidebarToggleButton/LeftSidebarToggleButton';
import { useLeftSidebar, useGuiTheme, useGuiMediaQuery, useUpdateInsets, useInsets } from '@/gui-internals/Hooks';
import { Box, Typography } from '@/gui/Atoms';
import { Drawer } from '@/gui/Molecules';
import type { LeftSidebarView } from '@/gui-internals/Contexts';
import { selectionStore } from '@/runtime/selectionStore';
import { GuiParent } from '@/runtime/selection';
import { GuiNodeIdBase } from '@/runtime/guiNodeId';
import { buildLeftSidebarElementMeta, getSidebarRootPath } from './leftBarIds';
import type { ResolvedNodeRecord } from '@/runtime/renderer';
import { mergeLeftSidebarCollections } from '@/gui/Layout/Sidebars/Collections/resolveCollections';
import { leftBarLayoutProps } from '@/runtime/guiDocument';

const LEFT_BAR_LAYOUT = leftBarLayoutProps();
const RAIL_WIDTH_PX = LEFT_BAR_LAYOUT.railWidth;
const EXPANDED_WIDTH_PX = LEFT_BAR_LAYOUT.expandedWidth;

// Shared, module-level — not object literals inlined at each use below.
// selectionStore's registerNode bail-out (isSameRecord) compares
// `spec.props`/`spec.provenance` by reference; a fresh `{}` built inline on
// every effect run can never match a previous call's `{}`, so the bail-out
// never fires and every dependency change on the registration effect forces
// a full store mutation + notify() for these three synthetic records even
// when their actual content is unchanged. One shared reference per constant
// value lets the existing bail-out work as intended.
const EMPTY_SYNTHETIC_PROPS: Record<string, unknown> = {};

// The bar's own configuration as plain data, for the Inspector's JSON view:
// its links and actions with their labels, routes and icons. Functions and
// React elements (a launcher, a custom header) can't be shown as data, so they
// appear as placeholders.
// The same object while its JSON is unchanged. The shell builds this bar's
// element list anew on every render; registering fresh objects each time made
// the registry think the records changed, which notified the selection, which
// re-rendered the shell -- a loop whenever one of these nodes was selected.
function useStableByJson<T>(value: T): T {
  const ref = useRef<{ json: string; value: T } | null>(null);
  const json = JSON.stringify(value);
  if (!ref.current || ref.current.json !== json) ref.current = { json, value };
  return ref.current.value;
}

function toPlainSpec(value: unknown, depth = 0): unknown {
  if (value == null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value;
  if (typeof value === 'function') return '[function]';
  if (React.isValidElement(value)) return '[element]';
  if (depth > 5) return '[…]';
  if (Array.isArray(value)) return value.map((item) => toPlainSpec(item, depth + 1));
  if (typeof value === 'object') {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, toPlainSpec(v, depth + 1)]));
  }
  return String(value);
}
const LEFT_SIDEBAR_TOGGLE_PROVENANCE = {
  source: 'LeftBar.LeftSidebarToggleButton',
  note: 'Expand/collapse control for the left sidebar rail; view state is local (useLeftSidebar context), not kernel-bound, so no semanticPath/explainPath applies.',
} as const;

const LeftSidebar = ({
  elements = [],
  collections = [],
  className,
  id,
  style,
  initialView = LEFT_BAR_LAYOUT.view,
  footerElements = [],
  footerCollections = [],
  header,
  brand,
  toggle: customToggle,
  togglePlacement = 'header',
  collapsedHandle,
  collapsedHandleOpensBar = true,
  ['data-gui-node-id']: dataGuiNodeId,
  ['data-gui-component']: dataGuiComponent,
}: LeftSidebarProps & {
  initialView?: LeftSidebarView;
  header?: React.ReactNode | { title?: string; icon?: string; iconColor?: string };
}) => {
  const { view, setView } = useLeftSidebar();
  const theme = useGuiTheme();
  const isMobile = useGuiMediaQuery(theme.breakpoints.down('sm'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [lastNonMobileView, setLastNonMobileView] = useState<LeftSidebarView>(view === 'mobile' ? 'expanded' : view);
  const setInsets = useUpdateInsets();
  const insets = useInsets();
  const navInset = Math.max(0, Number(insets?.nav ?? insets?.top ?? 0));
  const headerHeight = navInset > 0 ? navInset : 48;
  const toggleOffset = (navInset > 0 ? navInset : 0) + 12;
  const resolvedElements = useMemo(
    () => mergeLeftSidebarCollections<LeftSidebarElement>(elements, collections, 'leftSidebar'),
    [collections, elements]
  );
  const resolvedFooterElements = useMemo(
    () =>
      mergeLeftSidebarCollections<LeftSidebarElement>(
        footerElements,
        footerCollections,
        'leftSidebarFooter'
      ),
    [footerCollections, footerElements]
  );
  const hasFooterElements =
    Array.isArray(resolvedFooterElements) && resolvedFooterElements.length > 0;
  const initialViewApplied = useRef(false);
  const adminNodeId = dataGuiNodeId ? String(dataGuiNodeId) : id ? String(id) : 'GUI.window.layout.bars.left';
  const adminAttrs = {
    'data-gui-node-id': adminNodeId,
    'data-gui-component': dataGuiComponent || 'left',
  };
  const toggleButtonNodeId = `${adminNodeId}.toggle`;
  const headerNodeId = `${adminNodeId}.header`;
  const rawHeaderNode = (() => {
    if (!header) return null;
    if (React.isValidElement(header)) return header;
    if (typeof header === 'string') {
      return (
        <Typography variant="body2" sx={{ fontWeight: 700, letterSpacing: 0.2 }}>
          {header}
        </Typography>
      );
    }
    if (typeof header === 'object') {
      const title = (header as any).title;
      const iconName = (header as any).icon;
      const iconColor = (header as any).iconColor;
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
          {iconName && !brand ? <Icon name={iconName} iconColor={iconColor} /> : null}
          {view !== 'rail' && title ? (
            <Typography variant="body2" sx={{ fontWeight: 700, letterSpacing: 0.2 }}>
              {title}
            </Typography>
          ) : null}
        </Box>
      );
    }
    return null;
  })();
  const headerNode = view === 'rail' ? null : rawHeaderNode;
  // The control that changes the bar's width. The app's own element when it gave one (it leads the header and
  // `headerNode` sits beside it); otherwise the arrow, at the end of the header.
  // `brand` is the app's mark (a logo, the position QR): it leads the header in every view and is the app's own link, so
  // it never doubles as the expand control. The control is then the standard arrow, drawn as a handle on the bar's right
  // border (`edge`) where the bar is a column beside the page; the temporary mobile drawer clips anything past its
  // border, so there it stays in the header (`inline`).
  const leadingCell = !!(customToggle || brand);
  const toggleControl = (expanded: boolean, onToggle: () => void, viewForApp: LeftSidebarView, placement: 'inline' | 'edge') =>
    customToggle ? (
      // Flush with the corner and as tall as the header: the control is the whole cell, not the glyph inside it.
      <Box data-gui-node-id={toggleButtonNodeId} data-gui-component="toggle" sx={{ display: 'flex', alignItems: 'stretch', flexShrink: 0, width: view === 'rail' ? '100%' : `${RAIL_WIDTH_PX}px`, height: '100%' }}>
        {customToggle({ view: viewForApp, toggle: onToggle })}
      </Box>
    ) : (
      <LeftSidebarToggleButton
        expanded={expanded}
        onToggle={onToggle}
        placement={brand ? placement : 'inline'}
        data-gui-node-id={toggleButtonNodeId}
        data-gui-component="toggle"
      />
    );
  const headerContent = (expanded: boolean, onToggle: () => void, viewForApp: LeftSidebarView, placement: 'inline' | 'edge' = 'edge') => {
    const text = headerNode ? (
      <Box key="header-text" sx={{ display: 'flex', alignItems: 'center', minWidth: 0, flex: leadingCell ? 1 : undefined, pr: brand && !customToggle && placement === 'edge' ? `${EDGE_TAB_SPACE}px` : 0 }}>
        {headerNode}
      </Box>
    ) : null;
    const control = <React.Fragment key="toggle">{toggleControl(expanded, onToggle, viewForApp, placement)}</React.Fragment>;
    const brandCell = brand ? (
      <Box
        key="brand"
        data-gui-node-id={`${adminNodeId}.brand`}
        data-gui-component="brand"
        sx={{
          display: 'flex',
          alignItems: 'stretch',
          // Rail: centre the mark in the column, on the same line as the rail icons.
          // Expanded: keep it at the outer (left) edge, as before, so the text can sit beside it.
          justifyContent: viewForApp === 'rail' ? 'center' : 'flex-start',
          flexShrink: 0,
          // Expanded with no header text: the brand is the whole head (its own text inside, one button), up to the toggle.
          flexGrow: viewForApp !== 'rail' && !headerNode ? 1 : 0,
          minWidth: viewForApp === 'rail' ? undefined : `${RAIL_WIDTH_PX}px`,
          width: viewForApp === 'rail' ? '100%' : 'auto',
          mr: viewForApp !== 'rail' && !headerNode && !customToggle && placement === 'edge' ? `${EDGE_TAB_SPACE}px` : 0,
          height: '100%',
        }}
      >
        {brand}
      </Box>
    ) : null;
    if (togglePlacement === 'footer') return [brandCell, text];
    if (customToggle) return [brandCell, control, text];
    return brand ? [brandCell, text, control] : [text, control];
  };
  const headerJustify = leadingCell ? 'flex-start' : headerNode ? 'space-between' : 'flex-end';
  // When the brand (and its chevron) sit at the foot, drop the header only if it would
  // otherwise be an empty strip. A mark still in the head (often the QR) keeps its row.
  const showHeader = togglePlacement !== 'footer' || Boolean(brand || (view !== 'rail' && rawHeaderNode));

  /** A footer action that carries the site's brand (the mark sits at the foot). */
  const isBrandFooterItem = (el: { props?: { element?: React.ReactNode } }) => {
    const walk = (n: unknown): boolean => {
      if (!React.isValidElement(n)) return false;
      const props = n.props as Record<string, unknown>;
      const id = String(props['data-gui-node-id'] ?? '');
      const comp = String(props['data-gui-component'] ?? '');
      if (comp === 'brand' || id === 'GUI.window.layout.bars.brand') return true;
      return React.Children.toArray(props.children as React.ReactNode).some(walk);
    };
    return walk(el?.props?.element);
  };

  useEffect(() => {
    if (typeof setInsets !== 'function') return;
    const desired = view === 'expanded' ? EXPANDED_WIDTH_PX : view === 'rail' ? RAIL_WIDTH_PX : 0;
    setInsets({ left: desired }, 'left-sidebar');
    return () => setInsets({ left: 0 }, 'left-sidebar');
  }, [setInsets, view]);

  useEffect(() => {
    initialViewApplied.current = false;
  }, [initialView]);

  useEffect(() => {
    if (initialViewApplied.current) return;
    if (initialView !== 'mobile') {
      if (lastNonMobileView !== initialView) setLastNonMobileView(initialView);
      if (!isMobile && view !== initialView) {
        setView(initialView);
      }
    } else if (view !== 'mobile') {
      setView('mobile');
    }
    initialViewApplied.current = true;
  }, [initialView, isMobile, lastNonMobileView, setView, view]);

  useEffect(() => {
    if (view === 'expanded' || view === 'rail') {
      setLastNonMobileView(view);
    }
  }, [view]);

  useEffect(() => {
    if (isMobile && view !== 'mobile') {
      setView('mobile');
    } else if (!isMobile && view === 'mobile') {
      setView(lastNonMobileView);
    }
  }, [isMobile, lastNonMobileView, setView, view]);

  useEffect(() => {
    if (view !== 'mobile' && mobileOpen) {
      setMobileOpen(false);
    }
  }, [mobileOpen, view]);

  // The bar's configuration and each item's record, as plain data whose
  // identity only changes when the data does.
  const plainBar = useStableByJson({
    header: toPlainSpec(header),
    elements: toPlainSpec(resolvedElements) as any[],
    footerElements: toPlainSpec(resolvedFooterElements) as any[],
  });
  const itemSpecs = useStableByJson(
    (['elements', 'footerElements'] as const).flatMap((section) =>
      (plainBar[section] as any[]).map((el, idx) => {
        const meta = buildLeftSidebarElementMeta(el, adminNodeId, section, idx);
        const props = (el?.props ?? {}) as Record<string, unknown>;
        return {
          meta,
          props,
          resolvedProps: { ...props, 'data-gui-node-id': meta.nodeId, 'data-gui-component': meta.componentName },
        };
      })
    )
  );

  useEffect(() => {
    const rootPath = getSidebarRootPath(adminNodeId);
    // When `data-gui-node-id` was supplied as a prop, LeftBar is being
    // rendered as a resolved declarative spec node (via LeftBarResolver) —
    // the renderer already registered a real record for `adminNodeId`
    // (actual resolvedProps, provenance). Registering a second, bare-bones
    // record here for the same id would silently clobber it, whichever
    // registration commits last. Only self-register the root when there's
    // no such record already owned by the renderer (LeftBar used directly,
    // outside the declarative pipeline, where `adminNodeId` falls back to
    // the plain `id` prop or the 'LeftSidebar' default). The header/toggle
    // sub-records below are always safe — their ids are derived from
    // adminNodeId and the renderer never separately resolves them.
    const syntheticRecords: ResolvedNodeRecord[] = dataGuiNodeId
      ? []
      : [
          {
            id: adminNodeId,
            type: dataGuiComponent || 'left',
            path: rootPath,
            spec: {
              type: dataGuiComponent || 'left',
              props: plainBar as unknown as Record<string, unknown>,
            },
            resolvedProps: plainBar as unknown as Record<string, unknown>,
          },
        ];
    syntheticRecords.push(
      {
        id: headerNodeId,
        type: 'header',
        path: `${rootPath}.header`,
        parentId: adminNodeId,
        spec: { type: 'header', props: EMPTY_SYNTHETIC_PROPS },
      },
      {
        id: toggleButtonNodeId,
        type: 'toggle',
        path: `${rootPath}.header.toggle`,
        parentId: headerNodeId,
        spec: {
          type: 'toggle',
          props: EMPTY_SYNTHETIC_PROPS,
          provenance: LEFT_SIDEBAR_TOGGLE_PROVENANCE,
        },
      },
    );
    itemSpecs.forEach((item) => {
      syntheticRecords.push({
        id: item.meta.nodeId,
        type: item.meta.componentName,
        path: item.meta.path,
        spec: { type: item.meta.componentName, props: item.props },
        resolvedProps: item.resolvedProps,
      });
    });
    syntheticRecords.forEach((record) => selectionStore.actions.registerNode(record));

    return () => {
      syntheticRecords.forEach((record) => selectionStore.actions.unregisterNode(record.id));
    };
  }, [adminNodeId, dataGuiNodeId, dataGuiComponent, headerNodeId, toggleButtonNodeId, plainBar, itemSpecs]);

  const renderElements = () =>
    resolvedElements.map((el, idx) => {
      const key = (el as any)?.props?.id ?? (el as any)?.props?.label ?? idx;
      const adminMeta = buildLeftSidebarElementMeta(el, adminNodeId, 'elements', idx);
      const adminProps = {
        'data-gui-node-id': adminMeta.nodeId,
        'data-gui-component': adminMeta.componentName,
        // The item's own name, declared by the GUI -- the Inspector shows it
        // instead of guessing one from the markup.
        ...((el as any)?.props?.label ? { 'data-gui-label': String((el as any).props.label) } : {}),
      };
      const item =
        el.type === 'link' ? <LeftSidebarLink view={view} {...adminProps} {...el.props} />
        : el.type === 'menu' ? <LeftSidebarMenu view={view} {...adminProps} {...el.props} />
        : el.type === 'action' ? <LeftSidebarAction view={view} {...adminProps} {...el.props} />
        : null;
      // Anything an item registers (a launcher's own parts) belongs to it.
      return item ? <GuiParent key={key} id={adminMeta.nodeId}><GuiNodeIdBase value={adminMeta.nodeId}>{item}</GuiNodeIdBase></GuiParent> : null;
    });
  const renderFooterItems = () =>
    resolvedFooterElements.map((el, idx) => {
      const baseKey = (el as any)?.props?.id ?? (el as any)?.props?.label ?? idx;
      const adminMeta = buildLeftSidebarElementMeta(el, adminNodeId, 'footerElements', idx);
      const adminProps = {
        'data-gui-node-id': adminMeta.nodeId,
        'data-gui-component': adminMeta.componentName,
        // The item's own name, declared by the GUI -- the Inspector shows it
        // instead of guessing one from the markup.
        ...((el as any)?.props?.label ? { 'data-gui-label': String((el as any).props.label) } : {}),
      };
      const item =
        el.type === 'link' ? <LeftSidebarLink view={view} {...adminProps} {...el.props} />
        : el.type === 'menu' ? <LeftSidebarMenu view={view} {...adminProps} {...el.props} />
        : el.type === 'action' ? <LeftSidebarAction view={view} {...adminProps} {...el.props} />
        : null;
      return item ? <GuiParent key={`footer-${el.type}-${baseKey}`} id={adminMeta.nodeId}><GuiNodeIdBase value={adminMeta.nodeId}>{item}</GuiNodeIdBase></GuiParent> : null;
    });

  const renderFooter = (
    expanded: boolean,
    onToggle: () => void,
    viewForApp: LeftSidebarView,
    placement: 'inline' | 'edge',
    footerSx: Record<string, unknown>,
  ) => {
    if (!hasFooterElements) return null;
    const items = renderFooterItems();
    const control = togglePlacement === 'footer'
      ? toggleControl(expanded, onToggle, viewForApp, placement)
      : null;
    if (!control) {
      return (
        <Box component="footer" sx={footerSx}>
          {items}
        </Box>
      );
    }
    const brandAt = resolvedFooterElements.findIndex(isBrandFooterItem);
    const i = brandAt >= 0 ? brandAt : Math.max(0, items.length - 1);
    const before = items.slice(0, i);
    const brandItem = items[i];
    const after = items.slice(i + 1);
    const { px, py, gap, overflowX, overflowY, ...rest } = footerSx as any;
    return (
      <Box
        component="footer"
        data-gui-toggle-placement="footer"
        sx={{ ...rest, overflow: 'visible', px: 0, py: 0, gap: 0 }}
      >
        {before.length ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', px: px ?? 0, py: py ?? 1.5, gap: gap ?? 0.75, overflowX: overflowX ?? 'hidden', overflowY: overflowY ?? 'auto' }}>
            {before}
          </Box>
        ) : null}
        <Box
          data-gui-brand-row=""
          sx={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            minHeight: `${headerHeight}px`,
            px: viewForApp === 'rail' ? (px ?? 1) : 0,
            pr: placement === 'edge' ? `${EDGE_TAB_SPACE}px` : (viewForApp === 'rail' ? (px ?? 1) : 0),
            overflow: 'visible',
            borderTop: '1px solid',
            borderColor: 'divider',
            flexShrink: 0,
          }}
        >
          <Box sx={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center' }}>{brandItem}</Box>
          {control}
        </Box>
        {after.length ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', px: px ?? 0, py: py ?? 1.5, gap: gap ?? 0.75 }}>
            {after}
          </Box>
        ) : null}
      </Box>
    );
  };

  if (view === 'mobile') {
    // One closed-drawer handle. The default is the standard menu button; the brand and the
    // identity QR keep their own actions. `collapsedHandle` is opt-in (a custom mark, or null
    // for no handle). A mark that opens the bar is a real <button aria-label="Open navigation">.
    const closedHandle = collapsedHandle !== undefined ? collapsedHandle : (customToggle ? customToggle({ view: 'mobile', toggle: () => setMobileOpen(true) }) : null);
    const handleKind = closedHandle == null
      ? (collapsedHandle === null ? 'none' : 'menu')
      : (collapsedHandleOpensBar ? 'brand' : 'identity');
    const handleTop = navInset > 0 ? toggleOffset : 8;
    const openDrawer = () => setMobileOpen(true);
    const handleBox = closedHandle != null ? (
      collapsedHandleOpensBar ? (
      <Box
        component="button"
        type="button"
        data-gui-node-id={`${adminNodeId}.toggle.mobile`}
        data-gui-component="toggle"
        data-gui-mobile-handle={handleKind}
        aria-label="Open navigation"
        onClick={(e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); openDrawer(); }}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 48,
          height: 48,
          padding: 0,
          bgcolor: 'background.nav',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: navInset > 0 ? '0 0 12px 0' : 2,
          overflow: 'hidden',
          cursor: 'pointer',
        }}
      >
        {closedHandle}
      </Box>
      ) : (
      <Box
        data-gui-node-id={`${adminNodeId}.toggle.mobile`}
        data-gui-component="toggle"
        data-gui-mobile-handle={handleKind}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 48,
          height: 48,
          bgcolor: 'background.nav',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: navInset > 0 ? '0 0 12px 0' : 2,
          overflow: 'hidden',
          cursor: 'default',
        }}
      >
        {closedHandle}
      </Box>
      )
    ) : handleKind === 'menu' ? (
      <IconButton
        aria-label="Open navigation"
        data-gui-node-id={`${adminNodeId}.toggle.mobile`}
        data-gui-component="toggle"
        data-gui-mobile-handle="menu"
        onClick={openDrawer}
        sx={{
          borderRadius: '0 16px 16px 0',
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          color: 'text.secondary',
          boxShadow: 3,
          '&:hover': {
            bgcolor: 'background.nav',
            color: 'text.primary',
          },
        }}
      >
        <Icon name="menu" />
      </IconButton>
    ) : null;
    return (
      <>
        {handleBox && !mobileOpen ? (
          <Box
            sx={{
              position: 'fixed',
              top: `${handleTop}px`,
              left: navInset > 0 ? 0 : 8,
              zIndex: ((theme as any)?.zIndex?.drawer ?? 1200) + 1,
              display: 'flex',
            }}
          >
            {handleBox}
          </Box>
        ) : null}
        <Drawer
          anchor="left"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          variant="temporary"
          ModalProps={{ keepMounted: true }}
          PaperProps={{
            id,
            style,
            ...adminAttrs,
          }}
          sx={{
            '& .MuiDrawer-paper': {
              width: EXPANDED_WIDTH_PX,
              // A temporary drawer sits over everything, dimmed page included: it starts at the top of the window and covers
              // the top bar's own left end, so there is one header (the drawer's, `headerHeight` tall = the top bar's row)
              // and not a second one under the top bar with its label repeated.
              top: 0,
              height: '100vh',
              display: 'flex',
              flexDirection: 'column',
              borderRight: '1px solid',
              borderColor: 'divider',
            },
          }}
        >
          {showHeader && (
          <Box
            component="header"
            data-gui-node-id={headerNodeId}
            data-gui-component="header"
            sx={{
              position: 'relative',
              flexShrink: 0,
              borderBottom: '1px solid',
              borderColor: 'divider',
              height: `${headerHeight}px`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: headerJustify,
              px: leadingCell ? 0 : 1.5,
              gap: leadingCell ? 0 : 1.25,
            }}
          >
            {headerContent(true, () => setMobileOpen(false), 'expanded', 'inline')}
          </Box>
          )}
          {/* A destination chosen in the temporary drawer closes it: the place it opens is what the person wants to see. */}
          <Box
            sx={{ flex: '0 1 auto', minHeight: 0, overflowY: 'auto' }}
            onClick={(e) => { if ((e.target as HTMLElement).closest?.('[data-gui-component="link"]')) setMobileOpen(false); }}
          >
            {renderElements()}
          </Box>
          {renderFooter(true, () => setMobileOpen(false), 'expanded', 'inline', {
            flexShrink: 0,
            px: 0,
            py: 1.5,
            borderColor: 'divider',
            display: 'flex',
            flexDirection: 'column',
            gap: 0.75,
          })}
        </Drawer>
      </>
    );
  }

  // Rail and expanded share one aside so a width change can animate and
  // the identity mark (and the open QR card) stay mounted.
  const isRail = view === 'rail';
  return (
    <Box
      component="aside"
      className={clsx('LeftSidebar', className)}
      id={id}
      style={style}
      {...adminAttrs}
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        width: `${isRail ? RAIL_WIDTH_PX : EXPANDED_WIDTH_PX}px`,
        overflow: 'visible',
        borderRight: '1px solid',
        borderColor: 'divider',
        '--gui-rail-width': `${RAIL_WIDTH_PX}px`,
        '--gui-expanded-width': `${EXPANDED_WIDTH_PX}px`,
        backgroundColor: 'background.nav',
        zIndex: (theme) => theme.zIndex.drawer + 2,
        transition: 'width 0.3s ease',
        '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
      }}
    >
      {showHeader && (
      <Box
        component="header"
        data-gui-node-id={headerNodeId}
        data-gui-component="header"
        sx={{
          position: 'relative',
          flexShrink: 0,
          borderBottom: '1px solid',
          borderColor: 'divider',
          height: `${headerHeight}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: headerJustify,
          px: leadingCell ? 0 : 1.5,
          py: 0,
          gap: leadingCell ? 0 : 1.25,
        }}
      >
        {headerContent(!isRail, () => setView(isRail ? 'expanded' : 'rail'), isRail ? 'rail' : 'expanded')}
      </Box>
      )}
      {/* Footer stays docked; this flex grow shrinks if the list overflows. */}
      <Box sx={{ flex: '1 1 auto', minHeight: 0, overflowY: 'auto' }}>{renderElements()}</Box>
      {renderFooter(!isRail, () => setView(isRail ? 'expanded' : 'rail'), isRail ? 'rail' : 'expanded', 'edge', {
        flexShrink: 0,
        px: isRail ? 1 : 0,
        py: 1.5,
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
        gap: isRail ? 0.5 : 0.75,
        maxWidth: '100%',
        overflowX: 'hidden',
        overflowY: 'auto',
      })}
    </Box>
  );
};

export default LeftSidebar;
