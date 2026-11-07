// Level 2 (src/gui/All.This/Cleaker/Corner/cleakerBars.ts): the bars read from an author's document, kept safe to draw,
// and each bar's state from the author's default and the person's choice.
import assert from 'node:assert/strict';
import { barStates, iconToken, itemGlyph, readBars, safeHref } from '../src/gui/All.This/Cleaker/Corner/cleakerBars';

const BASE = 'https://neurons-me.github.io/docs/index.html';

// links: only somewhere a link may go
assert.equal(safeHref('/about', BASE), 'https://neurons-me.github.io/about');
assert.equal(safeHref('notes.html', BASE), 'https://neurons-me.github.io/docs/notes.html');
assert.equal(safeHref('#top', BASE), '#top');
assert.equal(safeHref('https://cleaker.me', BASE), 'https://cleaker.me/');
for (const bad of ['javascript:alert(1)', ' JavaScript:alert(1)', 'data:text/html,<b>x</b>', 'file:///etc/passwd', '', null, 42]) {
  assert.equal(safeHref(bad, BASE), null, String(bad));
}
// on a page opened as a file, a relative link stays a file link on this device
assert.equal(safeHref('other.html', 'file:///Users/me/site/page.html'), 'file:///Users/me/site/other.html');

// glyphs
assert.equal(itemGlyph('glyph:𓆣', 'Netget'), '𓆣');
assert.equal(itemGlyph('home', 'home page'), 'H');

// icon tokens .GUI's Icon draws; a glyph or anything else is not one
assert.equal(iconToken('home'), 'home');
assert.equal(iconToken('lucide:Menu'), 'lucide:Menu');
for (const bad of ['glyph:𓆣', '<img>', 'home page', '', null, 'x'.repeat(60)]) assert.equal(iconToken(bad), undefined, String(bad));

// the full GUI document shape
const full = { GUI: { children: { window: { children: { layout: { children: { bars: { children: {
  top: { label: 'Top bar', props: { state: 'open' }, children: { docs: { label: 'Docs', to: '/docs' } } },
  sticky: { label: 'not a bar' },
  left: { label: 'Left bar', children: {
    home: { label: 'Home', to: '/', icon: 'home' },
    evil: { label: 'Evil', to: 'javascript:alert(1)' },
    nowhere: { label: 'Nowhere' },
    netget: { label: 'Netget', to: '/netget', icon: 'glyph:𓆣' },
  } },
} } } } } } } } };
const bars = readBars(full, BASE);
assert.deepEqual(bars.map((b) => b.id), ['top', 'left'], 'only top/left/right/bottom, in that order');
assert.equal(bars[0].defaultState, 'open');
assert.equal(bars[1].defaultState, 'closed', 'a bar the author did not open starts closed');
assert.deepEqual(bars[1].items.map((i) => i.id), ['home', 'netget'], 'unsafe and target-less elements are not drawn');
assert.equal(bars[1].items[1].glyph, '𓆣');
assert.equal(bars[1].items[0].icon, 'home');
assert.equal(bars[1].items[1].icon, undefined, 'a glyph is not an icon token');

// the short shape
assert.deepEqual(readBars({ bars: { bottom: { state: 'icons', children: { a: { label: 'A', to: '/a' } } } } }, BASE).map((b) => [b.id, b.defaultState]), [['bottom', 'icons']]);
assert.deepEqual(readBars(null, BASE), []);
assert.deepEqual(readBars({ nothing: true }, BASE), []);

// states: the person's choice wins; nonsense is ignored
assert.deepEqual(barStates(bars, {}), { top: 'open', left: 'closed' });
assert.deepEqual(barStates(bars, { left: 'icons', top: 'closed' }), { top: 'closed', left: 'icons' });
assert.deepEqual(barStates(bars, { left: 'wide' as never }), { top: 'open', left: 'closed' });

console.log('cleakerBars: ok');
