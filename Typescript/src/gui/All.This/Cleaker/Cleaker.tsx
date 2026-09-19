import React, { useCallback, useEffect, useMemo, useState } from "react";
import ME from 'this.me';
import { alpha } from '@mui/material/styles';
import { useGuiTheme } from '@/gui-internals/Hooks';
import Box from '@/gui/Atoms/Box/Box';
import Card from '@/gui/Atoms/Card/Card';
import CardContent from '@/gui/Atoms/Card/CardContent/CardContent';
import Paper from '@/gui/Atoms/Paper/Paper';
// Removed: TextField, Icon, IconButton
import Button from '@/gui/Atoms/Button/Button';
import Typography from '@/gui/Atoms/Typography/Typography';
import Stack from '@/gui/Molecules/Stack/Stack';
import {
  type ConnectionStatus,
  useSovereignPresence,
} from "./Namespace/scripts/connection";
// Removed: QR
import { sanitizeCleakerUsername } from './runtimeUsername';
import useCleakerAuth from './hooks/useCleakerAuth';
import useCleakerDerivedIdentity from './hooks/useCleakerDerivedIdentity';
import useCleakerMeshPairing from './hooks/useCleakerMeshPairing';
import useCleakerNamespace from './hooks/useCleakerNamespace';
import useCleakerProfileRuntime from './hooks/useCleakerProfileRuntime';
import useCleakerSelectionRegistry from './hooks/useCleakerSelectionRegistry';
import useCleakerView from './hooks/useCleakerView';
import { useCleakerKernelSync } from './hooks/useCleakerKernelSync';
import { MeRuntimeProvider, useOptionalMeRuntimeContext } from '@/react/MeRuntimeProvider';
import {
  SeedSessionProvider,
  useOptionalSeedSessionContext,
} from '@/react/session/SeedSessionProvider';
import { useMe } from '@/react/useMe';
import { useMeAction } from '@/react/useMeAction';
import { useMeValue } from '@/react/useMeValue';
import type { MeLike } from '@/react/types';
import { useRuntimeEnvironment } from '@/runtime/runtimeContext';
import { renderNode } from '@/runtime/renderer';
import { readMeValue, writeMeValue } from '@/runtime/run-me';
import QRme from '@/gui/All.This/me/QR/QR.me';
import { DEFAULT_CLEAKER_NAMESPACE_EXPRESSION } from "./namespaceExpression";
import { createSurfaceEntry, resolveSemanticRootName } from "./surfaceModel";
import { createProfileCardSpec } from './specs';
import { AccessRequestHandler } from './access';
import ClaimSurface from './ClaimSurface';
import CleakerCard from './CleakerCard';
import GeneratePairingQR from './GeneratePairingQR';
import CleakerSignUpModal from './SignUp/Modal';
import {
  isProbablyLocalOrigin,
  registerMeshSurface,
  slugifySurfaceName,
  writeMeshRuntimeValue,
} from './meshPairing';
import { writeKernelWindowLocation } from '@/core/session/createSeedSession';


export type CleakerProps = {
  'data-gui-node-id'?: string;
  'data-gui-component'?: string;
  username?: string;
  namespace?: string;
  namespaceOrigin?: string;
  me?: MeLike;
  /** Override the card's maxWidth. Default: '320px' login, '460px' claim surface. Pass '100%' to fill the container. */
  maxWidth?: string;
};

const KERNEL_CLEAKER_IDENTITY_PATH = 'identity.session';
const KERNEL_CLEAKER_UI_PATH = 'ui.cleaker';
const KERNEL_CLEAKER_AUTH_PATH = 'runtime.cleaker.auth';
const KERNEL_CLEAKER_NAMESPACE_PATH = 'runtime.cleaker.namespace';
const KERNEL_CLEAKER_REGISTER_PATH = 'ui.cleaker.register';
const KERNEL_CLEAKER_CANONICAL_AUTH_PATH = 'auth';


function safeWriteKernelPath(me: MeLike, runtime: any, path: string, value: any): boolean {
  try {
    writeMeValue(me, path, value);
    runtime?.notify?.(path);
    return true;
  } catch {
    return false;
  }
}

function describeConnectionStatus(status: ConnectionStatus): string {
  switch (status) {
    case 'online': return 'online';
    case 'offline': return 'offline';
    case 'declined': return 'blocked';
    case 'connecting': return 'checking';
    default: return 'idle';
  }
}

function cleanString(value: unknown): string {
  return String(value || '').trim();
}

function maskHash(hash: string): string {
  const value = String(hash || '').trim();
  if (!value) return '';
  if (value.length <= 18) return value;
  return `${value.slice(0, 10)}…${value.slice(-8)}`;
}

function safeAlphaColor(color: string | undefined, opacity: number, fallback: string): string {
  const normalized = String(color || '').trim().toLowerCase();
  if (!normalized || normalized === 'transparent') return fallback;
  try {
    return alpha(color as string, opacity);
  } catch {
    return fallback;
  }
}

