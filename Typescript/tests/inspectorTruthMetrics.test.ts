import assert from 'node:assert/strict';
import ME from 'this.me';
import { buildTruthMetrics } from '../src/runtime/inspector';

// The Explain tiles must not present the derivation's input count and the
// kernel wave's work (meta.k / recomputed / changed) as one metric.
// Payloads come from a real this.me kernel's explain().

const tile = (metrics: { label: string; value: string; detail?: string }[], label: string) => {
  const t = metrics.find((m) => m.label === label);
  assert.ok(t, `tile "${label}" present`);
  return t!;
};

function derivedPathAfterAWave() {
  const me: any = new (ME as any)();
  me.a(2); me.b(3); me.d(1);
  me['=']('c', 'a + b');
  me['=']('e', 'c * d');
  me.a(5); // one wave: recomputes c and then e
  const payload = me.explain('c');
  const metrics = buildTruthMetrics(payload, null, 'c');

  assert.ok(!metrics.some((m) => /dependencies \(k\)/i.test(m.label)), 'no "Dependencies (k)" tile');
  assert.equal(tile(metrics, 'Inputs (derivation)').value, String(payload.derivation.inputs.length));
  assert.equal(tile(metrics, 'Inputs (derivation)').value, '2');
  assert.equal(tile(metrics, 'Last wave · k').value, String(payload.meta.k));
  assert.match(tile(metrics, 'Last wave · k').detail!, /write to a$/);
  const rc = tile(metrics, 'Last wave · recomputed / changed');
  assert.equal(rc.value, `${payload.meta.recomputed.length} / ${payload.meta.changed.length}`);
  assert.ok(rc.detail!.includes('c'));
}

function plainFact() {
  const me: any = new (ME as any)();
  me.x(1);
  const metrics = buildTruthMetrics(me.explain('x'), null, 'x');
  assert.equal(tile(metrics, 'Inputs (derivation)').value, '—');
  assert.equal(tile(metrics, 'Inputs (derivation)').detail, 'not derived (a fact)');
  assert.equal(tile(metrics, 'Last wave · k').value, '—');
  assert.equal(tile(metrics, 'Last wave · recomputed / changed').value, '—');
  assert.equal(me('subscribe'), undefined);
}

derivedPathAfterAWave();
plainFact();
console.log('inspectorTruthMetrics.test.ts: all assertions passed');
