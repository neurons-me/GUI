import * as React from 'react';
import type { Meta } from '@storybook/react';
import Theme from '@/gui/Theme/Theme';
import LogsView, { type LogEntry } from './LogsView';

// me.netget.mainserver.logs — the admin-only request/error terminal
// MainServerView.tsx's own header comment deferred to a sibling component.
// Grouped under Main Server (not a tab inside MainServerView) — same
// "separate sibling, not a tab bolted on" convention that comment
// describes for mainserver.ports/mainserver.domains too.
const meta: Meta<typeof LogsView> = {
  title: 'All.This/netget/Main Server/Logs',
  component: LogsView,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;

function makeAccessLogs(count: number): LogEntry[] {
  const methods = ['GET', 'GET', 'GET', 'POST', 'PUT', 'DELETE'];
  const paths = ['/gateway-identity', '/openresty-status', '/domains', '/logs', '/add-domain', '/entrypoints', '/ip-info'];
  const statuses = [200, 200, 200, 200, 304, 404, 500];
  const ips = ['127.0.0.1', '192.168.68.104', '10.0.0.5'];
  return Array.from({ length: count }, (_, i) => {
    const status = statuses[i % statuses.length];
    return {
      id: i,
      timestamp: new Date(Date.now() - i * 45_000).toISOString(),
      level: status >= 500 ? 'ERROR' : status >= 400 ? 'WARN' : 'INFO',
      method: methods[i % methods.length],
      path: paths[i % paths.length],
      status,
      ip: ips[i % ips.length],
      message: `${methods[i % methods.length]} ${paths[i % paths.length]} - ${status}`,
      fullLine: `${ips[i % ips.length]} - - [${new Date(Date.now() - i * 45_000).toUTCString()}] "${methods[i % methods.length]} ${paths[i % paths.length]} HTTP/1.1" ${status} 512 "-" "Mozilla/5.0"`,
    };
  });
}

function makeErrorLogs(count: number): LogEntry[] {
  const messages = [
    'upstream timed out (110: Connection timed out) while reading response header from upstream',
    'could not build server_names_hash, you should increase server_names_hash_bucket_size',
    '*1234 connect() failed (111: Connection refused) while connecting to upstream',
  ];
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    timestamp: new Date(Date.now() - i * 120_000).toISOString(),
    level: i % 4 === 0 ? 'WARN' : 'ERROR',
    pid: 21831 + (i % 3),
    message: messages[i % messages.length],
    fullLine: `2026/09/11 0${(i % 9) + 1}:22:1${i % 10} [error] ${21831 + (i % 3)}#0: ${messages[i % messages.length]}`,
  }));
}

function makeServerLogs(count: number): LogEntry[] {
  const methods = ['GET', 'POST'];
  const paths = ['/gateway-identity', '/setup/verify-code', '/openresty/install/progress', '/domains/metadata'];
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    timestamp: new Date(Date.now() - i * 60_000).toISOString(),
    level: 'INFO',
    method: methods[i % methods.length],
    path: paths[i % paths.length],
    message: `${methods[i % methods.length]} ${paths[i % paths.length]}`,
    fullLine: `${new Date(Date.now() - i * 60_000).toISOString()} - ${methods[i % methods.length]} ${paths[i % paths.length]}`,
  }));
}

const MOCK_LOGS: Record<string, LogEntry[]> = {
  access: makeAccessLogs(140),
  error: makeErrorLogs(37),
  server: makeServerLogs(58),
};

// Installed during RENDER, not inside a useEffect — same reasoning as
// GatewaySetup.stories.tsx's withFetchStub: LogsView fires its own first
// load() from ITS OWN effect, and React runs child effects before parent
// effects, so an effect here would install the stub one tick too late.
function withLogsFetchStub() {
  return function LogsFetchStub({ children }: { children: React.ReactNode }) {
    const originalFetchRef = React.useRef<typeof window.fetch | null>(null);
    if (originalFetchRef.current === null) {
      originalFetchRef.current = window.fetch;
      window.fetch = (async (input: RequestInfo | URL) => {
        const url = new URL(String(input), 'http://stubbed.local');
        if (!url.pathname.endsWith('/logs')) return new Response('', { status: 404 });
        const type = url.searchParams.get('type') || 'access';
        const limit = Number(url.searchParams.get('limit') || 50);
        const offset = Number(url.searchParams.get('offset') || 0);
        const all = MOCK_LOGS[type] || [];
        const page = all.slice(offset, offset + limit);
        const body = {
          logs: page,
          total: all.length,
          fileSize: type === 'access' ? '2.4 MB' : type === 'error' ? '186 KB' : '640 KB',
          truncated: false,
          logType: type,
        };
        return new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } });
      }) as typeof window.fetch;
    }
    React.useEffect(() => () => {
      if (originalFetchRef.current) window.fetch = originalFetchRef.current;
    }, []);
    return <>{children}</>;
  };
}

