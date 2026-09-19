import { useEffect, useMemo, useRef } from 'react';
import { Bar, Box, Typography, Avatar, Tooltip } from '@/gui/Atoms';
import { Toolbar } from '@/gui/Molecules';
import { Link as RouterLink } from 'react-router-dom';
import Icon from '@/gui/Atoms/Icon/Icon';
import { useGuiTheme, useGuiMediaQuery, useInsets, useUpdateInsets } from '@/gui-internals/Hooks';
import { mergeFooterCollections } from '@/gui/Layout/Sidebars/Collections/resolveCollections';
import type { FooterProps, FooterElement } from './Footer.types';
import type { FooterLinkProps, FooterActionProps } from './Footer.types';
import type { SxProps, Theme } from '@mui/material/styles';
const sxN = (...parts: Array<SxProps<Theme> | undefined>): SxProps<Theme> =>
  (parts.filter(Boolean) as unknown) as SxProps<Theme>;
type FooterLinkRenderProps = FooterLinkProps & {
  showLabel: boolean;
};

type FooterActionRenderProps = FooterActionProps & {
  showLabel: boolean;
};

const FooterLink = ({
  label,
  icon,
  iconColor,
  href,
  external,
  onClick,
  showLabel,
}: FooterLinkRenderProps) => {
  const content = (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: showLabel ? 1 : 0,
        color: 'inherit',
        textDecoration: 'none',
        px: showLabel ? 1.5 : 0.75,
        py: 0.75,
        borderRadius: 1,
        transition: 'background-color 0.2s ease, color 0.2s ease',
        '&:hover': {
          backgroundColor: 'action.hover',
        },
      }}
    >
      {icon && <Icon name={icon} iconColor={iconColor} />}
      {showLabel && label && (
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          {label}
        </Typography>
      )}
    </Box>
  );

  const wrappedContent =
    !showLabel && label ? (
      <Tooltip title={label} placement="top">
        <span style={{ display: 'inline-flex' }}>{content}</span>
      </Tooltip>
    ) : (
      content
    );

  const commonProps = {
    onClick,
    style: { color: 'inherit' },
  };

  if (href) {
    const isAnchorHref = href.startsWith('http') || href.startsWith('#');
    const component = isAnchorHref
      ? 'a'
      : RouterLink;
    return (
      <Box
        component={component as any}
        to={!isAnchorHref ? href : undefined}
        href={isAnchorHref ? href : undefined}
        target={external ? '_blank' : undefined}
        rel={external ? 'noopener noreferrer' : undefined}
        sx={{ display: 'inline-flex' }}
        {...commonProps}
      >
        {wrappedContent}
      </Box>
    );
  }

  return (
    <Box component="button" type="button" sx={{ display: 'inline-flex', background: 'none', border: 'none', p: 0 }} {...commonProps}>
      {wrappedContent}
    </Box>
  );
};

const FooterAction = ({
  label,
  icon,
  iconColor,
  onClick,
  element,
  showLabel,
}: FooterActionRenderProps) => {
  if (element) {
    return <Box sx={{ display: 'inline-flex', alignItems: 'center' }}>{element}</Box>;
  }

  const content = (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: showLabel ? 1 : 0,
        px: showLabel ? 1.5 : 0.75,
        py: 0.75,
        borderRadius: 1,
        transition: 'background-color 0.2s ease',
        '&:hover': { backgroundColor: 'action.hover' },
        color: 'inherit',
      }}
      onClick={onClick}
      role="button"
    >
      {icon && <Icon name={icon} iconColor={iconColor} />}
      {showLabel && label && (
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          {label}
        </Typography>
      )}
    </Box>
  );

  if (!showLabel && label) {
    return (
      <Tooltip title={label} placement="top">
        <span style={{ display: 'inline-flex' }}>{content}</span>
      </Tooltip>
    );
  }

  return content;
};

function renderFooterElement(el: FooterElement, showLabel: boolean, key: string | number) {
  if (el.type === 'link') return <FooterLink key={key} {...el.props} showLabel={showLabel} />;
  if (el.type === 'action') return <FooterAction key={key} {...el.props} showLabel={showLabel} />;
  return null;
}

