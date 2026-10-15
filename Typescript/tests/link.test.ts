import assert from 'node:assert/strict';
import {
  EMPTY_CONTEXT, NOWHERE, addLink, applyReading, applyReadingTo, attachSession, closeLink, detachSession,
  isAuthorized, isReady, moveSemantic, navigateSurface, openLink, operationsTarget, parseSurface, retarget,
  retargetLink, select, selectedLink, targetKey, verificationHolds,
  EMPTY_WORKSPACE, attachLink, closeContext, closePage, contextOf, navigatePage, openContext, openPage, selectContext, selectPage, setLocation,
  type Link, type LinkContext,
} from '../src/react/link';

const A = { namespace: 'jabellae.cleaker.me', transport: 'https://cleaker.me' };
const B = { namespace: 'fulltrailer.com.mx', transport: 'http://127.0.0.1:4100' };
const keyA = targetKey(A);
const keyB = targetKey(B);
const answerFor = (key: string, ns: string | null, signature: 'absent' | 'valid' | 'invalid' = 'valid') =>
  ({ kind: 'answer', of: key, answeredNamespace: ns, signature }) as const;

// ── a target is namespace + transport origin ─────────────────────────────────────────────────────────────────────
{
  assert.equal(targetKey({ namespace: 'Acme.Test.', transport: 'https://Acme.test/some/path/' }), 'acme.test@https://acme.test');
  assert.equal(targetKey({ namespace: 'acme.test', transport: 'https://acme.test' }), targetKey({ namespace: 'ACME.test', transport: 'https://acme.test/' }));
  assert.notEqual(targetKey({ namespace: 'acme.test', transport: 'https://acme.test' }), targetKey({ namespace: 'acme.test', transport: 'http://acme.test' }));
}

// ── a link: answered is not authorized; a failure is not an answer ───────────────────────────────────────────────
{
  let l = openLink(A);
  assert.equal(l.verification.state, 'unverified');
  assert.equal(isReady(l), false);
  l = applyReading(l, { kind: 'checking', of: l.id });
  assert.equal(l.verification.state, 'checking');
  assert.equal(isReady(l), false);
  l = applyReading(l, answerFor(l.id, 'jabellae.cleaker.me'));
  assert.equal(l.verification.state, 'answered');
  assert.equal(isReady(l), true);
  assert.equal(isAuthorized(l), false, 'a service answering is a capability, not authority');
  // authority upgrades an answer for the same namespace
  const up = applyReading(l, { kind: 'authority', of: l.id, namespace: 'jabellae.cleaker.me', evidence: 'claim:abc' });
  assert.equal(isAuthorized(up), true);
  // authority never creates itself out of nothing, and not for another namespace
  assert.equal(isAuthorized(applyReading(openLink(A), { kind: 'authority', of: keyA, namespace: A.namespace, evidence: 'x' })), false);
  assert.equal(applyReading(l, { kind: 'authority', of: l.id, namespace: 'other.me', evidence: 'x' }), l);
  // wrong namespace, missing answer, bad signature, unreachable: all failures, none ready
  const fails = [
    applyReading(openLink(A), answerFor(keyA, 'someone.else')),
    applyReading(openLink(A), answerFor(keyA, null)),
    applyReading(openLink(A), answerFor(keyA, A.namespace, 'invalid')),
    applyReading(openLink(A), { kind: 'unreachable', of: keyA }),
  ];
  assert.deepEqual(fails.map((f) => (f.verification as any).reason), ['wrong-namespace', 'no-answer', 'invalid-signature', 'no-answer']);
  assert.ok(fails.every((f) => !isReady(f)));
  // a later failure replaces the earlier answer: the current reading is the failed one
  assert.equal(applyReading(l, { kind: 'unreachable', of: l.id }).verification.state, 'failed');
  // absent signature is an answer (a minimal monad), not a failure
  assert.equal(applyReading(openLink(A), answerFor(keyA, A.namespace, 'absent')).verification.state, 'answered');
}

// ── an earlier verification does not confirm a new target ────────────────────────────────────────────────────────
{
  let l = applyReading(openLink(A), answerFor(keyA, A.namespace));
  assert.equal(isReady(l), true);
  // the same link pointed at another transport: back to unverified
  const moved = retarget(l, { namespace: A.namespace, transport: 'https://mirror.example' });
  assert.equal(moved.verification.state, 'unverified');
  assert.notEqual(moved.id, l.id);
  // the answer for the old target arrives late: it does not confirm the new one
  assert.equal(applyReading(moved, answerFor(keyA, A.namespace)), moved);
  assert.equal(isReady(applyReading(moved, answerFor(keyA, A.namespace))), false);
  // same target (only a trailing slash differs): nothing is lost
  assert.equal(retarget(l, { namespace: A.namespace, transport: 'https://cleaker.me/' }), l);
  assert.equal(verificationHolds(l), true);
  // another namespace behind the same transport is another target
  assert.equal(retarget(l, { namespace: 'x.cleaker.me', transport: A.transport }).verification.state, 'unverified');
}

