// catalog.main.tsx — REAL browser verification for Phase 2: the
// component-catalog view's composition lives in `.me` as data (a real
// signed commit write, read back over real NRP HTTP), and GUI's shared
// runtime (renderNode + GuiRegistry) interprets it — never a compiled-in
// function. See dev-harness/gui-catalog-harness-server.mts for the real
// disposable monad this points at.
//
// Deliberately imports ONLY through `all.this/browser` — the public
// facade, never GUI's own internal `@/...` aliases or `@mui/*` directly.
// The whole point of this pilot is proving an app OUTSIDE GUI's own
// package can compose a screen using nothing but GUI's public contract
// (component types + typed props the resolvers themselves declare, e.g.
// Box's `sx`/Typography's `variant` — both are part of GUI's own typed
// resolver props, not an accidental MUI leak). If GUI's implementation
// swaps away from MUI later, this file should not need to change:
//   spec in .me -> GUI's public types/props -> GuiRegistry resolvers
//   -> internal implementation -> DOM
//
// Never a mock: "Save" below performs a REAL Ed25519-signed commit write
// to the monad; reloading re-fetches the spec fresh from `.me` over NRP.
import * as React from 'react';
import { createRoot } from 'react-dom/client';
import * as guiFacade from '../../../../browser.ts';

const { gui, guiRuntime, me } = guiFacade;
const { Theme, Box, Typography } = gui;
const { renderNode, GuiRegistry } = guiRuntime;
const { deriveBranchProofSeed, importEd25519SigningKey, signEd25519Proof } = me;
type GuiSpecNode = ReturnType<typeof renderNode> extends never ? never : Parameters<typeof renderNode>[0];

const params = new URLSearchParams(window.location.search);
const endpoint = params.get('endpoint') || 'http://127.0.0.1:8162';
const namespace = params.get('namespace') || 'guicatalog.gui-catalog-harness.local';
const SECRET = 'gui-catalog-harness-secret';
const USERNAME = 'guicatalog';
const SPEC_PATH = 'apps.gui.views.library';

