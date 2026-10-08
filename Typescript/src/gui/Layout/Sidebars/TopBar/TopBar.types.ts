import type { SxProps, Theme } from '@mui/material/styles';
import type { AppBarProps } from '@mui/material/AppBar';
import type { TopBarLinkProps } from './components/TopBarLink/TopBarLink.types';
import type { TopBarMenuProps } from './components/TopBarMenu/TopBarMenu.types';
import type { TopBarActionProps } from './components/TopBarAction/TopBarAction.types';
import type { SideBarsCollectionInput } from '@/gui/Layout/Sidebars/Collections/types';

export interface TopBarProps extends AppBarProps {
  title?: string;
  logo?: string;
  elementsCenter?: TopBarElement[];
  elementsRight?: TopBarElement[];
  collectionsCenter?: SideBarsCollectionInput[];
  collectionsRight?: SideBarsCollectionInput[];
  /** Icon name used when center elements are collapsed (mobile). Default: "settings". */
  collapsedIconCenter?: string;
  /** Icon name used when right elements are collapsed (mobile). Default: "more_horiz". */
  collapsedIconRight?: string;
  homeTo?: string | null;
  /**
   * Drops the AppBar's own `borderBottom`/`borderColor` (the divider line
   * under the bar) — everything else about `baseAppBarSx` stays. Default:
   * false (the line renders, same as before this prop existed).
   */
  noBorder?: boolean;
  /**
   * Skips rendering the brand area entirely (the `logo` image, or the
   * title-initial/"?" `Avatar` fallback when no `logo` is given, plus its
   * home-link wrapper) — for a caller that only wants `elementsCenter`/
   * `elementsRight` and no brand mark at all. Default: false (the brand
   * area renders, same as before this prop existed).
   */
  hideBrand?: boolean;
  sx?: SxProps<Theme>;
  appBarSx?: SxProps<Theme>;
  toolbarSx?: SxProps<Theme>;
  brandSx?: SxProps<Theme>;
  logoSx?: SxProps<Theme>;
  titleSx?: SxProps<Theme>;
  linksSx?: SxProps<Theme>;
  linkSx?: SxProps<Theme>;
  menuSx?: SxProps<Theme>;
  menuItemSx?: SxProps<Theme>;
  id?: string;
  className?: string;
}

export type TopBarElement =
  | { type: 'link'; props: TopBarLinkProps }
  | { type: 'menu'; props: TopBarMenuProps }
  | { type: 'action'; props: TopBarActionProps };
  
export type TopBarResolverSpec = {
  type: 'TopBar';
  props?: TopBarProps;
};
