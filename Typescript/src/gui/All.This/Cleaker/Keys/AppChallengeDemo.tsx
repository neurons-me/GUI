// AppChallengeDemo.tsx — STORYBOOK DEMO of the generic app ⇄ .me challenge protocol (appChallenge.ts).
// Everything on the app side is SIMULATED in this browser tab: the app (netget, or the invented "Polls"), its
// authority (a stand-in for monad claim/gatewayAuthority.ts) and the keychain registration. No network calls.
// The user's key at `.keys.<app>` is generated per page load and lives only in memory (closure); never stored.
import * as React from 'react';
import Box from '@/gui/Atoms/Box/Box';
import Icon from '@/gui/Atoms/Icon/Icon';
import Typography from '@/gui/Atoms/Typography/Typography';
import { APP_ADAPTERS, adapterById, type AppAdapter } from './appAdapters';
import { checkGrants, checkWire, makeGrant, type AppWire, type GrantDecision, type StandingGrant } from './appGrants';
import {
  createMeSigner, createMockApp, createMockAuthority,
  type AppChallenge, type AuthorityProof, type ChallengeEnvelope, type ChallengeResponse, type MeSigner, type MockApp, type MockAuthority,
} from './appChallenge';
import AppConsentCard, { ActionButton } from './AppConsentCard';

/** Public, fake demo identities (not real hashes). */
export const DEMO_IDENTITY = 'demo-identity:jabellae';
const DEMO_TARGET = 'demo-identity:ana';

type Mode = 'ask' | 'grant' | 'wire';
type Hop = 'app → .me' | '.me → app' | 'app → authority' | 'authority → app';
type WireEntry = { seq: number; hop: Hop; kind: string; body: unknown };
type Event = { seq: number; ok: boolean; text: string; code?: string };
type Pending = { env: ChallengeEnvelope; c: AppChallenge; reason: Exclude<GrantDecision, { auto: true }>['reason'] | 'ASK' };
type AppKit = { app: MockApp; authority: MockAuthority };

let SEQ = 0;

