// An address names a namespace, a user and a path: `me://ana.a-test.local:read/battery`. Two addresses can end in the
// same path and be different data. This test follows one address from the expression to the value, with two `.me`s asking
// for the same addresses.
//
//   expression ──parseTarget (cleaker)──▶ { namespace: ana.a-test.local, path: battery }
//   namespace  ──the link whose root serves it (its transport)──▶ GET <transport>/battery?namespace=ana.a-test.local
//   ledger     ──disclosure: public ▶ value | sealed ▶ envelope (ciphertext) | closed ▶ null
//   envelope   ──opened locally by whoever holds a key of its audience──▶ value
//
// There is no function "read(address)" in the runtime: `resolve` below is this test composing the existing pieces
// (parseTarget, a link's `monad.readNamespacePath`). It is not an API.
//
// LIVE: two disposable ledgers, and a this.me that exposes the audience algebra:
//   CONT_A=http://127.0.0.1:18331 CONT_A_ROOT=a-test.local CONT_B=http://127.0.0.1:18332 CONT_B_ROOT=b-test.local \
//     npx tsx --tsconfig tests/tsconfig.audience-run.json tests/addressed-reads.live.test.ts
import ME from 'this.me';
import { parseTarget } from 'cleaker';
import { createCleakerSession } from '../src/core/session/createCleakerSession';
import { heldIdentitiesOf } from '../src/core/session/heldIdentities';
import { writeForAudience, openEnvelope, type AudienceEnvelope } from '../src/core/session/audienceWrite';

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

type Party = { name: string; links: any[]; context: object; keys: CryptoKeyPair; identity: () => string };

