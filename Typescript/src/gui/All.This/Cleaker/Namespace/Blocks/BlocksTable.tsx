import React from 'react';
import {
    Avatar,
    Box,
    IconButton,
    Typography,
    Tooltip } from '@/gui/Atoms';
import { Table, TableHead, TableRow, TableCell, TableBody } from '@/gui/Molecules';
import Icon from '@/gui/Atoms/Icon/Icon';
import { useGuiTheme } from '@/gui-internals/Hooks';
import { selectionStore } from '@/runtime/selectionStore';
import CleakerQR from '../../QR/CleakerQR';
import { buildCleakerNamespaceUrl } from '../../namespaceExpression';
import QR from '../../../me/QR';

export interface BlocksTableEntry {
  id: number;
  timestamp: number;
  namespace: string;
  path: string;
  operator: string | null;
  data: unknown;
  hash: string;
  prevHash: string;
}

type BlocksTableProps = {
  endpoint: string;
  /** Override the fetch path. Default: /blockchain or /blocks.
   *  Pass an NRP path like /@fatima/name to show blocks for that target only. */
  blockPath?: string;
  namespaceRootUrl?: string;
  namespaceLabel?: string;
  rowsLimit?: number;
  'data-gui-node-id'?: string;
  'data-gui-component'?: string;
};

type ResolvedValuePresentation = {
  preview: string;
  full: string;
  kind: 'email' | 'phone' | 'timestamp' | 'url' | 'username' | 'pointer' | 'text' | 'empty';
  href?: string;
};

function isSchemaPath(path: string): boolean {
  return /^schema\./i.test(String(path || '').trim());
}

function schemaDisplayLabel(path: string): string {
  const normalized = String(path || '').trim().toLowerCase();
  if (!normalized) return 'schema';
  if (normalized.endsWith('.behavior.type')) return 'behavior';
  if (normalized.endsWith('.suggest.contains')) return 'contains';
  if (normalized.endsWith('.status')) return 'status';
  if (normalized.endsWith('.unit')) return 'unit';
  if (normalized.endsWith('.type')) return 'type';
  const parts = normalized.split('.').filter(Boolean);
  return parts[parts.length - 1] || 'schema';
}

function schemaPreviewText(path: string, value: unknown): string {
  const label = schemaDisplayLabel(path);

  if (Array.isArray(value)) {
    const text = value.map((item) => String(item ?? '').trim()).filter(Boolean).join(', ');
    return `${label}: ${text || '—'}`;
  }

  if (value && typeof value === 'object') {
    return `${label}: ${maskValue(stableJson(value), 52)}`;
  }

  const text = String(value ?? '').trim() || '—';
  return `${label}: ${text}`;
}

function rowPriority(row: BlocksTableEntry): number {
  const path = String(row.path || '').trim().toLowerCase();
  if (/^users\./.test(path)) return 0;
  if (isSchemaPath(path)) return 2;
  return 1;
}

function maskHash(hash: string): string {
  const value = String(hash || '').trim();
  if (!value) return '—';
  if (value.length <= 11) return value;
  return `${value.slice(0, 5)}…${value.slice(-5)}`;
}

function normalizeNodeSegment(value: string, fallback: string): string {
  const normalized = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
  return normalized || fallback;
}

