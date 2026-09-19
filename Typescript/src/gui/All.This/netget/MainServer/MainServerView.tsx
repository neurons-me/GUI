// MainServerView.tsx — me.netget.mainserver: the identity/status overview
// for one netget deployment (which .me owns it, which namespace it's
// designated as, whether OpenResty is actually listening). Ported from
// frontend_local's WelcomeNetget.jsx (its `mainView === 'netget'` slice —
// see that file's NODE/pollNetget for the original), rebuilt as a real
// this.gui component so it's addressable/testable on its own instead of
// buried inside a 960-line page that also owns wire animation and a
// namespace-switcher view. Deliberately excludes: the request terminal
// (this is a public-facing view — nobody browsing it needs to see live
// request traffic; that belongs in an admin-only mainserver.logs, not
// here), the wire SVG, ports (mainserver.ports is its own sibling
// component), the namespace view (mainView === 'namespace' in the
// original), and the Surfaces list (which domains this resolves is
// content, resolvable through .me itself -- not identity, so it doesn't
// belong in an identity overview by default).
import * as React from 'react';
import { Box, Typography } from '@/gui/Atoms';
import { buildCleakerNamespaceUrl } from '@/gui/All.This/Cleaker/namespaceExpression';

export interface MainServerViewProps {
  /** This netget's own base URL (its own backend, not a monad — same
   * origin frontend_local itself is served from, e.g. "http://local.netget"). */
  endpoint: string;
  /** The identity root the owner's username resolves against for its link
   * (e.g. "http://local.cleaker" — same namespace this netget's own monad
   * shares with local.cleaker, see netgetMonadProcess.ts's
   * getGatewayRootNamespace()). Defaults to `endpoint` if omitted. */
  namespaceRootUrl?: string;
  /** Poll interval in ms. Defaults to 5000, matching the original page. */
  pollIntervalMs?: number;
  sx?: any;
}

type Entrypoint = { host: string };

type MainServerState = {
  gatewayHost: string;
  // The .me identity that claimed ownership of this surface -- a real
  // cleaker-style claim, not netget-specific: written to the monad ledger
  // at netget.<gatewayId>.meta.owner, proven the same way a human
  // namespace claim is (Ed25519 challenge-response, POST /claims/signIn).
  // See GatewayClaimsManager.ts. identityHash alone doesn't tell a human
  // WHICH NAMESPACE owns this surface (it's a portable fingerprint,
  // independent of any namespace) -- ownerUsername is the resolved
  // namespace identity that actually determines whether this surface
  // still resolves for that owner (reclaiming under a different namespace
  // stops it resolving here). null until someone claims it.
  ownerIdentityHash: string | null;
  ownerUsername: string | null;
  bootstrapped: boolean;
  // Which namespace this netget's own monad is designated as -- from
  // getGatewayRootNamespace()'s own three-source resolution
  // (NETGET_MONAD_NAMESPACE -> xConfig.mainServerName -> "local.cleaker").
  // Distinct from gatewayHost (the physical host) and from
  // ownerUsername (who administers this gateway) -- see
  // Namespace-Is-Context.md for why host, owner, and served-namespace are
  // three separate facts, not one.
  servingNamespace: string;
  // The RAW xConfig.mainServerName value -- unresolved, null when nothing
  // has been explicitly set via mainServer.cli.ts. This IS the config that
  // determines servingNamespace above (read-only here; setting it involves
  // domain registration + cert provisioning, a separate, larger flow --
  // see mainServer.cli.ts).
  mainServerName: string | null;
  // httpListening/httpsListening are OpenResty's own two listen ports
  // (80/443), reported independently -- collapsing them into one boolean
  // silently hides the case where only one of the two is actually up.
  // gatewayPort/gatewayScheme (from /gateway-identity) are a different,
  // unrelated thing: the port/scheme the CURRENT request itself arrived on,
  // not OpenResty's listen configuration -- kept separate so it's never
  // mistaken for the other.
  httpListening: boolean;
  httpsListening: boolean;
  openrestyMode: string;
  gatewayPort: number | null;
  gatewayScheme: string;
  // localIP is this host's own NIC address (live-detected server-side every
  // call); publicIP is whatever init-time IP detection last saved to
  // xConfig -- empty when this host has never been brought online with one
  // (a private-network-only dev machine, for example), never re-detected
  // per request the way localIP is.
  localIP: string;
  publicIP: string;
  entrypoints: Entrypoint[];
};