const LogsFetchStub = withLogsFetchStub();

const MOCK_SESSION_TOKEN_KEY = 'netget:admin-session-token';

// LogsView now gates on a real admin-session token (adminSession.ts) —
// seeding localStorage with a fake one is the story-only equivalent of
// having already signed in with a real Ed25519 key; the fetch stub above
// never checks the Authorization header's value, so this is purely about
// exercising the "already signed in" render path, not re-proving the auth
// mechanism itself (that's covered by real crypto in netget's own test
// suite, tests/logs-nrp-integration.test.ts).
//
// Set during RENDER, not inside a useEffect — same reasoning as
// withLogsFetchStub above: LogsView reads localStorage synchronously in
// its OWN useState initializer, on its OWN first render, which happens
// in the same pass as this wrapper's first render, before ANY effect
// (including one here) would get a chance to run. An effect here would
// set the token one tick too late, after LogsView already read `null`.
function withMockAdminSession() {
  return function MockAdminSession({ children }: { children: React.ReactNode }) {
    const seededRef = React.useRef(false);
    if (!seededRef.current) {
      seededRef.current = true;
      try { window.localStorage.setItem(MOCK_SESSION_TOKEN_KEY, 'story-mock-session-token'); } catch { /* ignore */ }
    }
    React.useEffect(() => () => {
      try { window.localStorage.removeItem(MOCK_SESSION_TOKEN_KEY); } catch { /* ignore */ }
    }, []);
    return <>{children}</>;
  };
}

const MockAdminSession = withMockAdminSession();

export const Default = () => (
  <Theme>
    <MockAdminSession>
      <LogsFetchStub>
        <LogsView endpoint="http://stubbed.local" />
      </LogsFetchStub>
    </MockAdminSession>
  </Theme>
);

// Pre-seeded search — the hook a future "view logs for this domain" link
// elsewhere in the app would use, exercised here since LogsView itself has
// no router dependency to demonstrate it through.
export const FilteredByDomain = () => (
  <Theme>
    <MockAdminSession>
      <LogsFetchStub>
        <LogsView endpoint="http://stubbed.local" initialSearch="add-domain" />
      </LogsFetchStub>
    </MockAdminSession>
  </Theme>
);

// No session at all — real first-load state for anyone who hasn't signed
// in yet, and what a real 401 (expired session) falls back to as well.
// Cleared unconditionally, during render rather than an unmount-cleanup
// effect that Storybook's own canvas doesn't always run between story
// navigations (localStorage is origin-scoped and Storybook serves every
// story from the same origin, so a token another story's mount left
// behind can otherwise leak into this one). Clicking "Sign in as admin"
// here would try a REAL cross-origin redirect to local.cleaker, which a
// Storybook iframe can't follow through and back — see
// GatewaySetup.stories.tsx's own FullFlow comment for the identical
// limitation on the claim flow's redirect.
export const SignInRequired = () => {
  // Cleared here, in the render body itself (not an unmount-cleanup
  // effect) so this runs every time THIS story is rendered, regardless of
  // whether Storybook's canvas fully unmounted whatever story was showing
  // before it.
  try { window.localStorage.removeItem(MOCK_SESSION_TOKEN_KEY); } catch { /* ignore */ }
  return (
    <Theme>
      <LogsFetchStub>
        <LogsView endpoint="http://stubbed.local" />
      </LogsFetchStub>
    </Theme>
  );
};

// Real, reachable local endpoint — same "prefer real network where it's
// genuinely reachable" convention as MainServerView.stories.tsx's Default.
// Still gated on a real session: with nothing in localStorage, this shows
// the same sign-in prompt SignInRequired does, now against the real
// backend's own /main-server-namespace instead of a mock.
export const Live = () => (
  <Theme>
    <LogsView endpoint="http://local.netget" />
  </Theme>
);
