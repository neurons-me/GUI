import { createRegistry, withMeta } from "./factory";

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
]);
