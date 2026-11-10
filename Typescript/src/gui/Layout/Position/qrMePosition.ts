// The person's QR corner is a real node of the GUI document:
// `GUI.window.layout.qr.position`. Layout reads this value to place the mark;
// the arrange view writes it. The browser keeps the person's choice; `cleaker:corner`
// is written alongside so the vanilla corner (cleaker.js) stays in sync.
import { GUI_QR_POSITION_ID } from '@/runtime/guiIds';
import { isMarkCorner, type MarkCorner } from './placeMarks';

export { GUI_QR_POSITION_ID };
export const QR_POSITION_ID = GUI_QR_POSITION_ID;
const PREVIOUS_STORE = 'GUI.window.layout.qr.me.position';
const LEGACY_STORE = 'cleaker:corner';

function storeOf(storage?: Storage | null): Storage | null {
  if (storage === undefined) {
    return typeof window !== 'undefined' ? window.localStorage : null;
  }
  return storage;
}

export function readQrMePosition(storage?: Storage | null, fallback: MarkCorner = 'top-left'): MarkCorner {
  const store = storeOf(storage);
  if (store) {
    try {
      const stored = store.getItem(QR_POSITION_ID) ?? store.getItem(PREVIOUS_STORE) ?? store.getItem(LEGACY_STORE);
      if (isMarkCorner(stored)) return stored;
    } catch { /* this page view only */ }
  }
  return fallback;
}

export function writeQrMePosition(corner: MarkCorner, storage?: Storage | null): void {
  const store = storeOf(storage);
  if (!store) return;
  try {
    store.setItem(QR_POSITION_ID, corner);
    store.setItem(LEGACY_STORE, corner);
  } catch { /* this page view only */ }
}
