import type { CSSProperties, ReactNode } from 'react';

export interface ChannelChatMessage {
  id: string;
  user: string;
  text: string;
  /** Optional username color; defaults to theme text.primary. */
  color?: string;
  /** Short text badges, e.g. ['MOD']. */
  badges?: string[];
  /** Display time, e.g. '13:04'. */
  time?: string;
}

/** Public profile facts (codex-me twitch.profile.*). */
export interface ChannelProfile {
  login: string;
  displayName?: string;
  profileImageUrl?: string;
  /** Link for avatar/login/glitch; defaults to https://www.twitch.tv/<login>. */
  url?: string;
}

/** Active broadcast (codex-me twitch.stream.*). Null/undefined fields are hidden. */
export interface ChannelStream {
  live: boolean;
  title?: string | null;
  category?: string | null;
  viewers?: number | null;
  /** ISO time. */
  startedAt?: string | null;
}

/** Persistent broadcast settings (codex-me twitch.channel.*), shown read-only. */
export interface ChannelSettings {
  title: string;
  category: string;
  language: string;
  tags: string[];
}

/** Follower count only (codex-me twitch.followers.total). */
export interface ChannelFollowers {
  total: number;
}

export type ChannelSection = 'stream' | 'channel' | 'followers';
export type ChannelPanel = 'chat' | 'inspector' | 'obs' | 'camera';
export type ChannelWindowMode = 'docked' | 'floating' | 'minimized';

/** Per-section state; an error string replaces the section body (never fabricated values). */
export interface ChannelSectionState { loading?: boolean; error?: string }

export interface ChannelProps {
  profile?: ChannelProfile;
  messages?: ChannelChatMessage[];
  stream?: ChannelStream;
  channel?: ChannelSettings;
  followers?: ChannelFollowers;
  sectionState?: Partial<Record<ChannelSection, ChannelSectionState>>;
  /** Chat composer callback; omit (or readOnly) to hide the input row. */
  onSend?: (text: string) => void;
  chatPlaceholder?: string;
  readOnly?: boolean;
  /** Inspector section tabs (controlled or uncontrolled). */
  section?: ChannelSection;
  defaultSection?: ChannelSection;
  /** Fired with a codex-me style path: 'twitch.stream', 'twitch.stream.viewers', 'twitch.profile.login'… */
  onSelect?: (path: string) => void;
  /** Currently selected path (highlighted). */
  selectedPath?: string;
  /** Active panel (controlled or uncontrolled). Settings lists only panels whose slot is provided. */
  panel?: ChannelPanel;
  defaultPanel?: ChannelPanel;
  onPanelChange?: (panel: ChannelPanel) => void;
  /** Extra inspector content under the sections (e.g. kernel tree / console). */
  inspector?: ReactNode;
  /** OBS controls slot. */
  obs?: ReactNode;
  /** Face tracking controls slot (kept mounted while hidden, like codex-me). */
  face?: ReactNode;
  /** Window mode (controlled or uncontrolled); float/dock and minimize buttons. */
  mode?: ChannelWindowMode;
  defaultMode?: ChannelWindowMode;
  onModeChange?: (mode: ChannelWindowMode) => void;
  /** Hide the float/dock and minimize buttons. */
  hideWindowControls?: boolean;
  /** Small caption under the header (e.g. 'Example data'). */
  caption?: ReactNode;
  width?: number | string;
  height?: number | string;
  className?: string;
  style?: CSSProperties;
  'data-testid'?: string;
}
