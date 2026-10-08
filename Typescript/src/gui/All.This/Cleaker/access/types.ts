import type { RuntimeAdapter } from '@/runtime/adapter';
import type { MeLike } from '@/react/types';

export type AccessScope = string;

export type AccessErrorCode =
  | 'INVALID_REQUEST'
  | 'NO_ACTIVE_SESSION'
  | 'CLAIM_REQUIRED'
  | 'CONFIRMATION_REQUIRED'
  | 'ACCESS_DENIED'
  | 'PIN_REQUIRED'
  | 'NO_SCOPES_GRANTED'
  | 'TOKEN_ISSUE_FAILED';

export type CanonicalProfileSnapshot = {
  username?: string | null;
  name?: string | null;
  avatar?: string | null;
  bio?: string | null;
  email?: string | null;
  phone?: string | null;
};

export type AccessRequest = {
  appName: string;
  requestedScopes: AccessScope[];
  reason?: string;
  requirePin?: boolean;
  ttlMs?: number;
};

export type NormalizedAccessRequest = {
  appName: string;
  requestedScopes: AccessScope[];
  reason: string;
  requirePin: boolean;
  ttlMs: number;
};

export type AccessResponse = {
  success: boolean;
  token?: string;
  expiresAt?: number;
  grantedScopes?: AccessScope[];
  deniedScopes?: AccessScope[];
  error?: string;
  code?: AccessErrorCode;
};

export type IssuedAccessToken = {
  value: string;
  expiresAt: number;
};

export type ResolvedCleakerSession = {
  username: string;
  profileUsername: string;
  namespace: string;
  claimedAt: number | null;
  identityHash: string;
  openedAt: number | null;
  authenticated: boolean;
  hasSession: boolean;
  isClaimed: boolean;
  viewMode: string;
};

export type AccessKernelContext = {
  me: MeLike;
  runtime?: RuntimeAdapter | null;
  now?: () => number;
};

export type AccessConfirmationInput = {
  request: NormalizedAccessRequest;
  session: ResolvedCleakerSession;
};

export type PinVerificationInput = {
  request: NormalizedAccessRequest;
  session: ResolvedCleakerSession;
};

export type ScopeValidationInput = {
  request: NormalizedAccessRequest;
  session: ResolvedCleakerSession;
  authKeys: Record<string, unknown> | null | undefined;
};

export type ScopeValidationResult = {
  grantedScopes: AccessScope[];
  deniedScopes?: AccessScope[];
};

export type TokenIssueInput = {
  request: NormalizedAccessRequest;
  session: ResolvedCleakerSession;
  grantedScopes: AccessScope[];
  issuedAt: number;
  expiresAt: number;
};

export type RequestAccessInput = AccessKernelContext & {
  request: AccessRequest;
  confirmAccess?: (input: AccessConfirmationInput) => boolean | Promise<boolean>;
  verifyPin?: (input: PinVerificationInput) => boolean | Promise<boolean>;
  validateScopes?: (input: ScopeValidationInput) => ScopeValidationResult | Promise<ScopeValidationResult>;
  issueToken?: (input: TokenIssueInput) => IssuedAccessToken | Promise<IssuedAccessToken>;
};

export type ClaimHandlerInput = AccessKernelContext & {
  username: string;
  namespace: string;
  profile?: CanonicalProfileSnapshot;
  claimedAt?: number;
  identityHash?: string | null;
  openedAt?: number | null;
  authenticated?: boolean;
};

export type ClaimHandlerResult = {
  success: boolean;
  username: string;
  namespace: string;
  claimedAt: number;
  authenticated: boolean;
  session: ResolvedCleakerSession;
};

export type OpenSessionInput = AccessKernelContext & {
  namespace: string;
  username?: string;
  identityHash?: string | null;
  openedAt?: number | null;
  authenticated?: boolean;
  viewMode?: 'login' | 'profile' | 'settings' | 'claim-surface';
};

export type OpenSessionResult = {
  success: boolean;
  session: ResolvedCleakerSession;
};

export type LogoutSessionInput = AccessKernelContext;

export type LogoutSessionResult = {
  success: boolean;
  clearedPaths: string[];
  session: ResolvedCleakerSession;
};

export type ResolveSessionInput = AccessKernelContext;
