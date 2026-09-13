// demo/shared/pageBuilder.tsx — the page-as-spec-in-.me builder core,
// extracted out of pageEditor.main.tsx so a second entry point (the
// Cleaker-landing composition) can reuse the exact same rendering/editing
// logic instead of forking a second copy that would drift from this one.
//
// Ownership model (backend-enforced — see
// modules/monad/Typescript/src/claim/appAuthorization.ts, proven by
// tests/appAuthorization.test.ts): GUI is a representation of the `.me`
// graph it's mounted on, not an independent claimable resource layered on
// top of it. There is no separate "claim apps.gui" step — creating
// apps.<appId>.pages.<pageId> is just an authorized write in a tree the
// caller already controls. Whoever holds the namespace's own claim has
// full, implicit authority over apps.<appId>.* from that point on; that
// owner can additionally grant other real identities a scoped
// `pages:write` grant — checked server-side on every write, never just
// hidden client-side. Since there's no server-stored "app owner" field,
// the UI asks a small dedicated read (GET /api/v1/namespace-owner)
// whether the signed-in identity is the namespace's claimed owner, to
// decide whether to show edit tools ahead of a write attempt.
//
// Real Cleaker identity (SeedSessionProvider, sessionBackend:'cleaker')
// only — never a hardcoded signer. Disposable infra only — never the
// user's real account or the real gateway.
import * as React from 'react';
import * as guiFacade from '../../../../../browser.ts';

const { gui, guiRuntime, guiDevtools, me } = guiFacade;
const { Box, Typography, useSeedSession } = gui;
const { renderNode, GuiRegistry } = guiRuntime;
const { selectionStore } = guiDevtools;
const {
  normalizeProofMessage,
  deriveBranchProofSeed,
  importEd25519SigningKey,
  signEd25519Proof,
  exportEd25519PublicKey,
} = me;

export type GuiSpecNode = Parameters<typeof renderNode>[0];
export type Session = ReturnType<typeof useSeedSession>['session'];

export const INSERTABLE_TYPES = ['Typography', 'Button', 'Box'] as const;

export function pagePath(appId: string, pageId: string) {
  return `apps.${appId}.pages.${pageId}`;
}
export function adminsPath(appId: string) {
  return `apps.${appId}.admins`;
}
export function grantsPath(appId: string) {
  return `apps.${appId}.grants`;
}

export async function nrpRead(
  endpoint: string,
  rootNamespace: string,
  path: string,
): Promise<{ found: boolean; value: unknown }> {
  const res = await fetch(`${endpoint}/${path}`, { headers: { 'x-forwarded-host': rootNamespace }, cache: 'no-store' });
  if (res.status === 404) return { found: false, value: undefined };
  const body = await res.json().catch(() => null);
  if (!body || (body.disclosure && body.disclosure !== 'public')) return { found: false, value: undefined };
  if (body.target?.value === undefined) return { found: false, value: undefined };
  return { found: true, value: body.target.value };
}

// There is no apps.<appId>.owner anymore (see appAuthorization.ts) -- the
// namespace's own claim IS the app's authority. This asks the server's
// small dedicated read whether `identityHash` already holds that claim, so
// the UI can decide to show edit tools BEFORE a write is attempted, rather
// than only reacting to a 403 after the fact. Reveals nothing sensitive:
// identityHash is already a public fingerprint, and the endpoint returns
// only two booleans, never the claim record itself.
export async function checkNamespaceOwner(
  endpoint: string,
  namespace: string,
  identityHash: string,
): Promise<{ claimed: boolean; isOwner: boolean }> {
  const res = await fetch(`${endpoint}/api/v1/namespace-owner?namespace=${encodeURIComponent(namespace)}&identityHash=${encodeURIComponent(identityHash)}`, { cache: 'no-store' });
  const json = await res.json().catch(() => null);
  return { claimed: Boolean(json?.claimed), isOwner: Boolean(json?.isOwner) };
}

