import assert from 'node:assert/strict';
import { flattenGuiDocument } from '../src/runtime/guiDocument';

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

console.log('guiDocument.test.ts: all assertions passed');
