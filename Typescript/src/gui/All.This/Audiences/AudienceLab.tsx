// Audience Lab — an experiment bench, with nothing drawn by hand.
//
// Several `.me`, each a real `<Me username>`; local disposable ledgers (real monads, see scripts/audience-lab-ledgers.mjs);
// links opened with the real session code (claim, signed write, read); audiences sealed with this.me's audience algebra
// and written through the link; what opens what computed by really trying every combination of keys against the envelope
// the ledger returns. The circles are that result.
//
// The real `<Cleaker>` is mounted too, for the chosen `.me` and ledger: its form is prefilled with the declared name.
import * as React from 'react';
import ME from 'this.me';
import { Box, Typography } from '@/gui/Atoms';
import { Me } from '@/react/Me';
import Cleaker from '@/gui/All.This/Cleaker/Cleaker';
import { ConnectionSeamsContext } from '@/gui/All.This/Cleaker/useQRConnect';
import { disposableDoorSeams } from '@/gui/All.This/Cleaker/disposableDoor';
import { createCleakerSession } from '@/core/session/createCleakerSession';
import { writeForAudience, openEnvelope, type AudienceEnvelope, type AudienceKey } from '@/core/session/audienceWrite';
import AudienceCircles from './AudienceCircles';
import { mapNames, namesIn, parseAudience } from './audienceFormula';

export type LabLedger = { id: string; root: string; origin: string };

export const DEFAULT_LEDGERS: LabLedger[] = [
  { id: 'A', root: 'a-test.local', origin: 'http://127.0.0.1:18331' },
  { id: 'B', root: 'b-test.local', origin: 'http://127.0.0.1:18332' },
  { id: 'C', root: 'c-test.local', origin: 'http://127.0.0.1:18333' },
];

type Party = {
  name: string;
  handle: string;
  password: string;
  keys: CryptoKeyPair;
  publicKey: any;
  identityHash: string;
  links: Record<string, any>;
};

type Run = {
  at: number;
  writer: string;
  ledger: string;
  path: string;
  audience: string;
  epoch: number;
  audienceId: string;
  coalitions: string[][];
  matchesAlgebra: boolean;
  envelope: AudienceEnvelope;
  minus?: string;
};

const kernel = ME as any;
const inputSx = {
  px: 1, py: 0.6, border: '1px solid', borderColor: 'divider', borderRadius: 1, bgcolor: 'transparent', color: 'text.primary',
  fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 13, '&:focus': { outline: 'none', borderColor: 'primary.main' },
};
const buttonSx = (primary?: boolean) => ({
  px: 1.5, py: 0.6, borderRadius: 1, border: '1px solid', borderColor: primary ? 'primary.main' : 'divider', bgcolor: 'transparent',
  color: primary ? 'primary.main' : 'text.primary', fontSize: 13, fontWeight: primary ? 700 : 500, cursor: 'pointer', fontFamily: 'inherit',
  '&:hover:not(:disabled)': { bgcolor: 'action.hover' }, '&:disabled': { opacity: 0.45, cursor: 'default' },
});

function subsets<T>(items: T[]): T[][] {
  return Array.from({ length: 1 << items.length }, (_, mask) => items.filter((_, i) => mask & (1 << i)));
}

function Section({ title, children, hint }: { title: string; children: React.ReactNode; hint?: string }) {
  return (
    <Box component="section" sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 3 }}>
      <Typography variant="overline" sx={{ letterSpacing: '0.1em', color: 'text.secondary' }}>{title}</Typography>
      {hint ? <Typography variant="caption" sx={{ color: 'text.secondary', mt: -0.5 }}>{hint}</Typography> : null}
      {children}
    </Box>
  );
}

