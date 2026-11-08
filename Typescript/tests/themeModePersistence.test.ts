import assert from 'node:assert/strict';
import { resolveInitialThemeMode } from '../src/gui/Theme/utils/persistence';

const store: Record<string, string> = {};
const localStorageMock = {
  getItem: (key: string) => (key in store ? store[key] : null),
  setItem: (key: string, value: string) => { store[key] = String(value); },
  removeItem: (key: string) => { delete store[key]; },
};

function withScheme(dark: boolean, run: () => void) {
  const prevWindow = (globalThis as any).window;
  const prevStorage = (globalThis as any).localStorage;
  const media = {
    matches: dark,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
  };
  (globalThis as any).window = {
    matchMedia: (query: string) => {
      assert.match(query, /prefers-color-scheme/);
      return media;
    },
  };
  (globalThis as any).localStorage = localStorageMock;
  try { run(); } finally {
    (globalThis as any).window = prevWindow;
    (globalThis as any).localStorage = prevStorage;
  }
}

function followsTheBrowserWhenNothingIsSaved() {
  delete store['this.gui:themeMode'];
  withScheme(true, () => assert.equal(resolveInitialThemeMode('light'), 'dark'));
  withScheme(false, () => assert.equal(resolveInitialThemeMode('dark'), 'light'));
}

function aSavedToggleBeatsTheBrowser() {
  store['this.gui:themeMode'] = 'light';
  withScheme(true, () => assert.equal(resolveInitialThemeMode('dark'), 'light'));
  store['this.gui:themeMode'] = 'dark';
  withScheme(false, () => assert.equal(resolveInitialThemeMode('light'), 'dark'));
  delete store['this.gui:themeMode'];
}

function aPageDefaultModeDoesNotOverrideTheBrowser() {
  const prev = (globalThis as any).__thisGuiThemeScope;
  (globalThis as any).__thisGuiThemeScope = { defaultMode: 'dark', themeModeKey: 'page.themeMode' };
  delete store['page.themeMode'];
  delete store['this.gui:themeMode'];
  try {
    withScheme(false, () => assert.equal(resolveInitialThemeMode('dark'), 'light'));
  } finally {
    (globalThis as any).__thisGuiThemeScope = prev;
  }
}

followsTheBrowserWhenNothingIsSaved();
aSavedToggleBeatsTheBrowser();
aPageDefaultModeDoesNotOverrideTheBrowser();
console.log('themeModePersistence.test.ts: ok');
