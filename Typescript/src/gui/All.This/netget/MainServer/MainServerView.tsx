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
import { GuiNodeIdBase, useGuiNodeId } from '@/runtime/guiNodeId';
import QR from '@/gui/All.This/me/QR';
import { hostnameOf, gatewayIdOf, describePublicIP, describeEntrypoints, describePort, describeDoor, describeClaim, isOperatorView, readAdminSessionToken, type EntrypointsView, type PortView, type PublicIPDetectionView } from './mainServerPresentation';

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
  /** Where this view sits in the GUI tree. Its parts hang under it. */
  'data-gui-node-id'?: string;
}

type Entrypoint = { host: string };

type MainServerState = {
  gatewayHost: string;
  // the gateway's stable identity: a different fact from the machine's name above
  gatewayId: string;
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
  httpListening: PortView;
  httpsListening: PortView;
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
  // when/how publicIP was last checked, as the gateway reports it (absent from an older gateway)
  publicIPDetection: PublicIPDetectionView;
  entrypoints: Entrypoint[];
  // whether /entrypoints answered: an unanswered request is not an empty list
  entrypointsView: EntrypointsView;
  // Which requests answered. "Unclaimed", "unknown" and "no public domain configured" are statements about the server;
  // they are only made when the request that would say so actually came back.
  identityAnswered: boolean;
  namespaceAnswered: boolean;
  // One line about the claim ("claimed · 1 admin · updated <day>"), or null
  claimSummary: string | null;
  // The operator's part of the screen (OpenResty, the machine's own name) is shown only to an admin session the
  // gateway accepted; a visitor gets the public one
  operator: boolean;
};

const EMPTY_STATE: MainServerState = {
  gatewayHost: '',
  gatewayId: '',
  ownerIdentityHash: null,
  ownerUsername: null,
  bootstrapped: false,
  servingNamespace: '',
  mainServerName: null,
  httpListening: 'unavailable',
  httpsListening: 'unavailable',
  openrestyMode: '',
  gatewayPort: null,
  gatewayScheme: '',
  localIP: '',
  publicIP: '',
  publicIPDetection: null,
  entrypoints: [],
  entrypointsView: { kind: 'unavailable' },
  identityAnswered: false,
  namespaceAnswered: false,
  claimSummary: null,
  operator: false,
};

// `status` is 0 when the request itself failed (no answer); `json` is null unless a JSON body came back with a 2xx.
async function fetchJsonResult(base: string, path: string, headers?: Record<string, string>): Promise<{ status: number; json: any | null }> {
  try {
    const res = await fetch(`${base}${path}`, { cache: 'no-store', credentials: 'same-origin', ...(headers ? { headers } : {}) });
    if (!res.ok) return { status: res.status, json: null };
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) return { status: res.status, json: null };
    return { status: res.status, json: await res.json() };
  } catch {
    return { status: 0, json: null };
  }
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

