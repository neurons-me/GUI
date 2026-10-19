// A run of combinations: several `.me`s, two ledgers, audiences sealed through each link's signed write and opened by
// whoever holds the keys. LIVE: needs two disposable monads (see continuity.live.test.ts for how to start them) and a
// this.me that exposes the audience algebra (ME.sealAudience / ME.openAudience).
//
//   AUD_OUT=/path/run.json CONT_A=… CONT_A_ROOT=a-test.local CONT_B=… CONT_B_ROOT=b-test.local \
//     npx tsx --tsconfig tests/tsconfig.audience-run.json tests/audience-ledgers.live.test.ts
//
// What it checks, for every scenario: the set of minimal key-sets that open the envelope READ BACK FROM THE LEDGER is
// exactly the canonical form of the audience that was written (the algebra's own `min(A)`).
import fs from 'node:fs';
import ME from 'this.me';
import { createCleakerSession } from '../src/core/session/createCleakerSession';
import { writeForAudience, openEnvelope, type AudienceEnvelope, type AudienceKey } from '../src/core/session/audienceWrite';

const A = process.env.CONT_A, ROOT_A = process.env.CONT_A_ROOT, B = process.env.CONT_B, ROOT_B = process.env.CONT_B_ROOT;
if (!A || !ROOT_A || !B || !ROOT_B) {
  console.log('audience-ledgers.live: skipped (set CONT_A, CONT_A_ROOT, CONT_B, CONT_B_ROOT)');
  process.exit(0);
}
const kernel = ME as any;
if (typeof kernel.sealAudience !== 'function') {
  console.log('audience-ledgers.live: skipped (this.me does not expose the audience algebra; use --tsconfig tests/tsconfig.audience-run.json)');
  process.exit(0);
}

type LedgerId = 'A' | 'B';
const LEDGERS: Record<LedgerId, { origin: string; root: string }> = { A: { origin: A, root: ROOT_A }, B: { origin: B, root: ROOT_B } };
const tag = Math.random().toString(36).slice(2, 7);

// who is where: one `.me` per party, a link (a session) in each ledger it is present in
const PRESENCE: Record<string, LedgerId[]> = { ana: ['A', 'B'], bob: ['A'], carol: ['B'], robot: ['A', 'B'] };
const PARTIES = Object.keys(PRESENCE);

