import type { SxProps, Theme } from '@mui/material/styles';

/**
 * One searchable entry. This is the generic schema the algorithm filters over —
 * any JSON array of this shape can be searched, regardless of source repo.
 */
/**
 * Render the entry's icon as the live .GUI orb (Monad) instead of an image. Entries keep `light`/`dark` images
 * alongside it, so SearchBar versions without this field (and no-JS consumers) still show the picture.
 */
export type JsonSearchMonadIcon = {
  /** "identity" (default): the .me ring + dot orb. "bubble": the monad.ai pixel bubble. */
  variant?: 'identity' | 'bubble';
  kind?: 'me' | 'monad';
  /** Seed of the pattern, e.g. "jabellae"; omit for the kind's own pattern (bubble + monad → the monad.ai one). */
  seed?: string;
  /** Bubble only: the light behind the pixel grid. "matte" (default): flat matte with a faint grain, no inner disc
   *  (as on the neurons.me index monad.ai card). "widget": the widget's own blob, glass and inkblot layers. */
  texture?: 'matte' | 'widget';
};

export type JsonSearchIcon = string | { light: string; dark: string; monad?: JsonSearchMonadIcon };

/**
 * How an entry draws its tile in the quick-access grid (data, not CSS: any page using the same index gets the same
 * grid). Every field is optional; without `tile` the entry draws as before.
 */
export type JsonSearchTile = {
  /** "cover": the image spans the tile's width, cropped to fit (a picture wider than tall). Default "contain". */
  fit?: 'contain' | 'cover';
  /** The icon's width in px (its height follows the image), never more than 85% of the tile. For a wordmark. */
  width?: number;
  /** No name under the icon: the icon already spells it (kept for screen readers). */
  hideLabel?: boolean;
  /** The tile's border, 2px in the accent color, is the icon's frame (the icon draws without its own). */
  frame?: boolean;
  /** Paint the icon in the accent color: its image is used as a mask, so a wordmark follows the theme. */
  tint?: boolean;
  /** "muted": the name smaller in weight and lighter, as under a QR code. */
  label?: 'muted';
};

export type JsonSearchItem = {
  id: string;
  title: string;
  desc?: string;
  url: string;
  /** A single emoji/glyph/image URL, or `{ light, dark }` variants for images that need contrast per theme. */
  icon?: JsonSearchIcon;
  /** Wrap the icon in a white backing plate — for logos with a baked-in light background and no dark variant. */
  iconPlate?: boolean;
  /** How the entry draws its quick-access tile (see JsonSearchTile). */
  tile?: JsonSearchTile;
  repo?: string | null;
  /** Used to group/order results: root projects, sub-docs, external source links. */
  kind?: 'root' | 'doc' | 'source' | string;
};

export type SearchBarThemeMode = 'auto' | 'light' | 'dark';

/**
 * Quick-access grid metrics. "comfortable" (default): 32px icons over two-line names. "compact": square tiles in three
 * columns that never grow past the box, 4px padding, 2px between icon and name, the name 8px on one line, so the icon
 * takes most of the tile (53px in an 82px tile).
 */
export type SearchBarDensity = 'comfortable' | 'compact';

/** "fixed" (default): the SearchBar's own light and dark palettes. "theme": the active MUI theme's palette. */
export type SearchBarColors = 'fixed' | 'theme';

export type SearchBarProps = {
  /** URL of the JSON index to fetch (e.g. https://neurons-me.github.io/index.json). */
  src?: string;
  /** Pre-loaded items, used instead of (or while) fetching `src`. */
  items?: JsonSearchItem[];
  /** Placeholder text for the input. */
  placeholder?: string;
  /** Max number of results to render. */
  maxResults?: number;
  /** Order in which `kind` groups are shown. */
  kindOrder?: string[];
  /** Focus the input when the user presses "/". */
  enableSlashShortcut?: boolean;
  /** Visual mode. `auto` follows the page/theme color scheme. */
  themeMode?: SearchBarThemeMode;
  /** Quick-access grid metrics (see SearchBarDensity). */
  density?: SearchBarDensity;
  /** Where the colors come from (see SearchBarColors). */
  colors?: SearchBarColors;
  /** Called when a result is activated. Defaults to `window.location.href = item.url`. */
  onSelect?: (item: JsonSearchItem) => void;
  id?: string;
  className?: string;
  ['data-testid']?: string;
  sx?: SxProps<Theme>;
};

export type SearchBarResolverSpec = {
  type?: 'SearchBar';
  props?: SearchBarProps;
};
