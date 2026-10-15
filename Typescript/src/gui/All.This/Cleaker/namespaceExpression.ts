import {
  normalizeBlockchain,
  toBlockchainBaseUrl,
} from "./Namespace/scripts/connection";

export const DEFAULT_CLEAKER_NAMESPACE_ORIGIN = "https://cleaker.me";
export const DEFAULT_CLEAKER_NAMESPACE_EXPRESSION = "cleaker.me";

type NamespaceSelectorAtom = {
  key: string;
  value: string;
  raw: string;
};

type NamespaceSelectorClause = NamespaceSelectorAtom[];
type NamespaceSelectorSet = NamespaceSelectorClause[];

export type CleakerNamespaceExpression = {
  raw: string;
  expression: string;
  base: string;
  fqdn: string;
  prefix: string | null;
  constant: string;
  labels: string[];
  contextRaw: string | null;
  context: NamespaceSelectorSet;
  operation: string | null;
  path: string;
  transport: {
    protocol: "http" | "https";
    host: string;
    port: number | null;
    origin: string;
  };
  displayHost: string;
};

function formatTransportSurfaceHost(host: string, port: number | null): string {
  const normalizedHost = String(host || "").trim().toLowerCase();
  if (!normalizedHost) return "";
  return port == null ? normalizedHost : `${normalizedHost}:${port}`;
}

const ME_SCHEME = "me://";
const LEGACY_NRP_SCHEME = "nrp://";
const CONTEXT_OPEN = "[";
const CONTEXT_CLOSE = "]";
const CONTEXT_BRANCH_SEPARATOR = "|";
const CONTEXT_AND_SEPARATOR = ";";
const CONTEXT_VALUE_SEPARATOR = ",";

function normalizeInput(input: string): string {
  const raw = String(input ?? "").trim();
  return raw || DEFAULT_CLEAKER_NAMESPACE_EXPRESSION;
}

