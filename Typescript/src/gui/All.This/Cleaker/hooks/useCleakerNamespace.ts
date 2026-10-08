//this/GUI/npm/src/gui/All.This/Cleaker/hooks/useCleakerNamespace.ts
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { MeLike } from '@/react/types';
import { readMeValue } from '@/runtime/run-me';
import {
  DEFAULT_CLEAKER_NAMESPACE_EXPRESSION,
  parseCleakerNamespaceExpression,
} from '../namespaceExpression';

const CLEAKER_NAMESPACE_STORAGE_KEY = 'cleaker.namespace.v1';
const KERNEL_NAMESPACE_EXPRESSION_PATH = 'runtime.cleaker.namespace.expression';

type NamespaceConfig = ReturnType<typeof parseCleakerNamespaceExpression>;

export type UseCleakerNamespaceOptions = {
  me: MeLike;
  namespace?: string;
  namespaceOrigin?: string;
  normalizedUsername?: string;
  resolverHostName?: string;
  effectiveSemanticRootName?: string;
  resolverDisplayName?: string;
};

export type UseCleakerNamespaceResult = {
  namespaceInput: string;
  setNamespaceInput: React.Dispatch<React.SetStateAction<string>>;
  namespaceConfig: NamespaceConfig;
  namespaceOrigin: string;
  namespaceHost: string;
  namespaceDisplayHost: string;
  namespaceSeedFallback: string;
  resolvedNamespaceRootName: string;
  namespaceSeedHandle: string;
  surfaceNamespace: string;
  subjectSurfaceNamespace: string;
  resolverSurfaceNamespace: string;
  resolverSubjectSurfaceNamespace: string;
  localNamespaceUrl: string;
  networkNamespaceUrl: string;
  activeNamespaceUrl: string;
  compactMonadLabel: string;
  compactRootLabel: string;
  saveNamespaceToStorage: () => void;
};

function readExplicitNamespaceInput(
  propsNamespace?: string,
  propsNamespaceOrigin?: string,
): string {
  return String(propsNamespace || propsNamespaceOrigin || '').trim();
}

function resolveInitialNamespaceInput(
  me: MeLike,
  propsNamespace?: string,
  propsNamespaceOrigin?: string,
): string {
  const explicit = readExplicitNamespaceInput(propsNamespace, propsNamespaceOrigin);
  if (explicit) return explicit;

  const kernelValue = String(
    safeReadKernelValue(me, KERNEL_NAMESPACE_EXPRESSION_PATH) || '',
  ).trim();
  if (kernelValue) return kernelValue;

  return readStoredValue(CLEAKER_NAMESPACE_STORAGE_KEY) || DEFAULT_CLEAKER_NAMESPACE_EXPRESSION;
}

function normalizeHost(host: string | undefined): string {
  return String(host || '').trim().toLowerCase();
}

function normalizeNamespaceSeed(seed: string | undefined): string {
  return normalizeHost(seed).replace(/:\d+$/, '');
}

function buildNamespaceUrl(
  protocol: string,
  username: string | undefined,
  surfaceNamespace: string,
): string {
  if (!surfaceNamespace) return '';
  const label = username ? `${username}.` : '';
  return `${protocol}://${label}${surfaceNamespace}`;
}