export default function AppChallengeDemo({ namespace, children, initialApp = 'netget' }: {
  namespace: string;
  /** Renders the user's .me (QR + Keys tree); gets the paths with a pending request. */
  children?: (pendingPaths: string[]) => React.ReactNode;
  initialApp?: string;
}) {
  const [signer, setSigner] = React.useState<MeSigner | null>(null);
  const kits = React.useRef(new Map<string, AppKit>());
  const attacker = React.useRef<MeSigner | null>(null);
  const [appId, setAppId] = React.useState(initialApp);
  const adapter = adapterById(appId) ?? APP_ADAPTERS[0];
  const [resource, setResource] = React.useState(adapter.defaultResource);
  const [mode, setMode] = React.useState<Mode>('ask');
  const [grants, setGrants] = React.useState<StandingGrant[]>([]);
  const [grantOps, setGrantOps] = React.useState<string[]>([]);
  const [wire, setWire] = React.useState<AppWire | null>(null);
  const [pending, setPending] = React.useState<Pending | null>(null);
  const [log, setLog] = React.useState<WireEntry[]>([]);
  const [events, setEvents] = React.useState<Event[]>([]);
  const [record, setRecord] = React.useState<{ path: string; value: unknown } | null>(null);
  const [keyActive, setKeyActive] = React.useState(true);
  const last = React.useRef<{ resp: ChallengeResponse | null; proof: AuthorityProof | null }>({ resp: null, proof: null });
  const [, tick] = React.useReducer((n: number) => n + 1, 0);

  React.useEffect(() => {
    let live = true;
    createMeSigner({ namespace, identityHash: DEMO_IDENTITY }).then((s) => { if (live) setSigner(s); });
    return () => { live = false; };
  }, [namespace]);
  React.useEffect(() => { const t = setInterval(tick, 1000); return () => clearInterval(t); }, []);

  const kitFor = React.useCallback((a: AppAdapter): AppKit => {
    let k = kits.current.get(a.id);
    if (!k && signer) {
      const authority = createMockAuthority(a, { clock: Date.now });
      authority.registerKey(signer.identity); // the user registered `.keys.<app>`'s PUBLIC key with this app's authority
      k = { authority, app: createMockApp(a, { authority, clock: Date.now }) };
      kits.current.set(a.id, k);
    }
    return k!;
  }, [signer]);

  const pickApp = (id: string) => {
    const a = adapterById(id)!; setAppId(id); setResource(a.defaultResource); setGrantOps([]); setPending(null);
    setRecord(null);
    if (signer) { setKeyActive(kitFor(a).authority.isKeyActive(signer.identity.keyId)); }
  };

  const wireLog = (hop: Hop, kind: string, body: unknown) => setLog((l) => [...l, { seq: ++SEQ, hop, kind, body }]);
  const event = (ok: boolean, text: string, code?: string) => setEvents((e) => [{ seq: ++SEQ, ok, text, code }, ...e].slice(0, 30));
  const readBack = (a: AppAdapter, res: string) => { const r = kitFor(a).authority.read(res); setRecord({ path: r.path, value: r.record }); };

  /** The .me answers: sign with `.keys.<app>`, send ONLY the response; the app forwards the proof to its authority. */
  async function respond(env: ChallengeEnvelope, c: AppChallenge, via: string) {
    const a = adapterById(c.audience)!;
    const { app } = kitFor(a);
    let resp: ChallengeResponse;
    try {
      resp = await signer!.sign(env, c, a, Date.now());
    } catch (e) {
      const code = e instanceof Error ? e.message : 'SIGN_FAILED';
      app.cancel(env.id);
      wireLog('.me → app', 'app-challenge-declined', { kind: 'app-challenge-declined', id: env.id, reason: code });
      event(false, `.me refused to sign ${c.op} (${via})`, code);
      return;
    }
    wireLog('.me → app', resp.kind, resp);
    last.current.resp = resp;
    const res = await app.receive(resp);
    if (res.proof) { wireLog('app → authority', res.proof.kind, res.proof); last.current.proof = res.proof; }
    if (res.ok) {
      wireLog('authority → app', 'authority-read', { path: res.path, value: res.record });
      event(true, `${a.label}: ${a.ops[c.op].label} ${c.resource} accepted (${via})`, 'OK');
    } else {
      wireLog('authority → app', 'authority-error', { error: res.error });
      event(false, `${a.label}: ${a.ops[c.op].label} ${c.resource} rejected (${via})`, res.error);
    }
    readBack(a, c.resource);
  }

  /** The app asks: a challenge sealed to the .me's public key, requesting `keys.<app>`. */
  async function ask(op: string, opts: { ttlMs?: number } = {}) {
    if (!signer) return;
    const a = adapter;
    const env = await kitFor(a).app.issue({ op, resource, target: a.ops[op].needsTarget ? DEMO_TARGET : undefined, to: signer.identity, ttlMs: opts.ttlMs });
    wireLog('app → .me', env.kind, env);
    const c = await signer.open(env); // local: decrypting needs the .me's private key
    const req = { audience: c.audience, resource: c.resource, op: c.op, path: c.path };
    const d: GrantDecision | { auto: false; reason: 'ASK' } =
      mode === 'grant' ? checkGrants(a, grants, req, Date.now()) : mode === 'wire' ? checkWire(a, wire, req) : { auto: false, reason: 'ASK' };
    if (d.auto) await respond(env, c, mode === 'grant' ? 'standing permission' : 'wire');
    else { setPending({ env, c, reason: d.reason }); event(true, `.me asks you: ${a.label} wants ${a.ops[op].label} of ${c.resource}`, d.reason); }
  }

  async function approve(connect = false) {
    if (!pending) return;
    const p = pending; setPending(null);
    if (connect) setWire({ audience: p.c.audience, path: p.c.path });
    await respond(p.env, p.c, connect ? 'wired output → input' : 'approved once');
  }
  function deny() {
    if (!pending) return;
    const p = pending; setPending(null);
    kitFor(adapterById(p.c.audience)!).app.cancel(p.env.id);
    wireLog('.me → app', 'app-challenge-declined', { kind: 'app-challenge-declined', id: p.env.id, reason: 'DENIED' });
    event(false, `You denied ${p.c.op} of ${p.c.resource}`, 'DENIED');
  }

  function saveGrant() {
    try {
      const g = makeGrant(adapter, { resource, ops: grantOps, ttlMs: 10 * 60_000, now: Date.now() });
      setGrants((gs) => [...gs.filter((x) => !(x.audience === g.audience && x.resource === g.resource)), g]);
      event(true, `Standing permission: ${adapter.label} · ${resource} · ${g.ops.join(', ')} · 10 min`, 'GRANT_SAVED');
    } catch (e) { event(false, 'Permission not saved', e instanceof Error ? e.message : 'GRANT_INVALID'); }
  }

  // ── attacks ──
  async function replay() {
    const { resp, proof } = last.current;
    if (!resp || !proof) { event(false, 'Nothing to replay yet', 'NO_SIGNATURE'); return; }
    const a = adapterById(resp.audience)!;
    wireLog('.me → app', 'replayed-response', resp);
    const r1 = await kitFor(a).app.receive(resp);
    event(false, 'Replay to the app', r1.ok ? 'ACCEPTED?!' : r1.error);
    wireLog('app → authority', 'replayed-proof', proof);
    const r2 = await kitFor(a).authority.submit(proof);
    event(false, 'Replay straight to the authority', r2.ok ? 'ACCEPTED?!' : r2.error);
  }
  async function lateResponse() {
    if (!signer) return;
    const a = adapter; const { app } = kitFor(a);
    const op = Object.keys(a.ops)[0];
    const env = await app.issue({ op, resource: `${resource}-late`, to: signer.identity, ttlMs: 600 });
    wireLog('app → .me', env.kind, env);
    const resp = await signer.sign(env, await signer.open(env), a, Date.now());
    await new Promise((r) => setTimeout(r, 900));
    wireLog('.me → app', resp.kind, resp);
    const r = await app.receive(resp);
    event(false, 'Signature delivered after the challenge expired', r.ok ? 'ACCEPTED?!' : r.error);
  }
  async function wrongKey() {
    if (!signer) return;
    const a = adapter; const { app } = kitFor(a);
    attacker.current ??= await createMeSigner({ namespace, identityHash: DEMO_IDENTITY });
    const env = await app.issue({ op: Object.keys(a.ops)[0], resource: `${resource}-wk`, to: signer.identity });
    wireLog('app → .me', env.kind, env);
    // Strongest case for the attacker: assume they learned the plaintext. They still don't have the key.
    const c = await signer.open(env);
    const forged: ChallengeResponse = { ...(await attacker.current.sign(env, c, a, Date.now())), keyId: signer.identity.keyId, publicKey: signer.identity.publicKey };
    wireLog('.me → app', 'forged-response', forged);
    const r = await app.receive(forged);
    if (r.proof) wireLog('app → authority', r.proof.kind, r.proof);
    event(false, 'Signed with a different key (claiming yours)', r.ok ? 'ACCEPTED?!' : r.error);
  }
  function toggleKey() {
    if (!signer) return;
    const next = !keyActive; kitFor(adapter).authority.setKeyActive(signer.identity.keyId, next); setKeyActive(next);
    event(true, `.keys.${adapter.id} key ${next ? 're-activated' : 'revoked'} at ${adapter.label}'s authority`, next ? 'KEY_ACTIVE' : 'KEY_REVOKED');
  }

  const now = Date.now();
  const myGrants = grants.filter((g) => g.audience === adapter.id);
  const pendingPaths = pending ? [pending.c.path] : [];

  return (
    <Box data-gui-component="AppChallengeDemo" sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', lg: '1fr 380px 1fr' }, alignItems: 'start', p: { xs: 2, md: 3 }, color: 'text.primary' }}>
      {/* ── the app (simulated) ── */}
      <Panel title="App (simulated)" icon={adapter.icon} nodeId="app">
        <Row>
          {APP_ADAPTERS.map((a) => (
            <ActionButton key={a.id} tone={a.id === appId ? 'primary' : 'default'} onClick={() => pickApp(a.id)} action={`pick-app-${a.id}`}>
              <Icon name={a.icon} fontSize="1rem" />{a.label}
            </ActionButton>
          ))}
        </Row>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>{adapter.note}</Typography>
        <Box component="label" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: '0.8rem' }}>
          {adapter.resourceKind}
          <Box component="input" value={resource} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setResource(e.target.value.trim())} data-field="resource"
            sx={{ flex: 1, font: 'inherit', fontFamily: 'monospace', px: 1, py: 0.5, border: '1px solid', borderColor: 'divider', borderRadius: 1, bgcolor: 'transparent', color: 'inherit' }} />
        </Box>
        <Row>
          {Object.entries(adapter.ops).map(([op, d]) => (
            <ActionButton key={op} onClick={() => void ask(op)} action={`op-${op}`} tone={d.neverAuto ? 'danger' : 'default'} disabled={!signer || !!pending}>
              {d.label} {adapter.resourceKind} {resource}
            </ActionButton>
          ))}
        </Row>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Port label="challenge input" connected={!!wire && wire.audience === adapter.id} side="in" />
          <Typography variant="caption" sx={{ color: 'text.secondary' }} data-app-status>
            {pending && pending.c.audience === adapter.id ? 'waiting for the .me…' : 'idle'}
          </Typography>
        </Box>
        <Typography variant="caption" sx={{ fontWeight: 700 }}>Reads (never writes)</Typography>
        <Mono data-app-read>{record ? `${record.path} = ${JSON.stringify(record.value, null, 2)}` : `${adapter.authorityRoot}.${resource} = (not read yet)`}</Mono>
      </Panel>

      {/* ── the user's .me ── */}
      <Panel title="Your .me" icon="fingerprint" nodeId="me">
        {children?.(pendingPaths)}
        {pending && (
          <AppConsentCard
            now={now}
            request={{ adapter: adapterById(pending.c.audience)!, op: pending.c.op, resource: pending.c.resource, path: pending.c.path, target: pending.c.target, expiresAt: pending.c.expiresAt, reason: pending.reason }}
            onApprove={() => void approve(false)} onDeny={deny}
            extra={mode === 'wire' && !adapterById(pending.c.audience)!.ops[pending.c.op].neverAuto
              ? <ActionButton onClick={() => void approve(true)} action="consent-wire"><Icon name="cable" fontSize="1rem" />Connect .{pending.c.path} → challenge</ActionButton>
              : undefined}
          />
        )}
        <Typography variant="caption" sx={{ fontWeight: 700 }}>How .{adapter.keyPath} answers</Typography>
        <Row>
          {([['ask', 'Ask every time'], ['grant', 'Direct (standing permission)'], ['wire', 'Outputs → inputs']] as const).map(([m, label]) => (
            <ActionButton key={m} tone={mode === m ? 'primary' : 'default'} onClick={() => setMode(m)} action={`mode-${m}`}>{label}</ActionButton>
          ))}
        </Row>
        {mode === 'grant' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }} data-grant-editor>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Scope: {adapter.label} · {adapter.resourceKind} {resource} · path .{adapter.keyPath} · 10 min. Ops marked "always asks" can't be granted.
            </Typography>
            <Row>
              {Object.entries(adapter.ops).map(([op, d]) => (
                <ActionButton key={op} disabled={d.neverAuto} tone={grantOps.includes(op) ? 'primary' : 'default'} action={`grant-op-${op}`}
                  onClick={() => setGrantOps((o) => (o.includes(op) ? o.filter((x) => x !== op) : [...o, op]))}>
                  {d.label}{d.neverAuto ? ' · always asks' : ''}
                </ActionButton>
              ))}
              <ActionButton onClick={saveGrant} action="grant-save" disabled={!grantOps.length}>Save permission</ActionButton>
            </Row>
            {myGrants.map((g) => (
              <Box key={g.resource} data-grant={`${g.audience}:${g.resource}`} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Mono>{`${g.audience} · ${g.resource} · [${g.ops.join(', ')}] · .${g.path} · ${Math.max(0, Math.round((g.expiresAt - now) / 1000))}s`}</Mono>
                <ActionButton onClick={() => setGrants((gs) => gs.filter((x) => x !== g))} action="grant-remove">Remove</ActionButton>
              </Box>
            ))}
          </Box>
        )}
        {mode === 'wire' && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Port label={`.${adapter.keyPath} output`} connected={!!wire && wire.audience === adapter.id} side="out" />
            {wire && wire.audience === adapter.id
              ? <ActionButton onClick={() => setWire(null)} action="wire-disconnect">Disconnect</ActionButton>
              : <ActionButton onClick={() => setWire({ audience: adapter.id, path: adapter.keyPath })} action="wire-connect"><Icon name="cable" fontSize="1rem" />Connect → {adapter.label} challenge input</ActionButton>}
          </Box>
        )}
        <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'monospace' }} data-me-public>
          public: {signer ? `${signer.identity.identityHash} · keyId ${signer.identity.keyId}` : 'generating key…'}
        </Typography>
      </Panel>

      {/* ── what traveled + results ── */}
      <Panel title="What traveled" icon="swap_horiz" nodeId="wire">
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          Every message that crossed between app, .me and authority. The challenge is sealed to your .me (noise to anyone else); back comes a signature and your public key.
        </Typography>
        <Box data-wire-log sx={{ display: 'flex', flexDirection: 'column', gap: 1, maxHeight: 420, overflow: 'auto' }}>
          {log.length === 0 && <Typography variant="caption" sx={{ color: 'text.disabled' }}>Nothing yet.</Typography>}
          {[...log].reverse().map((w) => (
            <Box key={w.seq} data-wire-entry={w.kind} data-wire-hop={w.hop}>
              <Typography variant="caption" sx={{ fontWeight: 700 }}>{w.hop} · {w.kind}</Typography>
              <Mono>{JSON.stringify(w.body, null, 1)}</Mono>
            </Box>
          ))}
        </Box>
        <Typography variant="caption" sx={{ fontWeight: 700 }}>Results</Typography>
        <Box data-events sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {events.map((e) => (
            <Typography key={e.seq} variant="caption" data-event-code={e.code} sx={{ color: e.ok ? 'text.primary' : 'warning.main' }}>
              {e.ok ? '✓' : '✕'} {e.text}{e.code ? ` — ${e.code}` : ''}
            </Typography>
          ))}
        </Box>
        <Typography variant="caption" sx={{ fontWeight: 700 }}>Try to break it</Typography>
        <Row>
          <ActionButton onClick={() => void replay()} action="attack-replay">Replay last signature</ActionButton>
          <ActionButton onClick={() => void ask(Object.keys(adapter.ops)[0], { ttlMs: -1 })} action="attack-expired" disabled={!!pending}>Expired challenge</ActionButton>
          <ActionButton onClick={() => void lateResponse()} action="attack-late">Answer after expiry</ActionButton>
          <ActionButton onClick={() => void wrongKey()} action="attack-wrong-key">Sign with another key</ActionButton>
          <ActionButton onClick={toggleKey} action="attack-revoke" tone={keyActive ? 'default' : 'danger'}>{keyActive ? `Revoke .keys.${adapter.id} key` : 'Re-activate key'}</ActionButton>
        </Row>
      </Panel>
    </Box>
  );
}

