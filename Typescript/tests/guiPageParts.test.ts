// The GUI pages are declarative: what a page shows is the parts its document node declares (guiDocumentPartSpecs),
// in that order, with their props. Changing the tree changes the page; nothing else is drawn.
import assert from 'node:assert/strict';
import * as React from 'react';
import { GUI_DOCUMENT, guiDocumentPartSpecs, renderGuiDocumentPage, type GuiDocument } from '../src/runtime/guiDocument';

const HOME = 'GUI.window.layout.content.gui';
const THEMES = `${HOME}.themes`;
const LAYOUT = `${HOME}.layout`;
const clone = (d: GuiDocument): GuiDocument => JSON.parse(JSON.stringify(d));
const node = (d: GuiDocument, id: string) => id.split('.').slice(1).reduce((n: any, k) => n.children[k], d.GUI as any);
const types = (specs: any[]) => specs.map((s) => s.type);
const ids = (specs: any[]) => specs.map((s) => s.props['data-gui-node-id']);

// /GUI: heading, the Theme row (the active theme, its mode), the Layout row (a link)
const home = guiDocumentPartSpecs(HOME);
assert.deepEqual(types(home), ['GuiHeading', 'GuiRow', 'GuiRow']);
assert.deepEqual(ids(home), [`${HOME}.heading`, `${HOME}.theme`, `${HOME}.tree`]);
assert.deepEqual(home[0].props, { title: '.GUI', titleStyle: 'brand', version: true, 'data-gui-node-id': `${HOME}.heading` });
assert.deepEqual(types(home[1].children), ['ActiveTheme', 'ThemeMode'], 'the Theme row draws the active theme and its mode');
assert.equal(home[1].props.label, 'Theme');
assert.deepEqual(types(home[2].children), ['RouteLink']);
assert.equal(home[2].children[0].props.to, '/GUI/layout');
// a part with no component is a name for something its parent draws: not drawn as a part
assert.equal(home[0].children, undefined, "the heading's title/version are names, drawn by the heading itself");
// the pages under /GUI are routes of their own, not its content
assert.ok(!ids(home).includes(THEMES) && !ids(home).includes(LAYOUT));

// /GUI/themes and /GUI/themes/typography: the same parts
const themes = guiDocumentPartSpecs(THEMES);
assert.deepEqual(types(themes), ['GuiHeading', 'ThemeInspectorPanel']);
assert.deepEqual(types(themes[0].children), ['ThemeMode']);
assert.deepEqual(themes[1].props.routes, { palette: '/GUI/themes', typography: '/GUI/themes/typography' });
assert.equal(node(GUI_DOCUMENT, `${THEMES}.typography`).props.partsOf, THEMES);

// /GUI/layout: heading with its subtitle, the tree
const layout = guiDocumentPartSpecs(LAYOUT);
assert.deepEqual(types(layout), ['GuiHeading', 'DocumentTree']);
assert.match(String(layout[0].props.subtitle), /\{parts\} parts declared/);

// ── the tree decides ────────────────────────────────────────────────────────────────────────────────────────────────
{
  // remove a part: it is not drawn
  const d = clone(GUI_DOCUMENT);
  delete node(d, `${HOME}.theme`).children.mode;
  assert.deepEqual(types(guiDocumentPartSpecs(HOME, d)[1].children), ['ActiveTheme'], 'mode removed from the tree, gone from the page');
}
{
  // change a prop: the part is given it
  const d = clone(GUI_DOCUMENT);
  node(d, `${HOME}.tree.link`).props.text = 'the whole tree';
  assert.equal(guiDocumentPartSpecs(HOME, d)[2].children[0].props.text, 'the whole tree');
}
{
  // reorder: the page follows the order declared
  const d = clone(GUI_DOCUMENT);
  const kids = node(d, HOME).children;
  const { theme, tree, ...rest } = kids;
  node(d, HOME).children = { ...rest, tree, theme };
  assert.deepEqual(ids(guiDocumentPartSpecs(HOME, d)).slice(1), [`${HOME}.tree`, `${HOME}.theme`]);
}
{
  // add a part: it is drawn
  const d = clone(GUI_DOCUMENT);
  node(d, HOME).children.note = { label: 'Note', component: 'RouteLink', props: { to: '/users', text: 'users' } };
  assert.deepEqual(types(guiDocumentPartSpecs(HOME, d)), ['GuiHeading', 'GuiRow', 'GuiRow', 'RouteLink']);
}
assert.deepEqual(guiDocumentPartSpecs('GUI.nothing.here'), []);

// a page node's own props reach its component: /GUI/themes/typography draws the parts of /GUI/themes
{
  const seen: any[] = [];
  const GuiPage = (props: any) => { seen.push(props); return null; };
  const el = renderGuiDocumentPage(`${THEMES}.typography`, { React, registry: { GuiPage } });
  assert.ok(el, 'rendered');
  const props = (el as any).props;
  assert.equal(props.partsOf, THEMES);
  assert.equal(props['data-gui-node-id'], `${THEMES}.typography`);
}

console.log('guiPageParts: ok');