export function useCleakerNamespace(
  options: UseCleakerNamespaceOptions,
): UseCleakerNamespaceResult {
  const {
    me,
    namespace: propsNamespace,
    namespaceOrigin: propsNamespaceOrigin,
    normalizedUsername = '',
    resolverHostName = '',
    effectiveSemanticRootName = '',
  } = options;

  const [namespaceInput, setNamespaceInput] = useState<string>(() => {
    return resolveInitialNamespaceInput(me, propsNamespace, propsNamespaceOrigin);
  });

  const namespaceConfig = useMemo(() => {
    try {
      return parseCleakerNamespaceExpression(namespaceInput);
    } catch {
      return parseCleakerNamespaceExpression(DEFAULT_CLEAKER_NAMESPACE_EXPRESSION);
    }
  }, [namespaceInput]);

  const namespaceOrigin = namespaceConfig.transport.origin;
  const namespaceHost = namespaceConfig.constant;
  const namespaceDisplayHost = namespaceConfig.displayHost;

  const namespaceSeedFallback = useMemo(() => {
    return normalizeNamespaceSeed(namespaceHost);
  }, [namespaceHost]);

  const resolvedNamespaceRootName = useMemo(() => {
    const normalizedEffectiveRoot = normalizeHost(effectiveSemanticRootName);
    if (normalizedEffectiveRoot) return normalizedEffectiveRoot;

    const resolvedRoot = normalizeHost(resolverHostName);
    if (resolvedRoot) return resolvedRoot;

    return namespaceSeedFallback;
  }, [effectiveSemanticRootName, namespaceSeedFallback, resolverHostName]);

  const namespaceSeedHandle = resolvedNamespaceRootName;

  const surfaceNamespace = useMemo(() => {
    return formatSurfaceNamespace(
      namespaceConfig.transport.host,
      namespaceConfig.transport.port,
    );
  }, [namespaceConfig.transport.host, namespaceConfig.transport.port]);

  const subjectSurfaceNamespace = useMemo(() => {
    if (!normalizedUsername || !surfaceNamespace) return '';
    return `${normalizedUsername}.${surfaceNamespace}`;
  }, [normalizedUsername, surfaceNamespace]);

  const resolverSurfaceNamespace = useMemo(() => {
    if (!resolverHostName) return '';
    return formatSurfaceNamespace(resolverHostName, namespaceConfig.transport.port);
  }, [namespaceConfig.transport.port, resolverHostName]);

  const resolverSubjectSurfaceNamespace = useMemo(() => {
    if (!normalizedUsername || !resolverSurfaceNamespace) return '';
    return `${normalizedUsername}.${resolverSurfaceNamespace}`;
  }, [normalizedUsername, resolverSurfaceNamespace]);

  const localNamespaceUrl = useMemo(() => {
    return buildNamespaceUrl(
      namespaceConfig.transport.protocol,
      normalizedUsername || undefined,
      surfaceNamespace,
    );
  }, [namespaceConfig.transport.protocol, normalizedUsername, surfaceNamespace]);

  const networkNamespaceUrl = useMemo(() => {
    return buildNamespaceUrl(
      namespaceConfig.transport.protocol,
      normalizedUsername || undefined,
      resolverSurfaceNamespace,
    );
  }, [namespaceConfig.transport.protocol, normalizedUsername, resolverSurfaceNamespace]);

  const activeNamespaceUrl = useMemo(() => {
    return networkNamespaceUrl || localNamespaceUrl || namespaceOrigin || '';
  }, [localNamespaceUrl, namespaceOrigin, networkNamespaceUrl]);

  const compactMonadLabel = useMemo(() => {
    return compactSurfaceLabel(surfaceNamespace || namespaceOrigin || namespaceHost || 'unknown');
  }, [namespaceHost, namespaceOrigin, surfaceNamespace]);

  const compactRootLabel = useMemo(() => {
    return compactNamespaceName(namespaceSeedHandle || '—') || '—';
  }, [namespaceSeedHandle]);

  const saveNamespaceToStorage = useCallback(() => {
    writeStoredValue(
      CLEAKER_NAMESPACE_STORAGE_KEY,
      namespaceInput || DEFAULT_CLEAKER_NAMESPACE_EXPRESSION,
    );
  }, [namespaceInput]);

  useEffect(() => {
    const explicit = readExplicitNamespaceInput(propsNamespace, propsNamespaceOrigin);
    if (!explicit) return;
    setNamespaceInput(explicit);
  }, [propsNamespace, propsNamespaceOrigin]);

  useEffect(() => {
    saveNamespaceToStorage();
  }, [saveNamespaceToStorage]);

  return {
    namespaceInput,
    setNamespaceInput,
    namespaceConfig,
    namespaceOrigin,
    namespaceHost,
    namespaceDisplayHost,
    namespaceSeedFallback,
    resolvedNamespaceRootName,
    namespaceSeedHandle,
    surfaceNamespace,
    subjectSurfaceNamespace,
    resolverSurfaceNamespace,
    resolverSubjectSurfaceNamespace,
    localNamespaceUrl,
    networkNamespaceUrl,
    activeNamespaceUrl,
    compactMonadLabel,
    compactRootLabel,
    saveNamespaceToStorage,
  };
}

function safeReadKernelValue(me: MeLike, path: string): unknown {
  try {
    return readMeValue(me, path, { allowBarePath: true });
  } catch {
    return undefined;
  }
}

function readStoredValue(key: string): string {
  if (typeof window === 'undefined') return '';
  try {
    return String(localStorage.getItem(key) || '').trim();
  } catch {
    return '';
  }
}

function writeStoredValue(key: string, value: string): void {
  if (typeof window === 'undefined') return;
  try {
    const normalized = String(value || '').trim();
    if (normalized) localStorage.setItem(key, normalized);
    else localStorage.removeItem(key);
  } catch {
    // Ignore storage failures.
  }
}

function formatSurfaceNamespace(host: string, port: number | null): string {
  const normalizedHost = normalizeHost(host);
  if (!normalizedHost) return '';
  return port == null ? normalizedHost : `${normalizedHost}:${port}`;
}

function compactSurfaceLabel(raw: string): string {
  return String(raw || '')
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/\/+$/, '');
}

function compactNamespaceName(raw: string): string {
  return String(raw || '').trim().toLowerCase().replace(/\.local$/, '');
}

export default useCleakerNamespace;