// ── a context: selecting B does not modify or close A ────────────────────────────────────────────────────────────
{
  let ctx: LinkContext = EMPTY_CONTEXT;
  ctx = addLink(ctx, A);
  ctx = addLink(ctx, B);
  assert.equal(ctx.links.length, 2);
  assert.equal(ctx.selected, null, 'opening a link does not select it');
  assert.equal(addLink(ctx, { ...A, transport: 'https://cleaker.me/' }), ctx, 'the same target is not opened twice');

  ctx = applyReadingTo(ctx, answerFor(keyA, A.namespace));
  ctx = attachSession(ctx, keyA, 'jabellae');
  ctx = select(ctx, keyA);
  const aBefore = ctx.links.find((l) => l.id === keyA) as Link;
  const sessionBefore = ctx.sessions[keyA];

  ctx = select(ctx, keyB);
  assert.equal(ctx.selected, keyB);
  assert.equal(ctx.links.length, 2, 'A is still open');
  assert.equal(ctx.links.find((l) => l.id === keyA), aBefore, 'A is the very same value');
  assert.equal(ctx.sessions[keyA], sessionBefore, "A's session is untouched");

  // the card and its operations follow the selection, and never borrow the other link's session
  const onB = operationsTarget(ctx)!;
  assert.equal(onB.link.id, keyB);
  assert.equal(onB.session, null);
  assert.equal(onB.ready, false, 'B has not answered');
  ctx = select(ctx, keyA);
  const onA = operationsTarget(ctx)!;
  assert.deepEqual([onA.link.id, onA.session?.identity, onA.ready], [keyA, 'jabellae', true]);

  // a reading for B lands on B only
  const withB = applyReadingTo(ctx, answerFor(keyB, B.namespace, 'absent'));
  assert.equal(withB.links.find((l) => l.id === keyA), aBefore);
  assert.equal(isReady(withB.links.find((l) => l.id === keyB)!), true);
  // a reading for a link that is not open changes nothing
  assert.equal(applyReadingTo(ctx, answerFor('nobody@https://x.test', 'nobody')), ctx);

  // selecting something that is not open changes nothing
  assert.equal(select(ctx, 'nope@https://x.test'), ctx);
  // clearing the selection closes nothing
  const none = select(ctx, null);
  assert.equal(none.selected, null);
  assert.equal(none.links.length, 2);
  assert.equal(selectedLink(none), null);
  assert.equal(operationsTarget(none), null);
}

// ── closing and retargeting move only the link they name ─────────────────────────────────────────────────────────
{
  let ctx = addLink(addLink(EMPTY_CONTEXT, A), B);
  ctx = applyReadingTo(applyReadingTo(ctx, answerFor(keyA, A.namespace)), answerFor(keyB, B.namespace));
  ctx = attachSession(attachSession(ctx, keyA, 'jabellae'), keyB, 'fulltrailer-admin');
  ctx = select(ctx, keyA);

  // closing B (not selected) leaves A, its session and the selection alone
  const closedB = closeLink(ctx, keyB);
  assert.deepEqual(closedB.links.map((l) => l.id), [keyA]);
  assert.equal(closedB.selected, keyA);
  assert.deepEqual(Object.keys(closedB.sessions), [keyA]);
  // closing the selected link clears the selection; it does not jump to another one
  const closedA = closeLink(ctx, keyA);
  assert.equal(closedA.selected, null);
  assert.deepEqual(closedA.links.map((l) => l.id), [keyB]);
  assert.equal(closedA.sessions[keyB].identity, 'fulltrailer-admin');

  // retargeting A: unverified, its session dropped, selection follows it, B untouched
  const bBefore = ctx.links.find((l) => l.id === keyB);
  const re = retargetLink(ctx, keyA, { namespace: A.namespace, transport: 'http://127.0.0.1:9999' });
  const newKey = targetKey({ namespace: A.namespace, transport: 'http://127.0.0.1:9999' });
  assert.equal(re.selected, newKey);
  assert.equal(re.links.find((l) => l.id === newKey)!.verification.state, 'unverified');
  assert.equal(re.sessions[keyA], undefined);
  assert.equal(re.sessions[newKey], undefined, 'an identity signed in through the old target is not signed in here');
  assert.equal(re.links.find((l) => l.id === keyB), bBefore);
  assert.equal(re.sessions[keyB].identity, 'fulltrailer-admin');
  // pointing a link at a target that is already another open link is refused
  assert.equal(retargetLink(ctx, keyA, B), ctx);

  // detach touches one session
  const d = detachSession(ctx, keyA);
  assert.equal(d.sessions[keyA], undefined);
  assert.equal(d.sessions[keyB], ctx.sessions[keyB]);
  // a session cannot be attached to a link that is not open
  assert.equal(attachSession(ctx, 'nope@https://x.test', 'x'), ctx);
}

