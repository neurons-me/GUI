// Layout/Layout/Layout.tsx
import { LeftBarProvider } from '@/gui-internals/Contexts/LeftSidebarContext';
import { RightBarProvider } from '@/gui-internals/Contexts/RightSidebarContext';
import Box from '@/gui/Atoms/Box/Box';
import TopBarComponent from '@/gui/Layout/Sidebars/TopBar/TopBar';
import LeftBarComponent from '@/gui/Layout/Sidebars/LeftBar/LeftBar';
import RightBarComponent from '@/gui/Layout/Sidebars/RightBar/RightBar';
import FooterComponent from '@/gui/Layout/Sidebars/Footer/Footer';
import StickyOptionsTop from '@/gui/Layout/StickyOptions/StickyOptionsTop';
import Content from '@/gui/Layout/Content/Content';
import type { LayoutProps } from './Layout.types';
import React from 'react';
function Layout({
  TopBar = false,
  LeftBar = false,
  RightBar = false,
  Footer = false,
  topBar,
  leftBar,
  rightBar,
  footer,
  topBarConfig,
  leftBarConfig,
  leftSidebarConfig,
  rightBarConfig,
  rightSidebarConfig,
  footerConfig,
  stickyOptions = false,
  stickyOptionsConfig,
  children,
}: LayoutProps) {
  const resolvedTopBar = topBar ?? TopBar ?? topBarConfig;
  const resolvedLeftBar = leftBar ?? LeftBar ?? leftBarConfig ?? leftSidebarConfig;
  const resolvedRightBar = rightBar ?? RightBar ?? rightBarConfig ?? rightSidebarConfig;
  const resolvedFooter = footer ?? Footer ?? footerConfig;
  const resolvedStickyOptions = stickyOptions ?? stickyOptionsConfig;
  const hasTopBar = Boolean(resolvedTopBar);
  const hasLeftBar = Boolean(resolvedLeftBar);
  const hasRightBar = Boolean(resolvedRightBar);
  const hasStickyOptions =
    Boolean(resolvedStickyOptions) && typeof resolvedStickyOptions === 'object';
  const leftInitialView =
    typeof resolvedLeftBar === 'object' && 'initialView' in resolvedLeftBar
      ? (resolvedLeftBar as any).initialView
      : undefined;
  const rightInitialView =
    typeof resolvedRightBar === 'object' && 'initialView' in resolvedRightBar
      ? (resolvedRightBar as any).initialView
      : undefined;
  const childArray = React.Children.toArray(children);
  let topBarChild: React.ReactElement | null = null;
  let leftBarElement: React.ReactElement | null = null;
  let rightBarChild: React.ReactElement | null = null;
  let footerChild: React.ReactElement | null = null;
  let stickyOptionsChild: React.ReactElement | null = null;
  type ContentElement = React.ReactElement<React.ComponentProps<typeof Content>>;
  const isContentElement = (child: React.ReactNode): child is ContentElement =>
    React.isValidElement(child) && child.type === Content;
  let contentChild: ContentElement | null = null;
  const contentExtras: React.ReactNode[] = [];
  childArray.forEach((child) => {
    if (!React.isValidElement(child)) {
      contentExtras.push(child);
      return;
    }
    if (child.type === TopBarComponent) {
      topBarChild = child;
      return;
    }
    if (child.type === LeftBarComponent) {
      leftBarElement = child;
      return;
    }
    if (child.type === RightBarComponent) {
      rightBarChild = child;
      return;
    }
    if (child.type === FooterComponent) {
      footerChild = child;
      return;
    }
    if (child.type === StickyOptionsTop) {
      stickyOptionsChild = child;
      return;
    }
    if (isContentElement(child)) {
      contentChild = child;
      return;
    }
    contentExtras.push(child);
  });

  const resolvedContent =
    contentChild
      ? (() => {
          const element: React.ReactElement<any> = contentChild;
          return React.cloneElement(
            element,
            element.props,
            [...React.Children.toArray(element.props.children), ...contentExtras]
          );
        })()
      : (
          <Content>
            {contentExtras.length ? contentExtras : children}
          </Content>
        );

  return (
    <LeftBarProvider initialView={leftInitialView}>
      <RightBarProvider initialView={rightInitialView}>
        <Box
          id="layout-root"
          sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}
        >
          {topBarChild ?? (hasTopBar && (
            <TopBarComponent
              {...(typeof resolvedTopBar === 'object'
                ? (() => {
                    const { showMenuButton, brandLogo, ...rest } = resolvedTopBar as any;
                    return {
                      ...rest,
                      // Convention: use `brandLogo` as the config field, but TopBar expects `logo`.
                      ...(brandLogo ? { logo: brandLogo } : {}),
                    };
                  })()
                : {})}
              />
          ))}
          {stickyOptionsChild ?? (hasStickyOptions && (
            <StickyOptionsTop
              {...(() => {
                const { enabled, visibility, ...rest } = resolvedStickyOptions as any;
                return {
                  ...rest,
                  visibility:
                    typeof enabled === 'boolean'
                      ? {
                          ...(visibility ?? {}),
                          enabled,
                        }
                      : visibility,
                };
              })()}
            />
          ))}
          <Box sx={{ display: 'flex', flex: 1 }}>
            {leftBarElement ?? (hasLeftBar && (
              <LeftBarComponent
                elements={[]}
                {...(typeof resolvedLeftBar === 'object' ? (resolvedLeftBar as any) : {})}
              />
            ))}
            {resolvedContent}
            {rightBarChild ?? (hasRightBar && (
              <RightBarComponent
                elements={[]}
                {...(typeof resolvedRightBar === 'object' ? (resolvedRightBar as any) : {})}
              />
            ))}
          </Box>
          {footerChild ?? (resolvedFooter && (
            <FooterComponent
              {...(typeof resolvedFooter === 'object'
                ? (() => {
                    const {
                      title,
                      brandLabel,
                      brandLogo,
                      brandHref,
                      brandAvatarFallback,
                      leftElements,
                      leftCollections,
                      centerElements,
                      centerCollections,
                      rightElements,
                      rightCollections,
                      position,
                      elevation,
                      className,
                      id,
                      sx,
                      appBarSx,
                      sectionSx,
                      'data-testid': dataTestId,
                    } = resolvedFooter;
                    return {
                      brandLabel: brandLabel ?? title,
                      brandLogo,
                      brandHref,
                      brandAvatarFallback,
                      leftElements,
                      leftCollections,
                      centerElements,
                      centerCollections,
                      rightElements,
                      rightCollections,
                      position,
                      elevation,
                      className,
                      id,
                      sx,
                      appBarSx,
                      sectionSx,
                      'data-testid': dataTestId,
                    };
                  })()
                : {})}
            />
          ))}
        </Box>
      </RightBarProvider>
    </LeftBarProvider>
  );
}

export default Layout;
