import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { barId, contentId, GUI_BARS_ID, GUI_CONTENT_ID, GUI_LAYOUT_ID, GUI_WINDOW_ID, migrateLegacyGuiDocument, migrateLegacyGuiId } from '../src/runtime/guiIds';
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

// ── GUI.window.layout.bars.left declares its elements ────────────────────────────────────────────────────────────────
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
assert.deepEqual(anon.start[0].props, { id: 'home', label: 'Home', to: '/', icon: 'home', 'data-gui-node-id': 'GUI.window.layout.bars.left.home' });
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
assert.ok(mergedIds.includes('GUI.window.layout.content.domains') && mergedIds.includes('GUI.window.layout.bars.left.domains'));
assert.ok(mergedIds.includes('GUI.window.layout.content.landing'), 'the base parts are still there');
assert.equal(new Set(mergedIds).size, mergedIds.length, 'no duplicate ids after a merge');
assert.deepEqual(idsOf(leftBarSlots(merged).defaults), ['users', 'blockchain', 'url', 'domains']);
// an extension cannot take over a part the base already serves
const tried = mergeGuiDocument(GUI_DOCUMENT, { GUI: { children: { content: { children: { users: { component: 'Other', route: '/elsewhere' } } } } } });
const users = flattenGuiDocument(tried).find((e) => e.id === 'GUI.window.layout.content.users')!;
assert.equal(users.component, 'Users');
assert.equal(users.route, '/users');
assert.strictEqual(mergeGuiDocument(GUI_DOCUMENT, undefined), GUI_DOCUMENT);

// `needs`: the layer a page cannot work without. The landing is the way in and needs nothing; the pages that read
// the .me need the monad; the netget page needs the gateway API. Only pages (parts with a route) declare it, and
// it survives a merge so an app can declare its own.
const byId = new Map(entries.map((e) => [e.id, e]));
assert.equal(byId.get('GUI.window.layout.content.landing')!.needs, undefined, 'the landing is the way in');
for (const id of ['users', 'blockchain', 'url', 'keychain']) assert.equal(byId.get(`GUI.window.layout.content.${id}`)!.needs, 'monad', id);
assert.equal(byId.get('GUI.window.layout.content.netget')!.needs, 'backend');
for (const entry of entries) {
  if (entry.needs) {
    assert.ok(entry.route, `${entry.id}: only a page declares needs`);
    assert.ok(['monad', 'backend', 'both'].includes(entry.needs), `${entry.id}: unknown needs "${entry.needs}"`);
  }
}
const mergedNeeds = flattenGuiDocument(mergeGuiDocument(GUI_DOCUMENT, {
  GUI: { children: { content: { children: { logs: { component: 'Logs', route: '/logs', needs: 'both' } } } } },
})).find((e) => e.id === 'GUI.window.layout.content.logs');
assert.equal(mergedNeeds?.needs, 'both');


// ── Where the parts live: GUI.window.layout.{bars.*, content} ─────────────────────────────────
assert.equal(GUI_WINDOW_ID, 'GUI.window');
assert.equal(GUI_LAYOUT_ID, 'GUI.window.layout');
assert.equal(GUI_BARS_ID, 'GUI.window.layout.bars');
assert.equal(GUI_CONTENT_ID, 'GUI.window.layout.content');
assert.equal(barId('left'), 'GUI.window.layout.bars.left');
assert.equal(contentId('users'), 'GUI.window.layout.content.users');
for (const side of ['left', 'right', 'top', 'bottom', 'sticky']) assert.ok(ids.includes(barId(side as any)), `${side} bar is declared`);
assert.ok(!ids.includes('GUI.window.layout.bars.footer'), 'the bottom bar is `bottom`, not `footer`');
for (const container of ['GUI.window', 'GUI.window.layout', 'GUI.window.layout.bars', 'GUI.window.layout.content']) {
  assert.ok(ids.includes(container), `${container} is declared (the tree needs its containers)`);
}

