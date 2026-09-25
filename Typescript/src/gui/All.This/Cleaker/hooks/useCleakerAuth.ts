import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MonadClientError } from '@/core/session/monadClient';
import {
  canonicalJson as sharedCanonicalJson,
  genNonce as sharedGenNonce,
  sha256Hex as sharedSha256Hex,
  signedRequest as sharedSignedRequest,
  fetchGatewayHostname,
  deriveCleakerNode,
} from '../signedRequest';
import type { SeedSession } from '@/core/session/createSeedSession';
import { useSeedSession } from '@/react/session/useSeedSession';
import {
  type CleakerBootstrapInfo,
  readCleakerBootstrap,
  sanitizeCleakerUsername,
} from '../runtimeUsername';
import useCleakerSignUp, {
  type CleakerSignUpSubmitInput,
} from './useCleakerSignUp';

export type AuthStatus = 'idle' | 'checking' | 'ok' | 'error';
export type AuthAction = 'claim' | 'open';
export type ClaimResolution = 'idle' | 'checking' | 'openable' | 'locked' | 'unclaimed' | 'error';

export type CleakerProfileSnapshot = {
  username: string;
  name: string;
  email: string;
  phone: string;
  namespace: string;
  claimedAt: number | null;
};

export type UseCleakerAuthOptions = {
  username?: string;
  namespaceOrigin: string;
  namespaceSeedHandle: string;
  namespaceSeedFallback?: string;
  actionBaseUrl: string;
  actionTargetLabel: string;
  activeProfile: CleakerProfileSnapshot;
  onAuthenticated?: (profile: CleakerProfileSnapshot, action: AuthAction) => void;
  onViewModeChange?: (viewMode: 'login' | 'profile') => void;
};

export type UseCleakerAuthResult = {
  username: string;
  setUsername: React.Dispatch<React.SetStateAction<string>>;
  usernameError: string | null;
  normalizedUsername: string;
  validateUsername: (raw: string) => { value: string; error: string | null };
  secret: string;
  setSecret: React.Dispatch<React.SetStateAction<string>>;
  showSecret: boolean;
  setShowSecret: React.Dispatch<React.SetStateAction<boolean>>;
  registerOpen: boolean;
  openRegisterModal: () => void;
  closeRegisterModal: () => void;
  registerFullName: string;
  setRegisterFullName: React.Dispatch<React.SetStateAction<string>>;
  registerUsername: string;
  setRegisterUsername: React.Dispatch<React.SetStateAction<string>>;
  registerEmail: string;
  setRegisterEmail: React.Dispatch<React.SetStateAction<string>>;
  registerPhone: string;
  setRegisterPhone: React.Dispatch<React.SetStateAction<string>>;
  registerPassword: string;
  setRegisterPassword: React.Dispatch<React.SetStateAction<string>>;
  registerConfirmPassword: string;
  setRegisterConfirmPassword: React.Dispatch<React.SetStateAction<string>>;
  registerError: string | null;
  authStatus: AuthStatus;
  authAction: AuthAction;
  authError: string | null;
  claimResolution: ClaimResolution;
  claimResolutionNote: string;
  sessionAuthenticated: boolean;
  bootstrapInfo: CleakerBootstrapInfo | null;
  handleCleak: (requestedAction: AuthAction) => Promise<boolean>;
  handleRegisterSubmit: () => Promise<boolean>;
  handleLogout: () => void;
  authSuccessMessage: string;
  authProgressMessage: string;
  /** Fetch wrapper that signs every request with the active Cleaker session. */
  signedFetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
};

type HumanizeOptions = {
  namespaceSeedHandle?: string;
  exampleHandle?: string;
};

function cleanString(value: unknown): string {
  return String(value || '').trim();
}

function normalizeUsernameInput(value: string): string {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/^me:\/\//, '')
    .replace(/\/+$/, '')
    .replace(/:\d+$/, '');
}