export default function Footer(props: FooterProps) {
  const {
    brandLabel = '',
    brandLogo = '',
    brandHref = '/',
    brandAvatarFallback,
    leftElements = [],
    leftCollections = [],
    centerElements = [],
    centerCollections = [],
    rightElements = [],
    rightCollections = [],
    position = 'static',
    elevation = 0,
    className,
    id,
    sx,
    appBarSx,
    sectionSx,
    'data-testid': dataTestId,
  } = props;

  const theme = useGuiTheme();
  const isMobile = useGuiMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useGuiMediaQuery(theme.breakpoints.between('sm', 'md'));
  const isDesktop = useGuiMediaQuery(theme.breakpoints.up('md'));
  const showLabels = isDesktop;
  const showBrandLabel = !isMobile;
  const brandUsesAnchor = Boolean(brandHref) && (brandHref.startsWith('http') || brandHref.startsWith('#'));
  const brandUsesRouter = Boolean(brandHref) && !brandUsesAnchor;

  const insets = useInsets();
  const updateInsets = useUpdateInsets();
  const toolbarRef = useRef<HTMLDivElement | null>(null);
  const BarRef = useRef<HTMLDivElement | null>(null);

  const insetLeft = Math.max(0, Number(insets?.left ?? 0));
  const insetRight = Math.max(0, Number(insets?.right ?? 0));
  const edgePadding = typeof theme.spacing === 'function' ? theme.spacing(1.5) : '12px';
  const resolvedLeftElements = useMemo(
    () => mergeFooterCollections<FooterElement>(leftElements, leftCollections, 'footerLeft'),
    [leftCollections, leftElements]
  );
  const resolvedCenterElements = useMemo(
    () => mergeFooterCollections<FooterElement>(centerElements, centerCollections, 'footerCenter'),
    [centerCollections, centerElements]
  );
  const resolvedRightElements = useMemo(
    () => mergeFooterCollections<FooterElement>(rightElements, rightCollections, 'footerRight'),
    [rightCollections, rightElements]
  );

  const brandVisual = useMemo(() => {
    if (brandLogo) {
      return <Box component="img" src={brandLogo} alt={brandLabel ? `${brandLabel} logo` : 'Footer logo'} sx={{ height: 24 }} />;
    }
    const fallback = brandAvatarFallback || brandLabel?.trim().charAt(0)?.toUpperCase() || '?';
    return <Avatar sx={{ width: 28, height: 28, fontSize: '0.875rem' }}>{fallback}</Avatar>;
  }, [brandAvatarFallback, brandLabel, brandLogo]);

  useEffect(() => {
    if (typeof updateInsets !== 'function') return;
    const measure = () => {
      const target = BarRef.current ?? toolbarRef.current;
      const h = target?.offsetHeight ?? 56;
      updateInsets(
        { bottom: position === 'fixed' || position === 'sticky' ? h : 0 },
        'footer'
      );
    };
    measure();

    let ro: ResizeObserver | undefined;
    if (typeof ResizeObserver !== 'undefined') {
      const target = BarRef.current ?? toolbarRef.current;
      if (target) {
        ro = new ResizeObserver(() => measure());
        ro.observe(target);
      }
    }

    return () => {
      if (ro) ro.disconnect();
      updateInsets({ bottom: 0 }, 'footer');
    };
  }, [position, updateInsets, isMobile, isTablet]);

  const isFixed = position === 'fixed' || position === 'sticky';
  const baseBarSx = {
    top: 'auto',
    bottom: 0,
    backgroundColor: theme.palette.background.paper ?? theme.palette.grey[900],
    minHeight: 56,
    zIndex: (theme.zIndex?.appBar ?? 1100) - 1,
    boxShadow: 'none',
    boxSizing: 'border-box',
    ...(isFixed
      ? {
          position: 'fixed',
          left: 0,
          right: 0,
          width: '100%',
        }
      : {
          position: 'relative',
          ml: 0,
          mr: 0,
          width: '100%',
        }),
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: `${insetLeft}px`,
      right: `${insetRight}px`,
      borderTop: '1px solid',
      borderColor: theme.palette.divider,
      pointerEvents: 'none',
      transition: 'left 0.3s ease, right 0.3s ease',
    },
  } as const;

  return (
    <Bar
      ref={BarRef}
      id={id}
      data-gui-node-id="GUI.bars.footer"
      data-gui-component="bars.footer"
      className={className}
      data-testid={dataTestId}
      position={position}
      elevation={elevation}
      sx={sxN(baseBarSx as SxProps<Theme>, sx, appBarSx)}
    >
      <Toolbar
        ref={toolbarRef}
        variant="dense"
        disableGutters
        sx={sxN(
          {
            minHeight: 56,
            pl: `calc(${insetLeft}px + ${edgePadding})`,
            pr: `calc(${insetRight}px + ${edgePadding})`,
            py: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1.5,
            transition: 'padding-left 0.3s ease, padding-right 0.3s ease',
          },
          sectionSx
        )}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: showLabels ? 1 : 0.5,
            color: 'text.secondary',
            flexShrink: 0,
          }}
        >
          {resolvedLeftElements.map((el, idx) =>
            renderFooterElement(el, showLabels, `left-${idx}`)
          )}
        </Box>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: showLabels ? 1 : 0.5,
            flex: 1,
            justifyContent: 'center',
            color: 'text.secondary',
          }}
        >
          {resolvedCenterElements.map((el, idx) => renderFooterElement(el, showLabels, `center-${idx}`))}
        </Box>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: showLabels ? 1 : 0.75,
            color: 'text.secondary',
            flexShrink: 0,
          }}
        >
          {resolvedRightElements.map((el, idx) => renderFooterElement(el, showLabels, `right-${idx}`))}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: showBrandLabel ? 1 : 0.75,
              textDecoration: 'none',
              color: 'inherit',
            }}
            component={brandHref ? (brandUsesRouter ? RouterLink : 'a') : 'div'}
            to={brandUsesRouter ? brandHref : undefined}
            href={brandUsesAnchor ? brandHref : undefined}
          >
            {brandVisual}
            {showBrandLabel && brandLabel && (
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {brandLabel}
              </Typography>
            )}
          </Box>
        </Box>
      </Toolbar>
    </Bar>
  );
}
