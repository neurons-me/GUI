// keys.namespace visibility: root-only branch, netget out of login, apps never list it.
import assert from 'node:assert/strict';
import {
  hideKeysInTree,
  isKeysListExcluded,
  isLoginExcluded,
  isNamespaceOwnedKey,
  isRootNamespaceSession,
  isRootOwnerView,
  NAMESPACE_META_APP,
  NAMESPACE_META_APP_FIELDS,
} from '../src/gui/All.This/Cleaker/Keys/keyVisibility';
import { isPublicKeyField } from '../src/gui/All.This/Cleaker/Keys/serviceKeyVault';

let n = 0;
const ok = (c: unknown, m: string) => { assert.ok(c, m); n += 1; };

ok(isNamespaceOwnedKey('namespace') && isNamespaceOwnedKey('namespace.meta.app') && isNamespaceOwnedKey(NAMESPACE_META_APP), 'N1 namespace root and meta.app are owned');
ok(!isNamespaceOwnedKey('meta.app') && !isNamespaceOwnedKey('namespaced') && !isNamespaceOwnedKey('meta.namespace'), 'N2 personal meta.app is not namespace-owned');

ok(isLoginExcluded('netget') && isLoginExcluded('namespace.netget') && isLoginExcluded('namespace.netget.gw'), 'N3 netget (legacy and under namespace) is out of login');
ok(!isLoginExcluded('namespace.meta.app') && !isLoginExcluded('namespace'), 'N4 the Meta app stays visible in the root login tree');

ok(hideKeysInTree('namespace.meta.app', false) && hideKeysInTree('namespace', false), 'N5 non-root never sees keys.namespace');
ok(!hideKeysInTree('namespace.meta.app', true) && hideKeysInTree('namespace.netget', true) && hideKeysInTree('netget', true), 'N6 root sees meta.app, not netget');
ok(!hideKeysInTree('meta.instagram', false) && !hideKeysInTree('meta.app', true), 'N7 personal keys are unchanged');

ok(isKeysListExcluded('namespace.meta.app') && isKeysListExcluded('namespace.netget') && isKeysListExcluded('netget'), 'N8 apps never list namespace or netget keys');
ok(!isKeysListExcluded('meta.instagram'), 'N9 personal keys can still be listed');

ok(isRootNamespaceSession('cleaker.me', 'cleaker.me') && !isRootNamespaceSession('suign.cleaker.me', 'cleaker.me'), 'N10 signed in as the root, not as a handle');
ok(!isRootNamespaceSession('cleaker.me', null) && !isRootNamespaceSession('', 'cleaker.me'), 'N11 missing side is not root');
ok(isRootOwnerView('suign.cleaker.me', 'cleaker.me', true) && !isRootOwnerView('suign.cleaker.me', 'cleaker.me', false), 'N12 handle plus root vault is a root-owner view');
ok(!isRootOwnerView('suign.cleaker.me', '', true), 'N13 no root label, no root view, even with a vault flag');

ok(NAMESPACE_META_APP_FIELDS.includes('id') && NAMESPACE_META_APP_FIELDS.includes('secret') && NAMESPACE_META_APP_FIELDS.includes('redirect'), 'N14 Meta app fields');
ok(isPublicKeyField('id') && isPublicKeyField('redirect') && !isPublicKeyField('secret'), 'N15 secret is never a public field; id and redirect are');

console.log(`namespaceKeys: ${n} checks ok`);