export async function commit(
  endpoint: string,
  session: NonNullable<Session>,
  events: Array<{ namespace: string; path: string; data: unknown }>,
): Promise<{ ok: boolean; status: number; error?: string; detail?: string }> {
  const identityHash = (session as any).identityHash as string;
  const callerNamespace = (session as any).semanticNamespace as string;
  const signPayload = (session as any).signPayload as (m: string) => Promise<string>;
  const signedFields = { events, identityHash, namespace: callerNamespace };
  const signature = await signPayload(normalizeProofMessage(signedFields));
  const res = await fetch(`${endpoint}/api/v1/commit`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ...signedFields, signature }),
  });
  const json = await res.json().catch(() => null);
  return { ok: res.ok && json?.ok, status: res.status, error: json?.error, detail: json?.detail };
}

// Claims a BARE (unprefixed) namespace under the caller's own already-proven
// identityHash. session.claim() can't do this: cleaker's me.prove() always
// composes `${activeExpression}.${rootNamespace}` (see me.ts's prove()) --
// there is no way to make it sign a proof for a namespace with no prefix.
// A namespace claim's secret/signing key are namespace-scoped by
// construction (see modules/monad's records.ts, same claimNamespace()
// primitive the bare-root claim in appAuthorization.test.ts's
// claimNamespaceAs helper exercises) -- deliberately independent of the
// caller's login password. The server only requires a valid Ed25519
// signature over the canonical proof message and payload.namespace === the
// namespace being claimed; it never re-derives identityHash from the
// signing key (resolveClaimIdentity echoes payload.identityHash verbatim
// once the signature checks out). So this signs with a FRESH
// namespace-scoped key but asserts the SAME identityHash the caller
// already proved at sign-in -- the same real person now owns both their
// own `<handle>.<root>` identity and this bare root, which is what lets
// appAuthorization.ts's bootstrap check
// (namespaceClaim.identityHash === callerIdentityHash) pass.
export async function claimBareNamespace(endpoint: string, identityHash: string, namespace: string, secret: string) {
  const branchSeed = await deriveBranchProofSeed(secret, namespace);
  const { privateKey, publicKey } = await importEd25519SigningKey(branchSeed);
  const publicKeyRaw = await exportEd25519PublicKey(publicKey);
  const timestamp = Date.now();
  const proofPayload = { identityHash, expression: identityHash, namespace, rootNamespace: namespace, challenge: null, timestamp };
  const proofMessage = normalizeProofMessage(proofPayload);
  const proofSignature = await signEd25519Proof(privateKey, proofMessage);
  const res = await fetch(`${endpoint}/`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      operation: 'claim',
      namespace,
      secret,
      identityHash,
      proof: { message: proofMessage, signature: proofSignature, publicKey: publicKeyRaw, timestamp },
    }),
  });
  const json = await res.json().catch(() => null);
  return { ok: res.status === 201 && json?.ok !== false, status: res.status, error: json?.error };
}

export const EMPTY_PAGE_SPEC: GuiSpecNode = {
  type: 'Box',
  props: { sx: { display: 'flex', flexDirection: 'column', gap: 2, minHeight: 240 } },
  children: [],
};

export function insertNode(page: GuiSpecNode, newChild: GuiSpecNode): GuiSpecNode {
  const children = Array.isArray((page as any).children) ? (page as any).children : [];
  return { ...(page as any), children: [...children, newChild] };
}

export function removeNodeAt(page: GuiSpecNode, index: number): GuiSpecNode {
  const children = Array.isArray((page as any).children) ? (page as any).children : [];
  return { ...(page as any), children: children.filter((_: unknown, i: number) => i !== index) };
}

// The catalog's own demoSpec text ("Typography", "Button"...) is a
// placeholder FOR THE CATALOG's own preview cards, not a template for real
// content -- the editor should hand the user something obviously meant to
// be replaced, and let them replace it. Only applied to types that actually
// carry a text `children` prop (Box has none, so it's left as the catalog
// gives it).
export const EDITABLE_PLACEHOLDER_TEXT = 'Escribe aquí';

export function withEditablePlaceholder(spec: GuiSpecNode): GuiSpecNode {
  const props = (spec as any).props;
  if (!props || typeof props.children !== 'string') return spec;
  return { ...(spec as any), props: { ...props, children: EDITABLE_PLACEHOLDER_TEXT } };
}

