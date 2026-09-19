/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from 'react';
import { createPortal } from 'react-dom';
import { RightSidebarContext } from '@/gui-internals/Contexts/RightSidebarContext';
import { useSelection } from './selection';
import { useRuntimeEnvironment } from './runtimeContext';
import CodeBlock from '@/gui/Molecules/CodeBlock/CodeBlock';
import { alpha, getContrastRatio } from '@mui/material/styles';
import { useGuiTheme } from '@/gui-internals/Hooks/useGuiTheme';
import { useDocumentPalette } from './useDocumentPalette';

const DATA_URI_PREFIXES = ['data:', 'blob:'];
const DATA_URI_PREVIEW_CHARS = 32;
const LARGE_STRING_LIMIT = 1024;
const ADMIN_VIEW_SCOPE_KEY = 'gui.runtime.admin.view.scope.v1';
const ADMIN_VIEW_SCOPE_SET_EVENT = 'this.gui:adminView:scope:set';
const ADMIN_VIEW_SCOPE_CHANGED_EVENT = 'this.gui:adminView:scope:changed';
type AdminScopeMode = 'global' | 'scoped';

type TreeEntry = { id: string; nth: number; label: string };
type TreeView = { path: TreeEntry[]; children: TreeEntry[] };
const TREE_CHILDREN_LIMIT = 60;
const TREE_HOVER_ATTR = 'data-gui-inspector-hover';

// The tree is read from the DOM, not from the registry's parentId links: the
// DOM nesting of `data-gui-node-id` elements is what the page actually is,
// and it also contains the many hand-written elements that tag themselves
// without ever calling registerNode (the registry alone would omit them).
function isInspectorElement(el: Element): boolean {
  return !!el.closest('[data-gui-inspector-control="true"]');
}

function tagOf(el: Element): TreeEntry {
  const id = el.getAttribute('data-gui-node-id') || '';
  let nth = 0;
  try {
    nth = Array.from(document.querySelectorAll(`[data-gui-node-id="${CSS.escape(id)}"]`)).indexOf(el);
  } catch {}
  return { id, nth: Math.max(0, nth), label: el.getAttribute('data-gui-component') || id };
}

function findTaggedElement(id: string, nth = 0): HTMLElement | null {
  try {
    const all = document.querySelectorAll<HTMLElement>(`[data-gui-node-id="${CSS.escape(id)}"]`);
    return all[nth] ?? all[0] ?? null;
  } catch {
    return null;
  }
}

function readTreeView(selectedId: string | null): TreeView | null {
  if (!selectedId) return null;
  const host = findTaggedElement(selectedId);
  if (!host) return null;
  const path: TreeEntry[] = [tagOf(host)];
  let cursor = host.parentElement?.closest('[data-gui-node-id]') ?? null;
  while (cursor) {
    path.unshift(tagOf(cursor));
    cursor = cursor.parentElement?.closest('[data-gui-node-id]') ?? null;
  }
  const children: TreeEntry[] = [];
  host.querySelectorAll('[data-gui-node-id]').forEach((el) => {
    if (el.parentElement?.closest('[data-gui-node-id]') !== host) return;
    if (isInspectorElement(el)) return;
    children.push(tagOf(el));
  });
  return { path, children };
}

function treeSignature(view: TreeView | null): string {
  if (!view) return '';
  const key = (e: TreeEntry) => `${e.id}#${e.nth}:${e.label}`;
  return `${view.path.map(key).join('>')}|${view.children.map(key).join(',')}`;
}

const PANEL_WIDTH_KEY = 'this.gui:inspectorWidth';
const PANEL_WIDTH_DEFAULT = 380;
const PANEL_WIDTH_MIN = 280;
const PANEL_OPEN_CLASS = 'gui-inspector-split';

function clampPanelWidth(width: number): number {
  const max = Math.max(PANEL_WIDTH_MIN, Math.floor(window.innerWidth * 0.7));
  return Math.min(max, Math.max(PANEL_WIDTH_MIN, Math.round(width)));
}

function readPanelWidth(): number {
  try {
    const raw = Number(localStorage.getItem(PANEL_WIDTH_KEY));
    if (Number.isFinite(raw) && raw > 0) return clampPanelWidth(raw);
  } catch {}
  return PANEL_WIDTH_DEFAULT;
}

// Split layout, not an overlay: while the panel is open the app is squeezed
// into the left part of the window so the GUI stays fully visible next to
// the Inspector instead of being covered by it. The app can't be resized
// through its own layout (position: fixed sidebars, 100vh shells), so <body>
// is narrowed and given a transform, which makes it the containing block of
// every fixed descendant -- they all follow the new width. The panel itself
// is portaled onto <html>, outside <body>, so it is NOT inside that
// containing block and keeps docking to the real viewport edge.
const PANEL_SPLIT_CSS = `
html.${PANEL_OPEN_CLASS} { overflow: hidden; }
html.${PANEL_OPEN_CLASS} > body {
  width: calc(100vw - var(--gui-inspector-width, ${PANEL_WIDTH_DEFAULT}px));
  height: 100vh;
  overflow: auto;
  transform: translateZ(0);
}
`;

function readAdminScopeMode(): AdminScopeMode {
  try {
    const raw = String(localStorage.getItem(ADMIN_VIEW_SCOPE_KEY) || '').toLowerCase();
    return raw === 'scoped' ? 'scoped' : 'global';
  } catch {
    return 'global';
  }
}

function writeAdminScopeMode(mode: AdminScopeMode) {
  try {
    localStorage.setItem(ADMIN_VIEW_SCOPE_KEY, mode);
  } catch {}
}

function truncateString(value: string): string {
  if (DATA_URI_PREFIXES.some((prefix) => value.startsWith(prefix))) {
    const head = value.slice(0, DATA_URI_PREVIEW_CHARS);
    return `${head}… [truncated data uri]`;
  }
  if (value.length > LARGE_STRING_LIMIT) {
    return `${value.slice(0, LARGE_STRING_LIMIT)}… [large string truncated]`;
  }
  return value;
}

function normalizeForInspector(value: any): any {
  if (typeof value === 'string') return truncateString(value);
  return value;
}

function safeStringify(value: any): string {
  const seen = new WeakSet<object>();
  try {
    return JSON.stringify(
      value,
      (_k, v) => {
        if (typeof v === 'object' && v !== null) {
          if (seen.has(v)) return '[Circular]';
          seen.add(v);
        }
        if (typeof v === 'function') return `[Function ${v.name || 'anonymous'}]`;
        return normalizeForInspector(v);
      },
      2
    );
  } catch {
    try {
      return String(value);
    } catch {
      return '[Unserializable]';
    }
  }
}

type InspectorTab = 'spec' | 'resolved' | 'diff';
type ExplainPanelStatus = 'idle' | 'loading' | 'ready' | 'error' | 'unsupported';
type ExplainPanelTone = 'ready' | 'warning' | 'redacted' | 'unknown';

type ExplainPanelState = {
  status: ExplainPanelStatus;
  sourcePath: string | null;
  sourceMethod?: string;
  payload?: any;
  inspectMethod?: string;
  inspectPayload?: any;
  error?: string;
};

type ExplainPanelSummary = {
  label: string;
  message: string;
  tone: ExplainPanelTone;
};

type TruthMetric = {
  label: string;
  value: string;
};

type TruthDependency = {
  label: string;
  path: string;
  origin: 'public' | 'stealth';
  masked: boolean;
  valueLabel: string;
};

type TruthTimelineEntry = {
  id: string;
  kind: 'recompute' | 'memory';
  label: string;
  detail: string;
  path?: string;
  operator?: string;
  hash?: string;
  timestamp?: number;
  tone?: 'default' | 'warning' | 'redacted';
};

function isPlainObject(value: any): value is Record<string, any> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

const FLATTEN_MAX_DEPTH = 20;

function flattenObject(
  input: any,
  prefix = '',
  out: Record<string, any> = {},
  seen: WeakSet<object> = new WeakSet(),
  depth = 0
): Record<string, any> {
  if (!isPlainObject(input)) {
    out[prefix || '$'] = input;
    return out;
  }
  // Props can carry circular references (DOM nodes, React fibers, class
  // instances with back-pointers) — without cycle detection this recurses
  // until the call stack overflows. depth is a belt-and-suspenders cap for
  // pathologically deep (but acyclic) trees.
  if (seen.has(input) || depth >= FLATTEN_MAX_DEPTH) {
    out[prefix || '$'] = seen.has(input) ? '[Circular]' : '[Max depth exceeded]';
    return out;
  }
  seen.add(input);
  const keys = Object.keys(input);
  if (!keys.length && prefix) out[prefix] = {};
  for (const key of keys) {
    const nextPath = prefix ? `${prefix}.${key}` : key;
    const value = input[key];
    if (isPlainObject(value)) {
      flattenObject(value, nextPath, out, seen, depth + 1);
    } else {
      out[nextPath] = value;
    }
  }
  return out;
}