function Panel({ title, icon, nodeId, children }: { title: string; icon: string; nodeId: string; children: React.ReactNode }) {
  return (
    <Box data-panel={nodeId} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2, display: 'flex', flexDirection: 'column', gap: 1.25, minWidth: 0, bgcolor: 'background.default' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Icon name={icon} fontSize="1.1rem" />
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{title}</Typography>
      </Box>
      {children}
    </Box>
  );
}
const Row = ({ children }: { children: React.ReactNode }) => <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>{children}</Box>;
function Mono({ children, ...rest }: { children: React.ReactNode } & Record<string, unknown>) {
  return (
    <Box component="pre" {...rest} sx={{ m: 0, p: 1, fontFamily: 'monospace', fontSize: '0.7rem', whiteSpace: 'pre-wrap', wordBreak: 'break-all', bgcolor: 'action.hover', borderRadius: 1, color: 'text.secondary' }}>
      {children}
    </Box>
  );
}
function Port({ label, connected, side }: { label: string; connected: boolean; side: 'in' | 'out' }) {
  return (
    <Box data-port={side} data-connected={connected || undefined} sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, fontSize: '0.75rem', fontFamily: 'monospace' }}>
      {side === 'in' && <Box sx={{ width: 10, height: 10, borderRadius: '50%', border: '2px solid', borderColor: connected ? 'success.main' : 'divider', bgcolor: connected ? 'success.main' : 'transparent' }} />}
      {label}
      {side === 'out' && <Box sx={{ width: 10, height: 10, borderRadius: '50%', border: '2px solid', borderColor: connected ? 'success.main' : 'divider', bgcolor: connected ? 'success.main' : 'transparent' }} />}
    </Box>
  );
}
