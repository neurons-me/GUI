// Facebook connect binding for the identity card: starts the public OAuth
// window, reads connection status from the public index (no secrets), and
// shows the Pages notice after the other window reports success.
// The button is enabled for a signed-in person when the server has a public
// App ID. The App Secret never leaves the exchange server.
import * as React from 'react';
import { keyNoticeFromGroup, listCustomKeyGroups } from './serviceKeyVault';
import { SERVICE_KEYS_CHANGED_EVENT } from './ServiceKeysSection';
import {
  beginFacebookConnect, facebookCallbackAvailable, facebookRedirectUri,
  markFacebookSessionPopup, publicFacebookAppId, refreshFacebookAppDisplay,
} from './facebookConnect';

/** Shown on the identity card after Pages are saved on the Meta branch. */
export const FACEBOOK_PAGES_NOTICE = 'Connected. Your Pages are on the Meta branch.';

const UNAVAILABLE = 'Facebook connect is not available.';

/** meta.user saved = connected; its public expiry/status gives the notice (read from the index, no secret). */
export function facebookState(namespace: string): { connected: boolean; notice?: 'expiring' | 'dead' } {
  const user = listCustomKeyGroups(namespace).find((g) => g.name === 'meta.user');
  if (!user) return { connected: false };
  const n = keyNoticeFromGroup(user);
  return { connected: true, ...(n === 'expiring' || n === 'dead' ? { notice: n } : {}) };
}

export type FacebookConnectBinding = {
  facebookConnect: {
    enabled: boolean;
    onClick: () => void;
    message?: string;
    connected?: boolean;
    notice?: 'expiring' | 'dead';
  } | undefined;
  pagesNotice: string | null;
  dismissPagesNotice: () => void;
};

export function useFacebookConnect(namespace: string | null | undefined): FacebookConnectBinding {
  const ns = namespace && namespace.trim() ? namespace : null;
  const [appId, setAppId] = React.useState<string | null>(null);
  const [fb, setFb] = React.useState(() => (ns ? facebookState(ns) : { connected: false }));
  const [message, setMessage] = React.useState<string | undefined>();
  const [pagesNotice, setPagesNotice] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!ns) {
      setAppId(null);
      setFb({ connected: false });
      return undefined;
    }
    let cancelled = false;
    const refresh = () => {
      setFb(facebookState(ns));
      void refreshFacebookAppDisplay(ns);
    };
    void publicFacebookAppId().then((id) => { if (!cancelled) setAppId(id); });
    void refreshFacebookAppDisplay(ns);
    window.addEventListener(SERVICE_KEYS_CHANGED_EVENT, refresh);
    const onMsg = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data && event.data.type === 'me.facebook.connected') {
        refresh();
        setPagesNotice(FACEBOOK_PAGES_NOTICE);
        setMessage(undefined);
      }
    };
    window.addEventListener('message', onMsg);
    return () => {
      cancelled = true;
      window.removeEventListener(SERVICE_KEYS_CHANGED_EVENT, refresh);
      window.removeEventListener('message', onMsg);
    };
  }, [ns]);

  const onClick = React.useCallback(async () => {
    setMessage(undefined);
    setPagesNotice(null);
    if (!ns) return;
    const clientId = appId ?? await publicFacebookAppId();
    if (!clientId) {
      setMessage(UNAVAILABLE);
      return;
    }
    const available = await facebookCallbackAvailable(window.location.origin);
    const redirectUri = facebookRedirectUri(window.location.origin, available);
    const { url } = await beginFacebookConnect({ namespace: ns, clientId, redirectUri });
    markFacebookSessionPopup(true);
    const popup = window.open(url, 'facebook-connect', 'width=600,height=720');
    if (!popup) { markFacebookSessionPopup(false); window.location.assign(url); }
  }, [ns, appId]);

  if (!ns) {
    return { facebookConnect: undefined, pagesNotice: null, dismissPagesNotice: () => {} };
  }

  const enabled = Boolean(appId);
  return {
    facebookConnect: {
      enabled,
      onClick,
      connected: fb.connected,
      ...(fb.notice ? { notice: fb.notice } : {}),
      ...(message ? { message } : {}),
    },
    pagesNotice,
    dismissPagesNotice: () => setPagesNotice(null),
  };
}
