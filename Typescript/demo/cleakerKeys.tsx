// The identity window (agent.main.ts / agent.html): the person's QR opens the
// same Keys card as Storybook story 2 (CleakerQrMenu + MeLoginStatus + IdentityTree).
// Values are dots and are revealed only here, under the passphrase; nothing is
// sent anywhere. `keys.netget*` is not shown. Icons and labels come from the
// tree's public `.icon` / `.label`. Typing into a field changes nothing in
// storage until it is saved. The QR carries only the public path.
import * as React from 'react';
import { createRoot } from 'react-dom/client';
import Theme from '@/gui/Theme/Theme';
import Typography from '@/gui/Atoms/Typography/Typography';
import IdentityTree from '@/gui/All.This/Cleaker/IdentityTree';
import Box from '@/gui/Atoms/Box/Box';
import MeLoginStatus from '@/gui/All.This/Cleaker/MeLoginStatus';
import CornerMark, { CornerMarkHost } from '@/gui/Layout/Position/CornerMark';
import { BarBrandCell, QrBadge } from '@/gui/Layout/Position/Position';
import type { MarkCorner } from '@/gui/Layout/Position/placeMarks';
import { readQrMePosition, writeQrMePosition } from '@/gui/Layout/Position/qrMePosition';
import { positionQrValue } from '@/gui/All.This/Cleaker/Corner/cleakerCorner';
import { keyNoticeFromGroup, listCustomKeyGroups } from '@/gui/All.This/Cleaker/Keys/serviceKeyVault';
import { isLoginExcluded } from '@/gui/All.This/Cleaker/Keys/keyVisibility';
import { SERVICE_KEYS_CHANGED_EVENT } from '@/gui/All.This/Cleaker/Keys/ServiceKeysSection';
import {
  beginFacebookConnect, facebookCallbackAvailable, facebookRedirectUri,
  hasFacebookAppCredentials, markFacebookSessionPopup, publicFacebookAppId, refreshFacebookAppDisplay,
} from '@/gui/All.This/Cleaker/Keys/facebookConnect';

/** meta.user saved = connected; its public expiry/status gives the notice (read from the index, no secret). */
function facebookState(namespace: string): { connected: boolean; notice?: 'expiring' | 'dead' } {
  const user = listCustomKeyGroups(namespace).find((g) => g.name === 'meta.user');
  if (!user) return { connected: false };
  const n = keyNoticeFromGroup(user);
  return { connected: true, ...(n === 'expiring' || n === 'dead' ? { notice: n } : {}) };
}

/** `https://<name>.cleaker.me/` + the open branch → `…/keys/meta/user`. Public path only, never a value. */
const withQrPath = (base: string, segments: string[]) =>
  `${base.replace(/\/+$/, '')}${segments.length ? `/${segments.map(encodeURIComponent).join('/')}` : ''}`;

const CORNER_FIX: Record<MarkCorner, React.CSSProperties> = {
  'top-left': { top: 0, left: 0 },
  'top-right': { top: 0, right: 0 },
  'bottom-left': { bottom: 0, left: 0 },
  'bottom-right': { bottom: 0, right: 0 },
};

function KeysTree({ namespace }: { namespace: string }) {
  const [enabled, setEnabled] = React.useState(() => hasFacebookAppCredentials(namespace));
  const [fb, setFb] = React.useState(() => facebookState(namespace));
  const [path, setPath] = React.useState<string[]>([]);
  const [open, setOpen] = React.useState(false);
  const [corner, setCorner] = React.useState<MarkCorner>(() => readQrMePosition());
  const qrBase = React.useMemo(() => positionQrValue(namespace, ''), [namespace]);
  const qrValue = withQrPath(qrBase, path);
  const [message, setMessage] = React.useState<string | undefined>();
  const username = namespace.split('.')[0] || namespace;

  React.useEffect(() => {
    const refresh = () => { setEnabled(hasFacebookAppCredentials(namespace)); setFb(facebookState(namespace)); void refreshFacebookAppDisplay(namespace); };
    void refreshFacebookAppDisplay(namespace);
    window.addEventListener(SERVICE_KEYS_CHANGED_EVENT, refresh);
    const onMsg = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data && event.data.type === 'me.facebook.connected') refresh();
    };
    window.addEventListener('message', onMsg);
    return () => {
      window.removeEventListener(SERVICE_KEYS_CHANGED_EVENT, refresh);
      window.removeEventListener('message', onMsg);
    };
  }, [namespace]);

  const onClick = React.useCallback(async () => {
    setMessage(undefined);
    if (!hasFacebookAppCredentials(namespace)) {
      setMessage('Add your App ID and App Secret under .keys.meta.app first.');
      return;
    }
    const clientId = await publicFacebookAppId(namespace);
    if (!clientId) {
      setMessage('Add your App ID and App Secret under .keys.meta.app first.');
      return;
    }
    const available = await facebookCallbackAvailable(window.location.origin);
    const redirectUri = facebookRedirectUri(window.location.origin, available);
    const { url } = await beginFacebookConnect({ namespace, clientId, redirectUri });
    markFacebookSessionPopup(true);
    const popup = window.open(url, 'facebook-connect', 'width=600,height=720');
    if (!popup) { markFacebookSessionPopup(false); window.location.assign(url); }
  }, [namespace]);

  const identityTree = (
    <IdentityTree
      nodeId="cleaker.keys"
      username={username}
      namespace={namespace}
      onNavigate={() => { /* the agent shows keys only */ }}
      access="edit"
      hide={isLoginExcluded}
      onPathChange={setPath}
      facebookConnect={{ enabled, onClick, connected: fb.connected, ...(fb.notice ? { notice: fb.notice } : {}) }}
    />
  );

  return (
    <CornerMarkHost>
      <Box
        sx={{
          position: 'fixed',
          zIndex: 5,
          width: 48,
          height: 48,
          ...CORNER_FIX[corner],
        }}
      >
        <CornerMark
          corner={corner}
          onMoveTo={(next) => { writeQrMePosition(next); setCorner(next); }}
          slot={`float:${corner}`}
          open={open}
          onOpenChange={(next) => { setOpen(next); if (!next) setPath([]); }}
          showNamespaceForm={false}
          fullPosition={`${namespace} @ ${window.location.host}`}
          layout={{ address: namespace }}
          nodeId="GUI.window.layout.marks.identity.menu"
          trigger={(
            <BarBrandCell
              component="button"
              type="button"
              title="your .me"
              data-gui-node-id="GUI.window.layout.marks.identity"
              sx={{ width: 48, height: 48, minWidth: 48, flex: 'none' }}
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
            hideSignOut
          />
          {message && (
            <Typography data-agent="facebook-connect-status" variant="body2" sx={{ mt: 1.5, px: 0.5, color: 'text.secondary' }}>
              {message}
            </Typography>
          )}
        </CornerMark>
      </Box>
    </CornerMarkHost>
  );
}

export function mountKeysTree(el: HTMLElement, namespace: string): () => void {
  const root = createRoot(el);
  const prefersDark = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-color-scheme: dark)').matches;
  root.render(
    <Theme initialMode={prefersDark ? 'dark' : 'light'}>
      <KeysTree namespace={namespace} />
    </Theme>,
  );
  return () => root.unmount();
}