// Sets (or, for undefined/'', removes) a single prop on the node at
// `index`. Deleting rather than storing '' matters here: several resolvers
// gate behavior on truthiness (Button.resolver.tsx: `p.href || isExternal`)
// -- leaving a cleared field as '' would silently keep stale routing logic
// active instead of actually clearing it.
export function updateNodePropAt(page: GuiSpecNode, index: number, key: string, value: unknown): GuiSpecNode {
  const children = Array.isArray((page as any).children) ? (page as any).children : [];
  const target = children[index];
  if (!target) return page;
  const nextProps: Record<string, unknown> = { ...(target as any).props };
  if (value === undefined || value === '') {
    delete nextProps[key];
  } else {
    nextProps[key] = value;
  }
  const nextChild = { ...(target as any), props: nextProps };
  const nextChildren = children.slice();
  nextChildren[index] = nextChild;
  return { ...(page as any), children: nextChildren };
}

// Same idea, one level into `props.sx` -- where spacing (padding, gap)
// actually lives for a Box per Box.resolver.tsx's own doc comment
// ("Allow system props / arbitrary passthrough (gap, p, m, display, etc.)").
export function updateNodeSxAt(page: GuiSpecNode, index: number, key: string, value: unknown): GuiSpecNode {
  const children = Array.isArray((page as any).children) ? (page as any).children : [];
  const target = children[index];
  if (!target) return page;
  const prevSx = ((target as any).props?.sx ?? {}) as Record<string, unknown>;
  const nextSx = { ...prevSx };
  if (value === undefined || value === '') {
    delete nextSx[key];
  } else {
    nextSx[key] = value;
  }
  const nextChild = { ...(target as any), props: { ...(target as any).props, sx: nextSx } };
  const nextChildren = children.slice();
  nextChildren[index] = nextChild;
  return { ...(page as any), children: nextChildren };
}

export function moveNodeAt(page: GuiSpecNode, index: number, direction: -1 | 1): GuiSpecNode {
  const children = Array.isArray((page as any).children) ? (page as any).children : [];
  const target = index + direction;
  if (target < 0 || target >= children.length) return page;
  const nextChildren = children.slice();
  [nextChildren[index], nextChildren[target]] = [nextChildren[target], nextChildren[index]];
  return { ...(page as any), children: nextChildren };
}

export type AppRecord = { admins: Record<string, true>; grants: Record<string, string[]> };

