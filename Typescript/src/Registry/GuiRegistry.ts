import { createRegistry, withMeta } from "./factory";
import type { RegistryEntry } from "./types";

// Atoms
import AppBarResolver, { meta as AppBarMeta } from "@/gui/Atoms/AppBar/AppBar.resolver";
import AvatarResolver, { meta as AvatarMeta } from "@/gui/Atoms/Avatar/Avatar.resolver";
import BadgeResolver, { meta as BadgeMeta } from "@/gui/Atoms/Badge/Badge.resolver";
import BoxResolver, { meta as BoxMeta } from "@/gui/Atoms/Box/Box.resolver";
import ButtonResolver, { meta as ButtonMeta } from "@/gui/Atoms/Button/Button.resolver";
import CardActionsResolver from "@/gui/Atoms/Card/CardActions/CardActions.resolver";
import CardContentResolver from "@/gui/Atoms/Card/CardContent/CardContent.resolver";
import CardHeaderResolver from "@/gui/Atoms/Card/CardHeader/CardHeader.resolver";
import CardResolver, { meta as CardMeta } from "@/gui/Atoms/Card/Card.resolver";
import CheckboxResolver, { meta as CheckboxMeta } from "@/gui/Atoms/Checkbox/Checkbox.resolver";
import ChipResolver, { meta as ChipMeta } from "@/gui/Atoms/Chip/Chip.resolver";
import DividerResolver, { meta as DividerMeta } from "@/gui/Atoms/Divider/Divider.resolver";
import IconResolver from "@/gui/Atoms/Icon/Icon.resolver";
import IconButtonResolver, { meta as IconButtonMeta } from "@/gui/Atoms/IconButton/IconButton.resolver";
import InputResolver, { meta as InputMeta } from "@/gui/Atoms/Input/Input.resolver";
import LinkResolver, { meta as LinkMeta } from "@/gui/Atoms/Link/Link.resolver";
import PaperResolver, { meta as PaperMeta } from "@/gui/Atoms/Paper/Paper.resolver";
import ProgressResolver, { meta as ProgressMeta } from "@/gui/Atoms/Progress/Progress.resolver";
import SectionResolver, { meta as SectionMeta } from "@/gui/Atoms/Section/Section.resolver";
import SliderResolver, { meta as SliderMeta } from "@/gui/Atoms/Slider/Slider.resolver";
import SurfaceResolver, { meta as SurfaceMeta } from "@/gui/Atoms/Surface/Surface.resolver";
import SwitchResolver, { meta as SwitchMeta } from "@/gui/Atoms/Switch/Switch.resolver";
import TextFieldResolver, { meta as TextFieldMeta } from "@/gui/Atoms/TextField/TextField.resolver";
import TooltipResolver, { meta as TooltipMeta } from "@/gui/Atoms/Tooltip/Tooltip.resolver";
import TypographyResolver, { meta as TypographyMeta } from "@/gui/Atoms/Typography/Typography.resolver";

// Molecules
import HeroResolver from "@/gui/Molecules/Hero/Hero.resolver";
import PageResolver from "@/gui/Molecules/Page/Page.resolver";
import MarkdownDocumentRegistration from "@/gui/Molecules/Documents/MarkdownDocument/MarkdownDocument.registration";
import DrawerResolver, { meta as DrawerMeta } from "@/gui/Molecules/Drawer/Drawer.resolver";
import AdminViewToggleResolver, { meta as AdminViewToggleMeta } from "@/gui/Molecules/AdminViewToggle/AdminViewToggle.resolver";
import InspectorToggleResolver, { meta as InspectorToggleMeta } from "@/gui/Molecules/InspectorToggle/InspectorToggle.resolver";
import SearchFieldResolver, { meta as SearchFieldMeta } from "@/gui/Molecules/SearchField/SearchField.resolver";
import LineChartResolver from "@/gui/Compounds/Charts/LineChart/LineChart.resolver";
import BarChartResolver from "@/gui/Compounds/Charts/BarChart/BarChart.resolver";
import ChartSliderResolver from "@/gui/Compounds/Charts/Slider/Slider.resolver";

// Layout
import LayoutResolver from "@/gui/Layout/Layout.resolver";
import StickyOptionsTopResolver, {
  StickyOptionsResolver,
} from "@/gui/Layout/StickyOptions/StickyOptionsTop.resolver";
import FooterResolver from "@/gui/Layout/Sidebars/Footer/Footer.resolver";
import LeftBarResolver from "@/gui/Layout/Sidebars/LeftBar/LeftBar.resolver";
import RightBarResolver from "@/gui/Layout/Sidebars/RightBar/RightBar.resolver";
import TopBarResolver from "@/gui/Layout/Sidebars/TopBar/TopBar.resolver";
import TabViewsResolver, { meta as TabViewsMeta } from "@/gui/Layout/Stage/TabViews/TabViews.resolver";

