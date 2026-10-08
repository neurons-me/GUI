import React from 'react';
import Layout from './Layout';
import type { RegistryEntry } from '@/Registry/types';
import type { LayoutSpec } from './Layout.types';

const LAYOUT_META: RegistryEntry['meta'] = {
  id: 'layout.layout',
  label: 'Layout',
  kind: 'layout',
  group: 'Layout',
  path: ['Layout', 'Shell'],
  tags: ['layout', 'shell', 'topbar', 'leftbar', 'rightbar', 'footer'],
  demoSpec: {
    type: 'Layout',
    props: {
      children: 'Content',
    },
  },
};

/**
 * The LayoutResolver dynamically constructs a responsive layout
 * using declarative JSON configuration.
 *
 * It resolves topBar, sidebars, footer, and content sections
 * by passing their configs into the Layout component.
 */
const LayoutResolver: RegistryEntry = {
  type: 'Layout',
  meta: LAYOUT_META,
  resolve(spec: LayoutSpec) {
    const props = spec.props ?? {};

    // Allow declarative specs to use semantic region names (preferred):
    //   TopBar / LeftBar / RightBar / Footer
    // while still supporting legacy *Config keys and older LeftSideBar/RightSideBar.
    // We normalize to the legacy prop names that the Layout component expects.
    const {
      topBar,
      leftBar,
      rightBar,
      footer,
      TopBar,
      LeftBar,
      RightBar,
      // Deprecated aliases
      LeftSideBar,
      RightSideBar,
      Footer,
      StickyOptions,
      stickyOptions,
      topBarConfig,
      leftBarConfig,
      leftSidebarConfig,
      rightBarConfig,
      rightSidebarConfig,
      footerConfig,
      stickyOptionsConfig,
      ...rest
    } = props as any;

    const resolvedChildren = props.children ?? (spec as any).children;
    const normalizedProps = {
      ...rest,
      TopBar: topBar ?? TopBar ?? topBarConfig,
      LeftBar: leftBar ?? LeftBar ?? LeftSideBar ?? leftBarConfig ?? leftSidebarConfig,
      RightBar: rightBar ?? RightBar ?? RightSideBar ?? rightBarConfig ?? rightSidebarConfig,
      Footer: footer ?? Footer ?? footerConfig,
      stickyOptions: stickyOptions ?? StickyOptions ?? stickyOptionsConfig,
    };
    return (
      <Layout {...normalizedProps}>
        {resolvedChildren}
      </Layout>
    );
  },
};

export default LayoutResolver;
