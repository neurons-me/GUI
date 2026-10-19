// Every combination of the architecture, one table. LIVE: needs three local ledgers (`npm run lab:ledgers`).
//
//   CONT_A=http://127.0.0.1:18331 CONT_A_ROOT=a-test.local CONT_B=http://127.0.0.1:18332 CONT_B_ROOT=b-test.local \
//   CONT_C=http://127.0.0.1:18333 CONT_C_ROOT=c-test.local npx tsx tests/combinations.live.test.ts
//
// A "link" is what a <Cleaker> opens (createCleakerSession). A "party" is a <Me>. For every number of parties (1-3), every
// number of ledgers (1-3) and both ways of holding an identity (the same key in every ledger, a different key per ledger),
// each cell runs the same checklist. A cell is green only if every item passed.
import { normalizeProofMessage } from 'this.me';
import { createCleakerSession } from '../src/core/session/createCleakerSession';

const env = process.env;
const LEDGERS = [
  { id: 'A', origin: env.CONT_A, root: env.CONT_A_ROOT },
  { id: 'B', origin: env.CONT_B, root: env.CONT_B_ROOT },
  { id: 'C', origin: env.CONT_C, root: env.CONT_C_ROOT },
] as Array<{ id: string; origin: string; root: string }>;
if (LEDGERS.some((l) => !l.origin || !l.root)) {
  console.log('combinations.live: skipped (set CONT_A/B/C and CONT_A/B/C_ROOT; start ledgers with `npm run lab:ledgers`)');
  process.exit(0);
}

const tag = Math.random().toString(36).slice(2, 6);
type Mode = 'same key' | 'key per ledger';
type Item = { name: string; ok: boolean; detail: string };
const attempt = async <T,>(fn: () => Promise<T>) => { try { return { ok: true as const, value: await fn() }; } catch (e: any) { return { ok: false as const, code: String(e?.code || ''), message: String(e?.message || e) }; } };