const EMPTY_STATE: MainServerState = {
  gatewayHost: '',
  ownerIdentityHash: null,
  ownerUsername: null,
  bootstrapped: false,
  servingNamespace: '',
  mainServerName: null,
  httpListening: false,
  httpsListening: false,
  openrestyMode: '',
  gatewayPort: null,
  gatewayScheme: '',
  localIP: '',
  publicIP: '',
  entrypoints: [],
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

// xConfig.mainServerName is overloaded: getGatewayRootNamespace() reads it
// as a namespace fallback (where "local.cleaker" is a perfectly valid
// answer), but mainServer.cli.ts also uses it as "what public domain does
// this web server present itself as" (where a local.* value is never a
// valid answer — it's a local mesh surface name, not a public identity).
// A local.* value in this field almost always means it was set for the
// first purpose, not deliberately as this web server's own name — display
// the correct default (local.netget) for that question instead of
// repeating whatever Namespace already shows.
function isLocalMeshValue(value: string): boolean {
  const v = value.trim().toLowerCase();
  return v === 'localhost' || v === '127.0.0.1' || v === 'local' || v.startsWith('local.');
}

// Same masking convention as BlocksTable.tsx's maskHash — a hash is
// noise until you need the whole thing, so show a recognizable fragment
// by default and let a click reveal the rest.
function maskHash(hash: string): string {
  const value = String(hash || '').trim();
  if (!value) return '—';
  if (value.length <= 11) return value;
  return `${value.slice(0, 5)}…${value.slice(-5)}`;
}

function StatusDot({ on }: { on: boolean }) {
  return (
    <Box
      sx={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        bgcolor: on ? 'success.main' : 'text.disabled',
        flexShrink: 0,
      }}
    />
  );
}

