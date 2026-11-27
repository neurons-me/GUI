# Connect with Facebook (this.gui)

The button, the PKCE window, and the Keys card live in this package. The exchange server and the official `keys.namespace.meta.app` path are documented in netget: [Connect with Facebook](../../../modules/netget/Typescript/docs/facebook-connect.md).

## Where the namespace App ID is stored in the GUI

The Keys tree always offers a card for `namespace.meta.app` (`NAMESPACE_META_APP` in `src/gui/All.This/Cleaker/Keys/keyVisibility.ts`). Under `keys`, that is `keys.namespace.meta.app`. Fields: `id`, `secret`, `redirect`.

If you type an App ID there, it is sealed in **this browser's** encrypted keys vault (`serviceKeyVault.ts`: `localStorage`, PBKDF2 + AES-256-GCM via `localIdentityVault`, a per-service data key, AAD bound to namespace and service). It does not go to the gateway, and the connect flow does not read it.

The button gets the public App ID from `GET /oauth/facebook/app` on the same origin (`useFacebookConnect.ts`, `facebookConnect.ts`). The App Secret never enters that module. A user-level `keys.meta.app` group may still exist from earlier saves; Connect no longer depends on it. After a successful connect, Page and Instagram references are sealed under `keys.meta.facebook.<page>` (and related paths) in the same vault.

Until the netget routes are mounted and the VM is configured as in that document, the published button can appear and then fail.

Do not log, print, or commit the App Secret. Secrets in the Keys UI are shown only as dots.
