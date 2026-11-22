import clsx from 'clsx';
import React, { useEffect, useMemo, useState, useRef } from 'react';
import IconButton from '@mui/material/IconButton';
import Icon from '@/gui/Atoms/Icon/Icon';
import { Box, Typography } from '@/gui/Atoms';
import { Drawer } from '@/gui/Molecules';
import { useRightBar, useGuiTheme, useGuiMediaQuery, useUpdateInsets, useInsets } from '@/gui-internals/Hooks';
import type { RightBarView } from '@/gui-internals/Contexts';
import type { RightBarElement, RightBarProps } from './RightBar.types';
import RightBarLink from './components/RightSidebarLink/RightSidebarLink';
import RightBarMenu from './components/RightSidebarMenu/RightSidebarMenu';
import RightBarAction from './components/RightSidebarAction/RightSidebarAction';
import RightBarToggleButton from './components/RightSidebarToggleButton/RightSidebarToggleButton';
import LeftSidebarToggleButton, { EDGE_TAB_SPACE } from '@/gui/Layout/Sidebars/LeftBar/components/LeftSidebarToggleButton/LeftSidebarToggleButton';
import { selectionStore } from '@/runtime/selectionStore';
import type { ResolvedNodeRecord } from '@/runtime/renderer';
import { mergeRightBarCollections } from '@/gui/Layout/Sidebars/Collections/resolveCollections';

const RAIL_WIDTH = 72;
const EXPANDED_WIDTH = 264;

function getSidebarRootPath(nodeId: string): string {
  const normalized = String(nodeId || '').trim();
  if (!normalized) return 'RightBar';
  const parts = normalized.split(':');
  if (parts.length > 1) return parts.slice(1).join(':');
  return normalized.replace(/[^\w.-]+/g, '.');
}

function buildRightBarElementMeta(
  el: RightBarElement,
  rootNodeId: string,
  section: 'elements' | 'footerElements',
  idx: number
) {
  const componentByType = {
    link: 'RightBarLink',
    menu: 'RightBarMenu',
    action: 'RightBarAction',
  } as const;
  const explicitNodeId = el?.props?.['data-gui-node-id'];
  const explicitComponent = el?.props?.['data-gui-component'];
  const rootPath = getSidebarRootPath(rootNodeId);
  const componentName = explicitComponent || componentByType[el.type];
  const path = `${rootPath}.${section}.${idx}`;
  const nodeId = explicitNodeId || `${componentName}:${path}`;
  return { nodeId, path, componentName };
}

