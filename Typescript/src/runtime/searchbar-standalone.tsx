// src/runtime/searchbar-standalone.tsx
// Minimal standalone mount for SearchBar on plain static HTML pages —
// no GUI runtime, no Theme provider, just React + this one component.
// Auto-mounts into every [data-gui-searchbar] element on the page.
import React from 'react';
import { createRoot } from 'react-dom/client';
import SearchBar from '@/gui/All.This/SearchBar/SearchBar';
import type { SearchBarThemeMode, SearchBarDensity } from '@/gui/All.This/SearchBar/SearchBar.types';

function readThemeMode(node: HTMLElement): SearchBarThemeMode {
  const raw = node.dataset.themeMode || node.dataset.mode;
  return raw === 'light' || raw === 'dark' || raw === 'auto' ? raw : 'auto';
}

function mountAll() {
  const nodes = document.querySelectorAll<HTMLElement>('[data-gui-searchbar]');
  nodes.forEach((node) => {
    if (node.dataset.guiSearchbarMounted) return;
    node.dataset.guiSearchbarMounted = 'true';
    const src = node.dataset.src || undefined;
    const placeholder = node.dataset.placeholder || undefined;
    const maxResults = node.dataset.maxResults ? Number(node.dataset.maxResults) : undefined;
    const themeMode = readThemeMode(node);
    // data-density="compact": the square quick-access grid (no theme here, so colors stay the SearchBar's own)
    const density: SearchBarDensity = node.dataset.density === 'compact' ? 'compact' : 'comfortable';
    createRoot(node).render(
      React.createElement(SearchBar, { src, placeholder, maxResults, themeMode, density })
    );
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountAll);
} else {
  mountAll();
}

(window as any).GUISearchBar = { mountAll };
