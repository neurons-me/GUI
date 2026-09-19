// LeftBar.tsx
import clsx from 'clsx';
import React, { useEffect, useMemo, useState, useRef } from 'react';
import IconButton from '@mui/material/IconButton';
import Icon from '@/gui/Atoms/Icon/Icon';
import { LeftSidebarElement, LeftSidebarProps } from './LeftBar.types';
import LeftSidebarLink from './components/LeftSidebarLink/LeftSidebarLink';
import LeftSidebarMenu from './components/LeftSidebarMenu/LeftSidebarMenu';
import LeftSidebarAction from './components/LeftSidebarAction/LeftSidebarAction';
import LeftSidebarToggleButton from './components/LeftSidebarToggleButton/LeftSidebarToggleButton';
import { useLeftSidebar, useGuiTheme, useGuiMediaQuery, useUpdateInsets, useInsets } from '@/gui-internals/Hooks';
import { Box, Typography } from '@/gui/Atoms';
import { Drawer } from '@/gui/Molecules';
import type { LeftSidebarView } from '@/gui-internals/Contexts';
import { selectionStore } from '@/runtime/selectionStore';
import type { ResolvedNodeRecord } from '@/runtime/renderer';
import { mergeLeftSidebarCollections } from '@/gui/Layout/Sidebars/Collections/resolveCollections';

// Shared, module-level — not object literals inlined at each use below.
// selectionStore's registerNode bail-out (isSameRecord) compares
// `spec.props`/`spec.provenance` by reference; a fresh `{}` built inline on
// every effect run can never match a previous call's `{}`, so the bail-out
// never fires and every dependency change on the registration effect forces
// a full store mutation + notify() for these three synthetic records even
// when their actual content is unchanged. One shared reference per constant
// value lets the existing bail-out work as intended.
const EMPTY_SYNTHETIC_PROPS: Record<string, unknown> = {};
const LEFT_SIDEBAR_TOGGLE_PROVENANCE = {
  source: 'LeftBar.LeftSidebarToggleButton',
  note: 'Expand/collapse control for the left sidebar rail; view state is local (useLeftSidebar context), not kernel-bound, so no semanticPath/explainPath applies.',
} as const;

function getSidebarRootPath(nodeId: string): string {
  const normalized = String(nodeId || '').trim();
  if (!normalized) return 'LeftSidebar';
  const parts = normalized.split(':');
  if (parts.length > 1) return parts.slice(1).join(':');
  return normalized.replace(/[^\w.-]+/g, '.');
}

function buildLeftSidebarElementMeta(
  el: LeftSidebarElement,
  rootNodeId: string,
  section: 'elements' | 'footerElements',
  idx: number
) {
  const componentByType = {
    link: 'LeftSidebarLink',
    menu: 'LeftSidebarMenu',
    action: 'LeftSidebarAction',
  } as const;
  const explicitNodeId = el?.props?.['data-gui-node-id'];
  const explicitComponent = el?.props?.['data-gui-component'];
  const rootPath = getSidebarRootPath(rootNodeId);
  const componentName = explicitComponent || componentByType[el.type];
  const path = `${rootPath}.${section}.${idx}`;
  const nodeId = explicitNodeId || `${componentName}:${path}`;
  return { nodeId, path, componentName };
}