// All.This
import CleakerResolver, { meta as CleakerMeta } from "@/gui/All.This/Cleaker/Cleaker.resolver";
import CleakerComposerResolver, { meta as CleakerComposerMeta } from "@/gui/All.This/Cleaker/CleakerComposer.resolver";
import CleakerQRResolver, { meta as CleakerQRMeta } from "@/gui/All.This/Cleaker/QR/CleakerQR.resolver";
import CleakerGroupResolver, { meta as CleakerGroupMeta } from "@/gui/All.This/Cleaker/Group/CleakerGroup.resolver";
import CleakerUserResolver, { meta as CleakerUserMeta } from "@/gui/All.This/Cleaker/User/CleakerUser.resolver";
import NamespaceResolver, { meta as NamespaceMeta } from "@/gui/All.This/Cleaker/Namespace/Namespace.resolver";
import NamespaceUsersResolver from "@/gui/All.This/Cleaker/Namespace/NamespaceUsers.resolver";
import NamespaceSurfaceResolver from "@/gui/All.This/Cleaker/Namespace/NamespaceSurface.resolver";
import QRmeResolver, { meta as QRmeMeta } from "@/gui/All.This/me/QR/QR.me.resolver";
import SessionQRResolver, { meta as SessionQRMeta } from "@/gui/All.This/me/QR.resolver";
import MeResolver, { meta as MeMeta } from "@/gui/All.This/me/me.resolver";
import SearchBarResolver from "@/gui/All.This/SearchBar/SearchBar.resolver";

// Newly wired (2026-09-29) -- 15 resolvers that were fully written (real
// `type`, real `resolve()`, in several cases real `meta` too) but never
// imported here, found via GUI-Registry.md's own "Written, never wired in"
// audit section. Each one already worked fine via plain JSX; this only
// makes its `type` string reachable from a JSON spec / the Semantic
// Inspector. Six other files from that same audit list are deliberately
// NOT here, each for a different real reason (checked individually, not
// skipped as a batch):
//   - LeftSidebarAction.resolver.tsx resolves an `action` string to a
//     callback -- a different `resolve(action)` shape entirely, not a
//     `RegistryEntry`. Wiring it in would register the wrong contract.
//   - LeftSidebarLink.resolver.tsx and GUI-Tools.resolver.tsx are empty
//     files (zero bytes) -- the audit's "written" claim was itself wrong
//     for these two; there is nothing to import.
//   - TopBarMenu.resolver.tsx has no `resolve()` at all -- it's sample
//     spec DATA (`{ type: 'TopBarMenu', props: {...} }`), not a resolver.
//     tsc caught this immediately (`Property 'resolve' is missing`).
//   - Catalog.resolver.tsx's `resolve()` returns `{ component: () => JSX,
//     props }` instead of a rendered element -- a lazy-factory shape from
//     some other consumer, incompatible with `ResolveOutput`. Forcing it
//     in here by calling `.component()` directly (instead of `<Component
//     />`) would call ThemesCatalog as a plain function outside JSX,
//     breaking Rules of Hooks if it uses any -- not a safe patch to paper
//     over inline.
//   - ToggleMode.resolver.tsx exports a bare `resolve(props)` function
//     with no `type`/`meta` wrapper at all; see its own small adapter
//     below instead of a plain import (this one WAS safe to fix inline,
//     since wrapping is additive and doesn't change what the function
//     itself does).
import ContentResolver from "@/gui/Layout/Content/Content.resolver";
import CodeBlockResolver from "@/gui/Molecules/CodeBlock/CodeBlock.resolver";
import CollapseResolver, { meta as CollapseMeta } from "@/gui/Molecules/Collapse/Collapse.resolver";
import GridResolver, { meta as GridMeta } from "@/gui/Molecules/Grid/Grid.resolver";
import ListResolver, { meta as ListMeta } from "@/gui/Molecules/List/List.resolver";
import ListItemResolver, { meta as ListItemMeta } from "@/gui/Molecules/List/ListItem/ListItem.resolver";
import ListItemButtonResolver, { meta as ListItemButtonMeta } from "@/gui/Molecules/List/ListItemButton/ListItemButton.resolver";
import ListItemIconResolver, { meta as ListItemIconMeta } from "@/gui/Molecules/List/ListItemIcon/ListItemIcon.resolver";
import ListItemTextResolver, { meta as ListItemTextMeta } from "@/gui/Molecules/List/ListItemText/ListItemText.resolver";
import MenuResolver, { meta as MenuMeta } from "@/gui/Molecules/Menu/Menu.resolver";
import MenuItemResolver, { meta as MenuItemMeta } from "@/gui/Molecules/Menu/MenuItem/MenuItem.resolver";
import ModalResolver from "@/gui/Molecules/Modal/Modal.resolver";
import StackResolver, { meta as StackMeta } from "@/gui/Molecules/Stack/Stack.resolver";
import TableResolver, { meta as TableMeta } from "@/gui/Molecules/Table/Table.resolver";
import ToolbarResolver, { meta as ToolbarMeta } from "@/gui/Molecules/Toolbar/Toolbar.resolver";
import resolveThemeModeToggle from "@/gui/Theme/ToggleMode/ToggleMode.resolver";