// ── the two paths are independent ────────────────────────────────────────────────────────────────────────────────
{
  let place = moveSemantic(NOWHERE, 'jabellae.cleaker.me', '/notas');
  place = navigateSurface(place, 'https://ejemplo.com/articulos/transporte');
  assert.deepEqual(place.location, { namespace: 'jabellae.cleaker.me', path: '/notas' });
  assert.deepEqual(place.surface, { url: 'https://ejemplo.com/articulos/transporte', origin: 'https://ejemplo.com', path: '/articulos/transporte' });

  // navigating the site does not move the namespace path (same value, not just an equal one)
  const loc = place.location;
  const browsed = navigateSurface(place, 'https://ejemplo.com/otra/pagina?q=1#x');
  assert.equal(browsed.location, loc);
  assert.equal(browsed.surface!.path, '/otra/pagina');
  assert.equal(browsed.location!.path, '/notas');

  // moving in the namespace does not navigate the site
  const surf = place.surface;
  const moved = moveSemantic(place, 'jabellae.cleaker.me', 'ideas/hoy');
  assert.equal(moved.surface, surf);
  assert.equal(moved.location!.path, '/ideas/hoy');
  assert.equal(moved.surface!.path, '/articulos/transporte');

  // the same path string means different things on each channel
  const same = navigateSurface(moveSemantic(NOWHERE, 'a.test', '/users'), 'https://other.example/users');
  assert.equal(same.location!.path, same.surface!.path);
  assert.notEqual(same.location!.namespace, same.surface!.origin);

  // a surface that is not a web URL is not navigated to; the place stays as it was
  assert.equal(navigateSurface(place, 'jabellae.cleaker.me/notas'), place);
  assert.equal(navigateSurface(place, 'javascript:alert(1)'), place);
  assert.equal(parseSurface('not a url'), null);
  // a place can hold either channel without the other (a namespace with no external content, and the reverse)
  assert.equal(moveSemantic(NOWHERE, 'a.test', '/').surface, null);
  assert.equal(navigateSurface(NOWHERE, 'https://x.test/').location, null);
}


