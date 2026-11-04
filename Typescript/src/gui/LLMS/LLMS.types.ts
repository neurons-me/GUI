import type React from 'react';

/** One .me operation, as an LLM proposes it (the {"ops":[...]} contract of /.me/LLMS/Meta). */
export interface LLMSOp {
  op: 'set' | 'define' | 'pointer' | 'remove' | 'secret' | 'noise' | 'identity' | 'query' | string;
  path?: string;
  value?: unknown;
  /** define: the derived member's name (path + "." + name is the derived path) */
  name?: string;
  /** define: the formula, relative to path (e.g. "coffee.price + bread.price") */
  expr?: string;
  target?: string;
  key?: string | number;
  handle?: string;
  paths?: string[];
}

/** A state-graph leaf: a path with its value. Intermediate nodes are created from the path segments. */
export interface LLMSNode {
  path: string;
  value?: unknown;
  /** computed by a define (expr) rather than written */
  derived?: boolean;
  /** secret / noise: the value is shown as ●●● */
  masked?: boolean;
}

/** A dependency edge: `from` is an input of the derived path `to`. */
export interface LLMSEdge { from: string; to: string }

export interface LLMSGraphModel { nodes: LLMSNode[]; edges?: LLMSEdge[] }

export interface LLMSExplainInput {
  path: string;
  value?: unknown;
  origin?: string;
  masked?: boolean;
  stealth?: boolean;
  status?: string;
}

/** The shape of this.me `me.explain(path)`. */
export interface LLMSExplain {
  path: string;
  value?: unknown;
  expr?: string;
  derivation?: { inputs?: LLMSExplainInput[] } | null;
  meta?: { dependsOn?: string[]; [k: string]: unknown } | null;
}

export type LLMSPart = 'phrase' | 'syntax' | 'graph' | 'explain';

export interface LLMSLabels {
  /** suffix on an explain input the user just changed */
  changed?: string;
  /** the note under an explain card when an input changed */
  recomputed?: (input: string, target: string) => React.ReactNode;
  graph?: string;
  zoomIn?: string;
  zoomOut?: string;
  reset?: string;
  expand?: string;
}

export interface LLMSProps {
  /** the user's sentence. `[word|path]` marks a link explicitly; other words link to paths automatically (accent-insensitive). */
  phrase?: string;
  /** the .me ops the model proposed; rendered as .me code by LLMS.Syntax */
  ops?: LLMSOp[];
  /** the state graph (paths, values, derived flags, dependency edges) */
  graph?: LLMSGraphModel;
  /** a larger graph the expand button switches to (e.g. the whole state instead of what the proposal touches) */
  expandedGraph?: LLMSGraphModel;
  /** me.explain() results for derived paths */
  explain?: LLMSExplain | LLMSExplain[];
  /** paths that changed in this step (pulse in the graph, "you just changed this" in explain) */
  changed?: string[];
  /** extra word → path(s) links for the phrase (e.g. a synonym the paths do not contain) */
  aliases?: Record<string, string | string[]>;
  /** controlled active path (space-separated paths). Leave undefined to let LLMS keep its own hover/pin state. */
  activePath?: string | null;
  /** controlled mode: the pointer entered / left a linked element */
  onHoverPath?: (path: string | null) => void;
  /** controlled mode: a linked element was tapped / clicked */
  onPinPath?: (path: string) => void;
  /** called whenever the effective active path changes (hover, else pin) */
  onActivePath?: (path: string | null) => void;
  onNodeClick?: (path: string, node?: LLMSNode) => void;
  /** which parts the default layout shows (default: all four) */
  parts?: LLMSPart[];
  /** graph viewport height in px (default 180; expanded: 1.9x) */
  graphHeight?: number;
  /** 'theme' uses the MUI theme in context; 'css' reads the page's --mui-palette-* / --me-syn-* variables.
   *  Default: 'theme' inside a .GUI <Theme>, else 'css'. */
  colors?: 'theme' | 'css';
  labels?: LLMSLabels;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}
