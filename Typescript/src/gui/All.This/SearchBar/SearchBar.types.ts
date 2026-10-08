import type { SxProps, Theme } from '@mui/material/styles';

/**
 * One searchable entry. This is the generic schema the algorithm filters over —
 * any JSON array of this shape can be searched, regardless of source repo.
 */
export type JsonSearchIcon = string | { light: string; dark: string };

export type JsonSearchItem = {
  id: string;
  title: string;
  desc?: string;
  url: string;
  /** A single emoji/glyph/image URL, or `{ light, dark }` variants for images that need contrast per theme. */
  icon?: JsonSearchIcon;
  /** Wrap the icon in a white backing plate — for logos with a baked-in light background and no dark variant. */
  iconPlate?: boolean;
  repo?: string | null;
  /** Used to group/order results: root projects, sub-docs, external source links. */
  kind?: 'root' | 'doc' | 'source' | string;
};

export type SearchBarThemeMode = 'auto' | 'light' | 'dark';

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
