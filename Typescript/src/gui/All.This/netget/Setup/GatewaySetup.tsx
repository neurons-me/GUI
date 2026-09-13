// GatewaySetup.tsx — one setup process, driven through SetupPhase
// (setupState.ts), with the browser as one of its two interfaces (the CLI
// — `netget init` / `netget claim` — is the other, sharing the same
// states and the same real actions; connecting them is future work, not
// this file's job). This replaces the earlier, narrower UnclaimedGateway
// screen, which only modeled "unclaimed vs claimed" — the real process
// has more states than that (see setupState.ts's SetupPhase), and a
// browser visitor claiming ownership needs to be a real, safe path here,
// not just a pointer to a terminal.
//
// Why a browser claim is safe now, when it deliberately wasn't before:
// the earlier version of this screen refused to let a browser claim a
// gateway at all — reasonably, since an unclaimed gateway reachable from
// the LAN (see project notes: nginx's admin server block listens on all
// interfaces, no IP restriction — Express's own loopback bind doesn't
// protect against nginx proxying a LAN request to it) would otherwise let
// whichever browser gets there FIRST become permanent owner. The setup
// code closes that hole: it's shown only where `netget init`/`netget
// claim` runs (a terminal on THIS machine, or wherever an operator with
// real access to it chose to relay it), so entering it in a browser is
// itself the proof of the same machine access a CLI claim would need —
// not a weaker substitute for it.
//
// The real actions this component needs are REQUIRED props, on purpose,
// with no built-in fallback: this component must never be able to reach
// "Claimed" on its own by faking success — a mount that forgets to wire
// one is a type error, not a silent mock. The real implementation is
// netgetSetupClient.ts (against gatewaySetupSession.ts's /setup/* routes
// — the same functions the CLI's bootstrapWizard.cli.ts calls in-process);
// permissive mocks exist ONLY in GatewaySetup.stories.tsx, never here.
//
// Signing does NOT happen in this component, or anywhere on this origin.
// local.netget and the Cleaker origin that actually holds the claimant's
// keychain (localStorage, strictly origin-scoped) are different origins —
// no shared React context or backend bridges that. So once a setup code
// is accepted and a challenge issued, this screen hands off to a
// dedicated "sign this claim" view living ON that Cleaker origin (see
// CleakerNetgetClaimView in CleakerLanding.tsx) via a full-page redirect,
// and picks the flow back up when the browser returns carrying a signed
// proof — never the private key or any unlock passphrase — as URL params.
import * as React from 'react';
import { Box, Typography } from '@/gui/Atoms';
import NetGetMark from '../NetGetMark';
import {
  blockingDependency,
  type ClaimReturnProof,
  type DependencyState,
  type DependencyStatus,
  type SetupPhase,
} from './setupState';

export interface ActionResult {
  ok: boolean;
  message?: string;
}

export interface SetupCodeResult extends ActionResult {
  gatewayId?: string;
  challenge?: string;
  /** Anti mix-up token — see gatewaySetupSession.ts's SetupSessionRecord
   *  doc comment. Carried through the Cleaker redirect (as a URL param,
   *  never part of what gets signed) and must come back unchanged for
   *  the claim to be accepted. */
  state?: string;
  /** Round-tripped through the Cleaker redirect's `returnTo` URL so this
   *  screen can resume the same setup session when the browser comes
   *  back — session state lives server-side, keyed by this. */
  setupToken?: string;
}

