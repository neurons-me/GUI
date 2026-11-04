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
  /** the value before this change: Syntax shows it faint, as `before →` ahead of the new value */
  before?: unknown;
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
  /** the collapsed summary line after Confirm (default: `${n} ops applied`) */
  applied?: (n: number) => React.ReactNode;
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
  /** graph viewport height in px (default 180; expanded: 1.9x). A static graph shrinks to fit its nodes. */
  graphHeight?: number;
  /** 'interactive' (default): zoom / pan / pinch / reset / expand. 'static': a fixed snapshot fit to view (hover / tap linking still works). */
  graphMode?: 'interactive' | 'static';
  /** hide Explain until a path is pinned (tapped / clicked) */
  explainOnSelect?: boolean;
  /** controlled mode: the pinned path (used by explainOnSelect) */
  pinnedPath?: string | null;
  /** applied (confirmed) proposal: LLMS.Syntax collapses the code and `output` into one clickable summary line (▸ ✓ n ops applied) that expands on click / tap. Graph and explain are unaffected. */
  collapsed?: boolean;
  /** proposal not confirmed yet: graph nodes / edges dashed and muted with no values, no inline old → new or → result in the code, no explain */
  pending?: boolean;
  /** controlled: force the collapsed code open (e.g. a graph node click scrolled to this message) */
  expanded?: boolean;
  /** highlight the op line that writes this path (set path, define target, pointer, remove …) */
  focusPath?: string | null;
  /** with focusPath: the focused set line's value becomes an inline input; Enter / blur calls this with the op index and the parsed new value */
  onEditValue?: (opIndex: number, value: unknown) => void;
  /** the result shown under the code (e.g. "Applied."); folds away with the code when `collapsed` */
  output?: React.ReactNode;
  /** 'theme' uses the MUI theme in context; 'css' reads the page's --mui-palette-* / --me-syn-* variables.
   *  Default: 'theme' inside a .GUI <Theme>, else 'css'. */
  colors?: 'theme' | 'css';
  labels?: LLMSLabels;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}