function stripScheme(raw: string): string {
  if (raw.startsWith(ME_SCHEME)) return raw.slice(ME_SCHEME.length);
  if (raw.startsWith(LEGACY_NRP_SCHEME)) return raw.slice(LEGACY_NRP_SCHEME.length);
  if (/^https?:\/\//i.test(raw)) return raw.replace(/^https?:\/\//i, "");
  return raw;
}

function ensureBalancedContext(input: string): void {
  let depth = 0;
  for (const char of input) {
    if (char === CONTEXT_OPEN) depth += 1;
    if (char === CONTEXT_CLOSE) depth -= 1;
    if (depth < 0) throw new Error("Namespace has an unexpected closing context bracket");
  }
  if (depth !== 0) throw new Error("Namespace has an unclosed context bracket");
}

function findTokenOutsideContext(input: string, token: string, start = 0): number {
  let depth = 0;
  for (let index = start; index < input.length; index += 1) {
    const char = input[index];
    if (char === CONTEXT_OPEN) {
      depth += 1;
      continue;
    }
    if (char === CONTEXT_CLOSE) {
      depth = Math.max(0, depth - 1);
      continue;
    }
    if (depth === 0 && char === token) return index;
  }
  return -1;
}

function expandClauseWithAtom(
  clauses: NamespaceSelectorClause[],
  atomKey: string,
  values: string[],
): NamespaceSelectorClause[] {
  const next: NamespaceSelectorClause[] = [];
  for (const clause of clauses) {
    for (const value of values) {
      next.push([
        ...clause,
        {
          key: atomKey,
          value,
          raw: `${atomKey}:${value}`,
        },
      ]);
    }
  }
  return next;
}

function parseContext(raw: string | null): NamespaceSelectorSet {
  const value = String(raw ?? "").trim();
  if (!value) return [];

  const groups = value
    .split(CONTEXT_BRANCH_SEPARATOR)
    .map((group) => group.trim())
    .filter(Boolean);

  const clauses: NamespaceSelectorSet = [];
  for (const group of groups) {
    const parts = group
      .split(CONTEXT_AND_SEPARATOR)
      .map((part) => part.trim())
      .filter(Boolean);

    let expanded: NamespaceSelectorClause[] = [[]];
    for (const part of parts) {
      const colon = part.indexOf(":");
      if (colon < 0) throw new Error("Namespace selectors must match key:value");

      const key = part.slice(0, colon).trim().toLowerCase();
      const rest = part.slice(colon + 1).trim();
      if (!key || !rest) throw new Error("Namespace selectors must match key:value");

      const values = rest
        .split(CONTEXT_VALUE_SEPARATOR)
        .map((item) => item.trim())
        .filter(Boolean);

      if (values.length === 0) throw new Error("Namespace selectors must include at least one value");
      expanded = expandClauseWithAtom(expanded, key, values);
    }

    clauses.push(...expanded);
  }

  return clauses;
}

function extractNamespaceParts(namespaceToken: string): {
  base: string;
  contextRaw: string | null;
  context: NamespaceSelectorSet;
} {
  const trimmed = String(namespaceToken || "").trim();
  if (!trimmed) throw new Error("Namespace cannot be empty");

  const openIndex = trimmed.indexOf(CONTEXT_OPEN);
  if (openIndex < 0) {
    return {
      base: trimmed,
      contextRaw: null,
      context: [],
    };
  }

  const closeIndex = trimmed.lastIndexOf(CONTEXT_CLOSE);
  if (closeIndex !== trimmed.length - 1 || closeIndex < openIndex) {
    throw new Error("Namespace context must appear at the end of the namespace");
  }

  const base = trimmed.slice(0, openIndex).trim();
  const contextRaw = trimmed.slice(openIndex + 1, closeIndex).trim();
  if (!base) throw new Error("Namespace cannot be empty");

  return {
    base,
    contextRaw,
    context: parseContext(contextRaw),
  };
}

function normalizeBaseToken(raw: string): { host: string; labels: string[]; port: number | null } {
  const candidate = String(raw || "").trim().replace(/^https?:\/\//i, "");
  if (!candidate) throw new Error("Namespace base cannot be empty");

  const slash = candidate.indexOf("/");
  const hostToken = (slash >= 0 ? candidate.slice(0, slash) : candidate).trim().toLowerCase();
  const portMatch = hostToken.match(/:(\d+)$/);
  const port = portMatch ? Number(portMatch[1]) : null;
  const host = portMatch ? hostToken.slice(0, -portMatch[0].length) : hostToken;
  const labels = host.split(".").map((label) => label.trim()).filter(Boolean);

  if (!host || labels.length === 0) throw new Error("Namespace base cannot be empty");

  return { host, labels, port };
}

function deriveConstantAndPrefix(base: string): {
  fqdn: string;
  prefix: string | null;
  constant: string;
  labels: string[];
} {
  const normalized = normalizeBaseToken(base);
  const portSuffix = normalized.port == null ? "" : `:${normalized.port}`;

  // An IPv4 address is one host, not four labels: its first octet is not a handle and the rest is not a root.
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(normalized.host)) {
    return {
      fqdn: `${normalized.host}${portSuffix}`,
      prefix: null,
      constant: `${normalized.host}${portSuffix}`,
      labels: normalized.labels,
    };
  }

  if (normalized.labels.length === 2 && normalized.labels[1] === "localhost") {
    return {
      fqdn: `${normalized.host}${portSuffix}`,
      prefix: normalized.labels[0] || null,
      constant: `localhost${portSuffix}`,
      labels: normalized.labels,
    };
  }

  if (normalized.labels.length <= 2) {
    return {
      fqdn: `${normalized.host}${portSuffix}`,
      prefix: null,
      constant: `${normalized.host}${portSuffix}`,
      labels: normalized.labels,
    };
  }

  return {
    fqdn: `${normalized.host}${portSuffix}`,
    prefix: normalized.labels[0] || null,
    constant: `${normalized.labels.slice(1).join(".")}${portSuffix}`,
    labels: normalized.labels,
  };
}

function isLocalishHost(host: string): boolean {
  const normalized = String(host || "").trim().toLowerCase();
  // local.host (canonical) / local.cleaker (legacy alias): a machine's own
  // local .me kernel surface, addressed by name rather than by
  // localhost/127.x — same "only one hostname actually resolves,
  // subdomains don't" constraint as .local, so it gets the same /@handle
  // path-form treatment (see /etc/hosts: no wildcard syntax exists there,
  // only one static entry per host is possible).
  return /^(localhost|127(?:\.\d{1,3}){3}|0\.0\.0\.0|local\.host|local\.cleaker)$/.test(normalized)
    || /\.local$/.test(normalized);
}

function findSelectorValue(context: NamespaceSelectorSet, selectorType: string): string | null {
  const key = String(selectorType || "").trim().toLowerCase();
  if (!key) return null;

  for (const clause of context) {
    for (const atom of clause) {
      if (atom.key === key) return atom.value;
    }
  }

  return null;
}

function resolveTransport(
  base: string,
  context: NamespaceSelectorSet,
): CleakerNamespaceExpression["transport"] {
  const normalized = normalizeBaseToken(base);
  const overrideHost =
    findSelectorValue(context, "host") ||
    findSelectorValue(context, "hostname") ||
    findSelectorValue(context, "device");
  const overrideProtocol = findSelectorValue(context, "protocol");
  const overridePort = findSelectorValue(context, "port");

  const hostToken = String(overrideHost || normalized.host).trim().toLowerCase();
  const hostHasPort = /:\d+$/.test(hostToken);
  const hostBase = hostHasPort ? hostToken.replace(/:\d+$/, "") : hostToken;
  const portFromHost = hostHasPort ? Number(hostToken.match(/:(\d+)$/)?.[1] || 0) || null : null;
  const port =
    portFromHost ??
    (overridePort && /^\d+$/.test(overridePort) ? Number(overridePort) : normalized.port);
  const protocol =
    (overrideProtocol || (isLocalishHost(hostBase) ? "http" : "https")).toLowerCase() === "http"
      ? "http"
      : "https";
  const host = port == null ? hostBase : `${hostBase}:${port}`;
  const origin = `${protocol}://${host}`;

  return {
    protocol,
    host: hostBase,
    port,
    origin,
  };
}

function splitHeadAndPath(body: string): { head: string; path: string } {
  const slashIndex = findTokenOutsideContext(body, "/");
  if (slashIndex < 0) {
    return {
      head: body.trim(),
      path: "",
    };
  }

  return {
    head: body.slice(0, slashIndex).trim(),
    path: body.slice(slashIndex + 1).trim().replace(/^\/+/, ""),
  };
}

function splitNamespaceAndOperation(head: string): { namespaceToken: string; operation: string | null } {
  const colonIndex = findTokenOutsideContext(head, ":");
  if (colonIndex < 0) {
    return {
      namespaceToken: head.trim(),
      operation: null,
    };
  }

  const suffix = head.slice(colonIndex + 1).trim();
  if (!suffix || /^\d+$/.test(suffix)) {
    return {
      namespaceToken: head.trim(),
      operation: null,
    };
  }

  return {
    namespaceToken: head.slice(0, colonIndex).trim(),
    operation: suffix,
  };
}

function stringifyNamespaceExpression(input: {
  fqdn: string;
  contextRaw: string | null;
  operation: string | null;
  path: string;
}): string {
  const base = String(input.fqdn || "").trim().toLowerCase();
  const contextRaw = String(input.contextRaw || "").trim();
  const operation = String(input.operation || "").trim();
  const path = String(input.path || "").trim().replace(/^\/+/, "");
  const namespaceToken = contextRaw ? `${base}[${contextRaw}]` : base;
  const operationToken = operation ? `:${operation}` : "";
  const pathToken = path ? `/${path}` : "";
  return `${namespaceToken}${operationToken}${pathToken}`;
}

export function parseCleakerNamespaceExpression(input: string): CleakerNamespaceExpression {
  const raw = normalizeInput(input);
  ensureBalancedContext(raw);

  const body = stripScheme(raw).replace(/^\/+/, "").trim();
  if (!body) throw new Error("Namespace cannot be empty");

  const parts = splitHeadAndPath(body);
  const head = splitNamespaceAndOperation(parts.head);
  const namespace = extractNamespaceParts(head.namespaceToken);
  const derived = deriveConstantAndPrefix(namespace.base);
  const transport = resolveTransport(namespace.base, namespace.context);
  const expression = stringifyNamespaceExpression({
    fqdn: derived.fqdn,
    contextRaw: namespace.contextRaw,
    operation: head.operation,
    path: parts.path,
  });

  return {
    raw,
    expression,
    base: namespace.base,
    fqdn: derived.fqdn,
    prefix: derived.prefix,
    constant: derived.constant,
    labels: derived.labels,
    contextRaw: namespace.contextRaw,
    context: namespace.context,
    operation: head.operation,
    path: parts.path,
    transport,
    displayHost: normalizeBlockchain(transport.origin) || toBlockchainBaseUrl(derived.constant) || derived.constant,
  };
}

export function buildCleakerNamespaceUrl(
  input: string | CleakerNamespaceExpression,
  prefix?: string | null,
): string {
  const parsed = typeof input === "string" ? parseCleakerNamespaceExpression(input) : input;
  const surfaceHost = formatTransportSurfaceHost(parsed.transport.host, parsed.transport.port);
  const resolvedPrefix = String(prefix ?? parsed.prefix ?? "").trim().toLowerCase();
  const localishSurface = isLocalishHost(parsed.transport.host);
  const targetHost = resolvedPrefix && !localishSurface ? `${resolvedPrefix}.${surfaceHost}` : surfaceHost;

  if (!targetHost) return "";
  if (resolvedPrefix && localishSurface) {
    return `${parsed.transport.protocol}://${targetHost}/@${resolvedPrefix}`;
  }
  return `${parsed.transport.protocol}://${targetHost}`;
}