function portText(view: PortView): string {
  return view === 'listening' ? 'listening' : view === 'not-listening' ? 'not listening' : view === 'restricted' ? 'not shown on this door' : 'unavailable';
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

// `emptyText` is what an empty list says; `unavailable` is a different fact (the request did not answer) and must not read as empty.
function SurfaceList({ title, hint, rows, unavailable = false, emptyText = 'None yet.' }: { title: string; hint: string; rows: string[]; unavailable?: boolean; emptyText?: string }) {
  const base = useGuiNodeId('MainServerView');
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return (
    <Box
      data-gui-node-id={`${base}.${slug}`}
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
      <Typography variant="subtitle2" data-gui-node-id={`${base}.${slug}.title`}>{title}</Typography>
      <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block', mb: 1 }}>
        {hint}
      </Typography>
      {unavailable ? (
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Not available from this gateway.
        </Typography>
      ) : rows.length === 0 ? (
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {emptyText}
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

export default function MainServerView({ endpoint, namespaceRootUrl, pollIntervalMs = 5000, sx, 'data-gui-node-id': nodeId = 'MainServerView' }: MainServerViewProps) {
  const [state, setState] = React.useState<MainServerState>(EMPTY_STATE);
  const [connected, setConnected] = React.useState(false);
  // false until the first round of reads has come back, whatever it said: until then nothing is known, so nothing is claimed.
  const [loaded, setLoaded] = React.useState(false);
  const [ownerExpanded, setOwnerExpanded] = React.useState(false);
  const [idCopied, setIdCopied] = React.useState(false);
  const door = describeDoor(state.mainServerName, state.servingNamespace);

  React.useEffect(() => {
    let cancelled = false;
    const base = String(endpoint || '').replace(/\/+$/, '');

    async function poll() {
      // Independent reads, so the first paint waits for the slowest one rather than the sum of the five.
      // The stored admin session (the one LogsView keeps) goes only on the operator's own status route, and the route
      // is not asked at all without one: a visitor would only collect a 401 for it.
      const adminToken = readAdminSessionToken();
      const [identityR, openrestyR, entrypointsR, ipInfoR, namespaceR] = await Promise.all([
        fetchJsonResult(base, '/gateway-identity'),
        adminToken
          ? fetchJsonResult(base, '/openresty-status', { authorization: `Bearer ${adminToken}` })
          : Promise.resolve({ status: 0, json: null }),
        fetchJsonResult(base, '/entrypoints'),
        fetchJsonResult(base, '/ip-info'),
        fetchJsonResult(base, '/main-server-namespace'),
      ]);
      const identity = identityR.json;
      const openresty = openrestyR.json;
      const entrypointsRes = entrypointsR.json;
      const ipInfo = ipInfoR.json;
      const namespaceRes = namespaceR.json;
      if (cancelled) return;

      setLoaded(true);
      setConnected(Boolean(identity || openresty || entrypointsRes));
      setState({
        gatewayHost: hostnameOf(identity),
        gatewayId: gatewayIdOf(identity),
        ownerIdentityHash: identity && identity.owner ? String(identity.owner) : null,
        ownerUsername: identity && identity.ownerUsername ? String(identity.ownerUsername) : null,
        bootstrapped: !!identity?.bootstrapped,
        servingNamespace: String(namespaceRes?.namespace || ''),
        mainServerName: namespaceRes?.mainServerName ? String(namespaceRes.mainServerName) : null,
        gatewayPort: identity && typeof identity.port === 'number' ? identity.port : null,
        gatewayScheme: identity ? String(identity.scheme || '') : '',
        httpListening: describePort(openresty, 'httpListening', openrestyR.status),
        httpsListening: describePort(openresty, 'httpsListening', openrestyR.status),
        openrestyMode: String(openresty?.mode || '').toUpperCase(),
        localIP: ipInfo?.success ? String(ipInfo.localIP || '') : '',
        publicIP: ipInfo?.success ? String(ipInfo.publicIP || '') : '',
        publicIPDetection: ipInfo?.success && ipInfo.publicIPDetection && typeof ipInfo.publicIPDetection === 'object' ? ipInfo.publicIPDetection : null,
        entrypoints: Array.isArray(entrypointsRes?.entrypoints) ? entrypointsRes.entrypoints : [],
        entrypointsView: describeEntrypoints(entrypointsRes),
        identityAnswered: Boolean(identity),
        namespaceAnswered: Boolean(namespaceRes),
        claimSummary: describeClaim(identity),
        operator: isOperatorView(adminToken, describePort(openresty, 'httpListening', openrestyR.status)),
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
    <GuiNodeIdBase value={nodeId}>
    <Box
      data-gui-node-id={nodeId}
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
        <Typography variant="h5" data-gui-node-id={`${nodeId}.host`}>{door.door || state.gatewayHost || 'This main server'}</Typography>
        <Typography variant="caption" sx={{ color: connected ? 'success.main' : 'text.secondary' }}>
          {connected ? 'online' : 'connecting…'}
        </Typography>
      </Box>

      {!loaded ? (
        <Typography variant="body2" data-gui-node-id={`${nodeId}.loading`} sx={{ color: 'text.secondary' }}>
          Reading this server…
        </Typography>
      ) : (
      <>

      {/* What a visitor needs to know about this server, and no more: the door it answers at and the namespace it
          points to (two facts, one line -- see Namespace-Is-Context.md: neither is derived from the other), the
          gateway's identity, and who owns it. The machine's own name and everything about OpenResty belong to the
          operator and appear only for an admin session the gateway accepted. */}
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
        {state.operator && state.gatewayHost ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', minWidth: 88 }}>
              Machine
            </Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace' }} data-gui-node-id={`${nodeId}.machine`}>
              {state.gatewayHost}
            </Typography>
          </Box>
        ) : null}

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', minWidth: 88 }}>
            {door.door ? 'Door' : 'Namespace'}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
            {door.door ? (
              <Typography variant="body2" sx={{ fontFamily: 'monospace' }} data-gui-node-id={`${nodeId}.door`}>
                {door.door}
              </Typography>
            ) : null}
            {door.door && door.namespace ? (
              <Typography variant="body2" sx={{ color: 'text.disabled' }}>→</Typography>
            ) : null}
            {door.namespace ? (
              <Typography
                component="a"
                data-gui-node-id={`${nodeId}.namespace`}
                href={buildCleakerNamespaceUrl(door.namespace) || `//${door.namespace}`}
                variant="body2"
                sx={{ fontFamily: 'monospace', fontWeight: 700, color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
              >
                {door.namespace}
              </Typography>
            ) : (
              <Typography variant="body2" sx={{ color: 'text.disabled', fontStyle: 'italic' }}>
                {state.namespaceAnswered ? 'no namespace declared' : 'not available'}
              </Typography>
            )}
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', minWidth: 88, pt: 0.25 }}>
            Gateway ID
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.15, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" sx={{ fontFamily: 'monospace' }} title={state.gatewayId || undefined} data-gui-node-id={`${nodeId}.gatewayId`}>
                {state.gatewayId ? maskHash(state.gatewayId) : '—'}
              </Typography>
              {state.gatewayId ? (
                <Typography
                  component="button"
                  type="button"
                  variant="caption"
                  data-gui-node-id={`${nodeId}.gatewayId.copy`}
                  onClick={() => {
                    try {
                      void navigator.clipboard?.writeText(state.gatewayId).then(() => {
                        setIdCopied(true);
                        setTimeout(() => setIdCopied(false), 1500);
                      });
                    } catch { /* no clipboard: the full id is still the title of the value */ }
                  }}
                  sx={{ border: 'none', bgcolor: 'transparent', p: 0, m: 0, cursor: 'pointer', color: 'primary.main' }}
                >
                  {idCopied ? 'copied' : 'copy'}
                </Typography>
              ) : null}
            </Box>
            {state.claimSummary ? (
              <Typography variant="caption" sx={{ color: 'text.secondary' }} data-gui-node-id={`${nodeId}.claim`}>
                {state.claimSummary}
              </Typography>
            ) : null}
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', minWidth: 88, pt: 0.25 }}>
            Owner
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
            {state.bootstrapped && state.ownerIdentityHash ? (
              (() => {
                // Deliberately the bare @username, NOT @username.namespace: ownerUsername comes from the gateway's
                // own claim ledger, a gateway-administration claim, a different system from a real namespace claim.
                // identityHash is a portable fingerprint, independent of any namespace; appending the serving
                // namespace here would assert a binding this data never verified. Everything shown comes from a
                // local snapshot with zero remote calls, and that has to stay true.
                const root = namespaceRootUrl || endpoint;
                const url = root && state.ownerUsername ? buildCleakerNamespaceUrl(root, state.ownerUsername) : '';
                const label = state.ownerUsername ? `@${state.ownerUsername}` : '';
                return (
                  <>
                    {/* The QR carries the same address the @name links to, nothing else: no key, no secret. */}
                    {url ? (
                      <Box data-gui-node-id={`${nodeId}.owner.qr`} sx={{ flexShrink: 0, lineHeight: 0 }}>
                        <QR value={url} size={88} ecc="M" quietZone={1} cornerRadius={6} />
                      </Box>
                    ) : null}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25, minWidth: 0 }}>
                      {label ? (
                        url ? (
                          <Typography
                            component="a"
                            data-gui-node-id={`${nodeId}.owner`}
                            href={url}
                            variant="body2"
                            sx={{ fontFamily: 'monospace', fontWeight: 700, color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                          >
                            {label}
                          </Typography>
                        ) : (
                          <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>{label}</Typography>
                        )
                      ) : (
                        <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.disabled', fontStyle: 'italic' }}>
                          unresolved username
                        </Typography>
                      )}
                      {/* The identity hash is a secondary, portable fingerprint of the same .me, useful for
                          verification, not the primary fact: click to reveal it. */}
                      <Typography
                        component="button"
                        type="button"
                        data-gui-node-id={`${nodeId}.hash`}
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
                        {ownerExpanded ? state.ownerIdentityHash : maskHash(state.ownerIdentityHash as string)}
                      </Typography>
                    </Box>
                  </>
                );
              })()
            ) : state.identityAnswered ? (
              <Typography variant="body2" sx={{ color: 'warning.main' }}>
                Unclaimed — no .me owns this surface yet.
              </Typography>
            ) : (
              <Typography variant="body2" sx={{ color: 'text.disabled', fontStyle: 'italic' }}>
                not available
              </Typography>
            )}
          </Box>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', gap: 3 }}>
        {/* The gateway omits its private address for a peer outside this machine/LAN: no row, not an empty one. */}
        {state.localIP ? (
        <Box>
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
            Local IP
          </Typography>
          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
            {state.localIP}
          </Typography>
        </Box>
        ) : null}
        <Box>
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
            Public IP
          </Typography>
          <Typography variant="body2" sx={{ fontFamily: 'monospace', color: describePublicIP(state.publicIP, state.publicIPDetection).configured ? 'text.primary' : 'text.disabled' }}>
            {describePublicIP(state.publicIP, state.publicIPDetection).text}
          </Typography>
        </Box>
      </Box>

      {state.operator ? (
      <Box
        data-gui-node-id={`${nodeId}.openresty`}
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
          <Typography variant="subtitle2" data-gui-node-id={`${nodeId}.openresty.title`}>OpenResty</Typography>
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
            <StatusDot on={state.httpListening === 'listening'} />
            <Typography variant="body2">HTTP :80 {portText(state.httpListening)}</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <StatusDot on={state.httpsListening === 'listening'} />
            <Typography variant="body2">HTTPS :443 {portText(state.httpsListening)}</Typography>
          </Box>
        </Box>
      </Box>
      ) : null}

      <SurfaceList
        title="Entrypoints"
        hint="Doors into this netget's own control plane."
        rows={state.entrypointsView.kind === 'list' ? state.entrypointsView.rows : []}
        unavailable={state.entrypointsView.kind === 'unavailable'}
      />
      </>
      )}
    </Box>
    </GuiNodeIdBase>
  );
}
