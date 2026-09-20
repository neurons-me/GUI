import assert from 'node:assert/strict';
import { buildLeftSidebarElementMeta, leftBarSlug } from '../src/gui/Layout/Sidebars/LeftBar/leftBarIds';

assert.equal(leftBarSlug('Theme'), 'theme');
assert.equal(leftBarSlug('Dev Tools'), 'devtools');
assert.equal(leftBarSlug(undefined), '');

const bar = 'GUI.bars.left';
const meta = (el: any, section: 'elements' | 'footerElements', idx: number) =>
  buildLeftSidebarElementMeta(el, bar, section, idx).nodeId;

// Links and menus are numbered.
assert.equal(meta({ type: 'link', props: { label: 'Home' } }, 'elements', 0), 'GUI.bars.left.link.0');
assert.equal(meta({ type: 'menu', props: {} }, 'elements', 2), 'GUI.bars.left.menu.2');

// A labelled footer action is named by its label, wherever it sits.
assert.equal(meta({ type: 'action', props: { label: 'Theme' } }, 'footerElements', 0), 'GUI.bars.left.footer.theme');
assert.equal(meta({ type: 'action', props: { label: 'Dev Tools' } }, 'footerElements', 1), 'GUI.bars.left.footer.devtools');
assert.equal(meta({ type: 'action', props: { label: 'Dev Tools' } }, 'footerElements', 5), 'GUI.bars.left.footer.devtools');

// Without a label it falls back to its position; an explicit id wins.
assert.equal(meta({ type: 'action', props: {} }, 'footerElements', 3), 'GUI.bars.left.footer.action.3');
assert.equal(meta({ type: 'action', props: { label: 'Theme', 'data-gui-node-id': 'GUI.bars.left.footer.colors' } }, 'footerElements', 0), 'GUI.bars.left.footer.colors');

// The rest of the id is the bar's own.
assert.equal(buildLeftSidebarElementMeta({ type: 'action', props: { label: 'Me' } }, 'GUI.bars.right', 'footerElements', 0).nodeId, 'GUI.bars.right.footer.me');

console.log('leftBarIds.test.ts: all assertions passed');
