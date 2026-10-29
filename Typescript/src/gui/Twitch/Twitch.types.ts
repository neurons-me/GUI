import type { CSSProperties, ReactNode } from 'react';

export interface TwitchChatMessage {
  id: string;
  user: string;
  text: string;
  /** Optional username color; defaults to theme text.primary. */
  color?: string;
  /** Short text badges, e.g. ['MOD'], ['SUB', '12']. */
  badges?: string[];
  /** Display time, e.g. '13:04'. */
  time?: string;
}

export interface TwitchChatProps {
  messages: TwitchChatMessage[];
  title?: string;
  /** Small caption under the title (e.g. 'Sample data'). */
  caption?: string;
  placeholder?: string;
  onSend?: (text: string) => void;
  /** Hide the input row (read-only chat, e.g. for an OBS source). */
  readOnly?: boolean;
  width?: number | string;
  height?: number | string;
  className?: string;
  style?: CSSProperties;
  'data-testid'?: string;
}

export interface StreamStageProps {
  /** Camera layer: video URL (placeholder when omitted). */
  videoSrc?: string;
  /** Camera layer fallback/poster: CSS background (gradient/image). */
  cameraBackground?: string;
  /** Mark the camera layer as placeholder with a small label. */
  placeholderLabel?: string | false;
  /** Overlay hue 0-360 (used when `controls` is false). */
  hue?: number;
  /** Overlay saturation % (default 70). */
  saturation?: number;
  /** Overlay lightness % (default 45). */
  lightness?: number;
  /** Overlay opacity 0-100 (0 = clean camera, 100 = full cover). */
  opacity?: number;
  /** Show the OverlaySwatch control (theme-bound, drag hue/opacity). */
  controls?: boolean;
  /** localStorage key for the swatch (controls mode). */
  storageKey?: string;
  /** Transparent stage (OBS browser source): no camera layer is rendered. */
  transparent?: boolean;
  /** Logical resolution; scaled to fit the container width. */
  baseWidth?: number;
  baseHeight?: number;
  /** .GUI components layered on top of the overlay. */
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  'data-testid'?: string;
}
