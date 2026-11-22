// KeysListDemo.tsx — STORYBOOK DEMO of the namespace's Keys page with `keys.list` (src/agent/keysList.ts).
// Shown in Getting Started/Namespace → "2 · Namespace + site with .GUI" → left bar → Keys.
//
// Left: your keys tree (IdentityTree) under the demo namespace, seeded with FAKE values (serviceKeys.storyFixtures:
// public demo passphrase, nothing real). Values are dots; `keys.netget` is seeded but hidden. Typing into a key's
// field writes nothing until it is saved.
// Right: an app (SIMULATED, origin https://app.example — nothing is sent anywhere) asks for the names of your keys; the
// approval card below it is the agent's: its own words and effects (computed in a temporary .me kernel with the
// explicit PUBLIC test seed of approvalKernel.ts), bound to the request's digest. You approve visibly; the answer is
// cloned as postMessage would clone it, checked by the app's strict parser (parseKeysGrant) and shown: names only.
// "Swap the request" makes the app replace its request after it is shown: the approval does not carry over.
import * as React from 'react';
import Box from '@/gui/Atoms/Box/Box';
import Icon from '@/gui/Atoms/Icon/Icon';
import Typography from '@/gui/Atoms/Typography/Typography';
import IdentityTree from '../IdentityTree';
import { ActionButton } from './AppConsentCard';
import { DEMO_NS, Seeded, type DemoCustomGroup } from './serviceKeys.storyFixtures';
import type { ServiceId } from './serviceKeyVault';
import { AGENT_PROTOCOL, newRequestId, type KeysListOperation } from '@/agent/protocol';
import { ApprovalInvalidated } from '@/agent/approval';
import { effectsView } from '@/agent/approvalKernel';
import { KEYS_LIST_TEXT, approvalForKeys, assertKeysApproval, isLoginExcluded, listKeysFor, validateKeysListRequest, type ValidatedKeysList } from '@/agent/keysList';
import { parseKeysGrant, type KeysGrant } from '@/agent/requestOperation';

/** Simulated app origin (never contacted). */
export const DEMO_APP_ORIGIN = 'https://app.example';
/** Public, fake approver identity (not a real hash, no key behind it). */
const DEMO_APPROVER = { namespace: DEMO_NS, identityHash: 'demo-identity:jabellae', keyId: 'demo-key' };
const SWAP_NS = 'other.example';

export const DEMO_SAVED: ServiceId[] = ['instagram', 'github', 'twitch'];
export const DEMO_CUSTOM: DemoCustomGroup[] = [
  { name: 'stripe.test', fields: ['secret-key'], mark: { kind: 'icon', name: 'payments' } },
  { name: 'myapi', fields: ['token'], mark: { kind: 'glyph', value: '★' } },
  { name: 'netget', fields: ['token'] },   // seeded, never shown nor listed
];

type Pending = { validated: ValidatedKeysList; changed: boolean };

function Panel({ title, icon, children, node }: { title: string; icon: string; children: React.ReactNode; node: string }) {
  return (
    <Box data-gui-node-id={node} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 1.5, display: 'flex', flexDirection: 'column', gap: 1, bgcolor: 'background.paper' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Icon name={icon} fontSize="1.1rem" /><Typography variant="body2" sx={{ fontWeight: 700 }}>{title}</Typography></Box>
      {children}
    </Box>
  );
}

function ApprovalCard({ pending, onApprove, onDeny, note }: { pending: Pending; onApprove: (shown: ValidatedKeysList) => void; onDeny: () => void; note: string }) {
  const shown = pending.validated;
  const op = shown.operation;
  const resource = `<you>.${op.namespace}.keys`;
  const view = React.useMemo(() => effectsView(KEYS_LIST_TEXT.facts(resource), KEYS_LIST_TEXT.rules), [resource]);
  const holds = op.namespace === DEMO_APPROVER.namespace;
  const [held, setHeld] = React.useState(pending.changed);
  React.useEffect(() => {
    setHeld(pending.changed);
    if (!pending.changed) return undefined;
    const t = setTimeout(() => setHeld(false), 1500);
    return () => clearTimeout(t);
  }, [shown, pending.changed]);
  const disabled = held || !holds;
  return (
    <Box role="alertdialog" aria-label={KEYS_LIST_TEXT.title} data-keys-approval sx={{ border: '1px solid', borderColor: 'primary.main', borderRadius: 2, p: 1.5, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
      <Typography variant="body2" sx={{ fontWeight: 700 }} data-keys-approval-title>Approve a request</Typography>
      {pending.changed && (
        <Typography variant="caption" sx={{ color: 'warning.main' }} data-keys-approval-changed>
          The app changed the request after it was shown. Nothing was sent. Review it again.
        </Typography>
      )}
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>Asked by</Typography>
      <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600 }} data-keys-approval-origin>{shown.origin}</Typography>
      <Typography variant="caption" sx={{ fontFamily: 'monospace' }} data-keys-approval-operation>{KEYS_LIST_TEXT.title} · {resource} · approval {shown.digest.slice(0, 16)}</Typography>
      <Typography variant="caption" data-keys-approval-description>{KEYS_LIST_TEXT.description}</Typography>
      <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
        {view.effects.map((e) => (
          <Typography key={e.name} component="li" variant="caption" data-effect={e.name} data-value={String(e.value)}>{e.sentence}</Typography>
        ))}
      </Box>
      <Typography variant="caption" sx={{ color: 'text.secondary' }} data-keys-approval-as>
        {holds ? `As ${DEMO_APPROVER.namespace} (demo identity)` : `This agent holds no identity for ${op.namespace}.`}
      </Typography>
      <Box sx={{ display: 'flex', gap: 1 }}>
        <ActionButton tone="primary" action="keys-approve" disabled={disabled} onClick={() => { if (!disabled) onApprove(shown); }}><Icon name="check" fontSize="1rem" />Approve</ActionButton>
        <ActionButton action="keys-deny" onClick={onDeny}>Reject</ActionButton>
      </Box>
      {note && <Typography variant="caption" sx={{ color: 'warning.main' }} data-keys-approval-note>{note}</Typography>}
    </Box>
  );
}

