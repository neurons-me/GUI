import type { SxProps, Theme } from '@mui/system';
import type { LeftSidebarView } from '@/gui-internals/Contexts';

export type ThemesCatalogVariant = 'grid' | 'list';
export type ThemesCatalogSidebarView = LeftSidebarView | 'auto';
export type ThemesCatalogSelection = {
  themeId?: string;
  themeName?: string;
  badgeUrl?: string;
};

/**
 * Props passed directly to the ThemesCatalog React component.
 */
export interface ThemesCatalogProps {
  /**
   * Whether to display the themes as a grid or list.
   */
  variant?: ThemesCatalogVariant;
  /**
   * Custom styles for the component container.
   */
  sx?: SxProps<Theme>;
  /**
   * If true, the theme description text is not rendered inside each theme card.
   */
  hideDescription?: boolean;
  /**
   * If true, the theme author text is not rendered inside each theme card.
   */
  hideAuthor?: boolean;
  /**
   * If true, renders the catalog in a minimal mode (hides author + description).
   * This is a convenience shortcut equivalent to setting `hideAuthor` and `hideDescription`.
   */
  minimal?: boolean;
  /**
   * If true, renders a compact mosaic-style catalog (smaller cards + tighter grid).
   */
  compact?: boolean;
  /**
   * If true, hides the theme name in each card.
   */
  hideTitle?: boolean;
  /**
   * If true, hides the per-card light/dark toggle.
   */
  hideModeToggle?: boolean;
  /**
   * Sidebar-aware rendering mode. `auto` renders avatar-only rail controls
   * while the catalog lives in a collapsed LeftBar, then returns to the normal
   * catalog layout when the LeftBar expands.
   */
  sidebarView?: ThemesCatalogSidebarView;
  /**
   * When provided, rail avatars fade/scale with the parent catalog panel.
   * `true` is the revealed (open) state. Omitted means always shown,
   * with no enter/exit motion (catalogs used outside ThemeLauncher).
   */
  reveal?: boolean;

  /**
   * Called after a theme is selected.
   */
  onThemeSelect?: (theme: ThemesCatalogSelection, themeId: string) => void;
}

/**
 * JSON/declarative spec for ThemesCatalog used in resolvers.
 * This is the shape accepted by the resolver when rendering via config.
 */
export interface ThemesCatalogResolverSpec {
  type?: 'ThemesCatalog';

  /**
   * Whether to render the themes in a grid or list layout.
   */
  variant?: ThemesCatalogVariant;

  /**
   * Styles applied to the root element.
   */
  sx?: SxProps<Theme>;
  /**
   * If true, the theme description text is not rendered inside each theme card.
   */
  hideDescription?: boolean;
  /**
   * If true, the theme author text is not rendered inside each theme card.
   */
  hideAuthor?: boolean;
  /**
   * If true, renders the catalog in a minimal mode (hides author + description).
   * This is a convenience shortcut equivalent to setting `hideAuthor` and `hideDescription`.
   */
  minimal?: boolean;
  /**
   * If true, renders a compact mosaic-style catalog (smaller cards + tighter grid).
   */
  compact?: boolean;
  /**
   * If true, hides the theme name in each card.
   */
  hideTitle?: boolean;
  /**
   * If true, hides the per-card light/dark toggle.
   */
  hideModeToggle?: boolean;
  /**
   * Sidebar-aware rendering mode.
   */
  sidebarView?: ThemesCatalogSidebarView;
  /**
   * Called after a theme is selected.
   */
  onThemeSelect?: (theme: ThemesCatalogSelection, themeId: string) => void;
}
