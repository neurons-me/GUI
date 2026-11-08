import assert from 'node:assert/strict';
import { identityMarkColors } from '../src/gui/All.This/monad.ai/identityMarkColors';

const seafoam = identityMarkColors('#396C70', 'dark');
assert.equal(seafoam.dotFill, '#396C70');
assert.match(String(seafoam.ringColor), /57,\s*108,\s*112|396[Cc]70/);
assert.ok(!/#eafcfa/i.test(seafoam.dotFill));
assert.ok(!/#005a7a/i.test(String(seafoam.ringColor)));
assert.ok(!/230,\s*245,\s*245/.test(String(seafoam.ringColor)));

const neurons = identityMarkColors('#90caf9', 'dark');
assert.equal(neurons.dotFill, '#90caf9');
assert.notEqual(seafoam.dotFill, neurons.dotFill);
assert.notEqual(seafoam.ringColor, neurons.ringColor);

const light = identityMarkColors('#396C70', 'light');
assert.equal(light.dotFill, '#396C70');
assert.notEqual(light.ringColor, seafoam.ringColor);

const err = identityMarkColors('#d32f2f', 'dark');
assert.equal(err.dotFill, '#d32f2f');

console.log('identityMarkColors: ok');
