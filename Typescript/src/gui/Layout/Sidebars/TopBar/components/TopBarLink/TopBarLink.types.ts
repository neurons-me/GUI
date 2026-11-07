export type TopBarLinkProps = {
  label: string;
  /** Where the link goes. Without one, `onClick` is what it does (a button, not a link). */
  href?: string;
  onClick?: () => void;
  /** The place it opens is the one showing. */
  active?: boolean;
  icon?: string;
  external?: boolean;
  iconColor?: string;
  /** Whether to display the label next to the icon. Defaults to true. */
  showLabel?: boolean;
  /** Names the link as a GUI node (Semantic Inspector / Layout Grid). */
  'data-gui-node-id'?: string;
};