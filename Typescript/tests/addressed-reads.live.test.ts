// Reading by address, through the runtime (`readAddress`, src/core/session/addressRead.ts): an address names a
// namespace, a user and a path (`me://ana.a-test.local:read/battery`); two addresses can end in the same path and be
// different data. Two `.me`s ask the same addresses; the runtime picks, from each one's OWN open links, the one that
// serves the root.
//
//   expression ──parseTarget──▶ { namespace, path }
//   namespace  ──a link of the asker's context whose root serves it──▶ GET <transport>/<path>?namespace=<namespace>
//   answer     ──▶ public | sealed | closed | absent | no_link | ambiguous | invalid_expression | error
//
// LIVE: two disposable ledgers, and a this.me that exposes the audience algebra:
//   CONT_A=http://127.0.0.1:18331 CONT_A_ROOT=a-test.local CONT_B=http://127.0.0.1:18332 CONT_B_ROOT=b-test.local \
//     npx tsx --tsconfig tests/tsconfig.audience-run.json tests/addressed-reads.live.test.ts
import ME from 'this.me';
import { createCleakerSession } from '../src/core/session/createCleakerSession';
import { heldIdentitiesOf } from '../src/core/session/heldIdentities';
import { readAddress, type AddressRead } from '../src/core/session/addressRead';
import { writeForAudience, openEnvelope } from '../src/core/session/audienceWrite';

const A = process.env.CONT_A, RA = process.env.CONT_A_ROOT, B = process.env.CONT_B, RB = process.env.CONT_B_ROOT;
if (!A || !RA || !B || !RB) { console.log('addressed-reads.live: skipped (set CONT_A, CONT_A_ROOT, CONT_B, CONT_B_ROOT)'); process.exit(0); }
const kernel = ME as any;
if (typeof kernel.sealAudience !== 'function') {
  console.log('addressed-reads.live: skipped (this.me does not expose the audience algebra; use --tsconfig tests/tsconfig.audience-run.json)');
  process.exit(0);
}

const results: boolean[] = [];
const check = (name: string, ok: boolean, detail = '') => { results.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  — ${detail}` : ''}`); };
const attempt = async <T,>(fn: () => Promise<T>) => { try { return { ok: true as const, value: await fn() }; } catch (e: any) { return { ok: false as const, code: String(e?.code || ''), message: String(e?.message || e) }; } };
const tag = Math.random().toString(36).slice(2, 7);
const link = (o: Record<string, unknown>) => createCleakerSession(o as any) as any;
const show = (r: AddressRead) => JSON.stringify(r).slice(0, 160);

