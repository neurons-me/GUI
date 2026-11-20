// Public UI preference: how the keys tree lays out inside the identity card.
// `rows` wraps icons onto further lines when they do not fit; `scroll` keeps
// one horizontal row. Stored in the person's browser only; nothing secret.
import * as React from 'react';
import { GUI_KEYS_ROW_MODE_ID } from '@/runtime/guiIds';

export type KeysRowMode = 'rows' | 'scroll';
export const KEYS_ROW_MODE_DEFAULT: KeysRowMode = 'rows';
export const KEYS_ROW_MODE_EVENT = 'gui-keys-row-mode';

const isMode = (v: unknown): v is KeysRowMode => v === 'rows' || v === 'scroll';

function storeOf(storage?: Storage | null): Storage | null {
  if (storage === undefined) {
    return typeof window !== 'undefined' ? window.localStorage : null;
  }
  return storage;
}

export function readKeysRowMode(storage?: Storage | null, fallback: KeysRowMode = KEYS_ROW_MODE_DEFAULT): KeysRowMode {
  const store = storeOf(storage);
  if (store) {
    try {
      const stored = store.getItem(GUI_KEYS_ROW_MODE_ID);
      if (isMode(stored)) return stored;
    } catch { /* this page view only */ }
  }
  return fallback;
}

export function writeKeysRowMode(mode: KeysRowMode, storage?: Storage | null): void {
  if (!isMode(mode)) return;
  const store = storeOf(storage);
  if (store) {
    try { store.setItem(GUI_KEYS_ROW_MODE_ID, mode); } catch { /* this page view only */ }
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(KEYS_ROW_MODE_EVENT, { detail: mode }));
  }
}

/** Live preference: updates in this window and when another tab writes the same key. */
export function useKeysRowMode(): [KeysRowMode, (mode: KeysRowMode) => void] {
  const [mode, setMode] = React.useState<KeysRowMode>(() => readKeysRowMode());
  React.useEffect(() => {
    const onLocal = (event: Event) => {
      const next = (event as CustomEvent).detail;
      if (isMode(next)) setMode(next);
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key === GUI_KEYS_ROW_MODE_ID && isMode(event.newValue)) setMode(event.newValue);
    };
    window.addEventListener(KEYS_ROW_MODE_EVENT, onLocal);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(KEYS_ROW_MODE_EVENT, onLocal);
      window.removeEventListener('storage', onStorage);
    };
  }, []);
  const set = React.useCallback((next: KeysRowMode) => {
    writeKeysRowMode(next);
    setMode(next);
  }, []);
  return [mode, set];
}