export interface GatewaySetupProps {
  /** This netget's own backend base URL (same origin frontend_local is
   *  served from, e.g. "http://local.netget") — not a monad. */
  endpoint: string;
  pollIntervalMs?: number;
  /** Verifies a setup code shown by `netget init`/`netget claim`, and
   *  issues the one-shot claim challenge in the same step — against
   *  gatewaySetupSession.ts (via netgetSetupClient.ts in production; a
   *  story supplies its own mock — see this file's header comment). */
  onSubmitSetupCode: (code: string) => Promise<SetupCodeResult>;
  /** Verifies a setup code WITHOUT issuing a claim challenge — a lighter
   *  proof-of-access check than onSubmitSetupCode, usable from the
   *  dependencies-required screen (reachable before the gateway is even
   *  installable, let alone claimable) to unlock the real "Install
   *  OpenResty" action. Optional: when absent, that screen falls back to
   *  terminal instructions only, no button — a story/older consumer isn't
   *  forced to wire this. */
  onVerifySetupCode?: (code: string) => Promise<{ ok: boolean; setupToken?: string; message?: string }>;
  /** Resolves the URL of the Cleaker-origin "sign this claim" view to
   *  redirect to — reads the CONFIGURED namespace root (never a hardcoded
   *  "local.cleaker"), so this works whatever this gateway's own identity
   *  surface is actually set to. */
  resolveCleakerClaimUrl: (input: { gatewayId: string; challenge: string; state: string; returnTo: string }) => Promise<string>;
  /** Submits the signed proof returned from the Cleaker-origin view to
   *  gatewaySetupSession.ts's /setup/claim for server-side verification. */
  onCommitClaim: (proof: ClaimReturnProof, setupToken: string) => Promise<ActionResult & { ownerUsername?: string }>;
  /** Story/test-only: seeds the starting phase instead of always starting
   *  at "checking" — every phase is otherwise fully determined by what
   *  the first poll finds or what the URL carries on return from Cleaker.
   *  A real consumer never sets this. */
  initialPhase?: SetupPhase;
  sx?: any;
}

type FetchedState = {
  ownerUsername: string | null;
  bootstrapped: boolean;
  dependencies: DependencyStatus[];
};

const EMPTY_FETCHED: FetchedState = {
  ownerUsername: null,
  bootstrapped: false,
  dependencies: [],
};

async function fetchJson(base: string, path: string): Promise<any | null> {
  try {
    const res = await fetch(`${base}${path}`, { cache: 'no-store', credentials: 'same-origin' });
    if (!res.ok) return null;
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// "Gateway backend reachable" must show the entry point this screen is
// actually reaching it through (e.g. "local.netget") — not
// identity.gatewayId (os.hostname(), e.g. "suis-macbook-air.local"). That
// distinction matters for the same reason MainServerView.tsx keeps Host
// and Namespace as separate fields, never one collapsed into the other.
function displayEntryPoint(endpoint: string): string {
  return String(endpoint || '').trim().replace(/^https?:\/\//, '').replace(/\/+$/, '');
}

// ─── Small shared pieces ──────────────────────────────────────────────────

function StatusDot({ state }: { state: DependencyState | boolean }) {
  const resolved: DependencyState = typeof state === 'boolean' ? (state ? 'ready' : 'not-ready') : state;
  const color =
    resolved === 'ready' ? 'success.main' :
    resolved === 'not-ready' ? 'error.main' :
    'text.disabled';
  return (
    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: color, flexShrink: 0 }} />
  );
}

function DependencyRow({ status }: { status: DependencyStatus }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
      <StatusDot state={status.state} />
      <Typography variant="body2" sx={{ flex: 1 }}>{status.label}</Typography>
      <Typography variant="caption" sx={{ color: 'text.disabled', fontFamily: 'monospace' }}>
        {status.detail ?? (status.state === 'unknown' ? 'not yet reported' : undefined)}
      </Typography>
    </Box>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <Box
      sx={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 1.25,
        p: 1.75,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        boxSizing: 'border-box',
      }}
    >
      {children}
    </Box>
  );
}

function TerminalSnippet({ children }: { children: React.ReactNode }) {
  return (
    <Box
      sx={{
        px: 1.5, py: 1,
        borderRadius: 1.5,
        bgcolor: '#0b0d12',
        fontFamily: 'monospace',
        fontSize: '0.875rem',
        color: '#8fb3ff',
        whiteSpace: 'pre-wrap',
      }}
    >
      {children}
    </Box>
  );
}

function PrimaryButton({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      disabled={disabled}
      sx={{
        width: '100%',
        py: 1.1,
        borderRadius: 1.5,
        border: 'none',
        bgcolor: disabled ? 'action.disabledBackground' : 'primary.main',
        color: disabled ? 'text.disabled' : 'primary.contrastText',
        fontWeight: 700,
        fontSize: '0.9rem',
        cursor: disabled ? 'default' : 'pointer',
        boxSizing: 'border-box',
        '&:hover': disabled ? {} : { filter: 'brightness(1.08)' },
      }}
    >
      {children}
    </Box>
  );
}