async function main() {
  // ── three `.me`s, each its own context ──
  // ana's context is a real local `.me` (what `<Me>` provides), so it can hold local facts; the others are only keys
  const ctx = { ana: new (ME as any)(), bob: {}, carol: {} } as Record<string, any>;
  const LOCAL_FACT = `local-only-${tag}`;
  ctx.ana.bateria(80);
  ctx.ana.nota(LOCAL_FACT);
  const aName = `ana${tag}`, bName = `bob${tag}`, cName = `carol${tag}`;
  const ana_A = link({ context: ctx.ana, username: aName, password: `pw-ana-${tag}-horse`, namespace: RA, transportOrigin: A });
  await ana_A.claimAndOpen(`${aName}.${RA}`);
  // the same actor in B: its identity, used explicitly (no new identity)
  const ana_B = link({ context: ctx.ana, identityFrom: ana_A, username: aName, namespace: RB, transportOrigin: B });
  await ana_B.claimAndOpen(`${aName}.${RB}`);
  // bob: his own credentials in each ledger, nothing from ana
  const bob_A = link({ context: ctx.bob, username: bName, password: `pw-bob-a-${tag}-horse`, namespace: RA, transportOrigin: A });
  await bob_A.claimAndOpen(`${bName}.${RA}`);
  const bob_B = link({ context: ctx.bob, username: bName, password: `pw-bob-b-${tag}-horse`, namespace: RB, transportOrigin: B });
  await bob_B.claimAndOpen(`${bName}.${RB}`);
  // carol opens B FIRST, then A
  const carol_B = link({ context: ctx.carol, username: cName, password: `pw-carol-${tag}-horse`, namespace: RB, transportOrigin: B });
  await carol_B.claimAndOpen(`${cName}.${RB}`);
  const carol_A = link({ context: ctx.carol, identityFrom: carol_B, username: cName, namespace: RA, transportOrigin: A });
  await carol_A.claimAndOpen(`${cName}.${RA}`);

  await ana_A.signAndWrite('battery', 80);
  await ana_B.signAndWrite('battery', 50);
  const before = { a: ana_A.semanticNamespace, b: ana_B.semanticNamespace, id: ana_A.identityHash };
  const addrA = `me://${aName}.${RA}:read/battery`;
  const addrB = `me://${aName}.${RB}:read/battery`;

  // ── one `.me`, both addresses, same path ──
  const rA = await readAddress(ctx.ana, addrA), rB = await readAddress(ctx.ana, addrB);
  check('ana reads the A address', rA.status === 'public' && rA.value === 80, show(rA));
  check('ana reads the B address: same path, other data', rB.status === 'public' && rB.value === 50, show(rB));
  check('each through the link that serves its root', (rA as any).via === `${aName}.${RA}` && (rB as any).via === `${aName}.${RB}`);
  const cA = await readAddress(ctx.carol, addrA), cB = await readAddress(ctx.carol, addrB);
  check('the choice does not depend on which link was opened first (carol opened B before A)',
    cA.status === 'public' && cA.value === 80 && cB.status === 'public' && cB.value === 50 && (cA as any).via === `${cName}.${RA}` && (cB as any).via === `${cName}.${RB}`);

  // ── another `.me`: the same addresses, its own links ──
  const bA = await readAddress(ctx.bob, addrA), bB = await readAddress(ctx.bob, addrB);
  check('bob reads the same two addresses', bA.status === 'public' && bA.value === 80 && bB.status === 'public' && bB.value === 50);
  check('through his own links, not ana\'s', (bA as any).via === `${bName}.${RA}` && (bB as any).via === `${bName}.${RB}`);
  const lent = await attempt(async () => link({ context: ctx.bob, identityFrom: ana_A, username: `x${tag}`, namespace: RA, transportOrigin: A }));
  check('his context cannot borrow ana\'s identity', !lent.ok && /IDENTITY_NOT_HELD/.test((lent as any).code), (lent as any).code || '');
  check('contexts list only their own identities', heldIdentitiesOf(ctx.ana).length === 1 && heldIdentitiesOf(ctx.bob).length === 2
    && !heldIdentitiesOf(ctx.bob).some((h) => h.identityHash === ana_A.identityHash));

  // ── the states are kept apart ──
  const absent = await readAddress(ctx.ana, `me://${aName}.${RA}:read/nowhere.at.all`);
  check('absent', absent.status === 'absent', show(absent));
  await ana_A.signAndWrite('wallet._', 'k-secret');
  await ana_A.signAndWrite('wallet.note', 'hidden');
  const closed = await readAddress(ctx.bob, `me://${aName}.${RA}:read/wallet._`);
  check('closed (a secret scope: the ledger does not disclose it)', closed.status === 'closed', show(closed));
  const sealedAnswer = await readAddress(ctx.bob, `me://${aName}.${RA}:read/diary`);
  check('absent before anything is sealed there', sealedAnswer.status === 'absent');
  const keys = await kernel.generateP256KeyPair();
  const anaId = { identityHash: ana_A.identityHash, publicKey: await kernel.exportP256PublicKey(keys.publicKey) };
  await writeForAudience(ana_A, 'diary', { entry: 'for ana only' }, [anaId]);
  await writeForAudience(ana_B, 'diary', { entry: 'for ana only (B)' }, [anaId]);
  const sealedBob = await readAddress(ctx.bob, `me://${aName}.${RA}:read/diary`);
  const sealedAna = await readAddress(ctx.ana, `me://${aName}.${RA}:read/diary`);
  check('sealed: an envelope, not a value and not null', sealedBob.status === 'sealed' && sealedAna.status === 'sealed');
  check('the same ciphertext to both', JSON.stringify((sealedBob as any).envelope) === JSON.stringify((sealedAna as any).envelope));
  check('the ciphertext does not contain the text', !JSON.stringify((sealedBob as any).envelope).includes('for ana only'));
  const bobKey = { identityHash: bob_A.identityHash, privateKey: (await kernel.generateP256KeyPair()).privateKey };
  const anaKey = { identityHash: ana_A.identityHash, privateKey: keys.privateKey };
  const bobOpens = await attempt(() => openEnvelope((sealedBob as any).envelope, [bobKey]));
  const anaOpens = await attempt(() => openEnvelope((sealedAna as any).envelope, [anaKey]));
  check('bob cannot open it; ana does', !bobOpens.ok && anaOpens.ok && (anaOpens as any).value?.entry === 'for ana only', JSON.stringify((anaOpens as any).value));

  const none = await readAddress(ctx.bob, `me://${aName}.c-test.local:read/battery`);
  check('no_link: no open link of the context serves that root, and it says which it does', none.status === 'no_link'
    && (none as any).root === 'c-test.local' && JSON.stringify((none as any).held) === JSON.stringify([RA, RB].sort()), show(none));
  const foreign = await attempt(() => readAddress({}, addrA));
  check('no_link also for a context with no links at all', foreign.ok && (foreign as any).value.status === 'no_link' && (foreign as any).value.held.length === 0);
  const write = await readAddress(ctx.ana, `me://${aName}.${RA}:write/battery`);
  check('invalid_expression: only reads are resolved by address', write.status === 'invalid_expression', show(write));
  const garbage = await readAddress(ctx.ana, '   ');
  check('invalid_expression: empty', garbage.status === 'invalid_expression');
  const down = await readAddress(ctx.ana, addrA, { fetchImpl: (() => { throw new Error('boom'); }) as any });
  check('error: transport failure is its own state, not null', down.status === 'error' && !!(down as any).code, show(down));
  const wrongRoot = await attempt(() => ana_A.monad.readNamespacePath({ semanticNamespace: `${aName}.${RB}`, transportOrigin: ana_A.transportOrigin, path: 'battery', namedNamespace: true }));
  check('a transport that does not serve the root refuses (NAMESPACE_NOT_SERVED), the address is not answered by "the open link"', !wrongRoot.ok, (wrongRoot as any).code);

  // ── two links serve the same root: a rule, not the first of the list ──
  const ana2_A = link({ context: ctx.ana, identityFrom: ana_A, username: `${aName}b`, namespace: RA, transportOrigin: A.replace('127.0.0.1', 'localhost') });
  await ana2_A.claimAndOpen(`${aName}b.${RA}`);
  const viaExact = await readAddress(ctx.ana, `me://${aName}b.${RA}:read/profile.x`);
  check('the link named by the address is used when it is one of them', (viaExact as any).via === `${aName}b.${RA}`, show(viaExact));
  const amb = await readAddress(ctx.ana, `me://${bName}.${RA}:read/battery`);
  check('ambiguous: two links reach A through different transports and the address names neither', amb.status === 'ambiguous'
    && JSON.stringify((amb as any).candidates) === JSON.stringify([`${aName}.${RA}`, `${aName}b.${RA}`].sort()), show(amb));
  const chosen = await readAddress(ctx.ana, `me://${bName}.${RA}:read/battery`, { via: `${aName}.${RA}` });
  check('`via` settles it (the answer is bob\'s: nothing at that path, through the link that was named)', chosen.status === 'absent' && (chosen as any).via === `${aName}.${RA}`, show(chosen));
  const badVia = await readAddress(ctx.ana, `me://${bName}.${RA}:read/battery`, { via: ana_B });
  check('`via` must serve that root', badVia.status === 'error' && (badVia as any).code === 'VIA_DOES_NOT_SERVE', show(badVia));
  const stillBobs = await readAddress(ctx.bob, `me://${bName}.${RA}:read/battery`);
  check('another context is not affected by ana\'s second link', stillBobs.status === 'absent' && (stillBobs as any).via === `${bName}.${RA}`);

  // ── local facts of the `.me`, by the same grammar: `self` ──
  const sent: string[] = [];
  const realFetch = globalThis.fetch;
  globalThis.fetch = (async (input: any, init?: any) => { if (init?.body) sent.push(String(init.body)); return realFetch(input, init); }) as any;
  const localFact = await readAddress(ctx.ana, 'me://self:read/nota');
  check('self: a fact of the context\'s own .me is read in place', localFact.status === 'public' && (localFact as any).value === LOCAL_FACT && (localFact as any).via === 'self', show(localFact));
  check('self: another .me does not see it', (await readAddress(ctx.bob, 'me://self:read/nota')).status === 'no_link'
    && (await readAddress(ctx.carol, 'me://self:read/nota')).status === 'no_link');
  await ana_A.signAndWrite('battery', 70);
  await ana_B.signAndWrite('battery', 55);
  globalThis.fetch = realFetch;
  const atLedger = await readAddress(ctx.bob, `me://${aName}.${RA}:read/nota`);
  check('the local fact is not in the ledger', atLedger.status === 'absent', show(atLedger));
  check('and not in anything either link sent', sent.length > 0 && !sent.some((b) => b.includes(LOCAL_FACT)), `${sent.length} bodies`);
  check('the links\' kernels do not have it', ana_A.read('nota') === undefined && ana_B.read('nota') === undefined);
  await ana_A.signAndWrite('battery', 80); await ana_B.signAndWrite('battery', 50);

  // ── bob tries to act on ana's address; her sessions are what they were ──
  const intrusion = await attempt(() => bob_A.monad.writeNamespace({ semanticNamespace: `${aName}.${RA}`, expression: 'battery', value: 0, identityHash: bob_A.identityHash }));
  const after = await readAddress(ctx.ana, addrA);
  check('a write by bob to ana\'s address is refused and the value stays', !intrusion.ok && after.status === 'public' && after.value === 80, (intrusion as any).code);
  await ana_A.signAndWrite('battery', 75);
  const r2 = [await readAddress(ctx.ana, addrA), await readAddress(ctx.bob, addrA), await readAddress(ctx.bob, addrB)];
  check('a change at the A address shows there, for both, and not at B', [r2[0], r2[1]].every((r) => r.status === 'public' && r.value === 75) && r2[2].status === 'public' && r2[2].value === 50);
  check('ana\'s sessions were not touched by bob', ana_A.semanticNamespace === before.a && ana_B.semanticNamespace === before.b && ana_A.identityHash === before.id);
}
main().then(() => {
  const failed = results.filter((r) => !r).length;
  console.log(`\n${results.length - failed}/${results.length}`);
  process.exit(failed ? 1 : 0);
}).catch((e) => { console.error('HARNESS ERROR', e); process.exit(2); });
