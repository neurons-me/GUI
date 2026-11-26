// The identity window (agent.main.ts / agent.html): the same chrome as
// Storybook story 1 (top bar, Search, left bar, Theme) and the person's QR
// opening the Keys card (MeLoginStatus + IdentityTree). Search filters that
// tree live and never writes into it. Values are dots and are revealed only
// here, under the passphrase; nothing is sent anywhere. `keys.netget*` is not
// shown. Typing into a field changes nothing in storage until it is saved.
// The QR carries only the public path.
import * as React from 'react';
import { createRoot } from 'react-dom/client';
import Theme from '@/gui/Theme/Theme';
import Typography from '@/gui/Atoms/Typography/Typography';
import IdentityTree from '@/gui/All.This/Cleaker/IdentityTree';
import MeLoginStatus from '@/gui/All.This/Cleaker/MeLoginStatus';
import Layout from '@/gui/Layout/Layout';
import SearchField from '@/gui/Molecules/SearchField/SearchField';
import ThemeLauncher from '@/gui/Theme/Launcher/ThemeLauncher';
import { RouterProvider } from '@/Router/Router';
import { SelectionProvider } from '@/runtime/selection';
import { RuntimeInspector } from '@/runtime/inspector';
import { QrTreeSearchProvider, useQrTreeSearch } from '@/gui/All.This/Cleaker/qrTreeSearch';
import CornerMark, { CornerMarkHost } from '@/gui/Layout/Position/CornerMark';
import { BarBrandCell, FloatingMark, QrBadge, marksInBars } from '@/gui/Layout/Position/Position';
import { placeMarks, type MarkCorner, type MarkSlot } from '@/gui/Layout/Position/placeMarks';
import { readQrMePosition, writeQrMePosition } from '@/gui/Layout/Position/qrMePosition';
import { positionQrValue } from '@/gui/All.This/Cleaker/Corner/cleakerCorner';
import { hideKeysInTree } from '@/gui/All.This/Cleaker/Keys/keyVisibility';
import { useFacebookConnect } from '@/gui/All.This/Cleaker/Keys/useFacebookConnect';

/** `https://<name>.cleaker.me/` + the open branch → `…/keys/meta/user`. Public path only, never a value. */
const withQrPath = (base: string, segments: string[]) =>
  `${base.replace(/\/+$/, '')}${segments.length ? `/${segments.map(encodeURIComponent).join('/')}` : ''}`;

function KeysTree({
  namespace, corner, slot, onMoveTo, open, onOpenChange,
}: {
  namespace: string;
  corner: MarkCorner;
  slot: MarkSlot;
  onMoveTo: (next: MarkCorner) => void;
  open: boolean;
  onOpenChange: (next: boolean) => void;
}) {
  const [path, setPath] = React.useState<string[]>([]);
  const treeSearch = useQrTreeSearch();
  const qrBase = React.useMemo(() => positionQrValue(namespace, ''), [namespace]);
  const qrValue = withQrPath(qrBase, path);
  const username = namespace.split('.')[0] || namespace;
  const facebook = useFacebookConnect(namespace);

  const identityTree = (
    <IdentityTree
      nodeId="cleaker.keys"
      username={username}
      namespace={namespace}
      onNavigate={() => { /* the window shows keys only */ }}
      access="edit"
      hide={(rel) => hideKeysInTree(rel, false)}
      onPathChange={setPath}
      initialOpen
      filterQuery={treeSearch?.query}
      facebookConnect={facebook.facebookConnect}
    />
  );

  return (
    <CornerMark
      corner={corner}
      onMoveTo={onMoveTo}
      slot={slot}
      open={open}
      onOpenChange={(next) => { onOpenChange(next); if (!next) setPath([]); }}
      showNamespaceForm={false}
      fullPosition={`${namespace} @ ${window.location.host}`}
      layout={{ address: namespace }}
      nodeId="GUI.window.layout.marks.identity.menu"
      onSignOut={() => {}}
      trigger={(
        <BarBrandCell
          component="button"
          type="button"
          title="your .me"
          data-gui-node-id="GUI.window.layout.marks.identity"
          sx={slot === 'left.brand' ? undefined : { width: 48, height: 48, minWidth: 48, flex: 'none' }}
        >
          <QrBadge value={qrValue} status="confirmed" clickFlip={false} hoverFlip={false} cursor="pointer" />
        </BarBrandCell>
      )}
    >
      <MeLoginStatus
        nodeId="GUI.window.layout.marks.identity.menu"
        authenticated
        tree={identityTree}
        qr={{
          value: qrValue,
          username,
          status: 'confirmed',
          statusLabel: 'Connected',
          perimeterLabel: withQrPath(namespace, path),
          perimeterRootLabel: namespace.includes('.') ? namespace.slice(namespace.indexOf('.') + 1) : namespace,
        }}
        onNavigate={() => {}}
        onLogout={() => {}}
      />
      {(facebook.facebookConnect?.message || facebook.pagesNotice) && (
        <Typography data-agent="facebook-connect-status" variant="body2" sx={{ mt: 1.5, px: 0.5, color: 'text.secondary' }}>
          {facebook.facebookConnect?.message || facebook.pagesNotice}
        </Typography>
      )}
    </CornerMark>
  );
}

