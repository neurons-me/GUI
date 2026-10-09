// Cleaker — the one public entry point for a complete, namespace-scoped identity surface:
//
//   <Me namespace="cleaker.me">
//     <Cleaker />
//   </Me>
//
// `<Me>` (react/Me.tsx) provides the `.me` of this part of the page; `<Cleaker>` finds it with `useOptionalMe`, reads the
// namespace that `.me` stands in, and builds the whole way into it: `SeedSessionProvider` (the real session / claim /
// open / logout machinery) around `react/session/Namespace.tsx` (the identity shell: QR, connect, sign in, register,
// recover, users, blockchain, url, keychain). There is no other way to say where it points, so no props for that.
//
//   * Four different things, never folded into each other:
//       root           cleaker.me      where the page connects (destination)
//       named          ana.cleaker.me  the handle the `.me` declares, inside that root
//       transport      where it is resolved
//       authentication whether whoever is here can act as ana: only a session says so
//     The destination is the root. The handle is presented, not dropped: it pre-fills the sign-in form, and the
//     namespace the page shows becomes the named one. It authenticates nothing.
//   * No `.me`, or a `.me` without a namespace, renders a plain message saying so; it does not guess a destination. A
//     namespace that cannot be parsed throws, it is never swapped for a default.
//   * Transport: wherever `<Me transport>` says the `.me` is reached; absent, the namespace's own address.
//   * The `.me` found here is configuration only. The session `SeedSessionProvider` opens builds its own kernel on
//     claim / open (username + password, vault unlock, phrase recovery); nothing here ever operates on, or logs in, the
//     `.me` it read the namespace from. A shared namespace is not a shared runtime, and this file does not claim it is.
//   * `SeedSessionProvider.logout()` closes further operations through that session's wrapper; it does not revoke
//     capability a reference obtained before logout might still hold elsewhere.
//
// History worth keeping: this replaced an older `Cleaker.tsx` / `CleakerComposer.tsx`. Two things only that code did were
// dropped on purpose, after reading them: the mesh-pairing QR claim flow (no network calls, no camera, an unsigned
// client-made token: it never paired anything) and the PIN access-grant mount (already failing closed before it went).
// The modules behind both have since been deleted outright.
import * as React from 'react';
import { useOptionalMe } from '@/react/useMe';
import { readMeNamespace, readMeUsername } from '@/react/meNamespace';
import { SeedSessionProvider, type ResolveSeedFromCredentials } from '@/react/session/SeedSessionProvider';
import Namespace from '@/react/session/Namespace';
import type { GuiDocument } from '@/runtime/guiDocument';
import type { LeftBarElement } from '@/gui/Layout/Sidebars/LeftBar/LeftBar.types';
import Box from '@/gui/Atoms/Box/Box';
import Typography from '@/gui/Atoms/Typography/Typography';
import { parseCleakerNamespaceExpression } from './namespaceExpression';

export type CleakerProps = {
  sx?: any;
  /** Passed straight through to `SeedSessionProvider` — see its own doc comment. */
  resolveSeedFromCredentials?: ResolveSeedFromCredentials;
  /**
   * Passed straight through to `Namespace` — its own existing content-extension contract (an app such as netget adding
   * its own pages/left-bar elements on top of the shared shell), unrelated to identity composition.
   */
  document?: GuiDocument;
  pages?: Record<string, React.ComponentType<any>>;
  footerExtras?: LeftBarElement[];
};

export default function Cleaker({ sx, resolveSeedFromCredentials, document, pages, footerExtras }: CleakerProps) {
  const found = useOptionalMe();
  const namespace = readMeNamespace(found?.me);
  // The handle only counts when the `.me` also declares the root it lives in: ana inside nothing is not a namespace.
  const username = namespace ? readMeUsername(found?.me) : '';

  // Memoized on the namespace string. Parse errors are not caught: a namespace that was given and is broken deserves a
  // real error, not a silent redirect to somewhere else.
  const namespaceConfig = React.useMemo(() => (namespace ? parseCleakerNamespaceExpression(namespace) : null), [namespace]);

  if (!namespaceConfig) {
    return (
      <Box data-gui-node-id="Cleaker.no-me" sx={{ p: 3 }}>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {found ? 'The .me above this Cleaker has no namespace.' : 'There is no .me above this Cleaker.'} Wrap it in{' '}
          <code>{'<Me namespace="…">'}</code>.
        </Typography>
      </Box>
    );
  }

  const cleakerEndpoint = namespaceConfig.transport.origin;
  const transportOrigin = found?.transport || cleakerEndpoint;

  return (
    <SeedSessionProvider
      transportOrigin={transportOrigin}
      resolveSeedFromCredentials={resolveSeedFromCredentials}
      sessionBackend="cleaker"
    >
      <Namespace
        sx={sx}
        cleakerEndpoint={cleakerEndpoint}
        netgetMonadOrigin={transportOrigin}
        username={username || undefined}
        document={document}
        pages={pages}
        footerExtras={footerExtras}
      />
    </SeedSessionProvider>
  );
}