const LeftSidebar = ({
  elements = [],
  collections = [],
  className,
  id,
  style,
  initialView = 'rail',
  footerElements = [],
  footerCollections = [],
  header,
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
  const adminNodeId = dataGuiNodeId ? String(dataGuiNodeId) : id ? String(id) : 'GUI.bars.left';
  const adminAttrs = {
    'data-gui-node-id': adminNodeId,
    'data-gui-component': dataGuiComponent || 'bars.left',
  };
  const toggleButtonNodeId = `${adminNodeId}.toggleButton`;
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
          {iconName ? <Icon name={iconName} iconColor={iconColor} /> : null}
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

  useEffect(() => {
    if (typeof setInsets !== 'function') return;
    const desired = view === 'expanded' ? 220 : view === 'rail' ? 72 : 0;
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
            type: dataGuiComponent || 'LeftSidebar',
            path: rootPath,
            spec: {
              type: dataGuiComponent || 'LeftSidebar',
              props: EMPTY_SYNTHETIC_PROPS,
            },
          },
        ];
    syntheticRecords.push(
      {
        id: headerNodeId,
        type: 'LeftSidebarHeader',
        path: `${rootPath}.header`,
        parentId: adminNodeId,
        spec: { type: 'LeftSidebarHeader', props: EMPTY_SYNTHETIC_PROPS },
      },
      {
        id: toggleButtonNodeId,
        type: 'LeftSidebarToggleButton',
        path: `${rootPath}.header.toggleButton`,
        parentId: headerNodeId,
        spec: {
          type: 'LeftSidebarToggleButton',
          props: EMPTY_SYNTHETIC_PROPS,
          provenance: LEFT_SIDEBAR_TOGGLE_PROVENANCE,
        },
      },
    );
    const registerRecord = (
      el: LeftSidebarElement,
      section: 'elements' | 'footerElements',
      idx: number
    ) => {
      const meta = buildLeftSidebarElementMeta(el, adminNodeId, section, idx);
      syntheticRecords.push({
        id: meta.nodeId,
        type: meta.componentName,
        path: meta.path,
        spec: {
          type: meta.componentName,
          props: el.props ?? EMPTY_SYNTHETIC_PROPS,
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
  }, [adminNodeId, dataGuiNodeId, dataGuiComponent, headerNodeId, toggleButtonNodeId, resolvedElements, resolvedFooterElements]);

  const renderElements = () =>
    resolvedElements.map((el, idx) => {
      const key = (el as any)?.props?.id ?? (el as any)?.props?.label ?? idx;
      const adminMeta = buildLeftSidebarElementMeta(el, adminNodeId, 'elements', idx);
      const adminProps = {
        'data-gui-node-id': adminMeta.nodeId,
        'data-gui-component': adminMeta.componentName,
      };
      if (el.type === 'link') return <LeftSidebarLink key={key} view={view} {...adminProps} {...el.props} />;
      if (el.type === 'menu') return <LeftSidebarMenu key={key} view={view} {...adminProps} {...el.props} />;
      if (el.type === 'action') return <LeftSidebarAction key={key} view={view} {...adminProps} {...el.props} />;
      return null;
    });
  const renderFooterItems = () =>
    resolvedFooterElements.map((el, idx) => {
      const baseKey = (el as any)?.props?.id ?? (el as any)?.props?.label ?? idx;
      const adminMeta = buildLeftSidebarElementMeta(el, adminNodeId, 'footerElements', idx);
      const adminProps = {
        'data-gui-node-id': adminMeta.nodeId,
        'data-gui-component': adminMeta.componentName,
      };
      if (el.type === 'link') return <LeftSidebarLink key={`footer-link-${baseKey}`} view={view} {...adminProps} {...el.props} />;
      if (el.type === 'menu') return <LeftSidebarMenu key={`footer-menu-${baseKey}`} view={view} {...adminProps} {...el.props} />;
      if (el.type === 'action') return <LeftSidebarAction key={`footer-action-${baseKey}`} view={view} {...adminProps} {...el.props} />;
      return null;
    });

  if (view === 'rail') {
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
          width: '72px',
          overflow: 'visible',
          borderRight: '1px solid',
          borderColor: 'divider',
          '--gui-rail-width': '72px',
          zIndex: (theme) => theme.zIndex.drawer + 2,
          backgroundColor: 'background.nav',
        }}
      >
        <Box
          component="header"
          data-gui-node-id={headerNodeId}
          data-gui-component="LeftSidebarHeader"
          sx={{
            flexShrink: 0,
            borderBottom: '1px solid',
            borderColor: 'divider',
            height: `${headerHeight}px`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: headerNode ? 'space-between' : 'flex-end',
            px: 1.5,
            py: 0,
            gap: 1.25,
          }}
        >
          {headerNode && (
            <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 0 }}>
              {headerNode}
            </Box>
          )}
          <LeftSidebarToggleButton
            expanded={view === ('expanded' as any)}
            onToggle={() => setView(view === 'rail' ? 'expanded' : 'rail')}
            data-gui-node-id={toggleButtonNodeId}
            data-gui-component="LeftSidebarToggleButton"
          />
        </Box>
        <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>{renderElements()}</Box>
        {hasFooterElements && (
          <Box
            component="footer"
            sx={{
              flexShrink: 0,
              px: 1,
              py: 1.5,
                      borderColor: 'divider',
              display: 'flex',
              flexDirection: 'column',
              gap: 0.5,
              maxWidth: '100%',
              overflowX: 'hidden',
              overflowY: 'auto',
            }}
          >
            {renderFooterItems()}
          </Box>
        )}
      </Box>
    );
  }

  if (view === 'mobile') {
    return (
      <>
        <Box
          sx={{
            position: 'fixed',
            top: `${toggleOffset}px`,
            left: 0,
            zIndex: ((theme as any)?.zIndex?.drawer ?? 1200) + 1,
            display: mobileOpen ? 'none' : 'flex',
          }}
        >
          <IconButton
            aria-label="Abrir navegación"
            data-gui-node-id={`${adminNodeId}.mobileToggle`}
            onClick={() => setMobileOpen(true)}
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
        </Box>
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
              width: 220,
              top: `${navInset}px`,
              height: `calc(100vh - ${navInset}px)`,
              display: 'flex',
              flexDirection: 'column',
              borderRight: '1px solid',
              borderColor: 'divider',
            },
          }}
        >
          <Box
            component="header"
            data-gui-node-id={headerNodeId}
            data-gui-component="LeftSidebarHeader"
            sx={{
              flexShrink: 0,
              borderBottom: '1px solid',
              borderColor: 'divider',
              height: `${headerHeight}px`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: headerNode ? 'space-between' : 'flex-end',
              px: 1.5,
              gap: 1.25,
            }}
          >
            {headerNode && (
              <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 0 }}>
                {headerNode}
              </Box>
            )}
            <LeftSidebarToggleButton
              expanded
              onToggle={() => setMobileOpen(false)}
              data-gui-node-id={toggleButtonNodeId}
              data-gui-component="LeftSidebarToggleButton"
            />
          </Box>
          <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>{renderElements()}</Box>
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
              {renderFooterItems()}
            </Box>
          )}
        </Drawer>
      </>
    );
  }

  // Default to 'expanded' view
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
        width: '220px',
        overflow: 'visible',
        borderRight: '1px solid',
        borderColor: 'divider',
        '--gui-expanded-width': '220px',
        backgroundColor: 'background.nav',
        zIndex: (theme) => theme.zIndex.drawer + 2,
      }}
    >
      <Box
        component="header"
        data-gui-node-id={headerNodeId}
        data-gui-component="LeftSidebarHeader"
        sx={{
          flexShrink: 0,
          borderBottom: '1px solid',
          borderColor: 'divider',
          height: `${headerHeight}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: headerNode ? 'space-between' : 'flex-end',
          px: 1.5,
          py: 0,
          gap: 1.25,
        }}
      >
        {headerNode && (
          <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 0 }}>
            {headerNode}
          </Box>
        )}
        <LeftSidebarToggleButton
          expanded={view === ('expanded' as any)}
          onToggle={() => setView(view === 'expanded' ? 'rail' : 'expanded')}
          data-gui-node-id={toggleButtonNodeId}
          data-gui-component="LeftSidebarToggleButton"
        />
      </Box>
      <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>{renderElements()}</Box>
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
          {renderFooterItems()}
        </Box>
      )}
    </Box>
  );
};

export default LeftSidebar;
