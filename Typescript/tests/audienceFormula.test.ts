import assert from 'node:assert/strict';
import { parseAudience, namesIn, mapNames } from '../src/gui/All.This/Audiences/audienceFormula';

assert.equal(parseAudience('ana'), 'ana');
assert.deepEqual(parseAudience('ana | bob'), ['ana', 'bob']);
assert.deepEqual(parseAudience('ana & bob'), { and: ['ana', 'bob'] });
// & binds tighter than |
assert.deepEqual(parseAudience('ana | bob & carol'), ['ana', { and: ['bob', 'carol'] }]);
assert.deepEqual(parseAudience('(ana | bob) & carol'), { and: [['ana', 'bob'], 'carol'] });
assert.deepEqual(parseAudience('  Ana|BOB '), ['ana', 'bob'], 'case and spaces do not matter');
assert.deepEqual([...namesIn(parseAudience('(ana & bob) | carol'))].sort(), ['ana', 'bob', 'carol']);
assert.deepEqual(mapNames(parseAudience('ana | (bob & carol)'), (n) => n.toUpperCase()), ['ANA', { and: ['BOB', 'CAROL'] }]);

for (const bad of ['', '| ana', 'ana &', '(ana', 'ana)', 'ana bob', 'ana || bob', '@']) {
  assert.throws(() => parseAudience(bad), undefined, `"${bad}" is refused`);
}
console.log('audienceFormula: ok');