function TextField({
  label, value, onChange, type = 'text', autoFocus,
}: { label: string; value: string; onChange: (v: string) => void; type?: string; autoFocus?: boolean }) {
  // A caption sitting next to an <input> with no programmatic link is not
  // a label — a screen reader (and getByLabelText, which checks the same
  // real association, not just visual proximity) can't connect the two
  // without a matching htmlFor/id.
  const inputId = React.useId();
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
      <Typography component="label" htmlFor={inputId} variant="caption" sx={{ color: 'text.secondary' }}>{label}</Typography>
      <Box
        component="input"
        id={inputId}
        type={type}
        value={value}
        autoFocus={autoFocus}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        sx={{
          width: '100%',
          boxSizing: 'border-box',
          px: 1.25, py: 1,
          borderRadius: 1.25,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.default',
          color: 'text.primary',
          fontSize: '0.9rem',
          fontFamily: type === 'password' ? 'inherit' : 'monospace',
          outline: 'none',
          '&:focus': { borderColor: 'primary.main' },
        }}
      />
    </Box>
  );
}

// One real install action exists today: `brew install openresty/brew/openresty`
// on macOS, when Homebrew is already usable by this process's user — no
// sudo, nothing that could hang this screen waiting on a password prompt
// (see openRestyInstallJob.ts's own header for exactly why that's the
// only safe one). Everything else (starting OpenResty at all — even
// without installing it as a service — needs root to bind :80/:443)
// stays a terminal step; this control shows that as plain text, never as
// a button that would just fail or hang.
function OpenRestyInstallControl({
  endpoint,
  onVerifySetupCode,
}: {
  endpoint: string;
  onVerifySetupCode?: (code: string) => Promise<{ ok: boolean; setupToken?: string; message?: string }>;
}) {
  const base = String(endpoint || '').replace(/\/+$/, '');
  const [setupToken, setSetupToken] = React.useState<string | null>(null);
  const [codeInput, setCodeInput] = React.useState('');
  const [codeError, setCodeError] = React.useState<string | null>(null);
  const [verifying, setVerifying] = React.useState(false);
  const [availability, setAvailability] = React.useState<{ available: boolean; reason: string; terminalInstructions?: string } | null>(null);
  const [job, setJob] = React.useState<{ status: string; log: string[]; message: string | null } | null>(null);
  const [actionError, setActionError] = React.useState<string | null>(null);

  const authHeaders = React.useCallback((): Record<string, string> => (
    setupToken ? { 'x-netget-setup-token': setupToken } : {}
  ), [setupToken]);

  // Availability depends only on THIS machine's own state (platform,
  // Homebrew, prefix permissions) — check once per unlocked token, not on
  // every render.
  React.useEffect(() => {
    if (!setupToken) return;
    let cancelled = false;
    fetch(`${base}/openresty/install/availability`, { headers: authHeaders(), credentials: 'same-origin' })
      .then((r) => r.json())
      .then((data) => { if (!cancelled) setAvailability(data); })
      .catch(() => { if (!cancelled) setAvailability({ available: false, reason: 'Could not check install availability from this screen.' }); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setupToken, base]);

  // Poll progress only while a job is actually running — the whole reason
  // a reload can "recover" progress instead of losing it: the job lives
  // server-side (openRestyInstallJob.ts), this is just re-reading it.
  React.useEffect(() => {
    if (!setupToken || !job || job.status !== 'running') return;
    let cancelled = false;
    const timer = setInterval(() => {
      fetch(`${base}/openresty/install/progress`, { headers: authHeaders(), credentials: 'same-origin' })
        .then((r) => r.json())
        .then((data) => { if (!cancelled && data?.job) setJob(data.job); })
        .catch(() => {});
    }, 1500);
    return () => { cancelled = true; clearInterval(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setupToken, job?.status, base]);

  async function handleVerifyCode() {
    if (!onVerifySetupCode) return;
    setVerifying(true);
    setCodeError(null);
    try {
      const result = await onVerifySetupCode(codeInput.trim());
      if (result.ok && result.setupToken) {
        setSetupToken(result.setupToken);
      } else {
        setCodeError(result.message || 'Incorrect code.');
      }
    } finally {
      setVerifying(false);
    }
  }

  async function handleInstall() {
    setActionError(null);
    try {
      const res = await fetch(`${base}/openresty/install`, {
        method: 'POST',
        headers: authHeaders(),
        credentials: 'same-origin',
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        setActionError(data?.message || data?.error || 'Could not start the install.');
        return;
      }
      setJob(data.job);
    } catch {
      setActionError('Could not reach this gateway to start the install.');
    }
  }

  if (!setupToken) {
    if (!onVerifySetupCode) return null;
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          Enter your setup code to let this screen install OpenResty for you.
        </Typography>
        <TextField label="Setup code" value={codeInput} onChange={setCodeInput} />
        {codeError && <Typography variant="caption" sx={{ color: 'error.main' }}>{codeError}</Typography>}
        <PrimaryButton onClick={handleVerifyCode} disabled={verifying || !codeInput.trim()}>
          {verifying ? 'Checking…' : 'Unlock automatic install'}
        </PrimaryButton>
      </Box>
    );
  }

  if (job?.status === 'running') {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>Installing OpenResty via Homebrew…</Typography>
        <TerminalSnippet>{job.log.slice(-6).join('\n') || 'Starting…'}</TerminalSnippet>
      </Box>
    );
  }
  if (job?.status === 'success') {
    return (
      <Typography variant="caption" sx={{ color: 'success.main' }}>
        {job.message || 'Installed.'} This screen re-checks on its own next poll.
      </Typography>
    );
  }
  if (job?.status === 'error') {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Typography variant="caption" sx={{ color: 'error.main' }}>{job.message || 'The install failed.'}</Typography>
        <TerminalSnippet>{job.log.slice(-6).join('\n')}</TerminalSnippet>
        <PrimaryButton onClick={handleInstall}>Try again</PrimaryButton>
      </Box>
    );
  }

  if (!availability) {
    return <Typography variant="caption" sx={{ color: 'text.disabled' }}>Checking whether this screen can install it for you…</Typography>;
  }

  if (!availability.available) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>{availability.reason}</Typography>
        {availability.terminalInstructions && <TerminalSnippet>{availability.terminalInstructions}</TerminalSnippet>}
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {actionError && <Typography variant="caption" sx={{ color: 'error.main' }}>{actionError}</Typography>}
      <PrimaryButton onClick={handleInstall}>Install OpenResty</PrimaryButton>
    </Box>
  );
}

// ─── Main component ────────────────────────────────────────────────────────

// Reads the signed proof + setupToken back off netget's own URL (the
// Cleaker-origin view appends these to `returnTo` before redirecting
// back) and strips them so a page refresh can't resubmit the same claim.
function consumeReturnedClaim(): { proof: ClaimReturnProof; setupToken: string } | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const namespace = params.get('namespace');
  const identityHash = params.get('identityHash');
  const keyId = params.get('keyId');
  const signature = params.get('signature');
  const timestamp = params.get('timestamp');
  const state = params.get('state');
  const setupToken = params.get('setupToken');
  if (!namespace || !identityHash || !keyId || !signature || !timestamp || !state || !setupToken) return null;

  ['namespace', 'identityHash', 'keyId', 'signature', 'timestamp', 'state', 'setupToken'].forEach((k) => params.delete(k));
  const nextSearch = params.toString();
  const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ''}${window.location.hash}`;
  window.history.replaceState(null, '', nextUrl);

  return {
    proof: { namespace, identityHash, keyId, signature, timestamp: Number(timestamp), state },
    setupToken,
  };
}

export default function GatewaySetup({
  endpoint,
  pollIntervalMs = 5000,
  onSubmitSetupCode,
  onVerifySetupCode,
  resolveCleakerClaimUrl,
  onCommitClaim,
  initialPhase,
  sx,
}: GatewaySetupProps) {
  const [fetched, setFetched] = React.useState<FetchedState>(EMPTY_FETCHED);
  const [phase, setPhase] = React.useState<SetupPhase>(initialPhase ?? 'checking');
  const [ownerUsername, setOwnerUsername] = React.useState<string | null>(null);
  const [claimError, setClaimError] = React.useState<string | null>(null);

  // Runs once, before the polling effect below gets a chance to decide a
  // phase from scratch — a returned claim takes priority over whatever
  // the poll would otherwise infer, since it's this exact page load's
  // whole reason for happening.
  React.useEffect(() => {
    const returned = consumeReturnedClaim();
    if (!returned) return;
    setPhase('finishing-claim');
    onCommitClaim(returned.proof, returned.setupToken).then((result) => {
      if (result.ok) {
        setOwnerUsername(result.ownerUsername ?? returned.proof.namespace.split('.')[0] ?? null);
        setPhase('claimed');
      } else {
        setClaimError(result.message || 'Could not complete the claim.');
        setPhase('unclaimed');
      }
    });
    // Intentionally run once on mount only — this reads window.location
    // exactly once, at the moment the browser returns from Cleaker.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    const base = String(endpoint || '').replace(/\/+$/, '');

    async function poll() {
      const identity = await fetchJson(base, '/gateway-identity');
      const openresty = await fetchJson(base, '/openresty-status');
      if (cancelled) return;

      if (!identity) {
        setPhase('unreachable');
        setFetched(EMPTY_FETCHED);
        return;
      }

      // Netget's own monad (ledger) has no live status endpoint today —
      // see this file's header comment and ledgerIdentity.ts's own new
      // failure modes (a corrupted/lost identity file now refuses to
      // start rather than silently substituting a different one, which
      // makes "is the ledger actually up" a real, not hypothetical,
      // question a future check here should answer). Reported `unknown`,
      // not guessed `ready` — see blockingDependency()'s doc comment for
      // why `unknown` must never gate this flow the way a confirmed
      // `not-ready` does.
      const dependencies: DependencyStatus[] = [
        {
          id: 'monad',
          label: 'Monad ledger',
          state: 'unknown',
          required: true,
        },
        {
          id: 'openresty',
          label: 'OpenResty',
          state: openresty ? (openresty.httpListening && openresty.httpsListening ? 'ready' : 'not-ready') : 'unknown',
          required: true,
          detail: openresty ? `http ${openresty.httpListening ? 'up' : 'down'} · https ${openresty.httpsListening ? 'up' : 'down'}` : undefined,
        },
      ];

      const bootstrapped = !!identity.bootstrapped;
      setFetched({
        ownerUsername: identity.ownerUsername ? String(identity.ownerUsername) : null,
        bootstrapped,
        dependencies,
      });

      if (bootstrapped) {
        setOwnerUsername(identity.ownerUsername ? String(identity.ownerUsername) : null);
        setPhase('claimed');
        return;
      }
      // Don't stomp on an in-progress claim (about to redirect, or just
      // back and finishing one) just because a poll landed mid-flow —
      // only (re)enter dependency/unclaimed states from the states that
      // precede them.
      setPhase((current) => {
        if (current === 'redirecting-to-sign' || current === 'finishing-claim') return current;
        return blockingDependency(dependencies) ? 'dependencies-required' : 'unclaimed';
      });
    }

    poll();
    const timer = setInterval(poll, pollIntervalMs);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [endpoint, pollIntervalMs]);

  const STATE_LABEL: Record<SetupPhase, string> = {
    checking: 'Checking…',
    unreachable: 'Unreachable',
    'dependencies-required': 'Setting Up',
    unclaimed: 'Unclaimed',
    'redirecting-to-sign': 'Redirecting to Sign',
    'finishing-claim': 'Finishing Claim',
    claimed: 'Claimed',
  };
  const STATE_COLOR: Record<SetupPhase, string> = {
    checking: 'text.disabled',
    unreachable: 'text.disabled',
    'dependencies-required': 'warning.main',
    unclaimed: 'warning.main',
    'redirecting-to-sign': 'info.main',
    'finishing-claim': 'info.main',
    claimed: 'success.main',
  };

  return (
    <Box
      data-gui-component="GatewaySetup"
      sx={{
        maxWidth: 440,
        mx: 'auto',
        p: { xs: 2, sm: 3 },
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        gap: 3,
        ...sx,
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
        <NetGetMark />
        <Typography
          variant="caption"
          sx={{ color: STATE_COLOR[phase], fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}
        >
          {STATE_LABEL[phase]}
        </Typography>
      </Box>

      {phase === 'unreachable' && (
        <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center' }}>
          Can't reach this gateway's own backend at {endpoint}. If you just installed netget,
          make sure its service is running.
        </Typography>
      )}

      {(phase === 'checking' || phase === 'dependencies-required' || phase === 'unclaimed') && (
        <Panel>
          <DependencyRow status={{ id: 'backend', label: 'Gateway backend reachable', state: phase === 'checking' ? 'unknown' : 'ready', required: true, detail: displayEntryPoint(endpoint) }} />
          {fetched.dependencies.map((d) => <DependencyRow key={d.id} status={d} />)}
          {phase !== 'checking' && (
            <DependencyRow status={{ id: 'owner', label: 'Owner claim', state: 'not-ready', required: false }} />
          )}
        </Panel>
      )}

      {phase === 'dependencies-required' && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            This gateway needs {blockingDependency(fetched.dependencies)?.label ?? 'something'} ready
            before it can be claimed.
          </Typography>
          {blockingDependency(fetched.dependencies)?.id === 'openresty' && (
            <OpenRestyInstallControl endpoint={endpoint} onVerifySetupCode={onVerifySetupCode} />
          )}
        </Box>
      )}

      {phase === 'unclaimed' && (
        <UnclaimedPanel
          onSubmitSetupCode={onSubmitSetupCode}
          resolveCleakerClaimUrl={resolveCleakerClaimUrl}
          onRedirecting={() => setPhase('redirecting-to-sign')}
          externalError={claimError}
        />
      )}

      {phase === 'redirecting-to-sign' && (
        <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center' }}>
          Redirecting you to sign in with your keychain…
        </Typography>
      )}

      {phase === 'finishing-claim' && (
        <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center' }}>
          Finishing the claim…
        </Typography>
      )}

      {phase === 'claimed' && (
        <ClaimedPanel ownerUsername={ownerUsername ?? fetched.ownerUsername} />
      )}
    </Box>
  );
}

// ─── Phase panels ───────────────────────────────────────────────────────────

function UnclaimedPanel({
  onSubmitSetupCode,
  resolveCleakerClaimUrl,
  onRedirecting,
  externalError,
}: {
  onSubmitSetupCode: (code: string) => Promise<SetupCodeResult>;
  resolveCleakerClaimUrl: (input: { gatewayId: string; challenge: string; state: string; returnTo: string }) => Promise<string>;
  onRedirecting: () => void;
  externalError: string | null;
}) {
  const [code, setCode] = React.useState('');
  const [error, setError] = React.useState<string | null>(externalError);
  const [busy, setBusy] = React.useState(false);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const result = await onSubmitSetupCode(code);
      if (!result.ok || !result.gatewayId || !result.challenge || !result.state || !result.setupToken) {
        setError(result.message || 'That setup code was not accepted.');
        return;
      }
      const returnTo = `${window.location.origin}${window.location.pathname}?setupToken=${encodeURIComponent(result.setupToken)}`;
      const claimUrl = await resolveCleakerClaimUrl({ gatewayId: result.gatewayId, challenge: result.challenge, state: result.state, returnTo });
      onRedirecting();
      window.location.href = claimUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start the claim.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 1.25 }}>
      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
        Nobody owns this gateway yet. To claim it here, enter the setup code shown when
        <code> netget init</code> (or <code>netget claim</code>) ran on this machine — that's
        what makes claiming from a browser as trustworthy as claiming from the terminal itself.
      </Typography>
      <TextField label="Setup code" value={code} onChange={setCode} autoFocus />
      {error && <Typography variant="caption" sx={{ color: 'error.main' }}>{error}</Typography>}
      <PrimaryButton onClick={submit} disabled={busy || !code.trim()}>
        {busy ? 'Checking…' : 'Continue'}
      </PrimaryButton>
      <Typography variant="caption" sx={{ color: 'text.disabled', textAlign: 'center' }}>
        Prefer the terminal? Run this instead — same result, no browser needed.
      </Typography>
      <TerminalSnippet>netget claim</TerminalSnippet>
    </Box>
  );
}

function ClaimedPanel({ ownerUsername }: { ownerUsername: string | null }) {
  const nextSteps = ['Configure the Main Server', 'Choose public domains (optional)', 'Register services & apps'];
  return (
    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center' }}>
        Claimed by {ownerUsername ? <strong>@{ownerUsername}</strong> : 'a .me identity'}. This
        gateway is set up.
      </Typography>
      <Panel>
        <Typography variant="subtitle2">Continue configuration</Typography>
        {nextSteps.map((step) => (
          <Box key={step} sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'text.disabled', flexShrink: 0 }} />
            <Typography variant="body2">{step}</Typography>
          </Box>
        ))}
      </Panel>
      {/* A real link, not a next-steps bullet — GatewaySetup doesn't own
          routing, so handing off to the actual dashboard is one click
          away rather than automatic. */}
      <Typography
        component="a"
        href="/home"
        variant="body2"
        sx={{ textAlign: 'center', color: 'primary.main', textDecoration: 'none', fontWeight: 600, '&:hover': { textDecoration: 'underline' } }}
      >
        Review status & controls →
      </Typography>
    </Box>
  );
}