export default function AudienceLab({
  ledgers = DEFAULT_LEDGERS,
  initialNames = ['ana', 'bob', 'carol'],
}: {
  ledgers?: LabLedger[];
  initialNames?: string[];
}) {
  const algebraOk = typeof kernel.sealAudience === 'function' && typeof kernel.openAudience === 'function';
  const tag = React.useMemo(() => Math.random().toString(36).slice(2, 6), []);
  const [names, setNames] = React.useState<string[]>(initialNames);
  const partiesRef = React.useRef<Record<string, Party>>({});
  const [, bump] = React.useReducer((n: number) => n + 1, 0);
  const [up, setUp] = React.useState<Record<string, boolean | null>>({});
  const [busy, setBusy] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const [writer, setWriter] = React.useState(initialNames[0]);
  const [ledgerId, setLedgerId] = React.useState(ledgers[0].id);
  const [path, setPath] = React.useState('notes.demo');
  const [value, setValue] = React.useState('hello');
  const [audienceText, setAudienceText] = React.useState('ana | bob');
  const [runs, setRuns] = React.useState<Run[]>([]);
  const [shownRun, setShownRun] = React.useState<number>(-1);
  const [openAs, setOpenAs] = React.useState<string[]>([]);
  const [openResult, setOpenResult] = React.useState<string>('');
  const [cleakerFor, setCleakerFor] = React.useState(initialNames[0]);
  const [cleakerOn, setCleakerOn] = React.useState(false);

  const ledger = (id: string) => ledgers.find((l) => l.id === id)!;
  const parties = names.map((n) => partiesRef.current[n]).filter(Boolean) as Party[];

  const probe = React.useCallback(async () => {
    const next: Record<string, boolean | null> = {};
    await Promise.all(ledgers.map(async (l) => {
      try {
        const r = await fetch(`${l.origin}/__surface`, { cache: 'no-store' });
        next[l.id] = r.ok;
      } catch { next[l.id] = false; }
    }));
    setUp(next);
  }, [ledgers]);
  React.useEffect(() => { void probe(); const t = setInterval(probe, 4000); return () => clearInterval(t); }, [probe]);

  // a `.me` exists as soon as it has a name: its keys are made here, its identity derived, nothing sent anywhere
  const ensure = React.useCallback(async (name: string): Promise<Party> => {
    const have = partiesRef.current[name];
    if (have) return have;
    const keys = await kernel.generateP256KeyPair();
    const handle = `${name}-${tag}`;
    const password = `lab-${name}-${tag}-correct-horse`;
    const l = ledgers[0];
    const idSession: any = createCleakerSession({ username: handle, password, namespace: l.root, transportOrigin: l.origin } as any);
    const party: Party = {
      name, handle, password, keys, publicKey: await kernel.exportP256PublicKey(keys.publicKey),
      identityHash: String(idSession.me['!'].identity().hash), links: {},
    };
    partiesRef.current[name] = party;
    return party;
  }, [ledgers, tag]);

  const join = async (name: string, id: string) => {
    setError(null);
    setBusy(`${name} → ${id}`);
    try {
      const p = await ensure(name);
      if (p.links[id]) return;
      const l = ledger(id);
      const session: any = createCleakerSession({ username: p.handle, password: p.password, namespace: l.root, transportOrigin: l.origin } as any);
      await session.claimAndOpen(`${p.handle}.${l.root}`);
      // the public key is public: published in the party's own namespace, where a sealer can find it
      await session.signAndWrite('profile.encryptionKey', p.publicKey);
      p.links[id] = session;
      bump();
    } catch (e: any) {
      setError(`${name} could not join ledger ${id}: ${e?.code || ''} ${e?.message || e}`.trim());
    } finally {
      setBusy(null);
    }
  };

  React.useEffect(() => { void Promise.all(names.map(ensure)).then(bump); }, [names, ensure]);

  const keyOf = (p: Party): AudienceKey => ({ identityHash: p.identityHash, privateKey: p.keys.privateKey });

  const analyse = async (envelope: AudienceEnvelope, all: Party[]): Promise<string[][]> => {
    const opening: string[][] = [];
    for (const subset of subsets(all)) {
      if (!subset.length) continue;
      try { await openEnvelope(envelope, subset.map(keyOf)); opening.push(subset.map((p) => p.name)); } catch { /* does not open */ }
    }
    return opening
      .filter((s) => !opening.some((t) => t.length < s.length && t.every((x) => s.includes(x))))
      .map((s) => [...s].sort())
      .sort((a, b) => a.join('+').localeCompare(b.join('+')));
  };

  const write = async (override?: { epoch: number; minus: string }) => {
    setError(null);
    setBusy('writing');
    try {
      if (!algebraOk) throw new Error('this.me does not expose the audience algebra (start Storybook with THIS_ME_SRC, see AudienceLab.tsx).');
      const all = await Promise.all(names.map(ensure));
      const w = all.find((p) => p.name === writer);
      const link = w?.links[ledgerId];
      if (!w || !link) throw new Error(`${writer} has no link in ledger ${ledgerId}: join it first.`);
      const formula = parseAudience(audienceText);
      const mentioned = [...namesIn(formula)];
      const unknown = mentioned.filter((n) => !names.includes(n));
      if (unknown.length) throw new Error(`Not a loaded .me: ${unknown.join(', ')}`);
      const byName = new Map(all.map((p) => [p.name, p]));
      const identity = (n: string) => ({ identityHash: byName.get(n)!.identityHash, publicKey: byName.get(n)!.publicKey });
      let audience: any = mapNames(formula, identity);
      if (override) audience = kernel.audienceMinus(audience, identity(override.minus));
      const epoch = override?.epoch ?? 1;
      const { envelope } = await writeForAudience(link, path, { said: value, by: writer }, audience, { epoch });
      // what the LEDGER returns, not what was just sealed
      const fromLedger = await link.readConfirmed(path) as AudienceEnvelope;
      const canonical = kernel.canonicalizeAudience(audience);
      const nameOf = (h: string) => all.find((p) => p.identityHash === h)?.name ?? h.slice(0, 6);
      const expected = canonical.coalitions.map((c: string[]) => c.map(nameOf).sort()).sort((a: string[], b: string[]) => a.join('+').localeCompare(b.join('+')));
      const observed = await analyse(fromLedger, all);
      const run: Run = {
        at: Date.now(), writer, ledger: ledgerId, path, audience: override ? `${audienceText}  \\ ${override.minus}` : audienceText, epoch,
        audienceId: String(canonical.id).slice(0, 10), coalitions: observed, matchesAlgebra: JSON.stringify(expected) === JSON.stringify(observed),
        envelope: fromLedger ?? envelope, minus: override?.minus,
      };
      setRuns((r) => { const next = [...r, run]; setShownRun(next.length - 1); return next; });
      setOpenResult('');
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setBusy(null);
    }
  };

  const tryOpen = async () => {
    const run = runs[shownRun];
    if (!run) return;
    try {
      const held = parties.filter((p) => openAs.includes(p.name)).map(keyOf);
      const opened: any = await openEnvelope(run.envelope, held);
      const v = Array.isArray(opened) ? opened[0] : opened;
      setOpenResult(`opens → ${JSON.stringify(v)}`);
    } catch (e: any) {
      setOpenResult(`does not open — ${String(e?.message || e).slice(0, 80)}`);
    }
  };

  const shown = runs[shownRun];
  const circleParties = names.map((n) => ({ id: n, ledgers: Object.keys(partiesRef.current[n]?.links ?? {}) }));
  const presets: Array<[string, string]> = [
    ['OR', names.join(' | ')],
    ['AND', names.join(' & ')],
    ...(names.length >= 3 ? [[`(${names[0]} & ${names[1]}) | ${names[2]}`, `(${names[0]} & ${names[1]}) | ${names[2]}`] as [string, string]] : []),
  ];
  const renameAt = (i: number, next: string) => setNames((cur) => cur.map((n, j) => (j === i ? next.trim().toLowerCase() : n)));

  return (
    <Box sx={{ maxWidth: 980, mx: 'auto', p: { xs: 2, md: 4 } }} data-gui-node-id="AudienceLab">
      <Typography variant="h4" sx={{ fontWeight: 700, letterSpacing: '-0.02em', mb: 0.5 }}>Audience Lab</Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3, maxWidth: 720 }}>
        Several <code>.me</code>, local ledgers, an audience written through each link. Everything here is run, not drawn:
        the circles are what really opens when every combination of keys is tried against the envelope the ledger returns.
      </Typography>

      {!algebraOk && (
        <Box sx={{ p: 1.5, mb: 2, border: '1px solid', borderColor: 'warning.main', borderRadius: 1, fontSize: 13 }}>
          This <code>this.me</code> does not expose the audience algebra. Start Storybook with
          {' '}<code>THIS_ME_SRC=../../me-export-audience/Typescript/index.ts</code>.
        </Box>
      )}

      <Section title="1 · Ledgers" hint="Real monads on this machine: npm run lab:ledgers">
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
          {ledgers.map((l) => (
            <Box key={l.id} sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.8, fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 13 }}>
              <Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: up[l.id] ? 'success.main' : up[l.id] === false ? 'error.main' : 'warning.main' }} />
              {l.id} · {l.root} {up[l.id] === false ? '(not running)' : ''}
            </Box>
          ))}
        </Box>
      </Section>

      <Section title="2 · The .me" hint="Each name is a <Me username>. Join puts a link in a ledger: a claim, a published key, a signed session.">
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {names.map((n, i) => (
            <Box key={i} sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
              <Box component="input" value={n} onChange={(e: React.ChangeEvent<HTMLInputElement>) => renameAt(i, e.target.value)}
                disabled={Boolean(partiesRef.current[n]) && Object.keys(partiesRef.current[n].links).length > 0}
                sx={{ ...inputSx, width: 120 }} aria-label={`name of .me ${i + 1}`} />
              {ledgers.map((l) => {
                const joined = Boolean(partiesRef.current[n]?.links[l.id]);
                return (
                  <Box key={l.id} component="button" type="button" disabled={joined || !up[l.id] || busy !== null || !algebraOk}
                    onClick={() => join(n, l.id)} sx={buttonSx(joined)}>
                    {joined ? `✓ ${l.id}` : `join ${l.id}`}
                  </Box>
                );
              })}
              <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'ui-monospace, Menlo, monospace' }}>
                {partiesRef.current[n] ? `identity ${partiesRef.current[n].identityHash.slice(0, 10)}` : '…'}
              </Typography>
            </Box>
          ))}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Box component="button" type="button" sx={buttonSx()} disabled={names.length >= 5}
              onClick={() => setNames((cur) => [...cur, ['dave', 'erin', 'robot', 'frank'].find((x) => !cur.includes(x)) || `me${cur.length + 1}`])}>
              + .me
            </Box>
            <Box component="button" type="button" sx={buttonSx()} disabled={names.length <= 2 || parties.some((p) => Object.keys(p.links).length > 0 && p.name === names[names.length - 1])}
              onClick={() => setNames((cur) => cur.slice(0, -1))}>
              − .me
            </Box>
          </Box>
        </Box>
      </Section>

      <Section title="3 · Write for an audience" hint="& is AND, | is OR, parentheses nest. Names are the .me above.">
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(4, minmax(0, 1fr))' }, gap: 1 }}>
          <Box component="select" value={writer} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setWriter(e.target.value)} sx={inputSx} aria-label="writer">
            {names.map((n) => <option key={n} value={n}>writer: {n}</option>)}
          </Box>
          <Box component="select" value={ledgerId} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setLedgerId(e.target.value)} sx={inputSx} aria-label="ledger">
            {ledgers.map((l) => <option key={l.id} value={l.id}>ledger {l.id}</option>)}
          </Box>
          <Box component="input" value={path} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPath(e.target.value)} sx={inputSx} aria-label="path" />
          <Box component="input" value={value} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setValue(e.target.value)} sx={inputSx} aria-label="value" />
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
          <Box component="input" value={audienceText} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAudienceText(e.target.value)}
            sx={{ ...inputSx, flex: 1, minWidth: 220 }} aria-label="audience" data-gui-node-id="AudienceLab.audience" />
          {presets.map(([label, text]) => (
            <Box key={label} component="button" type="button" sx={buttonSx()} onClick={() => setAudienceText(text)}>{label}</Box>
          ))}
          <Box component="button" type="button" sx={buttonSx(true)} disabled={busy !== null || !algebraOk} onClick={() => write()} data-gui-node-id="AudienceLab.write">
            {busy === 'writing' ? 'writing…' : 'seal & write'}
          </Box>
        </Box>
        {error ? <Typography variant="body2" sx={{ color: 'error.main', fontSize: 13 }} data-gui-node-id="AudienceLab.error">{error}</Typography> : null}
      </Section>

      <Section title="4 · What opens" hint="Every combination of keys, tried against the envelope as the ledger returned it.">
        <Box sx={{ maxWidth: 640, mx: 'auto', width: '100%' }} data-gui-node-id="AudienceLab.circles">
          <AudienceCircles
            ledgers={ledgers.map((l) => ({ id: l.id, root: l.root, up: up[l.id] ?? null }))}
            parties={circleParties}
            coalitions={shown?.coalitions ?? []}
            writtenIn={shown?.ledger ?? null}
            epoch={shown?.epoch}
          />
        </Box>
        {shown ? (
          <Typography variant="body2" sx={{ textAlign: 'center', color: 'text.secondary' }} data-gui-node-id="AudienceLab.result">
            {shown.matchesAlgebra ? '✓ equals the canonical form of the audience written' : '✗ does NOT equal the audience written'}
            {' · '}audience id <code>{shown.audienceId}</code> · epoch {shown.epoch}
          </Typography>
        ) : null}
        {shown ? (
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center' }}>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>Try opening as:</Typography>
            {names.map((n) => (
              <Box key={n} component="label" sx={{ display: 'inline-flex', gap: 0.5, alignItems: 'center', fontSize: 13, fontFamily: 'ui-monospace, Menlo, monospace' }}>
                <input type="checkbox" checked={openAs.includes(n)}
                  onChange={(e) => setOpenAs((cur) => (e.target.checked ? [...cur, n] : cur.filter((x) => x !== n)))} />
                {n}
              </Box>
            ))}
            <Box component="button" type="button" sx={buttonSx()} onClick={tryOpen}>open</Box>
            <Typography variant="body2" sx={{ fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 13 }} data-gui-node-id="AudienceLab.open">{openResult}</Typography>
          </Box>
        ) : null}
        {shown ? (
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>Revoke (reseal, epoch {shown.epoch + 1}) without:</Typography>
            {names.map((n) => (
              <Box key={n} component="button" type="button" sx={buttonSx()} disabled={busy !== null}
                onClick={() => write({ epoch: shown.epoch + 1, minus: n })}>
                {n}
              </Box>
            ))}
          </Box>
        ) : null}
      </Section>

      {runs.length > 1 ? (
        <Section title="Runs">
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {runs.map((r, i) => (
              <Box key={r.at} component="button" type="button" onClick={() => setShownRun(i)}
                sx={{ ...buttonSx(i === shownRun), textAlign: 'left', fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 12 }}>
                #{i + 1} · {r.writer} → {r.ledger}:{r.path} · {r.audience} · epoch {r.epoch} · opens {r.coalitions.map((c) => c.join('+')).join(' | ') || 'no one'}
              </Box>
            ))}
          </Box>
        </Section>
      ) : null}

      <Section title="5 · The real <Me> and <Cleaker>" hint="The front door for the chosen .me in the chosen ledger. Its form arrives with the declared name already in it.">
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Box component="select" value={cleakerFor} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCleakerFor(e.target.value)} sx={inputSx} aria-label="cleaker as">
            {names.map((n) => <option key={n} value={n}>{n}</option>)}
          </Box>
          <Box component="select" value={ledgerId} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setLedgerId(e.target.value)} sx={inputSx} aria-label="cleaker ledger">
            {ledgers.map((l) => <option key={l.id} value={l.id}>ledger {l.id}</option>)}
          </Box>
          <Box component="button" type="button" sx={buttonSx(cleakerOn)} onClick={() => setCleakerOn((v) => !v)}>
            {cleakerOn ? 'unload' : 'load <Me><Cleaker/></Me>'}
          </Box>
        </Box>
        {cleakerOn ? (
          <Box sx={{ position: 'relative', transform: 'translateZ(0)', height: 460, overflow: 'hidden', border: '1px solid', borderColor: 'divider', borderRadius: 1 }}
            data-gui-node-id="AudienceLab.cleaker">
            <ConnectionSeamsContext.Provider key={`${cleakerFor}-${ledgerId}`} value={disposableDoorSeams(ledger(ledgerId).origin)}>
              <Me username={cleakerFor}>
                <Cleaker namespace={ledger(ledgerId).root} transport={ledger(ledgerId).origin} />
              </Me>
            </ConnectionSeamsContext.Provider>
          </Box>
        ) : null}
      </Section>
    </Box>
  );
}