// ── workspace: contexts with zero, one or several open pages ────────────────────────────────────────────────────────
{
  let ws = EMPTY_WORKSPACE;
  for (const ns of ['ns1.test', 'ns2.test', 'ns3.test', 'ns4.test']) ws = openContext(ws, ns);
  ws = setLocation(ws, 'ns1.test', '/notas');          // 1: a tree route, no page
  ws = openPage(ws, 'ns3.test', 'https://example.com/articulos/transporte');
  ws = openPage(ws, 'ns3.test', 'https://example.org/otra');
  ws = openPage(ws, 'ns4.test', 'https://example.com/articulos/transporte');  // the SAME url, under another context
  assert.deepEqual(['ns1.test', 'ns2.test', 'ns3.test', 'ns4.test'].map((n) => contextOf(ws, n)!.openings.length), [0, 0, 2, 1]);
  assert.equal(contextOf(ws, 'ns1.test')!.location, '/notas');
  assert.equal(contextOf(ws, 'ns2.test')!.location, null, 'nothing selected, nothing open');
  assert.equal(ws.selected, null, 'opening contexts and pages selects nothing');

  // the same URL under two contexts is two openings, with ids of their own
  const o3 = contextOf(ws, 'ns3.test')!.openings[0];
  const o4 = contextOf(ws, 'ns4.test')!.openings[0];
  assert.equal(o3.surface.url, o4.surface.url);
  assert.notEqual(o3.id, o4.id);

  // navigating / selecting / closing in ns3 leaves ns4 as the very same value
  const ns4Before = contextOf(ws, 'ns4.test');
  let w2 = navigatePage(ws, 'ns3.test', o3.id, 'https://example.com/articulos/otro');
  w2 = selectPage(w2, 'ns3.test', o3.id);
  assert.equal(contextOf(w2, 'ns4.test'), ns4Before, 'ns4 untouched by ns3 navigating and selecting');
  assert.equal(contextOf(w2, 'ns4.test')!.openings[0].surface.path, '/articulos/transporte');
  w2 = closePage(w2, 'ns3.test', o3.id);
  assert.equal(contextOf(w2, 'ns4.test'), ns4Before, 'ns4 untouched by ns3 closing a page');
  assert.equal(contextOf(w2, 'ns3.test')!.openings.length, 1);
  assert.equal(contextOf(w2, 'ns3.test')!.selectedOpening, null, 'closing the selected page does not choose another');

  // the tree location and the pages' routes are independent
  const pagesBefore = contextOf(ws, 'ns3.test')!.openings;
  const moved = setLocation(ws, 'ns3.test', 'investigacion');
  assert.equal(contextOf(moved, 'ns3.test')!.location, '/investigacion');
  assert.equal(contextOf(moved, 'ns3.test')!.openings, pagesBefore, 'moving in the tree does not touch the pages');
  const browsed = navigatePage(moved, 'ns3.test', o3.id, 'https://example.com/otra/ruta');
  assert.equal(contextOf(browsed, 'ns3.test')!.location, '/investigacion', 'navigating a page does not move the tree location');

  // the link is a pointer: losing it keeps the context and its pages; closing a page keeps the link
  let c = attachLink(ws, 'ns3.test', 'ns3.test@https://ns3.test');
  c = selectPage(c, 'ns3.test', o3.id);
  const disconnected = attachLink(c, 'ns3.test', null);
  assert.equal(contextOf(disconnected, 'ns3.test')!.openings.length, 2);
  assert.equal(contextOf(disconnected, 'ns3.test')!.selectedOpening, o3.id);
  assert.equal(contextOf(disconnected, 'ns3.test')!.linkId, null);
  const closedPage = closePage(c, 'ns3.test', o3.id);
  assert.equal(contextOf(closedPage, 'ns3.test')!.linkId, 'ns3.test@https://ns3.test');

  // closing a context closes its pages and nothing else
  const gone = closeContext(selectContext(ws, 'ns3.test'), 'ns3.test');
  assert.equal(contextOf(gone, 'ns3.test'), null);
  assert.equal(gone.selected, null);
  assert.equal(contextOf(gone, 'ns4.test'), ns4Before);

  // not a web page, not an opening; unknown ids change nothing
  assert.equal(openPage(ws, 'ns3.test', 'ns3.test/notas'), ws);
  assert.equal(closePage(ws, 'ns3.test', 'nope#1'), ws);
  assert.equal(openContext(ws, 'NS1.test.'), ws, 'a context is its namespace; opening it again changes nothing');
}

// ── a port is a different transport, not a different namespace; nothing is inherited across ports ──────────────────
{
  const p80 = { namespace: 'name.space', transport: 'https://name.space' };
  const p8080 = { namespace: 'name.space', transport: 'https://name.space:8080' };
  assert.notEqual(targetKey(p80), targetKey(p8080), 'two ports are two links');
  // one context (the namespace) can be reached by either link; the verification lives on the links
  let ctx = addLink(addLink(EMPTY_CONTEXT, p80), p8080);
  ctx = applyReadingTo(ctx, answerFor(targetKey(p80), 'name.space'));
  assert.equal(isReady(ctx.links.find((l) => l.id === targetKey(p80))!), true);
  assert.equal(isReady(ctx.links.find((l) => l.id === targetKey(p8080))!), false, 'the other port did not inherit it');
  ctx = attachSession(ctx, targetKey(p80), 'ana');
  assert.equal(ctx.sessions[targetKey(p8080)], undefined, 'nor the session');
  // pointing the namespace's context at the other port's link does not move verification or credentials with it
  let ws = openContext(EMPTY_WORKSPACE, 'name.space', { linkId: targetKey(p80) });
  ws = attachLink(ws, 'name.space', targetKey(p8080));
  assert.equal(contextOf(ws, 'name.space')!.linkId, targetKey(p8080));
  assert.equal(isReady(ctx.links.find((l) => l.id === contextOf(ws, 'name.space')!.linkId)!), false);
  assert.equal(operationsTarget(select(ctx, targetKey(p8080)))!.session, null);
}

console.log('link: ok');
