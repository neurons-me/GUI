// LogsView.tsx — me.netget.mainserver.logs: the admin-only request/error
// terminal MainServerView.tsx's own header comment explicitly deferred
// ("nobody browsing it needs to see live request traffic; that belongs in
// an admin-only mainserver.logs, not here"). Ported from frontend_local's
// pages/Logs.jsx — same three log types (nginx access/error, server),
// same /logs?type=&limit=&offset= endpoint and response shape, same
// client-side level/method/search filtering — rebuilt with this package's
// own Box/Typography-based primitives (matching MainServerView.tsx's and
// GatewaySetup.tsx's own convention of hand-rolling controls rather than
// importing raw @mui/material widgets) instead of @mui/material's
// Table/Select/Chip/Pagination the original page used directly.
//
// Deliberately NOT ported: the domain-filter-via-router-navigation-state
// hookup (Logs.jsx reads location.state.domainFilter set by a Domains
// page's "view logs for this domain" link) — this component has no
// router dependency, so that integration point moves to whatever page
// mounts it, via the `initialSearch` prop, not into this file.
import * as React from 'react';
import { trustedCleakerOrigin } from '../Setup/trustedOrigin';
import { Box, Typography } from '@/gui/Atoms';

export type LogType = 'access' | 'error' | 'server';

export interface LogEntry {
  id: number | string;
  timestamp: string;
  level: string;
  method?: string;
  path?: string;
  status?: number;
  ip?: string;
  pid?: number;
  message: string;
  fullLine?: string;
}

export interface LogsViewProps {
  /** This netget's own base URL — same convention as MainServerView's
   *  `endpoint` (its own backend, not a monad). */
  endpoint: string;
  /** Seeds the search box — the hook a caller (e.g. a future Domains view)
   *  uses to link into "logs for this domain" without this component
   *  needing any router dependency of its own. */
  initialSearch?: string;
  pollIntervalMs?: number;
  sx?: any;
}

type LogsResponse = {
  logs: LogEntry[];
  total: number;
  fileSize?: string;
  truncated?: boolean;
  logType?: string;
};

const LEVELS = ['INFO', 'WARN', 'ERROR', 'DEBUG'];
const METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'];
const PAGE_SIZES = [25, 50, 100, 200];

function truncateText(text: string | undefined, maxLength = 50): string {
  if (!text) return '';
  return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text;
}

function formatTimestamp(timestamp: string): string {
  try {
    return new Date(timestamp).toLocaleString();
  } catch {
    return timestamp;
  }
}

function levelColor(level: string): string {
  switch (level) {
    case 'ERROR': return 'error.main';
    case 'WARN': return 'warning.main';
    case 'INFO': return 'info.main';
    default: return 'text.disabled';
  }
}

function statusColor(status: number | undefined): string {
  if (status == null) return 'text.disabled';
  if (status >= 500) return 'error.main';
  if (status >= 400) return 'warning.main';
  if (status >= 300) return 'info.main';
  if (status >= 200) return 'success.main';
  return 'text.disabled';
}

function Badge({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <Box
      component="span"
      sx={{
        display: 'inline-block',
        px: 0.75,
        py: 0.15,
        borderRadius: 1,
        fontSize: '0.7rem',
        fontFamily: 'monospace',
        fontWeight: 700,
        color,
        border: '1px solid',
        borderColor: color,
        lineHeight: 1.6,
      }}
    >
      {children}
    </Box>
  );
}

function ToolbarButton({ children, onClick, disabled, active }: { children: React.ReactNode; onClick: () => void; disabled?: boolean; active?: boolean }) {
  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      disabled={disabled}
      sx={{
        px: 1.25, py: 0.6,
        borderRadius: 1.25,
        border: '1px solid',
        borderColor: active ? 'primary.main' : 'divider',
        bgcolor: active ? 'primary.main' : 'transparent',
        color: disabled ? 'text.disabled' : active ? 'primary.contrastText' : 'text.primary',
        fontSize: '0.8rem',
        fontWeight: active ? 700 : 400,
        cursor: disabled ? 'default' : 'pointer',
        whiteSpace: 'nowrap',
        '&:hover': disabled ? {} : { borderColor: 'primary.main' },
      }}
    >
      {children}
    </Box>
  );
}

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  const inputId = React.useId();
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.4 }}>
      <Typography component="label" htmlFor={inputId} variant="caption" sx={{ color: 'text.secondary' }}>{label}</Typography>
      <Box
        component="select"
        id={inputId}
        value={value}
        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onChange(e.target.value)}
        sx={{
          px: 1, py: 0.65,
          borderRadius: 1.25,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.default',
          color: 'text.primary',
          fontSize: '0.8rem',
          fontFamily: 'monospace',
          minWidth: 100,
        }}
      >
        {options.map((opt) => (
          <option key={opt || '__all__'} value={opt}>{opt || 'All'}</option>
        ))}
      </Box>
    </Box>
  );
}