function usernameRegexPasses(value: string, allowEmpty = false): boolean {
  const normalized = normalizeUsernameInput(value);
  if (!normalized) return allowEmpty;
  if (normalized.length < 5 || normalized.length > 32) return false;
  if (!/^[a-z0-9._-]+$/.test(normalized)) return false;
  if (normalized.startsWith('.') || normalized.endsWith('.') || normalized.includes('..')) return false;
  return true;
}

function toTimestamp(value: unknown): number | null {
  const next = Number(value);
  return Number.isFinite(next) && next > 0 ? next : null;
}

function humanizeCleakerError(
  raw: unknown,
  options: HumanizeOptions = {},
): string {
  const code = String(raw || '').trim();
  if (!code) return 'Unknown error';
  const exampleHandle = sanitizeCleakerUsername(String(options.exampleHandle || '').trim()) || 'jabellae';

  switch (code) {
    case 'USERNAME_NAMESPACE_MISMATCH':
      return options.namespaceSeedHandle
        ? `Use only the username handle, not the full namespace. Example: "${exampleHandle}", not "${exampleHandle}.${options.namespaceSeedHandle}".`
        : 'Use only the username handle, not email or full namespace.';
    case 'USERNAME_REQUIRED':
      return 'Username is required';
    case 'NAME_REQUIRED':
      return 'Full name is required';
    case 'EMAIL_REQUIRED':
      return 'Email is required';
    case 'EMAIL_INVALID':
      return 'Invalid email';
    case 'PHONE_REQUIRED':
      return 'Phone number is required';
    case 'PHONE_INVALID':
      return 'Invalid phone number';
    case 'CLAIM_NOT_FOUND':
      return 'This username is not claimed yet. Use Sign Up.';
    case 'CLAIM_VERIFICATION_FAILED':
    case 'NOISE_DECRYPT_FAILED':
    case 'IDENTITY_MISMATCH':
      return 'Wrong password for this claimed username.';
    case 'NAMESPACE_TAKEN':
      return 'This username is already claimed. Use .me to log in.';
    case 'NAMESPACE_WRITE_FORBIDDEN':
      return 'This namespace refused the write request for the current identity.';
    case 'SEED_REQUIRED':
      return 'Password is required';
    case 'INVALID_RESPONSE':
      return 'Could not reach the namespace server. Is a monad running?';
    case 'CONNECTION_REFUSED':
    case 'ECONNREFUSED':
      return 'Namespace server is not reachable. Check that a monad is running.';
    default:
      return code;
  }
}

function getMonadErrorCode(error: unknown): string {
  if (error instanceof MonadClientError) return String(error.code || '').trim();
  if (error instanceof Error) return String(error.message || '').trim();
  return String(error || '').trim();
}

function buildAuthenticatedProfile(args: {
  session: SeedSession;
  fallbackUsername: string;
  activeProfile: CleakerProfileSnapshot;
  fallbackNamespace: string;
  claimedAt?: number | null;
}): CleakerProfileSnapshot {
  const {
    session,
    fallbackUsername,
    activeProfile,
    fallbackNamespace,
    claimedAt,
  } = args;

  return {
    username:
      sanitizeCleakerUsername(cleanString(session.read('username'))) ||
      fallbackUsername,
    name: cleanString(session.read('name')) || activeProfile.name,
    email: cleanString(session.read('email')) || activeProfile.email,
    phone: cleanString(session.read('phone')) || activeProfile.phone,
    namespace: cleanString(session.semanticNamespace) || fallbackNamespace,
    claimedAt:
      toTimestamp(session.read('auth.claimed_at')) ||
      toTimestamp(claimedAt) ||
      activeProfile.claimedAt ||
      Date.now(),
  };
}