type Party = {
  id: string; handle: string; password: string; keys: CryptoKeyPair; publicKey: any;
  links: Partial<Record<LedgerId, any>>; identityHash: string;
};
const parties: Record<string, Party> = {};
const results: Array<{ n: string; ok: boolean; detail: string }> = [];
const check = (n: string, ok: boolean, detail = '') => { results.push({ n, ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${detail ? `  — ${detail}` : ''}`); };
const nameIn = (p: Party, l: LedgerId) => `${p.handle}.${LEDGERS[l].root}`;

async function setup() {
  for (const id of PARTIES) {
    const handle = `${id}-${tag}`;
    const password = `pw-${id}-${tag}-correct-horse`;
    const keys = await kernel.generateP256KeyPair();
    const party: Party = { id, handle, password, keys, publicKey: await kernel.exportP256PublicKey(keys.publicKey), links: {}, identityHash: '' };
    for (const l of PRESENCE[id]) {
      const s: any = createCleakerSession({ username: handle, password, namespace: LEDGERS[l].root, transportOrigin: LEDGERS[l].origin } as any);
      await s.claimAndOpen(nameIn(party, l));
      party.links[l] = s;
      party.identityHash = s.identityHash;
      // the public key is public: published in the party's own namespace, in every ledger it is present in
      await s.signAndWrite('profile.encryptionKey', party.publicKey);
    }
    parties[id] = party;
  }
}

// key discovery THROUGH the ledgers: read the recipient's published key from a namespace where it is present
async function discoverIdentity(id: string, via: LedgerId) {
  const p = parties[id];
  const l = PRESENCE[id].includes(via) ? via : PRESENCE[id][0];
  const reader: any = Object.values(parties.ana.links)[0];
  const r = await reader.monad.readNamespacePath({ semanticNamespace: nameIn(p, l), transportOrigin: LEDGERS[l].origin, path: 'profile.encryptionKey' });
  return { identityHash: p.identityHash, publicKey: r.value, foundIn: l };
}

const keyOf = (id: string): AudienceKey => ({ identityHash: parties[id].identityHash, privateKey: parties[id].keys.privateKey });
const nameOfHash = (h: string) => PARTIES.find((id) => parties[id].identityHash === h) || h.slice(0, 6);

function subsets<T>(items: T[]): T[][] {
  return Array.from({ length: 1 << items.length }, (_, mask) => items.filter((_, i) => mask & (1 << i)));
}

// what opens the envelope as the LEDGER returns it: every subset of parties, reduced to the minimal ones
async function minimalOpeners(envelope: AudienceEnvelope): Promise<string[][]> {
  const opening: string[][] = [];
  for (const subset of subsets(PARTIES)) {
    if (!subset.length) continue;
    try { await openEnvelope(envelope, subset.map(keyOf)); opening.push(subset); } catch { /* does not open */ }
  }
  return opening
    .filter((s) => !opening.some((t) => t.length < s.length && t.every((x) => s.includes(x))))
    .map((s) => [...s].sort())
    .sort((a, b) => a.join('+').localeCompare(b.join('+')));
}

async function readFromLedger(ledger: LedgerId, ownerId: string, path: string): Promise<AudienceEnvelope> {
  const p = parties[ownerId];
  const reader: any = Object.values(parties.ana.links)[0];
  const r = await reader.monad.readNamespacePath({ semanticNamespace: nameIn(p, ledger), transportOrigin: LEDGERS[ledger].origin, path });
  return r.value as AudienceEnvelope;
}

const scenarios: any[] = [];

async function scenario(def: {
  id: string; title: string; ledger: LedgerId; writer: string; path: string; describe: string; formula: () => Promise<any>; epoch?: number; note?: string;
}) {
  const formula = await def.formula();
  const writer = parties[def.writer];
  const link = writer.links[def.ledger];
  if (!link) throw new Error(`${def.writer} has no link in ledger ${def.ledger}`);
  const { envelope } = await writeForAudience(link, def.path, { said: def.title, by: def.writer }, formula, { epoch: def.epoch });
  const fromLedger = await readFromLedger(def.ledger, def.writer, def.path);
  const canonical = kernel.canonicalizeAudience(formula);
  const expected = canonical.coalitions.map((c: string[]) => c.map(nameOfHash).sort()).sort((a: string[], b: string[]) => a.join('+').localeCompare(b.join('+')));
  const observed = await minimalOpeners(fromLedger);
  const matches = JSON.stringify(expected) === JSON.stringify(observed);
  check(`${def.id}. ${def.title}`, matches, `audience ${def.describe} → opens: ${observed.map((s) => s.join('+')).join(' | ') || 'no one'}`);
  scenarios.push({
    id: def.id, title: def.title, ledger: def.ledger, writer: def.writer, path: def.path, audience: def.describe,
    audienceId: String(canonical.id).slice(0, 10), epoch: envelope.epoch, coalitions: observed, matchesAlgebra: matches, note: def.note || '',
  });
  return { envelope: fromLedger, canonical };
}

async function main() {
  await setup();
  const id = (name: string, via: LedgerId = 'A') => discoverIdentity(name, via);

  // 1. same ledger, OR
  await scenario({ id: 'S1', title: 'same ledger, OR', ledger: 'A', writer: 'ana', path: 'notes.s1', describe: '[ana, bob]',
    formula: async () => [await id('ana'), await id('bob')] });

  // 2. same ledger, AND
  await scenario({ id: 'S2', title: 'same ledger, AND', ledger: 'A', writer: 'ana', path: 'notes.s2', describe: '{and: [ana, bob]}',
    formula: async () => ({ and: [await id('ana'), await id('bob')] }) });

  // 3. the same audience written in two different ledgers
  const f3 = async () => [await id('ana'), await id('robot')];
  await scenario({ id: 'S3a', title: 'different ledgers, same audience (written in A)', ledger: 'A', writer: 'ana', path: 'notes.s3', describe: '[ana, robot]', formula: f3 });
  await scenario({ id: 'S3b', title: 'different ledgers, same audience (written in B)', ledger: 'B', writer: 'ana', path: 'notes.s3', describe: '[ana, robot]', formula: f3 });

  // 4. a member who has no link where the value is written: reading is public, opening is keys
  await scenario({ id: 'S4', title: 'member with no link in that ledger (bob reads B)', ledger: 'B', writer: 'ana', path: 'notes.s4', describe: '[ana, bob]',
    formula: async () => [await id('ana', 'B'), await id('bob', 'A')], note: 'bob is only in ledger A; his key was found there' });

  // 5. nested
  await scenario({ id: 'S5', title: 'nested: (ana AND bob) OR carol, across ledgers', ledger: 'A', writer: 'ana', path: 'notes.s5', describe: '[{and:[ana,bob]}, carol]',
    formula: async () => [{ and: [await id('ana'), await id('bob')] }, await id('carol', 'B')], note: 'carol is only in B; her key was found there' });

  // 6. revocation: epoch 2 without bob, the earlier version kept by whoever had it
  const base = async () => [await id('ana'), await id('bob'), await id('carol', 'B')];
  const first = await scenario({ id: 'S6a', title: 'revocation: epoch 1', ledger: 'A', writer: 'ana', path: 'notes.s6', describe: '[ana, bob, carol]', formula: base, epoch: 1 });
  const bobIdentity = await id('bob');
  await scenario({ id: 'S6b', title: 'revocation: epoch 2 without bob', ledger: 'A', writer: 'ana', path: 'notes.s6', describe: '[ana, bob, carol] \\ bob',
    formula: async () => kernel.audienceMinus(await base(), bobIdentity), epoch: 2,
    note: 'same path, new seal: bob no longer opens what the ledger now holds' });
  // bob kept the epoch 1 envelope he already had: L7 says that version is unchanged
  let kept = false;
  try { await openEnvelope(first.envelope, [keyOf('bob')]); kept = true; } catch { kept = false; }
  check('S6c. what bob already held at epoch 1 still opens (L7: earlier versions are not rewritten)', kept);
  scenarios.push({ id: 'S6c', title: 'bob keeps the epoch 1 envelope he held', ledger: 'A', writer: 'ana', path: 'notes.s6', audience: 'epoch 1 [ana, bob, carol]',
    audienceId: String(first.canonical.id).slice(0, 10), epoch: 1, coalitions: [['ana'], ['bob'], ['carol']], matchesAlgebra: kept, note: 'a copy held from before the reseal' });

  const out = {
    generatedAt: new Date().toISOString(),
    ledgers: (Object.keys(LEDGERS) as LedgerId[]).map((l) => ({ id: l, root: LEDGERS[l].root })),
    parties: PARTIES.map((p) => ({ id: p, ledgers: PRESENCE[p], identity: parties[p].identityHash.slice(0, 10) })),
    scenarios,
  };
  if (process.env.AUD_OUT) fs.writeFileSync(process.env.AUD_OUT, JSON.stringify(out, null, 2));
}

main().then(() => {
  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} pass`);
  process.exit(failed.length ? 1 : 0);
}).catch((e) => { console.error('HARNESS ERROR', e); process.exit(2); });