function CleakerInner(props: CleakerProps) {
  const { me: runtimeMe, runtime } = useMe();
  const theme = useGuiTheme();
  const rootNodeId = String(props['data-gui-node-id'] || 'Cleaker');
  const rootNodeType = String(props['data-gui-component'] || 'Cleaker');
  // Root paths are canonical. Both hooks always called (Rules of Hooks);
  // legacy profile.* value used as fallback for existing kernels.
  const _username        = useMeValue<string>('me.username');
  const _legacyUsername  = useMeValue<string>('username');
  const _legacyUsername2 = useMeValue<string>('profile.username');
  const _name            = useMeValue<string>('me.name');
  const _legacyName      = useMeValue<string>('name');
  const _legacyName2     = useMeValue<string>('profile.name');
  const _email           = useMeValue<string>('me.email.primary');
  const _legacyEmail     = useMeValue<string>('email');
  const _legacyEmail2    = useMeValue<string>('profile.email');
  const _phone           = useMeValue<string>('me.phone.primary');
  const _legacyPhone     = useMeValue<string>('phone');
  const _legacyPhone2    = useMeValue<string>('profile.phone');
  const profileUsername = _username || _legacyUsername || _legacyUsername2 || '';
  const profileName     = _name     || _legacyName     || _legacyName2     || '';
  const profileEmail    = _email    || _legacyEmail    || _legacyEmail2    || '';
  const profilePhone    = _phone    || _legacyPhone    || _legacyPhone2    || '';
  const claimedAtPath = useMeValue<number | null>('auth.claimed_at');
  const activeSessionNamespace = useMeValue<string>('identity.session.namespace') || '';
  const kernelRuntimeAuthenticated = Boolean(useMeValue<boolean>('identity.session.authenticated'));
  const kernelViewMode = useMeValue<string>('ui.cleaker.viewMode') || '';
  const setKernelViewMode = useMeAction('ui.cleaker.viewMode');

  const namespaceBootstrap = useCleakerNamespace({
    me: runtimeMe,
    namespace: props.namespace,
    namespaceOrigin: props.namespaceOrigin,
  });

  const {
    namespaceInput,
    setNamespaceInput,
    namespaceConfig,
    namespaceOrigin,
    namespaceHost,
    namespaceDisplayHost,
    namespaceSeedFallback,
  } = namespaceBootstrap;

  const nodeId = useCallback((segment: string) => `${rootNodeId}/${segment}`, [rootNodeId]);
  const nodePath = useCallback((segment: string) => `${rootNodeId}.${segment}`, [rootNodeId]);
  const nodeAttrs = useCallback(
    (segment: string, component: string) => ({
      'data-gui-node-id': nodeId(segment),
      'data-gui-component': component,
    }),
    [nodeId]
  );

  const specRegistry = useMemo(
    () => ({
      Box,
      Button,
      Card,
      CardContent,
      Paper,
      Stack,
      Typography,
      'QR.me': QRme,
    }),
    []
  );

  const renderSpecNode = useCallback(
    (spec: any, path: string) =>
      renderNode(spec, {
        React,
        registry: specRegistry,
        runtime: runtime ?? undefined,
      }, path),
    [runtime, specRegistry]
  );

  const sanitizeRuntimeUsername = useCallback(
    (raw: string) => sanitizeCleakerUsername(raw),
    []
  );

  const themedUi = useMemo(() => {
    const primary = theme.palette.primary.main;
    const divider = theme.palette.divider;
    const paper = theme.palette.background.paper;
    const subtleSection = theme.palette.section.subtle;
    const defaultSection = theme.palette.section.default;
    const isDark = theme.palette.mode === 'dark';
    const paperLow = safeAlphaColor(
      paper,
      isDark ? 0.04 : 0.94,
      isDark ? alpha(theme.palette.common.black, 0.18) : alpha(theme.palette.common.white, 0.94)
    );
    const paperMid = safeAlphaColor(
      paper,
      isDark ? 0.16 : 0.84,
      isDark ? alpha(theme.palette.common.black, 0.24) : alpha(theme.palette.common.white, 0.84)
    );
    const paperSoft = safeAlphaColor(
      paper,
      0.08,
      isDark ? alpha(theme.palette.common.white, 0.06) : alpha(theme.palette.common.black, 0.03)
    );

    return {
      shellBorder: safeAlphaColor(primary, isDark ? 0.2 : 0.14, divider),
      shellBackground: isDark
        ? `linear-gradient(180deg, ${paperLow} 0%, ${defaultSection} 100%)`
        : `linear-gradient(180deg, ${paperLow} 0%, ${subtleSection} 100%)`,
      shellShadow: isDark ? theme.shadows[8] : theme.shadows[3],
      panelBackground: paperMid,
      panelBorder: safeAlphaColor(divider, isDark ? 0.92 : 0.8, divider),
      qrBorder: safeAlphaColor(primary, isDark ? 0.42 : 0.28, divider),
      qrBackground: isDark
        ? `radial-gradient(circle at 28% 24%, ${safeAlphaColor(primary, 0.16, divider)} 0%, ${subtleSection} 48%, ${paperLow} 100%)`
        : `radial-gradient(circle at 28% 24%, ${safeAlphaColor(primary, 0.12, divider)} 0%, ${paperLow} 52%, ${subtleSection} 100%)`,
      qrExpandedShadow: `0 0 0 2px ${safeAlphaColor(primary, 0.24, divider)}, ${theme.shadows[8]}`,
      qrCollapsedShadow: `0 0 0 1px ${safeAlphaColor(primary, 0.18, divider)}, ${theme.shadows[2]}`,
      inputUnderline: safeAlphaColor(primary, 0.78, primary),
      subtleSurface: isDark ? paperSoft : alpha(theme.palette.common.black, 0.03),
      ghostHover: safeAlphaColor(
        theme.palette.text.primary,
        isDark ? 0.08 : 0.05,
        isDark ? alpha(theme.palette.common.white, 0.08) : alpha(theme.palette.common.black, 0.05)
      ),
      activeIcon: safeAlphaColor(primary, 0.12, divider),
    };
  }, [theme]);


  const [avatarExpanded, setAvatarExpanded] = useState(false);
 
  const { parentHost, parentStatus } = useSovereignPresence({
    parent: namespaceOrigin,
    local: '',
  });

  const isParentOnline = parentStatus === 'online';

  const actionTarget = useMemo(() => {
    if (namespaceOrigin || isParentOnline) return 'cloud' as const;
    return 'none' as const;
  }, [isParentOnline, namespaceOrigin]);

  const actionBaseUrl = useMemo(() => {
    if (actionTarget === 'cloud') return namespaceOrigin;
    return '';
  }, [actionTarget, namespaceOrigin]);

  const actionTargetLabel = useMemo(() => {
    if (actionTarget === 'cloud') return parentHost || namespaceDisplayHost || namespaceHost || 'cleaker.me';
    return 'offline';
  }, [actionTarget, namespaceDisplayHost, namespaceHost, parentHost]);

  const rootHostNamespace = useMemo(() => {
    return String(namespaceConfig.transport.host || '').trim().toLowerCase();
  }, [namespaceConfig.transport.host]);

  const semanticRootName = useMemo(() => {
    return resolveSemanticRootName({
      namespaceHandle: namespaceHost,
      resolverHostName: '',
      rootHostNamespace,
    });
  }, [namespaceHost, rootHostNamespace]);



// ===========================================================================
// Profile Runtime — extracted to its own hook
// ===========================================================================
const profileRuntime = useCleakerProfileRuntime({
  me: runtimeMe,
  runtime,
  sanitizeRuntimeUsername,
});

const {
  activeProfileUsername,
  activeProfileName,
  activeProfileEmail,
  activeProfilePhone,
  activeIdentityNamespace,
  claimedAt,
  sessionAuthenticated,
  updateProfileFromAuth,
  clearProfileState,
} = profileRuntime;

// ===========================================================================
// Mesh Pairing — extracted to its own hook
// ===========================================================================
const meshPairing = useCleakerMeshPairing({
  me: runtimeMe,
  runtime,
  runtimeAuthenticated: kernelRuntimeAuthenticated,
  setKernelViewMode,
});

const {
  pairingExpression,
  pairingLinkError,
  clearPairingState,
} = meshPairing;


  const auth = useCleakerAuth({
    username: props.username,
    namespaceOrigin,
    namespaceSeedHandle: String(semanticRootName || namespaceSeedFallback || '').trim().toLowerCase(),
    namespaceSeedFallback,
    actionBaseUrl,
    actionTargetLabel,
    activeProfile: {
      username: activeProfileUsername,
      name: activeProfileName,
      email: activeProfileEmail,
      phone: activeProfilePhone,
      namespace: activeIdentityNamespace,
      claimedAt,
    },
    onAuthenticated: (profile) => {
      updateProfileFromAuth(profile);
    },
    onViewModeChange: (viewMode) => {
      setKernelViewMode(viewMode);
    },
  });

  const {
    username,
    setUsername,
    usernameError,
    normalizedUsername,
    secret,
    setSecret,
    showSecret,
    setShowSecret,
    registerOpen,
    openRegisterModal,
    closeRegisterModal,
    registerFullName,
    setRegisterFullName,
    registerUsername,
    setRegisterUsername,
    registerEmail,
    setRegisterEmail,
    registerPhone,
    setRegisterPhone,
    registerPassword,
    setRegisterPassword,
    registerConfirmPassword,
    setRegisterConfirmPassword,
    registerError,
    authStatus,
    authAction,
    authError,
    claimResolution,
    claimResolutionNote,
    sessionAuthenticated: authSessionAuthenticated,
    bootstrapInfo,
    handleCleak,
    handleRegisterSubmit,
    handleLogout: handleAuthLogout,
    authSuccessMessage,
    authProgressMessage,

  } = auth;

  const resolverHostName = useMemo(() => {
    return String(bootstrapInfo?.resolverHostName || '').trim().toLowerCase();
  }, [bootstrapInfo?.resolverHostName]);

  const resolverDisplayName = useMemo(() => {
    return String(bootstrapInfo?.resolverDisplayName || '').trim();
  }, [bootstrapInfo?.resolverDisplayName]);

  const hostResolvedSurfaceEntry = useMemo(() => {
    const entry = bootstrapInfo?.surfaceEntry;
    if (!entry) return null;
    return {
      ...entry,
      status: {
        ...entry.status,
        availability: parentStatus === 'online' ? 'online' : entry.status.availability,
        syncState: parentStatus === 'online' ? 'current' : entry.status.syncState,
        lastSeen: parentStatus === 'online' ? Date.now() : entry.status.lastSeen,
      },
    };
  }, [bootstrapInfo?.surfaceEntry, parentStatus]);

  const effectiveSemanticRootInput = useMemo(() => {
    const resolvedRoot = String(hostResolvedSurfaceEntry?.rootName || '').trim().toLowerCase();
    if (resolvedRoot) return resolvedRoot;
    return semanticRootName;
  }, [hostResolvedSurfaceEntry?.rootName, semanticRootName]);

  // ===========================================================================
  // Namespace Hook — enriched with auth/bootstrap-derived inputs.
  // Single source of truth for derived namespace values.
  // ===========================================================================
  const namespace = useCleakerNamespace({
    me: runtimeMe,
    namespace: props.namespace,
    namespaceOrigin: props.namespaceOrigin,
    normalizedUsername,
    resolverHostName,
    effectiveSemanticRootName: effectiveSemanticRootInput,
  });

  const {
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
  } = namespace;

  const effectiveSemanticRootName = resolvedNamespaceRootName;

  // ===========================================================================
  // Derived Identity — extracted into its own hook.
  // ===========================================================================
  const derivedIdentity = useCleakerDerivedIdentity({
    username,
    normalizedUsername,
    secret,
    namespaceSeedHandle,
    rootHostNamespace,
    activeNamespaceUrl,
    sanitizeRuntimeUsername,
  });

  const {
    globalNamespaceRootHash,
    subjectNamespaceHash,
    identityNamespace,
    typingNamespace,
    subjectHandleNamespace,
    identity,
    previewQrValue,
  } = derivedIdentity;


  const liveUsernameState = useMemo(() => {
    const raw = String(username || '').trim();
    if (!raw) return 'idle' as const;
    if (usernameError) return 'invalid' as const;
    return 'valid' as const;
  }, [username, usernameError]);

  const liveUsernameNote = useMemo(() => {
    if (liveUsernameState === 'invalid') return String(usernameError || 'invalid username format');
    if (liveUsernameState === 'valid') return identityNamespace;
    return '';
  }, [identityNamespace, liveUsernameState, usernameError]);

  const surfaceEntry = useMemo(() => {
    if (hostResolvedSurfaceEntry) return hostResolvedSurfaceEntry;
    return createSurfaceEntry({
      namespaceUrl: activeNamespaceUrl,
      endpoint: namespaceOrigin,
      namespaceHandle: namespaceSeedHandle,
      rootHostNamespace,
      resolverHostName,
      connected: parentStatus === 'online',
    });
  }, [
    activeNamespaceUrl,
    hostResolvedSurfaceEntry,
    namespaceSeedHandle,
    namespaceOrigin,
    parentStatus,
    resolverHostName,
    rootHostNamespace,
  ]);

  const hasNamespaceBinding = Boolean(
    (activeSessionNamespace || activeIdentityNamespace)
    && (activeSessionNamespace || activeIdentityNamespace) === identityNamespace
    && activeNamespaceUrl
  );

  const runtimeAuthenticated = Boolean(
    (kernelRuntimeAuthenticated || authSessionAuthenticated || sessionAuthenticated)
    && hasNamespaceBinding
  );

  const hasCanonicalClaim = Boolean(profileUsername && claimedAtPath);
  const hasClaimedIdentity = Boolean(profileUsername && claimedAtPath && activeSessionNamespace);

  const view = useCleakerView({
    kernelViewMode,
    pairingExpression,
    hasClaimedIdentity,
  });

  const {
    isClaimSurfaceView,
    settingsOpen,
    currentViewMode,
    semanticViewMode,
    showProfileView,
    showClaimSurfaceView,
    showLoginView,
  } = view;

  const isClaimed = Boolean(hasCanonicalClaim || claimResolution === 'openable');

  const hostSurfaceId = useMemo(() => {
    return slugifySurfaceName(
      surfaceEntry.hostId || resolverHostName || effectiveSemanticRootName || 'host-surface'
    );
  }, [effectiveSemanticRootName, resolverHostName, surfaceEntry.hostId]);

  const hostSurfaceRecord = useMemo(() => ({
    hostId: hostSurfaceId,
    displayName: resolverDisplayName || compactMonadLabel || hostSurfaceId,
    type: surfaceEntry.type,
    platform:
      typeof navigator === 'undefined'
        ? 'unknown'
        : String((navigator as any).userAgentData?.platform || navigator.platform || 'unknown'),
    note: 'Active Cleaker host surface.',
    namespace: activeIdentityNamespace || identityNamespace || typingNamespace || namespaceSeedHandle,
    status: (parentStatus === 'online' ? 'online' : 'unknown') as 'online' | 'unknown',
    confidence: isProbablyLocalOrigin(namespaceOrigin) ? 96 : 88,
    lastSeen: surfaceEntry.status.lastSeen || Date.now(),
    pairedAt: surfaceEntry.status.lastSeen || Date.now(),
    origin: namespaceOrigin || activeNamespaceUrl || null,
    localNetwork: isProbablyLocalOrigin(namespaceOrigin),
    claimToken: null,
    transport: (isProbablyLocalOrigin(namespaceOrigin) ? 'mdns' : 'https') as 'mdns' | 'https',
    trust: 'owner' as const,
    metadata: {
      userAgent: typeof navigator === 'undefined' ? 'unknown' : String(navigator.userAgent || 'unknown'),
      hostSurface: null,
    },
  }), [
    activeIdentityNamespace,
    activeNamespaceUrl,
    compactMonadLabel,
    hostSurfaceId,
    identityNamespace,
    namespaceOrigin,
    namespaceSeedHandle,
    parentStatus,
    resolverDisplayName,
    surfaceEntry.status.lastSeen,
    surfaceEntry.type,
    typingNamespace,
  ]);

  // ---------------------------------------------------------------------------
  // Namespace preview broadcast (window event + global ref)
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const detail = {
      namespaceExpression: namespaceConfig.expression,
      namespaceOrigin,
      namespaceHost,
      semanticRootName: effectiveSemanticRootName,
      localNamespaceUrl,
      networkNamespaceUrl,
      identityNamespace,
      rootHostNamespace,
      surfaceNamespace,
      resolverHostName,
      resolverDisplayName,
      resolverSurfaceNamespace,     
      resolverSubjectSurfaceNamespace,
      surfaceEntry,
      subjectSurfaceNamespace,
      subjectHandleNamespace,
      namespaceUrl: activeNamespaceUrl,
      rootHash: globalNamespaceRootHash,
      subjectHash: subjectNamespaceHash,
      previewQrValue,
      endpoint: namespaceOrigin,
    };

    try {
      (window as any).__cleakerNamespacePreview = detail;
      window.dispatchEvent(new CustomEvent('cleaker:namespace-preview-changed', { detail }));
    } catch {
      // Ignore preview broadcast failures in restricted runtimes.
    }
  }, [
    identityNamespace,
    namespaceConfig.expression,
    namespaceHost,
    namespaceOrigin,
    effectiveSemanticRootName,
    resolvedNamespaceRootName,
    surfaceNamespace,
    localNamespaceUrl,
    networkNamespaceUrl,
    resolverDisplayName,
    resolverHostName,
    resolverSurfaceNamespace,
    resolverSubjectSurfaceNamespace,
    surfaceEntry,
    activeNamespaceUrl,
    previewQrValue,
    rootHostNamespace,
    globalNamespaceRootHash,
    subjectHandleNamespace,
    subjectNamespaceHash,
    subjectSurfaceNamespace,
  ]);

  // ---------------------------------------------------------------------------
  // Semantic states — each describes one slice of Cleaker's runtime state.
  // These are passed to useCleakerKernelSync which owns all writes to the kernel.
  // ---------------------------------------------------------------------------

  const identitySemanticState = useMemo(() => ({
    username: runtimeAuthenticated ? activeProfileUsername || null : null,
    draftUsername: String(username || '').trim() || null,
    usernameError: usernameError || null,
    namespace: runtimeAuthenticated ? activeIdentityNamespace || null : null,
    namespaceSeed: namespaceSeedHandle || null,
    typingNamespace: typingNamespace || null,
    note: liveUsernameNote || null,
    liveState: liveUsernameState,
    rootHash: globalNamespaceRootHash || null,
    surfaceHash: globalNamespaceRootHash || null,
    subjectHash: subjectNamespaceHash || null,
    namespaceUrl: activeNamespaceUrl || null,
    authenticated: runtimeAuthenticated,
    hasSecret: Boolean(secret),
  }), [
    activeNamespaceUrl,
    activeIdentityNamespace,
    activeProfileUsername,
    liveUsernameNote,
    liveUsernameState,
    namespaceSeedHandle,
    globalNamespaceRootHash,
    secret,
    subjectNamespaceHash,
    typingNamespace,
    runtimeAuthenticated,
    username,
    usernameError,
  ]);

  const namespaceSemanticState = useMemo(() => ({
    expression: namespaceConfig.expression,
    input: String(namespaceInput || '').trim() || null,
    origin: namespaceOrigin || null,
    host: namespaceHost || null,
    displayHost: namespaceDisplayHost || null,
    localUrl: localNamespaceUrl || null,
    networkUrl: networkNamespaceUrl || null,
    activeUrl: activeNamespaceUrl || null,
    rootHostNamespace: rootHostNamespace || null,
    surfaceNamespace: surfaceNamespace || null,
    subjectSurfaceNamespace: subjectSurfaceNamespace || null,
    subjectHandleNamespace: subjectHandleNamespace || null,
    resolverHostName: resolverHostName || null,
    resolverDisplayName: resolverDisplayName || null,
    resolverSurfaceNamespace: resolverSurfaceNamespace || null,
    resolverSubjectSurfaceNamespace: resolverSubjectSurfaceNamespace || null,
    previewQrValue: previewQrValue || null,
  }), [
    activeNamespaceUrl,
    localNamespaceUrl,
    namespaceConfig.expression,
    namespaceDisplayHost,
    namespaceHost,
    namespaceInput,
    namespaceOrigin,
    networkNamespaceUrl,
    previewQrValue,
    resolverDisplayName,
    resolverHostName,
    resolverSubjectSurfaceNamespace,
    resolverSurfaceNamespace,
    rootHostNamespace,
    subjectHandleNamespace,
    subjectSurfaceNamespace,
    surfaceNamespace,
  ]);

  const uiSemanticState = useMemo(() => ({
    settingsOpen,
    registerOpen,
    avatarExpanded,
    showSecret,
    viewMode: semanticViewMode,
    actionDisabled: !normalizedUsername || !secret || actionTarget === 'none' || authStatus === 'checking',
    parentStatus: describeConnectionStatus(parentStatus),
    parentOnline: isParentOnline,
  }), [
    avatarExpanded,
    semanticViewMode,
    actionTarget,
    authStatus,
    isParentOnline,
    normalizedUsername,
    parentStatus,
    registerOpen,
    secret,
    settingsOpen,
    showSecret,
  ]);

  const authSemanticState = useMemo(() => ({
    status: authStatus,
    action: authAction,
    error: authError || null,
    claimed: isClaimed,
    claimResolution,
    claimResolutionNote: claimResolutionNote || null,
    progressMessage: authStatus === 'checking' ? authProgressMessage : null,
    successMessage: authStatus === 'ok' ? authSuccessMessage : null,
    actionTarget,
    actionTargetLabel,
    actionBaseUrl: actionBaseUrl || null,
  }), [
    actionBaseUrl,
    actionTarget,
    actionTargetLabel,
    authAction,
    authError,
    authProgressMessage,
    authStatus,
    authSuccessMessage,
    isClaimed,
    claimResolution,
    claimResolutionNote,
  ]);

  const canonicalAuthSemanticState = useMemo(() => ({
    claimed_at: claimedAtPath ?? claimedAt,
  }), [claimedAt, claimedAtPath]);

  const profileSemanticState = useMemo(() => ({
    username: sanitizeRuntimeUsername(profileUsername) || activeProfileUsername || null,
    name: cleanString(profileName) || activeProfileName || null,
    email: cleanString(profileEmail) || activeProfileEmail || null,
    phone: cleanString(profilePhone) || activeProfilePhone || null,
  }), [
    activeProfileEmail,
    activeProfileName,
    activeProfilePhone,
    activeProfileUsername,
    profileEmail,
    profileName,
    profilePhone,
    profileUsername,
    sanitizeRuntimeUsername,
  ]);

  const registerSemanticState = useMemo(() => ({
    open: registerOpen,
    name: cleanString(registerFullName).replace(/\s+/g, ' ') || null,
    username: String(registerUsername || '').trim() || null,
    email: String(registerEmail || '').trim() || null,
    phone: String(registerPhone || '').trim() || null,
    error: registerError || null,
  }), [
    registerEmail,
    registerError,
    registerFullName,
    registerOpen,
    registerPhone,
    registerUsername,
  ]);

  // ---------------------------------------------------------------------------
  // Kernel sync — replaces the manual semanticWrites useMemo + useEffect.
  // All kernel writes for Cleaker's UI/auth/profile state flow through here.
  // Imperative mesh writes (writeMeshRuntimeValue) remain outside this hook.
  // ---------------------------------------------------------------------------

  useCleakerKernelSync({
    me: runtimeMe,
    runtime,
    blocks: [
      { path: KERNEL_CLEAKER_IDENTITY_PATH,       value: identitySemanticState },
      { path: KERNEL_CLEAKER_NAMESPACE_PATH,      value: namespaceSemanticState },
      { path: KERNEL_CLEAKER_UI_PATH,             value: uiSemanticState },
      { path: KERNEL_CLEAKER_AUTH_PATH,           value: authSemanticState },
      { path: KERNEL_CLEAKER_REGISTER_PATH,       value: registerSemanticState },
      { path: KERNEL_CLEAKER_CANONICAL_AUTH_PATH, value: canonicalAuthSemanticState },
    ],
    // Identity fields — canonical me.* paths
    entries: [
      { path: 'me.username',      value: profileSemanticState.username },
      { path: 'me.name',          value: profileSemanticState.name },
      { path: 'me.email.primary', value: profileSemanticState.email },
      { path: 'me.phone.primary', value: profileSemanticState.phone },
    ],
  });

  // ---------------------------------------------------------------------------
  // Mesh surface registration
  // ---------------------------------------------------------------------------

  const hostSurfaceSnapshotRef = React.useRef('');

  useEffect(() => {
    if (!runtimeMe) return;
    const snapshot = JSON.stringify(hostSurfaceRecord);
    if (hostSurfaceSnapshotRef.current === snapshot) return;
    hostSurfaceSnapshotRef.current = snapshot;
    registerMeshSurface(runtimeMe, runtime, hostSurfaceId, hostSurfaceRecord);
    writeMeshRuntimeValue(runtimeMe, runtime, 'runtime.mesh.hostSurface', hostSurfaceRecord);
  }, [hostSurfaceId, hostSurfaceRecord, runtime, runtimeMe]);

  // ---------------------------------------------------------------------------
  // Mesh deep link / pairing expression handler
  // ---------------------------------------------------------------------------


  // ---------------------------------------------------------------------------
  // Selection store node registry
  // ---------------------------------------------------------------------------

  const isActionDisabled = !normalizedUsername || !secret || actionTarget === 'none' || authStatus === 'checking';

  // ===========================================================================
  // Selection Registry — extracted to its own hook
  // ===========================================================================
  useCleakerSelectionRegistry({
    rootNodeId,
    rootNodeType,
    nodeId,
    nodePath,
    namespaceConfigExpression: namespaceConfig.expression,
    namespaceInput,
    namespaceHost,
    namespaceOrigin,
    namespaceDisplayHost,
    rootHostNamespace,
    effectiveSemanticRootName,
    resolvedNamespaceRootName,
    namespaceSeedHandle,
    surfaceNamespace,
    subjectSurfaceNamespace,
    subjectHandleNamespace,
    localNamespaceUrl,
    networkNamespaceUrl,
    activeNamespaceUrl,
    resolverHostName,
    resolverDisplayName,
    resolverSurfaceNamespace,
    resolverSubjectSurfaceNamespace,
    surfaceEntry,
    compactMonadLabel,
    compactRootLabel,
    previewQrValue,
    globalNamespaceRootHash,
    subjectNamespaceHash,
    identityNamespace,
    typingNamespace,
    identityRoot: identity.identityRoot,
    actionTarget,
    actionBaseUrl,
    actionTargetLabel,
    claimResolution,
    claimResolutionNote,
    authStatus,
    authError,
    authProgressMessage,
    authSuccessMessage,
    isClaimed,
    isActionDisabled,
    liveUsernameState,
    username,
    usernameError,
    secret,
    showSecret,
    settingsOpen,
    registerOpen,
    registerFullName,
    registerEmail,
    registerPhone,
    registerUsername,
    currentViewMode,
    showProfileView,
    avatarExpanded,
    activeProfileUsername,
    activeProfileName,
    activeProfileEmail,
    activeProfilePhone,
    activeSessionNamespace,
    claimedAt,
    claimedAtPath,
    runtimeAuthenticated,
    profileUsername,
    profileName,
    profileEmail,
    profilePhone,
    sanitizeRuntimeUsername,
    parentStatus,
    describeConnectionStatus,
    themeMode: theme.palette.mode,
    primaryColor: theme.palette.primary.main,
  });

  // ---------------------------------------------------------------------------
  // Logout
  // ---------------------------------------------------------------------------

  const handleLogout = useCallback(() => {
    const clearEntries: Array<[string, any]> = [
      ['username', null],
      ['name', null],
      ['avatar', null],
      ['bio', null],
      ['email', null],
      ['phone', null],
      ['auth.claimed_at', null],
      ['auth.keys', null],
      ['identity.session.username', ''],
      ['identity.session.draftUsername', ''],
      ['identity.session.authenticated', false],
      ['identity.session.identityHash', ''],
      ['identity.session.hasSecret', false],
      ['identity.session.namespace', ''],
      ['identity.session.openedAt', null],
      ['identity.session.note', ''],
      ['runtime.cleaker.auth.status', 'idle'],
      ['runtime.cleaker.auth.error', null],
      ['runtime.cleaker.auth.successMessage', null],
      ['runtime.cleaker.auth.progressMessage', null],
      ['runtime.cleaker.auth.claimed', false],
      ['runtime.cleaker.auth.claimResolution', 'idle'],
      ['ui.cleaker.settingsOpen', false],
      ['ui.cleaker.registerOpen', false],
      ['ui.cleaker.avatarExpanded', false],
      ['ui.cleaker.showSecret', false],
      ['ui.cleaker.viewMode', 'login'],
    ];
    clearEntries.forEach(([path, value]) => {
      safeWriteKernelPath(runtimeMe, runtime, path, value);
    });
    clearProfileState();
    clearPairingState();
    setAvatarExpanded(false);
    handleAuthLogout();
  }, [clearPairingState, clearProfileState, handleAuthLogout, runtime, runtimeMe]);

  // ---------------------------------------------------------------------------
  // Profile card spec
  // ---------------------------------------------------------------------------

  const claimedProfileCardSpec = useMemo(
    () => createProfileCardSpec({
      rootNodeId: nodeId('profile-spec'),
      showIdentityFace: true,
      showActions: true,
    }),
    [nodeId]
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <Box
      data-gui-node-id={rootNodeId}
      data-gui-component={rootNodeType}
      sx={{
        width: '100%',
        px: '5px',
        boxSizing: 'border-box',
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr)',
        gap: 2,
        justifyContent: 'center',
        alignItems: 'start',
      }}
    >
      <CleakerCard
        nodeAttrs={nodeAttrs}
        themedUi={themedUi}
        theme={theme}
        maxWidth={props.maxWidth ?? (showClaimSurfaceView ? '460px' : '320px')}
        showProfileView={showProfileView}
        showClaimSurfaceView={showClaimSurfaceView}
        showLoginView={showLoginView}
        settingsOpen={settingsOpen}
        avatarExpanded={avatarExpanded}
        setAvatarExpanded={setAvatarExpanded}
        activeNamespaceUrl={activeNamespaceUrl}
        identityRoot={identity.identityRoot}
        username={username}
        setUsername={setUsername}
        usernameError={usernameError}
        secret={secret}
        namespaceSeedHandle={namespaceSeedHandle}
        liveUsernameState={liveUsernameState}
        liveUsernameNote={liveUsernameNote}
        setKernelViewMode={setKernelViewMode}
        claimResolutionNote={claimResolutionNote}
        namespaceInput={namespaceInput}
        setNamespaceInput={setNamespaceInput}
        defaultNamespaceExpression={DEFAULT_CLEAKER_NAMESPACE_EXPRESSION}
        namespaceConfigExpression={namespaceConfig.expression}
        localNamespaceUrl={localNamespaceUrl}
        networkNamespaceUrl={networkNamespaceUrl}
        resolverDisplayName={resolverDisplayName}
        compactMonadLabel={compactMonadLabel}
        compactRootLabel={compactRootLabel}
        globalNamespaceRootHash={globalNamespaceRootHash}
        maskHash={maskHash}
        previewQrValue={previewQrValue}
        runtimeAuthenticated={runtimeAuthenticated}
        activeIdentityNamespace={activeIdentityNamespace}
        identityNamespace={identityNamespace}
        namespaceOrigin={namespaceOrigin}
        hostSurfaceId={hostSurfaceId}
        effectiveSemanticRootName={effectiveSemanticRootName}
        pairingExpression={pairingExpression}
        clearPairingState={clearPairingState}
        pairingLinkError={pairingLinkError}
        registerOpen={registerOpen}
        openRegisterModal={openRegisterModal}
        closeRegisterModal={closeRegisterModal}
        handleRegisterSubmit={() => void handleRegisterSubmit()}
        registerFullName={registerFullName}
        setRegisterFullName={setRegisterFullName}
        registerUsername={registerUsername}
        setRegisterUsername={setRegisterUsername}
        registerEmail={registerEmail}
        setRegisterEmail={setRegisterEmail}
        registerPhone={registerPhone}
        setRegisterPhone={setRegisterPhone}
        registerPassword={registerPassword}
        setRegisterPassword={setRegisterPassword}
        registerConfirmPassword={registerConfirmPassword}
        setRegisterConfirmPassword={setRegisterConfirmPassword}
        registerError={registerError}
        handleLogout={handleLogout}
        renderProfileCard={() => renderSpecNode(claimedProfileCardSpec, `${rootNodeId}.profile-card`)}
        showSecret={showSecret}
        setShowSecret={setShowSecret}
        setSecret={setSecret}
        handleOpenLogin={() => void handleCleak('open')}
        authStatus={authStatus}
        authProgressMessage={authProgressMessage}
        authError={authError}
        authSuccessMessage={authSuccessMessage}
        isActionDisabled={isActionDisabled}
      />

      <AccessRequestHandler />

      {/* Sign-up form is now inline in CleakerCard — no modal needed */}
    </Box>
  );
}

export default function Cleaker(props: CleakerProps) {
  const localContext = useOptionalMeRuntimeContext();
  const seedContext = useOptionalSeedSessionContext();
  const env = useRuntimeEnvironment();
  const localKernelRef = React.useRef<MeLike | null>(null);

  if (!localKernelRef.current) {
    localKernelRef.current = new ME() as unknown as MeLike;
    writeKernelWindowLocation(localKernelRef.current);
  }

  const inheritedMe = (
    props.me ??
    localContext?.me ??
    env.me ??
    (env.runtime as any)?.__me ??
    (env.runtime as any)?.me
  ) as MeLike | undefined;

  const kernel = inheritedMe ?? localKernelRef.current;
  const shouldWrap = !localContext?.me || localContext.me !== kernel;
  let content = <CleakerInner {...props} me={kernel} />;

  if (shouldWrap) {
    content = <MeRuntimeProvider me={kernel}>{content}</MeRuntimeProvider>;
  }

  if (!seedContext) {
    content = <SeedSessionProvider>{content}</SeedSessionProvider>;
  }

  return content;
}
