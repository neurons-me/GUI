// A local context with several links: each keeps its own kernel and its own credentials, and an identity one of them
// already holds can be used, explicitly, to claim a name in another namespace. LIVE: needs two local ledgers.
//
//   CONT_A=http://127.0.0.1:18331 CONT_A_ROOT=a-test.local CONT_B=http://127.0.0.1:18332 CONT_B_ROOT=b-test.local \
//     npx tsx tests/link-existing.live.test.ts
import { createCleakerSession } from '../src/core/session/createCleakerSession';
import { heldIdentitiesOf, sessionHolding } from '../src/core/session/heldIdentities';

const A = process.env.CONT_A, RA = process.env.CONT_A_ROOT, B = process.env.CONT_B, RB = process.env.CONT_B_ROOT;
if (!A || !RA || !B || !RB) { console.log('link-existing.live: skipped (set CONT_A, CONT_A_ROOT, CONT_B, CONT_B_ROOT)'); process.exit(0); }

const results: boolean[] = [];
const check = (name: string, ok: boolean, detail = '') => { results.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  — ${detail}` : ''}`); };
const attempt = async <T,>(fn: () => Promise<T>) => { try { return { ok: true as const, value: await fn() }; } catch (e: any) { return { ok: false as const, code: String(e?.code || ''), message: String(e?.message || e) }; } };
const tag = Math.random().toString(36).slice(2, 7);
const link = (o: Record<string, unknown>) => createCleakerSession(o as any) as any;

