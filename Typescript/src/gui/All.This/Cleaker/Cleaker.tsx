// Cleaker — the one public entry point for a complete, namespace-scoped identity surface:
//
//   <Me username="sui">
//     <Cleaker namespace="cleaker.me" />
//   </Me>
//
// `<Me>` (react/Me.tsx) is the local runtime: the `.me` of this part of the page. `<Cleaker>` is a LINK from that `.me` to
// one namespace: it finds the `.me` with `useOptionalMe`, and builds the whole way into the namespace it is given:
// `SeedSessionProvider` (the real session / claim / open / logout machinery) around `react/session/Namespace.tsx` (the
// identity shell: QR, connect, sign in, register, recover, users, blockchain, url, keychain). The destination is a prop of
// the link, not of the `.me`: the same `.me` can be linked to several namespaces.
//
//   * Four different things, never folded into each other:
//       namespace      cleaker.me       where the link goes (the root)
//       named          ana.cleaker.me   the handle the `.me` declares, inside that root
//       transport      where it is resolved
//       authentication whether whoever is here can act as ana: only a session says so
//     The handle is presented, not dropped: it pre-fills the sign-in form, and the namespace the page shows becomes the
//     named one. It authenticates nothing.
//   * No `.me` above it, or no `namespace`, renders a plain message saying so; it does not guess a destination. A
//     namespace that cannot be parsed throws, it is never swapped for a default.
//   * Where it is reached (scheme and port): see `namespaceAddress`. `transport` says it when it is not obvious; with none,
//     a page served by the namespace's own host is reached where it is served, and any other namespace at the address its
//     name gives (`cleaker.me` -> https://cleaker.me).
//   * The `.me` found here is configuration only. The session `SeedSessionProvider` opens builds its own kernel on
//     claim / open (username + password, vault unlock, phrase recovery); nothing here ever operates on, or logs in, the
//     `.me` it found. A shared runtime across links is NOT built here and is not claimed: every link keeps its own kernel and
//     its own credentials. The `.me` is only the KEY under which the links of one page list the identities they hold, so
//     that one of them can be asked, explicitly ("Use my identity from another link"), to claim a name with an identity
//     another open link already holds. Registering is a different action and always creates a new identity.
//   * `SeedSessionProvider.logout()` closes further operations through that session's wrapper; it does not revoke
//     capability a reference obtained before logout might still hold elsewhere.
//
// History worth keeping: this replaced an older `Cleaker.tsx` / `CleakerComposer.tsx`. Two things only that code did were
// dropped on purpose, after reading them: the mesh-pairing QR claim flow (no network calls, no camera, an unsigned
// client-made token: it never paired anything) and the PIN access-grant mount (already failing closed before it went).
// The modules behind both have since been deleted outright.
import * as React from 'react';
import { useOptionalMe } from '@/react/useMe';
import { readMeUsername } from '@/react/meIdentity';
import { namespaceAddress } from '@/react/namespaceAddress';
import { SeedSessionProvider, type ResolveSeedFromCredentials } from '@/react/session/SeedSessionProvider';
import Namespace from '@/react/session/Namespace';
import type { GuiDocument } from '@/runtime/guiDocument';
import type { LeftBarElement } from '@/gui/Layout/Sidebars/LeftBar/LeftBar.types';
import Box from '@/gui/Atoms/Box/Box';
import Typography from '@/gui/Atoms/Typography/Typography';
import { parseCleakerNamespaceExpression } from './namespaceExpression';

export type CleakerProps = {
  sx?: any;
  /**
   * The namespace this link goes to: a name, never an address (`cleaker.me`, `localhost`; no scheme, no port).
   */
  namespace?: string;
  /**
   * Where that namespace is reached, when that is not simply where its name or this page's own host says. Netget's
   * gateway page: the namespace is the host it was served from, its monad answers behind `/apps/netget`.
   */
  transport?: string;
  /** Passed straight through to `SeedSessionProvider` — see its own doc comment. */
  resolveSeedFromCredentials?: ResolveSeedFromCredentials;
  /**
   * Passed straight through to `Namespace` — its own existing content-extension contract (an app such as netget adding
   * its own pages/left-bar elements on top of the shared shell), unrelated to identity composition.
   */
  document?: GuiDocument;
  pages?: Record<string, React.ComponentType<any>>;
  /** Left-bar item ids to leave out of the rail (icons only; the pages and routes stay). See NamespaceProps.hideBarItems. */
  hideBarItems?: string[];
  /** The semantic path the position label shows ('/' = the namespace's root). See NamespaceProps.semanticPath. */
  semanticPath?: string;
  /**
   * Where `namespace` came from. `declared` (default): the app or the gateway said which namespace this is. `address`: it
   * is only the page's own hostname, a first draft of the transport, NOT a namespace: the shell says "resolving" until the
   * service answers which namespace it serves, and signs nothing, proves nothing and claims nothing in the meantime.
   */
  namespaceSource?: 'declared' | 'address';
  footerExtras?: LeftBarElement[];
};

export default function Cleaker({ sx, namespace: namespaceProp, transport, resolveSeedFromCredentials, document, pages, footerExtras, hideBarItems, semanticPath, namespaceSource }: CleakerProps) {
  const found = useOptionalMe();
  const namespace = String(namespaceProp || '').trim();
  const username = readMeUsername(found?.me);

  // Memoized on the namespace string. Parse errors are not caught: a namespace that was given and is broken deserves a
  // real error, not a silent redirect to somewhere else.
  const namespaceConfig = React.useMemo(() => (namespace ? parseCleakerNamespaceExpression(namespace) : null), [namespace]);

  if (!found || !namespaceConfig) {
    return (
      <Box data-gui-node-id="Cleaker.no-me" sx={{ p: 3 }}>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {!found ? (
            <>There is no .me above this Cleaker. Wrap it in <code>{'<Me>'}</code>.</>
          ) : (
            <>This Cleaker has no namespace. Give it one: <code>{'<Cleaker namespace="…" />'}</code>.</>
          )}
        </Typography>
      </Box>
    );
  }

  const cleakerEndpoint = namespaceAddress({
    namespaceOrigin: namespaceConfig.transport.origin,
    transport,
    pageOrigin: typeof window !== 'undefined' ? window.location.origin : '',
  });
  const transportOrigin = transport || cleakerEndpoint;

  return (
    <SeedSessionProvider
      transportOrigin={transportOrigin}
      resolveSeedFromCredentials={resolveSeedFromCredentials}
      sessionBackend="cleaker"
      context={found.me as object | null}
    >
      <Namespace
        sx={sx}
        cleakerEndpoint={cleakerEndpoint}
        netgetMonadOrigin={transportOrigin}
        username={username || undefined}
        document={document}
        pages={pages}
        hideBarItems={hideBarItems}
        semanticPath={semanticPath}
        namespaceSource={namespaceSource}
        footerExtras={footerExtras}
      />
    </SeedSessionProvider>
  );
}
