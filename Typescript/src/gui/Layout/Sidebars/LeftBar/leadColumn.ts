// The left bar's leading column (open bar): every row's mark -- the person's QR, the nav icons, the theme avatar, the
// site's brand -- starts at the same inset from the bar's edge, in a column of the same width, so the marks share one
// left edge and the labels one start. The rail keeps its own axis (each mark centered in the rail).
import type { Theme } from '@mui/material/styles';
import { NODE_SIZE } from '@/gui/All.This/Cleaker/treeMetrics';

/** From the bar's edge to each mark's left edge (theme spacing units). */
export const LEAD_INSET = 1.5;
/** The one leading size: every row's mark column (and the QR / theme ring that fill it) -- the bar's node size. */
export const LEAD_COL = NODE_SIZE;
/** From the column to the label (theme spacing units). */
export const LEAD_GAP = 1;

/** The column box: the mark centred in it (a smaller glyph -- a nav icon, the brand's letter -- sits on the same axis). */
export const leadColSx = { width: LEAD_COL, minWidth: LEAD_COL, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' } as const;

/** The inset minus a border the row draws on its own left (px), as a CSS length. */
export const leadInset = (borderPx = 0) => (t: Theme) => (borderPx ? `calc(${t.spacing(LEAD_INSET)} - ${borderPx}px)` : t.spacing(LEAD_INSET));