function AgentTopSearch() {
  const treeSearch = useQrTreeSearch();
  const matches = treeSearch?.matches ?? [];
  return (
    <SearchField
      query={treeSearch?.query ?? ''}
      onQueryChange={(value) => {
        treeSearch?.setQuery(value);
        if (value.trim()) treeSearch?.requestOpen();
      }}
      results={matches.map((hit) => ({ id: hit.id, label: hit.label, route: hit.to }))}
      onSelectResult={(result) => {
        const hit = matches.find((item) => item.id === result.id);
        if (!hit) return;
        if (hit.id === 'keys' || hit.kind !== 'entry') treeSearch?.reveal(hit.path);
      }}
      placeholder="Search"
      ariaLabel="Search"
      onExpandedChange={(expanded) => {
        if (expanded) treeSearch?.requestOpen();
        if (!expanded) treeSearch?.setQuery('');
      }}
      maxResults={8}
      resultsMode="none"
      data-gui-node-id="GUI.window.layout.bars.top.search"
    />
  );
}

function AgentShell({ namespace }: { namespace: string }) {
  const [corner, setCorner] = React.useState<MarkCorner>(() => readQrMePosition());
  const [open, setOpen] = React.useState(true);
  const treeSearch = useQrTreeSearch();
  React.useEffect(() => {
    if (treeSearch && treeSearch.openTick > 0) setOpen(true);
  }, [treeSearch?.openTick]);
  const placement = placeMarks({ identity: corner, bars: { top: true, left: true }, brand: false });
  const identity = (
    <KeysTree
      namespace={namespace}
      corner={corner}
      slot={placement.identity}
      onMoveTo={(next) => { writeQrMePosition(next); setCorner(next); }}
      open={open}
      onOpenChange={setOpen}
    />
  );
  const marks = marksInBars(placement, { identity });
  return (
    <CornerMarkHost>
      <Layout
        TopBar={{
          noBorder: true,
          hideBrand: true,
          elementsLeft: marks.topStart,
          elementsRight: [
            { type: 'action', props: { element: <AgentTopSearch /> } },
            ...marks.topEnd,
          ],
        }}
        LeftBar={{
          initialView: 'rail',
          brand: marks.leftBrand,
          footerElements: [
            { type: 'action', props: { label: 'Theme', element: <ThemeLauncher />, tooltip: false } },
            ...marks.leftFooter,
          ],
        }}
      />
      {marks.float && <FloatingMark corner={marks.float.corner}>{marks.float.element}</FloatingMark>}
    </CornerMarkHost>
  );
}

export function mountKeysTree(el: HTMLElement, namespace: string): () => void {
  const root = createRoot(el);
  const prefersDark = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-color-scheme: dark)').matches;
  root.render(
    <Theme initialMode={prefersDark ? 'dark' : 'light'}>
      <RouterProvider>
        <SelectionProvider>
          <QrTreeSearchProvider>
            <AgentShell namespace={namespace} />
            <RuntimeInspector />
          </QrTreeSearchProvider>
        </SelectionProvider>
      </RouterProvider>
    </Theme>,
  );
  return () => root.unmount();
}