function toStableJson(value: any): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(toStableJson).join(',')}]`;
  const keys = Object.keys(value).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${toStableJson(value[k])}`).join(',')}}`;
}

async function signer() {
  const branchSeed = await deriveBranchProofSeed(SECRET, USERNAME);
  const { privateKey } = await importEd25519SigningKey(branchSeed);
  return (message: string) => signEd25519Proof(privateKey, message);
}

async function fetchSpec(): Promise<GuiSpecNode | null> {
  const res = await fetch(`${endpoint}/${SPEC_PATH}`, {
    headers: { 'x-forwarded-host': namespace },
    cache: 'no-store',
  });
  if (!res.ok) return null;
  const body = await res.json();
  if (body.disclosure && body.disclosure !== 'public') return null;
  return body.target?.value ?? null;
}

async function commitSpec(spec: GuiSpecNode): Promise<void> {
  const sign = await signer();
  const events = [{ namespace, path: SPEC_PATH, data: spec }];
  const signedFields = { events, identityHash: USERNAME, namespace };
  const canonicalBody = toStableJson(signedFields);
  const signature = await sign(canonicalBody);
  const res = await fetch(`${endpoint}/api/v1/commit`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ...signedFields, signature, signedPayload: canonicalBody }),
  });
  if (!res.ok) throw new Error(`commit failed: ${res.status} ${await res.text()}`);
}

function extractSubtitle(spec: GuiSpecNode): string {
  const children = (spec as any)?.children;
  const second = Array.isArray(children) ? children[1] : null;
  return second?.props?.children ?? '';
}

function withSubtitle(spec: GuiSpecNode, subtitle: string): GuiSpecNode {
  const children = (spec as any).children as any[];
  const next = [...children];
  next[1] = { ...next[1], props: { ...next[1].props, children: subtitle } };
  return { ...(spec as any), children: next };
}

// Containment boundary for previews. Two real, distinct things this has
// to survive, neither of which is a GUI bug:
// - Section legitimately fills its nearest viewport (`calc(100vw -
//   insets)`) — that's its real, intentional job as a top-level layout
//   primitive, not something to be embedded at a fixed small size.
// - CleakerComposer/Cleaker are full app-shell composites with their own
//   `position: fixed` sidebars (real Cleaker UI, toggle buttons and all)
//   — by design meant to be mounted at the top of a page, not nested.
//   Plain `overflow: hidden` does NOT contain `position: fixed`
//   descendants (fixed is positioned against the viewport, not the
//   nearest scrolling ancestor) — `contain: 'layout'` on the wrapper is
//   what actually makes it the containing block for them too (a
//   standard CSS technique, confirmed here: without it CleakerComposer's
//   sidebars rendered as real fixed panels overlaying the ENTIRE page,
//   not just its own small card).
// A catalog previewing arbitrary registered components has to assume
// ANY of them might do either of these — this is the catalog's own
// defensive boundary, not a fix that belongs inside GUI.
const previewContainerSx = { mt: 1, overflow: 'hidden', maxWidth: '100%', contain: 'layout' } as const;

function App() {
  const [spec, setSpec] = React.useState<GuiSpecNode | null>(null);
  const [draft, setDraft] = React.useState('');
  const [status, setStatus] = React.useState('loading…');

  const load = React.useCallback(async () => {
    setStatus('loading…');
    const fetched = await fetchSpec();
    if (!fetched) { setStatus('no spec found at ' + SPEC_PATH); return; }
    setSpec(fetched);
    setDraft(extractSubtitle(fetched));
    setStatus('loaded from .me over real NRP HTTP');
  }, []);

  React.useEffect(() => { load(); }, [load]);

  async function handleSave() {
    if (!spec) return;
    setStatus('saving (real signed commit write)…');
    const next = withSubtitle(spec, draft);
    await commitSpec(next);
    setStatus('saved — reload the page to prove it was not just local React state');
    setSpec(next);
  }

  const kinds = React.useMemo(() => {
    const groups: Record<string, (typeof GuiRegistry)[string][]> = {};
    for (const entry of Object.values(GuiRegistry)) {
      const kind = entry.meta?.kind || 'other';
      (groups[kind] ??= []).push(entry);
    }
    return groups;
  }, []);

  return (
    <Box sx={{ maxWidth: 960, mx: 'auto', p: 3, display: 'flex', flexDirection: 'column', gap: 3, overflowX: 'hidden' }}>
      <Box sx={{ p: 2, border: '1px dashed', borderColor: 'divider', borderRadius: 2 }}>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>{status}</Typography>
      </Box>

      <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <Typography variant="overline" sx={{ color: 'text.secondary' }}>
          This block below is rendered from the spec stored in `.me` at {SPEC_PATH} — not from JSX.
        </Typography>
        <Box sx={previewContainerSx}>
          {spec ? renderNode(spec, { registry: GuiRegistry, React, showUnknown: true }) : null}
        </Box>
      </Box>

      <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Typography variant="subtitle2">Edit the persisted subtitle</Typography>
        <Box
          component="input"
          value={draft}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDraft(e.target.value)}
          sx={{ px: 1, py: 0.75, borderRadius: 1, border: '1px solid', borderColor: 'divider' }}
        />
        <Box
          component="button"
          type="button"
          onClick={handleSave}
          sx={{ alignSelf: 'flex-start', px: 1.5, py: 0.75, borderRadius: 1, border: 'none', bgcolor: 'primary.main', color: 'primary.contrastText', cursor: 'pointer' }}
        >
          Save (real signed commit write)
        </Box>
      </Box>

      <Box>
        <Typography variant="h6">Component Library ({Object.keys(GuiRegistry).length} registered)</Typography>
        {Object.entries(kinds).map(([kind, entries]) => (
          <Box key={kind} sx={{ mt: 2 }}>
            <Typography variant="subtitle2" sx={{ color: 'text.secondary', textTransform: 'uppercase' }}>{kind}</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 1 }}>
              {entries.map((entry) => (
                <Box key={entry.type} sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 2, minWidth: 160, maxWidth: 260, overflow: 'hidden', contain: 'layout' }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>{entry.meta?.label || entry.type}</Typography>
                  <Box sx={previewContainerSx}>
                    {entry.meta?.demoSpec
                      ? renderNode(entry.meta.demoSpec, { registry: GuiRegistry, React, showUnknown: true })
                      : (
                        <Typography variant="caption" sx={{ color: 'text.disabled', fontStyle: 'italic' }}>
                          no example yet
                        </Typography>
                      )}
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

createRoot(document.getElementById('root')!).render(<Theme><App /></Theme>);
