// Live audit of the Inspector's tree, to paste into the browser console of a
// running GUI page (the dev server) with the Inspector mounted.
//
// It checks, for whatever the current page has rendered, that:
//   UP    every node climbs to the single root `GUI` (no cycles, no strays);
//   DOWN  every node is reached going down from the root, and appears in its
//         parent's children;
//   ORPHANS none: a node that had to be hung from the root because nothing
//         said where it belongs is reported (the tree still reaches it);
//   JSON  selecting a node shows a spec (raw.spec.json) with a "type", the
//         focused row is in the tree, and the breadcrumb is root -> node.
//
// Run:  1) turn the Inspector on   2) paste this file   3) await window.auditInspectorTree()
// Repeat per route / mode (landing, register, recover, users, blockchain ...).
// (The pure part -- linkTree / around -- is also covered by
//  tests/inspectorNav.test.ts, which runs in `npm run test:runtime`.)
window.auditInspectorTree = async function auditInspectorTree(modulePath, sampleSize = 25) {
  const S = window['GUI-NODES-STORE'];
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  // e.g. '/@fs/<repo>/packages/GUI/Typescript/src/runtime/inspector.tsx' (Vite dev)
  const mod = await import(modulePath ?? '/src/runtime/inspector.tsx');
  const model = mod.buildTreeModel();
  const problems = [];
  const roots = new Set();
  for (const id of model.ids) {
    let cursor = id;
    const seen = new Set();
    while (cursor) {
      if (seen.has(cursor)) { problems.push({ id, kind: 'cycle' }); break; }
      seen.add(cursor);
      const parent = model.parentOf(cursor);
      if (parent && !model.childrenOf(parent).includes(cursor)) problems.push({ id: cursor, kind: 'not-in-parent-children' });
      if (!parent) roots.add(cursor);
      cursor = parent;
    }
  }
  const reached = new Set();
  const walk = (id) => { if (reached.has(id)) return; reached.add(id); model.childrenOf(id).forEach(walk); };
  roots.forEach(walk);
  model.ids.forEach((id) => { if (!reached.has(id)) problems.push({ id, kind: 'unreachable-from-root' }); });
  if (roots.size !== 1 || !roots.has('GUI')) problems.push({ id: [...roots].join(','), kind: 'roots-not-just-GUI' });
  model.orphans.forEach((id) => problems.push({ id, kind: 'orphan' }));

  // UI: select a sample of nodes and read what the panel shows. (The panel
  // only exists while something is selected, so select the root first.)
  S.actions.selectNode('GUI');
  await wait(500);
  const panel = document.querySelector('[role=separator]')?.parentElement;
  if (!panel) return { nodes: model.ids.length, problems: [...problems, { id: '-', kind: 'inspector-panel-not-open' }] };
  const step = Math.max(1, Math.floor(model.ids.length / sampleSize));
  const sample = model.ids.filter((_, i) => i % step === 0).slice(0, sampleSize);
  for (const id of sample) {
    S.actions.selectNode(id);
    await wait(140);
    const chain = [];
    for (let c = id; c; c = model.parentOf(c)) chain.unshift(c);
    if (panel.querySelectorAll('.gui-crumb').length !== chain.length - 1) problems.push({ id, kind: 'breadcrumb' });
    if (!panel.querySelector('[data-tree-focus="true"]')) problems.push({ id, kind: 'focused-row-missing' });
    const text = panel.innerText;
    const at = text.indexOf('raw.spec.json');
    if (!/"type"/.test(at >= 0 ? text.slice(at, at + 400) : '')) problems.push({ id, kind: 'no-json' });
  }
  return { nodes: model.ids.length, tested: sample.length, roots: [...roots], problems };
};
