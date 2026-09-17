import * as React from 'react';
import { Box, TextField } from '@mui/material';
import Typography from '@/gui/Atoms/Typography/Typography';
import { useOptionalSeedSessionContext } from '@/react/session/SeedSessionProvider';
import { useOptionalMeRuntimeContext } from '@/react/MeRuntimeProvider';
import { SelectionProvider, useRegisterGuiNode } from '@/runtime/selection';
import { RuntimeEnvironmentProvider } from '@/runtime/runtimeContext';
import { RuntimeInspector } from '@/runtime/inspector';
import { readMeValue } from '@/runtime/run-me';

// The one `.me` path this whole demo is about. Sits alongside the existing
// `profile.username` / `profile.name` / `profile.email` / `profile.phone`
// paths already read in Cleaker.tsx — same family, not a new convention.
const PATH = 'profile.displayName';

type SaveState = { status: 'idle' | 'saving' | 'saved' | 'error'; message?: string };

// Booleans only, deliberately -- this compares three independent reads of
// the SAME path without ever surfacing their actual content:
//   - localHasValue: a DIRECT local read (readMeValue -> self:read/..., the
//     same mechanism session.read() uses) sees a value at all.
//   - explainHasValue: me.explain(path) (the exact call the Inspector
//     makes) sees a value.
//   - explainMatchesLocal: when both have a value, do they agree.
//   - explainMatchesConfirmed: does explain's value match the value
//     readConfirmed() just got from the real server round trip.
// If localHasValue is false, the mirror-write or the path resolution is the
// place to look. If localHasValue is true but explainHasValue is false,
// the mismatch is between self:read and explain() specifically -- a
// different bug, in the kernel's explain() contract or how the Inspector
// interprets it, not in the write/mirror path at all.
type ReadDiag = {
  localHasValue: boolean;
  explainHasValue: boolean;
  explainMatchesLocal: boolean | null;
  explainMatchesConfirmed: boolean | null;
};

async function callKernelExplain(me: any, path: string): Promise<{ value: unknown } | null> {
  if (typeof me?.explain === 'function') return me.explain(path);
  if (typeof me?.['!']?.explain === 'function') return me['!'].explain(path);
  if (typeof me?.execute === 'function') return me.execute(`self:explain/${path}`);
  return null;
}

function DisplayNameField({
  id,
  label,
  value,
  onChange,
  onCommit,
  disabled,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  onCommit: () => void;
  disabled: boolean;
}) {
  // Registers this hand-authored input into the SAME node registry the
  // declarative spec-tree renderer uses (selectionStore.ts's
  // registerNode/unregisterNode), via the sanctioned hook for plain JSX —
  // see selection.tsx's useRegisterGuiNode doc comment. `semanticPath`/
  // `explainPath` are what inspector.tsx's resolveExplainPath() actually
  // reads; both fields point at the SAME path so the Inspector explains
  // the same kernel value no matter which of the two fields was clicked.
  // The Inspector's Explain then queries this SAME component tree's own
  // `me` (see DisplayNameProvenanceDemo's RuntimeEnvironmentProvider
  // below) — signAndWrite/readConfirmed mirror every CONFIRMED server
  // value into that exact kernel instance, so Explain reflects the same
  // destination this path was actually read from/written to, not some
  // other, disconnected local copy.
  useRegisterGuiNode(id, 'Provenance.DisplayNameField', undefined, {
    semanticPath: PATH,
    explainPath: PATH,
    binding: PATH,
    source: 'DisplayNameProvenanceDemo.tsx',
    note: `Interface "${label}" — one of two independent GUI surfaces bound to the same .me path.`,
  });

  return (
    <TextField
      data-gui-node-id={id}
      id={id}
      label={label}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onCommit}
      onKeyDown={(e) => { if (e.key === 'Enter') onCommit(); }}
      fullWidth
      size="small"
    />
  );
}