// Adapter, not a plain import: resolveThemeModeToggle(props) is a bare
// spec->JSX function (see its own file) with no `type`/`meta` of its own,
// unlike every other resolver in this file. Wrapping it here, instead of
// editing ToggleMode.resolver.tsx itself, keeps that file's existing real
// callers (which call the function directly, not through this registry)
// completely unaffected.
const ToggleModeResolver: RegistryEntry = {
  type: "ToggleMode",
  resolve: (spec: any) => resolveThemeModeToggle(spec?.props),
};

export const GuiRegistry = createRegistry([
  // Atoms
  withMeta(AppBarResolver, AppBarMeta),
  withMeta(AvatarResolver, AvatarMeta),
  withMeta(BadgeResolver, BadgeMeta),
  withMeta(BoxResolver, BoxMeta),
  withMeta(ButtonResolver, ButtonMeta),
  // CardActions/CardContent/CardHeader/Icon have no meta anywhere in
  // their own source yet (not lost by aggregation — never authored).
  // Left unwrapped on purpose; the catalog view shows an explicit
  // "no example yet" placeholder for these instead of a fabricated one.
  withMeta(CardResolver, CardMeta),
  CardActionsResolver,
  CardContentResolver,
  CardHeaderResolver,
  withMeta(CheckboxResolver, CheckboxMeta),
  withMeta(ChipResolver, ChipMeta),
  withMeta(DividerResolver, DividerMeta),
  IconResolver,
  withMeta(IconButtonResolver, IconButtonMeta),
  withMeta(InputResolver, InputMeta),
  withMeta(LinkResolver, LinkMeta),
  withMeta(PaperResolver, PaperMeta),
  withMeta(ProgressResolver, ProgressMeta),
  withMeta(SectionResolver, SectionMeta),
  withMeta(SliderResolver, SliderMeta),
  withMeta(SurfaceResolver, SurfaceMeta),
  withMeta(SwitchResolver, SwitchMeta),
  withMeta(TextFieldResolver, TextFieldMeta),
  withMeta(TooltipResolver, TooltipMeta),
  withMeta(TypographyResolver, TypographyMeta),
  // Molecules
  HeroResolver,
  PageResolver,
  MarkdownDocumentRegistration,
  withMeta(DrawerResolver, DrawerMeta),
  withMeta(AdminViewToggleResolver, AdminViewToggleMeta),
  withMeta(InspectorToggleResolver, InspectorToggleMeta),
  withMeta(SearchFieldResolver, SearchFieldMeta),
  // Charts
  LineChartResolver,
  BarChartResolver,
  ChartSliderResolver,
  // Layout — Layout/TopBar/LeftBar/RightBar/Footer have no meta anywhere
  // yet either (same "never authored" case as the Cards/Icon above).
  LayoutResolver,
  StickyOptionsTopResolver,
  StickyOptionsResolver,
  TopBarResolver,
  LeftBarResolver,
  RightBarResolver,
  FooterResolver,
  withMeta(TabViewsResolver, TabViewsMeta),
  // All.This
  withMeta(MeResolver, MeMeta),
  withMeta(SessionQRResolver, SessionQRMeta),
  withMeta(QRmeResolver, QRmeMeta),
  withMeta(CleakerQRResolver, CleakerQRMeta),
  withMeta(CleakerComposerResolver, CleakerComposerMeta),
  withMeta(CleakerResolver, CleakerMeta),
  withMeta(NamespaceResolver, NamespaceMeta),
  // NamespaceUsers/NamespaceSurface/SearchBar: also never authored.
  NamespaceUsersResolver,
  NamespaceSurfaceResolver,
  withMeta(CleakerGroupResolver, CleakerGroupMeta),
  withMeta(CleakerUserResolver, CleakerUserMeta),
  SearchBarResolver,
  // Newly wired (2026-09-29) — see the import block above for what was
  // deliberately left out and why.
  ContentResolver,
  CodeBlockResolver,
  withMeta(CollapseResolver, CollapseMeta),
  withMeta(GridResolver, GridMeta),
  withMeta(ListResolver, ListMeta),
  withMeta(ListItemResolver, ListItemMeta),
  withMeta(ListItemButtonResolver, ListItemButtonMeta),
  withMeta(ListItemIconResolver, ListItemIconMeta),
  withMeta(ListItemTextResolver, ListItemTextMeta),
  withMeta(MenuResolver, MenuMeta),
  withMeta(MenuItemResolver, MenuItemMeta),
  ModalResolver,
  withMeta(StackResolver, StackMeta),
  withMeta(TableResolver, TableMeta),
  withMeta(ToolbarResolver, ToolbarMeta),
  ToggleModeResolver,
]);
