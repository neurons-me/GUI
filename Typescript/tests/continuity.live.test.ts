// One local actor, two namespaces. LIVE: needs two disposable monads, each in its own process (the monad's kernel is a
// process singleton), so it is not part of `test:runtime`. Without them it says so and exits 0.
//
//   DM_ROOT=a-test.local DM_PORT=18331 node disposable-monad.mjs &
//   DM_ROOT=b-test.local DM_PORT=18332 node disposable-monad.mjs &
//   CONT_A=http://127.0.0.1:18331 CONT_A_ROOT=a-test.local CONT_B=http://127.0.0.1:18332 CONT_B_ROOT=b-test.local \
//     npx tsx tests/continuity.live.test.ts
//
// Layer under test: the session (createCleakerSession): what a <Cleaker> link opens. Existing mechanisms only: the signed
// claim/signIn proof, signAndWrite / readConfirmed, logout. Nothing here derives keys per namespace or changes seeds.
import { createCleakerSession } from '../src/core/session/createCleakerSession';

const A = process.env.CONT_A, ROOT_A = process.env.CONT_A_ROOT, B = process.env.CONT_B, ROOT_B = process.env.CONT_B_ROOT;
if (!A || !ROOT_A || !B || !ROOT_B) {
  console.log('continuity.live: skipped (set CONT_A, CONT_A_ROOT, CONT_B, CONT_B_ROOT; see the header)');
  process.exit(0);
}

const results: Array<{ n: string; ok: boolean; detail: string }> = [];
const check = (n: string, ok: boolean, detail = '') => { results.push({ n, ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${detail ? `  — ${detail}` : ''}`); };
// A limit of today's code, confirmed here. Recorded so it cannot go unnoticed; it does not fail the run. If `confirmed` is
// false the limit is gone and the line says so.
const gaps: Array<{ n: string; confirmed: boolean; detail: string }> = [];
const gap = (n: string, confirmed: boolean, detail = '') => { gaps.push({ n, confirmed, detail }); console.log(`${confirmed ? 'GAP ' : 'GONE'}  ${n}${detail ? `  — ${detail}` : ''}`); };
const attempt = async <T,>(fn: () => Promise<T>): Promise<{ ok: true; value: T } | { ok: false; code: string; message: string }> => {
  try { return { ok: true, value: await fn() }; } catch (e: any) { return { ok: false, code: String(e?.code || e?.name || ''), message: String(e?.message || e).slice(0, 120) }; }
};

const tag = Math.random().toString(36).slice(2, 8);
const username = `actor-${tag}`;
const password = `pw-${tag}-correct-horse`;
const open = (root: string, origin: string, pw = password) =>
  createCleakerSession({ username, password: pw, namespace: root, transportOrigin: origin } as any);

async function main() {
  // the one local actor: the same credentials, linked to A and to B
  const sA: any = open(ROOT_A!, A!);
  const sB: any = open(ROOT_B!, B!);
  const nameA = `${username}.${ROOT_A}`, nameB = `${username}.${ROOT_B}`;
  const a = await attempt(() => sA.claimAndOpen(nameA));
  const b = await attempt(() => sB.claimAndOpen(nameB));
  check('A: claim + open', a.ok, a.ok ? sA.semanticNamespace : `${(a as any).code} ${(a as any).message}`);
  check('B: claim + open', b.ok, b.ok ? sB.semanticNamespace : `${(b as any).code} ${(b as any).message}`);
  if (!a.ok || !b.ok) return;

  // 1. continuity of the actor
  check('1a. same actor: one identity hash in A and in B', sA.identityHash === sB.identityHash, String(sA.identityHash).slice(0, 12));
  gap('1b. the two links hold two distinct runtimes (kernels), not one shared object', sA.me !== sB.me,
    'each link builds its own kernel; the actor is re-derived from credentials, not carried');

  // a local fact written on the actor's runtime BEFORE it writes anywhere durable
  sA.me.profile.localnote('only on the A runtime');
  gap('1c. a local fact on the A runtime is not on the B runtime (no shared local state)',
    String(sB.read('profile.localnote') ?? '') === '', `B reads: ${JSON.stringify(sB.read('profile.localnote') ?? null)}`);

  // 2. both accesses coexist
  const wA = await attempt(() => sA.signAndWrite('profile.note', 'written through A'));
  const wB = await attempt(() => sB.signAndWrite('profile.note', 'written through B'));
  check('2a. signed write through A', wA.ok, wA.ok ? '' : (wA as any).message);
  check('2b. signed write through B', wB.ok, wB.ok ? '' : (wB as any).message);
  const rA = await attempt(() => sA.readConfirmed('profile.note'));
  const rB = await attempt(() => sB.readConfirmed('profile.note'));
  check('2c. each namespace answers with its own value', rA.ok && rB.ok && (rA as any).value === 'written through A' && (rB as any).value === 'written through B',
    `A=${JSON.stringify((rA as any).value)} B=${JSON.stringify((rB as any).value)}`);

  // 4. a name taken / permission refused in B does not touch A
  const mallory: any = open(ROOT_B!, B!, `${password}-mallory`);
  const taken = await attempt(() => mallory.claim(nameB));
  check('4a. a different key cannot take the same name in B', !taken.ok, taken.ok ? 'CLAIM SUCCEEDED' : `${(taken as any).code} ${(taken as any).message}`);
  const afterA = await attempt(() => sA.readConfirmed('profile.note'));
  const afterB = await attempt(() => sB.readConfirmed('profile.note'));
  check('4b. A is unaffected by the rejection in B', afterA.ok && (afterA as any).value === 'written through A' && sA.semanticNamespace === nameA);
  check('4c. B (the owner) is unaffected too', afterB.ok && (afterB as any).value === 'written through B' && sB.semanticNamespace === nameB);

  // 3. leaving A does not close B nor erase local state
  sA.logout();
  check('3a. A is closed', sA.semanticNamespace === null);
  const stillB = await attempt(() => sB.readConfirmed('profile.note'));
  check('3b. B is still open and answers', sB.semanticNamespace === nameB && stillB.ok && (stillB as any).value === 'written through B');
  check('3c. the local state of the A runtime survives its own logout', String(sA.read('profile.note')) === 'written through A',
    `A runtime still reads: ${JSON.stringify(sA.read('profile.note') ?? null)}`);
  const blocked = await attempt(() => sA.signAndWrite('profile.note', 'after logout'));
  check('3d. A cannot write once closed', !blocked.ok, blocked.ok ? 'WRITE WENT THROUGH' : `${(blocked as any).code} ${(blocked as any).message}`);
  const reopen = await attempt(() => sA.open(nameA));
  check('3e. A can be reopened with the same actor', reopen.ok && sA.identityHash === sB.identityHash);

  // 5. the existing mechanism asks for the credential at each link
  gap('5.  a link is opened WITHOUT being handed the credential again', true,
    'createCleakerSession takes username+password per call; there is no reference to a credential held locally (a proposal, not code)');
}

main().then(() => {
  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} pass, ${gaps.filter((g) => g.confirmed).length} confirmed gaps`);
  process.exit(failed.length ? 1 : 0);
}).catch((e) => { console.error('HARNESS ERROR', e); process.exit(2); });
