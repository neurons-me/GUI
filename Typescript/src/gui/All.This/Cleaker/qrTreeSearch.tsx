// Shared state so the top-bar Search can open the QR Keys tree and filter
// it live. The search only reads the tree; it never writes into it.
import * as React from 'react';
import type { TreeSearchHit } from './Keys/searchTreeFilter';

export type QrTreeSearchApi = {
  query: string;
  setQuery: (query: string) => void;
  requestOpen: () => void;
  openTick: number;
  matches: TreeSearchHit[];
  setMatches: (matches: TreeSearchHit[]) => void;
  activeIndex: number;
  setActiveIndex: (index: number) => void;
  reveal: (path: string) => void;
  registerReveal: (fn: ((path: string) => void) | null) => void;
};

const QrTreeSearchContext = React.createContext<QrTreeSearchApi | null>(null);

export function useQrTreeSearch(): QrTreeSearchApi | null {
  return React.useContext(QrTreeSearchContext);
}

export function QrTreeSearchProvider({ children }: { children: React.ReactNode }) {
  const [query, setQuery] = React.useState('');
  const [openTick, setOpenTick] = React.useState(0);
  const [matches, setMatches] = React.useState<TreeSearchHit[]>([]);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const revealRef = React.useRef<((path: string) => void) | null>(null);

  const api = React.useMemo<QrTreeSearchApi>(() => ({
    query,
    setQuery,
    requestOpen: () => setOpenTick((tick) => tick + 1),
    openTick,
    matches,
    setMatches,
    activeIndex,
    setActiveIndex,
    reveal: (path: string) => { revealRef.current?.(path); },
    registerReveal: (fn) => { revealRef.current = fn; },
  }), [query, openTick, matches, activeIndex]);

  return <QrTreeSearchContext.Provider value={api}>{children}</QrTreeSearchContext.Provider>;
}
