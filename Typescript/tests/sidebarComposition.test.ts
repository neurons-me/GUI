// sidebarComposition.test.ts — proves the pure scope-composition resolver
// (no React, no `.me`) before any I/O or UI is wired to it: an item added
// at a general scope is inherited by every more specific chain, a later
// scope can override the same id, and hiding an id at one page's own scope
// suppresses it there without touching its origin definition or affecting
// a sibling chain that never hid it.
import assert from 'node:assert/strict';
import { resolveSidebarComposition, type ScopeData } from '../src/gui/Layout/Sidebars/Composition/sidebarComposition';

function link(id: string, label: string) {
  return { type: 'link' as const, props: { id, label } };
}

// --- Scenario: root -> branch__proyecto -> page__proyecto__noticias, and a
// sibling page__proyecto__equipo that never touches hiddenIds. ---
const scopes: Record<string, ScopeData> = {
  root: {
    itemIds: ['home', 'perfil'],
    items: { home: link('home', 'Inicio'), perfil: link('perfil', 'Perfil') },
  },
  branch__proyecto: {
    itemIds: ['documentos'],
    items: { documentos: link('documentos', 'Documentos') },
  },
  page__proyecto__noticias: {
    itemIds: ['encuestas'],
    items: { encuestas: link('encuestas', 'Encuestas') },
    hiddenIds: ['perfil'],
  },
  page__proyecto__equipo: {
    itemIds: [],
    items: {},
  },
};

const noticiasChain = ['root', 'branch__proyecto', 'page__proyecto__noticias'];
const equipoChain = ['root', 'branch__proyecto', 'page__proyecto__equipo'];
const proyectoChain = ['root', 'branch__proyecto'];

// 1. Inheritance: the branch page sees root + branch items.
{
  const resolved = resolveSidebarComposition(proyectoChain, scopes);
  const ids = resolved.map((r) => r.element.props.id).sort();
  assert.deepEqual(ids, ['documentos', 'home', 'perfil']);
}

// 2. Page-level add: noticias sees root + branch + its own addition, MINUS
// the id it hid.
{
  const resolved = resolveSidebarComposition(noticiasChain, scopes);
  const ids = resolved.map((r) => r.element.props.id).sort();
  assert.deepEqual(ids, ['documentos', 'encuestas', 'home']);
  assert.ok(!ids.includes('perfil'), 'perfil must be hidden on noticias');
}

// 3. Hiding is page-scoped: a sibling page under the SAME branch, which
// never wrote to hiddenIds, still resolves perfil normally.
{
  const resolved = resolveSidebarComposition(equipoChain, scopes);
  const ids = resolved.map((r) => r.element.props.id).sort();
  assert.deepEqual(ids, ['documentos', 'home', 'perfil']);
}

// 4. Hiding never deletes the origin: root's own scope data is untouched.
{
  assert.deepEqual(scopes.root.itemIds, ['home', 'perfil']);
  assert.ok(scopes.root.items.perfil, 'root still defines perfil');
}

// 5. Origin tracking: perfil (visible on proyecto/equipo) traces back to
// root, not to the branch or page.
{
  const resolved = resolveSidebarComposition(proyectoChain, scopes);
  const perfil = resolved.find((r) => r.element.props.id === 'perfil');
  assert.ok(perfil);
  assert.equal(perfil!.originScope, 'root');
  assert.equal(perfil!.originPath, 'layout.sidebar.scopes.root.items.perfil');
}

// 6. Override: a later scope re-adding the SAME id wins, and its origin
// becomes that later scope.
{
  const overridden: Record<string, ScopeData> = {
    root: { itemIds: ['home'], items: { home: link('home', 'Inicio') } },
    page__custom: { itemIds: ['home'], items: { home: link('home', 'Inicio (custom)') } },
  };
  const resolved = resolveSidebarComposition(['root', 'page__custom'], overridden);
  assert.equal(resolved.length, 1);
  assert.equal(resolved[0].element.props.label, 'Inicio (custom)');
  assert.equal(resolved[0].originScope, 'page__custom');
}

console.log('sidebarComposition.test.ts: all assertions passed');