function SurfaceList({ title, hint, rows }: { title: string; hint: string; rows: string[] }) {
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return (
    <Box
      data-gui-node-id={`MainServerView.${slug}`}
      sx={{
        flex: '1 1 240px',
        minWidth: 200,
        p: 1.5,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      <Typography variant="subtitle2" data-gui-node-id={`MainServerView.${slug}.title`}>{title}</Typography>
      <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block', mb: 1 }}>
        {hint}
      </Typography>
      {rows.length === 0 ? (
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          None yet.
        </Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {rows.map((row) => (
            <Typography key={row} variant="body2" sx={{ fontFamily: 'monospace' }}>
              {row}
            </Typography>
          ))}
        </Box>
      )}
    </Box>
  );
}

export default function MainServerView({ endpoint, namespaceRootUrl, pollIntervalMs = 5000, sx }: MainServerViewProps) {
  const [state, setState] = React.useState<MainServerState>(EMPTY_STATE);
  const [connected, setConnected] = React.useState(false);
  const [ownerExpanded, setOwnerExpanded] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    const base = String(endpoint || '').replace(/\/+$/, '');

    async function poll() {
      const identity = await fetchJson(base, '/gateway-identity');
      const openresty = await fetchJson(base, '/openresty-status');
      const entrypointsRes = await fetchJson(base, '/entrypoints');
      const ipInfo = await fetchJson(base, '/ip-info');
      const namespaceRes = await fetchJson(base, '/main-server-namespace');
      if (cancelled) return;

      setConnected(Boolean(identity || openresty || entrypointsRes));
      setState({
        gatewayHost: identity ? String(identity.gatewayId || '').trim().toLowerCase() : '',
        ownerIdentityHash: identity && identity.owner ? String(identity.owner) : null,
        ownerUsername: identity && identity.ownerUsername ? String(identity.ownerUsername) : null,
        bootstrapped: !!identity?.bootstrapped,
        servingNamespace: String(namespaceRes?.namespace || ''),
        mainServerName: namespaceRes?.mainServerName ? String(namespaceRes.mainServerName) : null,
        gatewayPort: identity && typeof identity.port === 'number' ? identity.port : null,
        gatewayScheme: identity ? String(identity.scheme || '') : '',
        httpListening: !!openresty?.httpListening,
        httpsListening: !!openresty?.httpsListening,
        openrestyMode: String(openresty?.mode || '').toUpperCase(),
        localIP: ipInfo?.success ? String(ipInfo.localIP || '') : '',
        publicIP: ipInfo?.success ? String(ipInfo.publicIP || '') : '',
        entrypoints: Array.isArray(entrypointsRes?.entrypoints) ? entrypointsRes.entrypoints : [],
      });
    }

    poll();
    const timer = setInterval(poll, pollIntervalMs);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [endpoint, pollIntervalMs]);

  return (
    <Box
      data-gui-node-id="MainServerView"
      data-gui-component="MainServerView"
      sx={{
        maxWidth: 720,
        mx: 'auto',
        p: { xs: 2, sm: 3 },
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        ...sx,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 1 }}>
        <Typography variant="h5" data-gui-node-id="MainServerView.host">{state.gatewayHost || 'This main server'}</Typography>
        <Typography variant="caption" sx={{ color: connected ? 'success.main' : 'text.secondary' }}>
          {connected ? 'online' : 'connecting…'}
        </Typography>
      </Box>

      {/* Three distinct facts, never collapsed into one another (see
          Namespace-Is-Context.md): Host is the physical surface answering
          this request. Namespace is the designated context this netget's
          own monad claims data under — changing it, not the host, is what
          determines whether this surface still resolves for the same
          content. Owner is a separate axis again — who administers this
          gateway, independent of which namespace it happens to serve. */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 1.25,
          p: 1.5,
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', minWidth: 88 }}>
            Host
          </Typography>
          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
            {state.gatewayHost || '—'}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', minWidth: 88 }}>
            Namespace
          </Typography>
          {state.servingNamespace ? (
            <Typography
              component="a"
              data-gui-node-id="MainServerView.namespaceLink"
              href={buildCleakerNamespaceUrl(state.servingNamespace) || `//${state.servingNamespace}`}
              variant="body2"
              sx={{ fontFamily: 'monospace', fontWeight: 700, color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
            >
              {state.servingNamespace}
            </Typography>
          ) : (
            <Typography variant="body2" sx={{ color: 'text.disabled', fontStyle: 'italic' }}>
              unknown
            </Typography>
          )}
        </Box>

        {/* Read-only for now: setting a REAL public main server name involves
            domain registration + cert provisioning, a separate flow, not a
            text field (see mainServer.cli.ts). A local.* configured value
            never counts as "this web server's public name" — see
            isLocalMeshValue above — so it displays as the honest default
            (local.netget) instead of repeating what Namespace already shows. */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', minWidth: 88 }}>
            Main Server Name
          </Typography>
          {state.mainServerName && !isLocalMeshValue(state.mainServerName) ? (
            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
              {state.mainServerName}
            </Typography>
          ) : (
            <Typography variant="body2" sx={{ color: 'text.disabled', fontStyle: 'italic' }}>
              local.netget (no public domain configured)
            </Typography>
          )}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', minWidth: 88, pt: 0.25 }}>
            Owner
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
            <StatusDot on={state.bootstrapped} />
            {state.bootstrapped && state.ownerIdentityHash ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.15, minWidth: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <Typography variant="body2">Owned by</Typography>
                  {state.ownerUsername ? (
                    (() => {
                      // Deliberately the bare @username, NOT @username.namespace.
                      // ownerUsername comes from gateway-claims.json's own
                      // netget.<gatewayId>.meta.owner ledger -- a gateway-
                      // administration claim, a different system from a real
                      // namespace claim (users.<owner> under a namespace
                      // tree). identityHash is a portable fingerprint,
                      // independent of any namespace; appending
                      // servingNamespace here would assert a namespace
                      // binding this data never actually verified. Everything
                      // shown here (owner, ownerUsername, bootstrapped) comes
                      // from a local snapshot with zero remote calls — that
                      // has to stay true; a fabricated namespace suffix would
                      // read as a live dependency on some other namespace
                      // resolving, which is exactly the fragility to avoid.
                      const root = namespaceRootUrl || endpoint;
                      const url = root ? buildCleakerNamespaceUrl(root, state.ownerUsername) : '';
                      const label = `@${state.ownerUsername}`;
                      return url ? (
                        <Typography
                          component="a"
                          data-gui-node-id="MainServerView.ownerLink"
                          href={url}
                          variant="body2"
                          sx={{ fontFamily: 'monospace', fontWeight: 700, color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                        >
                          {label}
                        </Typography>
                      ) : (
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>{label}</Typography>
                      );
                    })()
                  ) : (
                    <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.disabled', fontStyle: 'italic' }}>
                      unresolved username
                    </Typography>
                  )}
                </Box>
                {/* The namespace above is what actually determines resolution — if the
                    owner reclaims under a different namespace, this surface stops
                    resolving for them. The identityHash is a secondary, portable
                    fingerprint of the same .me, useful for verification, not the
                    primary fact — click to reveal it. */}
                <Typography
                  component="button"
                  type="button"
                  data-gui-node-id="MainServerView.ownerHash"
                  onClick={() => setOwnerExpanded((v) => !v)}
                  variant="caption"
                  sx={{
                    fontFamily: 'monospace',
                    border: 'none',
                    bgcolor: 'transparent',
                    p: 0,
                    m: 0,
                    cursor: 'pointer',
                    textAlign: 'left',
                    color: 'text.disabled',
                    wordBreak: ownerExpanded ? 'break-all' : 'normal',
                  }}
                  title={ownerExpanded ? 'Collapse' : 'Show full identity hash'}
                >
                  {ownerExpanded ? state.ownerIdentityHash : maskHash(state.ownerIdentityHash)}
                </Typography>
              </Box>
            ) : (
              <Typography variant="body2" sx={{ color: 'warning.main' }}>
                Unclaimed — no .me owns this surface yet.
              </Typography>
            )}
          </Box>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', gap: 3 }}>
        <Box>
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
            Local IP
          </Typography>
          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
            {state.localIP || '—'}
          </Typography>
        </Box>
        <Box>
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
            Public IP
          </Typography>
          <Typography variant="body2" sx={{ fontFamily: 'monospace', color: state.publicIP ? 'text.primary' : 'text.disabled' }}>
            {state.publicIP || 'none — local-only'}
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          p: 1.5,
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="subtitle2" data-gui-node-id="MainServerView.openresty.title">OpenResty</Typography>
          {state.openrestyMode && (
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {state.openrestyMode}
            </Typography>
          )}
          {state.gatewayPort != null && (
            <Typography variant="caption" sx={{ color: 'text.disabled', ml: 'auto' }}>
              this request arrived via {state.gatewayScheme || '?'}:{state.gatewayPort}
            </Typography>
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <StatusDot on={state.httpListening} />
            <Typography variant="body2">HTTP :80 {state.httpListening ? 'listening' : 'not listening'}</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <StatusDot on={state.httpsListening} />
            <Typography variant="body2">HTTPS :443 {state.httpsListening ? 'listening' : 'not listening'}</Typography>
          </Box>
        </Box>
      </Box>

      <SurfaceList
        title="Entrypoints"
        hint="Doors into this netget's own control plane."
        rows={state.entrypoints.map((e) => e.host)}
      />
    </Box>
  );
}
