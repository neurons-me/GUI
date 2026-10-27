import type { LeftSidebarView } from '@/gui-internals/Contexts';
import type { SideBarsCollectionInput } from '@/gui/Layout/Sidebars/Collections/types';
import { ReactNode } from 'react';
export type LeftBarView = LeftSidebarView;
export type LeftBarMode = 'rail' | 'expanded' | 'mobile';
export type LeftSidebarMode = LeftBarMode;

export type LeftBarProps = {
  open?: boolean; // used in mobile
  mode?: LeftBarMode;
  onClose?: () => void;
  items?: any[];
  children?: ReactNode;
  /**
   * The app's mark (a logo, a QR): it leads the header in the rail, the expanded bar and the mobile drawer, in a cell as
   * wide as the rail. It is the app's own element, so a link around it (`<Link to=...>`) navigates and nothing else: it
   * is never the expand control. With a `brand` and no `toggle`, the bar's standard arrow is drawn as a handle on the
   * bar's right border (inline in the mobile drawer), so the mark and the arrow each do one thing.
   */
  brand?: ReactNode;
  footer?: ReactNode;
  elements?: LeftBarElement[];
  collections?: SideBarsCollectionInput[];
  footerElements?: LeftBarElement[];
  footerCollections?: SideBarsCollectionInput[];
  style?: React.CSSProperties;
  className?: string;
  enableCollapse?: boolean;
  defaultExpanded?: boolean;
  expandButton?: ReactNode;
  drawerLinks?: any[];
  collapsedWidth?: number;
  expandedWidth?: number;
  expanded?: boolean;
  id?: string;
  'data-gui-node-id'?: string;
  'data-gui-component'?: string;
  shouldShowToggle?: boolean;
  railMode?: boolean;
  toggleLocation?: 'sidebar' | 'topbar' | 'none';
  header?: ReactNode | { title?: string; icon?: string; iconColor?: string };
  initialView?: LeftBarView;
  /**
   * Replaces the bar's expand/collapse arrow with an element of the app's own, which IS the control: the app draws it
   * and calls `toggle()` (rail <-> expanded; on a narrow screen, open/close the drawer). It leads the header, with
   * `header` (shown when the bar is not a rail) beside it. Without it the bar keeps its arrow.
   */
  toggle?: (state: { view: LeftBarView; toggle: () => void }) => ReactNode;
};

export type LeftSidebarProps = LeftBarProps;

export type LeftBarElement =
  | { type: 'link'; props: Record<string, any> }
  | { type: 'menu'; props: Record<string, any> }
  | { type: 'action'; props: Record<string, any> };

export type LeftSidebarElement = LeftBarElement;

export type SidebarMode = LeftBarMode;
export type SidebarSection = {
  title?: string;
  items: any[];
};

export type SidebarToggleHandler = () => void;
