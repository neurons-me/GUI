import assert from 'node:assert/strict';
import * as React from 'react';
import { renderToString } from 'react-dom/server';
import TopBarLink from '../src/gui/Layout/Sidebars/TopBar/components/TopBarLink/TopBarLink';

// TopBar renders its link items itself (not as spec nodes), so a page names a
// link for the Semantic Inspector / Layout Grid by giving the item a
// data-gui-node-id; without one the markup is unchanged.
const h = React.createElement;
const tagged = renderToString(h(TopBarLink, { label: 'Docs', href: 'https://example.com/docs', 'data-gui-node-id': 'GUI.bars.top.link.docs' } as any));
assert.match(tagged, /<a[^>]*data-gui-node-id="GUI.bars.top.link.docs"[^>]*>|<a[^>]*href="https:\/\/example.com\/docs"[^>]*data-gui-node-id="GUI.bars.top.link.docs"/);
const plain = renderToString(h(TopBarLink, { label: 'Docs', href: 'https://example.com/docs' }));
assert.ok(!plain.includes('data-gui-node-id'), 'no id -> no attribute');
console.log('topBarLinkNodeId.test.ts: all assertions passed');
