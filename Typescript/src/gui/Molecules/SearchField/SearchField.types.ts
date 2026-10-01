import type { SxProps, Theme } from '@mui/material/styles';

export type SearchFieldResult = {
  id: string;
  label: string;
  avatarSrc?: string | null;
  avatarFallback?: string;
};

export type SearchFieldProps = {
  /** Controlled query text — SearchField renders and collapses/expands, it does not fetch or filter. */
  query: string;
  onQueryChange: (query: string) => void;
  /** Already-filtered results to show in the dropdown. */
  results: SearchFieldResult[];
  onSelectResult: (result: SearchFieldResult) => void;
  placeholder?: string;
  /** Shown when the query is non-empty and results is empty. Defaults to a generic "no match" line. */
  emptyLabel?: string;
  /** aria-label for the collapsed icon button. */
  ariaLabel?: string;
  /**
   * Fires whenever the collapsed/expanded state actually changes (click to
   * open, Escape/close-button/blur-with-empty-query to collapse) — never on
   * every render. For a caller that positions something ELSE next to this
   * field's collapsed icon (a fixed-corner badge, another control): this
   * field only ever reserves its own collapsed-icon width, so without this,
   * the caller has no way to know the field is about to grow to
   * `min(280px, 100vw - 32px)` and move out from under whatever sits beside
   * it. Optional — omit if nothing else needs to react to this.
   */
  onExpandedChange?: (expanded: boolean) => void;
  maxResults?: number;
  className?: string;
  sx?: SxProps<Theme>;
  ['data-gui-node-id']?: string;
  ['data-gui-component']?: string;
};

export type SearchFieldResolverSpec = {
  type?: 'SearchField';
  props?: SearchFieldProps;
};