const RightBar = ({
  elements = [],
  collections = [],
  footerElements = [],
  footerCollections = [],
  className,
  initialView = 'rail',
  id,
  style,
  header,
  brand,
  'data-testid': dataTestId,
  'data-gui-node-id': dataGuiNodeId,
  'data-gui-component': dataGuiComponent,
}: RightBarProps) => {
  const { view, setView } = useRightBar();
  const theme = useGuiTheme();
  const isMobile = useGuiMediaQuery(theme.breakpoints.down('sm'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [lastNonMobileView, setLastNonMobileView] = useState<RightBarView>(
    view === 'mobile' ? 'expanded' : view
  );
  const setInsets = useUpdateInsets();
  const insets = useInsets();
  const navInset = Math.max(0, Number(insets?.nav ?? insets?.top ?? 0));
  const totalRightInset = Math.max(0, Number(insets?.right ?? 0));
  const headerHeight = navInset > 0 ? navInset : 48;
  const toggleOffset = (navInset > 0 ? navInset : 0) + 12;
  const resolvedElements = useMemo(
    () => mergeRightBarCollections<RightBarElement>(elements, collections, 'rightBar'),
    [collections, elements]
  );
  const resolvedFooterElements = useMemo(
    () =>
      mergeRightBarCollections<RightBarElement>(
        footerElements,
        footerCollections,
        'rightBarFooter'
      ),
    [footerCollections, footerElements]
  );
  const hasFooterElements =
    Array.isArray(resolvedFooterElements) && resolvedFooterElements.length > 0;
  const initialViewApplied = useRef(false);
  const sidebarWidth =
    isMobile || view === 'mobile' ? 0 : view === 'expanded' ? EXPANDED_WIDTH : RAIL_WIDTH;
  const layoutRightOffset = Math.max(0, totalRightInset - sidebarWidth);
  const adminNodeId = dataGuiNodeId ? String(dataGuiNodeId) : id ? String(id) : 'GUI.window.layout.bars.right';
  const adminAttrs = {
    'data-gui-node-id': adminNodeId,
    'data-gui-component': dataGuiComponent || 'right',
  };
  const headerNodeId = `${adminNodeId}.header`;
  const toggleButtonNodeId = `${adminNodeId}.header.toggle`;
  const rawHeaderNode = (() => {
    if (!header) return null;
    if (React.isValidElement(header)) return header;
    if (typeof header === 'string') {
      return <Typography variant="subtitle2">{header}</Typography>;
    }
    if (typeof header === 'object') {
      const title = (header as any).title;
      const iconName = (header as any).icon;
      const iconColor = (header as any).iconColor;
      return (
        <>
          {iconName && !brand ? <Icon name={iconName} iconColor={iconColor} /> : null}
          {view !== 'rail' && title ? <Typography variant="subtitle2">{title}</Typography> : null}
        </>
      );
    }
    return null;
  })();
  // Same as LeftBar: the header text is not drawn in rail (only the mark's icon stays in the rail-width cell).
  const headerNode = view === 'rail' ? null : rawHeaderNode;
  const leadingCell = !!brand;
  const toggleControl = (expanded: boolean, onToggle: () => void, placement: 'inline' | 'edge') =>
    brand ? (
      <LeftSidebarToggleButton
        expanded={expanded}
        onToggle={onToggle}
        placement={placement}
        edge="left"
        data-gui-node-id={toggleButtonNodeId}
        data-gui-component="toggle"
      />
    ) : (
      <RightBarToggleButton expanded={expanded} onToggle={onToggle} />
    );
  const headerContent = (expanded: boolean, onToggle: () => void, viewForApp: RightBarView, placement: 'inline' | 'edge' = 'edge') => {
    // Text on the inner (left) side of the icon, packed toward the brand — name-then-logo, mirrored from the left bar.
    const text = headerNode ? (
      <Box
        key="header-text"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          minWidth: 0,
          flex: '1 1 0',
          maxWidth: '100%',
          // Do not overflow:hidden here: the label hangs a few px into the empty side of the mark's
          // cell (besideRailMarkSx), the same as the left bar. The mark sits at the outer edge (flex-end)
          // and paints above the label (zIndex 2), so the hang never covers the QR.
          // Room for the edge tab on the inner (left) border, same 15px the left bar leaves on its inner side.
          pl: brand && placement === 'edge' ? `${EDGE_TAB_SPACE}px` : 0,
        }}
      >
        {headerNode}
      </Box>
    ) : null;
    const control = <React.Fragment key="toggle">{toggleControl(expanded, onToggle, placement)}</React.Fragment>;
    const brandCell = brand ? (
      <Box
        key="brand"
        data-gui-node-id={`${adminNodeId}.brand`}
        data-gui-component="brand"
        sx={{
          display: 'flex',
          alignItems: 'stretch',
          // Rail: centre the mark on the same line as the rail icons. Expanded: flush with the
          // outer (right) edge so the text sits to its left and never covers it.
          justifyContent: viewForApp === 'rail' ? 'center' : 'flex-end',
          flexShrink: 0,
          // Rail: the whole 72px. Expanded: at least 72px, but wider when the brand's name sits beside its logo.
          width: viewForApp === 'rail' ? '100%' : 'auto',
          minWidth: `${RAIL_WIDTH}px`,
          height: '100%',
          position: 'relative',
          // Above hanging header text, so a label can never paint over the mark.
          zIndex: 2,
        }}
      >
        {brand}
      </Box>
    ) : null;
    // Flow is inner-to-outer: text, then the mark flush with the right corner. The edge handle is absolute on the left border.
    return brand ? [text, brandCell, control] : [control, text];
  };
  const headerJustify = leadingCell ? 'flex-end' : 'flex-start';
  const headerSx = {
    position: 'relative' as const,
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
  };

  useEffect(() => {
    if (typeof setInsets !== 'function') return;
    const desired =
      isMobile || view === 'mobile' ? 0 : view === 'expanded' ? EXPANDED_WIDTH : RAIL_WIDTH;
    setInsets({ right: desired }, 'right-sidebar');
    return () => setInsets({ right: 0 }, 'right-sidebar');
  }, [isMobile, setInsets, view]);

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

  useEffect(() => {
    const syntheticRecords: ResolvedNodeRecord[] = [];
    const registerRecord = (
      el: RightBarElement,
      section: 'elements' | 'footerElements',
      idx: number
    ) => {
      const meta = buildRightBarElementMeta(el, adminNodeId, section, idx);
      syntheticRecords.push({
        id: meta.nodeId,
        type: meta.componentName,
        path: meta.path,
        spec: {
          type: meta.componentName,
          props: el.props ?? {},
        },
        resolvedProps: {
          ...(el.props ?? {}),
          'data-gui-node-id': meta.nodeId,
          'data-gui-component': meta.componentName,
        },
      });
    };

    resolvedElements.forEach((el, idx) => registerRecord(el, 'elements', idx));
    resolvedFooterElements.forEach((el, idx) => registerRecord(el, 'footerElements', idx));
    syntheticRecords.forEach((record) => selectionStore.actions.registerNode(record));

    return () => {
      syntheticRecords.forEach((record) => selectionStore.actions.unregisterNode(record.id));
    };
  }, [adminNodeId, resolvedElements, resolvedFooterElements]);

  const renderElements = (items: RightBarElement[]) =>
    items.map((el, idx) => {
      const key = (el as any)?.props?.id ?? (el as any)?.props?.label ?? idx;
      const adminMeta = buildRightBarElementMeta(el, adminNodeId, 'elements', idx);
      const adminProps = {
        'data-gui-node-id': adminMeta.nodeId,
        'data-gui-component': adminMeta.componentName,
      };
      if (el.type === 'link') return <RightBarLink key={key} {...adminProps} {...el.props} />;
      if (el.type === 'menu') return <RightBarMenu key={key} view={view} {...adminProps} {...el.props} />;
      if (el.type === 'action') return <RightBarAction key={key} view={view} {...adminProps} {...el.props} />;
      return null;
    });

  const renderFooterItems = (items: RightBarElement[]) =>
    items.map((el, idx) => {
      const baseKey = (el as any)?.props?.id ?? (el as any)?.props?.label ?? idx;
      const adminMeta = buildRightBarElementMeta(el, adminNodeId, 'footerElements', idx);
      const adminProps = {
        'data-gui-node-id': adminMeta.nodeId,
        'data-gui-component': adminMeta.componentName,
      };
      if (el.type === 'link') return <RightBarLink key={`footer-link-${baseKey}`} {...adminProps} {...el.props} />;
      if (el.type === 'menu')
        return <RightBarMenu key={`footer-menu-${baseKey}`} view={view} {...adminProps} {...el.props} />;
      if (el.type === 'action')
        return <RightBarAction key={`footer-action-${baseKey}`} view={view} {...adminProps} {...el.props} />;
      return null;
    });

  if (view === 'mobile') {
    return (
      <>
        <Box
          sx={{
            position: 'fixed',
            top: `${toggleOffset}px`,
            right: `${layoutRightOffset}px`,
            zIndex: ((theme as any)?.zIndex?.drawer ?? 1200) + 1,
            display: mobileOpen ? 'none' : 'flex',
            transition: 'right 0.3s ease',
          }}
        >
          <IconButton
            aria-label="Open right sidebar"
            onClick={() => setMobileOpen(true)}
            sx={{
              borderRadius: '16px 0 0 16px',
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
        </Box>
        <Drawer
          anchor="right"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          variant="temporary"
          ModalProps={{ keepMounted: true }}
          sx={{
            '& .MuiDrawer-paper': {
              width: EXPANDED_WIDTH,
              top: `${navInset}px`,
              right: `${layoutRightOffset}px`,
              height: `calc(100vh - ${navInset}px)`,
              display: 'flex',
              flexDirection: 'column',
              borderLeft: '1px solid',
              borderColor: 'divider',
              transition: 'right 0.3s ease',
            },
          }}
          PaperProps={{ id, 'data-testid': dataTestId, style, className, ...adminAttrs }}
        >
          <Box
            component="header"
            data-gui-node-id={headerNodeId}
            data-gui-component="header"
            sx={headerSx}
          >
            {headerContent(true, () => setMobileOpen(false), 'expanded', 'inline')}
          </Box>
          <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>{renderElements(resolvedElements)}</Box>
          {hasFooterElements && (
            <Box
              component="footer"
              sx={{
                flexShrink: 0,
                px: 1.5,
                py: 1.5,
                          borderColor: 'divider',
                display: 'flex',
                flexDirection: 'column',
                gap: 0.75,
              }}
            >
              {renderFooterItems(resolvedFooterElements)}
            </Box>
          )}
        </Drawer>
      </>
    );
  }

  const isRail = view === 'rail';
  return (
    <Box
      component="aside"
      className={clsx('RightBar', className)}
      id={id}
      data-testid={dataTestId}
      style={style}
      {...adminAttrs}
      sx={{
        position: 'fixed',
        top: 0,
        right: `${layoutRightOffset}px`,
        bottom: 0,
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        width: `${isRail ? RAIL_WIDTH : EXPANDED_WIDTH}px`,
        overflow: 'visible',
        '--gui-rail-width': `${RAIL_WIDTH}px`,
        '--gui-expanded-width': `${EXPANDED_WIDTH}px`,
        borderLeft: '1px solid',
        borderColor: 'divider',
        backgroundColor: 'background.paper',
        zIndex: (theme) => theme.zIndex.drawer + 2,
        transition: 'right 0.3s ease, width 0.3s ease',
        '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
      }}
    >
      <Box
        component="header"
        data-gui-node-id={headerNodeId}
        data-gui-component="header"
        sx={headerSx}
      >
        {headerContent(!isRail, () => setView(isRail ? 'expanded' : 'rail'), isRail ? 'rail' : 'expanded')}
      </Box>
      <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>{renderElements(resolvedElements)}</Box>
      {hasFooterElements && (
        <Box
          component="footer"
          sx={{
            flexShrink: 0,
            px: isRail ? 1 : 1.5,
            py: 1.5,
            borderColor: 'divider',
            display: 'flex',
            flexDirection: 'column',
            gap: isRail ? 0.5 : 0.75,
          }}
        >
          {renderFooterItems(resolvedFooterElements)}
        </Box>
      )}
    </Box>
  );
};

export default RightBar;