// expression -> { namespace, path }
const addressOf = (expression: string) => {
  const t: any = parseTarget(expression, { defaultMode: 'reactive', allowShorthandRead: true });
  return { namespace: String(t.namespace.fqdn), path: String(t.path).replace(/\//g, '.') };
};
// the link of this party that serves the address's root (by name, never by position)
const linkFor = (party: Party, namespace: string, order: 'as-is' | 'reversed' = 'as-is') => {
  const links = order === 'reversed' ? [...party.links].reverse() : party.links;
  return links.find((l) => { const ns = String(l.semanticNamespace || ''); const root = ns.split('.').slice(1).join('.'); return namespace === root || namespace.endsWith(`.${root}`); });
};
const resolve = async (party: Party, expression: string, order: 'as-is' | 'reversed' = 'as-is') => {
  const { namespace, path } = addressOf(expression);
  const via = linkFor(party, namespace, order);
  if (!via) return { ok: false as const, code: 'NO_LINK_FOR_ROOT', via: null };
  const r = await attempt(() => via.monad.readNamespacePath({ semanticNamespace: namespace, transportOrigin: via.transportOrigin, path, namedNamespace: true }));
  return r.ok ? { ok: true as const, value: (r.value as any).value, via: via.semanticNamespace as string } : { ok: false as const, code: r.code, via: via.semanticNamespace as string };
};

async function main() {
  // ── two `.me`s ──
  const mk = async (name: string): Promise<Party> => ({ name, links: [], context: {}, keys: await kernel.generateP256KeyPair(), identity: () => '' });
  const ana = await mk('ana'), bob = await mk('bob');
  const aName = `ana${tag}`, bName = `bob${tag}`;
  const ana_A = link({ context: ana.context, username: aName, password: `pw-ana-${tag}-horse`, namespace: RA, transportOrigin: A });
  await ana_A.claimAndOpen(`${aName}.${RA}`);
  const ana_B = link({ context: ana.context, identityFrom: ana_A, username: aName, namespace: RB, transportOrigin: B });
  await ana_B.claimAndOpen(`${aName}.${RB}`);
  ana.links = [ana_A, ana_B]; ana.identity = () => ana_A.identityHash;
  // bob: his own `.me`, his own credentials in each ledger, nothing from ana
  const bob_A = link({ context: bob.context, username: bName, password: `pw-bob-a-${tag}-horse`, namespace: RA, transportOrigin: A });
  await bob_A.claimAndOpen(`${bName}.${RA}`);
  const bob_B = link({ context: bob.context, username: bName, password: `pw-bob-b-${tag}-horse`, namespace: RB, transportOrigin: B });
  await bob_B.claimAndOpen(`${bName}.${RB}`);
  bob.links = [bob_A, bob_B]; bob.identity = () => bob_A.identityHash;

  await ana_A.signAndWrite('battery', 80);
  await ana_B.signAndWrite('battery', 50);
  const anaBefore = { a: ana_A.semanticNamespace, b: ana_B.semanticNamespace, id: ana.identity() };

  const addrA = `me://${aName}.${RA}:read/battery`;
  const addrB = `me://${aName}.${RB}:read/battery`;

  // ── the expression names the destination ──
  const pa = addressOf(addrA);
  check('the expression parses into namespace + path', pa.namespace === `${aName}.${RA}` && pa.path === 'battery', JSON.stringify(pa));

  // ── one `.me`, both addresses, same path ──
  const rA = await resolve(ana, addrA), rB = await resolve(ana, addrB);
  check('ana reads the A address', rA.ok && (rA as any).value === 80, JSON.stringify(rA));
  check('ana reads the B address: same path, other data', rB.ok && (rB as any).value === 50, JSON.stringify(rB));
  check('each was resolved through the link that serves its root', (rA as any).via === `${aName}.${RA}` && (rB as any).via === `${aName}.${RB}`);
  const swapped = [await resolve(ana, addrA, 'reversed'), await resolve(ana, addrB, 'reversed')];
  check('the choice does not depend on the order links were opened', (swapped[0] as any).value === 80 && (swapped[1] as any).value === 50);
  const wrong = await attempt(() => ana_A.monad.readNamespacePath({ semanticNamespace: `${aName}.${RB}`, transportOrigin: ana_A.transportOrigin, path: 'battery', namedNamespace: true }));
  check('a link whose transport does not serve that root refuses (the address is not answered by "the open link")', !wrong.ok, wrong.ok ? 'ANSWERED' : (wrong as any).code);

  // ── another `.me`, the same addresses, its own links ──
  const bA = await resolve(bob, addrA), bB = await resolve(bob, addrB);
  check('bob reads the same two addresses', bA.ok && (bA as any).value === 80 && bB.ok && (bB as any).value === 50, `${JSON.stringify(bA)} ${JSON.stringify(bB)}`);
  check('through his own links, not ana\'s', (bA as any).via === `${bName}.${RA}` && (bB as any).via === `${bName}.${RB}`);
  const lent = await attempt(async () => link({ context: bob.context, identityFrom: ana_A, username: `x${tag}`, namespace: RA, transportOrigin: A }));
  check('his context cannot borrow ana\'s identity', !lent.ok && /IDENTITY_NOT_HELD/.test((lent as any).code), (lent as any).code || '');
  check('contexts list only their own identities', heldIdentitiesOf(ana.context).length === 1 && heldIdentitiesOf(bob.context).length === 2
    && !heldIdentitiesOf(bob.context).some((h) => h.identityHash === ana.identity()));

  // ── what differs between readers is what they can OPEN, not what the address returns ──
  const anaId = { identityHash: ana.identity(), publicKey: await kernel.exportP256PublicKey(ana.keys.publicKey) };
  await writeForAudience(ana_A, 'diary', { entry: 'for ana only (A)' }, [anaId]);
  await writeForAudience(ana_B, 'diary', { entry: 'for ana only (B)' }, [anaId]);
  const dA = addressOf(`me://${aName}.${RA}:read/diary`), dB = addressOf(`me://${aName}.${RB}:read/diary`);
  const asBob = [await resolve(bob, `me://${aName}.${RA}:read/diary`), await resolve(bob, `me://${aName}.${RB}:read/diary`)];
  const asAna = [await resolve(ana, `me://${aName}.${RA}:read/diary`), await resolve(ana, `me://${aName}.${RB}:read/diary`)];
  const isEnv = (v: any) => !!v && typeof v === 'object' && v.version === 1 && 'ciphertext' in v;
  check('the address returns the same ciphertext to both', asBob.every((r) => r.ok && isEnv((r as any).value)) && asAna.every((r) => r.ok && isEnv((r as any).value))
    && JSON.stringify((asBob[0] as any).value) === JSON.stringify((asAna[0] as any).value));
  check('ciphertext does not contain the text', !JSON.stringify((asBob[0] as any).value).includes('for ana only'));
  const bobKey = { identityHash: bob.identity(), privateKey: bob.keys.privateKey };
  const anaKey = { identityHash: ana.identity(), privateKey: ana.keys.privateKey };
  const bobOpens = await Promise.all(asBob.map((r) => attempt(() => openEnvelope((r as any).value as AudienceEnvelope, [bobKey]))));
  const anaOpens = await Promise.all(asAna.map((r) => attempt(() => openEnvelope((r as any).value as AudienceEnvelope, [anaKey]))));
  check('bob cannot open it, in either ledger', bobOpens.every((o) => !o.ok));
  check('ana opens it, in each ledger, with what she holds', anaOpens.every((o) => o.ok)
    && (anaOpens[0] as any).value?.entry === 'for ana only (A)' && (anaOpens[1] as any).value?.entry === 'for ana only (B)', JSON.stringify(anaOpens.map((o: any) => o.value)));
  void dA; void dB;

  // ── bob tries to act on ana's address ──
  const intrusion = await attempt(() => bob_A.monad.writeNamespace({
    semanticNamespace: `${aName}.${RA}`, expression: 'battery', value: 0, identityHash: bob.identity(),
  }));
  const after = await resolve(ana, addrA);
  check('a write by bob to ana\'s address is refused', !intrusion.ok, intrusion.ok ? 'ACCEPTED' : (intrusion as any).code);
  check('and the value at the address is unchanged', after.ok && (after as any).value === 80);

  // ── ana's change is at ITS address only; her sessions are what they were ──
  await ana_A.signAndWrite('battery', 75);
  const r2 = [await resolve(ana, addrA), await resolve(bob, addrA), await resolve(bob, addrB)];
  check('a change at the A address shows there, for both, and not at B', (r2[0] as any).value === 75 && (r2[1] as any).value === 75 && (r2[2] as any).value === 50);
  check('ana\'s sessions were not touched by bob', ana_A.semanticNamespace === anaBefore.a && ana_B.semanticNamespace === anaBefore.b && ana.identity() === anaBefore.id
    && heldIdentitiesOf(ana.context)[0]?.links.length === 2);
}
main().then(() => {
  const failed = results.filter((r) => !r).length;
  console.log(`\n${results.length - failed}/${results.length}`);
  process.exit(failed ? 1 : 0);
}).catch((e) => { console.error('HARNESS ERROR', e); process.exit(2); });
