//src/themes/utils/persistence.ts
// Utility to persist user's themeId using localStorage.
import { useState, useEffect } from 'react';

const LEGACY_THEME_ID_KEY = 'this.gui:themeId';
const LEGACY_THEME_MODE_KEY = 'this.gui:themeMode';
const THEME_SCOPE_EVENT = 'this.gui:themeScope:changed';

type ThemeScopeConfig = {
  scopeId?: string;
  themeIdKey?: string;
  themeModeKey?: string;
  defaultThemeId?: string;
  defaultMode?: 'light' | 'dark';
};

function readWindowThemeScope(): ThemeScopeConfig | null {
  try {
    const raw = (globalThis as any)?.__thisGuiThemeScope;
    const resolved = typeof raw === 'function' ? raw() : raw;
    if (!resolved || typeof resolved !== 'object') return null;
    return resolved as ThemeScopeConfig;
  } catch {
    return null;
  }
}

function resolveThemeScope(
  fallbackThemeId: string,
  fallbackMode: 'light' | 'dark',
): Required<ThemeScopeConfig> {
  const raw = readWindowThemeScope() || {};
  const themeIdKey = String(raw.themeIdKey || '').trim();
  const themeModeKey = String(raw.themeModeKey || '').trim();
  const defaultThemeId = String(raw.defaultThemeId || fallbackThemeId).trim() || fallbackThemeId;
  const defaultMode = raw.defaultMode === 'dark' ? 'dark' : raw.defaultMode === 'light' ? 'light' : fallbackMode;
  const scopeId = String(raw.scopeId || '').trim() || 'global';

  return {
    scopeId,
    themeIdKey,
    themeModeKey,
    defaultThemeId,
    defaultMode,
  };
}

function readStorageValue(key: string): string {
  if (!key) return '';
  try {
    return String(localStorage.getItem(key) || '').trim();
  } catch {
    return '';
  }
}

function readThemeIdFromScope(fallback: string): string {
  const scope = resolveThemeScope(fallback, 'light');
  return (
    readStorageValue(scope.themeIdKey) ||
    readStorageValue(LEGACY_THEME_ID_KEY) ||
    scope.defaultThemeId ||
    fallback
  );
}

function readThemeModeFromScope(fallback: 'light' | 'dark'): 'light' | 'dark' {
  const scope = resolveThemeScope('neurons.me', fallback);
  const stored =
    readStorageValue(scope.themeModeKey) ||
    readStorageValue(LEGACY_THEME_MODE_KEY) ||
    scope.defaultMode ||
    fallback;
  return stored === 'dark' ? 'dark' : 'light';
}

/**
 * Retrieves the initial themeId from localStorage.
 * Falls back to the provided default if not found or on error.
 *
 * @param fallback - The fallback themeId to use if none is stored.
 * @returns The stored themeId or the fallback value.
 */
export function getInitialThemeId(fallback: string): string {
  return readThemeIdFromScope(fallback);
}
/**
 * React hook to persist and manage the themeId using localStorage.
 * Returns a [themeId, setThemeId] tuple just like useState.
 *
 * @param fallback - The fallback themeId if no previous value is stored.
 * @returns A tuple [themeId, setThemeId] that syncs with localStorage.
 */
