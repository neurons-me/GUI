import assert from 'node:assert/strict';
import ME from 'this.me';
import { KEY_META_PREFIX, cleanLabel, declareNodeMeta, forgetNodeMeta, iconToValue, parseIcon, publicMetaReader, readPublicMeta, resolveNodeMeta } from '../src/gui/All.This/Cleaker/Keys/keyMeta';

// Minimal localStorage for the public branch.
const mem = new Map<string, string>();
(globalThis as any).localStorage = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => void mem.set(k, String(v)), removeItem: (k: string) => void mem.delete(k) };

let n = 0;
const test = (name: string, fn: () => void) => { fn(); n++; console.log(`PASS ${name}`); };

test('K1 resolution order: this.me tree → public branch → built-in → default', () => {
  const me: any = new ME('test.keymeta.public-demo'); // explicit public demo id: new ME() would generate + persist a seed (this.me.seed:v1)
  me.keys.meta.icon('hub'); me.keys.meta.label('Meta · plataformas');
  const local = publicMetaReader({ 'keys.meta': { icon: 'star', label: 'Local' }, 'keys.dev': { icon: 'terminal' } });
  const r1 = resolveNodeMeta('keys.meta', [me, local], { icon: { kind: 'brand', service: 'meta' }, label: 'Meta' });
  assert.deepEqual([r1.icon, r1.label, r1.iconSource, r1.labelSource], [{ kind: 'icon', name: 'hub' }, 'Meta · plataformas', 'tree', 'tree']);
  const r2 = resolveNodeMeta('keys.dev', [me, local], { icon: { kind: 'icon', name: 'code' }, label: 'Developer APIs' });
  assert.deepEqual([r2.icon, r2.label, r2.iconSource, r2.labelSource], [{ kind: 'icon', name: 'terminal' }, 'Developer APIs', 'tree', 'builtin']);
  const r3 = resolveNodeMeta('keys.paypal', [me, local], { icon: { kind: 'brand', service: 'paypal' }, label: 'PayPal' });
  assert.deepEqual([r3.icon, r3.iconSource], [{ kind: 'brand', service: 'paypal' }, 'builtin']);
  const r4 = resolveNodeMeta('keys.stripe-test', [me, local]);
  assert.deepEqual([r4.icon, r4.label, r4.iconSource, r4.labelSource], [{ kind: 'icon', name: 'key' }, 'Stripe test', 'default', 'default']);
});
test('K2 icon values: token, prefixed token, glyph, brand; junk ignored', () => {
  assert.deepEqual(parseIcon('photo_camera'), { kind: 'icon', name: 'photo_camera' });
  assert.deepEqual(parseIcon('lucide:Truck'), { kind: 'icon', name: 'lucide:Truck' });
  assert.deepEqual(parseIcon('🚚'), { kind: 'glyph', value: '🚚' });
  assert.deepEqual(parseIcon('𓃒'), { kind: 'glyph', value: '𓃒' });
  assert.deepEqual(parseIcon('brand:instagram'), { kind: 'brand', service: 'instagram' });
  for (const bad of [undefined, null, 42, {}, [], '', '   ', 'brand:nope']) assert.equal(parseIcon(bad), undefined, String(bad));
  assert.equal(iconToValue(parseIcon('brand:paypal')), 'brand:paypal');
});
test('K3 grapheme cap: one glyph, ZWJ kept whole, capped at 16 code points', () => {
  assert.deepEqual(parseIcon('🚚🛻 trucks'), { kind: 'glyph', value: '🚚' });
  assert.deepEqual(parseIcon('👩‍💻'), { kind: 'glyph', value: '👩‍💻' });
  const long = '👨‍👩‍👧‍👦'.repeat(1) + '\u200d👨'.repeat(10);
  const g = parseIcon(long) as any; assert.ok(Array.from(g.value).length <= 16);
});
test('K4 labels: single line, trimmed, capped', () => {
  assert.equal(cleanLabel('  Báscula\n norte  '), 'Báscula norte');
  assert.equal(Array.from(cleanLabel('x'.repeat(200))!).length, 48);
  assert.equal(cleanLabel(7), undefined);
});
test('K5 public only: declared metadata goes to the public branch (and the tree), nothing else', () => {
  mem.clear();
  const me: any = new ME('test.keymeta.public-demo'); // explicit public demo id: new ME() would generate + persist a seed (this.me.seed:v1)
  declareNodeMeta('Demo.NS', 'keys.fleet.trucks', { icon: '🚚', label: 'Tractocamiones' }, me);
  assert.deepEqual([...mem.keys()], [`${KEY_META_PREFIX}demo.ns`]);
  assert.deepEqual(JSON.parse(mem.get(`${KEY_META_PREFIX}demo.ns`)!), { 'keys.fleet.trucks': { icon: '🚚', label: 'Tractocamiones' } });
  assert.equal(me('keys.fleet.trucks.icon'), '🚚');
  assert.equal(me('keys.fleet.trucks.label'), 'Tractocamiones');
  // Values that are not icon/label shapes are refused (only strings that parse are kept).
  declareNodeMeta('demo.ns', 'keys.x', { icon: { secret: 'v' } as any, label: 123 as any });
  assert.equal(readPublicMeta('demo.ns')['keys.x'], undefined);
  forgetNodeMeta('demo.ns', 'keys.fleet.trucks');
  assert.equal(mem.size, 0);
});
console.log(`${n} passed`);
