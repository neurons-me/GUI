// A one-label space (`localhost`, `here`) is a valid NRP namespace only when the runtime this page talks to has
// declared it. Without that context the two-label shape rule still applies, exactly as before.
import assert from 'node:assert/strict';
import { parseNRPExpression } from '../src/gui/All.This/NRP/Beatle/NRPExpression';

// no context: unchanged
for (const raw of ['localhost', 'me://localhost', 'here']) {
  const expr = parseNRPExpression(raw);
  assert.equal(expr.domainShapeValid, false, `${raw} has no two-label shape and no declared context`);
}
assert.equal(parseNRPExpression('local.cleaker').domainShapeValid, true);
assert.equal(parseNRPExpression('jabellae.localhost').domainShapeValid, true);

// declared: the root itself passes, case folded
assert.equal(parseNRPExpression('localhost', { declaredSpaces: ['localhost'] }).domainShapeValid, true);
assert.equal(parseNRPExpression('LocalHost', { declaredSpaces: ['localhost'] }).domainShapeValid, true);
assert.equal(parseNRPExpression('here', { declaredSpaces: ['Here'] }).domainShapeValid, true);

// declared for one space does not bless another single label
assert.equal(parseNRPExpression('elsewhere', { declaredSpaces: ['localhost'] }).domainShapeValid, false);

// inside a composite expression every namespace leaf must pass on its own
assert.equal(parseNRPExpression('localhost + local.cleaker', { declaredSpaces: ['localhost'] }).domainShapeValid, true);
assert.equal(parseNRPExpression('localhost + elsewhere', { declaredSpaces: ['localhost'] }).domainShapeValid, false);

// an empty declaration is the same as none
assert.equal(parseNRPExpression('localhost', { declaredSpaces: [] }).domainShapeValid, false);

console.log('✔ nrpExpressionDeclaredSpace tests passed');