type FetchLogsResult =
  | { ok: true; data: LogsResponse }
  | { ok: false; unauthorized: boolean; message: string };

async function fetchLogs(base: string, params: URLSearchParams, sessionToken: string): Promise<FetchLogsResult> {
  try {
    const res = await fetch(`${base}/logs?${params.toString()}`, {
      cache: 'no-store',
      credentials: 'same-origin',
      headers: { authorization: `Bearer ${sessionToken}` },
    });
    if (res.status === 401) {
      return { ok: false, unauthorized: true, message: 'Your admin session has expired. Sign in again to keep viewing logs.' };
    }
    if (!res.ok) {
      return { ok: false, unauthorized: false, message: 'Could not reach this gateway to load logs.' };
    }
    return { ok: true, data: await res.json() };
  } catch {
    return { ok: false, unauthorized: false, message: 'Could not reach this gateway to load logs.' };
  }
}

const ADMIN_SESSION_STORAGE_KEY = 'netget:admin-session-token';

// Same "resolve local mesh values to local.cleaker" convention
// netgetSetupClient.ts's own resolveCleakerOrigin() uses -- duplicated
// here rather than imported since that function is file-local there (a
// deliberate choice per its own comments), not exported for reuse.
function isLocalMeshValue(value: string): boolean {
  const v = value.trim().toLowerCase();
  return v === 'localhost' || v === '127.0.0.1' || v === 'local' || v.startsWith('local.');
}

async function resolveCleakerOrigin(base: string): Promise<string> {
  try {
    const res = await fetch(`${base}/main-server-namespace`, { cache: 'no-store' });
    const body = await res.json().catch(() => null);
    const mainServerName = typeof body?.mainServerName === 'string' ? body.mainServerName.trim() : '';
    if (!mainServerName || isLocalMeshValue(mainServerName)) return 'http://local.cleaker';
    // Where a passphrase gets typed: an exact origin only (see Setup/trustedOrigin.ts).
    return trustedCleakerOrigin(mainServerName) ?? 'http://local.cleaker';
  } catch {
    return 'http://local.cleaker';
  }
}

const ADMIN_SIGN_IN_STATE_KEY = 'netget:admin-sign-in-state';

