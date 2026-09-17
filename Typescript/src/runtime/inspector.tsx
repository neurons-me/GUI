/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from 'react';
import { RightSidebarContext } from '@/gui-internals/Contexts/RightSidebarContext';
import { useSelection } from './selection';
import { useRuntimeEnvironment } from './runtimeContext';
import CodeBlock from '@/gui/Molecules/CodeBlock/CodeBlock';
import { useGuiTheme } from '@/gui-internals/Hooks/useGuiTheme';

const DATA_URI_PREFIXES = ['data:', 'blob:'];
const DATA_URI_PREVIEW_CHARS = 32;
const LARGE_STRING_LIMIT = 1024;
const ADMIN_VIEW_SCOPE_KEY = 'gui.runtime.admin.view.scope.v1';
const ADMIN_VIEW_SCOPE_SET_EVENT = 'this.gui:adminView:scope:set';
const ADMIN_VIEW_SCOPE_CHANGED_EVENT = 'this.gui:adminView:scope:changed';
type AdminScopeMode = 'global' | 'scoped';

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
  const codeVariant = theme?.palette?.mode === 'light' ? 'light' : 'dark';
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
      });
      rightSidebar?.setView?.('expanded');
      return true;
    },
    [resolveNodeId, selectNode, setSelectedMeta, buildResolvedPath, rightSidebar]
  );

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
    if (document.getElementById(styleId)) return;
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .${highlightClass} {
        outline: 2px solid rgba(59, 130, 246, 0.85);
        outline-offset: 2px;
        box-shadow:
          0 0 0 2px rgba(59, 130, 246, 0.25),
          inset 0 0 0 2px rgba(59, 130, 246, 0.4);
        border-radius: 6px;
      }
      .gui-inspector-preview {
        position: relative;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 6px;
        border: 1px solid rgba(255,255,255,0.18);
        border-radius: 8px;
        background: rgba(255,255,255,0.06);
        color: #e5e7eb;
        font-size: 11px;
        cursor: default;
      }
      .gui-inspector-preview-pop {
        position: absolute;
        left: 0;
        top: calc(100% + 6px);
        background: #0b1220;
        border: 1px solid rgba(255,255,255,0.2);
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
      .gui-grid-overlay-active [data-gui-node-id] {
        outline: 1px solid rgba(59, 130, 246, 0.35);
        outline-offset: -1px;
      }
    `;
    document.head.appendChild(style);
    return () => {
      if (style.parentNode) style.parentNode.removeChild(style);
    };
  }, [highlightClass]);

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

  const open = inspectorEnabled && !!selectedNodeId;
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
    border: '1px solid rgba(255,255,255,0.2)',
    background: active ? 'rgba(255,255,255,0.14)' : 'transparent',
    color: '#e5e7eb',
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
    color: 'rgba(229, 231, 235, 0.75)',
  };
  const keycapStyle: React.CSSProperties = {
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: 6,
    padding: '2px 6px',
    fontSize: 10,
    background: 'rgba(255,255,255,0.06)',
    color: '#e5e7eb',
  };
  const shortcutButtonStyle: React.CSSProperties = {
    border: '1px solid rgba(255,255,255,0.2)',
    background: 'transparent',
    color: '#e5e7eb',
    borderRadius: 6,
    padding: '4px 8px',
    cursor: 'pointer',
    fontSize: 11,
  };
  const explainToneStyle = React.useMemo<React.CSSProperties | null>(() => {
    if (!explainSummary) return null;
    if (explainSummary.tone === 'redacted') {
      return {
        border: '1px solid rgba(248, 113, 113, 0.45)',
        background: 'rgba(127, 29, 29, 0.35)',
        color: '#fecaca',
      };
    }
    if (explainSummary.tone === 'warning') {
      return {
        border: '1px solid rgba(251, 191, 36, 0.35)',
        background: 'rgba(120, 53, 15, 0.35)',
        color: '#fde68a',
      };
    }
    if (explainSummary.tone === 'unknown') {
      return {
        border: '1px solid rgba(148, 163, 184, 0.35)',
        background: 'rgba(51, 65, 85, 0.35)',
        color: '#cbd5e1',
      };
    }
    return {
      border: '1px solid rgba(74, 222, 128, 0.3)',
      background: 'rgba(20, 83, 45, 0.3)',
      color: '#bbf7d0',
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
            border: '1px solid rgba(255,255,255,0.2)',
            background: inspectorEnabled ? '#0f172a' : '#111827',
            color: '#fff',
            fontSize: 12,
            padding: '8px 12px',
            cursor: 'pointer',
          }}
        >
          {inspectorEnabled ? 'Inspector ON' : 'Inspector OFF'}
        </button>
      )}

      {open && (
        <aside
          data-gui-inspector-control="true"
          style={{
            position: 'fixed',
            top: 0,
            right: 0,
            width: 380,
            maxWidth: '90vw',
            height: '100vh',
            zIndex: 1999,
            background: '#0b1220',
            color: '#e5e7eb',
            borderLeft: '1px solid rgba(255,255,255,0.12)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <header
            style={{
              padding: '12px 14px',
              borderBottom: '1px solid rgba(255,255,255,0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <strong style={{ fontSize: 13 }}>Semantic Inspector</strong>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                type="button"
                onClick={clearSelection}
                style={{
                  border: '1px solid rgba(255,255,255,0.2)',
                  background: 'transparent',
                  color: '#e5e7eb',
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
                  border: '1px solid rgba(255,255,255,0.2)',
                  background: 'transparent',
                  color: '#e5e7eb',
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
            <div style={{ marginBottom: 10 }}>
              <div style={{ opacity: 0.75 }}>nodeId</div>
              <code>{selectedNodeId}</code>
            </div>
            <div style={{ marginBottom: 10 }}>
              <div style={{ opacity: 0.75 }}>type</div>
              <code>{selected?.type ?? 'unknown'}</code>
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
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 12,
                  padding: 10,
                  background: 'rgba(255,255,255,0.03)',
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
                      border: '1px solid rgba(255,255,255,0.2)',
                      background: explainState.status === 'loading' ? 'rgba(255,255,255,0.08)' : 'transparent',
                      color: '#e5e7eb',
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
                      border: '1px solid rgba(251, 191, 36, 0.25)',
                      background: 'rgba(120, 53, 15, 0.2)',
                      color: '#fde68a',
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
                        border: '1px solid rgba(248, 113, 113, 0.35)',
                        background: 'rgba(127, 29, 29, 0.25)',
                        color: '#fecaca',
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
                      border: '1px solid rgba(96, 165, 250, 0.35)',
                      background: 'rgba(30, 64, 175, 0.2)',
                      color: '#bfdbfe',
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
                          border: '1px solid rgba(255,255,255,0.12)',
                          background: 'rgba(255,255,255,0.03)',
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
                            border: '1px solid rgba(255,255,255,0.12)',
                            background:
                              dependency.masked
                                ? 'rgba(127, 29, 29, 0.2)'
                                : 'rgba(255,255,255,0.03)',
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
                                ? '1px solid rgba(251, 191, 36, 0.35)'
                                : entry.tone === 'redacted'
                                  ? '1px solid rgba(248, 113, 113, 0.35)'
                                  : '1px solid rgba(255,255,255,0.12)',
                            background:
                              entry.tone === 'warning'
                                ? 'rgba(120, 53, 15, 0.2)'
                                : entry.tone === 'redacted'
                                  ? 'rgba(127, 29, 29, 0.2)'
                                  : 'rgba(255,255,255,0.03)',
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
        </aside>
      )}
    </>
  );
}