async function cell(nParties: number, nLedgers: number, mode: Mode, cellId: string): Promise<Item[]> {
  const items: Item[] = [];
  const add = (name: string, ok: boolean, detail = '') => items.push({ name, ok, detail });
  const ledgers = LEDGERS.slice(0, nLedgers);
  const parties = Array.from({ length: nParties }, (_, i) => `p${i + 1}-${cellId}-${tag}`);
  const passwordFor = (p: string, l: string) => (mode === 'same key' ? `pw-${p}-${tag}` : `pw-${p}-${l}-${tag}`);
  const links: Record<string, Record<string, any>> = {};

  // 1. every party opens a link in every ledger
  for (const p of parties) {
    links[p] = {};
    for (const l of ledgers) {
      const s: any = createCleakerSession({ username: p, password: passwordFor(p, l.id), namespace: l.root, transportOrigin: l.origin } as any);
      const r = await attempt(() => s.claimAndOpen(`${p}.${l.root}`));
      add(`${p} opens ${l.id}`, r.ok, r.ok ? '' : `${(r as any).code} ${(r as any).message}`.slice(0, 60));
      if (r.ok) links[p][l.id] = s;
    }
  }
  const open = (p: string, l: string) => links[p]?.[l];

  // 2. write and read back, each its own value
  for (const p of parties) for (const l of ledgers) {
    const s = open(p, l.id); if (!s) continue;
    const w = await attempt(() => s.signAndWrite('profile.note', `${p}@${l.id}`));
    const r = await attempt(() => s.readConfirmed('profile.note'));
    add(`${p} writes+reads ${l.id}`, w.ok && r.ok && (r as any).value === `${p}@${l.id}`, JSON.stringify((r as any).value));
  }

  // 3. identity: the same key everywhere, or a different one per ledger
  for (const p of parties) {
    const hashes = ledgers.map((l) => open(p, l.id)?.identityHash).filter(Boolean);
    if (hashes.length < 2) continue;
    const distinct = new Set(hashes).size;
    add(`${p} identity (${mode})`, mode === 'same key' ? distinct === 1 : distinct === hashes.length, `${distinct} distinct of ${hashes.length}`);
  }

  // 4. what one ledger holds is not in another
  if (nLedgers >= 2) {
    const p = parties[0];
    const a = open(p, ledgers[0].id), b = open(p, ledgers[1].id);
    if (a && b) {
      await a.signAndWrite('only.here', 'A-only');
      const inB = await attempt(() => b.readConfirmed('only.here'));
      add('a value in A is not in B', inB.ok && (inB as any).value === undefined, JSON.stringify((inB as any).value));
    }
  }

  // 5. another party cannot write into my tree, and cannot take my name
  if (nParties >= 2) {
    const [victim, other] = parties;
    const l = ledgers[0];
    const v = open(victim, l.id), o = open(other, l.id);
    if (v && o) {
      const head = (await v.monad.fetchWriteHead({ semanticNamespace: `${victim}.${l.root}`, transportOrigin: l.origin })).expectedHeadHash;
      const fields: any = { operation: 'write', expression: 'profile.note', value: 'overwritten', identityHash: String(o.me['!'].identity().hash), namespace: `${victim}.${l.root}`, expectedHeadHash: head };
      const payload = normalizeProofMessage(fields);
      const signature = await o.signPayload(payload);
      const w = await attempt(() => o.monad.writeNamespace({ semanticNamespace: `${victim}.${l.root}`, transportOrigin: l.origin, expression: 'profile.note', value: 'overwritten', identityHash: fields.identityHash, signature, signedPayload: payload, body: { namespace: fields.namespace, expectedHeadHash: head } }));
      add('another key cannot write in my tree', !w.ok && /FORBIDDEN/.test((w as any).code + (w as any).message), w.ok ? 'WENT THROUGH' : `${(w as any).code}`);
      const still = await attempt(() => v.readConfirmed('profile.note'));
      add('my tree is unchanged', still.ok && (still as any).value === `${victim}@${l.id}`, JSON.stringify((still as any).value));
      const thief: any = createCleakerSession({ username: victim, password: `thief-${tag}-${cellId}`, namespace: l.root, transportOrigin: l.origin } as any);
      const t = await attempt(() => thief.claim(`${victim}.${l.root}`));
      add('another key cannot take my name', !t.ok, t.ok ? 'CLAIM SUCCEEDED' : `${(t as any).code}`);
    }
  }

  // 6. leaving one link leaves the others, and a closed link can be reopened
  if (nLedgers >= 2) {
    const p = parties[0];
    const first = open(p, ledgers[0].id), second = open(p, ledgers[1].id);
    if (first && second) {
      first.logout();
      const stillSecond = await attempt(() => second.readConfirmed('profile.note'));
      add('closing one link leaves the other open', first.semanticNamespace === null && stillSecond.ok && (stillSecond as any).value === `${p}@${ledgers[1].id}`);
      const blocked = await attempt(() => first.signAndWrite('profile.note', 'after close'));
      add('a closed link cannot write', !blocked.ok, blocked.ok ? 'WENT THROUGH' : `${(blocked as any).code}`);
      const back = await attempt(() => first.open(`${p}.${ledgers[0].root}`));
      add('a closed link reopens', back.ok);
    }
  }
  return items;
}

async function main() {
  const modes: Mode[] = ['same key', 'key per ledger'];
  const rows: Array<{ mode: Mode; parties: number; ledgers: number; items: Item[] }> = [];
  let n = 0;
  for (const mode of modes) for (const parties of [1, 2, 3]) for (const ledgers of [1, 2, 3]) {
    n += 1;
    const items = await cell(parties, ledgers, mode, `c${n}`);
    rows.push({ mode, parties, ledgers, items });
    process.stdout.write(`  ${mode.padEnd(15)} ${parties} .me × ${ledgers} ledger${ledgers > 1 ? 's' : ' '}  ${items.every((i) => i.ok) ? 'OK  ' : 'FAIL'}  ${items.filter((i) => i.ok).length}/${items.length}\n`);
  }
  const failed = rows.flatMap((r) => r.items.filter((i) => !i.ok).map((i) => ({ cell: `${r.mode}, ${r.parties} .me × ${r.ledgers}`, ...i })));
  const total = rows.reduce((s, r) => s + r.items.length, 0);
  console.log(`\n${total - failed.length}/${total} checks, ${rows.filter((r) => r.items.every((i) => i.ok)).length}/${rows.length} combinations green`);
  for (const f of failed) console.log(`  ✗ [${f.cell}] ${f.name}  ${f.detail}`);
  process.exit(failed.length ? 1 : 0);
}
main().catch((e) => { console.error('HARNESS ERROR', e); process.exit(2); });
