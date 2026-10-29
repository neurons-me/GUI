import type { CSSProperties } from 'react';
import type { OverlayState } from './overlaySwatchCore';

export type OverlaySwatchPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';

export interface OverlaySwatchChange extends OverlayState {
  /** CSS color applied to the overlay, e.g. `hsl(160.0 26.0% 56.5% / 89%)`. */
  color: string;
  /** true while the color is the theme default (user has not dragged / reset). */
  isThemeDefault: boolean;
  /** `${themeId}:${mode}` the value is stored under. */
  themeKey: string;
}

export interface OverlaySwatchProps {
  /** localStorage key; values are stored per theme under it. */
  storageKey?: string;
  position?: OverlaySwatchPosition;
  /** Circle diameter in px. Default 40. */
  size?: number;
  /** Opacity (0–100) when following the theme. Default 89. */
  defaultOpacity?: number;
  /** Override the theme color (default: theme.palette.primary.main). */
  color?: string;
  /** Render the full-screen fixed overlay (default true). */
  overlay?: boolean;
  /** Instead of / in addition to the overlay, paint this element's background. */
  target?: string | HTMLElement | null;
  /** Double-click resets to the theme default (default true). */
  resetOnDoubleClick?: boolean;
  onChange?: (value: OverlaySwatchChange) => void;
  zIndex?: number;
  overlayZIndex?: number;
  title?: string;
  className?: string;
  style?: CSSProperties;
  id?: string;
  'data-testid'?: string;
}