export function usePersistentThemeId(
  fallback: string
): [string, React.Dispatch<React.SetStateAction<string>>] {
  const [themeId, setThemeIdState] = useState<string>(() => getInitialThemeId(fallback));

  const setThemeId: React.Dispatch<React.SetStateAction<string>> = (next) => {
    setThemeIdState((prev) => (typeof next === 'function' ? next(prev) : next));
  };

  useEffect(() => {
    const scope = resolveThemeScope(fallback, 'light');
    try {
      // A scoped page (window.__thisGuiThemeScope) writes only its own key, so it
      // never changes the theme of other this.gui pages on the same origin.
      if (scope.themeIdKey) {
        localStorage.setItem(scope.themeIdKey, themeId);
      } else {
        localStorage.setItem(LEGACY_THEME_ID_KEY, themeId);
      }
    } catch {
      // fail silently
    }
  }, [fallback, themeId]);

  useEffect(() => {
    const syncFromScope = () => {
      const next = readThemeIdFromScope(fallback);
      if (!next) return;
      setThemeIdState((prev) => (prev === next ? prev : next));
    };

    function handleStorage(event: StorageEvent) {
      const scope = resolveThemeScope(fallback, 'light');
      const watchedKeys = [LEGACY_THEME_ID_KEY, scope.themeIdKey].filter(Boolean);
      if (!event || !event.key || !watchedKeys.includes(event.key)) return;
      syncFromScope();
    }

    function handleThemeIdEvent(event: Event) {
      const detail = (event as CustomEvent).detail || {};
      const next = String(detail.themeId || '');
      if (!next) return;
      setThemeIdState((prev) => (prev === next ? prev : next));
    }

    function handleThemeScopeChanged() {
      syncFromScope();
    }

    window.addEventListener('storage', handleStorage);
    window.addEventListener('this.gui:themeId:changed', handleThemeIdEvent as EventListener);
    window.addEventListener(THEME_SCOPE_EVENT, handleThemeScopeChanged as EventListener);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('this.gui:themeId:changed', handleThemeIdEvent as EventListener);
      window.removeEventListener(THEME_SCOPE_EVENT, handleThemeScopeChanged as EventListener);
    };
  }, [fallback]);

  return [themeId, setThemeId];
}

/**
 * React hook to persist and manage the theme mode (light/dark) using localStorage.
 * Returns a [mode, setMode] tuple just like useState.
 *
 * @param fallback - The fallback mode if no previous value is stored.
 * @returns A tuple [mode, setMode] that syncs with localStorage.
 */
export function usePersistentThemeMode(
  fallback: 'light' | 'dark'
): ['light' | 'dark', React.Dispatch<React.SetStateAction<'light' | 'dark'>>] {
  const [mode, setModeState] = useState<'light' | 'dark'>(() => readThemeModeFromScope(fallback));

  const setMode: React.Dispatch<React.SetStateAction<'light' | 'dark'>> = (next) => {
    setModeState((prev) => (typeof next === 'function' ? next(prev) : next));
  };

  useEffect(() => {
    const scope = resolveThemeScope('neurons.me', fallback);
    try {
      if (scope.themeModeKey) {
        localStorage.setItem(scope.themeModeKey, mode);
      } else {
        localStorage.setItem(LEGACY_THEME_MODE_KEY, mode);
      }
    } catch {
      // fail silently
    }
  }, [fallback, mode]);

  useEffect(() => {
    const syncFromScope = () => {
      const next = readThemeModeFromScope(fallback);
      setModeState((prev) => (prev === next ? prev : next));
    };

    function handleStorage(event: StorageEvent) {
      const scope = resolveThemeScope('neurons.me', fallback);
      const watchedKeys = [LEGACY_THEME_MODE_KEY, scope.themeModeKey].filter(Boolean);
      if (!event || !event.key || !watchedKeys.includes(event.key)) return;
      syncFromScope();
    }

    function handleThemeModeEvent(event: Event) {
      const detail = (event as CustomEvent).detail || {};
      const next = detail.mode === 'dark' ? 'dark' : 'light';
      setModeState((prev) => (prev === next ? prev : next));
    }

    function handleThemeScopeChanged() {
      syncFromScope();
    }

    window.addEventListener('storage', handleStorage);
    window.addEventListener('this.gui:themeMode:changed', handleThemeModeEvent as EventListener);
    window.addEventListener(THEME_SCOPE_EVENT, handleThemeScopeChanged as EventListener);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('this.gui:themeMode:changed', handleThemeModeEvent as EventListener);
      window.removeEventListener(THEME_SCOPE_EVENT, handleThemeScopeChanged as EventListener);
    };
  }, [fallback]);

  return [mode, setMode];
}
