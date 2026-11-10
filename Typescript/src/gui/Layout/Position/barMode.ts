// Each bar's mode in the arrange view: off, on (rail / icons only), or expanded
// (the sidebar with its text). The declaration holds the author's default
// (`props.on` and `props.view`); the person's pick is an overlay in this
// browser — the same pattern as `GUI.window.layout.qr.position`. `cleaker:bars`
// is written alongside (as open | icons | closed) so the vanilla corner stays
// in sync. The repo document is not rewritten.
import { barId, GUI_BARS_ID, type BarSide } from '@/runtime/guiIds';
import { guiDocumentProps } from '@/runtime/guiDocument';

export type BarMode = 'off' | 'on' | 'expanded';
export type LayoutBarId = BarSide;
export const BAR_MODES: readonly BarMode[] = ['off', 'on', 'expanded'];
export const LAYOUT_BAR_IDS: readonly LayoutBarId[] = ['top', 'left', 'right', 'bottom'];

export const isBarMode = (value: unknown): value is BarMode =>
  typeof value === 'string' && (BAR_MODES as readonly string[]).includes(value);

/** Which bar a QR-position square stands for. */
export const CORNER_BAR: Record<'top-left' | 'top-right' | 'bottom-left' | 'bottom-right', LayoutBarId> = {
  'top-left': 'left',
  'top-right': 'top',
  'bottom-right': 'right',
  'bottom-left': 'bottom',
};

export function nextBarMode(mode: BarMode): BarMode {
  if (mode === 'off') return 'on';
  if (mode === 'on') return 'expanded';
  return 'off';
}

/** Arrange-view words → cleaker.js `props.state`. */
export function barModeToCleaker(mode: BarMode): 'open' | 'icons' | 'closed' {
  if (mode === 'off') return 'closed';
  if (mode === 'expanded') return 'open';
  return 'icons';
}

/** cleaker.js `props.state` → arrange-view words. */
export function barModeFromCleaker(state: unknown): BarMode {
  if (state === 'closed') return 'off';
  if (state === 'open') return 'expanded';
  if (state === 'icons') return 'on';
  return 'off';
}

const STORE = GUI_BARS_ID;
const LEGACY_STORE = 'cleaker:bars';

function storeOf(storage?: Storage | null): Storage | null {
  if (storage === undefined) {
    return typeof window !== 'undefined' ? window.localStorage : null;
  }
  return storage;
}

/** Author defaults from the document: `props.on` and `props.view` (not `props.state`). */
export function documentBarModes(): Record<LayoutBarId, BarMode> {
  const out = {} as Record<LayoutBarId, BarMode>;
  for (const id of LAYOUT_BAR_IDS) {
    const props = guiDocumentProps(barId(id));
    if (props.on === true) {
      out[id] = props.view === 'expanded' ? 'expanded' : 'on';
    } else {
      out[id] = 'off';
    }
  }
  return out;
}

/** Only what the person stored, with no author fallbacks filled in. */
export function readStoredBarModes(storage?: Storage | null): Partial<Record<LayoutBarId, BarMode>> {
  const store = storeOf(storage);
  const out: Partial<Record<LayoutBarId, BarMode>> = {};
  if (!store) return out;
  try {
    const raw = store.getItem(STORE);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        for (const id of LAYOUT_BAR_IDS) {
          if (isBarMode((parsed as Record<string, unknown>)[id])) out[id] = (parsed as Record<string, BarMode>)[id];
        }
        return out;
      }
    }
    const legacy = store.getItem(LEGACY_STORE);
    if (legacy) {
      const parsed = JSON.parse(legacy);
      if (parsed && typeof parsed === 'object') {
        for (const id of LAYOUT_BAR_IDS) {
          const value = (parsed as Record<string, unknown>)[id];
          if (value === 'open' || value === 'icons' || value === 'closed') out[id] = barModeFromCleaker(value);
        }
      }
    }
  } catch { /* this page view only */ }
  return out;
}

export function readBarModes(
  storage?: Storage | null,
  fallback: Record<LayoutBarId, BarMode> = documentBarModes(),
): Record<LayoutBarId, BarMode> {
  return { ...fallback, ...readStoredBarModes(storage) };
}

export function writeBarMode(id: LayoutBarId, mode: BarMode, storage?: Storage | null): void {
  const store = storeOf(storage);
  if (!store) return;
  const next: Partial<Record<LayoutBarId, BarMode>> = { ...readStoredBarModes(storage), [id]: mode };
  try {
    store.setItem(STORE, JSON.stringify(next));
    const cleaker: Partial<Record<LayoutBarId, 'open' | 'icons' | 'closed'>> = {};
    for (const key of LAYOUT_BAR_IDS) {
      if (next[key] !== undefined) cleaker[key] = barModeToCleaker(next[key]!);
    }
    store.setItem(LEGACY_STORE, JSON.stringify(cleaker));
  } catch { /* this page view only */ }
}
