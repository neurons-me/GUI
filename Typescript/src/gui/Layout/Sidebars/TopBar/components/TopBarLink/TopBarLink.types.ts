export type TopBarLinkProps = {
  label: string;
  href: string;
  icon?: string;
  external?: boolean;
  iconColor?: string;
  /** Whether to display the label next to the icon. Defaults to true. */
  showLabel?: boolean;
  /** Names the link as a GUI node (Semantic Inspector / Layout Grid). */
  'data-gui-node-id'?: string;
};