export function useCleakerAuth(options: UseCleakerAuthOptions): UseCleakerAuthResult {
  const {
    username: externalUsername,
    namespaceOrigin,
    namespaceSeedHandle,
    namespaceSeedFallback = '',
    actionBaseUrl,
    actionTargetLabel,
    activeProfile,
    onAuthenticated,
    onViewModeChange,
  } = options;

  const {
    session,
    authenticated,
    loginWithSeed,
    activateSession,
    logout,
  } = useSeedSession();

  const validateUsername = useCallback((raw: string) => {
    const rawValue = String(raw || '').trim().toLowerCase();
    const value = sanitizeCleakerUsername(raw);
    if (!value) return { value: '', error: null as string | null };
    if (rawValue.includes('@')) {
      return { value, error: 'Use only the username handle, not email' };
    }
    if (rawValue.includes('://') || rawValue.includes('/')) {
      return { value, error: 'Use only the username handle, not a URL or path' };
    }
    if (namespaceSeedFallback && value.endsWith(`.${namespaceSeedFallback}`)) {
      return {
        value,
        error: `Use only the handle before .${namespaceSeedFallback}`,
      };
    }
    if (value.length < 5) return { value, error: 'Username too short' };
    if (value.length > 32) return { value, error: 'Username too long' };
    if (!usernameRegexPasses(value, false)) {
      return { value, error: 'Only a-z 0-9 . _ -' };
    }
    return { value, error: null as string | null };
  }, [namespaceSeedFallback]);

  const [username, setUsernameState] = useState(() =>
    sanitizeCleakerUsername(String(externalUsername || '').trim()),
  );
  const [secret, setSecretState] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [authStatus, setAuthStatus] = useState<AuthStatus>('idle');
  const [authAction, setAuthAction] = useState<AuthAction>('claim');
  const [authError, setAuthError] = useState<string | null>(null);
  const [claimResolution, setClaimResolution] = useState<ClaimResolution>('idle');
  const [bootstrapInfo, setBootstrapInfo] = useState<CleakerBootstrapInfo | null>(null);

  const usernameValidation = useMemo(() => validateUsername(username), [username, validateUsername]);
  const usernameError = usernameValidation.error;
  const normalizedUsername = usernameValidation.error ? '' : usernameValidation.value;
  const identityNamespace = normalizedUsername
    ? `${normalizedUsername}.${namespaceSeedHandle}`
    : namespaceSeedHandle;

  const setUsername = useCallback((next: React.SetStateAction<string>) => {
    setUsernameState(next);
    setAuthStatus('idle');
    setAuthError(null);
    setClaimResolution('idle');
  }, []);

  const setSecret = useCallback((next: React.SetStateAction<string>) => {
    setSecretState(next);
    setAuthStatus('idle');
    setAuthError(null);
    setClaimResolution('idle');
  }, []);

  // ── Cleaker session ref ────────────────────────────────────────────────────
  // Holds the active CleakerNode after login. Ephemeral — cleared on logout.
  // The node carries the derived Ed25519 key (NOT the secret).
  const cleakerNodeRef    = useRef<any>(null);
  const gatewayHostnameRef = useRef<string>('');

  // Canonical JSON, nonce, and body-hash helpers, plus the signing protocol
  // itself, now live in ../signedRequest as plain functions — shared with
  // any caller outside this hook (e.g. a page that only needs to sign
  // requests, not run this hook's full login/registration state machine).
  // These wrappers preserve the hook's existing callback identity/signature
  // for its own consumers; behavior is unchanged.
  const canonicalJson = useCallback(sharedCanonicalJson, []);
  const genNonce      = useCallback(sharedGenNonce, []);
  const sha256Hex     = useCallback(sharedSha256Hex, []);

  // signedFetch — wraps fetch with X-Me-Proof on every request, reading the
  // active node/hostname from this hook's own session refs. Falls back to
  // plain fetch if no Cleaker session is active.
  const signedFetch = useCallback((
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> => {
    return sharedSignedRequest(cleakerNodeRef.current, gatewayHostnameRef.current, input, init);
  }, []);

  useEffect(() => {
    const explicit = sanitizeCleakerUsername(String(externalUsername || '').trim());
    if (!explicit) return;
    setUsernameState(explicit);
  }, [externalUsername]);

  useEffect(() => {
    if (!/^https?:\/\//i.test(String(namespaceOrigin || '').trim())) {
      setBootstrapInfo(null);
      return;
    }

    let cancelled = false;
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;

    (async () => {
      const payload = await readCleakerBootstrap(namespaceOrigin, controller?.signal);
      if (cancelled) return;
      setBootstrapInfo(payload);
    })();

    return () => {
      cancelled = true;
      controller?.abort();
    };
  }, [namespaceOrigin]);

  const applyAuthenticatedProfile = useCallback((args: {
    session: SeedSession;
    fallbackUsername: string;
    action: AuthAction;
    claimedAt?: number | null;
    nextSecret?: string;
  }) => {
    const nextProfile = buildAuthenticatedProfile({
      session: args.session,
      fallbackUsername: args.fallbackUsername,
      activeProfile,
      fallbackNamespace: identityNamespace,
      claimedAt: args.claimedAt,
    });

    setUsernameState(nextProfile.username);
    if (typeof args.nextSecret === 'string') {
      setSecretState(args.nextSecret);
    }
    setClaimResolution('openable');
    setAuthStatus('ok');
    setAuthAction(args.action);
    setAuthError(null);
    onAuthenticated?.(nextProfile, args.action);
    onViewModeChange?.('profile');
    window.setTimeout(() => setAuthStatus('idle'), 1200);

    // buildAuthenticatedProfile above only ever reads session.read() -- the
    // session's own LOCAL kernel mirror, hydrated once at open()/claim()
    // and never re-synced after -- so it can lag or simply miss whatever
    // the namespace's real, current name/email/phone/claim time actually
    // is (changed from another tab/device, or never mirrored into THIS
    // session at all). That local snapshot is still what renders instantly
    // above, unchanged -- this is a background refinement, not a
    // replacement: a genuine, disclosure-checked readConfirmed() against
    // the namespace's own monad, and only if it resolves to something
    // actually different does the caller hear about it again. Best-effort
    // by construction (readConfirmed is optional on SeedSession, and any
    // single field can fail independently) -- a namespace/session that
    // can't answer just leaves the already-applied local profile as final.
    const { session, action } = args;
    const readConfirmed = session.readConfirmed;
    if (typeof readConfirmed === 'function') {
      void (async () => {
        const [confirmedName, confirmedEmail, confirmedPhone, confirmedClaimedAt] = await Promise.all([
          readConfirmed<string>('name').catch(() => undefined),
          readConfirmed<string>('email').catch(() => undefined),
          readConfirmed<string>('phone').catch(() => undefined),
          readConfirmed<number>('auth.claimed_at').catch(() => undefined),
        ]);
        const refinedProfile: CleakerProfileSnapshot = {
          ...nextProfile,
          name: cleanString(confirmedName) || nextProfile.name,
          email: cleanString(confirmedEmail) || nextProfile.email,
          phone: cleanString(confirmedPhone) || nextProfile.phone,
          claimedAt: toTimestamp(confirmedClaimedAt) || nextProfile.claimedAt,
        };
        const changed = refinedProfile.name !== nextProfile.name
          || refinedProfile.email !== nextProfile.email
          || refinedProfile.phone !== nextProfile.phone
          || refinedProfile.claimedAt !== nextProfile.claimedAt;
        if (changed) onAuthenticated?.(refinedProfile, action);
      })();
    }

    return nextProfile;
  }, [activeProfile, identityNamespace, onAuthenticated, onViewModeChange]);

  const handleMonadFailure = useCallback((error: unknown, fallbackHandle: string) => {
    const code = getMonadErrorCode(error);
    const message = humanizeCleakerError(code, {
      namespaceSeedHandle,
      exampleHandle: fallbackHandle,
    });

    if (code === 'CLAIM_NOT_FOUND') {
      setClaimResolution('unclaimed');
    } else if (
      code === 'CLAIM_VERIFICATION_FAILED' ||
      code === 'NOISE_DECRYPT_FAILED' ||
      code === 'IDENTITY_MISMATCH'
    ) {
      setClaimResolution('locked');
    } else if (code === 'NAMESPACE_TAKEN') {
      setClaimResolution('openable');
    } else {
      setClaimResolution('error');
    }

    setAuthStatus('error');
    setAuthError(message);
    return false;
  }, [namespaceSeedHandle]);

  const handleCleak = useCallback(async (requestedAction: AuthAction) => {
    const { value, error } = validateUsername(username);

    if (!value || error) {
      setAuthStatus('error');
      setAuthError(error || 'Invalid username');
      return false;
    }

    if (!secret) {
      setAuthStatus('error');
      setAuthError('Password is required');
      return false;
    }

    // ── Gateway-first path: stateless per-request Ed25519 signature ────────────
    //
    // Flow (no monad server needed, no JWT):
    //   1. GET /me/gateway  → { hostname }
    //        nginx returns the physical hostname (e.g. "suis-macbook-air.local")
    //        This IS the namespace — not the virtual alias "local.netget".
    //   2. cleaker(me, hostname) — bind identity to this physical machine.
    //        Cleaker holds the derived Ed25519 key (NOT the secret).
    //   3. signedFetch('/check-auth') — first signed request verifies the identity.
    //        X-Me-Proof: base64url(JSON.stringify(prove({ rootNamespace, challenge })))
    //        where challenge = canonicalJson({ method, nonce, path, timestamp })
    //        Lua verifies: method/path match, timestamp fresh, nonce unused, sig valid.
    //   4. On success: store node in cleakerNodeRef for all future requests.
    //        No cookie. No JWT. Cleaker IS the session.
    //
    // Secret never leaves the browser. Key is ephemeral — cleared on logout/sleep.
    if (typeof window !== 'undefined') {
      try {
        // Step 1 — get physical hostname from gateway
        const hostname = await fetchGatewayHostname();
        if (hostname) {
            setAuthStatus('checking');
            setAuthAction(requestedAction);
            setClaimResolution('checking');

            try {
              // Step 2 — seed me + bind to physical hostname via cleaker
              const node = deriveCleakerNode(value, secret, hostname);

              // Temporarily store for signedFetch
              cleakerNodeRef.current    = node;
              gatewayHostnameRef.current = hostname;

              // Step 3 — verify identity with a signed request
              const checkRes = await signedFetch('/check-auth');

              if (checkRes.ok) {
                const data = await checkRes.json().catch(() => ({}));
                if (data.authenticated) {
                  // Notify external listeners — include full session fields so the
                  // receiver doesn't need to make a second /me/auth call.
                  if (data.identityHash) {
                    window.dispatchEvent(
                      new CustomEvent('cleaker:gateway-pre-auth', {
                        detail: {
                          identityHash: data.identityHash,
                          username:     value,
                          isOwner:      Boolean(data.isOwner),
                          isAdmin:      Boolean(data.isAdmin),
                          scopes:       Array.isArray(data.scopes) ? data.scopes : [],
                          gatewayId:    typeof data.gatewayId === 'string' ? data.gatewayId : '',
                        },
                      }),
                    );
                  }

                  // Read profile fields from the monad kernel (persisted at claim time)
                  let monadName  = activeProfile.name;
                  let monadEmail = activeProfile.email;
                  let monadPhone = activeProfile.phone;
                  try {
                    // Read via NRP path @username/field — monad resolves to username.hostname namespace.
                    // X-Me-Proof works on GETs (no LOCAL_MONADS_CONTROL_ONLY issue).
                    const base = `https://${hostname}/@${value}`;
                    const proofForRead = await (cleakerNodeRef.current as any)?.prove?.({ rootNamespace: hostname, challenge: canonicalJson({ method: 'GET', nonce: genNonce(), path: `/@${value}/`, timestamp: Date.now() }) });
                    const readProofB64 = proofForRead ? btoa(JSON.stringify(proofForRead)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '') : '';
                    const readHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
                    if (readProofB64) readHeaders['X-Me-Proof'] = readProofB64;
                    const [rName, rEmail, rPhone] = await Promise.all([
                      fetch(`${base}/me/name`, { headers: readHeaders }).then(r => r.ok ? r.json() : null).catch(() => null),
                      fetch(`${base}/me/email/primary`, { headers: readHeaders }).then(r => r.ok ? r.json() : null).catch(() => null),
                      fetch(`${base}/me/phone/primary`, { headers: readHeaders }).then(r => r.ok ? r.json() : null).catch(() => null),
                    ]);
                    if (rName?.value)  monadName  = String(rName.value);
                    if (rEmail?.value) monadEmail = String(rEmail.value);
                    if (rPhone?.value) monadPhone = String(rPhone.value);
                  } catch { /* non-fatal — fall back to activeProfile */ }

                  const gatewayProfile: CleakerProfileSnapshot = {
                    username:  value,
                    name:      monadName,
                    email:     monadEmail,
                    phone:     monadPhone,
                    namespace: `${value}.${hostname}`,
                    claimedAt: activeProfile.claimedAt ?? Date.now(),
                  };
                  setUsernameState(value);
                  setClaimResolution('openable');
                  setAuthStatus('ok');
                  setAuthAction(requestedAction);
                  setAuthError(null);
                  onAuthenticated?.(gatewayProfile, requestedAction);
                  onViewModeChange?.('profile');
                  window.setTimeout(() => setAuthStatus('idle'), 1200);
                  return true;
                }
              } else {
                // Gateway returned an error — parse before deciding how to proceed
                const errBody = await checkRes.json().catch(() => ({}));
                const errCode = typeof errBody?.error === 'string' ? errBody.error : '';
                cleakerNodeRef.current     = null;
                gatewayHostnameRef.current = '';

                if (checkRes.status === 503 && errCode === 'GATEWAY_NOT_CLAIMED') {
                  setAuthStatus('error');
                  setAuthError('Gateway not yet claimed. Run `netget claim` in the terminal first.');
                  setClaimResolution('unclaimed');
                  return false;
                }

                if (
                  errCode === 'SIGNATURE_INVALID' ||
                  errCode === 'PUBKEY_MISMATCH' ||
                  errCode === 'IDENTITY_NOT_AUTHORISED'
                ) {
                  setAuthStatus('error');
                  setAuthError('Wrong password or identity not registered on this gateway.');
                  setClaimResolution('locked');
                  return false;
                }
                // Other errors (timestamp skew, path mismatch, etc.) → fall through to monad
              }

              // Pubkey ok but not authenticated, or non-terminal error → fall through
              cleakerNodeRef.current    = null;
              gatewayHostnameRef.current = '';
            } catch {
              cleakerNodeRef.current    = null;
              gatewayHostnameRef.current = '';
              // prove() or network error → fall through to monad
            }

            setAuthStatus('idle');
            setClaimResolution('idle');
          }
        // /me/gateway not reachable → fall through to monad
      } catch {
        // fetch failed → go straight to monad
      }
    }

    if (!actionBaseUrl) {
      setAuthStatus('error');
      setAuthError('No Monad host available');
      return false;
    }

    setAuthStatus('checking');
    setAuthAction(requestedAction);
    setAuthError(null);
    setClaimResolution('checking');

    try {
      const nextSession = await loginWithSeed({
        seed: secret,
        namespace: `${value}.${namespaceSeedHandle}`,
        transportOrigin: actionBaseUrl,
        autoOpen: true,
      });

      applyAuthenticatedProfile({
        session: nextSession,
        fallbackUsername: value,
        action: requestedAction,
        nextSecret: secret,
      });
      return true;
    } catch (error) {
      return handleMonadFailure(error, value);
    }
  }, [
    actionBaseUrl,
    activeProfile,
    applyAuthenticatedProfile,
    handleMonadFailure,
    loginWithSeed,
    namespaceSeedHandle,
    onAuthenticated,
    onViewModeChange,
    secret,
    username,
    validateUsername,
  ]);

  const handleSignUpSubmit = useCallback(async (input: CleakerSignUpSubmitInput) => {
    // Monad claim first, gateway claim second — reversed from the old
    // order. The monad claim is who OWNS this namespace's data; the
    // gateway claim (POST /me/claim, below) is who SERVES this hostname —
    // a legitimately separate registry, but one that must never be
    // established for a namespace whose data claim didn't actually
    // succeed, or a hostname ends up routed to data that isn't the
    // claiming identity's. If the monad claim fails, this throws and the
    // gateway is never touched.
    const validated = validateUsername(input.username);

    if (!validated.value || validated.error) {
      setAuthStatus('error');
      setAuthError(validated.error || 'Invalid username');
      return false;
    }

    setAuthStatus('checking');
    setAuthAction('claim');
    setAuthError(null);
    setClaimResolution('checking');

    try {
      // Step 1 — get physical hostname (namespace anchor)
      // fetchGatewayHostname() throws its own distinct message for
      // "unreachable" vs. "reachable but no hostname" — let it propagate.
      const hostname = await fetchGatewayHostname();

      // Step 2 — derive keypair from credentials
      const node = deriveCleakerNode(validated.value, input.password, hostname);
      const userNamespace = `${validated.value}.${hostname}`;

      // Step 3 — claim the namespace on the MONAD first, via POST /claims
      // (claimNamespace() + seedClaimNamespaceSemantics() — see that
      // function's own comment in claim/claimSemantics.ts). The claim
      // IS the genesis write: it verifies the proof, records the real
      // claim, and seeds me.name/me.email.primary/me.phone.primary
      // atomically as part of the SAME internal write. There is no
      // separate profile-write step after this — writing name/email/
      // phone by hand here (the old step 5b) was an unsigned write to an
      // unclaimed namespace, exactly the bypass this replaces.
      //
      // A distinct proof per destination: this challenge is bound to
      // path:"/claims" specifically (own nonce, own timestamp), never the
      // same proof /me/claim below builds for its own path — one can't
      // be replayed as the other.
      const claimNonce     = genNonce();
      const claimTimestamp = Date.now();
      const claimChallenge = canonicalJson({ method: 'POST', nonce: claimNonce, path: '/claims', timestamp: claimTimestamp });
      const claimProof     = await (node as any).prove({ rootNamespace: hostname, challenge: claimChallenge });

      const monadClaimRes = await fetch(`https://${hostname}/claims`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          namespace: userNamespace,
          // No secret and no privateKey: claimNamespace() authorizes purely
          // from the signed proof now (its own signature over identityHash/
          // namespace/rootNamespace, verified against the proof's own
          // publicKey) — a shared secret used to also travel here, but it
          // was the exact same material the signing key itself derives
          // from, so sending it leaked key-deriving material for no
          // security gain. See typedocs/Architecture/Identity-Namespace-
          // Recovery-Audit.md §12 item 7 (modules/monad's typedocs).
          proof: claimProof,
          username: validated.value,
          name: input.fullName || '',
          email: input.email || '',
          phone: input.phone || '',
        }),
      });
      const monadClaimData = await monadClaimRes.json().catch(() => ({}));
      if (!monadClaimRes.ok) {
        const code = monadClaimData?.error ?? String(monadClaimRes.status);
        throw new Error(`Namespace claim failed (${code})`);
      }

      // Step 4 — gateway-native claim (routing trust), only now that the
      // monad claim above has actually succeeded. Own proof, own destination.
      const gwNonce     = genNonce();
      const gwTimestamp = Date.now();
      const gwChallenge = canonicalJson({ method: 'POST', nonce: gwNonce, path: '/me/claim', timestamp: gwTimestamp });
      const gwProof      = await (node as any).prove({ rootNamespace: hostname, challenge: gwChallenge });
      const gwProofB64  = btoa(JSON.stringify(gwProof))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

      const claimRes = await fetch('/me/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proof: gwProofB64,
          username: validated.value,
          name: input.fullName || '',
          email: input.email || '',
          phone: input.phone || '',
        }),
      });

      const claimData = await claimRes.json().catch(() => ({}));
      if (!claimRes.ok || !claimData.success) {
        const code = claimData.error ?? String(claimRes.status);
        if (code === 'GATEWAY_ALREADY_CLAIMED') {
          throw new Error('This gateway is still using the old owner-only claim policy. Reload or update NetGet, then try again.');
        }
        throw new Error(claimData.message ?? `Gateway claim failed (${code})`);
      }

      // Step 5 — store session, signal authenticated
      cleakerNodeRef.current     = node;
      gatewayHostnameRef.current = hostname;

      const claimedProfile: CleakerProfileSnapshot = {
        username:  validated.value,
        name:      input.fullName || activeProfile.name,
        email:     input.email    || activeProfile.email,
        phone:     input.phone    || activeProfile.phone,
        namespace: userNamespace,
        claimedAt: Date.now(),
      };
      setUsernameState(validated.value);
      setClaimResolution('openable');
      setAuthStatus('ok');
      setAuthAction('claim');
      setAuthError(null);
      onAuthenticated?.(claimedProfile, 'claim');
      onViewModeChange?.('profile');
      window.setTimeout(() => setAuthStatus('idle'), 1200);
      return true;
    } catch (error) {
      setAuthStatus('idle');
      setClaimResolution('idle');
      cleakerNodeRef.current     = null;
      gatewayHostnameRef.current = '';
      throw new Error(error instanceof Error ? error.message : String(error));
    }
  }, [
    activeProfile,
    canonicalJson,
    genNonce,
    onAuthenticated,
    onViewModeChange,
    validateUsername,
  ]);

  const signUp = useCleakerSignUp({
    username,
    secret,
    validateUsername,
    onSubmit: handleSignUpSubmit,
  });

  const {
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
    handleRegisterSubmit,
  } = signUp;

  const handleLogout = useCallback(() => {
    logout();
    // Discard the derived key — Cleaker session ends here.
    // Without the key, signedFetch falls back to plain fetch → 401 on protected routes.
    cleakerNodeRef.current    = null;
    gatewayHostnameRef.current = '';
    setUsernameState('');
    setSecretState('');
    closeRegisterModal();
    setShowSecret(false);
    setAuthAction('claim');
    setAuthStatus('idle');
    setAuthError(null);
    setClaimResolution('idle');
    onViewModeChange?.('login');
  }, [closeRegisterModal, logout, onViewModeChange]);

  const claimResolutionNote = useMemo(() => {
    if (claimResolution === 'locked') {
      return `Password did not unlock ${actionTargetLabel}.`;
    }
    if (claimResolution === 'error') {
      return `Could not verify claim state on ${actionTargetLabel}.`;
    }
    return '';
  }, [actionTargetLabel, claimResolution]);

  const authSuccessMessage = authAction === 'open'
    ? `Logged in on ${actionTargetLabel}.`
    : `Claimed on ${actionTargetLabel}.`;

  const authProgressMessage = authAction === 'open'
    ? `Logging into ${identityNamespace} on ${actionTargetLabel}...`
    : `Claiming ${identityNamespace} on ${actionTargetLabel}...`;

  return {
    username,
    setUsername,
    usernameError,
    normalizedUsername,
    validateUsername,
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
    sessionAuthenticated: authenticated,
    bootstrapInfo,
    handleCleak,
    handleRegisterSubmit,
    handleLogout,
    authSuccessMessage,
    authProgressMessage,
    signedFetch,
  };
}

export default useCleakerAuth;