function buildPropsDiff(rawSpec: any, resolvedProps: any) {
  const specProps = isPlainObject(rawSpec?.props) ? rawSpec.props : {};
  const flatSpec = flattenObject(specProps);
  const flatResolved = flattenObject(isPlainObject(resolvedProps) ? resolvedProps : {});
  const normalizeFlat = (input: Record<string, any>) => {
    const out: Record<string, any> = {};
    for (const key of Object.keys(input)) {
      out[key] = normalizeForInspector(input[key]);
    }
    return out;
  };
  const normalizedSpec = normalizeFlat(flatSpec);
  const normalizedResolved = normalizeFlat(flatResolved);

  const added: Record<string, any> = {};
  const removed: Record<string, any> = {};
  const changed: Record<string, { from: any; to: any }> = {};

  for (const key of Object.keys(normalizedResolved)) {
    if (!(key in normalizedSpec)) {
      added[key] = normalizedResolved[key];
      continue;
    }
    const a = normalizedSpec[key];
    const b = normalizedResolved[key];
    // flattenObject only recurses into plain objects, so a leaf value here
    // can still be an array (or another non-plain-object) carrying a
    // circular reference — safeStringify (cycle-guarded, never throws) is
    // required here; a bare JSON.stringify crashed the whole inspector on
    // exactly this shape (RangeError / "Converting circular structure to JSON").
    if (safeStringify(a) !== safeStringify(b)) {
      changed[key] = { from: a, to: b };
    }
  }

  for (const key of Object.keys(normalizedSpec)) {
    if (!(key in normalizedResolved)) {
      removed[key] = normalizedSpec[key];
    }
  }

  return {
    summary: {
      added: Object.keys(added).length,
      removed: Object.keys(removed).length,
      changed: Object.keys(changed).length,
    },
    added,
    removed,
    changed,
  };
}