// Rendered only when the namespace itself is unclaimed. Once claimed, that
// identity has full implicit authority over apps.<appId>.* with no further
// step -- there is nothing left for this panel to do, so PageView stops
// rendering it.
export function OwnershipPanel({
  endpoint,
  rootNamespace,
  appId,
  session,
  onChanged,
}: {
  endpoint: string;
  rootNamespace: string;
  appId: string;
  session: NonNullable<Session>;
  onChanged: () => void;
}) {
  const [status, setStatus] = React.useState('');
  const [namespaceSecret, setNamespaceSecret] = React.useState('');
  const identityHash = (session as any).identityHash as string;

  async function claimNamespace() {
    if (!namespaceSecret.trim()) {
      setStatus('enter a secret for this namespace claim first');
      return;
    }
    setStatus('claiming namespace…');
    const res = await claimBareNamespace(endpoint, identityHash, rootNamespace, namespaceSecret.trim());
    setStatus(res.ok ? `namespace claimed — you can edit apps.${appId} now` : `failed: ${res.error || res.status}`);
    onChanged();
  }

  return (
    <Box sx={{ p: 2, border: '1px dashed', borderColor: 'divider', borderRadius: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Typography variant="subtitle2">Ownership</Typography>
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
        {rootNamespace} has no owner yet. Claiming it gives you full authority over apps.{appId} — no separate app claim needed.
      </Typography>
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
        <Box component="input" type="password" placeholder={`Secret for ${rootNamespace}`} value={namespaceSecret}
          onChange={(e: any) => setNamespaceSecret(e.target.value)}
          sx={{ px: 1, py: 0.5, borderRadius: 1, border: '1px solid', borderColor: 'divider', flex: 1 }} />
        <Box component="button" type="button" onClick={claimNamespace}
          sx={{ px: 1, py: 0.5, borderRadius: 1, border: '1px solid', borderColor: 'divider', cursor: 'pointer' }}>
          Claim namespace
        </Box>
      </Box>
      {status && <Typography variant="caption">{status}</Typography>}
    </Box>
  );
}

export function CatalogPanel({ onInsert }: { onInsert: (type: string) => void }) {
  return (
    <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase' }}>Insert</Typography>
      {INSERTABLE_TYPES.map((type) => (
        <Box key={type} component="button" type="button" onClick={() => onInsert(type)}
          sx={{ textAlign: 'left', px: 1.25, py: 0.75, borderRadius: 1.25, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', cursor: 'pointer', fontSize: '0.85rem' }}>
          + {type}
        </Box>
      ))}
    </Box>
  );
}

// Options mirror exactly what each resolver actually reads (Typography.
// resolver.tsx / Button.resolver.tsx) -- not a generic/guessed prop list.
const TYPOGRAPHY_VARIANTS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'subtitle1', 'subtitle2', 'body1', 'body2', 'caption', 'overline', 'button'] as const;
const BUTTON_VARIANTS = ['text', 'outlined', 'contained'] as const;
const BUTTON_COLORS = ['inherit', 'primary', 'secondary', 'success', 'info', 'warning', 'error'] as const;
// Typography's `color` isn't a fixed enum in the resolver (typed `any`,
// passed straight to MUI) -- these are MUI's own real theme-color tokens,
// not invented ones.
const TYPOGRAPHY_COLORS = ['text.primary', 'text.secondary', 'primary.main', 'secondary.main', 'error.main', 'warning.main', 'info.main', 'success.main'] as const;

function LabeledField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>{label}</Typography>
      {children}
    </Box>
  );
}

const selectSx = { px: 1, py: 0.5, borderRadius: 1, border: '1px solid', borderColor: 'divider', fontFamily: 'inherit', fontSize: '0.85rem', bgcolor: 'background.paper' };
const inputSx = { px: 1, py: 0.5, borderRadius: 1, border: '1px solid', borderColor: 'divider', fontFamily: 'inherit', fontSize: '0.85rem' };

// Shown only while a node is selected (click a node in the canvas).
// Controls are type-aware -- only the props a node's own resolver actually
// reads are offered, matched against Typography.resolver.tsx / Button.
// resolver.tsx / Box.resolver.tsx directly, not a generic guess: text
// (Typography/Button, whichever carry a string `children`), variant + color
// (Typography/Button), a real link via href/external (Typography/Button --
// both resolvers render a real anchor for this, not a fake affordance), and
// spacing via props.sx (Box, per that resolver's own "gap, p, m, display,
// etc." passthrough note).
export function NodeEditorPanel({
  node,
  canMoveUp,
  canMoveDown,
  onChangeProp,
  onChangeSx,
  onMoveUp,
  onMoveDown,
  onDelete,
}: {
  node: GuiSpecNode;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onChangeProp: (key: string, value: unknown) => void;
  onChangeSx: (key: string, value: unknown) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
}) {
  const type = (node as any)?.type as string | undefined;
  const props = ((node as any)?.props ?? {}) as Record<string, any>;
  const sx = (props.sx ?? {}) as Record<string, any>;
  const text = typeof props.children === 'string' ? props.children : null;
  const isTypography = type === 'Typography';
  const isButton = type === 'Button';
  const isBox = type === 'Box';
  const variantOptions = isTypography ? TYPOGRAPHY_VARIANTS : isButton ? BUTTON_VARIANTS : null;
  const colorOptions = isTypography ? TYPOGRAPHY_COLORS : isButton ? BUTTON_COLORS : null;

  return (
    <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1.25, borderTop: '1px solid', borderColor: 'divider' }}>
      <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase' }}>
        Edit {type}
      </Typography>
      {text !== null && (
        <LabeledField label="Text">
          <Box component="textarea" value={text} onChange={(e: any) => onChangeProp('children', e.target.value)} rows={3}
            sx={{ ...inputSx, resize: 'vertical' }} />
        </LabeledField>
      )}
      {variantOptions && (
        <LabeledField label="Variant">
          <Box component="select" value={props.variant ?? ''} onChange={(e: any) => onChangeProp('variant', e.target.value || undefined)} sx={selectSx}>
            <option value="">(default)</option>
            {variantOptions.map((v) => <option key={v} value={v}>{v}</option>)}
          </Box>
        </LabeledField>
      )}
      {colorOptions && (
        <LabeledField label="Color">
          <Box component="select" value={props.color ?? ''} onChange={(e: any) => onChangeProp('color', e.target.value || undefined)} sx={selectSx}>
            <option value="">(default)</option>
            {colorOptions.map((c) => <option key={c} value={c}>{c}</option>)}
          </Box>
        </LabeledField>
      )}
      {(isTypography || isButton) && (
        <>
          <LabeledField label="Link (href)">
            <Box component="input" type="url" placeholder="https://…" value={props.href ?? ''}
              onChange={(e: any) => onChangeProp('href', e.target.value || undefined)} sx={inputSx} />
          </LabeledField>
          <Box component="label" sx={{ display: 'flex', alignItems: 'center', gap: 0.75, fontSize: '0.8rem', color: 'text.secondary' }}>
            <Box component="input" type="checkbox" checked={Boolean(props.external)}
              onChange={(e: any) => onChangeProp('external', e.target.checked || undefined)} />
            Open in a new tab (external link)
          </Box>
        </>
      )}
      {isBox && (
        <>
          <LabeledField label="Padding (theme spacing units)">
            <Box component="input" type="number" min={0} placeholder="0" value={sx.p ?? ''}
              onChange={(e: any) => onChangeSx('p', e.target.value === '' ? undefined : Number(e.target.value))} sx={inputSx} />
          </LabeledField>
          <LabeledField label="Gap between children (theme spacing units)">
            <Box component="input" type="number" min={0} placeholder="0" value={sx.gap ?? ''}
              onChange={(e: any) => onChangeSx('gap', e.target.value === '' ? undefined : Number(e.target.value))} sx={inputSx} />
          </LabeledField>
        </>
      )}
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Box component="button" type="button" onClick={onMoveUp} disabled={!canMoveUp}
          sx={{ flex: 1, px: 1, py: 0.5, borderRadius: 1, border: '1px solid', borderColor: 'divider', bgcolor: 'transparent', cursor: canMoveUp ? 'pointer' : 'default', opacity: canMoveUp ? 1 : 0.4 }}>
          ↑ Move up
        </Box>
        <Box component="button" type="button" onClick={onMoveDown} disabled={!canMoveDown}
          sx={{ flex: 1, px: 1, py: 0.5, borderRadius: 1, border: '1px solid', borderColor: 'divider', bgcolor: 'transparent', cursor: canMoveDown ? 'pointer' : 'default', opacity: canMoveDown ? 1 : 0.4 }}>
          ↓ Move down
        </Box>
      </Box>
      <Box component="button" type="button" onClick={onDelete}
        sx={{ px: 1, py: 0.5, borderRadius: 1, border: '1px solid', borderColor: 'error.main', color: 'error.main', bgcolor: 'transparent', cursor: 'pointer' }}>
        Delete
      </Box>
    </Box>
  );
}

