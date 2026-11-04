import assert from 'node:assert/strict';
import { buildModel, linkPhrase, opTokens, layout, relOf } from '../src/gui/LLMS/model';

const es = buildModel({ nodes: [{ path: 'menu.cafe.precio', value: 45 }, { path: 'menu.pan.precio', value: 25 }, { path: 'menu.total', value: 70, derived: true }] },
  { path: 'menu.total', value: 70, expr: 'cafe.precio + pan.precio', meta: { dependsOn: ['menu.cafe.precio', 'menu.pan.precio'] } }, ['menu.pan.precio'], undefined);
const toks = linkPhrase('El pan cuesta 25; el café 45, total del menú', es).filter((t) => t.k);
assert.deepEqual(toks.map((t) => [t.text, t.k]), [['pan', 'menu.pan'], ['25', 'menu.pan.precio'], ['café', 'menu.cafe'], ['45', 'menu.cafe.precio'], ['total', 'menu.total'], ['menú', 'menu']]);
// "panadería" must not link to pan (whole words only)
assert.equal(linkPhrase('panadería', es).filter((t) => t.k).length, 0);
assert.deepEqual(linkPhrase('[bread|menu.pan.precio] x', es)[0], { text: 'bread', k: 'menu.pan.precio' });
const def = opTokens({ op: 'define', path: 'menu', name: 'total', expr: 'cafe.precio + pan.precio' }, es).filter((t) => t.k).map((t) => t.k);
assert.deepEqual(def, ['menu', 'menu.total', 'menu.cafe.precio', 'menu.pan.precio', 'menu.total']);
assert.equal(relOf(es, 'menu.pan.precio', ['menu.total']), 1);
assert.equal(relOf(es, 'menu.cafe', ['menu.cafe.precio']), 1);
assert.equal(relOf(es, 'menu.total', ['menu.total']), 2);
const L = layout([{ path: 'a.b', value: 1 }, { path: 'a.c', value: 2 }, { path: 'd[0].e', value: 'x' }]);
assert.ok(L.rows.some((r) => r.p === '' && r.k === '.me'));
assert.ok(L.rows.some((r) => r.p === 'd[0]' && r.k === 'd[0]'));
console.log('llmsModel ok');
