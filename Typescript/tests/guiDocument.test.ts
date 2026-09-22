import assert from 'node:assert/strict';
import { flattenGuiDocument, mergeGuiDocument, leftBarSlots, GUI_DOCUMENT } from '../src/runtime/guiDocument';

const entries = flattenGuiDocument();
const ids = entries.map((e) => e.id);

// One id per part, and an id is a path of plain words: no slashes, no dashes.
assert.equal(new Set(ids).size, ids.length, 'duplicate ids in the document');
for (const id of ids) {
  assert.match(id, /^[A-Za-z0-9]+(\.[A-Za-z0-9]+)*$/, `"${id}" is not a path of plain words`);
}

// A part's parent is its path minus the last segment, and it is declared.
for (const entry of entries) {
  if (entry.id === 'GUI') continue;
  assert.equal(entry.parentId, entry.id.split('.').slice(0, -1).join('.'), entry.id);
  assert.ok(ids.includes(entry.parentId!), `${entry.id}: parent is not declared`);
}

// A route is served by a component, and no two parts share a route.
const routes = entries.filter((e) => e.route).map((e) => e.route);
assert.equal(new Set(routes).size, routes.length, 'two parts on one route');
for (const entry of entries) if (entry.route) assert.ok(entry.component, `${entry.id}: a route needs a component`);

// ── GUI.bars.left declares its elements ────────────────────────────────────────────────────────────────
// The left bar's elements are the document's, and for the root GUI they are exactly what the shell used to
// hard-code (Home first, Users/Blockchain/URL as fallbacks the namespace may override, Keychain only with a
// session, Netget last).
const idsOf = (els: any[]) => els.map((e) => e.props.id);
const anon = leftBarSlots(GUI_DOCUMENT, { authenticated: false });
const authed = leftBarSlots(GUI_DOCUMENT, { authenticated: true });
assert.deepEqual(idsOf(anon.start), ['home']);
assert.deepEqual(idsOf(anon.defaults), ['users', 'blockchain', 'url']);
assert.deepEqual(idsOf(anon.end), ['netget'], 'no Keychain without a session');
assert.deepEqual(idsOf(authed.end), ['keychain', 'netget']);
assert.deepEqual(anon.start[0].props, { id: 'home', label: 'Home', to: '/', icon: 'home', 'data-gui-node-id': 'GUI.bars.left.home' });
assert.deepEqual(
  anon.defaults.map((e: any) => [e.props.label, e.props.to, e.props.icon]),
  [['Users', '/users', 'group'], ['Blockchain', '/blockchain', 'link'], ['URL', '/url', 'language']]
);
// every element leads somewhere the document serves
const served = new Set(entries.filter((e) => e.route).map((e) => e.route));
for (const el of [...anon.start, ...anon.defaults, ...authed.end]) {
  assert.ok(served.has((el as any).props.to), `${(el as any).props.id}: "${(el as any).props.to}" is not a route of the document`);
}

// ── an app adds parts on top of the root GUI ───────────────────────────────────────────────────────────
const before = JSON.stringify(GUI_DOCUMENT);
const merged = mergeGuiDocument(GUI_DOCUMENT, {
  GUI: {
    children: {
      bars: { children: { left: { children: { domains: { label: 'Domains', to: '/domains', icon: 'language' } } } } },
      content: { children: { domains: { label: 'Domains', component: 'Domains', route: '/domains' } } },
    },
  },
});
assert.equal(JSON.stringify(GUI_DOCUMENT), before, 'the base document is not changed by a merge');
const mergedIds = flattenGuiDocument(merged).map((e) => e.id);
assert.ok(mergedIds.includes('GUI.content.domains') && mergedIds.includes('GUI.bars.left.domains'));
assert.ok(mergedIds.includes('GUI.content.landing'), 'the base parts are still there');
assert.equal(new Set(mergedIds).size, mergedIds.length, 'no duplicate ids after a merge');
assert.deepEqual(idsOf(leftBarSlots(merged).defaults), ['users', 'blockchain', 'url', 'domains']);
// an extension cannot take over a part the base already serves
const tried = mergeGuiDocument(GUI_DOCUMENT, { GUI: { children: { content: { children: { users: { component: 'Other', route: '/elsewhere' } } } } } });
const users = flattenGuiDocument(tried).find((e) => e.id === 'GUI.content.users')!;
assert.equal(users.component, 'Users');
assert.equal(users.route, '/users');
assert.strictEqual(mergeGuiDocument(GUI_DOCUMENT, undefined), GUI_DOCUMENT);

console.log('guiDocument.test.ts: all assertions passed');
