// The position split between the two marks (Roles-and-Territories.md §3): who beside the QR, @where beside the brand.
import assert from 'node:assert/strict';
import { atWhere, splitPosition, whoLines } from '../src/gui/Layout/Position/positionText';

assert.deepEqual(splitPosition('cleaker.me @ localhost:5176'), { who: 'cleaker.me', where: 'localhost:5176' });
assert.deepEqual(splitPosition('jabellae.cleaker.me @ "file:///a b.html"'), { who: 'jabellae.cleaker.me', where: '"file:///a b.html"' });
assert.deepEqual(splitPosition('localhost:5176'), { who: 'localhost:5176', where: '' });
assert.equal(atWhere('localhost:5176'), '@localhost:5176', 'the port stays: two ports are two places');
assert.equal(atWhere(''), '');

// the username on top, the namespace below; the namespace alone without one
assert.deepEqual(whoLines('cleaker.me', 'jabellae'), { primary: 'jabellae', secondary: 'cleaker.me' });
assert.deepEqual(whoLines('jabellae.cleaker.me', 'jabellae'), { primary: 'jabellae', secondary: 'cleaker.me' }, 'the username is not repeated');
assert.deepEqual(whoLines('cleaker.me'), { primary: 'cleaker.me', secondary: null });
assert.deepEqual(whoLines('cleaker.me', '  '), { primary: 'cleaker.me', secondary: null });

console.log('positionText: ok');