function sanitizeUrlValue(value: unknown): string | null {
  const text = String(value ?? '').trim();
  if (!text) return null;
  if (/^https?:\/\//i.test(text)) return text;
  return null;
}

function stableJson(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableJson(item)).join(', ')}]`;
  }

  const entries = Object.entries(value as Record<string, unknown>)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, item]) => `${JSON.stringify(key)}: ${stableJson(item)}`);

  return `{ ${entries.join(', ')} }`;
}

function maskValue(value: string, max = 44): string {
  const text = String(value || '').trim();
  if (!text) return '—';
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

function formatTimestampParts(timestamp: number): { date: string; time: string; full: string } {
  const value = new Date(timestamp);
  return {
    date: value.toLocaleDateString(),
    time: value.toLocaleTimeString(),
    full: value.toLocaleString(),
  };
}

// Known rootspace suffixes — these are spaces, not user handles.
// A namespace that IS one of these (or ends with one) has no user prefix.
const ROOTSPACE_SUFFIXES = ['.local', '.me', '.cleaker.me', '.neurons.me'];

function isRootspace(value: string): boolean {
  // A pure rootspace has no user prefix: e.g. "suis-macbook-air.local", "cleaker.me"
  // A user namespace has a prefix: e.g. "jabellae.suis-macbook-air.local"
  for (const suffix of ROOTSPACE_SUFFIXES) {
    if (value.endsWith(suffix)) {
      // The part before the suffix should be a single label (no dots) to be a user handle
      const prefix = value.slice(0, value.length - suffix.length);
      if (!prefix || prefix.includes('.')) return true; // no prefix or multi-label prefix = rootspace
      return false; // single label prefix = user handle
    }
  }
  return false;
}

function splitNamespace(namespace: string): { subject: string; root: string } {
  const value = String(namespace || '').trim();
  if (!value) return { subject: '—', root: '—' };

  const parts = value.split('.');
  if (parts.length <= 1) return { subject: value, root: value };

  // If this is a pure rootspace (no user prefix), subject = root = full value
  if (isRootspace(value)) {
    return { subject: value, root: value };
  }

  // User namespace: first label is the handle, rest is the rootspace
  return {
    subject: parts[0] || value,
    root: parts.slice(1).join('.') || value,
  };
}

function isTimeLikePath(path: string): boolean {
  return /(?:^|\.)(claimed_at|opened_at|updated_at|created_at|timestamp|lastSeen)$/i.test(path);
}

function formatResolvedValue(row: BlocksTableEntry): ResolvedValuePresentation {
  const value = row.data;
  const path = String(row.path || '').trim().toLowerCase();

  if (isSchemaPath(path)) {
    const preview = schemaPreviewText(path, value);
    const full = Array.isArray(value)
      ? value.map((item) => String(item ?? '').trim()).filter(Boolean).join(', ')
      : value && typeof value === 'object'
        ? stableJson(value)
        : String(value ?? '').trim() || '(empty)';
    return {
      preview,
      full,
      kind: full === '(empty)' ? 'empty' : 'text',
    };
  }

  if (typeof value === 'number' && isTimeLikePath(path)) {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      const full = date.toLocaleString();
      return { preview: full, full, kind: 'timestamp' };
    }
  }

  if (typeof value === 'string') {
    const text = value.trim();
    if (!text) return { preview: '(empty)', full: '(empty)', kind: 'empty' };
    if (path === 'email' || path.endsWith('.email')) {
      return { preview: text, full: text, kind: 'email', href: `mailto:${text}` };
    }
    if (path === 'phone' || path.endsWith('.phone')) {
      return { preview: text, full: text, kind: 'phone', href: `tel:${text.replace(/\s+/g, '')}` };
    }
    if (path === 'username' || path.endsWith('.username')) {
      const normalized = text.startsWith('@') ? text : `@${text}`;
      return { preview: normalized, full: normalized, kind: 'username' };
    }
    if (/^https?:\/\//i.test(text)) {
      return { preview: text, full: text, kind: 'url', href: text };
    }
    return { preview: text, full: text, kind: 'text' };
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    const text = String(value);
    return { preview: text, full: text, kind: 'text' };
  }

  if (value && typeof value === 'object') {
    const ptr =
      typeof (value as { __ptr?: unknown }).__ptr === 'string'
        ? String((value as { __ptr: string }).__ptr).trim()
        : '';

    if (ptr) {
      return { preview: `→ ${ptr}`, full: ptr, kind: 'pointer' };
    }

    const json = stableJson(value);
    return { preview: maskValue(json, 52), full: json, kind: 'text' };
  }

  return { preview: '(empty)', full: '(empty)', kind: 'empty' };
}

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      return true;
    } catch {
      return false;
    }
  }
}

function renderResolvedValueContent(resolved: ResolvedValuePresentation) {
  const valueNode = (
    <Typography
      variant="body2"
      sx={{
        color: resolved.kind === 'empty' ? 'text.secondary' : 'text.primary',
        fontWeight: resolved.kind === 'empty' ? 500 : 700,
        fontFamily: resolved.kind === 'timestamp' ? 'inherit' : 'monospace',
        fontStyle: resolved.kind === 'empty' ? 'italic' : 'normal',
        wordBreak: 'break-word',
        lineHeight: 1.25,
      }}
    >
      {resolved.preview}
    </Typography>
  );

  if (resolved.href) {
    return (
      <Box
        component="a"
        href={resolved.href}
        target={resolved.kind === 'url' ? '_blank' : undefined}
        rel={resolved.kind === 'url' ? 'noreferrer' : undefined}
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.6,
          color: 'primary.main',
          textDecoration: 'none',
          minWidth: 0,
          '&:hover': { textDecoration: 'underline' },
        }}
      >
        <Icon
          name={
            resolved.kind === 'email'
              ? 'alternate_email'
              : resolved.kind === 'phone'
                ? 'call'
                : 'link'
          }
          fontSize={16 as any}
        />
        {valueNode}
      </Box>
    );
  }

  if (resolved.kind === 'pointer') {
    return (
      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.6, minWidth: 0, color: 'primary.main' }}>
        <Icon name="share" fontSize={16 as any} />
        {valueNode}
      </Box>
    );
  }

  return valueNode;
}

export function BlocksTable({
  endpoint,
  blockPath,
  namespaceRootUrl = '',
  namespaceLabel = '',
  rowsLimit = 120,
  'data-gui-node-id': dataGuiNodeId = 'BlocksTable',
  'data-gui-component': dataGuiComponent = 'BlocksTable',
}: BlocksTableProps) {
  const theme = useGuiTheme();
  const [data, setData] = React.useState<BlocksTableEntry[]>([]);
  const [copiedHash, setCopiedHash] = React.useState<string | null>(null);
  const [focusedHash, setFocusedHash] = React.useState<string | null>(null);
  const [expandedHashes, setExpandedHashes] = React.useState<Record<string, boolean>>({});
  const [expandedNamespaces, setExpandedNamespaces] = React.useState<Record<string, boolean>>({});
  const parentNodeId = String(dataGuiNodeId || 'BlocksTable');
  const parentNodeType = String(dataGuiComponent || 'BlocksTable');
  const parentNodePath = React.useMemo(() => {
    const normalized = parentNodeId.replace(/\/+/g, '.').replace(/^\.+|\.+$/g, '');
    return normalized || 'BlocksTable';
  }, [parentNodeId]);
  const nodeId = React.useCallback((segment: string) => `${parentNodeId}/${segment}`, [parentNodeId]);
  const nodePath = React.useCallback(
    (segment: string) => `${parentNodePath}.${segment.replace(/\//g, '.')}`,
    [parentNodePath],
  );
  const nodeAttrs = React.useCallback(
    (segment: string, component: string) => ({
      'data-gui-node-id': nodeId(segment),
      'data-gui-component': component,
    }),
    [nodeId],
  );
  const getRowSegment = React.useCallback((row: BlocksTableEntry, index: number) => {
    const hashPart = normalizeNodeSegment(String(row.hash || '').slice(0, 12), `hash-${index + 1}`);
    return `rows/block-${normalizeNodeSegment(String(row.id || index + 1), String(index + 1))}-${hashPart}`;
  }, []);
  const safeRenderLimit = React.useMemo(
    () => Math.max(1, Math.min(500, Number(rowsLimit || 120))),
    [rowsLimit],
  );

  React.useEffect(() => {
    async function loadBlocks() {
      const base = String(endpoint || '').replace(/\/+$/, '');
      if (!base) {
        setData([]);
        return;
      }

      const tryFetchJson = async (url: string) => {
        // `cache: 'no-store'` alone already tells the fetch itself to skip
        // the HTTP cache — the Cache-Control/Pragma REQUEST headers this
        // used to also send were redundant with that, and being
        // non-"simple" headers, they force a CORS preflight (OPTIONS) on
        // every request. Confirmed live: netget's own mesh proxy
        // (/apps/netget/*, what this hits when embedded in CleakerLanding
        // rather than given a direct origin) doesn't allow them in
        // Access-Control-Allow-Headers, so the preflight itself failed —
        // UsersTable.tsx's sibling fetch never hit this because it sends
        // no extra headers at all (a plain GET is CORS-"simple", no
        // preflight needed either way).
        const res = await fetch(url, {
          method: 'GET',
          cache: 'no-store',
          headers: {
            'Accept': 'application/json',
          },
        });
        const text = await res.text();
        const contentType = res.headers.get('content-type') || 'unknown';
        const preview = text.trim().slice(0, 180).replace(/\s+/g, ' ');
        if (!res.ok) {
          throw new Error(`HTTP ${res.status} from ${url} (${contentType}): ${preview}`);
        }
        try {
          return JSON.parse(text);
        } catch {
          throw new Error(`Not JSON from ${url} (${contentType}): ${preview}`);
        }
      };

      try {
        const fetchLimit = Math.max(120, Math.min(500, safeRenderLimit * 4));
        let json: any;
        if (blockPath) {
          // NRP path given — fetch that specific path (e.g. /@fatima/name)
          json = await tryFetchJson(`${base}${blockPath}`);
        } else {
          try {
            json = await tryFetchJson(`${base}/blockchain?limit=${encodeURIComponent(String(fetchLimit))}`);
          } catch {
            json = await tryFetchJson(`${base}/blocks?limit=${encodeURIComponent(String(fetchLimit))}`);
          }
        }

        if (Array.isArray(json)) setData(json as any);
        else if (Array.isArray(json?.memories)) setData(json.memories);
        else if (Array.isArray(json?.data?.memories)) setData(json.data.memories);
        else if (Array.isArray(json?.blocks)) setData(json.blocks);
        else if (Array.isArray(json?.data)) setData(json.data);
        else setData([]);
      } catch (e) {
        console.error('[BlocksTable] Failed to load blockchain entries:', e);
        setData([]);
      }
    }
    loadBlocks();
  }, [endpoint, blockPath, safeRenderLimit]);

  const namespaceMeta = React.useMemo(() => {
    const meta = new Map<string, { imageUrl: string | null }>();

    for (const row of data) {
      const key = String(row.namespace || '').trim().toLowerCase();
      if (!key) continue;

      const imageCandidate =
        row.path === 'pic' ||
        row.path === 'img' ||
        row.path === 'avatar'
          ? sanitizeUrlValue(row.data)
          : null;

      if (!meta.has(key)) {
        meta.set(key, { imageUrl: imageCandidate });
        continue;
      }

      if (imageCandidate) {
        meta.set(key, { imageUrl: imageCandidate });
      }
    }

    return meta;
  }, [data]);

  const rowByHash = React.useMemo(() => {
    return new Map(data.map((row) => [String(row.hash || '').trim(), row]));
  }, [data]);

  const displayRows = React.useMemo(() => {
    return data
      .slice()
      .sort((a, b) => {
        const priorityDelta = rowPriority(a) - rowPriority(b);
        if (priorityDelta !== 0) return priorityDelta;
        const timestampDelta = Number(b.timestamp || 0) - Number(a.timestamp || 0);
        if (timestampDelta !== 0) return timestampDelta;
        return Number(b.id || 0) - Number(a.id || 0);
      })
      .slice(0, safeRenderLimit);
  }, [data, safeRenderLimit]);

  const getRowIdentity = React.useCallback((row: BlocksTableEntry) => {
    const pointerMatch = String(row.path || '').trim().match(/^users\.([a-z0-9_-]+)$/i);
    const rawNamespace = String(row.namespace || '').trim().toLowerCase();

    if (pointerMatch) {
      const username = String(pointerMatch[1] || '').trim().toLowerCase();
      const root = rawNamespace;
      const handle = username && root ? `${username}.${root}` : root;
      return {
        subject: username || root || '—',
        root,
        handle,
        resolvedPath: `${rawNamespace}/${row.path}`,
      };
    }

    const split = splitNamespace(rawNamespace);
    return {
      subject: split.subject,
      root: split.root,
      handle: rawNamespace || split.root,
      resolvedPath: `${rawNamespace}/${row.path}`,
    };
  }, []);

  const getRowNamespaceUrl = React.useCallback((row: BlocksTableEntry) => {
    const identity = getRowIdentity(row);
    const base = String(namespaceRootUrl || endpoint || '').trim();
    if (!base) return '';

    try {
      const url = buildCleakerNamespaceUrl(base, identity.subject === identity.root ? undefined : identity.subject);
      if (!url) return url;

      // Append the row's own branch so the QR reflects exactly what's in
      // view, not just the root identity — resolveChainNamespace() in
      // monad's own http/namespace.ts already resolves a trailing path
      // after /@handle/, nothing new needed server-side. A pointer row
      // (row.path === "users.<handle>" exactly, same check getRowIdentity
      // uses above) already names the identity itself — appending it again
      // would read as ".../@handle/users.handle", redundant.
      const path = String(row.path || '').trim();
      const isPointerRow = /^users\.[a-z0-9_-]+$/i.test(path);
      if (!path || isPointerRow) return url;
      return `${url.replace(/\/+$/, '')}/${path}`;
    } catch {
      return '';
    }
  }, [endpoint, getRowIdentity, namespaceRootUrl]);

  const getExpressionLabel = React.useCallback((row: BlocksTableEntry) => {
    const path = String(row.path || '').trim() || '—';
    const operator = String(row.operator || '').trim();
    if (!operator || operator === '=') return path;
    return `${path} ${operator}`;
  }, []);

  const revealHash = React.useCallback((hash: string) => {
    const normalized = String(hash || '').trim();
    if (!normalized) return;
    setFocusedHash(normalized);
    const node = document.querySelector(`[data-block-hash="${CSS.escape(normalized)}"]`);
    if (node instanceof HTMLElement) {
      node.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }, []);

  const toggleHashExpanded = React.useCallback((hash: string) => {
    const normalized = String(hash || '').trim();
    if (!normalized) return;
    setExpandedHashes((current) => ({
      ...current,
      [normalized]: !current[normalized],
    }));
  }, []);

  const toggleNamespaceExpanded = React.useCallback((namespace: string) => {
    const normalized = String(namespace || '').trim().toLowerCase();
    if (!normalized) return;
    setExpandedNamespaces((current) => ({
      ...current,
      [normalized]: !current[normalized],
    }));
  }, []);

  React.useEffect(() => {
    const registeredIds: string[] = [];

    const registerNode = (
      id: string,
      path: string,
      type: string,
      resolvedProps: Record<string, unknown>,
    ) => {
      registeredIds.push(id);
      selectionStore.actions.registerNode({
        id,
        path,
        type,
        spec: {
          type,
          props: resolvedProps,
        },
        resolvedProps,
      });
    };

    registerNode(nodeId('content'), nodePath('content'), `${parentNodeType}.Content`, {
      endpoint,
      namespaceRootUrl,
      namespaceLabel,
      rowsLimit,
      safeRenderLimit,
      totalRows: data.length,
      visibleRows: displayRows.length,
      copiedHash,
      focusedHash,
    });
    registerNode(nodeId('summary'), nodePath('summary'), `${parentNodeType}.Summary`, {
      visible: Boolean(namespaceLabel),
      namespaceLabel,
      visibleRows: displayRows.length,
      safeRenderLimit,
    });
    registerNode(nodeId('table'), nodePath('table'), `${parentNodeType}.Table`, {
      totalRows: data.length,
      visibleRows: displayRows.length,
    });
    registerNode(nodeId('head'), nodePath('head'), `${parentNodeType}.Head`, {
      columns: ['identity', 'expression', 'hash'],
    });
    registerNode(nodeId('empty-state'), nodePath('empty-state'), `${parentNodeType}.EmptyState`, {
      visible: displayRows.length === 0,
    });

    displayRows.forEach((row, index) => {
      const rowSegment = getRowSegment(row, index);
      const identity = getRowIdentity(row);
      const namespaceUrl = getRowNamespaceUrl(row);
      const expression = getExpressionLabel(row);
      const resolved = formatResolvedValue(row);
      const eventTime = formatTimestampParts(row.timestamp);
      const namespaceKey = String(row.namespace || '').trim().toLowerCase();
      const prevRow = rowByHash.get(String(row.prevHash || '').trim()) || null;

      registerNode(nodeId(rowSegment), nodePath(rowSegment), `${parentNodeType}.Row`, {
        id: row.id,
        hash: row.hash,
        prevHash: row.prevHash,
        namespace: row.namespace,
        path: row.path,
        operator: row.operator,
        timestamp: row.timestamp,
      });
      registerNode(nodeId(`${rowSegment}/identity`), nodePath(`${rowSegment}/identity`), `${parentNodeType}.RowIdentity`, {
        subject: identity.subject,
        root: identity.root,
        handle: identity.handle,
        namespaceUrl,
        namespaceExpanded: Boolean(expandedNamespaces[namespaceKey]),
      });
      registerNode(nodeId(`${rowSegment}/identity/qr`), nodePath(`${rowSegment}/identity/qr`), `${parentNodeType}.RowIdentityQr`, {
        namespaceUrl,
        subject: identity.subject,
        enabled: Boolean(namespaceUrl),
      });
      registerNode(
        nodeId(`${rowSegment}/identity/label`),
        nodePath(`${rowSegment}/identity/label`),
        `${parentNodeType}.RowIdentityLabel`,
        {
          label: identity.subject === identity.root ? identity.subject : `@${identity.subject}`,
          namespace: row.namespace,
          expanded: Boolean(expandedNamespaces[namespaceKey]),
        },
      );
      registerNode(
        nodeId(`${rowSegment}/expression`),
        nodePath(`${rowSegment}/expression`),
        `${parentNodeType}.RowExpression`,
        {
          expression,
          resolvedPreview: resolved.preview,
          resolvedKind: resolved.kind,
          resolvedHref: resolved.href || null,
          timestamp: eventTime.full,
        },
      );
      registerNode(nodeId(`${rowSegment}/hash`), nodePath(`${rowSegment}/hash`), `${parentNodeType}.RowHash`, {
        hash: row.hash,
        expanded: Boolean(expandedHashes[String(row.hash || '').trim()]),
        copied: copiedHash === row.hash,
        focused: focusedHash === row.hash,
      });
      registerNode(
        nodeId(`${rowSegment}/hash/value`),
        nodePath(`${rowSegment}/hash/value`),
        `${parentNodeType}.RowHashValue`,
        {
          hash: row.hash,
          expanded: Boolean(expandedHashes[String(row.hash || '').trim()]),
          label: expandedHashes[String(row.hash || '').trim()] ? row.hash : maskHash(row.hash),
        },
      );
      if (row.prevHash) {
        registerNode(
          nodeId(`${rowSegment}/hash/prev`),
          nodePath(`${rowSegment}/hash/prev`),
          `${parentNodeType}.RowPrevHash`,
          {
            hash: row.prevHash,
            resolved: Boolean(prevRow),
            label: expandedHashes[String(row.prevHash || '').trim()] ? row.prevHash : maskHash(row.prevHash),
          },
        );
      }
      registerNode(
        nodeId(`${rowSegment}/hash/copy`),
        nodePath(`${rowSegment}/hash/copy`),
        `${parentNodeType}.RowHashCopy`,
        {
          hash: row.hash,
          copied: copiedHash === row.hash,
        },
      );
    });

    return () => {
      registeredIds.forEach((id) => selectionStore.actions.unregisterNode(id));
    };
  }, [
    copiedHash,
    data.length,
    displayRows,
    endpoint,
    expandedHashes,
    expandedNamespaces,
    focusedHash,
    getExpressionLabel,
    getRowIdentity,
    getRowNamespaceUrl,
    getRowSegment,
    namespaceLabel,
    namespaceRootUrl,
    nodeId,
    nodePath,
    parentNodeType,
    rowByHash,
    rowsLimit,
    safeRenderLimit,
  ]);

  return (
    <Box
      {...nodeAttrs('content', `${parentNodeType}.Content`)}
      sx={{
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        background: 'background.nav',
        overflowX: 'auto',
        overflowY: 'hidden',
      }}
    >
      {namespaceLabel ? (
        <Box
          {...nodeAttrs('summary', `${parentNodeType}.Summary`)}
          sx={{
            px: 1.5,
            py: 1,
            borderBottom: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
          }}
        >
          <Typography variant="caption" sx={{ color: 'text.secondary', letterSpacing: 0.2 }}>
            Namespace:{' '}
            <Box component="span" sx={{ color: 'text.primary', fontFamily: 'monospace' }}>
              {namespaceLabel}
            </Box>
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', letterSpacing: 0.2, ml: 1.5 }}>
            Visible: {displayRows.length}/{safeRenderLimit}
          </Typography>
        </Box>
      ) : null}
      <Table
        {...nodeAttrs('table', `${parentNodeType}.Table`)}
        size="small"
        sx={{ minWidth: 720 }}
      >
        <TableHead {...nodeAttrs('head', `${parentNodeType}.Head`)}>
          <TableRow sx={{ background: 'background.paper' }}>
            <TableCell><Typography fontWeight={700}>.me</Typography></TableCell>
            <TableCell><Typography fontWeight={700}>Expression</Typography></TableCell>
            <TableCell><Typography fontWeight={700}>Hash</Typography></TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {displayRows.length === 0 && (
            <TableRow {...nodeAttrs('empty-state', `${parentNodeType}.EmptyState`)}>
              <TableCell colSpan={3}>
                <Typography sx={{ opacity: 0.6, py: 3, textAlign: 'center' }}>No blockchain entries yet.</Typography>
              </TableCell>
            </TableRow>
          )}

          {displayRows.map((r, index) => (
            <TableRow
              key={`${r.hash}-${r.id}`}
              {...nodeAttrs(getRowSegment(r, index), `${parentNodeType}.Row`)}
              data-block-hash={r.hash}
              hover
              sx={{
                bgcolor: focusedHash === r.hash ? 'action.selected' : 'transparent',
                '&:last-child td': { borderBottom: 'none' },
                '& td': {
                  py: 1.1,
                  verticalAlign: 'top',
                  borderColor: 'divider',
                },
              }}
            >
              <TableCell
                {...nodeAttrs(`${getRowSegment(r, index)}/identity`, `${parentNodeType}.RowIdentity`)}
                sx={{ minWidth: 260 }}
              >
                {(() => {
                  const identity = getRowIdentity(r);
                  const namespaceUrl = getRowNamespaceUrl(r);
                  const profileImg = namespaceMeta.get(String(r.namespace || '').trim().toLowerCase())?.imageUrl || null;
                  const fallback = String(identity.subject || '?').slice(0, 1).toUpperCase();
                  const shortIdentityLabel = String(identity.subject || identity.root || '—').trim();
                  const namespaceKey = String(r.namespace || '').trim().toLowerCase();
                  const namespaceExpanded = !!expandedNamespaces[namespaceKey];

                  return (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.85 }}>
                      {namespaceUrl ? (
                        <Tooltip
                          placement="right"
                          arrow
                          enterDelay={120}
                          leaveDelay={80}
                          slotProps={{
                            tooltip: {
                              sx: {
                                bgcolor: 'transparent',
                                color: 'text.primary',
                                border: 'none',
                                boxShadow: 'none',
                                p: 0,
                                '& .MuiTooltip-arrow': {
                                  color: 'background.default',
                                },
                              },
                            },
                          }}
                          title={
                            <Box
                              sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 1,
                                alignItems: 'center',
                                p: 1.25,
                                borderRadius: 2,
                                bgcolor: 'background.default',
                                border: '1px solid',
                                borderColor: 'divider',
                                boxShadow: 8,
                              }}
                            >
                              <Box
                                sx={{
                                  color: 'primary.main',
                                  p: 1,
                                  borderRadius: 2,
                                  bgcolor: 'background.paper',
                                  border: '1px solid',
                                  borderColor: 'divider',
                                  boxShadow: 4,
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  gap: 0.75,
                                  minWidth: 180,
                                }}
                              >
                                <Box
                                  sx={{
                                    width: 96,
                                    height: 96,
                                    borderRadius: 2,
                                    overflow: 'hidden',
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    bgcolor: 'background.default',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}
                                >
                                  <QR
                                    value={namespaceUrl}
                                    size={96}
                                    bg={theme.palette.background.paper}
                                    fg={theme.palette.primary.main}
                                    ecc="H"
                                    embedMode="positive-overlay"
                                    embedScale={0.32}
                                  />
                                </Box>
                                <Typography
                                  variant="caption"
                                  sx={{
                                    color: 'text.primary',
                                    fontWeight: 700,
                                    letterSpacing: 0.2,
                                  }}
                                >
                                  {identity.subject === identity.root ? identity.subject : `@${identity.subject}`}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  sx={{
                                    maxWidth: 180,
                                    color: 'text.secondary',
                                    fontFamily: 'monospace',
                                    fontSize: '0.62rem',
                                    lineHeight: 1.3,
                                    textAlign: 'center',
                                    wordBreak: 'break-all',
                                  }}
                                >
                                  {namespaceUrl}
                                </Typography>
                              </Box>
                            </Box>
                          }
                        >
                          <Box
                            {...nodeAttrs(`${getRowSegment(r, index)}/identity/qr`, `${parentNodeType}.RowIdentityQr`)}
                            sx={{
                              width: 36,
                              height: 36,
                              borderRadius: 2,
                              overflow: 'hidden',
                              border: '1px solid',
                              borderColor: 'divider',
                              bgcolor: 'background.paper',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            <CleakerQR
                              value={namespaceUrl}
                              username={identity.subject}
                              endpoint={namespaceRootUrl || endpoint}
                              variant="icon"
                              size={36}
                              bg={theme.palette.background.paper}
                              fg={theme.palette.primary.main}
                            />
                          </Box>
                        </Tooltip>
                      ) : (
                        <Box
                          {...nodeAttrs(`${getRowSegment(r, index)}/identity/qr`, `${parentNodeType}.RowIdentityQr`)}
                          sx={{
                            width: 36,
                            height: 36,
                            borderRadius: 2,
                            overflow: 'hidden',
                            border: '1px solid',
                            borderColor: 'divider',
                            bgcolor: 'background.paper',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        />
                      )}
                      <Avatar
                        src={profileImg || undefined}
                        alt={String(identity.subject || 'user')}
                        sx={{
                          width: 28,
                          height: 28,
                          fontSize: 12,
                          fontWeight: 700,
                          bgcolor: 'background.paper',
                          color: 'text.primary',
                          border: '1px solid',
                          borderColor: 'divider',
                          flexShrink: 0,
                        }}
                      >
                        {fallback}
                      </Avatar>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.15, minWidth: 0 }}>
                        <Typography
                          {...nodeAttrs(`${getRowSegment(r, index)}/identity/label`, `${parentNodeType}.RowIdentityLabel`)}
                          variant="body2"
                          component="button"
                          type="button"
                          onClick={() => toggleNamespaceExpanded(namespaceKey)}
                          sx={{
                            color: 'text.primary',
                            fontWeight: 700,
                            fontFamily: 'monospace',
                            textAlign: 'left',
                            border: 'none',
                            bgcolor: 'transparent',
                            p: 0,
                            m: 0,
                            minWidth: 0,
                            maxWidth: namespaceExpanded ? 'none' : 240,
                            overflow: namespaceExpanded ? 'visible' : 'hidden',
                            textOverflow: namespaceExpanded ? 'clip' : 'ellipsis',
                            whiteSpace: namespaceExpanded ? 'normal' : 'nowrap',
                            cursor: 'pointer',
                          }}
                          title={namespaceExpanded ? 'Collapse namespace' : String(identity.handle || shortIdentityLabel)}
                        >
                          {identity.subject === identity.root ? shortIdentityLabel : `@${shortIdentityLabel}`}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            color: 'text.secondary',
                            fontFamily: 'monospace',
                          }}
                        >
                          #{r.id}
                        </Typography>
                      </Box>
                    </Box>
                  );
                })()}
              </TableCell>
              <TableCell
                {...nodeAttrs(`${getRowSegment(r, index)}/expression`, `${parentNodeType}.RowExpression`)}
                sx={{ minWidth: 260 }}
              >
                {(() => {
                  const expression = getExpressionLabel(r);
                  const resolved = formatResolvedValue(r);
                  const eventTime = formatTimestampParts(r.timestamp);
                  const showEventTimestamp =
                    !(typeof r.data === 'number' && isTimeLikePath(String(r.path || '')) && eventTime.full === resolved.full);
                  return (
                    <Tooltip
                      placement="top"
                      arrow
                      title={
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, maxWidth: 340 }}>
                          <Typography
                            variant="body2"
                            sx={{
                              color: 'text.primary',
                              fontWeight: 700,
                              fontFamily: resolved.kind === 'timestamp' ? 'inherit' : 'monospace',
                              wordBreak: 'break-word',
                            }}
                          >
                            {resolved.full}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'monospace' }}>
                            {expression}
                          </Typography>
                          {showEventTimestamp ? (
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              {eventTime.full}
                            </Typography>
                          ) : null}
                        </Box>
                      }
                    >
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.3 }}>
                        {renderResolvedValueContent(resolved)}
                        <Typography
                          variant="caption"
                          sx={{
                            color: 'text.secondary',
                            fontFamily: 'monospace',
                            wordBreak: 'break-word',
                          }}
                        >
                          {expression}
                        </Typography>
                        {showEventTimestamp ? (
                          <Typography
                            variant="caption"
                            sx={{
                              color: 'text.secondary',
                              fontFamily: 'monospace',
                              wordBreak: 'break-word',
                            }}
                          >
                            {eventTime.full}
                          </Typography>
                        ) : null}
                      </Box>
                    </Tooltip>
                  );
                })()}
              </TableCell>
              <TableCell
                {...nodeAttrs(`${getRowSegment(r, index)}/hash`, `${parentNodeType}.RowHash`)}
                sx={{ width: 164, minWidth: 164, maxWidth: 164 }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: 1,
                    width: '100%',
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 0.15,
                      minWidth: 0,
                      flex: '1 1 auto',
                    }}
                  >
                    <Typography
                      {...nodeAttrs(`${getRowSegment(r, index)}/hash/value`, `${parentNodeType}.RowHashValue`)}
                      variant="body2"
                      title={r.hash}
                      component="button"
                      type="button"
                      onClick={() => toggleHashExpanded(r.hash)}
                      sx={{
                        fontFamily: 'monospace',
                        color: 'text.primary',
                        whiteSpace: expandedHashes[String(r.hash || '').trim()] ? 'normal' : 'nowrap',
                        overflowWrap: expandedHashes[String(r.hash || '').trim()] ? 'anywhere' : 'normal',
                        border: 'none',
                        bgcolor: 'transparent',
                        p: 0,
                        m: 0,
                        cursor: 'pointer',
                        textAlign: 'left',
                        width: '100%',
                        minWidth: 0,
                      }}
                    >
                      {expandedHashes[String(r.hash || '').trim()] ? r.hash : maskHash(r.hash)}
                    </Typography>
                    {r.prevHash ? (
                      <Tooltip
                        placement="top"
                        arrow
                        title={
                          rowByHash.get(String(r.prevHash || '').trim()) ? (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.35 }}>
                              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                Previous
                              </Typography>
                              <Typography variant="body2" sx={{ color: 'text.primary', fontFamily: 'monospace' }}>
                                {getExpressionLabel(rowByHash.get(String(r.prevHash || '').trim())!)}
                              </Typography>
                              <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'monospace' }}>
                                {maskHash(r.prevHash)}
                              </Typography>
                            </Box>
                          ) : r.prevHash
                        }
                      >
                        <Typography
                          {...nodeAttrs(`${getRowSegment(r, index)}/hash/prev`, `${parentNodeType}.RowPrevHash`)}
                          variant="caption"
                          title={r.prevHash}
                          component="button"
                          type="button"
                          onClick={() => {
                            toggleHashExpanded(r.prevHash);
                            revealHash(r.prevHash);
                          }}
                          sx={{
                            fontFamily: 'monospace',
                            color: 'primary.main',
                            whiteSpace: 'normal',
                            overflowWrap: 'anywhere',
                            cursor: 'pointer',
                            textDecoration: 'underline',
                            textUnderlineOffset: '0.15em',
                            border: 'none',
                            bgcolor: 'transparent',
                            p: 0,
                            m: 0,
                            textAlign: 'left',
                          }}
                        >
                          prev {expandedHashes[String(r.prevHash || '').trim()] ? r.prevHash : maskHash(r.prevHash)}
                        </Typography>
                      </Tooltip>
                    ) : null}
                  </Box>
                  <Tooltip title={copiedHash === r.hash ? 'Copied!' : 'Copy full hash'} placement="top" arrow>
                    <IconButton
                      {...nodeAttrs(`${getRowSegment(r, index)}/hash/copy`, `${parentNodeType}.RowHashCopy`)}
                      size="small"
                      onClick={async () => {
                        const ok = await copyToClipboard(r.hash);
                        if (ok) {
                          setCopiedHash(r.hash);
                          window.setTimeout(() => {
                            setCopiedHash((current) => (current === r.hash ? null : current));
                          }, 900);
                        }
                      }}
                      aria-label="Copy hash"
                      sx={{
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 2,
                        bgcolor: 'background.paper',
                        width: 28,
                        height: 28,
                        flexShrink: 0,
                        alignSelf: 'flex-start',
                        '& .material-symbols-rounded': { fontSize: 16 },
                      }}
                    >
                      <Icon name="content_copy" fontSize={16 as any} />
                    </IconButton>
                  </Tooltip>
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}

export default BlocksTable;