function KeysListFlow({ namespace }: { namespace: string }) {
  const [pending, setPending] = React.useState<Pending | null>(null);
  const pendingRef = React.useRef<Pending | null>(null);
  const [received, setReceived] = React.useState<KeysGrant | null>(null);
  const [wire, setWire] = React.useState('');
  const [status, setStatus] = React.useState('idle');
  const [note, setNote] = React.useState('');
  const idRef = React.useRef('');
  const put = (p: Pending | null) => { pendingRef.current = p; setPending(p); };

  const ask = async () => {
    idRef.current = newRequestId();
    setReceived(null); setWire(''); setNote('');
    const op: KeysListOperation = { action: 'keys.list', namespace };
    const v = await validateKeysListRequest(idRef.current, op, DEMO_APP_ORIGIN);
    if (!v.ok) { setStatus(`refused: invalid (${v.reason})`); return; }
    put({ validated: v.validated, changed: false });
    setStatus('waiting for your approval…');
  };
  const swap = async () => {
    if (!pendingRef.current) return;
    const v = await validateKeysListRequest(idRef.current, { action: 'keys.list', namespace: SWAP_NS }, DEMO_APP_ORIGIN);
    if (v.ok) { setNote(''); put({ validated: v.validated, changed: true }); }
  };
  const approve = async (shown: ValidatedKeysList) => {
    const approval = approvalForKeys(shown);
    try {
      const current = pendingRef.current?.validated;
      if (!current || current !== shown) throw new ApprovalInvalidated();
      await assertKeysApproval(approval, current);
      const answer = {
        protocol: AGENT_PROTOCOL, type: 'agent.result', id: shown.requestId, ok: true,
        keys: listKeysFor(DEMO_APPROVER.namespace), identity: { ...DEMO_APPROVER },
      };
      const cloned = structuredClone(answer) as Record<string, unknown>;   // what postMessage would carry
      const grant = parseKeysGrant(cloned);                                 // the app's strict check
      setWire(JSON.stringify(cloned, null, 2));
      setReceived(grant);
      setStatus(grant ? 'ok' : 'refused: error');
      put(null);
    } catch (e) {
      if (e instanceof ApprovalInvalidated) setNote('Not sent: the request changed after you saw it. Review the current request and approve again.');
      else { setStatus('refused: error'); put(null); }
    }
  };
  const deny = () => { put(null); setStatus('refused: rejected'); };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Panel title={`An app at ${DEMO_APP_ORIGIN} (simulated)`} icon="apps" node="story.keys.app">
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          The app asks for the names of your keys. It never gets a value; nothing here goes on the network.
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <ActionButton tone="primary" action="keys-ask" onClick={() => { void ask(); }}><Icon name="key" fontSize="1rem" />Show my key names</ActionButton>
          <ActionButton action="keys-swap" disabled={!pending} onClick={() => { void swap(); }}>Swap the request (app misbehaves)</ActionButton>
        </Box>
        <Typography variant="caption" sx={{ fontFamily: 'monospace' }} data-keys-app-status>{status}</Typography>
        {received && (
          <Box data-keys-app-result>
            <Typography variant="caption" sx={{ fontWeight: 700 }}>Received: {received.keys.resource}</Typography>
            <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
              {received.keys.entries.map((e) => <Typography key={e.path} component="li" variant="caption" sx={{ fontFamily: 'monospace' }} data-keys-app-entry>{e.path} · {e.status}</Typography>)}
            </Box>
          </Box>
        )}
        {wire && (
          <Box component="details">
            <Box component="summary" sx={{ fontSize: '0.75rem', cursor: 'pointer' }}>The whole message the app received</Box>
            <Box component="pre" data-keys-app-wire sx={{ fontSize: '0.7rem', m: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{wire}</Box>
          </Box>
        )}
      </Panel>
      {pending && <ApprovalCard pending={pending} onApprove={(s) => { void approve(s); }} onDeny={deny} note={note} />}
    </Box>
  );
}

/** The namespace's Keys page in the story: your keys tree + an app asking for their names. */
export default function KeysListDemo({ namespace = DEMO_NS, username = 'jabellae' }: { namespace?: string; username?: string }) {
  return (
    <Seeded saved={DEMO_SAVED} custom={DEMO_CUSTOM}>{() => (
      <Box data-gui-component="KeysListDemo" sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(320px, 420px) minmax(320px, 1fr)' }, gap: 3, p: { xs: 2, md: 4 }, alignItems: 'start' }}>
        <Panel title={`Your keys · ${namespace}`} icon="key" node="story.keys.tree">
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Demo values only. Values show as dots; open a key and unlock it with the demo passphrase to see one, here only.
          </Typography>
          <IdentityTree nodeId="story.keys" username={username} namespace={namespace} onNavigate={() => {}} access="edit" hide={isLoginExcluded} />
        </Panel>
        <KeysListFlow namespace={namespace} />
      </Box>
    )}</Seeded>
  );
}