// Reads `adminSessionToken` back off the URL (CleakerNetgetAdminSignView
// appends it to `returnTo` before redirecting back) and strips it
// immediately -- same hygiene as GatewaySetup.tsx's consumeReturnedClaim,
// so a page refresh can't resubmit it and it never lingers in browser
// history. The token itself is opaque and short-lived (30 minutes,
// adminSession.ts), not a secret key -- still not something to leave
// sitting in a URL a moment longer than necessary, and still a real
// credential: `state` binds this SPECIFIC return to the SPECIFIC sign-in
// attempt this exact tab started (minted in handleSignIn, stashed in
// sessionStorage -- tab-scoped, unlike localStorage -- before ever
// leaving for Cleaker). A token arriving without the matching state is
// refused outright, not merely logged: it did not come back from the
// attempt this tab thinks it's waiting on.
function consumeReturnedAdminSessionToken(): string | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const token = params.get('adminSessionToken');
  if (!token) return null;
  const returnedState = params.get('state') || '';
  params.delete('adminSessionToken');
  params.delete('state');
  const nextSearch = params.toString();
  const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ''}${window.location.hash}`;
  window.history.replaceState(null, '', nextUrl);

  let expectedState: string | null = null;
  try {
    expectedState = window.sessionStorage.getItem(ADMIN_SIGN_IN_STATE_KEY);
    window.sessionStorage.removeItem(ADMIN_SIGN_IN_STATE_KEY);
  } catch { /* private mode, etc. -- falls through to the mismatch branch below */ }

  if (!expectedState || returnedState !== expectedState) {
    // eslint-disable-next-line no-console
    console.error('[LogsView] admin session token arrived without a matching state -- refusing it, not this tab\'s own sign-in attempt.');
    return null;
  }
  return token;
}

const COLUMNS: Record<LogType, string[]> = {
  access: ['Timestamp', 'Level', 'Method', 'Path', 'Status', 'IP'],
  error: ['Timestamp', 'Level', 'PID', 'Message'],
  server: ['Timestamp', 'Level', 'Method', 'Path'],
};

function LogRow({ log, logType }: { log: LogEntry; logType: LogType }) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        px: 1,
        py: 0.75,
        borderBottom: '1px solid',
        borderColor: 'divider',
        fontSize: '0.75rem',
        '&:hover': { bgcolor: 'action.hover' },
      }}
      title={log.fullLine || log.message}
    >
      <Typography variant="caption" sx={{ fontFamily: 'monospace', width: 168, flexShrink: 0 }}>
        {formatTimestamp(log.timestamp)}
      </Typography>
      <Box sx={{ width: 56, flexShrink: 0 }}><Badge color={levelColor(log.level)}>{log.level}</Badge></Box>
      {logType === 'access' && (
        <>
          <Box sx={{ width: 64, flexShrink: 0 }}>{log.method && <Badge color="primary.main">{log.method}</Badge>}</Box>
          <Typography variant="caption" sx={{ fontFamily: 'monospace', flex: '1 1 200px', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {truncateText(log.path, 40)}
          </Typography>
          <Box sx={{ width: 48, flexShrink: 0 }}>{log.status && <Badge color={statusColor(log.status)}>{log.status}</Badge>}</Box>
          <Typography variant="caption" sx={{ fontFamily: 'monospace', width: 110, flexShrink: 0, color: 'text.secondary' }}>
            {truncateText(log.ip, 15) || '—'}
          </Typography>
        </>
      )}
      {logType === 'error' && (
        <>
          <Typography variant="caption" sx={{ width: 56, flexShrink: 0, color: 'text.secondary' }}>{log.pid ?? '—'}</Typography>
          <Typography variant="caption" sx={{ fontFamily: 'monospace', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'text.secondary' }}>
            {truncateText(log.message, 90)}
          </Typography>
        </>
      )}
      {logType === 'server' && (
        <>
          <Box sx={{ width: 64, flexShrink: 0 }}>{log.method && <Badge color="primary.main">{log.method}</Badge>}</Box>
          <Typography variant="caption" sx={{ fontFamily: 'monospace', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {truncateText(log.path, 60)}
          </Typography>
        </>
      )}
    </Box>
  );
}

export default function LogsView({ endpoint, initialSearch = '', pollIntervalMs = 5000, sx }: LogsViewProps) {
  const base = String(endpoint || '').replace(/\/+$/, '');

  // Real auth, not a cosmetic gate: /logs (localNetget.js) rejects every
  // request here without a genuine admin-session bearer token — see
  // adminSession.ts. Consumed from the URL once (returning from signing),
  // then persisted so a reload doesn't force signing in again every time.
  const [sessionToken, setSessionToken] = React.useState<string | null>(() => {
    const fromUrl = consumeReturnedAdminSessionToken();
    if (fromUrl) {
      try { window.localStorage.setItem(ADMIN_SESSION_STORAGE_KEY, fromUrl); } catch { /* private mode, etc. */ }
      return fromUrl;
    }
    try { return window.localStorage.getItem(ADMIN_SESSION_STORAGE_KEY); } catch { return null; }
  });

  function clearSession() {
    setSessionToken(null);
    try { window.localStorage.removeItem(ADMIN_SESSION_STORAGE_KEY); } catch { /* ignore */ }
  }

  async function handleSignIn() {
    // Minted here, not by netget's backend or by Cleaker -- this is a
    // purely client-side anti-mix-up token (see consumeReturnedAdminSessionToken's
    // own comment): the only party that needs to recognize "this response
    // belongs to the attempt I started" is THIS tab, and sessionStorage is
    // already scoped to it.
    const state = (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    try { window.sessionStorage.setItem(ADMIN_SIGN_IN_STATE_KEY, state); } catch { /* private mode -- the returned token will then be refused, fail-closed */ }

    const cleakerOrigin = await resolveCleakerOrigin(base);
    const returnTo = new URL(window.location.href);
    returnTo.searchParams.delete('adminSessionToken');
    returnTo.searchParams.delete('state');
    const target = new URL('/keychain/admin-sign', cleakerOrigin);
    target.searchParams.set('returnTo', returnTo.toString());
    target.searchParams.set('state', state);
    window.location.href = target.toString();
  }

  const [logType, setLogType] = React.useState<LogType>('access');
  const [rawLogs, setRawLogs] = React.useState<LogEntry[]>([]);
  const [total, setTotal] = React.useState(0);
  const [fileInfo, setFileInfo] = React.useState<{ fileSize?: string; truncated?: boolean } | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(50);
  const [filterLevel, setFilterLevel] = React.useState('');
  const [filterMethod, setFilterMethod] = React.useState('');
  const [search, setSearch] = React.useState(initialSearch);
  const [autoRefresh, setAutoRefresh] = React.useState(false);

  const load = React.useCallback(async () => {
    if (!sessionToken) return;
    setLoading(true);
    const offset = (page - 1) * limit;
    const params = new URLSearchParams({ type: logType, limit: String(limit), offset: String(offset) });
    const result = await fetchLogs(base, params, sessionToken);
    if (!result.ok) {
      setError(result.message);
      setLoading(false);
      if (result.unauthorized) clearSession();
      return;
    }
    setError(null);
    setTotal(result.data.total ?? 0);
    setFileInfo({ fileSize: result.data.fileSize, truncated: result.data.truncated });
    setRawLogs(Array.isArray(result.data.logs) ? result.data.logs : []);
    setLoading(false);
  }, [base, logType, page, limit, sessionToken]);

  React.useEffect(() => { load(); }, [load]);

  React.useEffect(() => {
    if (!autoRefresh) return;
    const timer = setInterval(load, pollIntervalMs);
    return () => clearInterval(timer);
  }, [autoRefresh, load, pollIntervalMs]);

  const filteredLogs = React.useMemo(() => {
    let result = rawLogs;
    if (filterLevel) result = result.filter((l) => l.level === filterLevel);
    if (filterMethod && logType !== 'error') result = result.filter((l) => l.method === filterMethod);
    if (search) {
      const needle = search.toLowerCase();
      result = result.filter((l) =>
        (l.path && l.path.toLowerCase().includes(needle))
        || l.message.toLowerCase().includes(needle)
        || (l.ip && l.ip.includes(search)));
    }
    return result;
  }, [rawLogs, filterLevel, filterMethod, search, logType]);

  function clearFilters() {
    setFilterLevel('');
    setFilterMethod('');
    setSearch('');
    setPage(1);
  }

  function handleLogTypeChange(next: LogType) {
    setLogType(next);
    setPage(1);
    clearFilters();
  }

  function downloadLogs() {
    const text = filteredLogs.map((l) => l.fullLine || l.message).join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `netget-logs-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const totalPages = Math.max(1, Math.ceil(total / limit));

  if (!sessionToken) {
    return (
      <Box
        data-gui-component="LogsView"
        sx={{ maxWidth: 480, mx: 'auto', p: { xs: 2, sm: 3 }, display: 'flex', flexDirection: 'column', gap: 1.5, ...sx }}
      >
        <Typography variant="h5">Server Logs</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {error || 'Sign in as an admin to view this gateway\'s logs — a real signature from your keychain, not a header this screen just trusts.'}
        </Typography>
        <Box
          component="button"
          type="button"
          onClick={handleSignIn}
          sx={{
            alignSelf: 'flex-start', px: 1.5, py: 1, borderRadius: 1.5, border: 'none',
            bgcolor: 'primary.main', color: 'primary.contrastText', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
          }}
        >
          Sign in as admin →
        </Box>
      </Box>
    );
  }

  return (
    <Box
      data-gui-component="LogsView"
      sx={{
        maxWidth: 960,
        mx: 'auto',
        p: { xs: 2, sm: 3 },
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        ...sx,
      }}
    >
      <Box>
        <Typography variant="h5">Server Logs</Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          Main NetGet instance activity
          {fileInfo?.fileSize ? ` — ${fileInfo.fileSize}${fileInfo.truncated ? ' (truncated)' : ''}` : ''}
        </Typography>
      </Box>

      {/* Top bar: nginx source only — which log file, nothing else. */}
      <Box
        sx={{
          display: 'flex', gap: 0.5,
          p: 1.5, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper',
        }}
      >
        {(['access', 'error', 'server'] as LogType[]).map((t) => (
          <ToolbarButton key={t} onClick={() => handleLogTypeChange(t)} active={logType === t}>
            {t === 'access' ? 'Nginx Access' : t === 'error' ? 'Nginx Error' : 'Server Log'}
          </ToolbarButton>
        ))}
      </Box>

      {error && (
        <Typography variant="body2" sx={{ color: 'error.main' }}>{error}</Typography>
      )}

      <Box sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', overflow: 'hidden' }}>
        {/* Filter header: level, method, per-page, search — one line. */}
        <Box
          sx={{
            display: 'flex', flexWrap: 'nowrap', alignItems: 'flex-end', gap: 1.5,
            px: 1.5, py: 1, overflowX: 'auto',
            borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'action.hover',
          }}
        >
          {logType !== 'server' && (
            // Server Log has no real severity data to filter by --
            // logParsers.js's parseServerLog hardcodes level: 'INFO' for
            // every line (that log's format is just "<ts> - METHOD path",
            // written by something outside this codebase), so this
            // control would always be a no-op there.
            <SelectField label="Level" value={filterLevel} options={['', ...LEVELS]} onChange={setFilterLevel} />
          )}
          {logType !== 'error' && (
            <SelectField label="Method" value={filterMethod} options={['', ...METHODS]} onChange={setFilterMethod} />
          )}
          <SelectField label="Per page" value={String(limit)} options={PAGE_SIZES.map(String)} onChange={(v) => { setLimit(Number(v)); setPage(1); }} />

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.4, flex: '1 1 220px', minWidth: 180 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}>
              {logType === 'error' ? 'Search message/PID' : 'Search path/message/IP'}
            </Typography>
            <Box
              component="input"
              value={search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
              sx={{
                px: 1, py: 0.65, borderRadius: 1.25, border: '1px solid', borderColor: 'divider',
                bgcolor: 'background.default', color: 'text.primary', fontSize: '0.8rem', fontFamily: 'monospace',
              }}
            />
          </Box>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1, px: 1.5, py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="subtitle2">Logs ({filteredLogs.length} of {total})</Typography>
          <Box sx={{ display: 'flex', gap: 0.75 }}>
            <ToolbarButton onClick={clearFilters}>Clear</ToolbarButton>
            <ToolbarButton onClick={load} disabled={loading}>{loading ? 'Refreshing…' : 'Refresh'}</ToolbarButton>
            <ToolbarButton onClick={downloadLogs} disabled={filteredLogs.length === 0}>Download</ToolbarButton>
            <ToolbarButton onClick={() => setAutoRefresh((v) => !v)} active={autoRefresh}>
              Auto {autoRefresh ? 'ON' : 'OFF'}
            </ToolbarButton>
          </Box>
        </Box>

        {filteredLogs.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 5 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {loading ? 'Loading…' : 'No logs found for the selected filters.'}
            </Typography>
          </Box>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 1, py: 0.6, bgcolor: 'action.hover', minWidth: 640 }}>
              {COLUMNS[logType].map((col, i) => (
                <Typography key={col} variant="caption" sx={{ color: 'text.disabled', fontWeight: 700, width: i === 0 ? 168 : undefined, flex: i === 0 ? undefined : (col === 'Path' || col === 'Message') ? 1 : undefined }}>
                  {col}
                </Typography>
              ))}
            </Box>
            <Box sx={{ minWidth: 640 }}>
              {filteredLogs.map((log) => <LogRow key={log.id} log={log} logType={logType} />)}
            </Box>
          </Box>
        )}
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1.5 }}>
        <ToolbarButton onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>Prev</ToolbarButton>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>Page {page} of {totalPages}</Typography>
        <ToolbarButton onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>Next</ToolbarButton>
      </Box>
    </Box>
  );
}
