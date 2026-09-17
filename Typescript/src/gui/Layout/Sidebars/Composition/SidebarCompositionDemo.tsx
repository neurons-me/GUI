import * as React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { Box, TextField, Button } from '@mui/material';
import Typography from '@/gui/Atoms/Typography/Typography';
import Layout from '@/gui/Layout/Layout';
import { useOptionalSeedSessionContext } from '@/react/session/SeedSessionProvider';
import type { SeedSession } from '@/core/session/createSeedSession';
import { useSidebarComposition, type UseSidebarCompositionResult } from './useSidebarComposition';
import { addItemToScope, hideItemAtScope, readScope } from './sidebarCompositionIO';
import type { ResolvedSidebarItem, ScopeId } from './sidebarComposition';

function link(id: string, label: string) {
  return { type: 'link' as const, props: { id, label } };
}

function slugify(label: string): string {
  return label.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || `item-${Date.now()}`;
}

// Explicit test-data setup, never run implicitly. Navigation must never
// write -- an empty scope is a legitimate state to land on, not something
// to silently populate. Idempotent (checks each scope before writing) so
// clicking it twice is harmless, but it is ONLY ever invoked by a direct
// click on the button below, never by a route/mount effect.
async function seedTestData(session: SeedSession): Promise<void> {
  const root = await readScope(session, 'root');
  if (root.itemIds.length === 0) {
    await addItemToScope(session, 'root', link('home', 'Inicio'));
    await addItemToScope(session, 'root', link('perfil', 'Perfil'));
  }
  const branch = await readScope(session, 'branch__proyecto');
  if (branch.itemIds.length === 0) {
    await addItemToScope(session, 'branch__proyecto', link('documentos', 'Documentos'));
  }
  const page = await readScope(session, 'page__proyecto__noticias');
  if (page.itemIds.length === 0) {
    await addItemToScope(session, 'page__proyecto__noticias', link('encuestas', 'Encuestas'));
  }
}

type PageContentProps = {
  title: string;
  ownScopeId: ScopeId;
  siblingLink: { to: string; label: string };
  session: SeedSession;
  composition: UseSidebarCompositionResult;
};

// Pure content -- no Layout of its own. Navigating between pages swaps
// only this; the Layout/LeftBar instance around it (see
// SidebarCompositionShell below) never remounts.
function SidebarCompositionPageContent({ title, ownScopeId, siblingLink, session, composition }: PageContentProps) {
  const { resolved, loading, error, refetch } = composition;
  const [newLabel, setNewLabel] = React.useState('');
  const [busy, setBusy] = React.useState(false);

  // "Add" and "hide" are the only two declarative operations this demo
  // exposes -- both a scoped write followed by a re-read, never arbitrary
  // code. Neither runs on mount/navigation; both require a direct click.
  const handleAddAtRoot = async () => {
    if (!session.signAndWrite || !newLabel.trim()) return;
    setBusy(true);
    try {
      await addItemToScope(session, 'root', link(slugify(newLabel), newLabel.trim()));
      setNewLabel('');
      refetch();
    } finally {
      setBusy(false);
    }
  };

  const handleHideHere = async (itemId: string) => {
    if (!session.signAndWrite) return;
    setBusy(true);
    try {
      await hideItemAtScope(session, ownScopeId, itemId);
      refetch();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 480 }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>{title}</Typography>
      <Box sx={{ mt: 1 }}>
        <Typography component={Link} to={siblingLink.to} variant="body2" sx={{ color: 'primary.main' }}>
          {siblingLink.label}
        </Typography>
      </Box>
      <Box sx={{ mt: 2 }}>
        {loading && <Typography variant="body2">Loading…</Typography>}
        {error && <Typography variant="body2" sx={{ color: 'error.main' }}>{error.message}</Typography>}
      </Box>
      <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
        <TextField
          size="small"
          label="New root item label"
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
        />
        <Button variant="outlined" disabled={busy || !newLabel.trim()} onClick={handleAddAtRoot}>
          Agregar en raíz
        </Button>
      </Box>
      <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
        {resolved.map((r: ResolvedSidebarItem) => (
          <Box key={r.element.props.id} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" sx={{ minWidth: 220 }}>
              {r.element.props.label} — origen: {r.originScope}
            </Typography>
            <Button size="small" variant="text" disabled={busy} onClick={() => handleHideHere(r.element.props.id)}>
              Ocultar aquí
            </Button>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

/**
 * Minimal proof that a shared `.me`-backed scope chain can compose a real
 * `Layout`/`LeftBar` sidebar across pages, with navigation kept strictly
 * read-only:
 *
 *   - Layout mounts ONCE for both routes (nested <Routes> inside it, not a
 *     separate <Layout> per page) -- moving between /proyecto and
 *     /proyecto/noticias never remounts LeftBarProvider/RightBarProvider,
 *     so the sidebar's own view state (rail/expanded) and the Layout
 *     instance itself have real continuity, not just matching data.
 *   - Navigating only ever calls useSidebarComposition's readScope calls
 *     (GETs) -- there is no write anywhere in this file except inside the
 *     two explicit button handlers above and the seed button below.
 *   - Hiding an item writes ONLY to the current page's own scope; a
 *     sibling page's scope chain never includes it, so returning there
 *     shows the item again with no inverse "unhide" write -- the
 *     composition is a pure function of context, not of write history.
 */
export function SidebarCompositionShell() {
  const ctx = useOptionalSeedSessionContext();
  const session = ctx?.session ?? null;
  const location = useLocation();
  const isNoticias = location.pathname.endsWith('/noticias');
  const scopeChain: ScopeId[] = isNoticias
    ? ['root', 'branch__proyecto', 'page__proyecto__noticias']
    : ['root', 'branch__proyecto'];
  const composition = useSidebarComposition(session, scopeChain);
  const [seeding, setSeeding] = React.useState(false);

  const handleSeed = async () => {
    if (!session?.signAndWrite) return;
    setSeeding(true);
    try {
      await seedTestData(session);
      composition.refetch();
    } finally {
      setSeeding(false);
    }
  };

  if (!session) {
    return (
      <Typography variant="body2" sx={{ p: 3, opacity: 0.7 }}>
        Sign in to a namespace to try the sidebar composition demo.
      </Typography>
    );
  }

  return (
    <Layout LeftBar={{ elements: composition.resolved.map((r) => r.element) }}>
      <Box sx={{ px: 3, pt: 3 }}>
        <Button size="small" variant="text" disabled={seeding} onClick={handleSeed}>
          Preparar datos de prueba
        </Button>
      </Box>
      <Routes>
        <Route
          path="proyecto"
          element={
            <SidebarCompositionPageContent
              title="/proyecto"
              ownScopeId="branch__proyecto"
              siblingLink={{ to: '/layout-demo/proyecto/noticias', label: 'Ir a /proyecto/noticias →' }}
              session={session}
              composition={composition}
            />
          }
        />
        <Route
          path="proyecto/noticias"
          element={
            <SidebarCompositionPageContent
              title="/proyecto/noticias"
              ownScopeId="page__proyecto__noticias"
              siblingLink={{ to: '/layout-demo/proyecto', label: '← Ir a /proyecto' }}
              session={session}
              composition={composition}
            />
          }
        />
      </Routes>
    </Layout>
  );
}