function normalizeExplainPathValue(value: any): string | null {
  const raw = String(value || '').trim();
  if (!raw) return null;

  if (raw.startsWith('me://')) {
    const target = raw.slice('me://'.length);
    const slashIndex = target.indexOf('/');
    if (slashIndex >= 0) {
      const path = target.slice(slashIndex + 1).trim();
      if (path) return path.replace(/^\/+|\/+$/g, '').replace(/\//g, '.');
    }
    return target.replace(/^\/+|\/+$/g, '').replace(/\//g, '.');
  }

  if (raw.startsWith('me/')) {
    return raw.slice('me/'.length).trim().replace(/^\/+|\/+$/g, '').replace(/\//g, '.');
  }

  return raw.replace(/^\/+|\/+$/g, '').replace(/\//g, '.');
}

function resolveExplainPath(provenance: any): string | null {
  const direct = normalizeExplainPathValue(provenance?.explainPath);
  if (direct) return direct;

  const semantic = normalizeExplainPathValue(provenance?.semanticPath);
  if (semantic) return semantic;

  const binding = String(provenance?.binding || '').trim();
  if (binding.startsWith('me/') || binding.startsWith('me://')) {
    return normalizeExplainPathValue(binding);
  }

  return null;
}

function hasProvenanceContract(provenance: any): boolean {
  return !!provenance && typeof provenance === 'object' && Object.keys(provenance).length > 0;
}

function describeExplainGap(provenance: any): string {
  if (!hasProvenanceContract(provenance)) {
    return 'This node has no provenance contract yet. Add `provenance.semanticPath` or `provenance.explainPath` to make it explainable.';
  }

  return 'This node has provenance metadata, but it does not point at a kernel path yet. Add `provenance.semanticPath` or `provenance.explainPath` to make Explain available.';
}

function hasKernelExplain(me: any): boolean {
  if (!me) return false;
  if (typeof me?.explain === 'function') return true;
  if (typeof me?.execute === 'function') return true;
  if (typeof me?.['!']?.explain === 'function') return true;
  return false;
}

async function requestKernelExplain(
  me: any,
  path: string
): Promise<{ method: string; payload: any }> {
  if (typeof me?.explain === 'function') {
    return {
      method: 'me.explain(path)',
      payload: await Promise.resolve(me.explain(path)),
    };
  }

  if (typeof me?.['!']?.explain === 'function') {
    return {
      method: "me['!'].explain(path)",
      payload: await Promise.resolve(me['!'].explain(path)),
    };
  }

  if (typeof me?.execute === 'function') {
    return {
      method: 'me.execute(self:explain/...)',
      payload: await Promise.resolve(me.execute(`self:explain/${path}`)),
    };
  }

  throw new Error('No explain-capable `.me` kernel is attached to this mount.');
}

async function requestKernelInspect(
  me: any,
  path: string
): Promise<{ method: string; payload: any }> {
  if (typeof me?.execute === 'function') {
    return {
      method: 'me.execute(self:inspect/...)',
      payload: await Promise.resolve(
        me.execute({
          scheme: 'me',
          namespace: 'self',
          operation: 'inspect',
          path,
          raw: `me://self:inspect/${path}`,
          contextRaw: null,
        })
      ),
    };
  }

  if (typeof me?.inspect === 'function') {
    return {
      method: 'me.inspect() [client-scoped]',
      payload: await Promise.resolve(me.inspect()),
    };
  }

  if (typeof me?.['!']?.inspect === 'function') {
    return {
      method: "me['!'].inspect() [client-scoped]",
      payload: await Promise.resolve(me['!'].inspect()),
    };
  }

  throw new Error('No inspect-capable `.me` kernel is attached to this mount.');
}

function summarizeExplainPayload(payload: any, provenance: any): ExplainPanelSummary {
  const maskedInputs = Array.isArray(payload?.derivation?.inputs)
    ? payload.derivation.inputs.filter((input: any) => Boolean(input?.masked)).length
    : 0;

  // "Stealth Dependencies Masked" describes a fact the kernel's own response
  // actually contains -- derivation.ts's explain() marks individual
  // derivation INPUTS with `masked: true` when they resolve inside a secret
  // scope (see resolveBranchScope/pathStartsWith there). That fact stands on
  // its own regardless of whether the node's own top-level `value` happens
  // to be present or not -- a derivation can have masked inputs and still
  // compute a public result, so this no longer requires `value === undefined`
  // to fire (that co-occurrence was never something the kernel actually
  // asserted; it was this file inferring a link the payload doesn't make).
  if (maskedInputs > 0) {
    return {
      label: 'Stealth Dependencies Masked',
      message:
        maskedInputs === 1
          ? 'One dependency was masked by the kernel while explaining this node.'
          : `${maskedInputs} dependencies were masked by the kernel while explaining this node.`,
      tone: 'warning',
    };
  }

  // Beyond that, the kernel's explain() contract has no field anywhere that
  // marks the primary `value` itself as redacted -- for a plain
  // (non-derived) path it returns `value: self.readPath(target)` verbatim,
  // with nothing distinguishing "this path is under a secret scope" from
  // "this path simply has no local value yet" (confirmed by reading its
  // early-return branch directly). `provenance.policy` is metadata THIS
  // component's author wrote, not something the kernel declared, so it
  // can't stand in for that missing signal either. Until the kernel's own
  // explain() contract adds a real field for this, "Value Not Available" is
  // the only honest label for `value === undefined` — anything more
  // specific would be inventing a cause the response doesn't support.
  if (payload?.value === undefined) {
    return {
      label: 'Value Not Available',
      message:
        'The kernel returned no value for this path, and nothing in the response says why -- it may not be set on this kernel instance yet, or it may be under a secret scope the current contract can\'t distinguish. Compare a direct local read against a confirmed server read to narrow it down.',
      tone: 'unknown',
    };
  }

  if (payload?.derivation) {
    return {
      label: 'Causality Resolved',
      message: 'The kernel returned derivation metadata, dependencies, and recompute context for this node.',
      tone: 'ready',
    };
  }

  return {
    label: 'Direct Memory Read',
    message: 'The kernel resolved the path directly without an active derivation record.',
    tone: 'ready',
  };
}

function shortHash(value: any): string | null {
  const raw = String(value || '').trim();
  if (!raw) return null;
  return raw.length <= 8 ? raw : raw.slice(0, 8);
}

function formatAbsoluteTime(timestamp?: number): string {
  if (!timestamp || !Number.isFinite(timestamp)) return 'Unknown time';
  try {
    return new Date(timestamp).toLocaleString();
  } catch {
    return String(timestamp);
  }
}

function formatRelativeTime(timestamp?: number): string {
  if (!timestamp || !Number.isFinite(timestamp)) return 'unknown';
  const diff = timestamp - Date.now();
  const abs = Math.abs(diff);
  const rtf =
    typeof Intl !== 'undefined' && typeof Intl.RelativeTimeFormat === 'function'
      ? new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })
      : null;

  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ['year', 1000 * 60 * 60 * 24 * 365],
    ['month', 1000 * 60 * 60 * 24 * 30],
    ['day', 1000 * 60 * 60 * 24],
    ['hour', 1000 * 60 * 60],
    ['minute', 1000 * 60],
    ['second', 1000],
  ];

  for (const [unit, size] of units) {
    if (abs >= size || unit === 'second') {
      const value = Math.round(diff / size);
      if (rtf) return rtf.format(value, unit);
      return `${Math.abs(value)} ${unit}${Math.abs(value) === 1 ? '' : 's'} ${value < 0 ? 'ago' : 'from now'}`;
    }
  }

  return 'just now';
}

function formatValueLabel(value: any): string {
  if (value === undefined) return 'undefined';
  if (value === null) return 'null';
  if (typeof value === 'string') return truncateString(value);
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return `[Array(${value.length})]`;
  if (typeof value === 'object') return '{...}';
  return String(value);
}

function matchesTruthPath(candidate: string, focus: string): boolean {
  if (!candidate || !focus) return false;
  return (
    candidate === focus ||
    candidate.startsWith(`${focus}.`) ||
    focus.startsWith(`${candidate}.`)
  );
}

function getDependencyPaths(payload: any): string[] {
  return Array.isArray(payload?.derivation?.inputs)
    ? payload.derivation.inputs
        .map((input: any) => String(input?.path || '').trim())
        .filter(Boolean)
    : [];
}

function getRelevantMemoryPool(payload: any, inspectPayload: any, explainPath: string | null): any[] {
  const dependencyPaths = getDependencyPaths(payload);
  const pool = Array.isArray(inspectPayload?.memories) ? inspectPayload.memories : [];
  return pool.filter((memory: any) => {
    const path = String(memory?.path || '').trim();
    if (!path) return false;
    if (explainPath && matchesTruthPath(path, explainPath)) return true;
    return dependencyPaths.some((dependencyPath) => matchesTruthPath(path, dependencyPath));
  });
}

function buildTruthDependencies(payload: any): TruthDependency[] {
  const inputs = Array.isArray(payload?.derivation?.inputs) ? payload.derivation.inputs : [];
  return inputs.map((input: any, index: number) => ({
    label: String(input?.label || `input_${index + 1}`),
    path: String(input?.path || ''),
    origin: input?.origin === 'stealth' ? 'stealth' : 'public',
    masked: Boolean(input?.masked),
    valueLabel: input?.masked ? '●●●●' : formatValueLabel(input?.value),
  }));
}

function buildTruthMetrics(payload: any, inspectPayload: any, explainPath: string | null): TruthMetric[] {
  const dependencies = Array.isArray(payload?.derivation?.inputs) ? payload.derivation.inputs.length : 0;
  const masked = Array.isArray(payload?.derivation?.inputs)
    ? payload.derivation.inputs.filter((input: any) => Boolean(input?.masked)).length
    : 0;
  const memories = getRelevantMemoryPool(payload, inspectPayload, explainPath).length;
  const mode = inspectPayload?.recomputeMode ?? 'unknown';

  return [
    { label: 'Dependencies (k)', value: String(dependencies) },
    { label: 'Masked', value: String(masked) },
    { label: 'Memories', value: String(memories) },
    { label: 'Mode', value: String(mode) },
  ];
}

function buildShieldMessage(payload: any, inspectPayload: any, explainPath: string | null): string | null {
  const secretScopes = Array.isArray(inspectPayload?.secretScopes)
    ? inspectPayload.secretScopes.filter((scope: any) =>
        explainPath ? matchesTruthPath(String(scope || '').trim(), explainPath) : Boolean(scope)
      )
    : [];
  const encryptedScopes = Array.isArray(inspectPayload?.encryptedScopes)
    ? inspectPayload.encryptedScopes.filter((scope: any) =>
        explainPath ? matchesTruthPath(String(scope || '').trim(), explainPath) : Boolean(scope)
      )
    : [];
  const masked = Array.isArray(payload?.derivation?.inputs)
    ? payload.derivation.inputs.some((input: any) => Boolean(input?.masked))
    : false;

  if (payload?.value === undefined && (secretScopes.length > 0 || encryptedScopes.length > 0 || masked)) {
    return 'This node is currently under kernel stealth. The UI is rendering the public absence, not bypassing the policy.';
  }

  if (masked) {
    return 'The kernel revealed the lineage, but one or more dependencies remain masked behind secret scope policy.';
  }

  if (secretScopes.length > 0 || encryptedScopes.length > 0) {
    return 'This scope intersects encrypted or secret branches managed by the kernel.';
  }

  return null;
}

function buildTruthTimeline(payload: any, inspectPayload: any, explainPath: string | null): TruthTimelineEntry[] {
  const entries: TruthTimelineEntry[] = [];
  const lastComputedAt = payload?.meta?.lastComputedAt;
  if (lastComputedAt && Number.isFinite(lastComputedAt)) {
    entries.push({
      id: `recompute:${lastComputedAt}`,
      kind: 'recompute',
      label: 'Derivation recomputed',
      detail: `${formatRelativeTime(lastComputedAt)} at ${formatAbsoluteTime(lastComputedAt)}`,
      timestamp: lastComputedAt,
    });
  }

  const dependencyPaths = new Set<string>(getDependencyPaths(payload));
  const memoryPool = getRelevantMemoryPool(payload, inspectPayload, explainPath);

  const scored = memoryPool
    .map((memory: any) => {
      const path = String(memory?.path || '').trim();
      let priority = 0;
      if (explainPath && path === explainPath) priority = 3;
      else if (dependencyPaths.has(path)) priority = 2;
      else if (explainPath && path.startsWith(`${explainPath}.`)) priority = 1;
      return { memory, path, priority };
    })
    .filter((entry) => entry.priority > 0)
    .sort((a, b) => {
      const aTs = Number(a.memory?.timestamp || 0);
      const bTs = Number(b.memory?.timestamp || 0);
      if (b.priority !== a.priority) return b.priority - a.priority;
      return bTs - aTs;
    })
    .slice(0, 8);

  for (const { memory, path, priority } of scored) {
    const timestamp = Number(memory?.timestamp || 0);
    const operator = String(memory?.operator || 'set');
    const pathLabel = path || '(root)';
    const focusLabel =
      priority === 3 ? 'Target memory' : priority === 2 ? 'Dependency memory' : 'Scoped memory';
    entries.push({
      id: `memory:${String(memory?.hash || `${pathLabel}:${timestamp}`)}`,
      kind: 'memory',
      label: focusLabel,
      detail: `${operator} on ${pathLabel} ${timestamp ? `${formatRelativeTime(timestamp)} at ${formatAbsoluteTime(timestamp)}` : ''}`.trim(),
      path: pathLabel,
      operator,
      hash: shortHash(memory?.hash) || undefined,
      timestamp: timestamp || undefined,
      tone: priority === 2 ? 'warning' : 'default',
    });
  }

  return entries;
}

export function RuntimeInspector({
  toggleVisible = false,
}: {
  toggleVisible?: boolean;
}) {
  const { me } = useRuntimeEnvironment();
  const {
    inspectorEnabled,
    setInspectorEnabled,
    gridEnabled,
    selectedNodeId,
    selected,
    selectNode,
    clearSelection,
    selectedMeta,
    setSelectedMeta,
    getNode,
    getNodeByPath,
  } = useSelection();
  const rightSidebar = React.useContext(RightSidebarContext);
  const theme = useGuiTheme();
  const docPalette = useDocumentPalette();
  // Every color in this panel comes from the active theme's palette, so it
  // follows theme + light/dark switches like the rest of the app. Fallbacks
  // are the old hard-coded dark-navy values, used only if no palette exists
  // (a bare mount outside <Theme>).
  const ui = React.useMemo(() => {
    const p: any = docPalette ?? theme?.palette;
    const dark = (p?.mode ?? 'dark') === 'dark';
    const text = p?.text?.primary ?? '#e5e7eb';
    const tone = (key: string, fallback: string) => {
      const main = p?.[key]?.main ?? fallback;
      return {
        border: alpha(main, 0.45),
        bg: alpha(main, dark ? 0.16 : 0.1),
        fg: (dark ? p?.[key]?.light : p?.[key]?.dark) ?? main,
      };
    };
    // Highlight/grid accent: the first theme color that actually reads
    // against the PAGE background (primary is often a dark brand color that
    // vanishes on a dark theme -- Seafoam's does). Falls back to whichever
    // candidate has the best contrast.
    const pageBg = p?.background?.default ?? p?.background?.paper ?? '#0b1220';
    const candidates = [p?.primary?.main, p?.primary?.light, p?.secondary?.main, p?.secondary?.light, p?.info?.main].filter(Boolean) as string[];
    let accent = candidates[0] ?? '#3b82f6';
    let bestRatio = 0;
    for (const c of candidates) {
      let ratio = 0;
      try { ratio = getContrastRatio(c, pageBg); } catch { continue; }
      if (ratio >= 3) { accent = c; break; }
      if (ratio > bestRatio) { bestRatio = ratio; accent = c; }
    }
    return {
      accent,
      bg: p?.background?.paper ?? '#0b1220',
      fg: text,
      fgMuted: p?.text?.secondary ?? 'rgba(229,231,235,0.75)',
      line: p?.divider ?? alpha(text, 0.12),
      lineStrong: alpha(text, 0.28),
      fillFaint: alpha(text, 0.04),
      fillSoft: alpha(text, 0.07),
      fillHover: alpha(text, 0.1),
      fillActive: alpha(text, 0.16),
      primary: p?.primary?.main ?? '#3b82f6',
      primaryContrast: p?.primary?.contrastText ?? '#fff',
      error: tone('error', '#f87171'),
      warning: tone('warning', '#fbbf24'),
      info: tone('info', '#60a5fa'),
      success: tone('success', '#4ade80'),
      neutral: {
        border: alpha(text, 0.28),
        bg: alpha(text, 0.07),
        fg: p?.text?.secondary ?? '#cbd5e1',
      },
    };
  }, [theme, docPalette]);
  const codeVariant = (docPalette?.mode ?? theme?.palette?.mode) === 'light' ? 'light' : 'dark';
  const [tab, setTab] = React.useState<InspectorTab>('spec');
  const [adminScopeMode, setAdminScopeMode] = React.useState<AdminScopeMode>(() => readAdminScopeMode());
  const lastHighlighted = React.useRef<HTMLElement | null>(null);
  const highlightClass = 'gui-inspector-selected';
  const lastInspectorEnabled = React.useRef<boolean>(inspectorEnabled);

  const getLabel = React.useCallback((el: HTMLElement) => {
    const dataName = el.getAttribute('data-gui-component');
    if (dataName) return dataName;
    return el.tagName.toLowerCase();
  }, []);

  const buildResolvedPath = React.useCallback(
    (start: HTMLElement, host: HTMLElement) => {
      const path: string[] = [];
      let current: HTMLElement | null = start;
      while (current) {
        path.unshift(getLabel(current));
        if (current === host) break;
        current = current.parentElement;
      }
      return path;
    },
    [getLabel]
  );

  const resolveNodeId = React.useCallback(
    (rawId?: string | null) => {
      if (!rawId) return null;
      let resolvedId = rawId;
      if (!getNode(resolvedId)) {
        const parts = rawId.split(':');
        const path = parts.length > 1 ? parts.slice(1).join(':') : '';
        const fallback = getNodeByPath(path);
        if (fallback?.id) resolvedId = fallback.id;
      }
      return resolvedId;
    },
    [getNode, getNodeByPath]
  );

  const selectHostElement = React.useCallback(
    (host: HTMLElement, metaFrom?: HTMLElement | null) => {
      const rawId = host.getAttribute('data-gui-node-id');
      const resolvedId = resolveNodeId(rawId);
      if (!resolvedId) return false;
      selectNode(resolvedId);
      const metaSource = metaFrom ?? host;
      setSelectedMeta({
        elementTag: metaSource.tagName.toLowerCase(),
        resolvedTag: host.tagName.toLowerCase(),
        resolvedPath: buildResolvedPath(metaSource, host),
        domComponentAttr: host.getAttribute('data-gui-component') || undefined,
      });
      rightSidebar?.setView?.('expanded');
      return true;
    },
    [resolveNodeId, selectNode, setSelectedMeta, buildResolvedPath, rightSidebar]
  );

  // Turning the Inspector ON with nothing selected starts at the tree's root
  // instead of leaving the first click to land on whatever child is closest
  // (the outermost node wraps everything, so that was almost never it and
  // reaching it meant "Select parent" up the whole chain). "Root" here is
  // the same thing Alt+click's "topmost" means: a tagged element with no
  // tagged ancestor in the DOM -- deliberately NOT derived from the
  // registry's parentId links, which only some nodes declare (a layout's
  // own internal registrations look like parentless "roots" too). Only
  // acted on when that is unambiguous (exactly one such element); anything
  // else leaves behavior exactly as before. Only on an off -> on transition
  // after mount, never on initial load: an inspector that starts enabled
  // (mount()'s `inspector: true`) must not pop its panel open on every
  // page view.
  const prevInspectorEnabledRef = React.useRef<boolean>(inspectorEnabled);
  React.useEffect(() => {
    const wasEnabled = prevInspectorEnabledRef.current;
    prevInspectorEnabledRef.current = inspectorEnabled;
    if (!inspectorEnabled || wasEnabled) return;
    if (selectedNodeId) return;

    const topmost = Array.from(document.querySelectorAll<HTMLElement>('[data-gui-node-id]')).filter(
      (el) => !el.parentElement?.closest('[data-gui-node-id]') && !el.closest('[data-gui-inspector-control="true"]')
    );
    if (topmost.length === 1) selectHostElement(topmost[0], topmost[0]);
  }, [inspectorEnabled]);

  const getSelectedHostElement = React.useCallback(() => {
    if (!selectedNodeId) return null;
    let host: HTMLElement | null = null;
    try {
      host = document.querySelector(
        `[data-gui-node-id="${CSS.escape(selectedNodeId)}"]`
      ) as HTMLElement | null;
    } catch {
      host = document.querySelector(
        `[data-gui-node-id="${selectedNodeId}"]`
      ) as HTMLElement | null;
    }
    return host;
  }, [selectedNodeId]);

  const selectParentNode = React.useCallback(() => {
    const host = getSelectedHostElement();
    if (!host) return;
    let cursor: HTMLElement | null = host.parentElement;
    while (cursor) {
      if (cursor.hasAttribute('data-gui-node-id')) {
        selectHostElement(cursor, cursor);
        return;
      }
      cursor = cursor.parentElement;
    }
  }, [getSelectedHostElement, selectHostElement]);

  const selectTopmostNode = React.useCallback(() => {
    const host = getSelectedHostElement();
    if (!host) return;
    let cursor: HTMLElement | null = host;
    let topMost: HTMLElement | null = host;
    while (cursor) {
      if (cursor.hasAttribute('data-gui-node-id')) {
        topMost = cursor;
      }
      cursor = cursor.parentElement;
    }
    if (topMost) selectHostElement(topMost, topMost);
  }, [getSelectedHostElement, selectHostElement]);

  const findNearestChildNode = React.useCallback((root: HTMLElement) => {
    const queue: HTMLElement[] = Array.from(root.children) as HTMLElement[];
    while (queue.length) {
      const node = queue.shift();
      if (!node) continue;
      if (node.hasAttribute('data-gui-node-id')) return node;
      queue.push(...Array.from(node.children) as HTMLElement[]);
    }
    return null;
  }, []);

  const selectChildNode = React.useCallback(() => {
    const host = getSelectedHostElement();
    if (!host) return;
    const child = findNearestChildNode(host);
    if (!child) return;
    selectHostElement(child, child);
  }, [findNearestChildNode, getSelectedHostElement, selectHostElement]);

  const open = inspectorEnabled && !!selectedNodeId;

  const [treeView, setTreeView] = React.useState<TreeView | null>(null);
  React.useEffect(() => {
    if (!open) {
      setTreeView(null);
      return;
    }
    let timer: ReturnType<typeof setTimeout> | undefined;
    let lastSig = '\0';
    const refresh = () => {
      const next = readTreeView(selectedNodeId);
      const sig = treeSignature(next);
      if (sig === lastSig) return;
      lastSig = sig;
      setTreeView(next);
    };
    refresh();
    // The page keeps changing under the panel (route changes, live data), so
    // re-read on DOM mutations -- debounced, and only committed to state when
    // the tree's shape actually differs. <body> only: the panel itself lives
    // on <html>, so its own updates never feed back into this observer.
    const observer = new MutationObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(refresh, 150);
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-gui-node-id', 'data-gui-component'],
    });
    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [open, selectedNodeId]);

  const hoveredTreeEl = React.useRef<HTMLElement | null>(null);
  const hoverTreeNode = React.useCallback((entry: TreeEntry | null) => {
    hoveredTreeEl.current?.removeAttribute(TREE_HOVER_ATTR);
    hoveredTreeEl.current = null;
    if (!entry) return;
    const el = findTaggedElement(entry.id, entry.nth);
    if (!el) return;
    el.setAttribute(TREE_HOVER_ATTR, '');
    hoveredTreeEl.current = el;
  }, []);
  React.useEffect(() => () => hoverTreeNode(null), [hoverTreeNode]);

  const selectTreeNode = React.useCallback(
    (entry: TreeEntry) => {
      hoverTreeNode(null);
      const el = findTaggedElement(entry.id, entry.nth);
      if (el) selectHostElement(el, el);
    },
    [hoverTreeNode, selectHostElement]
  );

  const imagePreviews = React.useMemo(() => {
    const results: { path: string; src: string }[] = [];
    const maxDepth = 6;
    const maxResults = 6;
    const maxKeys = 200;

    const isImageLike = (value: string, keyHint?: string) => {
      if (value.startsWith('data:image/')) return true;
      if (value.startsWith('blob:')) return true;
      if (/^https?:\/\//i.test(value) || value.startsWith('/')) {
        if (/\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i.test(value)) return true;
        if (keyHint && /image|img|icon|avatar|badge|src/i.test(keyHint)) return true;
      }
      return false;
    };

    const walk = (node: any, path: string[], depth: number) => {
      if (results.length >= maxResults) return;
      if (depth > maxDepth || !node) return;
      if (typeof node === 'string') {
        const keyHint = path[path.length - 1];
        if (isImageLike(node, keyHint)) {
          results.push({ path: path.join('.'), src: node });
        }
        return;
      }
      if (Array.isArray(node)) {
        const limit = Math.min(node.length, 25);
        for (let i = 0; i < limit; i += 1) {
          walk(node[i], [...path, String(i)], depth + 1);
          if (results.length >= maxResults) return;
        }
        return;
      }
      if (typeof node === 'object') {
        const keys = Object.keys(node).slice(0, maxKeys);
        for (const key of keys) {
          walk(node[key], [...path, key], depth + 1);
          if (results.length >= maxResults) return;
        }
      }
    };

    walk(selected?.resolvedProps ?? null, [], 0);
    return results;
  }, [selected?.resolvedProps]);

  React.useEffect(() => {
    const onExternalInspectorSet = (ev: Event) => {
      const custom = ev as CustomEvent<{ enabled?: boolean }>;
      const nextEnabled = custom?.detail?.enabled;
      if (typeof nextEnabled !== 'boolean') return;
      setInspectorEnabled(nextEnabled);
      if (!nextEnabled) {
        clearSelection();
      }
    };

    window.addEventListener('this.gui:inspector:set', onExternalInspectorSet as EventListener);
    return () => {
      window.removeEventListener('this.gui:inspector:set', onExternalInspectorSet as EventListener);
    };
  }, [clearSelection, setInspectorEnabled]);

  React.useEffect(() => {
    const onScopeChanged = (ev: Event) => {
      const custom = ev as CustomEvent<{ mode?: AdminScopeMode }>;
      const nextMode = custom?.detail?.mode;
      if (nextMode === 'scoped' || nextMode === 'global') {
        setAdminScopeMode(nextMode);
      }
    };
    window.addEventListener(ADMIN_VIEW_SCOPE_CHANGED_EVENT, onScopeChanged as EventListener);
    return () => {
      window.removeEventListener(ADMIN_VIEW_SCOPE_CHANGED_EVENT, onScopeChanged as EventListener);
    };
  }, []);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    if (lastInspectorEnabled.current === inspectorEnabled) return;
    lastInspectorEnabled.current = inspectorEnabled;
    window.dispatchEvent(
      new CustomEvent('this.gui:inspector:changed', { detail: { enabled: inspectorEnabled } })
    );
  }, [inspectorEnabled]);

  React.useEffect(() => {
    const styleId = 'gui-inspector-highlight-style';
    document.getElementById(styleId)?.remove();
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      :root { --gui-inspector-accent: ${ui.accent}; }
      .${highlightClass} {
        outline: 2px solid color-mix(in srgb, var(--gui-inspector-accent, #3b82f6) 85%, transparent);
        outline-offset: 2px;
        box-shadow:
          0 0 0 2px color-mix(in srgb, var(--gui-inspector-accent, #3b82f6) 25%, transparent),
          inset 0 0 0 2px color-mix(in srgb, var(--gui-inspector-accent, #3b82f6) 40%, transparent);
        border-radius: 6px;
      }
      .gui-inspector-preview {
        position: relative;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 6px;
        border: 1px solid var(--palette-divider, ${ui.line});
        border-radius: 8px;
        background: color-mix(in srgb, var(--palette-text-primary, ${ui.fg}) 6%, transparent);
        color: var(--palette-text-primary, ${ui.fg});
        font-size: 11px;
        cursor: default;
      }
      .gui-inspector-preview-pop {
        position: absolute;
        left: 0;
        top: calc(100% + 6px);
        background: var(--palette-background-paper, ${ui.bg});
        border: 1px solid var(--palette-divider, ${ui.lineStrong});
        border-radius: 8px;
        padding: 6px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.35);
        opacity: 0;
        transform: translateY(-4px);
        pointer-events: none;
        transition: opacity 120ms ease, transform 120ms ease;
        z-index: 2002;
        max-width: 220px;
      }
      .gui-inspector-preview:hover .gui-inspector-preview-pop {
        opacity: 1;
        transform: translateY(0);
      }
      .gui-inspector-preview-pop img {
        display: block;
        width: auto;
        height: auto;
        max-width: 180px;
        max-height: 180px;
        border-radius: 6px;
      }
      /* Long unbreakable values (monad ids, hashes, signatures) must wrap
         inside the panel instead of running past its edge. */
      aside[data-gui-inspector-control] code {
        white-space: pre-wrap;
        overflow-wrap: anywhere;
      }
      /* Highlighted code (CodeBlock uses wrapLongLines + line numbers, which
         react-syntax-highlighter renders as a flex row per line with every
         token a flex item: a long value can't wrap as text, it just squeezes
         or overflows its item). Lay the line out as normal inline text with
         a hanging line-number gutter instead, so long values wrap in place. */
      aside[data-gui-inspector-control] pre code > span {
        display: block !important;
        padding-left: 3.25em;
        text-indent: -3.25em;
        overflow-wrap: break-word;
      }
      aside[data-gui-inspector-control] pre code > span > span {
        display: inline !important;
        text-indent: 0;
      }
      aside[data-gui-inspector-control] pre code > span > .linenumber {
        display: inline-block !important;
        box-sizing: content-box;
        min-width: 2.25em;
        padding-right: 1em;
        text-align: right;
      }
      [${TREE_HOVER_ATTR}] {
        outline: 2px dashed var(--gui-inspector-accent, #3b82f6) !important;
        outline-offset: -2px !important;
      }
      .gui-grid-overlay-active [data-gui-node-id] {
        outline: 1px solid color-mix(in srgb, var(--gui-inspector-accent, #3b82f6) 35%, transparent);
        outline-offset: -1px;
      }
    `;
    document.head.appendChild(style);
    return () => {
      if (style.parentNode) style.parentNode.removeChild(style);
    };
  }, [highlightClass, ui.accent]);

  React.useEffect(() => {
    const clearHighlight = () => {
      if (lastHighlighted.current) {
        lastHighlighted.current.classList.remove(highlightClass);
        lastHighlighted.current = null;
      }
    };

    if (!inspectorEnabled) {
      clearHighlight();
      return;
    }

    if (!selectedNodeId) {
      clearHighlight();
      return;
    }

    let host: HTMLElement | null = null;
    try {
      host = document.querySelector(
        `[data-gui-node-id="${CSS.escape(selectedNodeId)}"]`
      ) as HTMLElement | null;
    } catch {
      host = document.querySelector(
        `[data-gui-node-id="${selectedNodeId}"]`
      ) as HTMLElement | null;
    }

    if (!host) {
      clearHighlight();
      return;
    }

    if (lastHighlighted.current && lastHighlighted.current !== host) {
      lastHighlighted.current.classList.remove(highlightClass);
    }
    host.classList.add(highlightClass);
    lastHighlighted.current = host;
  }, [highlightClass, inspectorEnabled, selectedNodeId]);

  // Outlines every registered node at once (see CSS rule above) — a global
  // layout debug view, independent of the single-node inspector selection.
  React.useEffect(() => {
    if (typeof document === 'undefined') return;
    document.body.classList.toggle('gui-grid-overlay-active', Boolean(gridEnabled));
    return () => {
      document.body.classList.remove('gui-grid-overlay-active');
    };
  }, [gridEnabled]);

  React.useEffect(() => {
    const onClickCapture = (ev: MouseEvent) => {
      const target = ev.target as HTMLElement | null;
      if (!target) return;
      if (target.closest('[data-gui-inspector-control="true"]')) return;
      let host = target.closest('[data-gui-node-id]') as HTMLElement | null;
      if (!host) return;

      // Respect OFF strictly: no click-to-inspect path when disabled.
      if (!inspectorEnabled) return;

      let metaSource: HTMLElement = target;
      if (ev.metaKey || ev.ctrlKey) {
        const child = findNearestChildNode(host);
        if (child) {
          host = child;
          if (!child.contains(target)) {
            metaSource = child;
          }
        }
      } else if (ev.altKey) {
        let cursor: HTMLElement | null = host;
        let topMost: HTMLElement | null = host;
        while (cursor) {
          if (cursor.hasAttribute('data-gui-node-id')) {
            topMost = cursor;
          }
          cursor = cursor.parentElement;
        }
        host = topMost ?? host;
      } else if (ev.shiftKey) {
        let cursor: HTMLElement | null = host.parentElement;
        let parentMatch: HTMLElement | null = null;
        while (cursor) {
          if (cursor.hasAttribute('data-gui-node-id')) {
            parentMatch = cursor;
            break;
          }
          cursor = cursor.parentElement;
        }
        if (parentMatch) host = parentMatch;
      }

      selectHostElement(host, metaSource);

      ev.preventDefault();
      ev.stopPropagation();
    };

    window.addEventListener('click', onClickCapture, true);
    return () => window.removeEventListener('click', onClickCapture, true);
  }, [inspectorEnabled, findNearestChildNode, selectHostElement]);


  const [panelWidth, setPanelWidth] = React.useState<number>(() => readPanelWidth());
  const [resizing, setResizing] = React.useState(false);
  const [panelFont, setPanelFont] = React.useState<string>('');

  React.useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    setPanelFont(getComputedStyle(document.body).fontFamily);
    const style = document.createElement('style');
    style.setAttribute('data-gui-inspector-split', 'true');
    style.textContent = PANEL_SPLIT_CSS;
    document.head.appendChild(style);
    root.classList.add(PANEL_OPEN_CLASS);
    return () => {
      root.classList.remove(PANEL_OPEN_CLASS);
      root.style.removeProperty('--gui-inspector-width');
      style.remove();
    };
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    document.documentElement.style.setProperty('--gui-inspector-width', `${panelWidth}px`);
  }, [open, panelWidth]);

  React.useEffect(() => {
    if (!open) return;
    const onResize = () => setPanelWidth((w) => clampPanelWidth(w));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [open]);

  const startPanelResize = React.useCallback((ev: React.PointerEvent<HTMLDivElement>) => {
    ev.preventDefault();
    const handle = ev.currentTarget;
    handle.setPointerCapture(ev.pointerId);
    setResizing(true);
    const onMove = (e: PointerEvent) => setPanelWidth(clampPanelWidth(window.innerWidth - e.clientX));
    const onUp = (e: PointerEvent) => {
      handle.removeEventListener('pointermove', onMove);
      handle.removeEventListener('pointerup', onUp);
      handle.removeEventListener('pointercancel', onUp);
      try { handle.releasePointerCapture(e.pointerId); } catch {}
      setResizing(false);
      setPanelWidth((w) => {
        try { localStorage.setItem(PANEL_WIDTH_KEY, String(w)); } catch {}
        return w;
      });
    };
    handle.addEventListener('pointermove', onMove);
    handle.addEventListener('pointerup', onUp);
    handle.addEventListener('pointercancel', onUp);
  }, []);
  const diffPayload = React.useMemo(
    () => buildPropsDiff(selected?.spec, selected?.resolvedProps),
    [selected?.spec, selected?.resolvedProps]
  );
  const provenance = React.useMemo(
    () => selected?.provenance ?? selected?.spec?.provenance ?? null,
    [selected?.provenance, selected?.spec]
  );
  const kernelAvailable = React.useMemo(
    () => hasKernelExplain(me),
    [me]
  );
  const explainPath = React.useMemo(
    () => resolveExplainPath(provenance),
    [provenance]
  );
  const [explainState, setExplainState] = React.useState<ExplainPanelState>({
    status: 'idle',
    sourcePath: null,
  });
  const explainSummary = React.useMemo(
    () =>
      explainState.status === 'ready' && explainState.payload
        ? summarizeExplainPayload(explainState.payload, provenance)
        : null,
    [explainState, provenance]
  );
  const truthMetrics = React.useMemo(
    () =>
      explainState.status === 'ready'
        ? buildTruthMetrics(explainState.payload, explainState.inspectPayload, explainPath)
        : [],
    [explainState, explainPath]
  );
  const truthDependencies = React.useMemo(
    () =>
      explainState.status === 'ready'
        ? buildTruthDependencies(explainState.payload)
        : [],
    [explainState]
  );
  const truthTimeline = React.useMemo(
    () =>
      explainState.status === 'ready'
        ? buildTruthTimeline(explainState.payload, explainState.inspectPayload, explainPath)
        : [],
    [explainState, explainPath]
  );
  const shieldMessage = React.useMemo(
    () =>
      explainState.status === 'ready'
        ? buildShieldMessage(explainState.payload, explainState.inspectPayload, explainPath)
        : null,
    [explainState, explainPath]
  );

  React.useEffect(() => {
    setExplainState({
      status: 'idle',
      sourcePath: explainPath,
    });
  }, [selectedNodeId, explainPath, me]);

  const handleExplain = React.useCallback(async () => {
    // No-op, not an error state: the permanent "no provenance contract"
    // notice below (rendered whenever !explainPath, regardless of whether
    // Explain was ever clicked) already says this. Setting explainState to
    // 'error' here duplicated that exact same describeExplainGap() text a
    // second time, in its own separate error-styled box, the moment this
    // button was clicked — the button is also disabled in this state now,
    // but this guard stays as a safety net against calling it any other way.
    if (!explainPath) return;

    if (!kernelAvailable) {
      setExplainState({
        status: 'unsupported',
        sourcePath: explainPath,
        error:
          'No `.me` kernel is attached to this runtime context. Mount with `{ me }`, or pass `runtime: render(me)`, to enable kernel truth.',
      });
      return;
    }

    setExplainState({
      status: 'loading',
      sourcePath: explainPath,
    });

    try {
      const [explainResult, inspectResult] = await Promise.allSettled([
        requestKernelExplain(me, explainPath),
        requestKernelInspect(me, explainPath),
      ]);

      if (explainResult.status !== 'fulfilled') {
        throw explainResult.reason;
      }

      setExplainState({
        status: 'ready',
        sourcePath: explainPath,
        sourceMethod: explainResult.value.method,
        payload: explainResult.value.payload,
        inspectMethod:
          inspectResult.status === 'fulfilled' ? inspectResult.value.method : undefined,
        inspectPayload:
          inspectResult.status === 'fulfilled' ? inspectResult.value.payload : undefined,
      });
    } catch (error) {
      setExplainState({
        status: 'error',
        sourcePath: explainPath,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }, [explainPath, kernelAvailable, me, provenance]);

  const tabButtonStyle = (active: boolean): React.CSSProperties => ({
    border: `1px solid ${ui.lineStrong}`,
    background: active ? ui.fillActive : 'transparent',
    color: ui.fg,
    borderRadius: 8,
    padding: '4px 8px',
    cursor: 'pointer',
    fontSize: 11,
    fontWeight: active ? 700 : 500,
  });
  const tabMetaLabel =
    tab === 'spec'
      ? 'Intent'
      : tab === 'resolved'
        ? 'JSON after runtime resolution'
        : 'Spec props vs resolved props';

  const shortcutKeyStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    fontSize: 10,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    color: ui.fgMuted,
  };
  const keycapStyle: React.CSSProperties = {
    border: `1px solid ${ui.lineStrong}`,
    borderRadius: 6,
    padding: '2px 6px',
    fontSize: 10,
    background: ui.fillSoft,
    color: ui.fg,
  };
  const shortcutButtonStyle: React.CSSProperties = {
    border: `1px solid ${ui.lineStrong}`,
    background: 'transparent',
    color: ui.fg,
    borderRadius: 6,
    padding: '4px 8px',
    cursor: 'pointer',
    fontSize: 11,
  };
  const treeButtonStyle: React.CSSProperties = {
    border: `1px solid ${ui.lineStrong}`,
    background: 'transparent',
    color: ui.fg,
    borderRadius: 6,
    padding: '2px 6px',
    cursor: 'pointer',
    fontSize: 11,
    fontFamily: 'inherit',
  };
  const explainToneStyle = React.useMemo<React.CSSProperties | null>(() => {
    if (!explainSummary) return null;
    if (explainSummary.tone === 'redacted') {
      return {
        border: `1px solid ${ui.error.border}`,
        background: ui.error.bg,
        color: ui.error.fg,
      };
    }
    if (explainSummary.tone === 'warning') {
      return {
        border: `1px solid ${ui.warning.border}`,
        background: ui.warning.bg,
        color: ui.warning.fg,
      };
    }
    if (explainSummary.tone === 'unknown') {
      return {
        border: `1px solid ${ui.neutral.border}`,
        background: ui.neutral.bg,
        color: ui.neutral.fg,
      };
    }
    return {
      border: `1px solid ${ui.success.border}`,
      background: ui.success.bg,
      color: ui.success.fg,
    };
  }, [explainSummary]);

  return (
    <>
      {toggleVisible && (
        <button
          type="button"
          data-gui-inspector-control="true"
          onClick={() => setInspectorEnabled(!inspectorEnabled)}
          style={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            zIndex: 2000,
            borderRadius: 999,
            border: `1px solid ${ui.lineStrong}`,
            background: inspectorEnabled ? ui.primary : ui.bg,
            color: inspectorEnabled ? ui.primaryContrast : ui.fg,
            fontSize: 12,
            padding: '8px 12px',
            cursor: 'pointer',
          }}
        >
          {inspectorEnabled ? 'Inspector ON' : 'Inspector OFF'}
        </button>
      )}

      {open && createPortal(
        <aside
          data-gui-inspector-control="true"
          style={{
            position: 'fixed',
            top: 0,
            right: 0,
            width: panelWidth,
            height: '100vh',
            zIndex: 1999,
            background: ui.bg,
            color: ui.fg,
            fontFamily: panelFont || undefined,
            borderLeft: `1px solid ${ui.line}`,
            display: 'flex',
            flexDirection: 'column',
            userSelect: resizing ? 'none' : undefined,
          }}
        >
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize inspector"
            title="Drag to resize"
            data-gui-inspector-control="true"
            onPointerDown={startPanelResize}
            onDoubleClick={() => {
              setPanelWidth(PANEL_WIDTH_DEFAULT);
              try { localStorage.removeItem(PANEL_WIDTH_KEY); } catch {}
            }}
            style={{
              position: 'absolute',
              top: 0,
              left: -3,
              width: 7,
              height: '100%',
              cursor: 'col-resize',
              zIndex: 1,
              background: resizing ? ui.accent : 'transparent',
              opacity: resizing ? 0.5 : 1,
              touchAction: 'none',
            }}
          />
          <header
            style={{
              padding: '12px 14px',
              borderBottom: `1px solid ${ui.line}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <strong style={{ fontSize: 13 }}>Inspector</strong>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                type="button"
                onClick={clearSelection}
                style={{
                  border: `1px solid ${ui.lineStrong}`,
                  background: 'transparent',
                  color: ui.fg,
                  borderRadius: 6,
                  padding: '4px 8px',
                  cursor: 'pointer',
                  fontSize: 11,
                }}
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => {
                  clearSelection();
                  setInspectorEnabled(false);
                }}
                aria-label="Close inspector"
                title="Close inspector"
                style={{
                  border: `1px solid ${ui.lineStrong}`,
                  background: 'transparent',
                  color: ui.fg,
                  borderRadius: 999,
                  padding: '2px 8px',
                  cursor: 'pointer',
                  fontSize: 14,
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>
          </header>

          <div style={{ padding: 12, overflow: 'auto', fontSize: 12, lineHeight: 1.45 }}>
            {treeView && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ opacity: 0.75, marginBottom: 6, fontWeight: 700 }}>TREE</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 4, marginBottom: 8 }}>
                  {treeView.path.map((entry, i) => {
                    const last = i === treeView.path.length - 1;
                    return (
                      <React.Fragment key={`${entry.id}#${entry.nth}`}>
                        {i > 0 && <span style={{ opacity: 0.5 }}>›</span>}
                        {last ? (
                          <span
                            title={entry.id}
                            style={{ fontWeight: 700, padding: '2px 6px', borderRadius: 6, background: ui.fillActive }}
                          >
                            {entry.label}
                          </span>
                        ) : (
                          <button
                            type="button"
                            title={entry.id}
                            onClick={() => selectTreeNode(entry)}
                            onMouseEnter={() => hoverTreeNode(entry)}
                            onMouseLeave={() => hoverTreeNode(null)}
                            style={treeButtonStyle}
                          >
                            {entry.label}
                          </button>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
                <div style={{ opacity: 0.75, marginBottom: 4 }}>
                  children ({treeView.children.length})
                </div>
                {treeView.children.length === 0 ? (
                  <div style={{ opacity: 0.55 }}>No tagged children</div>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {treeView.children.slice(0, TREE_CHILDREN_LIMIT).map((entry) => (
                      <button
                        key={`${entry.id}#${entry.nth}`}
                        type="button"
                        title={entry.id}
                        onClick={() => selectTreeNode(entry)}
                        onMouseEnter={() => hoverTreeNode(entry)}
                        onMouseLeave={() => hoverTreeNode(null)}
                        style={treeButtonStyle}
                      >
                        {entry.label}
                      </button>
                    ))}
                    {treeView.children.length > TREE_CHILDREN_LIMIT && (
                      <span style={{ opacity: 0.6, padding: '2px 4px' }}>
                        +{treeView.children.length - TREE_CHILDREN_LIMIT} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
            <div style={{ marginBottom: 10 }}>
              <div style={{ opacity: 0.75 }}>nodeId</div>
              <code>{selectedNodeId}</code>
            </div>
            <div style={{ marginBottom: 10 }}>
              <div style={{ opacity: 0.75 }}>type</div>
              <code>{selected?.type ?? selectedMeta?.domComponentAttr ?? 'unknown'}</code>
            </div>
            {selected?.part && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ opacity: 0.75 }}>part</div>
                <code>{selected.part}</code>
              </div>
            )}
            {selected?.parentId && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ opacity: 0.75 }}>parent</div>
                <code>{selected.parentId}</code>
              </div>
            )}
            {provenance && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ opacity: 0.75, marginBottom: 6, fontWeight: 700 }}>PROVENANCE</div>
                <CodeBlock
                  code={safeStringify(provenance)}
                  language="json"
                  variant={codeVariant}
                  title="node.provenance.json"
                  showLineNumbers
                  wrapLongLines
                  showCopyButton
                />
              </div>
            )}
            <div style={{ marginBottom: 12 }}>
              <div style={{ opacity: 0.75, marginBottom: 6, fontWeight: 700 }}>
                PROVENANCE DETAILS
              </div>
              <div
                style={{
                  border: `1px solid ${ui.line}`,
                  borderRadius: 12,
                  padding: 10,
                  background: ui.fillFaint,
                }}
              >
                <div style={{ marginBottom: 8 }}>
                  <div style={{ opacity: 0.75 }}>explain path</div>
                  <code>{explainPath || 'Not declared'}</code>
                </div>
                {provenance?.policy && (
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ opacity: 0.75 }}>policy</div>
                    <code>{String(provenance.policy)}</code>
                  </div>
                )}
                {provenance?.binding && (
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ opacity: 0.75 }}>binding</div>
                    <code>{String(provenance.binding)}</code>
                  </div>
                )}
                {explainState.sourceMethod && (
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ opacity: 0.75 }}>explain call</div>
                    <code>{explainState.sourceMethod}</code>
                  </div>
                )}
                {explainState.inspectMethod && (
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ opacity: 0.75 }}>timeline source</div>
                    <code>{explainState.inspectMethod}</code>
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                  <button
                    type="button"
                    onClick={handleExplain}
                    disabled={explainState.status === 'loading' || !explainPath}
                    title={!explainPath ? describeExplainGap(provenance) : undefined}
                    style={{
                      border: `1px solid ${ui.lineStrong}`,
                      background: explainState.status === 'loading' ? ui.fillHover : 'transparent',
                      color: ui.fg,
                      borderRadius: 8,
                      padding: '6px 10px',
                      cursor: explainState.status === 'loading' ? 'wait' : !explainPath ? 'not-allowed' : 'pointer',
                      fontSize: 11,
                      fontWeight: 600,
                      opacity: !explainPath ? 0.5 : 1,
                    }}
                  >
                    {explainState.status === 'ready' ? 'Refresh Explain' : 'Explain'}
                  </button>
                  {explainPath && !kernelAvailable && (
                    <span style={{ fontSize: 11, opacity: 0.82 }}>
                      Attach a kernel with <code>{'{ me }'}</code> or <code>{'{ runtime: render(me) }'}</code> to enable Explain.
                    </span>
                  )}
                </div>
                {!explainPath && (
                  <div
                    style={{
                      border: `1px solid ${ui.warning.border}`,
                      background: ui.warning.bg,
                      color: ui.warning.fg,
                      borderRadius: 10,
                      padding: '8px 10px',
                      fontSize: 11,
                      marginBottom: 8,
                    }}
                  >
                    {describeExplainGap(provenance)}
                  </div>
                )}
                {explainState.status === 'loading' && (
                  <div style={{ fontSize: 11, opacity: 0.82 }}>
                    Loading kernel explanation...
                  </div>
                )}
                {(explainState.status === 'error' || explainState.status === 'unsupported') &&
                  explainState.error && (
                    <div
                      style={{
                        border: `1px solid ${ui.error.border}`,
                        background: ui.error.bg,
                        color: ui.error.fg,
                        borderRadius: 10,
                        padding: '8px 10px',
                        fontSize: 11,
                      }}
                    >
                      {explainState.error}
                    </div>
                  )}
                {explainSummary && explainToneStyle && (
                  <div
                    style={{
                      ...explainToneStyle,
                      borderRadius: 10,
                      padding: '8px 10px',
                      fontSize: 11,
                      marginBottom: 8,
                    }}
                  >
                    <div style={{ fontWeight: 700, marginBottom: 4 }}>{explainSummary.label}</div>
                    <div>{explainSummary.message}</div>
                  </div>
                )}
                {shieldMessage && (
                  <div
                    style={{
                      border: `1px solid ${ui.info.border}`,
                      background: ui.info.bg,
                      color: ui.info.fg,
                      borderRadius: 10,
                      padding: '8px 10px',
                      fontSize: 11,
                      marginBottom: 8,
                    }}
                  >
                    <div style={{ fontWeight: 700, marginBottom: 4 }}>Kernel Shield</div>
                    <div>{shieldMessage}</div>
                  </div>
                )}
                {truthMetrics.length > 0 && (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                      gap: 8,
                      marginBottom: 8,
                    }}
                  >
                    {truthMetrics.map((metric) => (
                      <div
                        key={metric.label}
                        style={{
                          border: `1px solid ${ui.line}`,
                          background: ui.fillFaint,
                          borderRadius: 10,
                          padding: '8px 10px',
                        }}
                      >
                        <div style={{ opacity: 0.7, fontSize: 10, marginBottom: 4 }}>{metric.label}</div>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>{metric.value}</div>
                      </div>
                    ))}
                  </div>
                )}
                {truthDependencies.length > 0 && (
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ opacity: 0.75, marginBottom: 6, fontWeight: 700 }}>DEPENDENCY MAP</div>
                    <div style={{ display: 'grid', gap: 8 }}>
                      {truthDependencies.map((dependency) => (
                        <div
                          key={`${dependency.path}:${dependency.label}`}
                          style={{
                            border: `1px solid ${ui.line}`,
                            background:
                              dependency.masked
                                ? ui.error.bg
                                : ui.fillFaint,
                            borderRadius: 10,
                            padding: '8px 10px',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                            <strong style={{ fontSize: 11 }}>{dependency.label}</strong>
                            <span style={{ fontSize: 10, opacity: 0.75 }}>
                              {dependency.masked ? 'stealth' : dependency.origin}
                            </span>
                          </div>
                          <div style={{ marginBottom: 4 }}>
                            <code>{dependency.path}</code>
                          </div>
                          <div style={{ fontSize: 11, opacity: 0.9 }}>{dependency.valueLabel}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {truthTimeline.length > 0 && (
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ opacity: 0.75, marginBottom: 6, fontWeight: 700 }}>CAUSALITY TIMELINE</div>
                    <div style={{ display: 'grid', gap: 8 }}>
                      {truthTimeline.map((entry) => (
                        <div
                          key={entry.id}
                          style={{
                            border:
                              entry.tone === 'warning'
                                ? `1px solid ${ui.warning.border}`
                                : entry.tone === 'redacted'
                                  ? `1px solid ${ui.error.border}`
                                  : `1px solid ${ui.line}`,
                            background:
                              entry.tone === 'warning'
                                ? ui.warning.bg
                                : entry.tone === 'redacted'
                                  ? ui.error.bg
                                  : ui.fillFaint,
                            borderRadius: 10,
                            padding: '8px 10px',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                            <strong style={{ fontSize: 11 }}>{entry.label}</strong>
                            {entry.hash && (
                              <span style={{ fontSize: 10, opacity: 0.75 }}>
                                #{entry.hash}
                              </span>
                            )}
                          </div>
                          {entry.path && (
                            <div style={{ marginBottom: 4 }}>
                              <code>{entry.path}</code>
                            </div>
                          )}
                          <div style={{ fontSize: 11 }}>{entry.detail}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {explainState.status === 'ready' && (
                  <CodeBlock
                    code={safeStringify(explainState.payload ?? null)}
                    language="json"
                    variant={codeVariant}
                    title="kernel.explain.json"
                    showLineNumbers
                    wrapLongLines
                    showCopyButton
                  />
                )}
              </div>
            </div>
            {imagePreviews.length > 0 && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ opacity: 0.75, marginBottom: 6 }}>image preview</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {imagePreviews.map((item, idx) => (
                    <div key={`${item.path}-${idx}`} className="gui-inspector-preview" title={item.path}>
                      <span style={{ display: 'inline-flex', width: 14, height: 14 }}>
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
                          <path d="M21 19V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2Zm-2 0H5V5h14Zm-2-2H7l3.5-4.5 2.5 3 2-2.5L17 17Z" />
                        </svg>
                      </span>
                      <span>{item.path || 'image'}</span>
                      <div className="gui-inspector-preview-pop">
                        <img src={item.src} alt={item.path || 'preview'} loading="lazy" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {selectedMeta?.resolvedPath && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ opacity: 0.75 }}>resolved path</div>
                <code>{selectedMeta.resolvedPath.join(' > ')}</code>
              </div>
            )}
            <div style={{ marginBottom: 12 }}>
              <div style={{ opacity: 0.75, marginBottom: 6, fontWeight: 700 }}>SHORTCUTS</div>
              <div style={{ display: 'grid', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>Select parent</div>
                    <div style={shortcutKeyStyle}>
                      <span style={keycapStyle}>Shift</span>
                      <span>+ Click</span>
                    </div>
                  </div>
                  <button type="button" onClick={selectParentNode} style={shortcutButtonStyle}>
                    Select
                  </button>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>Select child</div>
                    <div style={shortcutKeyStyle}>
                      <span style={keycapStyle}>Ctrl/⌘</span>
                      <span>+ Click</span>
                    </div>
                  </div>
                  <button type="button" onClick={selectChildNode} style={shortcutButtonStyle}>
                    Select
                  </button>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>Select topmost</div>
                    <div style={shortcutKeyStyle}>
                      <span style={keycapStyle}>Alt</span>
                      <span>+ Click</span>
                    </div>
                  </div>
                  <button type="button" onClick={selectTopmostNode} style={shortcutButtonStyle}>
                    Select
                  </button>
                </div>
              </div>
            </div>
            <div style={{ marginBottom: 10 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 6,
                }}
              >
                <div style={{ opacity: 0.75, fontWeight: 700 }}>JSON VIEW</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 10, opacity: 0.7 }}>{tabMetaLabel}</span>
                  <button type="button" onClick={() => setTab('spec')} style={tabButtonStyle(tab === 'spec')}>
                    Spec
                  </button>
                  <button
                    type="button"
                    onClick={() => setTab('resolved')}
                    style={tabButtonStyle(tab === 'resolved')}
                    title="Shows the JSON after runtime prop resolution"
                  >
                    Runtime
                  </button>
                  <button type="button" onClick={() => setTab('diff')} style={tabButtonStyle(tab === 'diff')}>
                    Diff
                  </button>
                </div>
              </div>
              <div style={{ fontSize: 11, opacity: 0.65 }}>
                Changes only the JSON panel below.
              </div>
            </div>
            {tab === 'spec' && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ opacity: 0.75, marginBottom: 6, fontWeight: 700 }}>
                  INTENTION (RAW SPEC)
                </div>
                <CodeBlock
                  code={safeStringify(selected?.spec ?? null)}
                  language="json"
                  variant={codeVariant}
                  title="raw.spec.json"
                  showLineNumbers
                  wrapLongLines
                  showCopyButton
                />
              </div>
            )}

            {tab === 'resolved' && (
              <div>
                <div style={{ opacity: 0.75, marginBottom: 6, fontWeight: 700 }}>
                  MANIFESTATION (RUNTIME-RESOLVED JSON)
                </div>
                <CodeBlock
                  code={safeStringify(selected?.resolvedProps ?? null)}
                  language="json"
                  variant={codeVariant}
                  title="resolved.props.json"
                  showLineNumbers
                  wrapLongLines
                  showCopyButton
                />
              </div>
            )}

            {tab === 'diff' && (
              <div>
                <div style={{ opacity: 0.75, marginBottom: 6, fontWeight: 700 }}>
                  DIFF (SPEC.PROPS VS RUNTIME-RESOLVED JSON)
                </div>
                <CodeBlock
                  code={safeStringify(diffPayload)}
                  language="json"
                  variant={codeVariant}
                  title="spec-vs-resolved.diff.json"
                  showLineNumbers
                  wrapLongLines
                  showCopyButton
                />
              </div>
            )}
          </div>
        </aside>,
        document.documentElement
      )}
    </>
  );
}