function DisplayNameProvenanceInner({ inspectorMe }: { inspectorMe: unknown }) {
  const ctx = useOptionalSeedSessionContext();
  const session = ctx?.session ?? null;
  const semanticNamespace = ctx?.semanticNamespace ?? null;

  const [confirmed, setConfirmed] = React.useState('');
  const [draftA, setDraftA] = React.useState('');
  const [draftB, setDraftB] = React.useState('');
  const [save, setSave] = React.useState<SaveState>({ status: 'idle' });
  const [loaded, setLoaded] = React.useState(false);

  // The GUI's own vocabulary is just "get me the confirmed value at this
  // path" — session.readConfirmed() is a real, disclosure-checked GET
  // against THIS session's own namespace/monad (never the local-only
  // session.read(), which only ever answers from whatever this tab already
  // has in memory, proving nothing about persistence). Which namespace that
  // resolves to is entirely the session's own concern, not this
  // component's — see createCleakerSession.ts's readConfirmed().
  const loadFromServer = React.useCallback(async () => {
    if (!session?.readConfirmed || !semanticNamespace) return;
    try {
      const next = (await session.readConfirmed<string>(PATH)) ?? '';
      setConfirmed(next);
      setDraftA(next);
      setDraftB(next);
    } finally {
      setLoaded(true);
    }
  }, [session, semanticNamespace]);

  React.useEffect(() => { loadFromServer(); }, [loadFromServer]);

  // Runs immediately after the server mirror lands (loaded flips true) --
  // per instruction, this compares a direct local read against
  // me.explain() and against the confirmed server value RIGHT AWAY, rather
  // than waiting for a manual Explain click, and reports only whether they
  // agree, never their content.
  const [readDiag, setReadDiag] = React.useState<ReadDiag | null>(null);
  React.useEffect(() => {
    if (!loaded || !session) { setReadDiag(null); return; }
    let cancelled = false;
    (async () => {
      const me: any = session.me;
      let localValue: unknown;
      try { localValue = readMeValue(me, PATH, { allowBarePath: true }); } catch { localValue = undefined; }
      let explainValue: unknown;
      try { explainValue = (await callKernelExplain(me, PATH))?.value; } catch { explainValue = undefined; }
      if (cancelled) return;
      const localHasValue = localValue !== undefined;
      const explainHasValue = explainValue !== undefined;
      setReadDiag({
        localHasValue,
        explainHasValue,
        explainMatchesLocal: localHasValue && explainHasValue ? explainValue === localValue : null,
        explainMatchesConfirmed: confirmed !== '' && explainHasValue ? explainValue === confirmed : null,
      });
    })();
    return () => { cancelled = true; };
  }, [loaded, confirmed, session]);

  // Likewise: "save this value at this path" is the entire vocabulary here.
  // signAndWrite() owns the canonicalization, the signature, and which
  // namespace/identity it's signed for — this component never touches any
  // of that (see createCleakerSession.ts's signAndWrite() for the actual
  // contract: matches monadClient.ts's writeNamespace() body byte-for-byte,
  // verified server-side by modules/monad's replay.ts).
  const commit = React.useCallback(async (nextValue: string) => {
    if (!session?.signAndWrite) {
      setSave({ status: 'error', message: 'This session cannot sign writes.' });
      return;
    }
    if (nextValue === confirmed) return;
    setSave({ status: 'saving' });
    try {
      await session.signAndWrite(PATH, nextValue);
      // Re-read from the server rather than trusting the write call's own
      // return value -- this is what actually proves persistence, as
      // opposed to a locally-mirrored optimistic update. Both fields below
      // re-render from this ONE confirmed value: within this page that's a
      // real, provable shared update, but it is not evidence of any sync
      // across separate tabs/clients — no such channel exists here.
      await loadFromServer();
      setSave({ status: 'saved' });
    } catch (err) {
      setSave({ status: 'error', message: err instanceof Error ? err.message : String(err) });
    }
  }, [session, confirmed, loadFromServer]);

  if (!session || !semanticNamespace) {
    return (
      <Typography variant="body2" sx={{ opacity: 0.7 }}>
        Sign in to a namespace to try the profile.displayName demo.
      </Typography>
    );
  }

  // No secrets in any of this -- namespace and path are already shown
  // above, and this only adds two booleans/a namespace echo -- but it
  // directly answers what a code-level review can't: is the Inspector
  // genuinely looking at the SAME kernel instance readConfirmed() just
  // updated, and has that update actually landed before Explain runs.
  const kernelIdentityMatches = session ? Object.is(session.me, inspectorMe) : null;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, maxWidth: 420 }}>
      <Typography variant="caption" sx={{ opacity: 0.6, fontFamily: 'monospace' }}>
        me://{semanticNamespace}/{PATH}
      </Typography>
      <Typography variant="caption" sx={{ opacity: 0.5, fontFamily: 'monospace', fontSize: '0.65rem' }}>
        diagnostics — session.me === inspector.me: {String(kernelIdentityMatches)} | server mirror loaded: {String(loaded)}
      </Typography>
      {readDiag && (
        <Typography variant="caption" sx={{ opacity: 0.5, fontFamily: 'monospace', fontSize: '0.65rem' }}>
          direct local read has value: {String(readDiag.localHasValue)} | explain() has value: {String(readDiag.explainHasValue)}
          {' | explain matches local: '}{String(readDiag.explainMatchesLocal)}
          {' | explain matches confirmed server value: '}{String(readDiag.explainMatchesConfirmed)}
        </Typography>
      )}
      <DisplayNameField
        id="displayname-demo-input-a"
        label="Display name (card)"
        value={draftA}
        onChange={setDraftA}
        onCommit={() => commit(draftA)}
        disabled={!loaded || save.status === 'saving'}
      />
      <DisplayNameField
        id="displayname-demo-input-b"
        label="Display name (settings row)"
        value={draftB}
        onChange={setDraftB}
        onCommit={() => commit(draftB)}
        disabled={!loaded || save.status === 'saving'}
      />
      <Typography
        variant="caption"
        sx={{
          color: save.status === 'error' ? 'error.main' : save.status === 'saved' ? 'success.main' : 'text.secondary',
        }}
      >
        {save.status === 'idle' && (loaded ? `Confirmed: "${confirmed}"` : 'Loading…')}
        {save.status === 'saving' && 'Saving…'}
        {save.status === 'saved' && `Saved and confirmed by the server: "${confirmed}"`}
        {save.status === 'error' && `Rejected: ${save.message}`}
      </Typography>
    </Box>
  );
}