export type PageViewHandle = {
  canEdit: boolean;
  leftBarElements: Array<{ type: 'action'; props: { element: React.ReactNode } }>;
  content: GuiSpecNode;
  registry: Record<string, any>;
  status: string;
  dirty: boolean;
};

// The core page-as-spec-in-.me view: reads apps.<appId>.pages.<pageId>,
// renders it via GUI's own renderNode()/GuiRegistry, and — only for an
// identity the backend actually authorizes (appAuthorization.ts; this
// component only ever *reflects* that, it never grants it) — turns on
// insert/select/edit/reorder/save tools. `signedOutHeader` is the one
// caller-supplied slot: what to show a not-yet-authenticated visitor above
// the (always-visible) page content — pageEditor.main.tsx supplies its own
// minimal username/password form, the Cleaker-landing composition supplies
// the real MeLauncher bubble instead. Neither is "another identity system"
// — both end up calling the exact same SeedSessionProvider underneath.
export function usePageView({
  endpoint,
  rootNamespace,
  appId,
  pageId,
  signedOutHeader,
}: {
  endpoint: string;
  rootNamespace: string;
  appId: string;
  pageId: string;
  signedOutHeader: React.ReactNode;
}): PageViewHandle {
  const seed = useSeedSession();
  const session = seed.session as Session;
  const authenticated = (seed as any).authenticated as boolean;

  const PAGE_PATH = pagePath(appId, pageId);
  const ADMINS_PATH = adminsPath(appId);
  const GRANTS_PATH = grantsPath(appId);

  const [appRecord, setAppRecord] = React.useState<AppRecord | null>(null);
  const [namespaceOwnership, setNamespaceOwnership] = React.useState<{ claimed: boolean; isOwner: boolean } | null>(null);
  const [page, setPage] = React.useState<GuiSpecNode | null>(null);
  const [dirty, setDirty] = React.useState(false);
  const [status, setStatus] = React.useState('loading…');
  const [selectedIndex, setSelectedIndex] = React.useState<number | null>(null);

  const identityHash = authenticated ? ((session as any)?.identityHash as string) : null;

  const loadAppRecord = React.useCallback(async () => {
    const [admins, grants] = await Promise.all([nrpRead(endpoint, rootNamespace, ADMINS_PATH), nrpRead(endpoint, rootNamespace, GRANTS_PATH)]);
    setAppRecord({
      admins: (admins.value as Record<string, true>) ?? {},
      grants: (grants.value as Record<string, string[]>) ?? {},
    });
  }, [endpoint, rootNamespace, ADMINS_PATH, GRANTS_PATH]);

  const loadNamespaceOwnership = React.useCallback(async () => {
    if (!identityHash) { setNamespaceOwnership(null); return; }
    setNamespaceOwnership(await checkNamespaceOwner(endpoint, rootNamespace, identityHash));
  }, [endpoint, rootNamespace, identityHash]);

  const loadPage = React.useCallback(async () => {
    const existing = await nrpRead(endpoint, rootNamespace, PAGE_PATH);
    setPage(existing.found && existing.value ? (existing.value as GuiSpecNode) : EMPTY_PAGE_SPEC);
    setStatus('loaded');
  }, [endpoint, rootNamespace, PAGE_PATH]);

  React.useEffect(() => { loadAppRecord(); loadNamespaceOwnership(); loadPage(); }, [loadAppRecord, loadNamespaceOwnership, loadPage]);

  const canEdit = !!(
    identityHash && namespaceOwnership && (
      namespaceOwnership.isOwner ||
      appRecord?.admins?.[identityHash] === true ||
      (appRecord?.grants?.[identityHash] || []).includes('pages:write')
    )
  );

  function handleInsert(type: string) {
    const entry = (GuiRegistry as any)[type];
    const demoSpec = entry?.meta?.demoSpec ?? { type, props: {} };
    const child = withEditablePlaceholder(demoSpec);
    setPage((p) => (p ? insertNode(p, child) : p));
    setDirty(true);
  }

  function handleDeleteSelected() {
    if (selectedIndex === null || !page) return;
    setPage((p) => (p ? removeNodeAt(p, selectedIndex) : p));
    setSelectedIndex(null);
    setDirty(true);
  }

  function handleChangeSelectedProp(key: string, value: unknown) {
    if (selectedIndex === null) return;
    setPage((p) => (p ? updateNodePropAt(p, selectedIndex, key, value) : p));
    setDirty(true);
  }

  function handleChangeSelectedSx(key: string, value: unknown) {
    if (selectedIndex === null) return;
    setPage((p) => (p ? updateNodeSxAt(p, selectedIndex, key, value) : p));
    setDirty(true);
  }

  function handleMoveSelected(direction: -1 | 1) {
    if (selectedIndex === null || !page) return;
    const children = Array.isArray((page as any).children) ? (page as any).children : [];
    const target = selectedIndex + direction;
    if (target < 0 || target >= children.length) return;
    setPage((p) => (p ? moveNodeAt(p, selectedIndex, direction) : p));
    setSelectedIndex(target);
    setDirty(true);
  }

  async function handleSave() {
    if (!page || !session) return;
    setStatus('saving (real signed commit write)…');
    const res = await commit(endpoint, session, [{ namespace: rootNamespace, path: PAGE_PATH, data: page }]);
    if (!res.ok) { setStatus(`save rejected: ${res.error} ${res.detail || ''}`); return; }
    setDirty(false);
    setStatus('saved');
  }

  const pageChildren = Array.isArray((page as any)?.children) ? (page as any).children : [];
  const childCount = pageChildren.length;
  const selectedNode: GuiSpecNode | null = selectedIndex !== null ? pageChildren[selectedIndex] ?? null : null;

  const leftBarElements: PageViewHandle['leftBarElements'] = canEdit
    ? [
        { type: 'action', props: { element: <CatalogPanel onInsert={handleInsert} /> } },
        ...(selectedNode
          ? [{
              type: 'action' as const,
              props: {
                element: (
                  <NodeEditorPanel
                    node={selectedNode}
                    canMoveUp={selectedIndex! > 0}
                    canMoveDown={selectedIndex! < childCount - 1}
                    onChangeProp={handleChangeSelectedProp}
                    onChangeSx={handleChangeSelectedSx}
                    onMoveUp={() => handleMoveSelected(-1)}
                    onMoveDown={() => handleMoveSelected(1)}
                    onDelete={handleDeleteSelected}
                  />
                ),
              },
            }]
          : []),
      ]
    : [];

  const content: GuiSpecNode = {
    type: 'Page',
    props: { padding: 4 },
    children: [
      !authenticated
        ? { type: 'SignedOutHeaderSlot' }
        : !canEdit && namespaceOwnership && !namespaceOwnership.claimed
        ? { type: 'OwnershipPanelSlot' }
        : !canEdit
        ? {
            type: 'Typography',
            props: { variant: 'caption', sx: { color: 'text.secondary' }, children: `${rootNamespace} is already claimed by another identity. Ask its owner for a pages:write grant on apps.${appId} to edit.` },
          }
        : {
            type: 'Box',
            props: { sx: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 } },
            children: [
              { type: 'Typography', props: { variant: 'h5', children: `Page: ${pageId} (${childCount} node${childCount === 1 ? '' : 's'})` } },
              {
                type: 'Box',
                props: { sx: { display: 'flex', gap: 1 } },
                children: [
                  { type: 'Button', props: { variant: 'contained', onClick: handleSave, disabled: !dirty, children: 'Save' } },
                ],
              },
            ],
          },
      page
        ? {
            type: 'Box',
            props: {
              sx: { border: '1px dashed', borderColor: 'divider', borderRadius: 2, p: 2, minHeight: 240 },
              onClick: canEdit
                ? (e: React.MouseEvent) => {
                    const target = (e.target as HTMLElement).closest('[data-page-child-index]');
                    const raw = target?.getAttribute('data-page-child-index');
                    setSelectedIndex(raw != null ? Number(raw) : null);
                    // Keep this editor's own notion of "selected" in sync
                    // with the shared selectionStore singleton
                    // (this.gui/devtools) -- the same store RuntimeInspector
                    // reads. Without this, clicking a node here and opening
                    // the Inspector would show two independent,
                    // uncoordinated selections.
                    const nodeId = target?.getAttribute('data-gui-node-id') ?? null;
                    selectionStore.actions.selectNode(nodeId);
                  }
                : undefined,
            },
            children: pageChildren.length
              ? pageChildren.map((child: GuiSpecNode, i: number) => ({
                  type: 'Box',
                  props: {
                    'data-page-child-index': i,
                    sx: {
                      outline: canEdit && i === selectedIndex ? '2px solid' : 'none',
                      outlineColor: 'primary.main',
                      borderRadius: 1,
                      p: 0.5,
                      contain: 'layout',
                      overflow: 'hidden',
                    },
                  },
                  children: [child],
                }))
              : [{ type: 'Typography', props: { variant: 'body2', sx: { color: 'text.disabled' }, children: canEdit ? 'Empty page — insert something from the left panel.' : 'This page is empty.' } }],
          }
        : { type: 'Typography', props: { children: status } },
    ],
  };

  const registry = {
    ...GuiRegistry,
    SignedOutHeaderSlot: { type: 'SignedOutHeaderSlot', resolve: () => signedOutHeader },
    OwnershipPanelSlot: {
      type: 'OwnershipPanelSlot',
      resolve: () => (session ? (
        <OwnershipPanel
          endpoint={endpoint}
          rootNamespace={rootNamespace}
          appId={appId}
          session={session}
          onChanged={() => { loadNamespaceOwnership(); loadAppRecord(); }}
        />
      ) : null),
    },
  };

  return { canEdit, leftBarElements, content, registry, status, dirty };
}

export { renderNode, GuiRegistry, selectionStore };