// The previous shape is read as the current one, id by id.
assert.equal(migrateLegacyGuiId('GUI.bars.left.home'), 'GUI.window.layout.bars.left.home');
assert.equal(migrateLegacyGuiId('GUI.bars.footer'), 'GUI.window.layout.bars.bottom');
assert.equal(migrateLegacyGuiId('GUI.content.users.table'), 'GUI.window.layout.content.users.table');
assert.equal(migrateLegacyGuiId('GUI.bars.left.footer.theme'), 'GUI.window.layout.bars.left.footer.theme', "a bar's own footer section is not the bottom bar");
assert.equal(migrateLegacyGuiId('GUI.window.layout.bars.left'), 'GUI.window.layout.bars.left', 'a current id is left alone');
assert.equal(migrateLegacyGuiId('GUI.barsX'), 'GUI.barsX', 'only whole segments migrate');
assert.equal(migrateLegacyGuiId('me.profile'), 'me.profile');

// ...and so is a document: what netget's own front end declares, in the previous shape, still lands in the bar and the pages.
const legacyApp = {
  GUI: { children: {
    bars: { children: { left: { children: { dash: { label: 'Dash', to: '/dash', icon: 'dashboard' } } }, footer: { label: 'Mine' } } },
    content: { children: { dash: { component: 'Dash', route: '/dash' } } },
  } },
} as any;
const migrated = flattenGuiDocument(legacyApp).map((e) => e.id);
assert.deepEqual(
  migrated.filter((i) => i === 'GUI.window.layout' || i.startsWith('GUI.window.layout.')).sort(),
  ['GUI.window.layout', 'GUI.window.layout.bars', 'GUI.window.layout.bars.bottom', 'GUI.window.layout.bars.left', 'GUI.window.layout.bars.left.dash', 'GUI.window.layout.content', 'GUI.window.layout.content.dash'].sort(),
);
assert.ok(!migrated.some((i) => i.startsWith('GUI.bars') || i.startsWith('GUI.content')), 'nothing is left under the previous ids');
assert.equal(flattenGuiDocument(legacyApp).find((e) => e.id === 'GUI.window.layout.bars.bottom')?.label, 'Mine');
const withApp = leftBarSlots(mergeGuiDocument(GUI_DOCUMENT, legacyApp), { authenticated: false });
assert.ok([...withApp.start, ...withApp.defaults, ...withApp.end].some((el: any) => el.props.id === 'dash' && el.props['data-gui-node-id'] === 'GUI.window.layout.bars.left.dash'), 'the app\'s own bar element is in the left bar under its new id');
assert.ok(flattenGuiDocument(mergeGuiDocument(GUI_DOCUMENT, legacyApp)).some((e) => e.id === 'GUI.window.layout.content.dash' && e.route === '/dash'));
// A document already in the current shape is returned as it is (the migration is safe at every entry point).
assert.strictEqual(migrateLegacyGuiDocument(GUI_DOCUMENT), GUI_DOCUMENT);
const once = migrateLegacyGuiDocument(legacyApp);
assert.strictEqual(migrateLegacyGuiDocument(once), once);

// Guard: the previous ids are not written anywhere in the source but the migration itself.
const legacyId = /GUI\.(bars|content)(?![A-Za-z0-9_])/;
const offenders: string[] = [];
const walk = (dir: string) => {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) { if (name !== 'node_modules') walk(full); continue; }
    if (!/\.(ts|tsx|js|mjs|json)$/.test(name)) continue;
    if (full.endsWith(path.join('runtime', 'guiIds.ts')) || full.endsWith('guiDocument.test.ts')) continue;
    if (legacyId.test(fs.readFileSync(full, 'utf8'))) offenders.push(path.relative(process.cwd(), full));
  }
};
const here = path.dirname(fileURLToPath(import.meta.url));
walk(path.resolve(here, '../src'));
walk(here);
assert.deepEqual(offenders, [], `previous ids (GUI.bars / GUI.content) still written in: ${offenders.join(', ')}`);


console.log('guiDocument.test.ts: all assertions passed');