/**
 * Minimal, self-contained proof that two independent GUI interfaces (two
 * TextFields, two DOM ids, two labels) can operate on the same `.me`
 * meaning (profile.displayName, under the session's own namespace) through
 * the REAL authorized/persisted write channel — session.signAndWrite(),
 * backed by a genuine Ed25519 signature the SESSION assembles and signs
 * internally (see createCleakerSession.ts) — not the local-only
 * safeWriteKernelPath pattern used elsewhere in Cleaker.tsx/namespace.tsx/
 * useCleakerKernelSync.ts, which never reaches the network at all (see that
 * hook's own doc comment: "does not perform imperative mesh writes"). This
 * component itself never builds a payload, never signs anything, and never
 * chooses a namespace — it only ever says "save this value at this path" /
 * "get the confirmed value at this path". Deliberately does NOT touch
 * Username/Secret -- those stay auth-operation-only, per instruction.
 *
 * Wraps itself in its own SelectionProvider/RuntimeEnvironmentProvider/
 * RuntimeInspector rather than requiring the host app to adopt them
 * globally -- frontend_local's CleakerLanding tree doesn't mount AppShell,
 * so none of the three exist there today. This keeps the demo's blast
 * radius to exactly this subtree: dropping it into a route changes nothing
 * else about the app's shell. `me` here is pulled from the SAME
 * MeRuntimeProvider the whole authenticated session already mounts (via
 * useOptionalMeRuntimeContext) — it is the session's own kernel, not a
 * separate one, so Explain observes the same destination this component
 * reads from and writes to.
 */
export default function DisplayNameProvenanceDemo() {
  const runtimeCtx = useOptionalMeRuntimeContext();
  return (
    <SelectionProvider>
      <RuntimeEnvironmentProvider value={{ me: runtimeCtx?.me ?? undefined, runtime: runtimeCtx?.runtime ?? undefined }}>
        <DisplayNameProvenanceInner inspectorMe={runtimeCtx?.me} />
        {/* toggleVisible: without it RuntimeInspector renders no on/off
            control at all, and inspectorEnabled defaults to false -- there
            would be no way to turn it on from the page itself. */}
        <RuntimeInspector toggleVisible />
      </RuntimeEnvironmentProvider>
    </SelectionProvider>
  );
}