async function main() {
  const ctx = {};                                    // the local context (in the app: the .me <Me> provides)
  const hold = (id: string) => heldIdentitiesOf(ctx).find((h) => h.identityHash === id);

  // ── independent credentials per link, one context ──
  const sA = link({ context: ctx, username: `ua-${tag}`, password: `pa-${tag}-horse`, namespace: RA, transportOrigin: A });
  const sB = link({ context: ctx, username: `ub-${tag}`, password: `pb-${tag}-horse`, namespace: RB, transportOrigin: B });
  await sA.claimAndOpen(`ua-${tag}.${RA}`); await sB.claimAndOpen(`ub-${tag}.${RB}`);
  check('two links, two credentials, two identities under one context', sA.identityHash !== sB.identityHash && heldIdentitiesOf(ctx).length === 2);
  check('each link has its own kernel', sA.me !== sB.me);
  const wA = await attempt(() => sA.signAndWrite('profile.note', 'from A'));
  const wB = await attempt(() => sB.signAndWrite('profile.note', 'from B'));
  check('each writes under its own name, explicitly', wA.ok && wB.ok && (await sA.readConfirmed('profile.note')) === 'from A' && (await sB.readConfirmed('profile.note')) === 'from B');

  // ── use the identity B holds, explicitly, to claim a name in A's namespace ──
  const sC = link({ context: ctx, identityFrom: sB, username: `ub-in-a-${tag}`, namespace: RA, transportOrigin: A });
  const claimed = await attempt(() => sC.claimAndOpen(`ub-in-a-${tag}.${RA}`));
  check('claims a name with the identity already held (no phrase, no password)', claimed.ok, claimed.ok ? '' : `${(claimed as any).code} ${(claimed as any).message}`.slice(0, 80));
  check('it is the same identity', sC.identityHash === sB.identityHash, sC.identityHash.slice(0, 10));
  check('with a kernel of its own, not B\'s', sC.me !== sB.me && sC.me !== sA.me);
  const held = hold(sB.identityHash);
  check('the context lists that identity with both links', !!held && held.links.length === 2 && held.links.map((l) => l.namespace).sort().join() === [`ub-${tag}.${RB}`, `ub-in-a-${tag}.${RA}`].sort().join());
  check('the other identity is untouched', hold(sA.identityHash)?.links.length === 1);
  const wC = await attempt(() => sC.signAndWrite('profile.note', 'from C'));
  check('a write through the new link lands under its own name', wC.ok && (await sC.readConfirmed('profile.note')) === 'from C' && (await sB.readConfirmed('profile.note')) === 'from B');

  // ── nothing depends on which link opened last ──
  check('asking for an identity returns a session that holds THAT identity', sessionHolding(ctx, sA.identityHash)?.identityHash === sA.identityHash && sessionHolding(ctx, sB.identityHash)?.identityHash === sB.identityHash);
  const sX = link({ context: ctx, username: `ux-${tag}`, password: `px-${tag}-horse`, namespace: RB, transportOrigin: B });
  await sX.claimAndOpen(`ux-${tag}.${RB}`);                  // the most recent link, a third identity
  const viaA = link({ context: ctx, identityFrom: sessionHolding(ctx, sA.identityHash), username: `ua-in-b-${tag}`, namespace: RB, transportOrigin: B });
  await viaA.claimAndOpen(`ua-in-b-${tag}.${RB}`);
  check('the newest link does not become the implicit source', viaA.identityHash === sA.identityHash && viaA.identityHash !== sX.identityHash);
  sX.logout();
  check('closing the newest link changes nothing about the others', heldIdentitiesOf(ctx).length === 2 && sA.semanticNamespace === `ua-${tag}.${RA}` && sB.semanticNamespace === `ub-${tag}.${RB}`);

  // ── what is refused ──
  const closed = link({ context: ctx, username: `uz-${tag}`, password: `pz-${tag}-horse`, namespace: RA, transportOrigin: A });
  await closed.claimAndOpen(`uz-${tag}.${RA}`); closed.logout();
  const fromClosed = await attempt(async () => link({ context: ctx, identityFrom: closed, username: `uz2-${tag}`, namespace: RA, transportOrigin: A }));
  check('a closed link cannot be a source', !fromClosed.ok && /IDENTITY_NOT_HELD/.test((fromClosed as any).code), (fromClosed as any).code || '');
  const elsewhere = await attempt(async () => link({ context: {}, identityFrom: sB, username: `ue-${tag}`, namespace: RA, transportOrigin: A }));
  check('another context cannot use it', !elsewhere.ok && /IDENTITY_NOT_HELD/.test((elsewhere as any).code), (elsewhere as any).code || '');
  const taken = link({ context: ctx, identityFrom: sB, username: `ua-${tag}`, namespace: RA, transportOrigin: A });   // a name another key holds in A
  const takenResult = await attempt(() => taken.claimAndOpen(`ua-${tag}.${RA}`));
  check('a name held by another key is refused and nothing else moves', !takenResult.ok && /TAKEN/.test((takenResult as any).code + (takenResult as any).message)
    && (await sB.readConfirmed('profile.note')) === 'from B' && heldIdentitiesOf(ctx).length === 2);

  // ── a second name for the same identity on the SAME ledger: the ledger binds an identity to its first name there
  //    (its anchor) and accepts another only with an identity-link signed by the anchor's claim key ──
  const claimStatus = async (origin: string, ns: string) =>
    (await (await fetch(`${origin}/api/v1/claim-status?namespace=${encodeURIComponent(ns)}`)).json())?.claimed === true;
  const heldBefore = heldIdentitiesOf(ctx).map((h) => `${h.identityHash}:${h.links.length}`).join();
  // an altered request: the link travels, but a byte it covers changed in flight (here its timestamp)
  const alteringFetch = (async (input: any, init?: any) => {
    if (typeof init?.body === 'string' && init.body.includes('"link"')) {         // only a claim body carries a link
      const body = JSON.parse(init.body);
      if (body.link) { body.link.timestamp = Number(body.link.timestamp) + 1; init = { ...init, body: JSON.stringify(body) }; }
    }
    return fetch(input, init);
  }) as typeof fetch;
  const altered = link({ context: ctx, identityFrom: sA, username: `ua-alt-${tag}`, namespace: RA, transportOrigin: A, fetchImpl: alteringFetch });
  const alteredResult = await attempt(() => altered.claimAndOpen(`ua-alt-${tag}.${RA}`));
  check('an altered link request is refused', !alteredResult.ok && /IDENTITY_TAKEN/.test((alteredResult as any).code + (alteredResult as any).message), (alteredResult as any).code || '');
  check('the refusal leaves no claim, no open link, nothing held changed',
    !(await claimStatus(A, `ua-alt-${tag}.${RA}`)) && !altered.semanticNamespace && heldIdentitiesOf(ctx).map((h) => `${h.identityHash}:${h.links.length}`).join() === heldBefore);

  const linked = link({ context: ctx, identityFrom: sA, username: `ua-two-${tag}`, namespace: RA, transportOrigin: A });
  const linkedResult = await attempt(() => linked.claimAndOpen(`ua-two-${tag}.${RA}`));
  check('a second name on the same ledger, linked from the anchor, is accepted', linkedResult.ok, linkedResult.ok ? '' : `${(linkedResult as any).code} ${(linkedResult as any).message}`.slice(0, 90));
  check('it is the same identity, and the ledger reports the name claimed', linked.identityHash === sA.identityHash && await claimStatus(A, `ua-two-${tag}.${RA}`));
  const wL = await attempt(() => linked.signAndWrite('profile.note', 'from the linked name'));
  check('the linked name writes under its own name', wL.ok && (await linked.readConfirmed('profile.note')) === 'from the linked name');

  const fromLinked = link({ context: ctx, identityFrom: linked, username: `ua-three-${tag}`, namespace: RA, transportOrigin: A });
  const fromLinkedResult = await attempt(() => fromLinked.claimAndOpen(`ua-three-${tag}.${RA}`));
  check('a linked name cannot sign further links', !fromLinkedResult.ok && /IDENTITY_TAKEN/.test((fromLinkedResult as any).code + (fromLinkedResult as any).message), (fromLinkedResult as any).code || '');
  check('and that refusal leaves no claim either', !(await claimStatus(A, `ua-three-${tag}.${RA}`)) && !fromLinked.semanticNamespace);
  const fromAnchor = link({ context: ctx, identityFrom: sA, username: `ua-three-${tag}`, namespace: RA, transportOrigin: A });
  const fromAnchorResult = await attempt(() => fromAnchor.claimAndOpen(`ua-three-${tag}.${RA}`));
  check('the same name, linked from the anchor, is accepted', fromAnchorResult.ok, fromAnchorResult.ok ? '' : `${(fromAnchorResult as any).code} ${(fromAnchorResult as any).message}`.slice(0, 90));
  const stranger = link({ context: ctx, username: `us-${tag}`, password: `ps-${tag}-horse`, namespace: RA, transportOrigin: A });
  await stranger.claimAndOpen(`us-${tag}.${RA}`);
  check('another identity on the ledger is untouched', stranger.identityHash !== sA.identityHash);

  // ── closing the one that was the source leaves the link made from it ──
  sB.logout();
  check('closing the source link leaves the claim\'s own link open', sC.semanticNamespace === `ub-in-a-${tag}.${RA}` && !!hold(sC.identityHash));
}
main().then(() => {
  const failed = results.filter((r) => !r).length;
  console.log(`\n${results.length - failed}/${results.length}`);
  process.exit(failed ? 1 : 0);
}).catch((e) => { console.error('HARNESS ERROR', e); process.exit(2); });
